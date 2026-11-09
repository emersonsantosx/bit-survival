/* Fogueira, motosserra e queimadura:
   1) a fogueira nao afasta mais nenhum monstro (antes, a noite, todos menos o Yeti eram empurrados para longe);
   2) a lamina da motosserra do Acougueiro (kind 2) machuca quem encosta nela, nao so quem encosta no corpo dele;
   3) encostar na fogueira queima por 5 s (dano pequeno por segundo), renovando enquanto estiver no fogo, e lago ou fonte apagam na hora.
   Uso: node tests/teste-fogo-serra.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';
  items.length=0;trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;if(window.logList)logList().length=0;campfires.length=0;rebuildSolidGrid();
  const o={};const X=1600,Y=1600;
  /* 1) a noite, com o jogador encostado na fogueira, o monstro chega ate ele (antes ficava parado a uns 38 px, empurrado a 70 px do fogo) */
  o.near={};
  for(const kind of [0,1,2,3,4,5,6,7,8,9])for(let tent=0;tent<3;tent++){   // ate 3 tentativas: o zumbi as vezes nasce parado (sorteio do jogo)
    if(tent===0)o.near[kind]=1e9;if(o.near[kind]<=20)break;
    campfires.length=0;campfires.push({x:X,y:Y,t:0,flicker:0});zombies.length=0;
    P.x=X+16;P.y=Y;P.hp=100;P.burn=0;P.sprint=true;P.moving=true;P.inVehicle=null;   // correndo: o monstro sempre percebe
    spawnZ(X+64,Y+3,kind);const z=zombies[0];z.tx=P.x;z.ty=P.y;
    let min=1e9;for(let t=0;t<6;t+=.05){dark=.9;z.cd=99;z.hp=z.max;P.hp=100;P.sprint=true;P.moving=true;updateZ(z,.05);min=Math.min(min,Math.hypot(z.x-P.x,z.y-P.y)-z.r-P.r);}
    o.near[kind]=z.ranged?-99:Math.min(o.near[kind],Math.round(min));   // atiradores (ranged) ficam a distancia de proposito
  }
  dark=0;
  /* 2) lamina da motosserra */
  campfires.length=0;
  const mk=(dx,dy,face)=>{zombies.length=0;spawnZ(P.x+dx,P.y+dy,2);const z=zombies[0];z.face=face;z.cd=0;return z;};
  P.x=X;P.y=Y;P.hp=100;P.inVehicle=null;P.dead=false;P._grace=0;
  let z=mk(-28,0,0);o.bladeGeom=chainsawHit(z,P.x,P.y,P.r);                   // a 28 px, de frente: a lamina alcanca
  z=mk(-28,0,Math.PI);o.bladeBehind=chainsawHit(z,P.x,P.y,P.r);               // virado para o outro lado: nao
  z=mk(-60,0,0);o.bladeFar=chainsawHit(z,P.x,P.y,P.r);                        // longe demais
  z=mk(-28,30,0);o.bladeSide=chainsawHit(z,P.x,P.y,P.r);                      // ao lado, fora da linha da lamina
  const zc=mk(-28,0,0);zc.kind=0;o.notBrute=chainsawHit(zc,P.x,P.y,P.r);        // so o Acougueiro tem motosserra
  z=mk(-28,0,0);z.tx=P.x;z.ty=P.y;P.hp=100;updateZ(z,.02);o.hurt=P.hp<100;     // no jogo: o golpe sai no primeiro quadro, antes de encostar no corpo
  z=mk(-28,0,0);P.hp=100;const wb={x:P.x-16,y:P.y-30,w:5,h:60,roofA:1,walls:[{x:P.x-16,y:P.y-30,w:5,h:60}],doors:[]};blds.push(wb);updateZ(z,.02);o.wallBlocks=P.hp===100;blds.pop();
  /* 3) queimadura */
  P.bleed=0;P.sick=0;P._tdmg=0;P.sprint=false;P.moving=false;dark=0;
  P.hp=100;P.burn=0;P.x=X+5;P.y=Y;campfires.push({x:X,y:Y,t:0,flicker:0});P.inVehicle=null;
  survivalTick(.5);o.burn1=P.burn>0&&P.hp<100;const h1=P.hp;
  P.x=X+60;let t=0;while(P.burn>0&&t<10){survivalTick(.1);t+=.1;}
  o.burnDur=Math.round(t*10)/10;o.burnDmg=Math.round((h1-P.hp)*10)/10;o.burnEnd=P.burn===0;
  P.hp=100;P.burn=0;P.x=X+5;for(let i=0;i<180;i++)survivalTick(1/60);o.renew=P.burn>4.9;   // enquanto estiver no fogo renova
  /* lago apaga na hora */
  lakes.push({cx:X+300,cy:Y,r:60,blobs:[],islands:[],pads:[],frozen:false});
  P.hp=100;P.burn=4;P.x=X+300;P.y=Y;const hh=P.hp;survivalTick(.05);o.waterOff=P.burn===0&&P.hp>=hh-.2;
  lakes.length=0;lakes.push({cx:X+300,cy:Y,r:30,fountain:true});
  P.burn=4;P.x=X+300;P.y=Y;survivalTick(.05);o.fountainOff=P.burn===0;
  /* nao se queima sem tocar */
  lakes.length=0;P.hp=100;P.burn=0;P.bleed=0;P._tdmg=0;P.x=X+30;P.y=Y;survivalTick(1);o.noTouch=P.burn===0&&P.hp>=100;
  return o;});
for(const k of [0,1,2,3,4,5,6,7,8,9])ok(r.near[k]<=20,'monstro tipo '+k+' chega ate quem esta na fogueira, a noite (folga '+r.near[k]+' px)');
ok(r.bladeGeom&&!r.bladeBehind&&!r.bladeFar&&!r.bladeSide&&!r.notBrute,'a lamina da motosserra acerta so a frente do Acougueiro, a ate ~31 px');
ok(r.hurt,'o Acougueiro machuca com a lamina antes de encostar no corpo');
ok(r.wallBlocks,'parede no meio protege da lamina');
ok(r.burn1&&r.burnEnd&&r.burnDur>=4.4&&r.burnDur<=5.2,'queimadura dura ~5 s depois de sair do fogo ('+r.burnDur+' s)');
ok(r.burnDmg>5&&r.burnDmg<12,'dano da queimadura e pequeno ('+r.burnDmg+' de 100)');
ok(r.renew,'enquanto estiver no fogo a queimadura renova');
ok(r.waterOff,'entrar num lago apaga a queimadura na hora');ok(r.fountainOff,'a fonte tambem apaga');ok(r.noTouch,'perto da fogueira, sem encostar, nao queima');
ok(errs.length===0,'sem erros de JS'+(errs.length?': '+errs[0]:''));
await b.close();process.exit(bad?1:0);})();
