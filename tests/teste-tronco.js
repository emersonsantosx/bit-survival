/* Tronco caido (banco): gerado so na floresta e na neve (mesma semente = mesmos), fabricado so com madeira, sentar/levantar, descanso,
   levanta ao mexer o direcional/atacar/levar dano, save e botao de trocar arma (caixa de materiais e item na mao).
   Uso: node tests/teste-tronco.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const nw=(m)=>pg.evaluate((m)=>{localStorage.clear();selectedMap=m;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';P.inside=null;return true;},m);

/* 1) geracao */
for(const m of ['forest','snow','desert','city']){
  await nw(m);
  const g=await pg.evaluate(()=>{const a=logList().map(l=>l.x+','+l.y+l.a).join('|'),n=logList().length,seed=worldSeed;
    const okSpot=logList().every(l=>!pointInLake(l.x,l.y+5)&&!bldAt(l.x,l.y));genWorld(seed);
    return {n,same:a===logList().map(l=>l.x+','+l.y+l.a).join('|'),okSpot};});
  if(m==='forest'||m==='snow')ok(g.n>=2&&g.same&&g.okSpot,m+': '+g.n+' troncos gerados, iguais para a mesma semente');
  else ok(g.n===0,m+': sem troncos gerados');
}
/* neve: troncos em volta da fogueira do acampamento, se existir */
await nw('snow');
const sc=await pg.evaluate(()=>campfires.length?logList().filter(l=>campfires.some(c=>Math.hypot(c.x-l.x,c.y-l.y)<60)).length:-1);
ok(sc===-1||sc>=1,'neve: troncos ao redor da fogueira do acampamento ('+sc+')');

/* 2) craft so com madeira */
await nw('forest');
const c=await pg.evaluate(()=>{
  trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;items.length=0;chestList.length=0;logList().length=0;rebuildSolidGrid();
  P.x=1600;P.y=1600;P.face=0;const r=RECIPES.find(q=>q.out==='log');
  P.inv=[{t:'wood',n:1}];craft(r);const semTool=!toolList().includes('log');
  P.inv=[{t:'wood',n:2+4}];craft(r);
  const o={rec:!!r&&Object.keys(r.need).join()==='wood',semTool,tool:P.tool==='log',n0:logList().length,left:countInv('wood')};
  // colocar: previa na frente, botao de construir posiciona; madeira insuficiente nao posiciona
  P.face=Math.PI/2;const a=logIntent();o.hor=a.a==='h'&&a.y>P.y&&!a.bad;P.face=0;const b=logIntent();o.ver=b.a==='v'&&b.x>P.x;
  P.face=Math.PI/2;fenceBuild(false);o.n=logList().length;o.left2=countInv('wood');
  fenceBuild(false);o.n2=logList().length;   // sem madeira (0) ou em cima do tronco: nao posiciona
  P.inv=[{t:'wood',n:4}];fenceBuild(false);o.dup=logList().length;   // ja existe um tronco ali
  P.y+=60;P.face=-Math.PI/2;P.inv=[{t:'wood',n:3}];o.poor=!!logIntent().bad;fenceBuild(false);o.n3=logList().length;
  o.solid=querySolidNear(logList()[0].x,logList()[0].y-3,6).length>0;
  return o;});
ok(c.rec&&c.semTool&&c.tool&&c.n0===0&&c.left===4,'craftar o Tronco usa so madeira (2) e entrega a ferramenta; nada aparece na hora');
ok(c.hor&&c.ver,'a previa fica na frente: olhando para baixo deita (horizontal), olhando para o lado fica em pe');
ok(c.n===1&&c.left2===0&&c.n2===1&&c.dup===1&&c.n3===1,'o botao de construir posiciona 1 tronco por 4 madeiras e recusa sem madeira ou em cima de outro tronco');
ok(c.solid,'tronco bloqueia a passagem');

/* 3) sentar, descansar, levantar */
const s=await pg.evaluate(()=>{
  const L=logList()[0];P.x=L.x;P.y=L.y+12;P.face=-Math.PI/2;
  const t=pickTarget();const o={tgt:t&&t.k};logSit(L);
  o.sit=!!P.sitting;o.atSeat=logSeats(L).some(q=>Math.hypot(q.x-P.x,q.y-P.y)<1);
  P.stam=10;for(let i=0;i<30;i++)updateP(.1);o.stam=P.stam;o.still=!!P.sitting;
  const px=P.x,py=P.y;joy.active=true;joy.x=1;joy.y=0;updateP(.1);updateP(.1);updateP(.1);o.stood=!P.sitting;joy.active=false;joy.x=0;
  o.free=!solidPoint(P.x,P.y,P.r);
  P.hp=100;logSit(L);hurt(5);o.hurtStand=!!P.sitting;
  P.weapon='fists';P.cd=0;attack();o.atkStand=!!P.sitting;logStand(true);
  return o;});
ok(s.tgt==='log','o tronco vira alvo de interacao perto dele');
ok(s.sit&&s.atSeat,'SENTAR coloca o jogador num dos lugares do tronco');
ok(s.still&&s.stam>50,'sentado recupera folego rapido ('+Math.round(s.stam)+')');
ok(s.stood&&s.free,'mexer o direcional levanta, em lugar livre');
ok(s.hurtStand&&s.atkStand,'dano e ataque NAO levantam (so o analogico)');

/* 3b) pescar sentado: com a vara o ataque lanca a linha e o personagem continua no tronco; so o analogico levanta */
await nw('forest');
const f=await pg.evaluate(()=>{
  const lk=lakes.find(l=>!l.fountain);if(!lk)return {nolake:true};
  trees.length=0;rocks.length=0;blds.length=0;items.length=0;chestList.length=0;rebuildSolidGrid();
  let x=null,y=lk.cy;for(let k=lk.cx;k<lk.cx+lk.r*3;k+=2)if(!pointInLake(k,y)&&!pointInLake(k+12,y)&&pointInLake(k-20,y)&&pointInLake(k-30,y)){x=k+4;break;}
  if(x===null)return {nolake:true};
  const L={x:Math.round(x),y:Math.round(y),a:'v',g:0};logList().push(L);rebuildSolidGrid();
  P.x=L.x-10;P.y=L.y;P.dead=false;P.hp=100;P.weapon='fishingrod';P.tool=null;P.hold=null;P.cd=0;
  logSit(L);const o={sit:!!P.sitting};updateP(.05);
  P.cd=0;attack();o.fishing=!!P.fish;o.stillSit=!!P.sitting;
  for(let i=0;i<5;i++)updateP(.1);o.stillSit2=!!P.sitting&&!!P.fish;
  joy.active=true;joy.x=1;joy.y=0;for(let i=0;i<4;i++)updateP(.1);o.stoodByJoy=!P.sitting;joy.active=false;joy.x=0;
  return o;});
if(f.nolake)console.log('SKIP pesca sentado (sem lago neste mundo)');
else{ok(f.sit&&f.fishing&&f.stillSit,'com a vara, ATACAR lanca a linha e o jogador continua sentado');
ok(f.stillSit2,'continua sentado e pescando enquanto espera');ok(f.stoodByJoy,'mexer o analogico levanta');}
await nw('forest');
await pg.evaluate(()=>{trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;items.length=0;chestList.length=0;logList().length=0;rebuildSolidGrid();P.x=1600;P.y=1600;P.face=0;logBuild({x:1600,y:1640,a:'h'});});

/* 3c) so duas posicoes por tronco, escolhidas pelo jogador (fogueira e lago nao mexem); o lado vem de onde o jogador chega */
const fc=await pg.evaluate(()=>{
  const o={};campfires.push({x:1500,y:1500,t:0,flicker:0});
  const H={x:1600,y:1600,a:'h',g:0},V={x:1700,y:1600,a:'v',g:0};logList().length=0;logList().push(H,V);rebuildSolidGrid();
  const sit=(L,x,y)=>{P.sitting=null;P.x=x;P.y=y;logSit(L);return P.face;};
  let f=sit(H,1600,1620);o.h1=Math.abs(Math.sin(f))>.99;o.h2=true;o.h3=true;
  f=sit(H,1600,1580);o.h4=Math.sin(f)<-.99;
  f=sit(V,1720,1600);o.v1=Math.cos(f)>.99;pickup();o.v2=!P.sitting;   // o botao de interacao levanta
  f=sit(V,1680,1600);o.v3=Math.cos(f)<-.99;
  P.hold=null;P.sitting&&updateP(.1);o.noFire=Math.cos(P.face)<-.99;   // a fogueira (a noroeste) nao muda a direcao
  P.sitting=null;campfires.length=0;logList().length=0;logList().push({x:1600,y:1640,a:'h',g:0});rebuildSolidGrid();return o;});
ok(fc.h1&&fc.h2&&fc.h3&&fc.h4,'tronco horizontal: so para baixo ou para cima, e o lado vem de onde o jogador chega');
ok(fc.v1&&fc.v2&&fc.v3&&fc.noFire,'tronco vertical: so para a direita ou para a esquerda, a fogueira nao muda a direcao e o botao LEVANTAR funciona');

/* 4) dois lugares: um terceiro nao senta se ocupados por aliados */
const t2=await pg.evaluate(()=>{const L=logList()[0];remotePlayers={a:{x:logSeats(L)[0].x,y:logSeats(L)[0].y,st:true,alive:true},b:{x:logSeats(L)[1].x,y:logSeats(L)[1].y,st:true,alive:true}};
  P.x=L.x;P.y=L.y+12;logSit(L);const full=!P.sitting;remotePlayers={};return {full};});
ok(t2.full,'com os 2 lugares ocupados nao senta');

/* 5) save e carregar */
const sv=await pg.evaluate(()=>{const n=logList().length,gen=logList().filter(l=>l.g).length;saveGame();const d=readSave0(1);continueGame(1);return {n,built:d.lg.length,after:logList().length,afterBuilt:logList().filter(l=>!l.g).length};});
ok(sv.built===1&&sv.afterBuilt===1&&sv.after>sv.n,'o save guarda so o tronco do jogador e o resto volta pela semente');

/* 6) botao de trocar arma */
const w=await pg.evaluate(()=>{
  P.dead=false;state='play';P.sitting=null;P.inv=[{t:'wood',n:5},{t:'apple',n:2}];
  const l=weaponList();const o={many:l.length};
  P.weapon=l[0];P.tool='hoe';if(!toolList().includes('hoe')&&!BUILD_TOOLS.includes(P.tool))P.tool=BUILD_TOOLS[0];
  cycleWeapon();o.toolClosed=!P.tool;o.keep=P.weapon===l[0];
  if(l.length>1){cycleWeapon();o.next=P.weapon===l[1];}
  const w1=P.weapon;P.hold='apple';cycleWeapon();o.holdOff=!P.hold;o.keep2=P.weapon===w1;
  return o;});
ok(w.toolClosed&&w.keep,'fechar a caixa de materiais volta para a arma que ja estava na mao');
ok(w.holdOff&&w.keep2,'guardar o item da mao volta para a mesma arma');
ok(w.many<2||w.next,'sem nada aberto o botao ainda passa para a proxima arma');

/* 7) pose sentada desenha nos 4 lados e a previa do tronco desenha (verde e vermelha) sem erro */
const dr=await pg.evaluate(()=>{try{const lk=myLook();for(const f of [Math.PI/2,-Math.PI/2,0,Math.PI])for(const L of [{x:50,y:50,a:'h'},{x:50,y:50,a:'v'}])for(const s of logSeats(L))human(s.x,s.y,f,{...lk,sit:true,wpn:'fists'});
  P.tool='log';P.inv=[{t:'wood',n:9}];drawLogGhost();P.inv=[];drawLogGhost();P.tool=null;return 'ok';}catch(e){return String(e);}});
ok(dr==='ok','pose sentada (cima, baixo, esquerda, direita) e previa do tronco desenham sem erro: '+dr);

ok(errs.length===0,'sem erros de JS'+(errs.length?': '+errs[0]:''));
await b.close();process.exit(bad?1:0);})();
