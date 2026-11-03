/* Fabricar cerca/portao, quebrar estruturas do mapa e manter o que foi quebrado apos salvar e carregar.
   Uso: node tests/teste-estruturas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='city';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;P.inside=null;P.dead=false;
 const o={};for(let i=0;i<40;i++)addItem('wood');
 const rf=RECIPES.find(q=>q.out==='fence'),rg=RECIPES.find(q=>q.out==='gate');craft(rf);craft(rg);
 o.tools=toolList().includes('fence')&&toolList().includes('gate');
 // area livre
 let spot=null;for(let i=0;i<600&&!spot;i++){P.x=600+(i%40)*30;P.y=400+Math.floor(i/40)*30;P.face=0;P.tool='fence';const it=fenceIntent();if(!it.bad)spot=it;}
 const w0=countInv('wood');fenceBuild();o.fenceCost=w0-countInv('wood');o.n1=fenceList().filter(f=>!f.s).length;
 fenceBuild(false);o.dup=fenceIntent().bad;  // cerca sobre cerca
 P.tool='gate';const it2=fenceIntent();o.replace=it2.act;const w1=countInv('wood');fenceBuild();o.gateG=fenceList().filter(f=>!f.s)[0].g;o.replCost=w1-countInv('wood');
 // quebrar com machado
 addMeleeWeapon('axe');P.weapon='axe';P.cd=0;let hits=0;const n0=fenceList().filter(f=>!f.s).length;const wb=countInv('wood');
 for(let i=0;i<10&&fenceList().filter(f=>!f.s).length>=n0;i++){P.cd=0;P.face=0;attack();hits++;}
 o.axeHits=hits;o.afterBreak=fenceList().filter(f=>!f.s).length;o.woodBack=countInv('wood')-wb;
 // cerca da cidade: quebrar e persistir
 const st=fenceList().find(f=>f.s&&!f.g);P.x=st.x*16+8;P.y=st.y*16+(st.d==='h'?12:0);if(st.d==='v'){P.x=st.x*16+10;P.y=st.y*16+8;}
 P.face=st.d==='h'?-Math.PI/2:Math.PI;P.weapon='axe';P.cd=0;
 const before=fenceList().length;let k=0;while(fenceList().length>=before&&k<12){P.cd=0;attack();k++;}
 o.cityBroken=fenceList().length===before-1;o.cityKeys=structPack().length;
 // banco
 const bench=decorations.find(d=>d.type==='bench');let bres=null;
 if(bench){P.x=bench.x;P.y=bench.y+16;P.face=-Math.PI/2;P.cd=0;const dn=decorations.length;let j=0;while(decorations.length>=dn&&j<12){P.cd=0;attack();j++;}bres=decorations.length===dn-1;}
 o.bench=bres;
 // save/load
 saveGame();const pk=structPack();o.pk=pk.length;
 const slot=localStorage.getItem(slotKey(curSlot));o.saved=!!slot;
 // remoto
 const k2=pk.find(q=>q.charAt(0)==='d');
 return o;});
console.log(JSON.stringify(r));
ok(r.tools,'craft cerca e portao');ok(r.fenceCost===1&&r.n1===1,'cerca custa 1');ok(/Já tem/.test(r.dup||''),'cerca sobre cerca recusa');ok(r.replace==='REPLACE'&&r.gateG===1,'portao troca a cerca');ok(r.replCost===1,'troca custa liquido 1 (2 menos 1 devolvida)');
ok(r.afterBreak===0&&r.woodBack>=1,'bate e desmonta, devolve madeira');ok(r.cityBroken,'cerca da cidade quebra');ok(r.bench===true||r.bench===null,'banco quebra');ok(r.pk>=1,'quebrados entram no save');ok(errs.length===0,'sem erros '+errs[0]);
const cnt=await pg.evaluate(()=>({f:fenceList().length,d:decorations.length,br:structPack().length}));
await pg.reload();await pg.waitForFunction(()=>typeof continueGame==='function'&&document.readyState==='complete');
const r2=await pg.evaluate(()=>{refreshContinue();continueGame(1);return {f:fenceList().length,d:decorations.length,br:structPack().length};});
console.log(JSON.stringify(cnt),JSON.stringify(r2));
ok(r2.f===cnt.f&&r2.d===cnt.d,'continua quebrado apos carregar');ok(errs.length===0,'sem erros apos carregar '+errs[0]);
await b.close();process.exit(bad?1:0);})();
