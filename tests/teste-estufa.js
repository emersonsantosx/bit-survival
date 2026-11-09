/* Estufa e fantasma de construcao da enxada: onde pode e onde nao pode arar.
   Uso: node tests/teste-estufa.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;plotsLoad([]);ghLoad([]);zombies=[];items.length=0;P.inside=null;
 let g0=null;for(let yy=0;yy<8&&!g0;yy++)for(let i=0;i<300;i++){P.x=400+i*9;P.y=500+yy*220;P.face=0;P.tool='hoe';const g=ghostFor();if(g&&g.ok){g0=g;break;}}   // varre varias linhas: o mundo sorteado pode ocupar uma faixa inteira
 const o={okGhost:!!g0};
 hoeTill();o.afterTill=plotList().length;o.ghostAfter=ghostFor()===null||ghostFor().cx!==g0.cx;
 P.x=WW-10;P.y=WH/2;const g2=ghostFor();o.badGhost=g2&&!g2.ok;
 P.tool=null;o.noGhost=ghostFor()===null;
 P.x=g0.cx*16-20;P.y=g0.cy*16;P.tool='hoe';P.face=0;update(.05);render();
 return o;});
console.log(JSON.stringify(r));ok(r.okGhost,'fantasma verde');ok(r.afterTill===1,'arou');ok(r.badGhost,'fantasma vermelho na borda');ok(r.noGhost,'sem fantasma sem enxada');

ok(errs.length===0,'sem erros '+errs[0]);await b.close();process.exit(bad?1:0);})();
