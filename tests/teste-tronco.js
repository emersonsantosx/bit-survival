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
  P.inv=[{t:'wood',n:3}];craft(r);const sem=logList().length;
  P.inv=[{t:'wood',n:4}];craft(r);
  return {rec:!!r&&Object.keys(r.need).join()==='wood',sem,n:logList().length,left:P.inv.length,solid:querySolidNear(logList()[0].x,logList()[0].y-3,6).length>0};});
ok(c.rec&&c.sem===0&&c.n===1&&c.left===0,'tronco usa so madeira (4); sem material nao monta');ok(c.solid,'tronco bloqueia a passagem');

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
  let x=lk.cx,y=lk.cy;while(pointInLake(x,y)&&x<lk.cx+lk.r*3)x+=4;x+=26;
  const L={x:Math.round(x),y:Math.round(y),a:'v',g:0};logList().push(L);rebuildSolidGrid();
  P.x=L.x+10;P.y=L.y;P.dead=false;P.hp=100;P.weapon='fishingrod';P.tool=null;P.hold=null;P.cd=0;
  logSit(L);const o={sit:!!P.sitting};updateP(.05);
  P.cd=0;attack();o.fishing=!!P.fish;o.stillSit=!!P.sitting;
  for(let i=0;i<5;i++)updateP(.1);o.stillSit2=!!P.sitting&&!!P.fish;
  joy.active=true;joy.x=1;joy.y=0;for(let i=0;i<4;i++)updateP(.1);o.stoodByJoy=!P.sitting;joy.active=false;joy.x=0;
  return o;});
if(f.nolake)console.log('SKIP pesca sentado (sem lago neste mundo)');
else{ok(f.sit&&f.fishing&&f.stillSit,'com a vara, ATACAR lanca a linha e o jogador continua sentado');
ok(f.stillSit2,'continua sentado e pescando enquanto espera');ok(f.stoodByJoy,'mexer o analogico levanta');}
await nw('forest');
await pg.evaluate(()=>{trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;items.length=0;chestList.length=0;logList().length=0;rebuildSolidGrid();P.x=1600;P.y=1600;P.face=0;P.inv=[{t:'wood',n:4}];craft(RECIPES.find(q=>q.out==='log'));});

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

ok(errs.length===0,'sem erros de JS'+(errs.length?': '+errs[0]:''));
await b.close();process.exit(bad?1:0);})();
