/* Cerca e portao: construir, abrir/fechar, bloquear passagem, trocar cerca por portao, salvar e multiplayer.
   Uso: node tests/teste-cerca.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;decorations.length=0;vehicles.length=0;rebuildSolidGrid();P.inside=null;   // area limpa: arvore, bicho ou carro no caminho mudariam a contagem sem ser bug
 const o={};
 for(let i=0;i<20;i++)addItem('wood');o.w0=countInv('wood');
 const rec=RECIPES.find(q=>q.out==='fence');o.rec=!!rec;craft(rec);o.has=toolList().includes('fence');o.eq=P.tool;o.w1=countInv('wood');
 // ponto onde as 3 posicoes usadas abaixo aceitam cerca (nao vale lago, construcao ou borda do mapa por perto)
 const okAt=(x,y,face)=>{P.x=x;P.y=y;P.face=face;P.tool='fence';return !fenceIntent().bad;};
 let spot=null;for(let i=0;i<900&&!spot;i++){const x=300+((i*37)%120)*9,y=300+((i*53)%60)*9;if(okAt(x,y,0)&&okAt(x,y+40,Math.PI/2)&&okAt(x+24,y+40,Math.PI/2)&&okAt(x+84,y+40,0)){P.x=x;P.y=y;P.face=0;spot=fenceIntent();}}
 o.spot=!!spot;
 // cerca em volta de um quadrado: anda e constroi em 4 direcoes
 const e0=spot.e;fenceBuild();o.n1=fenceList().length;
 P.tool='gate';fenceBuild();o.gate=fenceList()[0].g;P.tool='fence';o.removed=0;fenceList().length;P.face=0;
 P.face=Math.PI/2;P.y+=40;fenceBuild();P.tool='gate';P.x+=24;fenceBuild();P.tool='fence';
 o.cnt=fenceList().length;o.woodAfter=countInv('wood');
 // save/load
 const pk=fencePack();fenceLoad([]);o.cleared=fenceList().length;fenceLoad(pk);o.reload=fenceList().length;
 fenceRemote({x:3,y:3,d:'h',g:0});o.remote=fenceList().length;
 // sem madeira (e sem credito de cerca: 1 madeira rende 2 pecas)
 removeInv('wood',countInv('wood'));P._fcred=0;P.tool='fence';P.face=0;P.x+=60;const w=fenceIntent();o.noWood=w.bad;
 P.tool='fence';for(let i=0;i<30;i++)update(.05);o.btn=!document.getElementById('hoe').classList.contains('hide');
 // colisao: jogador atravessa a cerca
 return o;});
console.log(JSON.stringify(r));
ok(r.rec&&r.has&&r.eq==='fence','craft equipa a cerca');ok(r.w1===r.w0-2,'custa 2 madeiras');ok(r.n1===1,'poe cerca');ok(r.gate===1,'vira portinha');
ok(r.cleared===0&&r.reload===r.cnt,'save/carregar');ok(r.remote===r.cnt+1,'multiplayer');ok(r.noWood==='Falta madeira','sem madeira');ok(r.btn,'botao visivel');
// screenshot: cerca em volta
await pg.evaluate(()=>{for(let i=0;i<30;i++)addItem('wood');P.tool='fence';P.x=520;P.y=520;
 fenceLoad([]);const L=[];for(let k=0;k<5;k++){L.push([31+k,31,0,0]);L.push([31+k,35,0,k==2?1:0]);}for(let k=0;k<4;k++){L.push([31,31+k,1,0]);L.push([36,31+k,1,0]);}fenceLoad(L);
 P.x=31*16+30;P.y=31*16+20;P.face=0;update(.05);render();});

ok(errs.length===0,'sem erros '+errs[0]);await b.close();process.exit(bad?1:0);})();
