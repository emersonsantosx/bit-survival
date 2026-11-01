/* ============ CRAFTING ============ */
let craftFilter='all';
function canCraft(r){for(const k in r.need)if(countInv(k)<r.need[k])return false;return true;}
function craft(r){
  if(!canCraft(r)){toast('Recursos insuficientes');beep(120,.1,'square',.05);return;}
  const out=r.out;
  // Não gasta recursos para fabricar uma arma que já está no arsenal
  if(['pickaxe','axe','katana','spear','bat','fishingrod'].includes(out)&&((P.meleeWeapons||[]).includes(out)||P.melee===out)){
    toast('Você já tem: '+ITEMS[out].n);beep(120,.1,'square',.05);return;
  }
  if(out==='bow'&&P.firearms.bow){toast('Você já tem um arco');beep(120,.1,'square',.05);return;}
  if(out==='backpack'&&P.pack){toast('Você já tem uma mochila');beep(120,.1,'square',.05);return;}
  if(out==='tent'){
    const tp=tentSpot();
    if(!tp){toast(P.inside?'Monte a barraca ao ar livre':'Sem espaço para a barraca aqui');beep(120,.1,'square',.05);return;}
    P._tp=tp;
  }
  if(out!=='campfire'&&out!=='tent'&&!['pickaxe','axe','katana','spear','bow','arrows','bat','fishingrod'].includes(out)&&out!=='backpack'&&P.inv.length>=invCap()&&!P.inv.some(slot=>slot.t===out)){toast('Inventário cheio');beep(120,.1,'square',.05);return;}
  for(const k in r.need)removeInv(k,r.need[k]);
  if(out==='tent'){
    const tp=P._tp||tentSpot()||{x:P.x+40,y:P.y};P._tp=null;
    tents.push({x:tp.x,y:tp.y});rebuildSolidGrid();
    if(MP.active){
      sendEvt('tentAdded',{x:tp.x,y:tp.y});
      if(MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
    }
    toast('Barraca montada! Chegue perto e use DORMIR à noite');buildSound();
    for(let i=0;i<10;i++)parts.push({x:tp.x+rnd(-14,14),y:tp.y,vx:rnd(-20,20),vy:rnd(-30,-8),t:.5,c:'#b8b090'});
  }else if(out==='campfire'){
    const fx=Math.cos(P.face),fy=Math.sin(P.face);
    let cx=P.x+fx*22,cy=P.y+fy*22;
    if(solidPoint(cx,cy,4)){cx=P.x+10;cy=P.y+10;}
    campfires.push({x:cx,y:cy,t:0,flicker:0});
    if(MP.active){
      sendEvt('campfireAdded', {x:cx, y:cy});
      if(MP.isHost && MP.conn && MP.conn.open){
        try{ MP.conn.send(packSnapshot()); }catch(e){}
      }
    }
    pushOut(P,P.r);
    toast('Fogueira acesa!');buildSound();boom(.3,.15,400);
    for(let i=0;i<15;i++)parts.push({x:cx,y:cy-4,vx:rnd(-30,30),vy:rnd(-70,-20),t:rnd(.5,1),c:'#ffb040'});
  }else if(out==='pickaxe'||out==='axe'||out==='katana'||out==='spear'||out==='bat'||out==='fishingrod'){
    addMeleeWeapon(out);P.weapon=out;updateWeaponHud();
    toast(out==='fishingrod'?'Fabricou: Vara de Pesca! Mire no lago e use ATACAR.':'Fabricou: '+ITEMS[out].n+'! Arma adicionada ao arsenal.');buildSound();
  }else if(out==='bow'){
    if(P.firearms.bow){ toast('Você já tem um arco'); }
    else { P.firearms.bow=true; P.arrows=(P.arrows||0)+6; P.weapon='bow'; updateWeaponHud(); toast('Fabricou: Arco (+6 flechas)'); }
    buildSound();
  }else if(out==='backpack'){
    P.pack=true;buildInv();toast('Mochila equipada! Agora você carrega 12 itens');buildSound();
  }else if(out==='arrows'){
    P.arrows=(P.arrows||0)+6; toast('+6 flechas'); buildSound();
  }else{
    if(!addItem(out)){toast('Inventário cheio');return;}
    toast('Fabricou: '+ITEMS[out].n);buildSound();
  }
  track('craft');if(out==='bandage')achStat('craft_bandage',1);if(out==='campfire')track('campfire');
  refreshCraft();
  closeCraft(); // fecha a tela para confirmar que o item foi fabricado
}
let craftReadyAt=0; // ignora toques logo apos abrir o crafting (o mesmo toque do martelo nao pode acionar CRIAR)
function openCraft(){if(state!=='play')return;state='craft';craftReadyAt=performance.now()+450;const e=$('craftscr');if(e)e.classList.remove('hide');refreshCraft();}
function closeCraft(){if(state!=='craft')return;const e=$('craftscr');if(e)e.classList.add('hide');const iv=$('invscr');if(iv)iv.classList.add('hide');state='play';}
function refreshCraft(){
  const cw=$('cw'),cs=$('cs'),cc=$('cc');if(cw)cw.textContent=countInv('wood');if(cs)cs.textContent=countInv('stone');if(cc)cc.textContent=countInv('cloth');
  const el=$('craftlist');if(!el)return;
  el.innerHTML='';
  for(const r of RECIPES){
    if(r.lake&&!mapHasLake())continue;
    if(r.once&&r.out==='backpack'&&P.pack)continue;
    const isWeapon=['pickaxe','axe','katana','spear','bow','bat'].includes(r.out),category=isWeapon||r.out==='arrows'?'weapon':'utility';
    if(craftFilter!=='all'&&craftFilter!==category)continue;
    const ok=canCraft(r);
    const row=document.createElement('div');
    row.className='craft-row '+(ok?'can':'no');
    const cost=Object.entries(r.need).map(([k,v])=>'<span class="cost-chip'+(countInv(k)<v?' lack':'')+'" title="'+(ITEMS[k]?.n||k)+'">'+(ITEMS[k]&&ITEMS[k].e?pxFit(ITEMS[k].e,16,14):(ITEMS[k]?.n||k))+'<b>'+v+'</b></span>').join('');
    const icon=pxFit(isWeapon||r.out==='arrows'||r.out==='fishingrod'?(WEAPON_ICON[r.out]||(r.out==='arrows'?'arrows':'axe')):(r.out==='bandage'?'bandage':(r.out==='backpack'?'backpack':(r.out==='tent'?'tent':'fire'))),30,24);
    row.innerHTML='<div class="recipe-icon">'+icon+'</div><div class="info"><div class="name">'+r.label+'</div><div class="cost">'+r.desc+'</div><div class="cost">Custo: '+(cost||'nenhum')+'</div><div class="status">'+(ok?pxIcon('check',2)+' Recursos suficientes':'Faltam recursos')+'</div></div>';
    const btn=document.createElement('button');
    btn.textContent='CRIAR';btn.disabled=!ok;
    btn.onclick=e=>{if(performance.now()<craftReadyAt){if(e){e.preventDefault();e.stopPropagation();}return;}aud();craft(r);};
    row.appendChild(btn);el.appendChild(row);
  }
  const tabs=$('craft-tabs');if(tabs)tabs.querySelectorAll('[data-craft-filter]').forEach(b=>b.classList.toggle('active',b.dataset.craftFilter===craftFilter));
}

/* ============ EVENTOS REPLICADOS ============ */
function sendEvt(kind, data){
  // Allow events during play AND craft (campfire is crafted in craft menu!)
  if(!MP.active || !MP.connected) return;
  if(state!=='play' && state!=='craft') return;
  if(!MP.isHost && data){
    const now=performance.now();
    if(kind==='itemRemoved')recentRemoved.push({x:data.x,y:data.y,at:now});
    else if(kind==='itemAdded')recentAdded.push({t:data.t,x:data.x,y:data.y,at:now});
  }
  mpSend({type:'evt', kind:kind, data:data});
}
function handleEvt(kind, data){
  if(!data || typeof data!=='object') return;
  if(kind==='treeDmg'){
    const t = trees.find(t => t.x===data.x && t.y===data.y);
    if(t && Number.isFinite(data.dmg)){ t.hp -= clamp(data.dmg,0,10); if(t.hp<=0){ const i=trees.indexOf(t); if(i>=0){ trees.splice(i,1); rebuildSolidGrid(); } } }
  } else if(kind==='rockDmg'){
    const r = rocks.find(r => r.x===data.x && r.y===data.y);
    if(r && Number.isFinite(data.dmg)){ r.hp -= clamp(data.dmg,0,10); if(r.hp<=0){ const i=rocks.indexOf(r); if(i>=0){ rocks.splice(i,1); rebuildSolidGrid(); } } }
  } else if(kind==='itemRemoved'){
    for(let i=items.length-1;i>=0;i--){
      if(Math.abs(items[i].x-data.x)<4 && Math.abs(items[i].y-data.y)<4){ lootTaken(items[i]); items.splice(i,1); break; }
    }
  } else if(kind==='zAtk'){
    const z=zombies.find(q=>q.netId===data.id&&!q.dead);
    if(z){z.lunge=.15;try{zombieVoice(z,'attack');}catch(e){}}
  } else if(kind==='aAtk'){
    let best=null,bd=40;for(const a of animals){if(a.dead)continue;const d=Math.hypot(a.x-data.x,a.y-data.y);if(d<bd){bd=d;best=a;}}
    if(best){best.lunge=.12;try{animalVoice(best,'attack');}catch(e){}}
  } else if(kind==='curse'){
    setTimeout(()=>{toast(data.d?'A maldição do templo desperta! Tempestade e mortos-vivos':'Uma nevasca cai e algo se move no gelo!');},900);
  } else if(kind==='bolt'){
    if(weather==='rain'&&Number.isFinite(data.d))applyBolt(clamp(data.d,.3,3));
  } else if(kind==='yeti'){
    toast('Algo enorme se move na nevasca...');
  } else if(kind==='iceBreak'){
    const l=lakes[data.l];if(l&&l.frozen&&Number.isFinite(data.x)&&Number.isFinite(data.y)&&!(l.holes||[]).some(h=>Math.abs(h.x-data.x)<4&&Math.abs(h.y-data.y)<4))addIceHole(l,data.x,data.y,true);
  } else if(kind==='doorSet'){
    const bb=blds[data.b],dd=bb&&bb.doors&&bb.doors[data.i];
    if(dd&&(data.s===0||data.s===1||data.s===2)&&!(dd.open===2&&data.s!==2))setDoor(dd,data.s,true);
  } else if(kind==='chestOpen'){
    const c=chestList.find(q=>Math.abs(q.x-data.x)<6&&Math.abs(q.y-data.y)<6);
    if(c&&!c.open)openChest(c,true);
  } else if(kind==='itemAdded'){
    if(typeof data.t==='string'&&Number.isFinite(data.x)&&Number.isFinite(data.y)&&!items.some(it=>it.t===data.t&&Math.abs(it.x-data.x)<3&&Math.abs(it.y-data.y)<3)){
      items.push({t:data.t,x:data.x,y:data.y});
    }
  } else if(kind==='campfireRemoved'){
    if(Number.isFinite(data.x)&&Number.isFinite(data.y)){
      for(let i=campfires.length-1;i>=0;i--){
        if(Math.abs(campfires[i].x-data.x)<10&&Math.abs(campfires[i].y-data.y)<10){campfires.splice(i,1);break;}
      }
    }
  } else if(kind==='tentAdded'){
    if(Number.isFinite(data.x)&&Number.isFinite(data.y)&&!tents.some(t=>Math.abs(t.x-data.x)<10&&Math.abs(t.y-data.y)<10)){
      tents.push({x:data.x,y:data.y});rebuildSolidGrid();
    }
  } else if(kind==='sleepSkip'){
    if(Number.isFinite(data.T)&&P&&P.sleeping)sleepSkipApply(clamp(data.T,0,1e7));
  } else if(kind==='campfireAdded'){
    if(Number.isFinite(data.x)&&Number.isFinite(data.y)&&!campfires.some(c=>Math.abs(c.x-data.x)<8&&Math.abs(c.y-data.y)<8)){
      campfires.push({x:data.x,y:data.y,t:0,flicker:0});
    }
  } else if(kind==='vehicleLooted'){
    const v = vehicles.find(v => v.id===data.id);
    if(v) v.looted = true;
  } else if(kind==='vehicleEnter'){
    const v = vehicles.find(v => v.id===data.id);
    if(v){
      v.driverId = data.driver || 'remote';
      // If we somehow thought we were in this car, kick us out
      if(P && P.inVehicle===v && v.driverId!==myNetId()){
        P.inVehicle=null;
        restoreWalkHUD();
        toast('Veículo já estava ocupado!');
      }
    }
  } else if(kind==='vehicleExit'){
    const v = vehicles.find(v => v.id===data.id);
    if(v){ v.driverId=null; v.spd=0; }
  } else if(kind==='ping'){
    recvPing(data);
  } else if(kind==='vehDmg'){
    const v=vehicles.find(v=>v.id===data.id);
    if(v&&Number.isFinite(data.dmg)&&data.dmg>0)carTakeHit(v,clamp(data.dmg,0,30));
  } else if(kind==='vehicleDying'){
    const v = vehicles.find(v => v.id===data.id);
    if(v && !v.destroyed){ v.dying=true; v.hp=0; v.spd=0; v.explodeT=v.explodeT||5; v.driverId=null; }
  } else if(kind==='vehicleExploded'){
    const v = vehicles.find(v => v.id===data.id);
    if(v){
      v.destroyed=true; v.dying=false; v.hp=0; v.spd=0; v.driverId=null;
      for(let i=0;i<20;i++) parts.push({x:v.x,y:v.y,vx:rnd(-100,100),vy:rnd(-120,30),t:rnd(.4,.9),c:pick(['#ff4020','#ff8020','#333'])});
      if(P && P.inVehicle===v) exitVehicle();
    }
  } else if(kind==='zombieDmg'){
    let best=null;
    // Prefer exact netId match
    if(data.id){
      best = zombies.find(z=>z.netId===data.id && !z.dead) || null;
    }
    // Fallback: nearest zombie to reported position (generous radius for lag)
    if(!best && Number.isFinite(data.x) && Number.isFinite(data.y)){
      let bd=90;
      for(const z of zombies){
        if(z.dead) continue;
        const d=Math.hypot(z.x-data.x,z.y-data.y);
        if(d<bd){bd=d;best=z;}
      }
    }
    if(best && Number.isFinite(data.dmg)){
      damageZ(best, clamp(data.dmg,0,100), 0, 0, true, (typeof data.wp==='string'&&WEAPONS[data.wp])?data.wp:null);
    }
  } else if(kind==='shot'){
    if(MP.isHost&&Number.isFinite(data.x)&&Number.isFinite(data.y))scareBirds(data.x,data.y,(WEAPONS[data.weapon]&&WEAPONS[data.weapon].heavy)?700:420); // tiro do convidado espanta as aves
    // Show remote player's gunfire tracers + muzzle flash
    if(Array.isArray(data.tracers)){
      for(const t of data.tracers){
        if(Number.isFinite(t.x1)&&Number.isFinite(t.y1)&&Number.isFinite(t.x2)&&Number.isFinite(t.y2)){
          tracers.push({x1:t.x1,y1:t.y1,x2:t.x2,y2:t.y2,t:0.12});
        }
      }
    }
    let nearest=null, nd=80;
    for(const id in remotePlayers){
      const rp=remotePlayers[id];
      if(!rp) continue;
      const d=Math.hypot((rp.x||0)-(data.x||0),(rp.y||0)-(data.y||0));
      if(d<nd){nd=d;nearest=rp;}
    }
    if(nearest){
      nearest.flash=0.12;
      nearest.swing=0.12;
      if(Number.isFinite(data.face)) nearest.face=data.face;
      if(data.weapon) nearest.weapon=data.weapon;
    }
    // Quiet gunshot so both hear each other fire
    if(data.weapon!=='bow'){ try{ gunshot(data.weapon,true); }catch(e){} }
  } else if(kind==='spit'){
    // Guest receives spitter projectile from host
    if(Number.isFinite(data.x)&&Number.isFinite(data.y)&&Number.isFinite(data.vx)&&Number.isFinite(data.vy)){
      spits.push({x:data.x,y:data.y,vx:data.vx,vy:data.vy,t:Number.isFinite(data.t)?data.t:1.4});
      try{ beep(420,.12,'sawtooth',.04,-200); }catch(e){}
    }
  } else if(kind==='mission'){
    if(Number.isInteger(data.i)&&data.i>=0&&data.i<3&&Number.isInteger(data.k)&&data.k>=0&&Number.isFinite(data.n)&&data.n>0&&data.n<=50)msAdd(data.i,data.k,data.n|0);
  } else if(kind==='animalDmg'){
    // Host aplica dano de animal causado pelo guest
    if(!MP.isHost || !Number.isFinite(data.x)) return;
    let best=null,bd=40;
    for(const a of animals){
      if(a.dead) continue;
      const d=Math.hypot(a.x-data.x,a.y-data.y);
      if(d<bd){bd=d;best=a;}
    }
    if(best) damageAnimal(best, Number.isFinite(data.dmg)?data.dmg:3, true);
  }
}

/* ============ MULTIPLAYER ============ */
function loadPeerJS(cb){
  if(MP.scriptLoaded||typeof Peer!=='undefined'){MP.scriptLoaded=true;cb&&cb();return;}
  const s=document.createElement('script');
  s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  s.onload=()=>{MP.scriptLoaded=true;cb&&cb();};
  s.onerror=()=>{alert('Não foi possível carregar PeerJS.');cb&&cb(new Error('peerjs'));};
  document.head.appendChild(s);
}
function makeRoomCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function setStatus(id,msg,isErr){const e=$(id);if(!e)return;e.textContent=msg;e.classList.toggle('err',!!isErr);}

function mpHostStart(){
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null; MP.conn=null; MP.connected=false; MP.myId=null;
  remotePlayers={}; nextZombieNetId=1; mpResetReconnect();
  const nameEl=$('hostName');
  MP.playerName=sanitizeName((nameEl&&nameEl.value)||'Host');
  if(nameEl) nameEl.value=MP.playerName;
  try{localStorage.setItem('minisurv_name',MP.playerName);}catch(e){}
  const code=makeRoomCode();
  MP.roomCode='MINISURV-'+code;MP.isHost=true;MP.active=true;
  const hc=$('hostCode');if(hc)hc.textContent=code;
  const wrap=$('hostCodeWrap');if(wrap)wrap.classList.remove('hide');
  setStatus('hostStatus','Carregando motor P2P...');
  loadPeerJS(err=>{
    if(err||typeof Peer==='undefined'){MP.active=false;MP.isHost=false;setStatus('hostStatus','Falha ao carregar P2P',true);return;}
    hostOpenPeer(false,0);
  });
}
/* Registra (ou registra de novo) o código da sala no servidor de sinalização.
   recreate=true: refaz o peer com o MESMO código (ex.: o navegador ficou em segundo plano e a sala caiu). */
let hostRetryTimer=null;
function hostOpenPeer(recreate,tries){
  const peerOpts={debug:1, config:PEER_ICE};
  if(recreate&&MP.peer){try{MP.peer.destroy();}catch(e){}}
  try{MP.peer=new Peer(MP.roomCode, peerOpts);}
  catch(e){setStatus('hostStatus','Erro: '+e.message,true);return;}
  const me=MP.peer;
  me.on('open',id=>{MP.myId=id;setStatus('hostStatus','Sala criada! Aguardando jogador...');console.log('[Host] peer aberto:',id);});
  me.on('connection',conn=>{
    console.log('[Host] nova conexão recebida');
    if(MP.conn&&MP.conn.open){
      // Em partida: se a conexão antiga está muda há >4s, é o convidado voltando — a nova assume
      const stale=MP.gameStarted&&(performance.now()-MP.lastRecv>4000);
      if(!stale){try{conn.close();}catch(e){}return;}
      const old=MP.conn;MP.conn=null;MP.connected=false;
      try{old.close();}catch(e){}
    }
    MP.conn=conn;
    setupConn(conn,true);
  });
  me.on('disconnected',()=>{ hostSignalRetry(0); }); // caiu do servidor de sinalização: volta com o mesmo código
  me.on('error',err=>{
    console.error('[PeerJS host]',err);
    if(MP.peer!==me) return; // erro de um peer antigo, já substituído
    if(MP.gameStarted)return; // em partida: erros de sinalização não derrubam o jogo
    const t=err&&err.type;
    // Sala ainda aguardando o amigo: falhas de rede/servidor (comuns com o navegador em segundo plano) não encerram a sala, só tentam de novo
    if(t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'){
      setStatus('hostStatus','Reconectando a sala...');
      hostSignalRetry(0);
      return;
    }
    // Ao refazer a sala com o mesmo código, o servidor pode demorar a liberar o anterior: tenta algumas vezes
    if(t==='unavailable-id'&&recreate&&tries<6){
      setStatus('hostStatus','Reconectando a sala...');
      clearTimeout(hostRetryTimer);hostRetryTimer=setTimeout(()=>{if(MP.isHost&&MP.active&&!MP.gameStarted&&!MP.connected)hostOpenPeer(true,tries+1);},2500);
      return;
    }
    const msg=t==='unavailable-id'
      ?'Código de sala ocupado. Volte e crie outra sala.'
      :('Falha de conexão: '+(t||'erro desconhecido'));
    setStatus('hostStatus',msg,true);
    if(!MP.connected){MP.active=false;MP.isHost=false;}
  });
}
/* Tenta voltar ao servidor de sinalização por até ~2 min, com o mesmo código */
function hostSignalRetry(n){
  const p=MP.peer;
  if(!p||p.destroyed||!MP.isHost||!MP.active) return;
  if(!p.disconnected) return;
  try{p.reconnect();}catch(e){}
  if(n<20){clearTimeout(hostRetryTimer);hostRetryTimer=setTimeout(()=>hostSignalRetry(n+1),Math.min(2000+n*1000,8000));}
}
/* Voltou do segundo plano com a sala ainda aguardando: confere se o código continua registrado */
function hostCheckRoomAlive(){
  if(!MP.active||!MP.isHost||MP.gameStarted||MP.connected||!MP.roomCode) return;
  const p=MP.peer;
  if(!p||p.destroyed){ hostOpenPeer(true,0); }
  else if(p.disconnected){ hostSignalRetry(0); }
}
function mpJoinStart(code){
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null; MP.conn=null; MP.connected=false; MP.myId=null;
  remotePlayers={}; nextZombieNetId=1; mpResetReconnect();
  const nameEl=$('joinName');
  MP.playerName=sanitizeName((nameEl&&nameEl.value)||'Convidado');
  if(nameEl) nameEl.value=MP.playerName;
  try{localStorage.setItem('minisurv_name',MP.playerName);}catch(e){}
  const clean=sanitizeRoomCode(code);
  if(clean.length<4){ setStatus('joinStatus','Código inválido',true); MP.active=false; return; }
  MP.isHost=false;MP.active=true;MP.roomCode='MINISURV-'+clean;
  setStatus('joinStatus','Carregando motor P2P...');
  loadPeerJS(err=>{
    if(err||typeof Peer==='undefined'){MP.active=false;MP.isHost=false;setStatus('joinStatus','Falha ao carregar P2P',true);return;}
    const peerOpts={debug:1, config:PEER_ICE};
    try{MP.peer=new Peer(peerOpts);}
    catch(e){setStatus('joinStatus','Erro: '+e.message,true);return;}
    MP.peer.on('disconnected',()=>{ if(MP.active&&MP.gameStarted){try{MP.peer.reconnect();}catch(e){}} });
    MP.peer.on('open',id=>{
      MP.myId=id;
      if(MP.gameStarted){ if(MP.reconnecting)mpGuestReconnectAttempt(); return; } // peer voltou ao servidor durante a partida
      console.log('[Guest] peer aberto, conectando em',MP.roomCode);
      setStatus('joinStatus','Conectando à sala...');
      const conn=MP.peer.connect(MP.roomCode,{reliable:true,serialization:'json'});
      MP.conn=conn;
      conn._joinTimer=setTimeout(()=>{
        if(MP.connected||MP.conn!==conn)return;
        setStatus('joinStatus','Tempo esgotado. Confira o código e se o Host ainda está na sala.',true);
        try{conn.close();}catch(e){}
        try{if(MP.peer)MP.peer.destroy();}catch(e){}
        MP.peer=null;MP.conn=null;MP.active=false;MP.isHost=false;
      },15000);
      setupConn(conn,false);
    });
    MP.peer.on('error',err=>{
      console.error('[PeerJS convidado]',err);
      if(MP.gameStarted)return; // em partida: o laço de reconexão cuida disso
      let msg='Erro: '+((err&&err.type)||'conexão');
      if(err.type==='peer-unavailable')msg='Sala não encontrada. Verifique o código.';
      else if(err.type==='network'||err.type==='server-error'||err.type==='socket-error'||err.type==='socket-closed')msg='Sem conexão com o servidor P2P. Tente de novo.';
      else if(err.type==='webrtc')msg='Falha de WebRTC. Tente trocar de rede (Wi-Fi/4G).';
      setStatus('joinStatus',msg,true);
      if(!MP.connected){ MP.active=false; MP.isHost=false; MP.conn=null; }
    });
  });
}

/* ================= RECONEXÃO =================
   Host: a partida continua; o convidado que cai é removido do mundo e pode voltar (mesmo código de sala).
   Convidado: congela o jogo, mostra aviso e tenta reconectar por até 90s, mantendo personagem/inventário.
   Se voltar com o mesmo mundo (seed) retoma de onde parou; se for outro mundo, entra como novo. */
const RECONN_MAX_MS=90000;
function showReconnectUI(){
  let el=document.getElementById('reconn');
  if(!el){
    el=document.createElement('div');el.id='reconn';
    el.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.62);color:#fff;font-family:inherit;text-align:center;padding:20px';
    el.innerHTML='<div>'+pxIcon('wifioff',5)+'</div><div style="font-size:16px;font-weight:700">Conexão perdida</div><div id="reconnMsg" style="font-size:13px;opacity:.85;max-width:260px"></div><button id="reconnQuit" style="margin-top:8px;padding:8px 18px;border-radius:8px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:13px">Sair da partida</button>';
    document.body.appendChild(el);
    el.querySelector('#reconnQuit').addEventListener('click',()=>{MP.reconnecting=false;quitToMenu();});
  }
  el.style.display='flex';updateReconnectUI();
}
function updateReconnectUI(){
  const m=document.getElementById('reconnMsg');if(!m)return;
  const left=Math.max(0,Math.ceil((RECONN_MAX_MS-(performance.now()-MP.reconnStart))/1000));
  m.textContent='Tentando reconectar… (tentativa '+MP.reconnTries+'): o jogo está pausado. Tempo restante: '+left+'s';
}
function hideReconnectUI(){const el=document.getElementById('reconn');if(el)el.style.display='none';}
function mpResetReconnect(){
  clearTimeout(MP._rcT);clearTimeout(MP._rsT);
  MP.reconnecting=false;MP.guestAway=false;MP.gameStarted=false;MP.seed=null;MP._resumeSame=false;
  hideReconnectUI();
}
function mpConnectionLost(){
  if(!MP.active||!MP.gameStarted||state==='menu')return;
  if(MP.isHost){
    if(MP.guestAway)return;
    MP.guestAway=true;
    remotePlayers={};
    toast('Convidado desconectou: aguardando reconexão…');
  } else {
    if(MP.reconnecting)return;
    MP.reconnecting=true;MP.reconnStart=performance.now();MP.reconnTries=0;MP._resumeSame=false;
    MP.connected=false;
    showReconnectUI();
    mpGuestReconnectAttempt();
  }
}
function mpReconnectFail(){
  clearTimeout(MP._rcT);clearTimeout(MP._rsT);
  MP.reconnecting=false;hideReconnectUI();
  toast('Não foi possível reconectar');
  quitToMenu();
}
function mpGuestReconnectAttempt(){
  if(!MP.reconnecting||MP.isHost||!MP.active)return;
  clearTimeout(MP._rcT);
  if(performance.now()-MP.reconnStart>RECONN_MAX_MS){mpReconnectFail();return;}
  const next=ms=>{clearTimeout(MP._rcT);MP._rcT=setTimeout(mpGuestReconnectAttempt,ms||2500);};
  updateReconnectUI();
  if(MP.connected){return;} // já conectado: aguardando o host liberar a retomada
  // tentativa anterior ainda pendente? espera
  if(MP.conn&&!MP.conn.open&&MP._connAt&&performance.now()-MP._connAt<7000){next(1500);return;}
  MP.reconnTries++;updateReconnectUI();
  const connectNow=()=>{
    if(MP.connected||!MP.reconnecting)return;
    let conn;
    try{conn=MP.peer.connect(MP.roomCode,{reliable:true,serialization:'json'});}
    catch(e){next();return;}
    MP.conn=conn;MP._connAt=performance.now();
    conn._joinTimer=setTimeout(()=>{if(MP.conn===conn&&!MP.connected){try{conn.close();}catch(e){}}},7000);
    setupConn(conn,false);
    next();
  };
  const p=MP.peer;
  if(p&&!p.destroyed&&!p.disconnected&&p.open){connectNow();}
  else if(p&&!p.destroyed&&p.disconnected){
    try{p.reconnect();}catch(e){}
    setTimeout(()=>{if(MP.peer&&MP.peer.open&&!MP.peer.disconnected)connectNow();else next();},1500);
  } else {
    // Peer morreu: cria outro e conecta
    let done=false;
    try{if(p&&!p.destroyed)p.destroy();}catch(e){}
    let np;
    try{np=new Peer({debug:1,config:PEER_ICE});}catch(e){next();return;}
    MP.peer=np;
    np.on('open',id=>{if(done)return;done=true;MP.myId=id;connectNow();});
    np.on('error',err=>{console.warn('[PeerJS reconexão]',err&&err.type);if(done)return;done=true;next();});
    np.on('disconnected',()=>{try{np.reconnect();}catch(e){}});
  }
}
function hostResumeGuest(){
  MP.guestAway=false;
  try{
    if(MP.conn&&MP.conn.open){
      MP.conn.send({type:'worldInit',seed:MP.seed,map:selectedMap});
      MP.conn.send({type:'start',map:selectedMap,resume:true});
    }
  }catch(e){console.warn('[Host resume]',e);}
  MP._vNext=0;
  toast('Convidado conectado!');
  const pushSnap=()=>{if(MP.conn&&MP.conn.open&&state!=='menu')mpSend(packSnapshot());};
  setTimeout(pushSnap,150);setTimeout(pushSnap,500);setTimeout(pushSnap,1200);
}
function guestResumed(){
  clearTimeout(MP._rcT);clearTimeout(MP._rsT);
  MP.reconnecting=false;MP._resumeSame=false;
  hideReconnectUI();
  MP.lastRecv=performance.now();MP.failCount=0;MP.syncT=0;
  if(P)P._grace=4;           // 4s sem dano ao voltar (o mundo andou enquanto você estava fora)
  last=performance.now();lastFrameTs=0;
  toast('Reconectado!');
}
function setupConn(conn,isHostSide){
  let opened=false;
  const onOpen=()=>{
    if(opened) return;
    opened=true;
    if(MP.conn&&MP.conn!==conn){try{conn.close();}catch(e){}return;} // tentativa antiga que abriu tarde
    if(conn._joinTimer){clearTimeout(conn._joinTimer);conn._joinTimer=null;}
    MP.connected=true;MP.lastRecv=performance.now();
    if(isHostSide&&MP.gameStarted&&state!=='menu'){ hostResumeGuest(); return; } // partida em andamento: NÃO regenera o mundo
    if(!isHostSide&&MP.reconnecting){
      // espera o host liberar a retomada; se não vier em 8s, derruba e tenta de novo
      clearTimeout(MP._rsT);
      MP._rsT=setTimeout(()=>{ if(MP.reconnecting){ MP.connected=false;MP.conn=null;try{conn.close();}catch(e){} mpGuestReconnectAttempt(); } },8000);
      return;
    }
    console.log('[MP] conn.on("open") disparado. Host?',isHostSide);
    if(isHostSide){
      setStatus('hostStatus','Jogador conectado! Gerando mundo...');
      setTimeout(()=>{
        try{
          selectedMap = mpSelectedMap || 'forest';
          const seed = Math.floor(Math.random()*1e9) + 1;
          MP.seed = seed;
          worldSeed=0;
          genWorld(seed);
          if(!plane) throw new Error('plane não gerado');
          console.log('[Host] genWorld OK (seed='+seed+'):',trees.length,'árvores,',rocks.length,'rochas');
          if(MP.conn && MP.conn.open){
            console.log('[Host] enviando seed+map...');
            MP.conn.send({type:'worldInit', seed: seed, map: selectedMap});
            MP.conn.send({type:'start', map: selectedMap});
            setStatus('hostStatus','Partida iniciada!');
          } else {
            setStatus('hostStatus','Conexão caiu antes do envio',true);
            return;
          }
        }catch(e){
          console.error('[Host gen/send]',e);
          setStatus('hostStatus','Erro: '+(e.message||e),true);
          return;
        }
        try{
          enterMultiplayerGame(true);
        }catch(e){
          console.error('[Host enter]',e);
          setStatus('hostStatus','Erro ao iniciar: '+(e.message||e),true);
        }
      }, 50);
    }else{
      setStatus('joinStatus','Conectado! Aguardando Host...');
    }
  };
  conn.on('open',onOpen);
  if(conn.open) setTimeout(onOpen,0);
  conn.on('data',data=>handleNetData(data,isHostSide));
  conn.on('close',()=>{
    if(MP.conn&&MP.conn!==conn) return;            // conexão antiga já substituída
    MP.connected=false;
    if(MP.conn===conn) MP.conn=null;
    if(MP.active&&MP.gameStarted&&state!=='menu'){ mpConnectionLost(); return; } // em partida: espera/tenta reconectar
    if(MP.active) setStatus(isHostSide?'hostStatus':'joinStatus','Conexão encerrada.',true);
  });
  conn.on('error',err=>console.error('[conn error]',err));
}
function handleNetData(data,isHostSide){
  MP.lastRecv=performance.now();
  if(!data||typeof data!=='object'||typeof data.type!=='string') return;
  if(!NET_OK_TYPES.has(data.type)) return; // descarta tipo desconhecido
  // Chat first — never blocked by heavier handlers
  if(data.type==='chat'){
    if(typeof data.text!=='string' || data.text.length>60) return;
    if(data.name!=null) data.name=sanitizeName(data.name);
    if(data.id!=null && !NET_OK_IDS.has(data.id)) return;
    receiveChat(data);
    return;
  }
  // Heartbeat / RTT
  if(data.type==='ping'){
    mpSend({type:'pong', t:data.t});
    return;
  }
  if(data.type==='pong'){
    if(Number.isFinite(data.t)) MP.rtt=Math.max(20, Math.min(800, performance.now()-data.t));
    MP.failCount=0;
    return;
  }
  try{
  if(data.type==='worldInit'){
    if(!isHostSide && isFiniteNum(data.seed) && MP.reconnecting && MP.seed===data.seed){
      MP._resumeSame=true; // mesmo mundo: mantém o personagem e só retoma
    } else if(!isHostSide && isFiniteNum(data.seed)){
      MP._resumeSame=false;
      MP.seed=data.seed;
      const map=NET_OK_MAPS.has(data.map)?data.map:'forest';
      console.log('[Guest] worldInit recebido — seed='+data.seed+' map='+map);
      try{
        selectedMap = map;
        worldSeed=0;
        genWorld(data.seed);
        console.log('[Guest] mundo gerado:',trees.length,'árvores, plane?',!!plane);
      }catch(e){
        console.error('[Guest genWorld]',e);
        setStatus('joinStatus','Erro ao gerar mundo: '+(e.message||e),true);
      }
    }
  } else if(data.type==='start'){
    if(!isHostSide&&MP.reconnecting&&MP._resumeSame){ guestResumed(); return; }
    if(!isHostSide){
      if(MP.reconnecting){ clearTimeout(MP._rcT);clearTimeout(MP._rsT);MP.reconnecting=false;hideReconnectUI(); } // mundo diferente: entra como novo jogador
      if(data.map && NET_OK_MAPS.has(data.map)) selectedMap=data.map;
      console.log('[Guest] start recebido. plane?',!!plane);
      if(plane){
        enterMultiplayerGame(false);
      } else {
        setTimeout(()=>{
          if(plane){ enterMultiplayerGame(false); }
          else {
            console.error('[Guest] start sem plane');
            setStatus('joinStatus','Erro: mundo não chegou do Host',true);
          }
        }, 600);
      }
    }
  } else if(data.type==='evt'){
    if(typeof data.kind==='string' && NET_OK_EVT.has(data.kind) && data.data && typeof data.data==='object') handleEvt(data.kind, data.data);
  } else if(data.type==='player'){
    if(typeof data.id!=='string' || !NET_OK_IDS.has(data.id)) return;
    if(!isFiniteNum(data.x) || !isFiniteNum(data.y)) return;
    // Limita teleport / lixo de coordenadas
    if(Math.abs(data.x)>WW+200 || Math.abs(data.y)>WH+200) return;
    const pos=clampWorldPos(data.x, data.y);
    const rp=remotePlayers[data.id]||{};
    const wasAlive=rp.alive!==false && rp.id;
    rp.id=data.id;rp.name=sanitizeName(data.name);
    rp.skin=(Number.isInteger(data.skin)&&data.skin>=0&&data.skin<SKINS.length)?data.skin:0;
    rp.pk=data.pk?1:0;
    rp.tx=pos.x;rp.ty=pos.y;
    if(rp.x===undefined){rp.x=pos.x;rp.y=pos.y;}
    rp.face=isFiniteNum(data.face)?data.face:rp.face;
    rp.moving=!!data.moving;rp.sprint=!!data.sprint;
    rp.weapon=(typeof data.weapon==='string'?data.weapon.slice(0,16):'fists');
    rp.swing=isFiniteNum(data.swing)?data.swing:0;
    rp.hold=(typeof data.hold==='string'&&EATABLE(data.hold)&&ITEMS[data.hold])?data.hold:'';
    rp.fw=Array.isArray(data.fw)?data.fw.filter(k=>typeof k==='string'&&WEAPONS[k]&&WEAPONS[k].firearm).slice(0,8):(rp.fw||[]);   // armas de fogo que o aliado já tem
    rp.hp=isFiniteNum(data.hp)?clamp(data.hp,0,100):rp.hp;
    rp.alive=data.alive!==false;rp.inVehicle=!!data.inVehicle;
    if(Array.isArray(data.sl)&&data.sl.length>=4&&data.sl.every(isFiniteNum)){
      if(!rp.sl){rp.slT=performance.now();if(P&&!P.sleeping&&!P.dead)toast(rp.name+' foi dormir. Deite-se também para passar a noite');}
      rp.sl={s:SLI[data.sl[0]|0]||'t',hx:clamp(data.sl[1],-20,20),hy:clamp(data.sl[2],-20,20),tent:!!data.sl[3]};
    }else rp.sl=null;
    if(isFiniteNum(data.fx)&&isFiniteNum(data.fy)){rp.fx=data.fx;rp.fy=data.fy;rp.fl=isFiniteNum(data.fl)?data.fl:3;}else{rp.fx=null;rp.fy=null;}
    rp.ob=(Array.isArray(data.ob)&&data.ob.length>=3&&data.ob.every(isFiniteNum))?data.ob:null;   // o Observador que o outro jogador está vendo
    rp.gh=(Array.isArray(data.gh)&&data.gh.length>=5&&data.gh.every(isFiniteNum))?data.gh:null;   // a aparição que o outro está vendo
    rp.isHost=!isHostSide;rp.anim=(rp.anim||0)+(data.moving?0.25:0);
    remotePlayers[data.id]=rp;
    // Teammate just died and we are also dead → end the match
    if(wasAlive && rp.alive===false && P && P.dead && !MP.gameOver){
      MP.gameOver=true; state='dead';
      setAmbient(0);setRain(false);
      showDeathScreen(false);
      toast('Seu amigo também morreu. Fim de jogo.');
    }
    if(data.vehicleId !== undefined && Number.isFinite(data.vehicleX) && Number.isFinite(data.vehicleY)){
      const v = vehicles.find(v => v.id === data.vehicleId);
      // Motorista remoto é autoridade — nunca sobrescreve o carro que NÓS dirigimos
      if(v && P.inVehicle !== v){
        vehSetTarget(v, data.vehicleX, data.vehicleY, data.vehicleFace || 0); v._pT = performance.now();
        v.spd = data.vehicleSpd || 0;
        v.looted = data.vehicleLooted || false;
        v.driverId = data.id || v.driverId || 'remote';
        if(Number.isFinite(data.vehicleHp)) v.hp = data.vehicleHp;
        if(Number.isFinite(data.vehicleMaxHp)) v.maxHp = data.vehicleMaxHp;
        if(data.vehicleDestroyed){ v.destroyed=true; v.dying=false; v.hp=0; v.spd=0; }
        else if(data.vehicleDying){
          if(!v.dying && !v.destroyed){
            v.dying=true; v.hp=0; v.spd=0;
            v.explodeT=Number.isFinite(data.vehicleExplodeT)?data.vehicleExplodeT:5;
          } else if(Number.isFinite(data.vehicleExplodeT)) v.explodeT=data.vehicleExplodeT;
        }
        v.showHp=2;
      }
    } else if(data.inVehicle===false || data.inVehicle===undefined){
      // Remote left their vehicle — clear driver mark if it was them
      for(const v of vehicles){
        if(v.driverId===data.id){ v.driverId=null; v.spd=0; }
      }
    }
  } else if(data.type==='snapshot'){
    if(!isHostSide && data && typeof data==='object') applySnapshot(data);
  } else if(data.type==='playerDied'){
    if(typeof data.id==='string' && NET_OK_IDS.has(data.id) && remotePlayers[data.id]){
      remotePlayers[data.id].alive=false;
      remotePlayers[data.id].hp=0;
    }
    // If we are also dead, it's game over for both
    if(P && P.dead && !MP.gameOver){
      MP.gameOver=true;
      state='dead';
      setAmbient(0);setRain(false);
      showDeathScreen(false);
      toast('Seu amigo também morreu. Fim de jogo.');
    }
  } else if(data.type==='gameOver'){
    if(!MP.gameOver){
      MP.gameOver=true;
      if(P) P.dead=true;
      state='dead';
      setAmbient(0);setRain(false);
      showDeathScreen(false);
    }
  } else if(data.type==='playerRespawned'){
    if(typeof data.id==='string' && NET_OK_IDS.has(data.id) && remotePlayers[data.id]){
      remotePlayers[data.id].alive=true;
      if(isFiniteNum(data.hp)) remotePlayers[data.id].hp=clamp(data.hp,0,100);
    }
  }
  }catch(err){ console.error('[handleNetData]', data&&data.type, err); }
}
/* Veículos que não dirigimos: guarda destino e interpola (antes pulavam a cada pacote e o snapshot desfazia a posição fresca do motorista) */
function vehSetTarget(v,x,y,f){
  if(v._nx===undefined||Math.hypot(x-v.x,y-v.y)>140){v.x=x;v.y=y;v.face=f;}
  v._nx=x;v._ny=y;v._nf=f;
}
function applySnapshot(snap){
  if(!snap || typeof snap !== 'object' || !MP.active) return;
  if(!MP.isHost&&Array.isArray(snap.ch))snap.ch.forEach((v,i)=>{if(chestList[i]&&v===1)chestList[i].open=true;});
  if(!MP.isHost&&(Array.isArray(snap.tg)||Array.isArray(snap.rg))){ // árvores/pedras que já foram destruídas (garante o mesmo mapa mesmo após queda de conexão)
    const c1=applyGone(BASE_TREES,trees,snap.tg),c2=applyGone(BASE_ROCKS,rocks,snap.rg);
    if(c1||c2)rebuildSolidGrid();
  }
  if(!MP.isHost&&(Array.isArray(snap.tn)||Array.isArray(snap.rn))){const c1=grownApply(trees,snap.tn),c2=grownApply(rocks,snap.rn);if(c1||c2)rebuildSolidGrid();}
  if(!MP.isHost&&Array.isArray(snap.bd))applyBirds(snap.bd); // aves: estado vem do anfitrião
  if(!MP.isHost&&(snap.sc===0||snap.sc===1))SCW.on=snap.sc===1; // espantalho: o estado vem do anfitrião, igual para todos
  // Items: Host is authority — replace guest list (events give immediate feedback)
  const itemsIn = Array.isArray(snap.it) ? snap.it.map(a=>({t:a[0],x:a[1],y:a[2]})) : snap.items;
  if(Array.isArray(itemsIn)){
    let list = itemsIn;
    if(!MP.isHost){
      const now=performance.now();
      recentRemoved=recentRemoved.filter(r=>now-r.at<2500);
      recentAdded=recentAdded.filter(r=>now-r.at<2500);
      if(recentRemoved.length) list=list.filter(it=>!recentRemoved.some(r=>Math.abs(r.x-it.x)<5&&Math.abs(r.y-it.y)<5));
      for(const a of recentAdded){
        if(!list.some(it=>it.t===a.t&&Math.abs(it.x-a.x)<5&&Math.abs(it.y-a.y)<5))list.push({t:a.t,x:a.x,y:a.y});
      }
    }
    items = list;
  }
  // Campfires: merge (never wipe guest-only events that arrived slightly earlier)
  if(Array.isArray(snap.campfires)){
    const merged = snap.campfires.map(c=>({x:c.x,y:c.y,t:c.t||0,flicker:c.flicker||0}));
    for(const c of campfires){
      if(!merged.some(m=>Math.abs(m.x-c.x)<8&&Math.abs(m.y-c.y)<8)){
        merged.push({x:c.x,y:c.y,t:c.t||0,flicker:c.flicker||0});
      }
    }
    campfires = merged;
  }
  if(Array.isArray(snap.tents)){
    let ch=false;
    for(const a of snap.tents){if(Array.isArray(a)&&isFiniteNum(a[0])&&isFiniteNum(a[1])&&!tents.some(t=>Math.abs(t.x-a[0])<10&&Math.abs(t.y-a[1])<10)){tents.push({x:a[0],y:a[1]});ch=true;}}
    if(ch)rebuildSolidGrid();
  }
  const zin = Array.isArray(snap.zs) ? snap.zs.map(a=>({netId:'z'+a[0],x:a[1],y:a[2],kind:a[3],face:a[4]/100,hp:a[5],moving:!!a[6],si:a[7],anim:a[8]/10,lg:a[9]|0,ht:a[10]|0})) : snap.zombies;
  if(Array.isArray(zin)){
    const byId = new Map();
    for(const z of zombies) if(z.netId) byId.set(z.netId, z);
    const next = [];
    const seenIds = new Set();
    for(let i=0;i<zin.length;i++){
      const sz = zin[i];
      if(!sz) continue;
      const t = ZTYPES[sz.kind] || ZTYPES[0];
      const prev = sz.netId ? byId.get(sz.netId) : null;
      // Keep local prediction HP if we recently damaged this zombie (prevents snapshot from erasing guest shots)
      let hp = sz.hp;
      let predT = 0;
      if(prev){
        predT = Math.max(0, (prev._predT||0));
        if(predT>0 && Number.isFinite(prev.hp)){
          hp = Math.min(sz.hp, prev.hp);
        }
        // If local prediction already killed it, skip until host confirms (omit from list)
        if(prev.dead && predT>0){ seenIds.add(sz.netId); continue; }
      }
      if(sz.netId) seenIds.add(sz.netId);
      const dd=dayDiff();
      next.push({
        netId: sz.netId || ('remote-z'+i),
        x: prev&&Number.isFinite(prev.x)?prev.x:sz.x, y: prev&&Number.isFinite(prev.y)?prev.y:sz.y, kind: sz.kind,
        face: sz.face||0, anim: prev&&Number.isFinite(prev.anim)?prev.anim:(sz.anim||0), hp: hp,
        max: t.hp*dd.hp, r: t.r, dmg: Math.round(t.dmg*dd.dmg), spd: t.spd*dd.spd,
        moving: !!sz.moving, si: sz.si|0, skin: zombieLook(sz.kind,sz.si).skin, shirt: zombieLook(sz.kind,sz.si).shirt,
        ranged:!!t.ranged, range:t.range, crawler:!!t.crawler, screams:!!t.screams,
        bloater:!!t.bloater, berserk:!!t.berserk, yeti:!!t.yeti,
        dead: false, hit: Math.max(prev ? prev.hit : 0, (sz.ht||(prev&&Number.isFinite(prev.hp)&&hp<prev.hp-.01))?.14:0), vx: 0, vy: 0,
        alert: 0, lock: prev ? Math.max(0, prev.lock) : 0, lunge: sz.lg?.15:0,
        cd: prev ? prev.cd : 0, losT: 0, seen: false, wt: 0,
        tx: sz.x, ty: sz.y, _nx: sz.x, _ny: sz.y, spitT: prev ? prev.spitT : 0, screamT: prev ? prev.screamT : 0,
        _predT: predT, _hitCD: prev ? prev._hitCD : 0
      });
    }
    // Keep briefly-predicted-dead zombies so they don't flicker back
    for(const z of zombies){
      if(z.dead && (z._predT||0)>0 && z.netId && !seenIds.has(z.netId)){
        next.push(z);
      }
    }
    if(!MP.isHost&&P){ // zumbi que sumiu da lista dentro da tela morreu no anfitrião: mostra o mesmo efeito (mancha, sangue, grito)
      const nid=new Set(next.map(q=>q.netId));
      const was=new Set(zombies.filter(q=>q.lunge>0).map(q=>q.netId));
      for(const q of next)if(q.lunge>0&&!was.has(q.netId)){try{zombieVoice(q,'attack');}catch(e){}} // ouve o ataque que o anfitrião viu
      for(const z of zombies){
        if(z.dead||!z.netId||nid.has(z.netId))continue;
        if(Math.abs(z.x-P.x)<W/Z/2+30&&Math.abs(z.y-P.y)<H/Z/2+30){
          decals.push({x:z.x,y:z.y,l:DECAL_LIFE});if(decals.length>24)decals.shift();
          for(let i=0;i<8;i++)parts.push({x:z.x,y:z.y-5,vx:rnd(-60,60),vy:rnd(-60,20),t:rnd(.3,.7),c:'#7a1010',g:1});
          try{zombieVoice(z,'death');}catch(e){}
        }
      }
    }
    zombies = next;
  }
  if(Array.isArray(snap.vehicles)){
    const byId = new Map(vehicles.filter(v=>v.id!==undefined).map(v=>[v.id,v]));
    const newList = [];
    for(const sv of snap.vehicles){
      if(!sv || sv.id===undefined) continue;
      let v = byId.get(sv.id);
      if(!v) v = {id:sv.id,x:sv.x,y:sv.y,w:sv.w,h:sv.h,col:sv.col,looted:!!sv.looted,spd:sv.spd||0,face:sv.face||0,driverId:null,hp:sv.hp,maxHp:sv.maxHp||100};
      const weDrive = (v === P?.inVehicle);
      // Motorista local é autoridade: snapshot NÃO sobrescreve pos/hp do carro que dirigimos
      if(!weDrive){
        if(!(v._pT&&performance.now()-v._pT<500)) vehSetTarget(v,sv.x,sv.y,sv.face||0); // motorista remoto manda posição mais fresca
        v.spd=sv.spd||0;
        v.looted=!!sv.looted;v.col=sv.col;v.w=sv.w;v.h=sv.h;
        if(Number.isFinite(sv.hp)) v.hp=sv.hp;
        if(Number.isFinite(sv.maxHp)) v.maxHp=sv.maxHp;
        if(sv.destroyed){ v.destroyed=true; v.dying=false; v.hp=0; }
        else if(sv.dying){ v.dying=true; v.explodeT=Number.isFinite(sv.explodeT)?sv.explodeT:(v.explodeT||5); }
      } else {
        v.looted=!!sv.looted;
        // Só aceita destroyed remoto se já estamos dying (confirmação)
        if(sv.destroyed && v.dying){ v.destroyed=true; v.dying=false; }
      }
      newList.push(v);
    }
    if(snap.vfull===false){ for(const nv of newList) if(!byId.has(nv.id)) vehicles.push(nv); } // parcial: só atualiza
    else vehicles = newList;
    if(P?.inVehicle && !vehicles.some(v=>v.id===P.inVehicle.id)) P.inVehicle=null;
  }
  const ain = Array.isArray(snap.an) ? snap.an.map(a=>({k:a[0],x:a[1],y:a[2],face:a[3]/100,hp:a[4],max:a[5],lg:a[6]|0})) : snap.animals;
  if(Array.isArray(ain)){
    const oldA=animals||[],usedA=new Set(),nextA=[];
    for(const a of ain){
      if(!a||!Number.isFinite(a.x)||!Number.isFinite(a.y))continue;
      const k=a.k||'rabbit';
      // Acha o mesmo animal no snapshot anterior (sem id: mesmo tipo + mais próximo)
      let prev=null,bd=70;
      for(const o of oldA){
        if(usedA.has(o)||o.k!==k)continue;
        const d=Math.hypot((o._nx!==undefined?o._nx:o.x)-a.x,(o._ny!==undefined?o._ny:o.y)-a.y);
        if(d<bd){bd=d;prev=o;}
      }
      if(prev)usedA.add(prev);
      const pred=prev?(prev._predT||0):0;
      if(prev&&prev.dead&&pred>0){nextA.push(prev);continue;} // já matamos: espera o host confirmar
      let hp=Number.isFinite(a.hp)?a.hp:4;
      if(prev&&pred>0&&Number.isFinite(prev.hp))hp=Math.min(hp,prev.hp);
      nextA.push({
        x:prev?prev.x:a.x,y:prev?prev.y:a.y,k:k,face:a.face||0,
        hp:hp,max:a.max||(Number.isFinite(a.hp)?Math.max(a.hp,1):4),
        dead:false,flee:0,wt:1,tx:a.x,ty:a.y,atkCD:0,_nx:a.x,_ny:a.y,lunge:a.lg?.12:0,
        _predT:pred,_hitCD:prev?prev._hitCD:0
      });
    }
    // Mortos por predição que o host ainda não confirmou continuam um instante
    for(const o of oldA){if(o.dead&&(o._predT||0)>0&&!usedA.has(o)&&!nextA.includes(o))nextA.push(o);}
    if(!MP.isHost){for(const q of nextA)if(q.lunge>0&&!oldA.some(o=>o.lunge>0&&Math.hypot(o.x-q.x,o.y-q.y)<30)){try{animalVoice(q,'attack');}catch(e){}}}
    if(!MP.isHost&&P){ // animal morto no anfitrião: sangue e mancha também aqui
      for(const o of oldA){
        if(o.dead||usedA.has(o)||nextA.includes(o))continue; // só quem sumiu do snapshot (morreu no anfitrião) sangra aqui
        if(Math.abs(o.x-P.x)<W/Z/2+30&&Math.abs(o.y-P.y)<H/Z/2+30){
          for(let i=0;i<6;i++)parts.push({x:o.x,y:o.y-3,vx:rnd(-50,50),vy:rnd(-50,15),t:rnd(.3,.6),c:'#7a1010',g:1});
        }
      }
    }
    animals=nextA;
  }
  const holdT=!!(P&&P.sleeping&&!MP.isHost&&Number.isFinite(snap.T)&&snap.T>T+30);   // convidado dormindo: o salto da noite chega pelo evento sleepSkip
  if(!holdT){
    if(Number.isFinite(snap.day)) day=clamp(snap.day,1,9999);
    if(Number.isFinite(snap.dark)) dark=clamp(snap.dark,0,1);
    if(Number.isFinite(snap.T)) T=Math.max(0,snap.T);
  }
  if(snap.weather==='none'||snap.weather==='rain'||snap.weather==='snow'||snap.weather==='sand'){
    if(weather!==snap.weather){
      const prevW=weather;weather=snap.weather;setRain(weather==='rain');
      if(weather==='rain') toast('Chuva: fogueiras apagam e stamina cai mais');
      else if(weather==='snow') toast('Neve: movimento e recuperação mais lentos');
      else if(weather==='sand') toast('Tempestade de areia: visão e velocidade reduzidas');
      else if(prevW!=='none') toast('Clima limpo');
    }
  }
  if(Number.isFinite(snap.weatherTimer)) weatherTimer=clamp(snap.weatherTimer,0,300);
  if(Number.isFinite(snap.kills)) kills = snap.kills;
}
let BASE_TREES=[],BASE_ROCKS=[];
function goneList(base,arr){const cur=new Set(arr.map(t=>t.x+','+t.y));const g=[];for(const k of base)if(!cur.has(k))g.push(k);return g;}
function applyGone(base,arr,gone){
  if(!Array.isArray(gone)||!gone.length)return false;
  const g=new Set(gone);let ch=false;
  for(let i=arr.length-1;i>=0;i--)if(g.has(arr[i].x+','+arr[i].y)){arr.splice(i,1);ch=true;}
  return ch;
}
function packSnapshot(){
  // Prioritize zombies near host AND guests so both always see enemies around them
  const anchors=[{x:P.x,y:P.y}];
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(rp && rp.alive!==false && Number.isFinite(rp.x)) anchors.push({x:rp.x,y:rp.y});
  }
  const scored=[];
  for(const z of zombies){
    if(z.dead) continue;
    let minD=1e9;
    for(const a of anchors){
      const d=Math.hypot(z.x-a.x,z.y-a.y);
      if(d<minD) minD=d;
    }
    scored.push({z,minD});
  }
  // Prioridade extra perto do guest (resolve “não vejo zumbis” na cidade)
  scored.sort((a,b)=>a.minD-b.minD);
  const nearGuest=[];
  const rest=[];
  for(const s of scored){
    // guest anchors come after host (index>=1)
    let nearOther=false;
    for(let i=1;i<anchors.length;i++){
      if(Math.hypot(s.z.x-anchors[i].x,s.z.y-anchors[i].y)<420){ nearOther=true; break; }
    }
    if(nearOther) nearGuest.push(s); else rest.push(s);
  }
  const ordered=nearGuest.concat(rest);
  // Cidade: mais zumbis no snapshot (até 70); outros mapas 50
  const zCap=selectedMap==='city'?90:60;
  // Payload enxuto (sem skin/shirt) — evita queda/atraso no MP, esp. cidade
  // Todo zumbi num raio de 600px de algum jogador sempre vai no snapshot (antes os da borda do limite sumiam e reapareciam)
  let nearCnt=0;for(const sc of scored)if(sc.minD<600)nearCnt++;
  const zCapF=Math.max(zCap,Math.min(140,nearCnt));
  // Formato compacto (arrays): ~3x menor que objetos — na cidade o snapshot grande travava o canal e o convidado não via zumbis
  const zPack=ordered.slice(0,zCapF).map(({z})=>[
    (typeof z.netId==='string'&&z.netId[0]==='z')?(+z.netId.slice(1)||0):0,
    Math.round(z.x),Math.round(z.y),z.kind|0,Math.round((z.face||0)*100),Math.round(z.hp),z.moving?1:0,z.si|0,Math.round((z.anim||0)*10),z.lunge>0?1:0,z.hit>0?1:0
  ]);
  // Itens: os mais próximos de CADA jogador (antes, quem estava numa área cheia de itens roubava a vaga do outro)
  const iSet=new Set();
  for(const an of anchors){
    const arr=[];
    for(const it of items){const d=Math.hypot(it.x-an.x,it.y-an.y);if(d<1100)arr.push({it,d});}
    arr.sort((x,y)=>x.d-y.d);
    for(let i=0;i<Math.min(55,arr.length);i++)iSet.add(arr[i].it);
  }
  const iPack=[...iSet].map(it=>[it.t,Math.round(it.x),Math.round(it.y)]);
  // Animais perto dos players (host authority)
  const aScored=animals.filter(a=>!a.dead).map(a=>{
    let minD=1e9;
    for(const an of anchors) minD=Math.min(minD,Math.hypot(a.x-an.x,a.y-an.y));
    return {a,minD};
  });
  aScored.sort((x,y)=>x.minD-y.minD);
  const aPack=aScored.slice(0,30).map(({a})=>[a.k,Math.round(a.x),Math.round(a.y),Math.round((a.face||0)*100),Math.round(a.hp),a.max|0,a.lunge>0?1:0]);
  // Veículos: lista completa só a cada 3s; nos outros snapshots só os que estão perto de alguém ou em movimento
  const nowMs=performance.now();
  const fullV=!(MP._vNext>nowMs);
  if(fullV) MP._vNext=nowMs+3000;
  const vPack=[];
  for(const v of vehicles){
    let inc=fullV||!!v.driverId||!!v.dying||Math.abs(v.spd||0)>1;
    if(!inc){ for(const an of anchors){ if(Math.abs(v.x-an.x)<800&&Math.abs(v.y-an.y)<800){inc=true;break;} } }
    if(!inc) continue;
    vPack.push({id:v.id,x:Math.round(v.x),y:Math.round(v.y),w:v.w,h:v.h,col:v.col,looted:!!v.looted,spd:+(v.spd||0).toFixed(1),face:+(v.face||0).toFixed(2),hp:v.hp,maxHp:v.maxHp,dying:!!v.dying,destroyed:!!v.destroyed,explodeT:v.explodeT});
  }
  return {type:'snapshot',day,dark:+dark.toFixed(3),T:+T.toFixed(1),weather,weatherTimer:Math.round(weatherTimer),kills,
    zs:zPack,
    it:iPack,
    an:aPack,
    vehicles:vPack,vfull:fullV,
    campfires:campfires.map(c=>({x:Math.round(c.x),y:Math.round(c.y),t:c.t||0,flicker:+(c.flicker||0).toFixed(2)})),
    tents:tents.map(t=>[Math.round(t.x),Math.round(t.y)]),
    sc:SCW.on?1:0,
    bd:packBirds(),
    tg:fullV?goneList(BASE_TREES,trees):undefined,rg:fullV?goneList(BASE_ROCKS,rocks):undefined,tn:fullV?grownPack(trees):undefined,rn:fullV?grownPack(rocks):undefined,
    ch:chestList.map(c=>c.open?1:0)
  };
}
function myNetId(){
  return MP.isHost ? 'host' : 'guest';
}
function packMyPlayer(){
  if(!P) return {type:'player',id:myNetId(),name:MP.playerName||'Jogador',x:0,y:0,alive:false};
  const p = {type:'player',id:myNetId(),name:MP.playerName||'Jogador',
    x:Math.round(P.x),y:Math.round(P.y),face:+P.face.toFixed(2),
    moving:!!P.moving,sprint:!!P.sprint,weapon:P.weapon||'fists',swing:+(P.swing||0).toFixed(2),
    hp:Math.round(P.hp),alive:!P.dead,inVehicle:!!P.inVehicle,skin:SKIN_SEL,pk:P.pack?1:0,hold:P.hold||'',fw:Object.keys(P.firearms||{}).filter(k=>P.firearms[k])};
  if(OBS.on&&!P.inside&&!P.inVehicle)p.ob=[Math.round(OBS.x),Math.round(OBS.y),OBS.glitch>0?1:0];
  if(GH.on&&GH.b)p.gh=[GH.b.x|0,GH.b.y|0,Math.round(GH.x),Math.round(GH.y),GH.kill>0?1:0];
  if(P.sleeping){const sl=P.sleeping;p.sl=[SLC[sl.s]|0,sl.hx|0,sl.hy|0,sl.tent?1:0];}
  if(P.fish){p.fx=Math.round(P.fish.x);p.fy=Math.round(P.fish.y);p.fl=P.fish.ph?0:+Math.max(0,P.fish.wait-P.fish.t).toFixed(1);}
  if(P.inVehicle){
    const v=P.inVehicle;
    p.vehicleId = v.id;
    p.vehicleX = Math.round(v.x);
    p.vehicleY = Math.round(v.y);
    p.vehicleFace = +(v.face||0).toFixed(2);
    p.vehicleSpd = +(v.spd||0).toFixed(1);
    p.vehicleLooted = !!v.looted;
    // Motorista é autoridade de HP/estado do carro (guest e host)
    p.vehicleHp = Number.isFinite(v.hp)?Math.round(v.hp):100;
    p.vehicleMaxHp = v.maxHp||100;
    p.vehicleDying = !!v.dying;
    p.vehicleDestroyed = !!v.destroyed;
    p.vehicleExplodeT = Number.isFinite(v.explodeT)?+v.explodeT.toFixed(2):0;
  }
  return p;
}
function enterMultiplayerGame(isHost){
  // Fullscreen no MP: só marca intenção. O navegador exige gesto do usuário
  // (enterMultiplayerGame é disparado por evento de rede, não por toque).
  // O primeiro toque em jogo chama tryFullscreenFromGesture().
  if(CFG.fullscreen) userWantsFS=true;
  else userWantsFS=false;
  MP.isHost=isHost;MP.gameStarted=true;MP.reconnecting=false;MP.guestAway=false;
  try{
    if(!plane) throw new Error('mundo não carregado');
    const offX = isHost ? 0 : 40;
    const offY = isHost ? 0 : 40;
    // ⚠️ ORDEM CORRETA: cria P PRIMEIRO
    P={x:plane.x+70+offX, y:plane.y+offY, r:5, hp:100, food:85, water:85, stam:100, temp:0,
      face:Math.PI/2, moving:false, sprint:false, exhausted:false, cd:0, swing:0, flash:0, bleed:false, dead:false,
      weapon:'fists', melee:null, meleeWeapons:[], firearms:{}, ammo:0, arrows:0,
      inv:[{t:'bandage',n:1},{t:'water',n:1}],
      walk:0, inside:null, inVehicle:null};
    pushOut(P,P.r);
    rebuildSolidGrid();
    // ⚠️ DEPOIS de criar P, aí sim popula zumbis (só no Host)
    if(isHost){
      if(zombies.length===0) populate();
      console.log('[Host] populate —',zombies.length,'zumbis');
    } else {
      // Guest começa limpo e recebe autoridade do host via snapshot
      zombies=[];
      campfires=[];
      animals=animals||[]; // mundo seed já gerou; host sobrescreve via snap
    }
    T=0; kills=0; shake=0; flash=0; spawnTimer=3; dark=0; day=1; update._lastDay=1; MP._vNext=0;
    try{missionsInit();}catch(e){}
    recentRemoved=[]; recentAdded=[];
    atkHeld=false; sprintHeld=false; touchGas=0; touchSteer=0; stepT=0;
    remotePlayers={}; MP.gameOver=false; MP.syncT=0;
    restoreWalkHUD();
    applyHudClasses();
    buildInv(); updateHud(true);
    state='play';
    showScreen(null);
    const hud=$('hud'); if(hud) hud.classList.remove('hide');
    const ds=$('deadscr'); if(ds) ds.classList.add('hide');
    toast(isHost?'Você é o HOST ('+MP.playerName+')':'Você é o CONVIDADO ('+MP.playerName+')');
    startAmbient(); startRain();
    // Host: push zombies/campfires to guest immediately (+ reforço 300ms/800ms)
    if(isHost && MP.conn && MP.conn.open){
      const pushSnap=()=>{ try{ mpSend(packSnapshot()); mpSend(packMyPlayer()); }catch(e){} };
      pushSnap();
      setTimeout(pushSnap, 300);
      setTimeout(pushSnap, 800);
      console.log('[Host] snapshot inicial — zumbis:',zombies.length);
    }
    closeChat();
    setChatButtonVisible(true);
    const cm=$('chat-msgs'); if(cm) cm.innerHTML=''; resetChatHistory();
    pushChatBubble('','Chat pronto: toque no botão de chat',false,true);
    console.log('[MP] jogo iniciado. Host?',isHost);
  }catch(err){
    console.error('[enterMultiplayerGame]',err);
    setStatus(MP.isHost?'hostStatus':'joinStatus','Erro ao iniciar: '+(err.message||err),true);
  }
}

