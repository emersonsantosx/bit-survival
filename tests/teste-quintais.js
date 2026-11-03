/* Cidade: quintais cercados, portao que abre e fecha, grama fora de baixo das casas, multiplayer.
   Uso: node tests/teste-quintais.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='city';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];items.length=0;
 const o={};o.yards=cityYards.length;o.paths=cityPaths.length;o.decor=cityDecor.length;
 const h=blds.find(q=>q.type==='house'&&cityYards.some(yy=>q.x>yy.x&&q.x<yy.x+yy.w&&q.y>yy.y&&q.y<yy.y+yy.h));
 const gate=fenceList().find(f=>f.g&&f.s&&Math.abs(f.x*16+8-(h.doorX+h.door/2))<20&&f.y*16>h.y+h.h);
 o.gate=!!gate;o.closed=!gate.o;
 P.x=gate.x*16+8;P.y=gate.y*16+9;P.face=-Math.PI/2;P.inside=null;P.dead=false;
 o.cands=fenceGateCands().length;
 const tg=pickTarget();o.tg=tg&&tg.k;
 update(.05);o.btn0=document.getElementById('pick').dataset.st;P.y=gate.y*16+22;for(let i=0;i<40;i++)stepMove(P,0,-2,P.r);o.blockedClosed=P.y>gate.y*16;
 fenceToggle(gate);o.open=gate.o;
 for(let i=0;i<60;i++)stepMove(P,0,-2,P.r);o.passedOpen=P.y<gate.y*16-4;
 update(.05);o.btn=document.getElementById('pick').dataset.st;
 P.x=gate.x*16+8;P.y=gate.y*16+22;P.face=-Math.PI/2;
 o.btnAfter=(update(.05),0);
 // lawn: nada sob a casa
 let under=0;for(const g of cityGardens){if(g.x<h.x+h.w-1&&g.x+g.w>h.x+1&&g.y<h.y+h.h-1&&g.y+g.h>h.y+1)under++;}o.under=under;
 // mp snapshot
 const f2=fenceList().find(f=>f.s&&f.g);fenceRemote({x:f2.x,y:f2.y,d:f2.d,g:1,o:1});o.mp=f2.o;
 P.x=gate.x*16+8;P.y=gate.y*16+60;P.face=-Math.PI/2;update(.05);render();
 return o;});
console.log(JSON.stringify(r));
ok(r.yards>0&&r.paths>0&&r.decor>0,'quintais, caminhos e enfeites');ok(r.gate&&r.closed,'portao fechado de inicio');ok(r.tg==='fgate'||r.cands>0,'botao enxerga o portao');
ok(r.blockedClosed,'fechado barra');ok(r.open===1&&r.passedOpen,'aberto deixa passar');ok(r.under===0,'sem grama sob a casa');ok(r.mp===1,'multiplayer abre');ok(errs.length===0,'sem erros '+errs[0]);


await b.close();process.exit(bad?1:0);})();
