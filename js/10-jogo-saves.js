/* ============ JOGO ============ */
function newGame(){
  try{
    worldSeed=1+Math.floor(Math.random()*2147483000);
    genWorld(worldSeed);
    if(!plane){throw new Error('plane não gerado');}
    P={x:plane.x+70,y:plane.y,r:5,hp:100,food:85,water:85,stam:100,temp:0,
      face:Math.PI/2,moving:false,sprint:false,exhausted:false,cd:0,swing:0,flash:0,bleed:false,dead:false,
      weapon:'fists',melee:null,meleeWeapons:[],firearms:{},ammo:0,arrows:0,
      inv:[{t:'bandage',n:1},{t:'water',n:1}],
      walk:0,inside:null,inVehicle:null};
    pushOut(P,P.r);
    populate();
    statBump('games');
    pings=[];pingCD=0;T=0;kills=0;shake=0;flash=0;spawnTimer=3;dark=0;day=1;update._lastDay=1;atkHeld=false;sprintHeld=false;
    touchGas=0;touchSteer=0;stepT=0;
    MP.active=false;remotePlayers={};
    missionsInit();
    restoreWalkHUD(); // E1: always reset vehicle HUD when starting a match
    applyHudClasses();
    buildInv();updateHud(true);
    state='play';
    curSlot=pendingSlot>0?pendingSlot:autoSlot(); pendingSlot=curSlot;
    clearSave(curSlot); // um jogo novo substitui o que estava neste slot
    saveGame(); refreshContinue(); // já cria o save do slot
    toast('Sobreviva no mapa '+selectedMap.toUpperCase()+'!');
    startAmbient();startRain();
  }catch(err){
    console.error('[newGame]',err);
    state='menu';
    showScreen('menu');
    $('hud').classList.add('hide');
    alert('Erro ao gerar o mundo: '+err.message);
  }
}
/* ============ CONTINUAR (somente jogo solo) ============
   O mundo nasce de uma semente (a mesma técnica do multiplayer), então o save guarda a semente e só o que mudou:
   jogador, tempo, árvores/pedras que restaram, itens no chão, veículos, animais, zumbis, fogueiras e manchas. */
const SAVE_KEY='minisurv_save', SAVE_PREFIX='minisurv_save_', SAVE_SLOTS=4, SAVE_VER=5, SAVE_EVERY=20;
let curSlot=0, pendingSlot=0; // curSlot = slot em uso na partida; pendingSlot = slot escolhido na tela de novo jogo
function slotKey(n){return SAVE_PREFIX+n;}
/* Save antigo (slot único) vira o 1º slot livre, uma única vez */
function migrateSaves(){
  try{
    const raw=localStorage.getItem(SAVE_KEY); if(!raw) return;
    for(let n=1;n<=SAVE_SLOTS;n++){ if(!localStorage.getItem(slotKey(n))){ localStorage.setItem(slotKey(n),raw); break; } }
    localStorage.removeItem(SAVE_KEY);
  }catch(e){}
}
/* slot livre mais antigo (ou o primeiro vazio) quando ninguém escolheu um */
function autoSlot(){
  let old=1,oldAt=Infinity;
  for(let n=1;n<=SAVE_SLOTS;n++){ const d=readSave0(n); if(!d) return n; if((d.at||0)<oldAt){oldAt=d.at||0;old=n;} }
  return old;
}
let worldSeed=0, saveT=0;
const MAP_NAMES={forest:'FLORESTA',desert:'DESERTO',snow:'NEVE',city:'CIDADE'};
const _q=(v,d)=>{const m=d===1?10:100;return Math.round(v*m)/m;};
function packObj(o){
  const r={};
  for(const k in o){
    if(k[0]==='_') continue;
    const v=o[k], t=typeof v;
    if(t==='number') r[k]=_q(v,2); else if(t==='string'||t==='boolean') r[k]=v;
  }
  return r;
}
function canSave(){
  return !!(P && worldSeed && curSlot>0 && !MP.active && !P.dead && (state==='play'||state==='pause'||state==='craft'));
}
function saveGame(){
  if(!canSave()) return false;
  try{
    const ps=JSON.parse(JSON.stringify(P,(k,v)=>(k==='inside'||k==='inVehicle'||k==='fish'||k==='sleeping'||k[0]==='_')?undefined:v));
    const data={
      v:SAVE_VER, ws:WW, at:Date.now(), map:selectedMap, seed:worldSeed, sk:SKIN_SEL,
      T:_q(T,2), day, kills, weather, weatherTimer:_q(weatherTimer,1), spawnTimer:_q(spawnTimer,1),
      P:ps, inVeh:P.inVehicle?vehicles.indexOf(P.inVehicle):-1,
      trees:trees.map(t=>[t.x,t.y,_q(t.hp,2)]),
      rocks:rocks.map(r=>[r.x,r.y,_q(r.hp,2)]),
      tn:grownPack(trees), rn:grownPack(rocks),
      items:items.map(i=>{const e=packObj(i);const t=e.t,x=e.x,y=e.y;delete e.t;delete e.x;delete e.y;const a=[t,_q(x,1),_q(y,1)];if(Object.keys(e).length)a.push(e);return a;}),
      zombies:zombies.filter(z=>!z.dead).map(z=>[_q(z.x,1),_q(z.y,1),z.kind,_q(z.hp,1),_q(z.max,1),_q(z.spd,2),z.dmg,z.si]),
      vehicles:vehicles.map(packObj), animals:animals.map(packObj), fires:campfires.map(packObj), tents:tents.map(t=>({x:Math.round(t.x),y:Math.round(t.y)})),
      decals:decals.map(d=>[_q(d.x,1),_q(d.y,1),_q(d.l,1)]),
      chests:chestList.map(c=>c.open?1:0), rl:lootStatePack(),
      ice:(()=>{const o=[];lakes.forEach((l,i)=>{if(l.holes)for(const h of l.holes)o.push([i,h.x,h.y]);});return o;})(),
      plots:plotsPack(),gh:ghPack(),
      doors:(()=>{const o=[];blds.forEach((b,bi)=>{if(b.doors)b.doors.forEach((d,di)=>{if(d.open)o.push([bi,di,d.open]);});});return o;})()
    };
    localStorage.setItem(slotKey(curSlot),JSON.stringify(data));
    return true;
  }catch(e){ console.warn('[save]',e); return false; }
}
/* o save só vale se o mundo tem o mesmo tamanho de quando foi salvo (a geração depende dele) */
function saveWorldOk(d){
  if(!d||!d.map)return false;
  const base=Math.round(3400*(WORLD_S[d.map]||1)/50)*50;
  /* a cidade tem a margem da direita aparada depois de gerada (ver genOrla), entao o WW salvo pode ser menor que o tamanho-base; a geracao continua sendo a mesma */
  return d.ws===base||(d.map==='city'&&d.ws<=base&&d.ws>=base-700);
}
function readSave(n){
  let d=null;
  try{
    const raw=localStorage.getItem(slotKey(n)); if(!raw) return null;
    d=JSON.parse(raw);
    const ok=d && d.v===SAVE_VER && saveWorldOk(d) && MAP_NAMES[d.map] && Number.isFinite(d.seed) && d.seed>0 && Number.isFinite(d.T) && d.P && Number.isFinite(d.P.hp) && d.P.hp>0
      && Array.isArray(d.trees)&&Array.isArray(d.rocks)&&Array.isArray(d.items)&&Array.isArray(d.zombies)&&Array.isArray(d.vehicles)&&Array.isArray(d.animals)&&Array.isArray(d.fires);
    if(!ok){ toast('Save do slot '+n+' incompatível com esta versão'); return null; }   // não apaga: o jogador pode recuperar com a versão certa
    return d;
  }catch(e){ clearSave(n); return null; }
}
function clearSave(n){ n=n||curSlot; if(n>0){try{localStorage.removeItem(slotKey(n));}catch(e){}} refreshContinue(); }
function refreshContinue(){
  let last=null,lastN=0,cnt=0;
  for(let n=1;n<=SAVE_SLOTS;n++){ const d=readSave0(n); if(d){cnt++; if(!last||(d.at||0)>(last.at||0)){last=d;lastN=n;}} }
  const m=$('menu'); if(m) m.classList.toggle('hasSave',cnt>0);
  const sub=$('contSub'); if(sub&&last) sub.textContent=(cnt>1?cnt+' SAVES · ':'')+'SLOT '+lastN+' · DIA '+last.day;
}
// leitura leve para o menu (não apaga nada se estiver inválido)
function readSave0(n){
  try{
    const raw=localStorage.getItem(slotKey(n)); if(!raw) return null;
    const d=JSON.parse(raw);
    return (d&&d.v===SAVE_VER&&saveWorldOk(d)&&MAP_NAMES[d.map]&&Number.isFinite(d.seed)&&d.P&&d.P.hp>0)?d:null;
  }catch(e){ return null; }
}
function continueGame(n){
  const d=readSave(n);
  if(!d){ toast('Nenhum jogo salvo'); return; }
  aud();
  closeChat(); setChatButtonVisible(false);
  const cm=$('chat-msgs'); if(cm) cm.innerHTML=''; resetChatHistory();
  if(CFG.fullscreen){ userWantsFS=true; requestFullscreenLandscape(true); } else userWantsFS=false;
  showScreen(null);
  $('hud').classList.remove('hide');
  restoreWalkHUD();
  try{
    selectedMap=d.map; worldSeed=d.seed; curSlot=n; pendingSlot=n;
    genWorld(d.seed);
    if(!plane) throw new Error('plane não gerado');
    // Tempo e clima (antes dos zumbis: a dificuldade deles depende do dia)
    T=d.T; day=Math.max(1,d.day|0); kills=d.kills|0; update._lastDay=day;
    try{missionsInit();}catch(e){}
    if(typeof d.weather==='string') weather=d.weather;
    if(Number.isFinite(d.weatherTimer)) weatherTimer=d.weatherTimer;
    spawnTimer=Number.isFinite(d.spawnTimer)?d.spawnTimer:3;
    // Árvores e pedras: o mundo base volta da semente; o save diz quais restaram e com quanta vida
    const keep=(base,saved)=>{
      const m=new Map(base.map(o=>[o.x+','+o.y,o])), out=[];
      for(const a of saved){ const o=m.get(a[0]+','+a[1]); if(o){ if(Number.isFinite(a[2])) o.hp=a[2]; out.push(o); } }
      return out;
    };
    trees=keep(trees,d.trees); rocks=keep(rocks,d.rocks);
    grownApply(trees,d.tn); grownApply(rocks,d.rn);
    items=d.items.map(a=>(Array.isArray(a)&&a[0]==='sword')?['katana'].concat(a.slice(1)):a).filter(a=>Array.isArray(a)&&typeof a[0]==='string'&&ITEMS[a[0]]&&Number.isFinite(a[1])&&Number.isFinite(a[2])).map(a=>Object.assign({t:a[0],x:a[1],y:a[2]},a[3]||{}));
    vehicles=d.vehicles.filter(v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)).map(v=>{v.driverId=null;v.spd=0;const sp=VEH[vehKind(v)];if(sp&&v.maxHp!==sp.hp){const f=Number.isFinite(v.hp)&&v.maxHp>0?v.hp/v.maxHp:1;v.maxHp=sp.hp;v.hp=Math.max(1,Math.round(sp.hp*f));}return v;});   // migra a vida para a nova tabela de veiculos
    animals=d.animals.filter(a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.y));
    campfires=d.fires.filter(c=>c&&Number.isFinite(c.x)&&Number.isFinite(c.y));
    tents=Array.isArray(d.tents)?d.tents.filter(t=>t&&Number.isFinite(t.x)&&Number.isFinite(t.y)).map(t=>({x:t.x,y:t.y})):[];
    if(Array.isArray(d.chests))d.chests.forEach((v,i)=>{if(chestList[i]&&v)chestList[i].open=true;});
    lootStateLoad(d.rl);
    if(Array.isArray(d.ice))for(const a of d.ice){const l=Array.isArray(a)&&lakes[a[0]];if(l&&l.frozen&&Number.isFinite(a[1])&&Number.isFinite(a[2])){if(!l.holes)l.holes=[];l.holes.push({x:a[1],y:a[2],r:16});}}
    plotsLoad(d.plots);ghLoad(d.gh);
    if(Array.isArray(d.doors))for(const a of d.doors){const bb=Array.isArray(a)&&blds[a[0]],dd=bb&&bb.doors&&bb.doors[a[1]];if(dd&&(a[2]===1||a[2]===2)){dd.open=a[2];if(a[2]===2)dd.hp=0;}}
    if(P){P.hold=null;}EAT=null;eatLock=false;
    decals=(d.decals||[]).map(a=>({x:a[0],y:a[1],l:Number.isFinite(a[2])?a[2]:20})).filter(a=>a.l>0);
    rebuildSolidGrid();
    // Jogador
    P=Object.assign({x:plane.x+70,y:plane.y,r:5,hp:100,food:85,water:85,stam:100,temp:0,face:Math.PI/2,moving:false,sprint:false,exhausted:false,cd:0,swing:0,flash:0,bleed:false,dead:false,
      weapon:'fists',melee:null,meleeWeapons:[],firearms:{},ammo:0,arrows:0,inv:[],walk:0},d.P,{inside:null,inVehicle:null,dead:false});
    P.hold=null;
    {const sw=k=>k==='sword'?'katana':k;if(Array.isArray(P.meleeWeapons))P.meleeWeapons=P.meleeWeapons.map(sw).filter((k,i,a)=>a.indexOf(k)===i);P.melee=sw(P.melee);P.weapon=sw(P.weapon);}
    if(!Array.isArray(P.inv)) P.inv=[];
    P.inv=P.inv.map(sl=>sl&&sl.t==='sword'?Object.assign({},sl,{t:'katana'}):sl).filter(sl=>sl&&ITEMS[sl.t]&&sl.n>0);
    if(d.inVeh>=0&&vehicles[d.inVeh]){ const v=vehicles[d.inVeh]; P.x=v.x; P.y=v.y+28; } // volta ao lado do carro em que estava
    pushOut(P,P.r);
    // Zumbis
    zombies=[];
    for(const a of d.zombies){
      if(!Array.isArray(a)||!Number.isFinite(a[0])||!Number.isFinite(a[1])) continue;
      const z=spawnZ(a[0],a[1],a[2]);
      if(Number.isFinite(a[3])) z.hp=a[3];
      if(Number.isFinite(a[4])) z.max=a[4];
      if(Number.isFinite(a[5])) z.spd=a[5];
      if(Number.isFinite(a[6])) z.dmg=a[6];
      if(Number.isFinite(a[7])){ z.si=a[7]|0; const lk=zombieLook(z.kind,z.si); z.skin=lk.skin; z.shirt=lk.shirt; }
    }
    shake=0;flash=0;dark=0;atkHeld=false;sprintHeld=false;touchGas=0;touchSteer=0;stepT=0;
    MP.active=false;remotePlayers={};
    applyHudClasses();
    buildInv();updateHud(true);
    state='play';
    AUTO.warm=3;saveT=0;
    toast('Jogo retomado: Dia '+day);
    startAmbient();startRain();
  }catch(err){
    console.error('[continueGame]',err);
    state='menu';
    showScreen('menu');
    $('hud').classList.add('hide');
    clearSave(n);curSlot=0;
    toast('Não foi possível retomar o jogo salvo');
  }
}
function buildInv(){
  const el=$('inv');el.innerHTML='';
  for(let i=0;i<MAX_SLOTS;i++){
    const b=document.createElement('button');
    b.className='slot';b.dataset.idx=i;
    const slot=P.inv[i];
    if(slot&&P.hold&&slot.t===P.hold)b.classList.add('held');
    if(slot){
      b.innerHTML=pxFit(ITEMS[slot.t].e,28,22);
      if(slot.n>1){
        const cnt=document.createElement('span');
        cnt.className='count';
        cnt.textContent=slot.n;
        b.appendChild(cnt);
      }
    }
    let pressT=null,longPressed=false;
    const startPress=e=>{
      e.preventDefault();aud();
      longPressed=false;
      pressT=setTimeout(()=>{longPressed=true;if(slot)discardItem(i);},600);
    };
    const endPress=e=>{
      if(pressT){clearTimeout(pressT);pressT=null;}
      if(!longPressed)useItem(i);
    };
    b.addEventListener('pointerdown',startPress);
    b.addEventListener('pointerup',endPress);
    b.addEventListener('pointercancel',()=>{if(pressT)clearTimeout(pressT);pressT=null;});
    b.addEventListener('pointerleave',()=>{if(pressT)clearTimeout(pressT);pressT=null;});
    b.addEventListener('contextmenu',ev=>{ev.preventDefault();if(slot)discardItem(i);});
    el.appendChild(b);
  }
  try{updatePackBadge();if(invIsOpen())refreshInvScr();}catch(e){}
}
function discardItem(i){
  const slot=P.inv[i];
  if(!slot){toast('Slot vazio');return;}
  const it=slot.t;
  const a=rnd(0,6.283),d=rnd(14,20);
  let dx=P.x+Math.cos(a)*d,dy=P.y+Math.sin(a)*d;
  if(solidPoint(dx,dy,4)){dx=P.x;dy=P.y;}
  items.push({t:it,x:dx,y:dy});
  if(MP.active) sendEvt('itemAdded', {t:it, x:dx, y:dy});
  slot.n--;
  if(slot.n<=0)P.inv.splice(i,1);
  buildInv();
  toast('Descartou: '+ITEMS[it].n);
  beep(280,.1,'triangle',.06,-80);
  for(let k=0;k<4;k++)parts.push({x:dx,y:dy,vx:rnd(-20,20),vy:rnd(-30,0),t:.4,c:'#a0a0a0'});
}
const EATABLE=it=>it==='food'||isFishItem(it)||it==='cookedfish'||it==='meat'||it==='cookedmeat'||it==='corn'||it==='cookedcorn'||it==='potato'||it==='bakedpotato'||it==='melon';
let EAT=null,eatLock=false;
/* comer uma colheita devolve 1 semente da mesma planta (o jogador nao fabrica sementes no crafting) */
const SEED_OF={corn:'seed_corn',cookedcorn:'seed_corn',potato:'seed_potato',bakedpotato:'seed_potato',melon:'seed_melon'};
let seedGain=null;
function giveSeedFor(){
  const sd=seedGain;seedGain=null;if(!sd||!P)return;
  const el=$('toast'),base=el&&el.classList.contains('show')?el.textContent:'';
  if(addItem(sd)){toast((base?base+' · ':'')+'+1 '+ITEMS[sd].n.toLowerCase().replace('sementes de ','semente de '));}
  else{   // sem espaco: a semente cai aos pes
    const it={t:sd,x:P.x+rnd(-6,6),y:P.y+rnd(2,8)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});
    toast((base?base+' · ':'')+'a semente caiu no chão (inventário cheio)');
  }
}
/* aplica o efeito de um item; devolve true se foi usado */
function applyUse(it){
  let ok=false;
  if(it==='food'){if(P.food<95){P.food=Math.min(100,P.food+35);ok=true;toast('Você comeu');}}
  else if(isFishItem(it)){if(P.food<95){P.food=Math.min(100,P.food+(it==='fish'?30:FISH[ITEMS[it].fish].food));P.water=Math.max(0,P.water-5);ok=true;if(Math.random()<.35){P.sick=25;toast('Peixe cru: você passou mal!');}else toast('Peixe cru... melhor assar');}}
  else if(it==='cookedfish'){if(P.food<95){P.temp=Math.min(100,(P.temp||0)+10);P.food=Math.min(100,P.food+55);P.hp=Math.min(100,P.hp+5);ok=true;toast('Peixe assado! +5 HP');}}
  else if(it==='meat'){if(P.food<95){P.food=Math.min(100,P.food+25);ok=true;if(Math.random()<.35){P.sick=25;toast('Carne crua: você passou mal!');}else toast('Carne crua... melhor assar');}}
  else if(it==='cookedmeat'){if(P.food<95){P.temp=Math.min(100,(P.temp||0)+10);P.food=Math.min(100,P.food+60);P.hp=Math.min(100,P.hp+8);ok=true;toast('Carne assada! +8 HP');}}
  else if(it==='corn'){if(P.food<95){P.food=Math.min(100,P.food+14);ok=true;toast('Milho cru... melhor assar');}}
  else if(it==='potato'){if(P.food<95){P.food=Math.min(100,P.food+8);ok=true;toast('Batata crua... melhor assar');}}
  else if(it==='bakedpotato'){if(P.food<95){P.temp=Math.min(100,(P.temp||0)+4);P.food=Math.min(100,P.food+28);P.hp=Math.min(100,P.hp+2);ok=true;toast('Batata assada! +2 HP');}}
  else if(it==='melon'){if(P.food<98||P.water<98){P.food=Math.min(100,P.food+10);P.water=Math.min(100,P.water+22);ok=true;toast('Melancia fresca!');}}
  else if(it==='cookedcorn'){if(P.food<95){P.temp=Math.min(100,(P.temp||0)+6);P.food=Math.min(100,P.food+32);P.hp=Math.min(100,P.hp+3);ok=true;toast('Milho assado! +3 HP');}}
  else if(it==='water'){if(P.water<95){P.water=Math.min(100,P.water+40);ok=true;toast('Você bebeu água');}}
  else if(it==='bandage'){if(P.bleed||P.hp<95){P.bleed=false;P.hp=Math.min(100,P.hp+10);ok=true;toast('Bandagem usada');track('use_bandage');}}
  else if(it==='medkit'){if(P.bleed||P.hp<90||P.sick>0){P.bleed=false;P.sick=0;P.hp=Math.min(100,P.hp+50);ok=true;toast('Kit médico usado');}}
  seedGain=(ok&&SEED_OF[it])||null;   // entregue depois que o item sai do inventario (abre vaga)
  return ok;
}
function consumeOne(it){
  const i=P.inv.findIndex(s=>s.t===it);if(i<0)return;
  P.inv[i].n--;if(P.inv[i].n<=0)P.inv.splice(i,1);
  buildInv();
}
function putAwayHold(quiet){
  if(!P||!P.hold)return false;
  P.hold=null;EAT=null;
  try{buildInv();}catch(e){}
  if(!quiet)toast('Guardou o alimento');
  return true;
}
function useItem(i){
  if(state!=='play'&&!(state==='craft'&&invIsOpen()))return;
  const slot=P.inv[i];
  if(!slot)return;
  const it=slot.t;
  // alimentos vão para a mão; o botão de ataque vira COMER
  if(EATABLE(it)){
    if(P.hold===it){putAwayHold();beep(300,.06,'triangle',.04);return;}
    if(P.inVehicle||P.sleeping){toast('Agora não dá para segurar');return;}
    P.hold=it;EAT=null;eatLock=false;
    buildInv();
    toast('Na mão: '+ITEMS[it].n+' · botão COMER');
    beep(420,.07,'triangle',.05,120);
    return;
  }
  if(it==='wood'){toast('Madeira é usada no crafting (tecla C)');return;}
  if(it==='stone'){toast('Pedra é usada no crafting (tecla C)');return;}
  if(it==='cloth'){toast('Tecido é usado no crafting (tecla C)');return;}
  const ok=applyUse(it);
  if(!ok){toast('Não precisa agora');return;}
  slot.n--;
  if(slot.n<=0)P.inv.splice(i,1);
  giveSeedFor();
  buildInv();
  beep(520,.1,'sine',.06,200);
}
/* comer segurando o botão (como no Minecraft) */
function eatStart(){
  if(!P.hold||EAT||eatLock)return;
  if(P.food>=95){toast('Sem fome agora');eatLock=true;return;}
  EAT={t:0,dur:P.hold==='food'?.9:1.2,c:0};
}
function eatTick(dt){
  if(!P)return;
  if(P.hold&&(P.dead||P.inVehicle||P.sleeping||P.fish||countInv(P.hold)<=0)){P.hold=null;EAT=null;try{buildInv();}catch(e){}}
  const held=atkHeld||reelKey;
  if(!held)eatLock=false;
  if(!EAT)return;
  if(!P.hold||!held||state!=='play'||P.dead){EAT=null;return;}
  EAT.t+=dt;EAT.c-=dt;
  if(EAT.c<=0){EAT.c=.2;beep(150+Math.random()*60,.05,'square',.035,-30);}
  if(EAT.t>=EAT.dur){
    const it=P.hold;EAT=null;eatLock=true;
    if(applyUse(it)){
      consumeOne(it);giveSeedFor();
      beep(520,.1,'sine',.06,200);
      if(countInv(it)<=0){P.hold=null;buildInv();}
    }
    P.cd=.3;
  }
}
function drawEatBar(){
  if(!EAT||!P)return;
  const w=16,f=Math.min(1,EAT.t/EAT.dur);
  R(P.x-w/2-1,P.y-27,w+2,4,'#000');
  R(P.x-w/2,P.y-26,Math.round(w*f),2,'#ffd84a');
}
function weaponList(){
  const l=['fists'];
  const owned=Array.isArray(P?.meleeWeapons)?P.meleeWeapons:[];
  for(const k of owned)if(WEAPONS[k]?.melee&&k!=='fists'&&!l.includes(k))l.push(k);
  if(P?.melee&&WEAPONS[P.melee]?.melee&&!l.includes(P.melee))l.push(P.melee);
  for(const k in (P?.firearms||{}))if(P.firearms[k]&&WEAPONS[k]?.firearm&&!l.includes(k))l.push(k);
  return l;
}
function addMeleeWeapon(key){
  if(!P||!WEAPONS[key]?.melee||key==='fists')return;
  if(!Array.isArray(P.meleeWeapons))P.meleeWeapons=[];
  if(!P.meleeWeapons.includes(key))P.meleeWeapons.push(key);
  P.melee=key;
}
function cycleWeapon(){
  if(state!=='play'||!P)return;
  if(P.hold){putAwayHold();return;}
  const l=weaponList();if(!l.length)return;
  const i=l.indexOf(P.weapon);P.weapon=l[(Math.max(-1,i)+1)%l.length];
  beep(300,.05,'square',.04);updateWeaponHud();     // o botão de trocar arma já mostra a arma: sem aviso no topo
}
const WEAPON_ICON={hoe:'hoe',fists:'fists',bat:'bat',axe:'axe',pickaxe:'pickaxe',katana:'katana',spear:'spear',bow:'bow',pistol:'pistol',smg:'smg',shotgun:'shotgun',rifle:'rifle',fishingrod:'rod'};
let weaponWheelOpen=false, weaponWheelOpenedAt=0;
function updateWeaponHud(){const el=$('wpn'),sw=$('swap');if(el)el._sig=null;if(sw)sw._sig=null;}   // o HUD redesenha a arma no próximo quadro
function closeWeaponWheel(){weaponWheelOpen=false;const el=$('weapon-wheel');if(el)el.classList.add('hide');}
function chooseWeapon(key){if(!P||!weaponList().includes(key))return;if(P.hold)putAwayHold(true);P.weapon=key;updateWeaponHud();beep(360,.06,'square',.045);closeWeaponWheel();}
function dropWeaponFromArsenal(key){
  if(!P||key==='fists'||!weaponList().includes(key)) return;
  const w=WEAPONS[key]; if(!w) return;
  // Remove do arsenal
  if(w.melee){
    P.meleeWeapons=(P.meleeWeapons||[]).filter(k=>k!==key);
    if(P.melee===key) P.melee=P.meleeWeapons[0]||null;
  }
  if(w.firearm){
    if(P.firearms) delete P.firearms[key];
  }
  if(P.weapon===key){
    P.weapon=weaponList()[0]||'fists';
    updateWeaponHud();
  }
  // Dropa no chão perto do player
  const ang=P.face||0;
  const ix=P.x+Math.cos(ang)*18, iy=P.y+Math.sin(ang)*18;
  items.push({t:key,x:ix,y:iy});
  if(MP.active) sendEvt('itemAdded',{t:key,x:ix,y:iy});
  toast('Dropou: '+(ITEMS[key]?.n||w.n)+' (pro aliado)');
  beep(220,.12,'triangle',.05);
  closeWeaponWheel();
  buildInv();
}
function buildWeaponWheel(){
  const root=$('weapon-wheel'),ring=$('weapon-wheel-ring');if(!root||!ring||!P)return;
  ring.querySelectorAll('.weapon-option,#weapon-wheel-hint').forEach(e=>e.remove());
  const list=weaponList();
  const title=$('weapon-wheel-title');if(title)title.innerHTML='ARSENAL · '+list.length+' ARMAS<br><span style="color:#aaa;font-size:10px">toque = equipar · segure 2s = dropar</span>';
  list.forEach(key=>{
    const w=WEAPONS[key];if(!w)return;
    const btn=document.createElement('button');btn.type='button';
    btn.className='weapon-option'+(key===P.weapon?' selected':'');btn.dataset.weapon=key;
    btn.innerHTML='<span class="weapon-icon">'+pxFit(WEAPON_ICON[key]||'katana',32,22)+'</span><span>'+w.n+'</span>';
    let holdT=null, holdStarted=0, dropped=false;
    const clearHold=()=>{ if(holdT){ clearTimeout(holdT); holdT=null; } };
    btn.addEventListener('pointerdown',e=>{
      e.preventDefault(); e.stopPropagation();
      dropped=false; holdStarted=performance.now();
      clearHold();
      if(key==='fists') return;
      holdT=setTimeout(()=>{
        dropped=true;
        dropWeaponFromArsenal(key);
      }, 2000);
    });
    btn.addEventListener('pointerup',e=>{
      e.preventDefault(); e.stopPropagation();
      clearHold();
      if(dropped) return;
      // Toque curto = equipar
      if(performance.now()-holdStarted<1800) chooseWeapon(key);
    });
    btn.addEventListener('pointerleave',()=>{ clearHold(); });
    btn.addEventListener('pointercancel',()=>{ clearHold(); });
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
    ring.appendChild(btn);
  });
  const hint=document.createElement('div');hint.id='weapon-wheel-hint';hint.textContent='Toque = equipar · Segure 2s = dropar no chão (aliado)';ring.appendChild(hint);
  root.classList.remove('hide');weaponWheelOpen=true;
  weaponWheelOpenedAt=performance.now();
}
function openWeaponWheel(){
  if(state!=='play'||!P||P.inVehicle||weaponWheelOpen)return;
  aud();buildWeaponWheel();
}
function nearestItem(){
  let b=null,bd=24;
  for(const it of items){const d=Math.hypot(it.x-P.x,it.y-P.y);if(d<bd){bd=d;b=it;}}
  return b;
}
/* movel de dentro de casa mais perto do jogador (distancia ate a borda do movel) */
function nearestFurn(kinds,reach){
  const b=P&&P.inside;if(!b||!b.furn||P.inVehicle)return null;
  let best=null,bd=reach;
  for(const f of b.furn){
    if(kinds.indexOf(f.k)<0)continue;
    const dx=Math.max(f.x-P.x,0,P.x-(f.x+f.w)),dy=Math.max(f.y-P.y,0,P.y-(f.y+f.h)),d=Math.hypot(dx,dy);
    if(d<bd){bd=d;best=f;}
  }
  return best;
}
function nearestStove(){const f=nearestFurn(['stove'],16);return f?{x:f.x+f.w/2,y:f.y+f.h/2,stove:true}:null;}
/* ===== O QUE O BOTAO FAZ: sempre o alvo mais PERTO do personagem =====
   Concorrem: item no chao, baú, cama/barraca, porta (abrir/fechar), torneira e veiculo. Distancia ate a borda do objeto;
   num empate (menos de 3 px) vale a ordem porta > baú > item > torneira > cama > veiculo. */
/* Alvo do botao de interagir: o que estiver MAIS PERTO do personagem (medido da borda dele ate a borda do alvo, igual para todos),
   com um pequeno desempate pela direcao em que ele olha (o que esta de frente vence o que esta nas costas).
   A porta ganha um bonus (e fina e a pessoa encosta nela de proposito) e o alvo anterior ganha folga para o botao nao ficar trocando. */
function pickTarget(){
  if(!P||P.dead||P.inVehicle)return null;
  const c=[];
  const add=(o,px,py,key)=>{o.key=key;o.px=px;o.py=py;c.push(o);};
  const rectD=(x,y,w,h)=>{const cx=clamp(P.x,x,x+w),cy=clamp(P.y,y,y+h);return {d:Math.max(0,Math.hypot(P.x-cx,P.y-cy)-P.r),px:cx,py:cy};};
  const it=nearestItem();if(it)add({k:'item',d:Math.max(0,Math.hypot(it.x-P.x,it.y-P.y)-P.r-2),b:0,it},it.x,it.y,'i'+it.x+','+it.y+it.t);
  const ch=nearestChest();if(ch)add({k:'chest',d:Math.max(0,Math.hypot(ch.x-P.x,ch.y-P.y)-P.r-3),b:0,ch},ch.x,ch.y,'c'+ch.x+','+ch.y);
  for(const q of plotCands())add(q,q.px,q.py,q.key);
  for(const q of doorCands())add({k:'door',d:q.ed,b:-3,dr:q.dr},q.px,q.py,'d'+q.dr.bi+'.'+q.dr.di);
  const tap=nearestFurn(['ksink','sink'],14);
  if(tap){const r=rectD(tap.x,tap.y,tap.w,tap.h);add({k:'tap',d:r.d,b:0,tap},r.px,r.py,'t'+tap.x+','+tap.y);}
  if(P.inside&&P.inside.furn)for(const f of P.inside.furn){
    if(!SLEEP_BED[f.k])continue;
    const r=rectD(f.x,f.y,f.w,f.h);
    if(r.d<17)add({k:'bed',d:r.d,b:0},r.px,r.py,'b'+f.x+','+f.y);
  }
  for(const t of tents){const d=Math.hypot(t.x-P.x,t.y-P.y);if(d<40)add({k:'bed',d:Math.max(0,d-12-P.r),b:0},t.x,t.y,'b'+t.x+','+t.y);}
  for(const v of vehicles){
    if(Math.hypot(v.x-P.x,v.y-P.y)>=36)continue;
    vehHalf(v);const r=rectD(v.x-v._hx,v.y-v._hy,v._hx*2,v._hy*2);
    add({k:'veh',d:r.d,b:0,v},r.px,r.py,'v'+v.id);
  }
  if(!c.length){P._ptKey=null;return null;}
  let best=null,bs=1e9;
  for(const a of c){
    let turn=0;
    if(a.d>1){const ang=Math.atan2(a.py-P.y,a.px-P.x);turn=(1-Math.cos(ang-P.face))*2.5;}   // 0 de frente, 5 nas costas
    a.s=a.d+turn+a.b-(a.key===P._ptKey?3:0);
    if(a.s<bs){bs=a.s;best=a;}
  }
  P._ptKey=best.key;
  return best;
}
function nearestCampfire(){
  let b=null,bd=42;
  for(const c of campfires){const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;b=c;}}
  return b;
}
function isVehicleOccupied(v){
  if(!v) return false;
  // Local player already driving
  if(P && P.inVehicle===v) return true;
  // Marked by network
  if(v.driverId && v.driverId!==myNetId()) return true;
  // Remote player claims this vehicle
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp || rp.alive===false) continue;
    if(rp.inVehicle && (rp.vehicleId===v.id || (Number.isFinite(rp.x)&&Math.hypot(rp.x-v.x,rp.y-v.y)<18))) return true;
  }
  return false;
}
function restoreWalkHUD(){
  // Always restore on-foot controls (fixes quit while driving → broken next game)
  const vh=$('veh-hud'); if(vh) vh.classList.add('hide');
  const show=['inv','atk','pick','run','swap','bpack'];
  for(const id of show){ const e=$(id); if(e) e.classList.remove('hide'); }
  touchGas=0; touchSteer=0;
}
function showVehicleHUD(){
  const vh=$('veh-hud'); if(vh) vh.classList.remove('hide');
  const hide=['inv','atk','pick','run','swap','bpack'];
  for(const id of hide){ const e=$(id); if(e) e.classList.add('hide'); }
}
function exitVehicle(){
  if(!P||!P.inVehicle)return;
  const v=P.inVehicle;
  if(v.driverId===myNetId()) v.driverId=null;
  v.spd=0;
  { // procura um ponto livre ao redor do carro (nunca dentro de casa, parede, árvore, lago ou cerca)
    const okAt=(x,y)=>{
      for(const b of blds)if(x>b.x-9&&x<b.x+b.w+9&&y>b.y-9&&y<b.y+b.h+9)return false;
      if(pointInLake(x,y)||nearFountain(x,y))return false;
      if(x<20||y<20||x>WW-20||y>WH-20)return false;
      const q={x:x,y:y};pushOut(q,6);
      return Math.hypot(q.x-x,q.y-y)<.6;
    };
    let best=null;
    const base=v.face+1.57;
    outer:for(const d of [26,34,44,56,70]){
      for(const a of [0,3.1416,.7,-.7,2.4,-2.4,1.57,-1.57,.35,-.35,2.8,-2.8]){
        const x=v.x+Math.cos(base+a)*d,y=v.y+Math.sin(base+a)*d;
        if(okAt(x,y)){best=[x,y];break outer;}
      }
    }
    if(best){P.x=best[0];P.y=best[1];}
    else{P.x=v.x+Math.cos(base)*25;P.y=v.y+Math.sin(base)*25;}
  }
  P.inVehicle=null;
  restoreWalkHUD();
  if(MP.active) sendEvt('vehicleExit', {id:v.id});
  toast('Saiu do veículo');beep(300,.1,'square',.05);
}
function startVehicleDeath(v){
  if(!v || v.dying) return;
  v.dying=true;
  v.hp=0;
  v.spd=0;
  v.explodeT=5;
  v.driverId=null;
  toast(P&&P.inVehicle===v ? 'Carro destruído! Saia em 5s ou você morre!' : 'Carro destruído! Explode em 5s');
  boom(0.25,0.15,300);
  beep(100,.3,'sawtooth',.06,-40);
  if(MP.active) sendEvt('vehicleDying', {id:v.id});
}
/* o veículo atingido sofre o dano; no multiplayer quem decide é o dono daquele veículo (host para os parados) */
function hitOtherVehicle(o,dmg){
  if(!o||o.destroyed||o.dying||!(dmg>0))return;
  if(!MP.active||!MP.connected){carTakeHit(o,dmg);return;}
  if(MP.isHost&&(!o.driverId||o.driverId===myNetId())){carTakeHit(o,dmg);return;}
  sendEvt('vehDmg',{id:o.id,dmg:+dmg.toFixed(1)}); // convidado batendo (o host aplica) ou host batendo no carro do convidado
}
function updateVehicles(dt){
  for(const o of vehicles)if(o._vhCD>0)o._vhCD-=dt;
  for(const v of vehicles){
    if(v.showHp>0) v.showHp-=dt;
    if(!v.dying) continue;
    v.explodeT=(v.explodeT||0)-dt;
    // Fumaça contínua
    if(Math.random()<dt*18){
      parts.push({x:v.x+rnd(-6,6),y:v.y-8,vx:rnd(-12,12),vy:rnd(-35,-10),t:rnd(0.6,1.4),c:Math.random()<.5?'#555':'#333'});
    }
    if(Math.random()<dt*8){
      parts.push({x:v.x+rnd(-4,4),y:v.y-6,vx:rnd(-8,8),vy:rnd(-50,-20),t:rnd(0.3,0.7),c:'#ff6020'});
    }
    if(v.explodeT<=0 && !v.destroyed){
      // Explosão
      v.destroyed=true;
      v.dying=false;
      boom(0.6,0.35,180);
      addPulse(v.x,v.y,120,.7,'o');
      beep(60,.4,'sawtooth',.1,-80);
      shake=Math.max(shake,8);
      for(let i=0;i<28;i++){
        parts.push({x:v.x,y:v.y,vx:rnd(-120,120),vy:rnd(-140,40),t:rnd(0.4,1.0),c:pick(['#ff4020','#ff8020','#ffe060','#333','#666'])});
      }
      const driverStillInside = !!(P && P.inVehicle===v);
      if(driverStillInside){
        // Não saiu a tempo → morre na explosão
        P.inVehicle=null;
        restoreWalkHUD();
        if(v.driverId===myNetId()) v.driverId=null;
        if(MP.active) sendEvt('vehicleExit', {id:v.id});
        toast('Você explodiu com o carro!');
        die();
      } else if(P && !P.dead && Math.hypot(P.x-v.x,P.y-v.y)<70){
        // quanto mais perto da explosão, mais dano (de ~50 colado no carro até ~5 na borda)
        const dd=Math.hypot(P.x-v.x,P.y-v.y);
        hurt(Math.round(5+45*Math.pow(1-dd/70,1.3)),0.3);
        toast('Explosão do carro!');
      }
      for(const z of zombies){
        if(z.dead) continue;
        const d=Math.hypot(z.x-v.x,z.y-v.y);
        if(d<70) damageZ(z, 15, (z.x-v.x)*4, (z.y-v.y)*4);
      }
      if(MP.active) sendEvt('vehicleExploded', {id:v.id, x:Math.round(v.x), y:Math.round(v.y)});
    }
  }
}
function cookOf(t){
  if(isFishItem(t))return {out:'cookedfish',n:(FISH[ITEMS[t].fish]||{yield:1}).yield};
  if(t==='meat')return {out:'cookedmeat',n:1};
  if(t==='corn')return {out:'cookedcorn',n:1};
  if(t==='potato')return {out:'bakedpotato',n:1};
  return null;
}
function pickup(){
  if(state!=='play')return;
  if(P.inVehicle){exitVehicle();return;}
  if(P.fish){cancelFishing(P.fish.ph===2?'Você soltou a linha':'Você recolheu a linha');return;}
  if(P.sleeping){wakeUp(false);return;}

  const cf=nearestCampfire()||nearestStove();
  const ck=cf&&P.hold?cookOf(P.hold):null;
  if(ck){ // só assa o que está na mão
    const raw=P.hold;
    removeInv(raw,1);
    if(!addItem(ck.out,ck.n)){
      for(let q=0;q<ck.n;q++)items.push({t:ck.out,x:P.x+q*3,y:P.y});
      if(MP.active) sendEvt('itemAdded', {t:ck.out, x:P.x, y:P.y});
    }
    if(countInv(raw)<=0){P.hold=null;EAT=null;buildInv();}
    track('cook');
    toast(ck.n>1?ITEMS[ck.out].n+'! x'+ck.n:ITEMS[ck.out].n+'!');
    cookSizzle();
    for(let i=0;i<8;i++)parts.push({x:cf.x+rnd(-8,8),y:cf.y-6,vx:rnd(-20,20),vy:rnd(-60,-20),t:.6,c:'#ffd27a'});
    return;
  }
  const TG=pickTarget();   // alvo mais perto do personagem (porta, cama, baú, torneira, item ou veiculo)
  {const tap=TG&&TG.k==='tap'&&TG.tap;   // torneira da pia (cozinha e banheiro): bebe direto ou enche uma garrafa
    if(tap){
      if(P.water<97){P.water=Math.min(100,P.water+14);toast('Você bebeu água da torneira');}
      else{if(!addItem('water')){toast('Sede saciada · inventário cheio');return;}toast('Garrafa enchida na torneira');}
      beep(430,.1,'sine',.045);
      for(let i=0;i<5;i++)parts.push({x:tap.x+tap.w/2+rnd(-4,4),y:tap.y+tap.h/2,vx:rnd(-10,10),vy:rnd(-30,-10),t:.35,c:'#8cc8f0'});
      return;
    }
    const st=!TG&&!P.hold&&nearestStove();
    if(st){toast('Segure carne, peixe ou milho crus para assar no fogão');return;}
  }
  if(TG&&TG.k==='chest'){openChest(TG.ch,false);return;}
  if(TG&&TG.k==='plot'){plotDo(TG);return;}
  if(TG&&TG.k==='door'){setDoor(TG.dr,TG.dr.open?0:1);return;}
  if(TG&&TG.k==='bed'){const sp=findSleepSpot();if(sp){trySleep(sp);return;}}
  // Pesca no lago (só Floresta/Neve) — inventário local de cada player (sem sync de item no chão)
  if(ORLA&&inSea(P.x,P.y)&&!nearFountain(P.x,P.y)&&!TG){ toast('Água salgada, não dá pra beber'); beep(140,.06,'square',.04); return; }
  if((pointInLake(P.x,P.y)||nearFountain(P.x,P.y)) && mapHasLake() && !TG){ // item solto por perto tem prioridade sobre a água
    if(P.water<97){
      P.water=Math.min(100,P.water+14);
      toast(selectedMap==='city'?'Você bebeu água da fonte':selectedMap==='snow'?'Você bebeu água gelada do lago':(selectedMap==='desert'?'Você bebeu água do oásis':'Você bebeu água do lago'));
    } else {
      // Sede saciada: enche uma garrafa (empilha no inventário)
      if(!addItem('water')){ toast('Sede saciada · inventário cheio'); return; }
      toast('Garrafa enchida');
    }
    beep(430,.1,'sine',.045);
    for(let i=0;i<5;i++)parts.push({x:P.x+rnd(-5,5),y:P.y,vx:rnd(-12,12),vy:rnd(-30,-10),t:.35,c:'#8cc8f0'});
    return;
  }

  // Choose nearest interactable: ground item vs vehicle (fixes item blocked by car)
  const it=nearestItem();
  let nv=null,ndCar=36;
  for(const v of vehicles){const d=Math.hypot(v.x-P.x,v.y-P.y);if(d<ndCar){ndCar=d;nv=v;}}
  const dItem=it?Math.hypot(it.x-P.x,it.y-P.y):1e9;
  const preferItem=TG&&TG.k==='item'?true:(TG&&TG.k==='veh'?false:(it && dItem<=24 && dItem<=ndCar));
  if(TG&&TG.k==='veh'){nv=TG.v;ndCar=0;}

  if(nv && !preferItem){
    if(!nv.looted){
      // E2: only mark looted AFTER successful loot (don't lose item on full bag)
      const found=wpick(LOOT.car);
      if(found==='ammo'){
        const n=rint(5,12);P.ammo+=n;toast('+'+n+' munição');
        nv.looted=true; if(MP.active) sendEvt('vehicleLooted', { id: nv.id });
      } else if(found==='pistol'){
        if(P.firearms.pistol){P.ammo+=6;toast('+6 munição');}
        else{P.firearms.pistol=true;P.ammo+=6;P.weapon='pistol';updateWeaponHud();toast('Pegou: Pistola (+6 munição)');}
        nv.looted=true; if(MP.active) sendEvt('vehicleLooted', { id: nv.id });
      } else {
        if(!addItem(found)){toast('Inventário cheio');beep(140,.08,'square',.05);return;}
        toast('Achou: '+ITEMS[found].n);
        nv.looted=true; if(MP.active) sendEvt('vehicleLooted', { id: nv.id });
      }
      beep(620,.12,'square',.05);
      return;
    } else {
      if(nv.destroyed || nv.dying || (nv.hp!==undefined && nv.hp<=0)){
        toast('Veículo destruído!');beep(160,.08,'square',.05);return;
      }
      if(isVehicleOccupied(nv)){
        toast('Veículo ocupado!');beep(160,.08,'square',.05);return;
      }
      if(nv.hp===undefined){ nv.hp=100; nv.maxHp=100; }
      P.inVehicle=nv;nv.spd=0;nv.driverId=myNetId();nv.showHp=3;
      showVehicleHUD();
      if(MP.active) sendEvt('vehicleEnter', {id:nv.id, driver:myNetId()});
      toast(vehKind(nv)==='atv'?'Pilotando o quadriciclo':vehKind(nv)==='sled'?'Pilotando a moto de neve':vehKind(nv)==='buggy'?'Pilotando o buggy':'Dirigindo');beep(440,.15,'square',.06);return;
    }
  }

  if(!it){
    const cc=nearestCactus();
    if(cc){
      if(P.water>=95){toast('Sem sede agora');return;}
      cc.sap=T+150;P.water=Math.min(100,P.water+16);toast('Seiva do cacto: +16 sede (espetou a mão)');hurt(2,0);beep(430,.1,'sine',.045);
      for(let i=0;i<5;i++)parts.push({x:cc.x+rnd(-4,4),y:cc.y-8,vx:rnd(-12,12),vy:rnd(-30,-10),t:.35,c:'#9ad8a0'});
      return;
    }
    if(cf&&!P.hold&&(firstFishItem()||countInv('meat')>0||countInv('corn')>0||countInv('potato')>0)){toast('Segure o alimento cru na mão para assar');return;}
    toast('Nada por perto');return;}
  const t=it.t;
  if(t==='ammo'){const n=rint(5,10);P.ammo+=n;toast('+'+n+' munição');}
  else if(t==='arrows'){
    const n=rint(4,8);P.arrows=(P.arrows||0)+n;toast('+'+n+' flechas');
  }
  else if(t==='pistol'||t==='smg'||t==='shotgun'||t==='rifle'||t==='bow'){
    // Já tem essa arma? Deixa no chão pro outro player
    if(P.firearms[t]){
      // no multiplayer a arma só fica no chão se o aliado ainda não tem; se os dois já têm, vira munição como no solo
      if(MP.active&&!allyHasFirearm(t)){ toast('Você já tem '+ITEMS[t].n+': deixe pro parceiro'); return; }
      // a arma repetida vira munição e some do chão, sem trocar a arma da mão
      if(t==='bow'){ P.arrows=(P.arrows||0)+6; toast('Você já tem Arco: +6 flechas'); }
      else { P.ammo+=8; toast('Você já tem '+ITEMS[t].n+': +8 munição'); }
    }else{
      P.firearms[t]=true;
      if(t==='bow'){ P.arrows=(P.arrows||0)+6; P.weapon='bow'; toast('Pegou: Arco (+6 flechas)'); }
      else { P.ammo+=8; P.weapon=t; toast('Pegou: '+ITEMS[t].n+' (+8 munição)'); }
    }
    updateWeaponHud();
  }
  else if(t==='turban'){
    if(P[t]){toast('Você já veste isso'+(MP.active?': deixe pro parceiro':''));return;}
    P[t]=true;toast('Turbante vestido! Menos calor no deserto');
    try{refreshInvScr();}catch(e){}
  }
  else if(t==='backpack'){
    if(P.pack){toast('Você já tem uma mochila'+(MP.active?': deixe pro parceiro':''));return;}
    P.pack=true;buildInv();toast('Mochila equipada! Agora você carrega 12 itens');
  }
  else if(t==='bat'||t==='axe'||t==='pickaxe'||t==='katana'||t==='spear'||t==='fishingrod'||t==='hoe'){
    if((P.meleeWeapons||[]).includes(t) || P.melee===t){
      toast('Você já tem '+ITEMS[t].n+(MP.active?': deixe pro parceiro':'')); return;
    }
    addMeleeWeapon(t);P.weapon=t;updateWeaponHud();toast('Pegou: '+ITEMS[t].n);
  }
  else {
    if(!addItem(t)){toast('Inventário cheio');return;}
    toast('Pegou: '+ITEMS[t].n);
  }
  lootTaken(it);
  items.splice(items.indexOf(it), 1);
  if(MP.active) sendEvt('itemRemoved', { x: it.x, y: it.y });
  beep(660, .07, 'square', .04);
}
function scareAnimals(x,y,r){ // tiro e explosão: caça e animais mansos disparam para longe
  if(MP.active&&!MP.isHost)return;
  for(const a of animals){
    if(a.dead||ANIMAL_AGGRO[a.k])continue;
    const d=Math.hypot(a.x-x,a.y-y);if(d>r*.6||d<1)continue;
    a.flee=2.8;a.fsp=62;a.face=Math.atan2(a.y-y,a.x-x)+rnd(-.5,.5);
  }
}
function makeNoise(x,y,r){
  try{scareBirds(x,y,r);scareAnimals(x,y,r);}catch(e){}
  for(const z of zombies){
    if(z.dead)continue;
    const d=Math.hypot(z.x-x,z.y-y);
    if(d<r){
      z.alert=Math.max(z.alert||0,7);z.tx=x+rnd(-12,12);z.ty=y+rnd(-12,12);z.heardAt=T||0;
      if(d<r*.48){for(const other of zombies){if(other===z||other.dead)continue;if(Math.hypot(other.x-z.x,other.y-z.y)<95){other.alert=Math.max(other.alert||0,4);other.tx=x+rnd(-24,24);other.ty=y+rnd(-24,24);}}}
    }
  }
}
function hurt(n,bleedChance){
  if(P.dead)return;
  if(P.inVehicle)return; // dentro de um veículo o jogador nunca leva dano: só o veículo sofre
  if(P._grace>0)return; // acabou de reconectar
  if(P.sleeping)wakeUp(true);
  if(EAT){EAT=null;eatLock=true;}
  P.hp-=n;flash=.45;shake=4;
  if(P.fish)cancelFishing('A linha se soltou!');
  if(Math.random()<bleedChance&&!P.bleed){P.bleed=true;toast('Você está sangrando!');}
  beep(120,.18,'sawtooth',.07,-60);
  if(P.hp<=0)die();
}
/* Dano de zumbi: dentro do carro o jogador fica protegido e o carro e quem sofre (20% do dano) */
function carTakeHit(v,dmg){
  if(!v||v.dying||v.destroyed)return;
  if(v.hp===undefined){v.hp=100;v.maxHp=100;}
  v.hp-=dmg;v.showHp=3;shake=Math.max(shake,2);
  const now=performance.now();
  if(now-(v._zFx||0)>350){v._zFx=now;beep(90,.08,'square',.05);addFloater(v.x,v.y-18,'-'+Math.max(1,Math.round(dmg)),'#ff8040');}
  if(v.hp<=0&&!v.dying)startVehicleDeath(v);
}
function zombieHurt(n,bleedChance){
  if(P&&P.inVehicle){carTakeHit(P.inVehicle,n*0.2);} // quem está no veículo não se machuca; só o veículo sofre (20% do dano)
  else hurt(n,bleedChance);
}
/* Dano de animal agressivo: igual ao de zumbi — dentro do carro o jogador fica protegido e o carro sofre 20% do dano */
function animalHurt(n,bleedChance){
  if(P&&P.inVehicle){carTakeHit(P.inVehicle,n*0.2);}
  else hurt(n,bleedChance);
}
function isOtherPlayerAlive(){
  if(!MP.active || !MP.connected) return false;
  const keys=Object.keys(remotePlayers);
  // If we haven't received teammate data yet, assume they are still alive
  if(keys.length===0) return true;
  for(const id of keys){
    const rp=remotePlayers[id];
    if(rp && rp.alive!==false) return true;
  }
  return false;
}
function showDeathScreen(canRespawn){
  const best=Math.max(+(LSget()||0),Math.floor(T));LSset(best);
  const title=$('deadtitle');
  const txt=$('deadtxt');
  const btnAgain=$('again');
  const btnRespawn=$('btnRespawn');
  if(canRespawn){
    if(title) title.textContent='VOCÊ MORREU';
    if(txt) txt.textContent='Seu amigo ainda está vivo! Você pode ressuscitar e voltar à luta.';
    if(btnRespawn) btnRespawn.style.display='';
    if(btnAgain) btnAgain.style.display='none';
  } else {
    if(title) title.textContent=MP.active?'FIM DE JOGO':'VOCÊ MORREU';
    if(txt) txt.textContent=(P._ghostKill?'Algo estava naquele cômodo. ':'')+'Você sobreviveu '+fmt(T)+' ('+day+' dia'+(day>1?'s':'')+'). Zumbis: '+kills+'. Recorde: '+fmt(best)+'.';
    if(btnRespawn) btnRespawn.style.display='none';
    if(btnAgain) btnAgain.style.display=MP.active?'none':'';
  }
  $('deadscr').classList.remove('hide');
  applyHudClasses();
}
function die(){
  if(!P || P.dead) return;
  closeWeaponWheel();closeChat();
  statBump('deaths');
  P.sleeping=null;SLP.fade=0;P.hp=0;P.dead=true;P.fish=null;atkHeld=false;sprintHeld=false;touchGas=0;touchSteer=0;
  if(P.inVehicle){ try{exitVehicle();}catch(e){} }
  restoreWalkHUD();
  beep(200,.6,'sawtooth',.08,-150);boom(.5,.3,200);

  if(MP.active){
    // Notify the other player we died
    try{ if(MP.conn&&MP.conn.open) MP.conn.send({type:'playerDied', id:myNetId()}); }catch(e){}
    const otherAlive = isOtherPlayerAlive();
    if(otherAlive){
      // Keep world running for the teammate — local is dead but can respawn
      state='dead';
      showDeathScreen(true);
      return;
    }
    // Both dead (or no teammate alive) → full game over
    MP.gameOver=true;
    try{ if(MP.conn&&MP.conn.open) MP.conn.send({type:'gameOver'}); }catch(e){}
    state='dead';
    setAmbient(0);setRain(false);
    showDeathScreen(false);
    return;
  }

  // Singleplayer: morreu, o save deste slot deixa de existir (o slot fica livre para um novo jogo)
  pendingSlot=curSlot; clearSave(curSlot); curSlot=0;
  state='dead';
  setAmbient(0);setRain(false);
  showDeathScreen(false);
}
function respawnPlayer(){
  if(!P || !MP.active || !P.dead) return;
  if(MP.gameOver) return;
  // Only allow if teammate still alive
  if(!isOtherPlayerAlive()){
    MP.gameOver=true;
    showDeathScreen(false);
    return;
  }
  // Respawn near plane or a safe offset from current area
  let rx=plane?plane.x+70:WW/2, ry=plane?plane.y:WH/2;
  // Prefer near living teammate if available
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(rp && rp.alive!==false && Number.isFinite(rp.x)){
      rx=rp.x+rnd(-40,40); ry=rp.y+rnd(-40,40);
      break;
    }
  }
  P.x=clamp(rx,20,WW-20); P.y=clamp(ry,20,WH-20);
  pushOut(P,P.r);
  P.hp=100; P.food=Math.max(P.food,55); P.water=Math.max(P.water,55);
  P.stam=100; P.bleed=false; P.sick=0; P._wk=0; P._ghostKill=false; P.dead=false; P.exhausted=false; P.temp=0; P._tc=0;
  P.cd=0; P.swing=0; P.flash=0; P.inVehicle=null;
  state='play';
  const d=$('deadscr'); if(d) d.classList.add('hide');
  applyHudClasses();
  toast('Você ressuscitou!');
  beep(520,.15,'sine',.07,200);
  startAmbient(); startRain();
  try{ if(MP.conn&&MP.conn.open) MP.conn.send({type:'playerRespawned', id:myNetId(), hp:P.hp}); }catch(e){}
}
let floaters=[];
let weatherAcc=0,splashAcc=0,vapor=[],vaporT=0;
function addFloater(x,y,txt,col){
  floaters.push({x,y,txt:String(txt),col:col||'#ffe0a0',t:0.9,vy:-28});
  if(floaters.length>24) floaters.shift();
}
/* Armadura: Brute, Chefe, Yeti e Spitter (traje) resistem; capacete do operário e do soldado também. Lança, picareta e arco perfuram */
function zArmor(z){
  const k=z.kind|0;
  if(k===3)return 2.5;
  if(k===2||k===9)return 1.5;
  if(k===4)return .8;
  if(k===0){const v=(z.si|0)%5;return v===3?1:(v===0?.5:0);}
  return 0;
}
/* Peso: quanto o zumbi resiste a empurrão e atordoamento */
function zHeavy(z){const k=z.kind|0;return (k===2||k===3||k===7||k===9)?.3:(k===8?.6:1);}
function damageZ(z,dmg,kx,ky,fromNet,wn){
  if(z.dead)return;
  const W=wn&&WEAPONS[wn]?WEAPONS[wn]:null;
  let armored=false;
  if(!fromNet){ // armadura é calculada em quem ataca; o valor final vai pela rede
    const ar=zArmor(z);
    if(ar>0){const eff=Math.max(dmg*.4,dmg-ar*((W&&W.pierce)?.3:1));armored=eff<dmg*.75;dmg=eff;}
  }
  const hv=zHeavy(z);
  z.hit=.25;z.vx+=(kx||0)*hv;z.vy+=(ky||0)*hv;z.lock=5;z.alert=0;
  if(W&&W.stun&&z.hp>0){z.stun=Math.max(z.stun||0,W.stun*hv);z.lunge=0;}
  if(armored){for(let i=0;i<4;i++)parts.push({x:z.x,y:z.y-8,vx:rnd(-60,60),vy:rnd(-50,0),t:.25,c:'#d0d4dc'});try{beep(1100,.04,'square',.04,-300);}catch(e){}}
  z._predT=0.5; // keep local prediction for 0.5s so snapshot doesn't erase guest damage
  for(let i=0;i<7;i++)parts.push({x:z.x,y:z.y-7,vx:rnd(-50,50),vy:rnd(-60,10),t:rnd(.25,.55),c:'#a01818',g:1});
  // Flash no zumbi + número de dano
  addFloater(z.x, z.y-14, Math.round(dmg*10)/10, armored?'#aab4c4':(dmg>=10?'#ff6060':'#ffe080'));
  hitFlesh();
  if(!fromNet) hitConfirm();
  shake=Math.max(shake, dmg>=10?3:1.5);
  // Only the local attacker sends the event (not when applying remote damage)
  if(MP.active && !fromNet){
    sendEvt('zombieDmg', {
      id:z.netId,
      x:Math.round(z.x), y:Math.round(z.y),
      dmg:dmg, kind:z.kind, wp:wn||''
    });
  }
  z.hp-=dmg;
  if(z.hp>0){ // reage ao golpe (no maximo ~3 vezes por segundo por zumbi, para nao virar barulheira com SMG)
    const _now=performance.now();
    if(!z._hv||_now-z._hv>320){z._hv=_now;try{zombieVoice(z,'hurt');}catch(e){}}
  }
  if(z.hp<=0){
    z.dead=true;kills++;
    try{zombieVoice(z,'death');}catch(e){}
    if(z.kind===9&&!fromNet)toast('Você derrubou o Yeti!');
    if(!fromNet){track('kill');if(z.kind===3)achStat('boss',1);}
    addFloater(z.x, z.y-20, 'KILL', '#ff4040');
    // Manchas: no maximo 24 no mapa; ao passar disso a mais antiga some (como as marcas de tiro nos jogos de FPS)
    decals.push({x:z.x,y:z.y,l:DECAL_LIFE});if(decals.length>24)decals.shift();
    for(let i=0;i<8;i++)parts.push({x:z.x,y:z.y-5,vx:rnd(-60,60),vy:rnd(-60,20),t:rnd(.3,.7),c:'#7a1010',g:1});
    // Inchado: explosão tóxica ao morrer
    if(z.bloater || z.kind===7){
      for(let i=0;i<16;i++)parts.push({x:z.x,y:z.y-4,vx:rnd(-90,90),vy:rnd(-90,30),t:rnd(.4,.8),c:'#60c040'});
      if(P && !P.dead && Math.hypot(P.x-z.x,P.y-z.y)<55){
        zombieHurt(12,.2);
        toast('Nuvem tóxica!');
      }
      // Dano ao parceiro no MP: cada client aplica se estiver perto
      try{ beep(180,.25,'sawtooth',.06,-100); }catch(e){}
    }
    if(!MP.active || MP.isHost){
      // Só zumbis comuns dropam Tecido (1 por zumbi morto); os outros tipos não dropam nada
      if((z.kind|0)===0){
        items.push({t:'cloth',x:z.x,y:z.y});
        if(MP.active) sendEvt('itemAdded', {t:'cloth', x:z.x, y:z.y});
      }
      if((z.kind|0)===9){ // Yeti: kit médico, bandagem, tecido e carne
        ['medkit','bandage','cloth','cloth','meat','meat','meat'].forEach((t,i)=>{
          const a=i*1.05,x=z.x+Math.cos(a)*12,y=z.y+Math.sin(a)*10;
          items.push({t:t,x:x,y:y});
          if(MP.active) sendEvt('itemAdded',{t:t,x:x,y:y});
        });
      }
    }
  }
}
