/* Cama: fabricar, montar (custo, cabeceira, regras), tirar com reembolso, dormir (so a noite), bonus de cura debaixo
   de telhado, acordar sem atravessar parede, canteiro, save e carregar, multiplayer.
   Uso: node tests/teste-cama.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;decorations.length=0;vehicles.length=0;tents.length=0;rebuildSolidGrid();P.inside=null;P.dead=false;
 const o={};for(let i=0;i<60;i++)addItem('wood');for(let i=0;i<30;i++)addItem('cloth');
 const rm=RECIPES.find(q=>q.out==='mattress');o.rec=!!rm;const w0=countInv('wood'),c0=countInv('cloth');craft(rm);o.tool=toolList().includes('mattress');o.recCost=[w0-countInv('wood'),c0-countInv('cloth')];
 let bx=0,by=0,found=false;for(let i=0;i<900&&!found;i++){bx=60+((i*53)%60)*16;by=60+((i*29)%40)*16;let free=true;for(let dx=-3;dx<=10&&free;dx++)for(let dy=-3;dy<=8&&free;dy++){const x=bx+dx*16+8,y=by+dy*16+8;if(bldNear(x,y,24)||pointInLake(x,y)||solidPoint(x,y,10))free=false;}if(free)found=true;}
 o.spot=found;const cx0=Math.floor(bx/16),cy0=Math.floor(by/16);
 const face=(cx,cy,a)=>{P.x=cx*16+8-14*Math.cos(a||0);P.y=cy*16+8-14*Math.sin(a||0);P.face=a||0;};
 // montar: custo, cabeceira do lado oposto ao jogador
 P.tool='mattress';face(cx0,cy0,0);o.i0=cellIntent();const w1=countInv('wood'),c1=countInv('cloth');cellBuild();
 o.placed=bedList().length;o.cost=[w1-countInv('wood'),c1-countInv('cloth')];o.side=bedList()[0]&&bedList()[0].s;
 // tirar devolve tudo (segurar nao tira)
 o.again=cellIntent().act;cellBuild(true);o.keeps=bedList().length;const w2=countInv('wood'),c2=countInv('cloth');cellBuild();o.removed=bedList().length;o.refund=[countInv('wood')-w2,countInv('cloth')-c2];
 // cabeceira na parede: parede na borda direita do quadrado (v em cx0+1) e jogador olhando de baixo
 fenceRemote({x:cx0+1,y:cy0,d:'v',g:2});face(cx0,cy0,Math.PI/2*3);o.sideWall=cellIntent().s;
 // sem pano
 const hold=countInv('cloth');removeInv('cloth',hold);o.noCloth=cellIntent().bad;for(let i=0;i<hold;i++)addItem('cloth');
 // montar de novo e dormir
 face(cx0,cy0,0);cellBuild();const bed=bedList()[0];
 P.x=bed.x+8;P.y=bed.y+30;P.face=-Math.PI/2;
 dark=0;const sp0=findSleepSpot();o.spotFound=!!sp0&&!!sp0.slot;o.dayBlock=sleepBlock();
 dark=1;T=DAY_SECONDS*0.55;let t=T;
 // tem alvo "DORMIR" por perto
 P.x=bed.x+8;P.y=bed.y+22;P.face=-Math.PI/2;const tg=pickTarget();o.tg=tg&&tg.k;
 // dormir sem telhado: +22
 P.hp=40;P.food=80;P.water=80;P.bleed=0;P.sick=0;zombies.length=0;GH.on=false;
 const sp=findSleepSpot();trySleep(sp);o.sleeping=!!P.sleeping&&P.sleeping.ref===bed;
 o.sleepPos=Math.abs(P.x-(bed.x+8))<1&&Math.abs(P.y-(bed.y+8))<1;
 const hp1=P.hp;sleepSkipApply(T);o.gain=P.hp-hp1;o.woke=!P.sleeping;
 o.wakePos=!wallBlocks(bed.x+8,bed.y+8,P.x,P.y);
 // dormir sob telhado: +35 (telhado precisa de apoio: parede ja esta na borda direita)
 P.tool='roof';face(cx0,cy0,0);cellBuild();o.roofOver=roofList().some(c=>c.x===cx0&&c.y===cy0);o.covered=bedCovered(bed);
 P.x=bed.x+8;P.y=bed.y+22;P.hp=40;P.food=80;P.water=80;P.tool='mattress';
 const sp2=findSleepSpot();trySleep(sp2);const hp2=P.hp;sleepSkipApply(T);o.gainRoof=P.hp-hp2;
 // ocupada por outro jogador
 remotePlayers.x={x:bed.x+8,y:bed.y+8,sl:{s:'t',hx:0,hy:-4},alive:true};P.x=bed.x+8;P.y=bed.y+22;const sp3=findSleepSpot();o.full=!!sp3&&!!sp3.full;delete remotePlayers.x;
 // canteiro nao nasce embaixo da cama
 o.soil=typeof soilBad==='function'?soilBad(bed.x+8,bed.y+8):'n/a';
 // save e carregar
 const pk=JSON.parse(JSON.stringify(cellPack()));cellLoad(null);o.cleared=bedList().length;cellLoad(pk);o.reload=bedList().length+':'+(bedList()[0]&&bedList()[0].s);
 cellLoad({b:[[-1,2,'t'],['a',1],null,[3,3,'zz']]});o.badLoad=bedList().length+':'+(bedList()[0]&&bedList()[0].s);cellLoad(pk);
 // multiplayer
 cellRemote({k:'b',x:7,y:7,on:1,s:'l'});o.remote=bedList().find(q=>q.cx===7&&q.cy===7)&&bedList().find(q=>q.cx===7&&q.cy===7).s;cellRemote({k:'b',x:7,y:7,on:0});o.remoteDel=!bedList().find(q=>q.cx===7&&q.cy===7);
 cellRemote({k:'b',x:-3,y:7,on:1});cellRemote({k:'b',x:'q',y:7,on:1});o.remoteBad=bedList().length===1;
 // desenho sem erro nas 4 direcoes
 for(const sd of ['t','b','l','r'])cellRemote({k:'b',x:20+'tblr'.indexOf(sd)*2,y:20,on:1,s:sd});drawBeds(0,WW,0,WH);o.drawn=bedList().length;
 return o;});
console.log(JSON.stringify(r));
ok(r.rec&&r.tool&&r.recCost[0]===3&&r.recCost[1]===2,'fabrica a cama como ferramenta (3 madeiras, 2 panos)');ok(r.spot,'achou area livre');
ok(!r.i0.bad&&r.placed===1&&r.cost[0]===2&&r.cost[1]===3,'monta no quadrado da frente por 2 madeiras e 3 panos');ok(r.side==='r','cabeceira do lado oposto ao jogador');
ok(r.again==='REMOVE'&&r.keeps===1&&r.removed===0&&r.refund[0]===2&&r.refund[1]===3,'botao sobre ele desmonta e devolve tudo (segurar nao desmonta)');
ok(r.sideWall==='r','cabeceira vira para a parede');ok(r.noCloth==='Falta pano','sem pano');
ok(r.spotFound&&r.dayBlock==='Você só consegue dormir à noite','de dia nao dorme');ok(r.tg==='bed','botao enxerga a cama (DORMIR)');
ok(r.sleeping&&r.sleepPos,'deita na cama');ok(r.woke&&r.gain===22,'dorme sem telhado: +22 de vida (deu '+r.gain+')');ok(r.wakePos,'acorda do lado da cama, sem atravessar parede');
ok(r.roofOver&&r.covered&&r.gainRoof===35,'dorme sob telhado: +35 de vida (deu '+r.gainRoof+')');ok(r.full,'cama ocupada por outro jogador');ok(/cama/i.test(r.soil||''),'nao da para arar embaixo da cama ('+r.soil+')');
ok(r.cleared===0&&/^1:r$/.test(r.reload),'save e carregar mantem a cama e a cabeceira ('+r.reload+')');ok(r.badLoad==='1:t','save com lixo nao quebra ('+r.badLoad+')');
ok(r.remote==='l'&&r.remoteDel&&r.remoteBad,'multiplayer poe, tira e ignora dados invalidos');ok(r.drawn===5,'desenha nas quatro direcoes');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
