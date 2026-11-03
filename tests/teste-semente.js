/* Semente: comer milho, batata e melancia (crus ou assados) devolve a semente certa, e nao ha receita de semente no crafting.
   Uso: node tests/teste-semente.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForFunction(()=>typeof newGame==='function');
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;aud();zombies=[];
 const o={};P.pack=true;P.inv=[];P.food=40;P.water=40;
 o.recipes=RECIPES.filter(r=>/seed/.test(r.out)).length;
 const eat=(t)=>{P.inv=P.inv.filter(s=>!/seed/.test(s.t));addItem(t);P.food=40;P.water=40;P.hold=t;atkHeld=true;eatLock=false;eatStart();for(let k=0;k<30;k++)eatTick(.1);atkHeld=false;eatLock=false;P.hold=null;return P.inv.map(s=>s.t+':'+s.n).join(',');};
 o.corn=eat('corn');o.cooked=eat('cookedcorn');o.potato=eat('potato');o.baked=eat('bakedpotato');o.melon=eat('melon');
 // inventario cheio (sem mochila): 6 tipos, o milho e o ultimo; a vaga liberada recebe a semente
 P.pack=false;P.inv=[{t:'wood',n:1},{t:'stone',n:1},{t:'cloth',n:1},{t:'food',n:1},{t:'water',n:1},{t:'corn',n:1}];P.food=40;
 P.hold='corn';atkHeld=true;eatLock=false;eatStart();for(let k=0;k<30;k++)eatTick(.1);atkHeld=false;o.full=P.inv.map(s=>s.t).join(',');
 // cheio de verdade (milho com 2 unidades): semente cai no chao
 P.inv=[{t:'wood',n:1},{t:'stone',n:1},{t:'cloth',n:1},{t:'food',n:1},{t:'water',n:1},{t:'corn',n:2}];P.food=40;const n0=items.length;P.hold='corn';atkHeld=true;eatLock=false;eatStart();for(let k=0;k<30;k++)eatTick(.1);atkHeld=false;o.dropped=items.length===n0+1&&items[items.length-1].t==='seed_corn';
 // sem fome: nao gasta nem da semente
 P.pack=true;P.inv=[{t:'corn',n:1}];P.food=100;P.hold='corn';atkHeld=true;eatLock=false;eatStart();for(let k=0;k<30;k++)eatTick(.1);atkHeld=false;o.noHunger=P.inv.map(s=>s.t).join(',');
 return o;});
console.log(JSON.stringify(r));
ok(r.recipes===0,'sem receitas de sementes no crafting');ok(/seed_corn:1/.test(r.corn),'comer milho cru da semente');ok(/seed_corn:1/.test(r.cooked),'milho assado da semente');
ok(/seed_potato:1/.test(r.potato),'batata crua');ok(/seed_potato:1/.test(r.baked),'batata assada');ok(/seed_melon:1/.test(r.melon),'melancia');
ok(/seed_corn/.test(r.full),'inventario cheio: vaga liberada recebe a semente');ok(r.dropped,'sem vaga: semente cai no chao');ok(r.noHunger==='corn','sem fome: nada acontece');
ok(errs.length===0,'sem erros '+(errs[0]||''));await b.close();process.exit(bad?1:0);})();
