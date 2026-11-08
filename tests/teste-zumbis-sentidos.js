/* Sentidos do zumbi: quem esta longe nao e puxado pelos passos de quem corre; ele so reage ao que enxerga (alcance e linha de visao)
   ou ouve de perto, e ao perder o jogador de vista vai ao ULTIMO lugar onde o viu, nao ao lugar onde ele esta agora.
   Uso: node tests/teste-zumbis-sentidos.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;if(window.logList)logList().length=0;decorations.length=0;vehicles.length=0;campfires.length=0;rebuildSolidGrid();P.inside=null;P.dead=false;dark=0;
 const o={};
 // area aberta
 let bx=0,by=0,found=false;for(let i=0;i<3000&&!found;i++){bx=300+((i*53)%120)*16;by=300+((i*29)%80)*16;let free=true;for(let dx=-4;dx<=32&&free;dx++)for(let dy=-4;dy<=4&&free;dy+=2){const x=bx+dx*10,y=by+dy*10;if(bldNear(x,y,24)||pointInLake(x,y)||solidPoint(x,y,10))free=false;}if(free)found=true;}   // corredor livre de -40 a +320 px
 o.spot=found;
 const mk=(dx,dy,kind)=>{zombies.length=0;spawnZ(bx+dx,by+dy,kind===undefined?0:kind);const z=zombies[0];z.tx=z.x;z.ty=z.y;z.wt=99;return z;};
 const run=(z,sec,fn)=>{for(let t=0;t<sec;t+=.05){if(fn)fn(t);updateZ(z,.05);}};
 const place=(sprint,moving)=>{P.x=bx;P.y=by;P.sprint=sprint;P.moving=moving;P.hp=100;};
 // 1. correndo, zumbi a 200 px com linha de visao: nao reage (antes o alcance era 185 x 1.2 e a coleira 370)
 place(true,true);let z=mk(200,0);run(z,6,()=>{z.hp=z.max;});o.far={lock:z.lock,alert:z.alert,seen:!!z.seen,d:Math.round(Math.hypot(z.x-P.x,z.y-P.y))};
 // 2. correndo, zumbi a 100 px: enxerga e vem
 place(true,true);z=mk(100,0);run(z,2,()=>{z.cd=9;});o.near={lock:z.lock>0,seen:!!z.seen,closer:Math.hypot(z.x-P.x,z.y-P.y)<100};
 // 3. andando, a 120 px: nao enxerga (alcance 95)
 place(false,true);z=mk(120,0);run(z,3,()=>{z.cd=9;});o.walk120=z.lock;
 // 4. parado, a 70 px: nao enxerga (alcance 52)
 place(false,false);z=mk(70,0);run(z,3,()=>{z.cd=9;});o.still70=z.lock;
 // 5. perseguindo, perde de vista: vai ao ultimo lugar visto e nao segue o jogador
 place(true,true);z=mk(110,0);run(z,1,()=>{z.cd=9;});o.chasing=z.lock>0;
 // o jogador foge correndo (78 px/s); guarda o ultimo lugar visto que o zumbi teve
 let seenAt=null,minD=1e9;
 run(z,12,()=>{P.x-=78*.05;if(z.lastSeen)seenAt={x:z.lastSeen.x,y:z.lastSeen.y};if(seenAt)minD=Math.min(minD,Math.hypot(z.x-seenAt.x,z.y-seenAt.y));z.cd=9;});
 o.lostLock=z.lock;o.toLast=minD<20;o.lastOld=!!seenAt&&Math.hypot(seenAt.x-P.x,seenAt.y-P.y)>250;o.notFollow=Math.hypot(z.x-P.x,z.y-P.y)>250;
 // 6. audicao: passos de quem corre so chegam perto (raio 70)
 place(true,true);let zf=mk(150,0),zn=null;zombies.push(spawnZ(bx+50,by,0)||zombies[1]);zn=zombies[1];
 makeNoise(bx,by,70);o.hearFar=zf.alert;o.hearNear=zn.alert>0;
 // ... e o lugar que ele acha que foi e aproximado, mas perto
 o.hearErr=Math.hypot(zn.tx-bx,zn.ty-by)<=(12+Math.hypot(zn.x-bx,zn.y-by)*.3)*1.4143+.5;
 // 7. quem leva um golpe sabe onde esta o agressor mesmo sem ver (por um tempo curto)
 place(false,false);z=mk(300,0);damageZ(z,1,0,0,false,null);o.hurt=z.hurtT>0&&z.lock>0;run(z,1.5,()=>{z.cd=9;z.hp=z.max;});o.hurtCloser=Math.hypot(z.x-P.x,z.y-P.y)<290;
 run(z,5,()=>{z.cd=9;z.hp=z.max;});o.hurtEnds=z.hurtT===0;
 // 8. com parede no meio, nao enxerga mesmo perto (andando, 60 px)
 place(false,true);z=mk(60,0);fenceRemote({x:Math.floor((bx+30)/16),y:Math.floor(by/16)-1,d:'v',g:2});fenceRemote({x:Math.floor((bx+30)/16),y:Math.floor(by/16),d:'v',g:2});fenceRemote({x:Math.floor((bx+30)/16),y:Math.floor(by/16)+1,d:'v',g:2});
 run(z,2,()=>{z.cd=9;});o.wallSight=z.lock;
 return o;});
console.log(JSON.stringify(r));
ok(r.spot,'achou area aberta');
ok(r.far.lock===0&&r.far.alert===0&&!r.far.seen,'correndo, zumbi a 200 px nao e atraido ('+JSON.stringify(r.far)+')');
ok(r.near.lock&&r.near.seen&&r.near.closer,'correndo, zumbi a 100 px enxerga e vem');
ok(r.walk120===0,'andando, zumbi a 120 px nao enxerga');ok(r.still70===0,'parado, zumbi a 70 px nao enxerga');
ok(r.chasing&&r.lostLock===0&&r.toLast&&r.lastOld&&r.notFollow,'perdeu de vista: vai ao ultimo lugar visto e nao segue o jogador');
ok(r.hearFar===0&&r.hearNear&&r.hearErr,'passos so chegam perto (150 px nao ouve, 50 px ouve)');
ok(r.hurt&&r.hurtCloser&&r.hurtEnds,'quem leva um golpe sabe onde esta o agressor por pouco tempo');
ok(r.wallSight===0,'parede no meio bloqueia a visao');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
