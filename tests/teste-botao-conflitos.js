/* Conflitos do botao de interagir: item do lado de fora da porta, mochila cheia e portinha de cerca encostada num canteiro.
   Uso: node tests/teste-botao-conflitos.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';
  const o={};
  /* 1) dentro da casa, item do lado de fora da porta fechada */
  const bd=blds.find(q=>q.doors&&q.doors.length&&q.type==='house')||blds.find(q=>q.doors&&q.doors.length);
  const d=bd.doors.find(q=>q.r.w>q.r.h)||bd.doors[0];d.open=0;
  const cx=d.r.x+d.r.w/2,cy=d.r.y+d.r.h/2,horiz=d.r.w>=d.r.h;
  const side=(k)=>horiz?{x:cx,y:cy+k}:{x:cx+k,y:cy};   // k<0 dentro (para o lado do predio), k>0 fora
  const inP=side(-12),outP=side(12);
  o.sides=!!bldAt(inP.x,inP.y)&&!bldAt(outP.x,outP.y);
  items.length=0;P.inv=[{t:'water',n:1}];P.x=inP.x;P.y=inP.y;P.inside=bd;P.face=horiz?1.57:0;
  items.push({t:'wood',x:outP.x,y:outP.y});
  o.itemBlocked=nearestItem()===null;
  const t1=pickTarget();o.doorTarget=t1&&t1.k;
  // mochila cheia: continua abrindo a porta
  P.inv=[];for(let i=0;i<invCap();i++)P.inv.push({t:['water','food','stone','cloth','bandage','ammo2','seed_x'][i%7]+i,n:1});
  const t2=pickTarget();o.fullDoor=t2&&t2.k;
  /* 2) fora da casa, do lado do item, com a mochila cheia: o item nao toma o lugar da porta */
  P.inside=null;P.x=outP.x;P.y=outP.y;
  items.length=0;items.push({t:'wood',x:outP.x+(horiz?0:6),y:outP.y+(horiz?6:0)});
  const t3=pickTarget();o.fullOutside=t3&&t3.k;
  P.inv=[{t:'water',n:1}];const t4=pickTarget();o.freeOutside=t4&&t4.k;   // com espaco, o item continua ganhando
  /* 3) item que ja tem (lanterna) nao disputa com a porta */
  P.torch=true;items.length=0;items.push({t:'flashlight',x:outP.x,y:outP.y+(horiz?6:0)});P.inv=[];
  const t5=pickTarget();o.ownedItem=t5&&t5.k;P.torch=false;
  return o;});
console.log(JSON.stringify(r));
ok(r.sides,'ponto de teste: um lado dentro, outro fora da casa');
ok(r.itemBlocked,'dentro da casa nao da para pegar item que esta do lado de fora da porta');
ok(r.doorTarget==='door','o botao abre a porta mesmo com item do lado de fora');
ok(r.fullDoor==='door','mochila cheia: continua abrindo a porta');
ok(r.fullOutside==='door','fora da casa, mochila cheia: o item nao toma o lugar da porta');
ok(r.freeOutside==='item','com espaco na mochila o item ainda e pego primeiro');
ok(r.ownedItem==='door','item que ja se tem (lanterna) nao atrapalha a porta');

const g=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';
  trees.length=0;rocks.length=0;blds.length=0;items.length=0;lakes.length=0;rebuildSolidGrid();P.inside=null;
  const o={};let cx=0,cy=0;
  for(let k=0;k<3000&&!cx;k++){const x=Math.floor((400+Math.random()*(WW-800))/16),y=Math.floor((400+Math.random()*(WH-800))/16);if(!soilBad(x*16+8,y*16+8)&&!soilBad(x*16+8,(y-1)*16+8)&&!soilBad((x+1)*16+8,y*16+8)&&!soilBad((x-1)*16+8,y*16+8)){cx=x;cy=y;}}
  fenceLoad([[cx,cy,0,1,0],[cx-1,cy,0,0,0],[cx+1,cy,0,0,0]]);   // portinha (g=1) numa cerca horizontal; o canteiro fica logo abaixo dela
  plotsLoad([[cx,cy,null,0,0]]);const p=plotList()[0];
  p.c='corn';p.g=0;p.w=0;
  P.inv=[{t:'water',n:2}];P.x=cx*16+8;P.y=cy*16-6;P.face=1.57;P.r=P.r||5;
  const gates=fenceGateCands().length;o.gates=gates;
  const t=pickTarget();o.t1=t&&t.k;o.act=t&&t.act;
  p.w=9999;const t2=pickTarget();o.t2=t2&&t2.k;   // ja regado: volta a ser a portinha
  return o;});
console.log(JSON.stringify(g));
ok(g.gates>=1,'ha portinha de cerca ao alcance');
ok(g.t1==='plot'&&g.act==='REGAR','canteiro colado na portinha: o botao rega a planta em vez de abrir a portinha');
ok(g.t2==='fgate','depois de regado, o botao volta a abrir a portinha');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
