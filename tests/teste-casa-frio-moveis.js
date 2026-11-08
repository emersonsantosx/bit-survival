/* Casa construida isola do frio, caixa de materiais fecha ao trocar de arma, e moveis das casas quebram com machado ou picareta.
   Uso: node tests/teste-casa-frio-moveis.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
// ---------- frio ----------
const f=await pg.evaluate(()=>{localStorage.clear();selectedMap='snow';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;trees.length=0;rocks.length=0;if(window.logList)logList().length=0;decorations.length=0;rebuildSolidGrid();
 const real=performance.now.bind(performance);let off=0;performance.now=()=>real()+off;const tick=()=>{off+=1000;};
 const o={};weather='snow';T=DAY_SECONDS*.1;P.inside=null;P.inVehicle=null;P.dead=false;
 let cx=0,cy=0,found=false;for(let i=0;i<900&&!found;i++){cx=30+(i*7)%100;cy=30+(i*11)%80;let free=true;for(let a=-2;a<=5&&free;a++)for(let c=-2;c<=5&&free;c++){const x=(cx+a)*16+8,y=(cy+c)*16+8;if(bldNear(x,y,24)||pointInLake(x,y)||solidPoint(x,y,10))free=false;}found=free;}
 o.spot=found;fenceLoad([]);cellLoad(null);
 const wall=(d,x,y,g,op)=>fenceRemote({x,y,d,g:g||2,o:op||0});
 const roof=(x,y)=>cellRemote({k:'r',x,y,on:1});
 const stand=()=>{P.x=(cx+1)*16;P.y=(cy+1)*16;};
 const sh=()=>{tick();return shelterAt(P.x,P.y);};
 stand();o.open=sh();const tOpen=envTemp();
 // so telhado: uma parede de apoio e telhado em cima (o resto ao ar livre)
 wall('v',cx,cy);wall('v',cx,cy+1);
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)roof(cx+i,cy+j);
 o.roofOnly=sh();const tRoof=envTemp();
 // paredes em volta (2x2 quadrados), com uma porta fechada
 wall('h',cx,cy);wall('h',cx+1,cy);wall('h',cx,cy+2);wall('h',cx+1,cy+2,3,0);wall('v',cx+2,cy);wall('v',cx+2,cy+1);
 o.sealed=sh();const tSealed=envTemp();
 // porta aberta: vaza
 fenceRemote({x:cx+1,y:cy+2,d:'h',g:3,o:1});o.doorOpen=sh();fenceRemote({x:cx+1,y:cy+2,d:'h',g:3,o:0});o.doorClosed=sh();
 // sem uma parede: vaza
 const gone=fenceList().find(q=>q.d==='v'&&q.x===cx+2&&q.y===cy+1);const gp=JSON.parse(JSON.stringify(fencePack()));
 fenceLoad(gp.filter(r=>!(r[0]===cx+2&&r[1]===cy+1&&r[2]==='v')&&!(Array.isArray(r)&&false)));o.gap=sh();
 fenceLoad(gp);o.sealed2=sh();
 o.tOpen=tOpen;o.tRoof=tRoof;o.tSealed=tSealed;
 // temperatura do corpo: dentro da casa fechada esfria bem menos
 P.temp=0;for(let i=0;i<400;i++){P.x=(cx+1)*16;tick();tempTick(.25);}o.bodyIn=P.temp;
 P.temp=0;P.x=(cx+10)*16;P.y=(cy+10)*16;for(let i=0;i<400;i++){tick();tempTick(.25);}o.bodyOut=P.temp;
 return o;});
console.log(JSON.stringify(f));
ok(f.spot,'achou area livre');
ok(f.open===0&&f.roofOnly===1&&f.sealed===2,'abrigo: ao relento 0, so telhado 1, fechado 2 ('+[f.open,f.roofOnly,f.sealed]+')');
ok(f.doorOpen===1&&f.doorClosed===2,'porta aberta deixa o frio entrar, fechada nao');
ok(f.gap===1&&f.sealed2===2,'falta de parede deixa o frio entrar');
ok(f.tSealed>f.tOpen&&Math.abs(f.tSealed)<Math.abs(f.tOpen)*.5&&f.tRoof>f.tOpen&&f.tRoof<f.tSealed,'temperatura alvo: fechada bem mais quente que so telhado, que e mais quente que o relento ('+[f.tOpen,f.tRoof,f.tSealed].map(v=>Math.round(v))+')');
ok(f.bodyIn>f.bodyOut+15,'na casa fechada o corpo esfria muito menos ('+Math.round(f.bodyIn)+' contra '+Math.round(f.bodyOut)+')');
// ---------- caixa de materiais ----------
const t=await pg.evaluate(()=>{const o={};P.tools=['wall','fence'];
 P.tool='wall';cycleWeapon();o.swap=P.tool;
 P.tool='fence';chooseWeapon('fists');o.wheel=P.tool;
 P.tool=null;cycleWeapon();o.none=P.tool;return o;});
ok(t.swap===null&&t.wheel===null&&t.none===null,'trocar de arma guarda a caixa de materiais aberta ('+JSON.stringify(t)+')');
// ---------- moveis ----------
const m=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;
 const o={};P.dead=false;P.inVehicle=null;
 const find=k=>{for(let bi=0;bi<blds.length;bi++){const b=blds[bi];const f=(b.furn||[]).find(q=>q.k===k);if(f){b.furn=b.furn.filter(q=>q===f);return {b,bi,f};}}return null;};   // isola o movel (o golpe pega o que esta mais perto)
 const hit=(b,f,wp,n)=>{P.inside=b;P.weapon=wp;P.x=f.x+f.w/2;P.y=f.y+f.h+8;P.face=-Math.PI/2;P.cd=0;
  for(let i=0;i<n&&b.furn.includes(f);i++){const w=WEAPONS[wp];const st=structTarget(w);if(!st)return 'sem alvo';structHit(st,w);P.cd=0;}return b.furn.includes(f)?'em pe':'quebrou';};
 const tb=find('table');o.hasTable=!!tb;
 P.inv=[];
 o.fistsTable=hit(tb.b,tb.f,'fists',12);o.hpAfterFists=tb.f.hp===undefined;
 o.axeTable=hit(tb.b,tb.f,'axe',12);o.wood=countInv('wood');
 const fr=find('fridge');o.hasFridge=!!fr;P.inv=[];
 o.axeFridge=hit(fr.b,fr.f,'axe',12);o.pickFridge=hit(fr.b,fr.f,'pickaxe',20);o.stone=countInv('stone');
 // movel quebrado nao barra mais e nao e desenhado
 o.noMore=!tb.b.furn.includes(tb.f);
 // save e carregar: continua quebrado
 const pk=structPack();o.packed=pk.filter(k=>k.charAt(0)==='m').length;
 const tx=Math.round(tb.f.x),ty=Math.round(tb.f.y),has=()=>blds[tb.bi].furn.some(q=>Math.round(q.x)===tx&&Math.round(q.y)===ty&&q.k==='table');
 const seed=worldSeed;genWorld(seed);o.backAgain=has();
 structLoad(pk);o.afterLoad=!has();
 // multiplayer: o outro jogador quebra um sofa
 const cu=find('couch');if(cu){const key='m:'+cu.bi+','+Math.round(cu.f.x)+','+Math.round(cu.f.y)+',couch';structRemote(key);o.remote=!cu.b.furn.includes(cu.f);}
 structRemote('m:9999,1,1,x');structRemote('m:a');o.remoteBad=true;
 // todo tipo de movel das casas tem material
 const kinds=new Set();for(const b of blds)for(const f of b.furn||[])kinds.add(f.k);o.kinds=kinds.size;
 return o;});
console.log(JSON.stringify(m));
ok(m.hasTable&&m.fistsTable==='em pe'&&m.hpAfterFists,'com as maos o movel nao quebra');
ok(m.axeTable==='quebrou'&&m.wood>=2,'mesa quebra com machado e solta madeira ('+m.wood+')');
ok(m.hasFridge&&m.axeFridge==='em pe'&&m.pickFridge==='quebrou'&&m.stone>=2,'geladeira so quebra com picareta e solta pedra ('+m.stone+')');
ok(m.noMore&&m.packed>=2&&m.backAgain&&m.afterLoad,'movel quebrado fica quebrado depois de salvar e carregar');
ok(m.remote&&m.remoteBad,'multiplayer: movel quebrado pelo outro some, dados ruins sao ignorados');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
