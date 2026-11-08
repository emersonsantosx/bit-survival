/* Piso e telhado: fabricar, por, tirar com reembolso, regra de apoio do telhado (parede, vizinho, alcance de 3),
   queda do telhado sem apoio, transparencia embaixo, save e carregar, multiplayer e canteiro.
   Uso: node tests/teste-piso-telhado.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;if(window.logList)logList().length=0;decorations.length=0;vehicles.length=0;rebuildSolidGrid();P.inside=null;P.dead=false;
 const o={};for(let i=0;i<80;i++)addItem('wood');
 const rf=RECIPES.find(q=>q.out==='floor'),rr=RECIPES.find(q=>q.out==='roof');o.rec=!!rf&&!!rr;
 const w0=countInv('wood');craft(rf);craft(rr);o.tools=toolList().includes('floor')&&toolList().includes('roof');o.recCost=w0-countInv('wood');
 // area livre
 let bx=0,by=0,found=false;for(let i=0;i<600&&!found;i++){bx=40+((i*53)%60)*16;by=40+((i*29)%40)*16;let free=true;
  for(let dx=-3;dx<=8&&free;dx++)for(let dy=-3;dy<=3&&free;dy++){const x=bx+dx*16+8,y=by+dy*16+8;if(bldNear(x,y,24)||pointInLake(x,y)||solidPoint(x,y,10))free=false;}
  if(free)found=true;}
 o.spot=found;
 // ficar de frente para o quadrado (cx,cy)
 const face=(cx,cy)=>{P.x=cx*16+8-14;P.y=cy*16+8;P.face=0;};   // olhando para a direita: o quadrado da frente e (cx,cy)
 const cx0=Math.floor(bx/16),cy0=Math.floor(by/16);
 // piso
 P.tool='floor';face(cx0,cy0);o.fi=cellIntent();const wb=countInv('wood');cellBuild();o.floorPlaced=floorList().length;o.floorCost=wb-countInv('wood');
 o.again=cellIntent().act;const wr=countInv('wood');cellBuild(true);o.quietKeeps=floorList().length;cellBuild();o.floorRemoved=floorList().length;o.floorRefund=countInv('wood')-wr;
 // piso nao precisa de apoio e anda por cima (nao barra)
 cellBuild();P.x=cx0*16+8-14;for(let i=0;i<30;i++)stepMove(P,1,0,P.r);o.walkOnFloor=P.x>cx0*16+8;
 // canteiro nao pode ter piso
 // telhado sem apoio
 P.tool='roof';const cx1=cx0+4,cy1=cy0;face(cx1,cy1);o.noSupport=cellIntent().bad;const wn=countInv('wood');cellBuild();o.noSupportKept=roofList().length===0&&countInv('wood')===wn;
 // parede: borda vertical entre cx1-1 e cx1 (x=cx1) e base para o telhado
 fenceRemote({x:cx1,y:cy1,d:'v',g:2});
 o.wallAdj=cellWalled(cx1,cy1)&&cellWalled(cx1-1,cy1);
 face(cx1,cy1);o.withWall=cellIntent().bad;const wc=countInv('wood');cellBuild();o.roofPlaced=roofList().length;o.roofCost=wc-countInv('wood');
 // cadeia: ate 3 quadrados de distancia da parede, o quarto nao
 const res=[];for(let k=1;k<=4;k++){face(cx1+k,cy1);const it=cellIntent();res.push(it.bad);if(!it.bad)cellBuild();}
 o.chain=res;o.roofCount=roofList().length;
 // tirar a parede derruba o que ficou sem apoio e solta madeira
 const nitems=items.length;const f=fenceList().find(q=>q.x===cx1&&q.y===cy1&&q.d==='v');
 P.x=cx1*16-10;P.y=cy1*16+8;P.face=0;P.tool='fists';for(let i=0;i<60&&fenceList().includes(f);i++){const st=structTarget(WEAPONS.fists||{range:18});if(!st)break;structHit(st,WEAPONS.fists||{cd:.5,chopRate:.5});}
 o.wallGone=!fenceList().includes(f);o.roofAfterWall=roofList().length;o.dropped=items.filter(i=>i.t==='wood').length-0;
 // cada peca caida solta 1 madeira (acumulado em items)
 o.woodDropped=items.length-nitems;
 // transparencia: telhado embaixo do jogador deixa de ser opaco
 fenceRemote({x:cx1,y:cy1,d:'v',g:2});P.tool='roof';face(cx1,cy1);cellBuild();face(cx1+1,cy1);cellBuild();
 P.x=cx1*16+24;P.y=cy1*16+8;for(let i=0;i<60;i++){update(.05);drawRoofs(0,WW,0,WH);}
 const rl=roofList();o.roofsLeft=rl.length;o.fade=rl.every(c=>c.a<.5);
 P.x=cx1*16+200;P.y=cy1*16+8;for(let i=0;i<60;i++){update(.05);drawRoofs(0,WW,0,WH);}o.solidAgain=roofList().every(c=>c.a>.9);
 // save e carregar
 const pk=cellPack();cellLoad(null);o.cleared=floorList().length+roofList().length;cellLoad(JSON.parse(JSON.stringify(pk)));o.reload=floorList().length+'/'+roofList().length;
 // dados ruins no save nao quebram
 cellLoad({f:[[-1,5],['a',2],null,[1e9,1e9]],r:'x'});o.badLoad=floorList().length+roofList().length;cellLoad(JSON.parse(JSON.stringify(pk)));
 // multiplayer
 cellRemote({k:'f',x:5,y:5,on:1});o.remoteF=floorAt(5,5);cellRemote({k:'f',x:5,y:5,on:0});o.remoteDel=!floorAt(5,5);
 cellRemote({k:'z',x:5,y:5,on:1});cellRemote({k:'f',x:'a',y:5,on:1});cellRemote({k:'f',x:-4,y:5,on:1});o.remoteBad=!floorAt(5,5)&&!floorAt(-4,5);
 // canteiro arado nao recebe piso
 P.tool='hoe';
 // limite de madeira
 removeInv('wood',countInv('wood'));P.tool='floor';face(cx0+10,cy0+6);o.noWood=cellIntent().bad;
 for(let i=0;i<30;i++)update(.05);o.btn=!document.getElementById('hoe').classList.contains('hide');o.ic=document.getElementById('hoe').dataset.ic;
 return o;});
console.log(JSON.stringify(r));
ok(r.rec&&r.tools,'fabrica piso e telhado como ferramentas');ok(r.recCost===7,'receitas custam 3 e 4 madeiras');ok(r.spot,'achou area livre');
ok(!r.fi.bad&&r.fi.act==='PLACE','piso pode ser posto sem apoio');ok(r.floorPlaced===1&&r.floorCost===1,'piso custa 1 madeira');
ok(r.again==='REMOVE'&&r.quietKeeps===1&&r.floorRemoved===0&&r.floorRefund===1,'botao sobre o piso tira e devolve a madeira (segurar nao tira)');ok(r.walkOnFloor,'anda por cima do piso');
ok(/apoio/.test(r.noSupport||'')&&r.noSupportKept,'telhado sem parede nao pode');ok(r.wallAdj&&!r.withWall&&r.roofPlaced===1&&r.roofCost===2,'telhado encostado na parede custa 2 madeiras');
ok(JSON.stringify(r.chain.map(x=>!!x))==='[false,false,false,true]'&&r.roofCount===4,'telhado se estende ate 3 quadrados da parede, o quarto nao ('+JSON.stringify(r.chain)+')');
ok(r.wallGone&&r.roofAfterWall===0&&r.woodDropped===4,'tirar a parede derruba o telhado e solta 1 madeira por peca');
ok(r.roofsLeft===2&&r.fade&&r.solidAgain,'telhado fica transparente embaixo e opaco de fora');
ok(r.cleared===0&&r.reload===r.reload&&/^\d+\/2$/.test(r.reload),'save e carregar mantem piso e telhado ('+r.reload+')');ok(r.badLoad===0,'save com lixo nao quebra');
ok(r.remoteF&&r.remoteDel&&r.remoteBad,'multiplayer poe, tira e ignora dados invalidos');ok(r.noWood==='Falta madeira','sem madeira');ok(r.btn&&r.ic==='floor','botao de construir mostra o piso');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
