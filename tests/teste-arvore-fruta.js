/* Arvore frutifera derrubada solta os frutos maduros no chao (alem da madeira); se estava sem fruto, so cai madeira; arvore comum nao solta nada.
   Uso: node tests/teste-arvore-fruta.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const run=(map,kind)=>pg.evaluate(({map,kind})=>{
  localStorage.clear();selectedMap=map;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];
  const o={map,kind};
  const t=kind==='plain'?trees.find(q=>!fruitOf(q)&&q.k!==undefined):trees.find(q=>fruitOf(q));
  if(!t){o.none=true;return o;}
  const f=fruitOf(t);o.fruit=f;
  // limpa em volta, fica ao lado e derruba com o machado
  trees=[t];decorations.length=0;items.length=0;rocks.length=0;if(window.logList)logList().length=0;vehicles.length=0;rebuildSolidGrid();
  P.inside=null;P.inVehicle=null;P.dead=false;P.inv=[];P.x=t.x-10;P.y=t.y+2;P.face=0;addMeleeWeapon('axe');P.weapon='axe';
  if(kind==='regrowing'){fruitPick(t);}
  o.ripe=!!fruitRipe(t);
  const w0=P.inv.reduce((n,s)=>n+(s.t==='wood'?s.n:0),0);
  for(let i=0;i<30&&trees.length;i++){P.cd=0;P.face=0;attack();}
  o.felled=trees.length===0;
  o.fruitOnGround=items.filter(i=>i.t===f).length;o.otherFruit=items.filter(i=>FRUIT_FOOD[i.t]&&i.t!==f).length;
  o.wood=P.inv.reduce((n,s)=>n+(s.t==='wood'?s.n:0),0)+items.filter(i=>i.t==='wood').length-w0;
  o.near=items.filter(i=>i.t===f).every(i=>Math.hypot(i.x-t.x,i.y-t.y)<30);
  o.msg=document.getElementById('toast').textContent;
  return o;},{map,kind});
for(const [map,what] of [['forest','apple'],['desert','date']]){
  const r=await run(map,'ripe');console.log(JSON.stringify(r));
  ok(!r.none&&r.felled&&r.wood>=1,map+': a arvore frutifera cai e da madeira');
  ok(r.fruitOnGround>=2&&r.fruitOnGround<=5&&r.near&&r.otherFruit===0,map+': soltou '+r.fruitOnGround+' fruto(s) ('+r.fruit+') no chao, perto do toco');
  ok(/caíram/.test(r.msg),map+': o aviso fala dos frutos ('+r.msg+')');
}
const g=await run('forest','regrowing');console.log(JSON.stringify(g));
ok(g.felled&&!g.ripe&&g.fruitOnGround===0,'arvore que ja foi colhida (sem fruto) so da madeira');
const p=await run('forest','plain');console.log(JSON.stringify(p));
ok(p.felled&&p.fruitOnGround===0&&!/caíram/.test(p.msg),'arvore comum nao solta fruto');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
