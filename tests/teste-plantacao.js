/* Plantar, regar, crescer e colher em todos os mapas, e salvar os canteiros.
   Uso: node tests/teste-plantacao.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
for(const m of ['forest','snow','desert','city']){
 const pg=await (await b.newContext({viewport:{width:760,height:460}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+file);await pg.waitForFunction(()=>typeof newGame==='function');
 const r=await pg.evaluate((m)=>{localStorage.clear();selectedMap=m;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;plotsLoad([]);ghLoad([]);aud();zombies=[];animals=[];
  const o={};const msgs=[];window.toast=s=>msgs.push(s);
  const give=(t,n)=>{for(let i=0;i<n;i++)addItem(t);};
  P.pack=true;give('wood',30);give('cloth',10);give('water',3);give('seed_corn',2);give('seed_potato',2);give('seed_melon',2);
  // ponto livre (na cidade: dentro de um jardim; na neve: dentro da estufa)
  let sx,sy;
  for(let k=0;k<60000;k++){const x=200+Math.random()*(WW-400),y=200+Math.random()*(WH-400);if(pointInLake(x,y)||solidPoint(x,y,selectedMap==='city'?14:40)||bldNear(x,y,selectedMap==='city'?20:60))continue;if(selectedMap==='city'&&!(inCityGarden(x,y)&&inCityGarden(x-14,y-14)&&inCityGarden(x+14,y+14)))continue;if(onCityRoad(x,y,40))continue;if(selectedMap!=='snow'&&[0,16,-16].some(dx=>soilBad((Math.floor((x+dx)/16))*16+8,Math.floor(y/16)*16+8)))continue;if(m==='snow'){P.x=x;P.y=y;P.face=0;P.inside=null;if(!ghSpot())continue;}sx=Math.round(x);sy=Math.round(y);break;}
  P.x=sx;P.y=sy;P.face=0;P.inside=null;P.tool='hoe';
  if(m==='snow'){craft(RECIPES.find(r=>r.out==='greenhouse'));o.gh=ghList().length;const g=ghList()[0];P.x=g.x+24;P.y=g.y+24;P.face=0;}
  const ar=(dx)=>{const cx=Math.floor((P.x+dx)/16),cy=Math.floor(P.y/16);const n=plotList().length;plotDo({act:'ARAR',cell:{cx,cy}});return plotList().find(p=>p.cx===cx&&p.cy===cy);};
  const p1=ar(0),p2=ar(16),p3=ar(-16);o.plots=plotList().length;
  const plant=(p,seed)=>{P.inv=P.inv.filter(s=>true);msgs.length=0;plotDo({act:'PLANTAR',p});return p.c;};
  // melancia fora do deserto deve recusar
  const melon=plant(p1);  // primeiro seed do inventario que vinga
  o.firstPlanted=p1&&p1.c;
  plant(p2);plant(p3);
  o.crops=[p1,p2,p3].map(p=>p&&p.c);
  o.msgs=msgs.slice(-3);
  // crescer: 3 dias com agua
  for(const p of plotList())p.w=DAY_SECONDS*5;
  for(let i=0;i<DAY_SECONDS*3;i++)plantTick(1);
  o.mature=plotList().filter(p=>p.c).map(p=>p.g>=({corn:1.5,potato:1.2,melon:2}[p.c]*DAY_SECONDS));
  // colher
  const before=P.inv.map(s=>s.t+':'+s.n).join(',');
  for(const p of plotList())if(p.c)plotDo({act:'COLHER',p});
  o.harvest=P.inv.map(s=>s.t+':'+s.n).filter(s=>/corn|potato|melon/.test(s)).join(',');
  // salvar e carregar
  saveGame();const sv=JSON.parse(localStorage.getItem(slotKey(curSlot)));o.saved=[sv.plots.length,(sv.gh||[]).length];
  return o;},m);
 console.log(m,JSON.stringify(r));
 ok(r.plots===3,m+' 3 canteiros');ok(r.crops.every(c=>c===null||['corn','potato','melon'].includes(c)),m+' culturas validas');
 if(m==='forest')ok(!r.crops.includes('melon'),'floresta: melancia recusada');
 if(m==='desert')ok(r.crops.includes('melon')&&!r.crops.includes('potato'),'deserto: melancia ok, batata recusada');
 if(m==='snow')ok(r.gh===1&&r.crops.filter(Boolean).length>0,'neve: planta dentro da estufa');
 ok(r.mature.every(Boolean),m+' amadurece');ok(/\d/.test(r.harvest),m+' colheu: '+r.harvest);ok(r.saved[0]>=3,m+' salvou plots '+r.saved);
 if(m==='snow')ok(r.saved[1]===1,'neve: estufa salva');
 // recarregar o jogo
 await pg.reload();await pg.waitForFunction(()=>typeof newGame==='function');
 const l=await pg.evaluate(()=>{refreshContinue();continueGame(1);return [plotList().length,ghList().length,plotList().filter(p=>p.c).length];});
 ok(l[0]>=3,m+' plots apos carregar '+l);if(m==='snow')ok(l[1]===1,'neve: estufa apos carregar');
 ok(errs.length===0,m+' sem erros '+(errs[0]||''));
 await pg.context().close();}
await b.close();process.exit(bad?1:0);})();
