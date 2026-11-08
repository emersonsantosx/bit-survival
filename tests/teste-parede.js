/* Parede e porta de madeira: fabricar, por, trocar parede por porta, abrir e fechar, bloquear passagem e tiro,
   desmontar, salvar e carregar, multiplayer e limite de madeira.
   Uso: node tests/teste-parede.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;if(window.logList)logList().length=0;decorations.length=0;vehicles.length=0;rebuildSolidGrid();P.inside=null;P.dead=false;   // area limpa: arvore ou carro no caminho mudariam o resultado sem ser bug
 
 const o={};for(let i=0;i<40;i++)addItem('wood');
 const rw=RECIPES.find(q=>q.out==='wall'),rd=RECIPES.find(q=>q.out==='door');o.rec=!!rw&&!!rd;
 const w0=countInv('wood');craft(rw);craft(rd);o.tools=toolList().includes('wall')&&toolList().includes('door');o.recCost=w0-countInv('wood');
 // ponto livre
 let ok1=false;for(let i=0;i<400&&!ok1;i++){P.x=500+i*11;P.y=600+((i*37)%200);P.face=0;P.tool='wall';if(bldNear(P.x,P.y,160)||pointInLake(P.x,P.y)||(plane&&Math.hypot(plane.x-P.x,plane.y-P.y)<160))continue;const it=fenceIntent();if(!it.bad){ok1=true;}}
 o.spot=ok1;const e=fenceIntent().e;
 const wb=countInv('wood');fenceBuild();o.placed=fenceList().filter(f=>!f.s).length;o.wallG=fenceList().find(f=>!f.s).g;o.wallCost=wb-countInv('wood');
 // bloqueia: jogador anda de um lado para o outro da parede
 const f=fenceList().find(q=>!q.s),mx=f.d==='h'?f.x*16+8:f.x*16,my=f.d==='h'?f.y*16:f.y*16+8;
 const nx=f.d==='h'?0:1,ny=f.d==='h'?1:0;
 P.x=mx-nx*14;P.y=my-ny*14;for(let i=0;i<60;i++)stepMove(P,nx*2,ny*2,P.r);const side=(P.x-mx)*nx+(P.y-my)*ny;o.blocked=side<0;
 // tiro e visao
 o.losWall=wallBlocks(mx-nx*30,my-ny*30,mx+nx*30,my+ny*30);o.losFree=!wallBlocks(mx-nx*30+ny*40,my-ny*30+nx*40,mx+nx*30+ny*40,my+ny*0+nx*0+ (ny*30)+nx*40);
 // tiro de verdade: zumbi atras da parede nao leva tiro; sem a parede (porta aberta) leva
 {const zf={x:mx+nx*40,y:my+ny*40+5,r:5,dead:false},sv=zombies.slice();zombies.length=0;zombies.push(zf);
  const ox=mx-nx*30,oy=my-ny*30+5,ang=Math.atan2(ny,nx);
  o.shotBlocked=!castRay(ox,oy,ang,120).z;
  const g=fenceList().find(q=>!q.s);g.g=3;g.o=1;o.shotOpen=castRay(ox,oy,ang,120).z===zf;
  g.g=2;g.o=0;zombies.length=0;for(const z of sv)zombies.push(z);}
 // carro nao atravessa a parede; porta aberta deixa
 {const v={x:mx,y:my,w:36,h:20,face:Math.atan2(ny,nx)+Math.PI/2};const g=fenceList().find(q=>!q.s);
  o.carWall=vehicleOverlap(v)>0;g.g=3;g.o=1;o.carOpen=vehicleOverlap(v)===0;g.g=2;g.o=0;
  const far={x:mx+nx*90,y:my+ny*90,w:36,h:20,face:0};o.carFar=vehicleOverlap(far)===0;}
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
ok(r.blocked,'parede barra o jogador');ok(r.carWall&&r.carOpen&&r.carFar,'carro bate na parede, passa pela porta aberta e anda livre longe dela');ok(r.shotBlocked&&r.shotOpen,'tiro nao atravessa a parede, e passa pela porta aberta');ok(r.losWall&&r.losFree,'parede barra tiro e visao, e so ela');
ok(r.replace==='REPLACE'&&r.doorG===3&&r.doorCost===3,'porta troca a parede por 3 madeiras');ok(r.doorBlocks,'porta fechada barra');
ok(r.tg==='fgate','botao enxerga a porta');ok(r.open===1&&r.losOpen&&r.passes,'porta aberta deixa passar e ver');
ok(r.cleared===0&&r.reload===3,'save e carregar mantem a porta');ok(r.remote===2&&r.remoteDel&&r.badG===0,'multiplayer cria, apaga e ignora valor invalido');
ok(r.broke&&r.refund===1,'desmontar a porta devolve 1 madeira (apos '+r.hits+' golpes)');ok(r.noWood==='Falta madeira','sem madeira');ok(r.btn&&r.ic==='wall','botao de construir mostra a parede');
// save de verdade: constroi, salva, recarrega a pagina, continua o jogo e confere (parede, porta aberta e porta fechada)
await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
 fenceRemote({x:30,y:30,d:'h',g:2});fenceRemote({x:31,y:30,d:'h',g:3,o:1});fenceRemote({x:32,y:30,d:'h',g:3,o:0});fenceRemote({x:33,y:30,d:'v',g:1,o:1});saveGame();});
await pg.reload();await pg.waitForFunction(()=>typeof newGame==='function'&&typeof refreshContinue==='function'&&document.readyState==='complete');
const rs=await pg.evaluate(()=>{window.requestAnimationFrame=()=>0;continueGame(1);const g=(x,y,d)=>{const f=fenceList().find(q=>q.x===x&&q.y===y&&q.d===d);return f?[f.g,f.o|0]:null;};
 return {a:g(30,30,'h'),b:g(31,30,'h'),c:g(32,30,'h'),d:g(33,30,'v'),blocks:wallBlocks(30*16+8,30*16-20,30*16+8,30*16+20)};});
console.log(JSON.stringify(rs));
ok(JSON.stringify(rs.a)==='[2,0]'&&JSON.stringify(rs.b)==='[3,1]'&&JSON.stringify(rs.c)==='[3,0]'&&JSON.stringify(rs.d)==='[1,1]','save de verdade mantem parede, portas e portao');ok(rs.blocks,'parede carregada ja barra tiro e visao');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
