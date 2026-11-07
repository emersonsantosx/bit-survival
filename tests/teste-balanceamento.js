/* Balanceamento: comodos maiores, katana achavel e Yeti mais raro.
   Uso: node tests/teste-balanceamento.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const w=await pg.evaluate(()=>{
  window.requestAnimationFrame=()=>0;const o={kat:0,rooms:0,area:0,minD:0,N:6,conn:true};
  for(let i=0;i<o.N;i++){localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();
    o.kat+=items.filter(x=>x.t==='katana').length;
    for(const q of blds)for(const r of (q.rooms||[])){o.rooms++;o.area+=r.w*r.h;o.minD+=Math.min(r.w,r.h);}}
  return o;});
ok(w.area/w.rooms>=3600&&w.minD/w.rooms>=47,'comodos maiores: area media '+Math.round(w.area/w.rooms)+' px2, lado menor medio '+Math.round(w.minD/w.rooms)+' px');
ok(w.kat>=3,'katana achavel: '+w.kat+' em '+w.N+' mundos de floresta (media '+(w.kat/w.N).toFixed(1)+')');
const y=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='snow';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';
  P.dead=false;day=3;weather='snow';const real=Math.random;const o={};
  const run=(sec,rnd)=>{Math.random=rnd;let first=null;for(let t=0;t<sec;t++){updateYeti(1);if(!first&&zombies.some(z=>!z.dead&&z.kind===9)){first=t;break;}}Math.random=real;return first;};
  const seed=()=>{YT.on=false;YT.cool=0;YT.t=30;zombies=zombies.filter(z=>z.kind!==9);};
  seed();o.first=run(400,()=>.2);                               // nevasca "com Yeti": nunca antes de 150 s
  const spawned=zombies.find(z=>z.kind===9);if(spawned)spawned.dead=true;
  o.cool=YT.cool;                                                // descanso depois da aparicao
  const again=run(600,()=>.2);o.again=again;                     // 600 s depois ainda em descanso
  seed();o.noYeti=run(1500,()=>.9);                              // nevasca "sem Yeti": nao vem nenhum
  return o;});
ok(y.first!==null&&y.first>=140,'Yeti nao aparece antes de 2 a 5 min de nevasca (apareceu em '+y.first+' s)');
ok(y.cool>=700&&y.again===null,'depois de uma aparicao ele descansa 12 min ('+y.cool+' s)');
ok(y.noYeti===null,'metade das nevascas nao traz Yeti nenhum');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
