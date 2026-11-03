/* Enxada: botao de arar, prioridade de itens, canteiro vazio volta ao normal, gramados e quintais da cidade.
   Uso: node tests/teste-enxada.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;aud();zombies=[];
 const o={};P.inside=null;P.tool='hoe';
 // acha ponto livre
 let ok=false;for(let i=0;i<200&&!ok;i++){P.x=400+i*9;P.y=500;P.face=0;const f=frontCell();if(!soilBad(f.cx*16+8,f.cy*16+8))ok=true;}
 items.length=0;items.push({x:P.x+3,y:P.y+3,t:'wood',n:1});
 update(.05);o.btnVisible=!document.getElementById('hoe').classList.contains('hide');
 o.tgk=pickTarget().k;o.tgAct=pickTarget().act||null;
 hoeTill();o.plots=plotList().length;
 hoeTill();o.plots2=plotList().length;
 for(let i=0;i<10;i++)plantTick(DAY_SECONDS/8);
 o.after=plotList().length;
 P.tool=null;for(let i=0;i<30;i++)update(.05);o.btnHidden=document.getElementById('hoe').classList.contains('hide');
 return o;});
console.log(JSON.stringify(r));
ok(r.btnVisible,'botao da enxada aparece');ok(r.tgk==='item','item vence com enxada na mao');ok(r.plots===1&&r.plots2===1,'arou 1 canteiro');ok(r.after===0,'terra vazia volta ao normal');ok(r.btnHidden,'botao some sem enxada');
// cidade
const c=await pg.evaluate(()=>{selectedMap='city';newGame();window.requestAnimationFrame=()=>0;
 const o={gardens:cityGardens.length};
 // ponto no gramado livre
 let good=null,road=null,conc=null;
 for(const g of cityGardens){for(let x=g.x+10;x<g.x+g.w-10&&!good;x+=8)for(let y=g.y+10;y<g.y+g.h-10;y+=8)if(!soilBad(x,y)){good=[x,y];break;}if(good)break;}
 o.good=!!good;
 o.concBad=false;for(let x=300;x<WW-300;x+=40){for(let y=300;y<WH-300;y+=40){if(!inCityGarden(x,y)&&!onCityRoad(x,y,6)&&!bldNear(x,y,8)&&!pointInLake(x,y)){o.concBad=!!soilBad(x,y);break;}}if(o.concBad)break;}
 o.yards=cityGardens.filter(g=>g.w<260).length;
 return o;});
console.log(JSON.stringify(c));
ok(c.gardens>3&&c.good,'ha gramados aravel na cidade');ok(c.concBad,'concreto nao ara');ok(c.yards>0,'ha quintais');ok(errs.length===0,'sem erros '+errs[0]);
await pg.evaluate(()=>{const g=cityGardens.find(g=>g.w<260)||cityGardens[0];P.x=g.x+g.w/2;P.y=g.y+g.h/2;P.inside=null;P.tool='hoe';zombies=[];update(.05);render();});


await b.close();process.exit(bad?1:0);})();
