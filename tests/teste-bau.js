/* Bau de madeira: so se fabrica com madeira (6), monta na frente do jogador, guarda 15 tipos de item, abre pelo botao de interagir,
   fica salvo, so desmonta vazio, sincroniza no multiplayer e nao existe em nenhuma tabela de loot.
   Uso: node tests/teste-bau.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];
  const o={};const rec=RECIPES.find(q=>q.out==='stash');
  o.recipe=!!rec&&JSON.stringify(rec.need)==='{"wood":6}';
  o.inLoot=Object.values(LOOT).some(t=>'stash' in t)||'stash' in OUT_LOOT;
  // lugar livre
  trees.length=0;rocks.length=0;rebuildSolidGrid();P.inside=null;P.inv=[{t:'wood',n:5}];P.x=1700;P.y=1700;P.face=0;
  o.cantCraft5=!canCraft(rec);craft(rec);o.noneBuilt=stashList().length===0&&countInv('wood')===5;
  P.inv=[{t:'wood',n:8},{t:'stone',n:3}];craft(rec);
  o.built=stashList().length===1;o.woodLeft=countInv('wood');
  const s=stashList()[0];o.front=Math.hypot(s.x-P.x,s.y-P.y)<=50;o.solid=querySolidNear(s.x,s.y,8).length>0;
  // botao de interagir
  P.x=s.x-20;P.y=s.y+2;P.face=0;state='play';
  const tg=pickTarget();o.target=tg&&tg.k;update(.05);o.btn=(document.getElementById('pick')||{}).dataset&&document.getElementById('pick').dataset.st;
  pickup();o.opened=state==='craft'&&!document.getElementById('stashscr').classList.contains('hide');
  o.gridSlots=document.querySelectorAll('#stashgrid .islot').length;
  {const q=id=>{const e=document.getElementById(id).getBoundingClientRect();return [Math.round(e.top),Math.round(e.width),Math.round(e.height)];};const h=[...document.querySelectorAll('.stash-col .inv-top')].map(e=>Math.round(e.getBoundingClientRect().top));
   o.rects=[q('stashgrid'),q('stashpack'),h];o.aligned=JSON.stringify(q('stashgrid'))===JSON.stringify(q('stashpack'))&&h[0]===h[1]&&document.querySelectorAll('#stashpack .islot').length===15;}
  // guardar
  P.pack=true;P.inv=[];['wood','stone','cloth','food','water','bandage','medkit','seed_corn','apple','berry','tomato','carrot','potato','pistol'].forEach((t,i)=>{if(ITEMS[t])P.inv.push({t:t,n:i+1});});
  buildInv();render_open();
  function render_open(){closeStash();state='play';openStash(s);craftReadyAt=0;}
  const total=P.inv.length;
  for(let i=0;i<total;i++)stashDeposit(0);
  o.stored=s.s.length;o.invAfter=P.inv.length;
  // limite de 15 tipos diferentes
  const extra=Object.keys(ITEMS).filter(k=>!s.s.some(q=>q.t===k)).slice(0,3);
  P.inv=extra.map(t=>({t:t,n:1}));
  for(let i=0;i<3;i++)stashDeposit(0);
  const kinds=Object.keys(ITEMS);o.cap=s.s.length;o.cap15=s.s.length<=15;
  // empilhar no mesmo tipo
  const t0=s.s[0].t,n0=s.s[0].n;P.inv=[{t:t0,n:5}];stashDeposit(0);o.stack=s.s[0].n===n0+5&&s.s.length===o.cap;
  // pegar de volta
  P.inv=[];P.pack=false;const first=s.s[0];stashWithdraw(0);o.took=P.inv.length===1&&P.inv[0].t===first.t;
  // mochila cheia: nao pega tipo novo
  P.inv=[];for(let i=0;i<MAX_SLOTS;i++)P.inv.push({t:Object.keys(ITEMS)[i],n:1});
  const before=s.s.length;const need=s.s.find(q=>!P.inv.some(p=>p.t===q.t));const ix=s.s.indexOf(need);stashWithdraw(ix);o.fullBlocked=s.s.length===before;
  // salvar e continuar
  P.inv=[];state='play';closeStash();
  s.s=[{t:'wood',n:7},{t:'food',n:2}];
  o.saved=saveGame();const d=readSave0(1);o.inSave=!!d&&Array.isArray(d.bx)&&d.bx.length===1;
  continueGame(1);o.afterLoad=stashList().length===1&&stashList()[0].s.length===2&&stashList()[0].s[0].n===7;
  // desmontar: so vazio
  const s2=stashList()[0];P.x=s2.x-20;P.y=s2.y;openStash(s2);craftReadyAt=0;
  const w0=countInv('wood');stashDismantle();o.refusedFull=stashList().length===1;
  s2.s=[];stashDismantle();o.dismantled=stashList().length===0&&countInv('wood')===w0+4&&state==='play';
  return o;});
console.log(JSON.stringify(r));
ok(r.recipe,'receita: so madeira (6)');ok(!r.inLoot,'nao aparece em nenhuma tabela de loot');
ok(r.cantCraft5&&r.noneBuilt,'com 5 madeiras nao fabrica e nao gasta nada');
ok(r.built&&r.woodLeft===2&&r.front&&r.solid,'com 8 madeiras fabrica: gasta 6, monta na frente e bloqueia a passagem');
ok(r.target==='stash'&&r.btn==='ABRIR','o botao de interagir mostra ABRIR perto do bau');
ok(r.opened&&r.gridSlots===15,'abre a tela do bau com 15 espacos');
ok(r.aligned,'as molduras do bau e da mochila tem o mesmo tamanho e ficam alinhadas (topo e altura iguais, 15 casas cada) ('+JSON.stringify(r.rects)+')');
ok(r.stored>=13&&r.invAfter===0,'guardar: itens da mochila vao para o bau ('+r.stored+' tipos)');
ok(r.cap15&&r.cap===15,'o bau nunca passa de 15 espacos');
ok(r.stack,'mesmo tipo empilha no mesmo espaco');
ok(r.took,'pegar devolve o item para a mochila');ok(r.fullBlocked,'mochila cheia nao recebe tipo novo (nada se perde)');
ok(r.saved&&r.inSave&&r.afterLoad,'o bau e o conteudo ficam no save e voltam ao continuar');
ok(r.refusedFull&&r.dismantled,'so desmonta vazio, e devolve 4 madeiras');

/* multiplayer: eventos entre host e convidado */
const m=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
  const o={};
  handleEvt('stashAdd',{x:900,y:900});o.add=stashList().length===1;
  handleEvt('stashSet',{x:900,y:900,s:[['wood',4],['food',2],['naoexiste',9],['wood',3]]});o.set=JSON.stringify(stashList()[0].s)==='[{"t":"wood","n":4},{"t":"food","n":2}]';
  handleEvt('stashSet',{x:1200,y:1200,s:[['stone',1]]});o.createdOnSet=stashList().length===2;
  const snap=packSnapshot();o.snap=Array.isArray(snap.bx)&&snap.bx.length===2;
  handleEvt('stashDel',{x:900,y:900});o.del=stashList().length===1;
  stashLoad([]);stashSnapshot(snap.bx);o.fromSnap=stashList().length===2&&stashList().some(q=>q.s.length===2);
  o.whitelist=NET_OK_EVT.has('stashSet')&&NET_OK_EVT.has('stashAdd')&&NET_OK_EVT.has('stashDel');
  handleEvt('stashSet',{x:'a',y:null,s:5});o.junk=stashList().length===2;
  return o;});
console.log(JSON.stringify(m));
ok(m.add&&m.set&&m.createdOnSet,'eventos stashAdd/stashSet criam e atualizam (itens invalidos sao ignorados)');
ok(m.snap&&m.fromSnap&&m.del,'snapshot leva os baus ao convidado; stashDel remove');
ok(m.whitelist&&m.junk,'eventos liberados na rede e lixo e ignorado');
/* arrastar com o mouse de verdade: mochila -> bau, bau -> mochila, reordenar nos dois lados */
await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];
  trees.length=0;rocks.length=0;rebuildSolidGrid();P.inside=null;P.pack=true;P.x=1700;P.y=1700;P.face=0;
  P.inv=[{t:'wood',n:8}];craft(RECIPES.find(q=>q.out==='stash'));
  P.inv=[{t:'stone',n:3},{t:'cloth',n:2},{t:'food',n:1}];const s=stashList()[0];s.s=[{t:'water',n:2},{t:'bandage',n:1}];
  P.x=s.x-20;P.y=s.y;state='play';openStash(s);craftReadyAt=0;buildInv();
});
const cell=async(side,i)=>{const bb=await pg.locator('.islot[data-side="'+side+'"][data-i="'+i+'"]').boundingBox();return {x:bb.x+bb.width/2,y:bb.y+bb.height/2};};
const drag=async(a,bq)=>{const p=await cell(a[0],a[1]),q=await cell(bq[0],bq[1]);await pg.mouse.move(p.x,p.y);await pg.mouse.down();await pg.mouse.move((p.x+q.x)/2,(p.y+q.y)/2,{steps:4});await pg.mouse.move(q.x,q.y,{steps:4});await pg.mouse.up();await pg.waitForTimeout(80);};
const st=()=>pg.evaluate(()=>({inv:P.inv.map(q=>q.t).join(','),bau:stashList()[0].s.map(q=>q.t).join(',')}));
await drag(['p',0],['c',9]);let d1=await st();   // pedra da mochila para uma casa vazia do bau
ok(d1.inv==='cloth,food'&&d1.bau==='water,bandage,stone','arrastar da mochila para o bau guarda o item ('+JSON.stringify(d1)+')');
await drag(['c',0],['p',7]);let d2=await st();   // agua do bau para uma casa vazia da mochila
ok(d2.inv==='cloth,food,water'&&d2.bau==='bandage,stone','arrastar do bau para a mochila pega o item ('+JSON.stringify(d2)+')');
await drag(['c',0],['c',1]);let d3=await st();    // reordenar dentro do bau (troca)
ok(d3.bau==='stone,bandage','arrastar dentro do bau troca de lugar ('+d3.bau+')');
await drag(['p',0],['p',2]);let d4=await st();    // reordenar dentro da mochila
ok(d4.inv==='water,food,cloth','arrastar dentro da mochila troca de lugar ('+d4.inv+')');
await drag(['p',0],['c',3]);await drag(['p',0],['p',0]);let d5=await st();
ok(d5.bau==='stone,bandage,water'&&d5.inv==='food,cloth','soltar em cima de si mesmo nao muda nada e o bau sincroniza ('+JSON.stringify(d5)+')');
const tap=await pg.evaluate(()=>{const before=stashList()[0].s.length;document.querySelector('#stashgrid .islot[data-i="0"]').click();return [before,stashList()[0].s.length,P.inv.length];});
ok(tap[1]===tap[0]-1,'tocar continua pegando o item do bau ('+tap+')');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
