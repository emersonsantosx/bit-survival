/* Parede e porta de madeira: fabricar, por, trocar parede por porta, abrir e fechar, bloquear passagem e tiro,
   desmontar, salvar e carregar, multiplayer e limite de madeira.
   Uso: node tests/teste-parede.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;P.inside=null;P.dead=false;
 const o={};for(let i=0;i<40;i++)addItem('wood');
 const rw=RECIPES.find(q=>q.out==='wall'),rd=RECIPES.find(q=>q.out==='door');o.rec=!!rw&&!!rd;
 const w0=countInv('wood');craft(rw);craft(rd);o.tools=toolList().includes('wall')&&toolList().includes('door');o.recCost=w0-countInv('wood');
 // ponto livre
 let ok1=false;for(let i=0;i<400&&!ok1;i++){P.x=500+i*11;P.y=600+((i*37)%200);P.face=0;P.tool='wall';const it=fenceIntent();if(!it.bad){ok1=true;}}
 o.spot=ok1;const e=fenceIntent().e;
 const wb=countInv('wood');fenceBuild();o.placed=fenceList().filter(f=>!f.s).length;o.wallG=fenceList().find(f=>!f.s).g;o.wallCost=wb-countInv('wood');
 // bloqueia: jogador anda de um lado para o outro da parede
 const f=fenceList().find(q=>!q.s),mx=f.d==='h'?f.x*16+8:f.x*16,my=f.d==='h'?f.y*16:f.y*16+8;
 const nx=f.d==='h'?0:1,ny=f.d==='h'?1:0;
 P.x=mx-nx*14;P.y=my-ny*14;for(let i=0;i<60;i++)stepMove(P,nx*2,ny*2,P.r);const side=(P.x-mx)*nx+(P.y-my)*ny;o.blocked=side<0;
 // tiro e visao
 o.losWall=wallBlocks(mx-nx*30,my-ny*30,mx+nx*30,my+ny*30);o.losFree=!wallBlocks(mx-nx*30+ny*40,my-ny*30+nx*40,mx+nx*30+ny*40,my+ny*0+nx*0+ (ny*30)+nx*40);
 // porta troca parede
 P.x=mx-nx*10;P.y=my-ny*10;P.face=Math.atan2(ny,nx);P.tool='door';const it2=fenceIntent();o.replace=it2.act;
 const dw=countInv('wood');fenceBuild();o.doorG=fenceList().find(q=>!q.s).g;o.doorCost=dw-countInv('wood');
 // porta fechada barra, aberta passa
 const dr=fenceList().find(q=>!q.s);P.x=mx-nx*14;P.y=my-ny*14;for(let i=0;i<60;i++)stepMove(P,nx*2,ny*2,P.r);o.doorBlocks=(P.x-mx)*nx+(P.y-my)*ny<0;
 P.x=mx-nx*10;P.y=my-ny*10;P.face=Math.atan2(ny,nx);
 const tg=pickTarget();o.tg=tg&&tg.k;
 fenceToggle(dr);o.open=dr.o;o.losOpen=!wallBlocks(mx-nx*30,my-ny*30,mx+nx*30,my+ny*30);
 P.x=mx-nx*14;P.y=my-ny*14;for(let i=0;i<60;i++)stepMove(P,nx*2,ny*2,P.r);o.passes=(P.x-mx)*nx+(P.y-my)*ny>0;
 fenceToggle(dr);
 // save e carregar
 const pk=fencePack();fenceLoad([]);o.cleared=fenceList().filter(q=>!q.s).length;fenceLoad(pk);const rl=fenceList().find(q=>!q.s);o.reload=rl&&rl.g;
 // multiplayer
 fenceRemote({x:3,y:3,d:'h',g:2});const rm=fenceList().find(q=>q.x===3&&q.y===3);o.remote=rm&&rm.g;
 fenceRemote({x:3,y:3,d:'h',g:-1});o.remoteDel=!fenceList().find(q=>q.x===3&&q.y===3);
 fenceRemote({x:4,y:4,d:'h',g:99});o.badG=fenceList().find(q=>q.x===4&&q.y===4).g;
 // desmontar a porta a golpes
 P.x=mx-nx*10;P.y=my-ny*10;P.face=Math.atan2(ny,nx);const wd=countInv('wood');let hits=0;
 for(let i=0;i<40&&fenceList().includes(rl);i++){const st=structTarget(WEAPONS.fists||{range:18});if(!st)break;structHit(st,WEAPONS.fists||{cd:.5,chopRate:.5});hits++;}
 o.broke=!fenceList().includes(rl);o.hits=hits;o.refund=countInv('wood')-wd;
 // sem madeira
 removeInv('wood',countInv('wood'));P.tool='wall';P.x+=60;o.noWood=fenceIntent().bad;
 for(let i=0;i<30;i++)update(.05);o.btn=!document.getElementById('hoe').classList.contains('hide');o.ic=document.getElementById('hoe').dataset.ic;
 return o;});
console.log(JSON.stringify(r));
ok(r.rec&&r.tools,'fabrica parede e porta como ferramentas');ok(r.recCost===7,'receitas custam 3 e 4 madeiras');
ok(r.spot&&r.placed===1&&r.wallG===2,'poe parede');ok(r.wallCost===2,'parede custa 2 madeiras');
ok(r.blocked,'parede barra o jogador');ok(r.losWall&&r.losFree,'parede barra tiro e visao, e so ela');
ok(r.replace==='REPLACE'&&r.doorG===3&&r.doorCost===3,'porta troca a parede por 3 madeiras');ok(r.doorBlocks,'porta fechada barra');
ok(r.tg==='fgate','botao enxerga a porta');ok(r.open===1&&r.losOpen&&r.passes,'porta aberta deixa passar e ver');
ok(r.cleared===0&&r.reload===3,'save e carregar mantem a porta');ok(r.remote===2&&r.remoteDel&&r.badG===0,'multiplayer cria, apaga e ignora valor invalido');
ok(r.broke&&r.refund===1,'desmontar a porta devolve 1 madeira (apos '+r.hits+' golpes)');ok(r.noWood==='Falta madeira','sem madeira');ok(r.btn&&r.ic==='wall','botao de construir mostra a parede');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
