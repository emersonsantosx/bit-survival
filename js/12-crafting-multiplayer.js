/* ============ CRAFTING ============ */
let craftFilter='all';
function canCraft(r){for(const k in r.need)if(countInv(k)<r.need[k])return false;return true;}
function craft(r){
  if(!canCraft(r)){say('Recursos insuficientes');beep(120,.1,'square',.05);return;}
  const out=r.out;
  // Não gasta recursos para fabricar uma arma que já está no arsenal
  if((['pickaxe','axe','katana','spear','bat','fishingrod'].includes(out)||BUILD_TOOLS.includes(out))&&((P.meleeWeapons||[]).includes(out)||P.melee===out||toolList().includes(out))){
    say('Você já tem: '+ITEMS[out].n);beep(120,.1,'square',.05);return;
  }
  if(out==='bow'&&P.firearms.bow){say('Você já tem um arco');beep(120,.1,'square',.05);return;}
  if(out==='backpack'&&P.pack){say('Você já tem uma mochila');beep(120,.1,'square',.05);return;}
  if(out==='greenhouse'&&!GREENHOUSE_OK()){toast('A estufa só é necessária no mapa de neve');beep(120,.1,'square',.05);return;}
  if(out==='greenhouse'){
    const sp=ghSpot();
    if(!sp){toast(P.inside?'Monte a estufa ao ar livre':'Sem espaço livre para a estufa aqui');beep(120,.1,'square',.05);return;}
    P._gh=sp;
  }
  if(out==='well'){
    const why=wellWhy();
    if(why){toast(why);beep(120,.1,'square',.05);return;}
    P._wp=wellSpot();
  }
  if(out==='tent'){
    const tp=tentSpot();
    if(!tp){toast(P.inside?'Monte a barraca ao ar livre':'Sem espaço para a barraca aqui');beep(120,.1,'square',.05);return;}
    P._tp=tp;
  }
  if(out!=='campfire'&&out!=='tent'&&out!=='stash'&&out!=='well'&&out!=='greenhouse'&&!['pickaxe','axe','katana','spear','bow','arrows','bat','fishingrod'].includes(out)&&!BUILD_TOOLS.includes(out)&&out!=='backpack'&&P.inv.length>=invCap()&&!P.inv.some(slot=>slot.t===out)){say('Inventário cheio');beep(120,.1,'square',.05);return;}
  for(const k in r.need)removeInv(k,r.need[k]);
  if(out==='greenhouse'){
    const sp=P._gh||ghSpot();P._gh=null;
    if(sp){ghBuild(sp);toast('Estufa montada! Use a enxada dentro dela para arar');buildSound();}
  }else if(out==='well'){
    const sp=P._wp||wellSpot();P._wp=null;wellBuild(sp);

  }else if(out==='tent'){
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
  }else if(out==='pickaxe'||out==='axe'||out==='katana'||out==='spear'||out==='bat'||out==='fishingrod'||out==='hoe'||BUILD_TOOLS.includes(out)){
    if(BUILD_TOOLS.includes(out)){addTool(out);toast('Fabricou: '+ITEMS[out].n+'! Use o botão de construção (ao lado do de pegar).');buildSound();}
    else{addMeleeWeapon(out);P.weapon=out;updateWeaponHud();
    toast(out==='fishingrod'?'Fabricou: Vara de Pesca! Mire no lago e use ATACAR.':'Fabricou: '+ITEMS[out].n+'! Arma adicionada ao arsenal.');buildSound();}
  }else if(out==='bow'){
    if(P.firearms.bow){ say('Você já tem um arco'); }
    else { P.firearms.bow=true; P.arrows=(P.arrows||0)+6; P.weapon='bow'; updateWeaponHud(); say('Fabricou: Arco (+6 flechas)'); }
    buildSound();
  }else if(out==='backpack'){
    P.pack=true;buildInv();say('Mochila equipada: 12 itens');buildSound();
  }else if(out==='arrows'){
    P.arrows=(P.arrows||0)+6; say('+6 flechas'); buildSound();
  }else{
    if(!addItem(out,r.qty||1)){say('Inventário cheio');return;}
    say('Fabricou: '+ITEMS[out].n+(r.qty>1?' x'+r.qty:''));buildSound();
  }
  track('craft');if(out==='bandage')achStat('craft_bandage',1);if(out==='campfire')track('campfire');
  refreshCraft();
  closeCraft(); // fecha a tela para confirmar que o item foi fabricado
}
let craftReadyAt=0; // ignora toques logo apos abrir o crafting (o mesmo toque do martelo nao pode acionar CRIAR)
function openCraft(){if(state!=='play')return;state='craft';craftReadyAt=performance.now()+450;const e=$('craftscr');if(e)e.classList.remove('hide');refreshCraft();}
function closeCraft(){if(state!=='craft')return;if(window.stashIsOpen&&stashIsOpen()){closeStash();return;}const e=$('craftscr');if(e)e.classList.add('hide');const iv=$('invscr');if(iv)iv.classList.add('hide');state='play';}
function refreshCraft(){
  const cw=$('cw'),cs=$('cs'),cc=$('cc');if(cw)cw.textContent=countInv('wood');if(cs)cs.textContent=countInv('stone');if(cc)cc.textContent=countInv('cloth');
  const el=$('craftlist');if(!el)return;
  el.innerHTML='';
  for(const r of RECIPES){
    if(r.lake&&!mapHasLake())continue;
    if(r.once&&r.out==='backpack'&&P.pack)continue;
    if(r.out==='greenhouse'&&!GREENHOUSE_OK())continue;
    const isTool=BUILD_TOOLS.includes(r.out),isWeapon=['pickaxe','axe','katana','spear','bow','bat'].includes(r.out),category=isWeapon||r.out==='arrows'?'weapon':'utility';
    if(craftFilter!=='all'&&craftFilter!==category)continue;
    const ok=canCraft(r);
    const row=document.createElement('div');
    row.className='craft-row '+(ok?'can':'no');
    const cost=Object.entries(r.need).map(([k,v])=>'<span class="cost-chip'+(countInv(k)<v?' lack':'')+'" title="'+(ITEMS[k]?.n||k)+'">'+(ITEMS[k]&&ITEMS[k].e?pxFit(ITEMS[k].e,16,14):(ITEMS[k]?.n||k))+'<b>'+v+'</b></span>').join('');
    const icon=pxFit(isTool||isWeapon||r.out==='arrows'||r.out==='fishingrod'?(WEAPON_ICON[r.out]||(r.out==='arrows'?'arrows':'axe')):(r.out==='bandage'?'bandage':(r.out==='backpack'?'backpack':(r.out==='tent'?'tent':(r.out==='stash'?'stash':(r.out==='well'?'well':(r.out==='greenhouse'?'greenhouse':'fire')))))),30,24);
    row.innerHTML='<div class="recipe-icon">'+icon+'</div><div class="info"><div class="name">'+r.label+'</div><div class="cost">'+r.desc+'</div><div class="cost">Custo: '+(cost||'nenhum')+'</div><div class="status">'+(ok?pxIcon('check',2)+' Recursos suficientes':'Faltam recursos')+'</div></div>';
    const btn=document.createElement('button');
    btn.textContent='CRIAR';btn.disabled=!ok;
    btn.onclick=e=>{if(performance.now()<craftReadyAt){if(e){e.preventDefault();e.stopPropagation();}return;}aud();craft(r);};
    row.appendChild(btn);el.appendChild(row);
  }
  const tabs=$('craft-tabs');if(tabs)tabs.querySelectorAll('[data-craft-filter]').forEach(b=>b.classList.toggle('active',b.dataset.craftFilter===craftFilter));
}

/* ============ EVENTOS REPLICADOS ============ */
/* Eventos que mexem em estrutura do mundo: quem acabou de mandar um deles nao aceita a "correcao" do snapshot por um instante
   (o anfitriao ainda pode nao ter recebido, e a peca sumiria e voltaria na tela) */
const STRUCT_EVT=new Set(['structDmg','fenceSet','cellSet','plotSet','structBreak','ghAdd','stashAdd','stashSet','stashDel','wellAdd','logAdd','logDel','campfireAdded','campfireRemoved','tentAdded','doorSet','fruitSet','iceBreak','chestOpen']);
const LOCAL_GRACE=2200;
function sendEvt(kind, data){
  // Vale em qualquer momento da partida (pausa, mapa, morto...): antes so em jogo/criacao e o evento se perdia para sempre
  if(!MP.active || !MP.connected || !MP.gameStarted || state==='menu') return;
  {const nt=performance.now();if(STRUCT_EVT.has(kind))MP._tStruct=nt;else if(kind==='treeDmg'||kind==='rockDmg')MP._tTree=nt;}
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
    if(t && Number.isFinite(data.dmg)){ t.hp -= clamp(data.dmg,0,10); t._hit=T; if(t.hp<=0){ const i=trees.indexOf(t); if(i>=0){ trees.splice(i,1); rebuildSolidGrid(); } } }
  } else if(kind==='rockDmg'){
    const r = rocks.find(r => r.x===data.x && r.y===data.y);
    if(r && Number.isFinite(data.dmg)){ r.hp -= clamp(data.dmg,0,10); r._hit=T; if(r.hp<=0){ const i=rocks.indexOf(r); if(i>=0){ rocks.splice(i,1); rebuildSolidGrid(); } } }
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
  } else if(kind==='ghAdd'){
    ghRemote(data);
  } else if(kind==='structBreak'){
    structRemote(data.k);
  } else if(kind==='structDmg'){
    structDmgRemote(data);
  } else if(kind==='fenceSet'){
    fenceRemote(data);
  } else if(kind==='cellSet'){
    cellRemote(data);
  } else if(kind==='plotSet'){
    plotRemote(data);
  } else if(kind==='fruitSet'){
    fruitRemote(data);
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
  } else if(kind==='stashAdd'||kind==='stashSet'||kind==='stashDel'){
    stashRemote(kind,data);
  } else if(kind==='wellAdd'){
    wellRemote(kind,data);
  } else if(kind==='logAdd'||kind==='logDel'){
    logRemote(kind,data);
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
      const who=(typeof data.who==='string'&&data.who)?data.who:(data.driver||'remote');
      const seat=data.seat==='p'?'p':'d';
      const me=myNetId();
      if(who===me){/* eco do que a gente mesmo fez */}
      else if(seat==='d'){
        if(v.passId===who)v.passId=null;
        if(P&&P.inVehicle===v&&v.driverId===me&&!imPassenger()){
          // os dois entraram juntos como motorista: o 'host' (ou o menor id) fica no volante; o outro vira passageiro
          const theyWin=(who==='host')||(me!=='host'&&who<me);
          if(!theyWin)return;
          v.driverId=who;v.passId=me;v.spd=0;touchGas=0;touchSteer=0;showVehicleHUD();
          if(MP.active)sendEvt('vehicleEnter',{id:v.id,driver:who,who:me,seat:'p'});
          toast('Outro jogador já estava dirigindo: você é passageiro');
        }else v.driverId=who;
      }else{
        if(v.driverId===who)v.driverId=null;
        if(P&&P.inVehicle===v&&imPassenger()){
          // os dois pegaram o lugar de passageiro juntos: o 'host' (ou o menor id) fica; o outro desce
          const theyWin=(who==='host')||(me!=='host'&&who<me);
          if(!theyWin)return;
          v.passId=who;exitVehicle();toast('Lugar já ocupado!');
        }else v.passId=who;
      }
    }
  } else if(kind==='vehicleExit'){
    const v = vehicles.find(v => v.id===data.id);
    if(v) vehSeatLeave(v,(typeof data.who==='string'&&data.who)?data.who:v.driverId);
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
      const rider=!!(P && P.inVehicle===v);
      v.destroyed=true; v.dying=false; v.hp=0; v.spd=0; v.driverId=null; v.passId=null;
      for(let i=0;i<20;i++) parts.push({x:v.x,y:v.y,vx:rnd(-100,100),vy:rnd(-120,30),t:rnd(.4,.9),c:pick(['#ff4020','#ff8020','#333'])});
      if(rider){P.inVehicle=null;restoreWalkHUD();toast('Você explodiu com o carro!');die();}   // quem ainda estava dentro (motorista ou passageiro) morre na explosão, igual ao jogo local
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
  s.onerror=()=>{cb&&cb(new Error('peerjs'));};   // quem chamou mostra o aviso na tela (nada de alert)
  document.head.appendChild(s);
}
function makeRoomCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function setStatus(id,msg,isErr,codeBad){
  const e=$(id);if(e){e.textContent=msg;e.classList.toggle('err',!!isErr);}
  if(id==='joinStatus')joinFormSync(msg,isErr,codeBad);
  // na sala, erros e avisos de rede aparecem na linha de status dela
  if(MP.lobbyOn&&(id==='hostStatus'||id==='joinStatus')&&(isErr||/Reconectando|Erro/.test(msg))){const l=$('lobStatus');if(l){l.textContent=msg;l.classList.toggle('err',!!isErr);}}
}

/* Tela ENTRAR EM SALA: enquanto conecta o botão fica bloqueado ("CONECTANDO...") e volta ao normal em qualquer erro; erro de código marca o campo em vermelho */
function joinFormSync(msg,isErr,codeBad){
  const b=$('btnJoinConnect'),i=$('joinCode');
  const busy=!isErr&&/^(Carregando|Conectando|Conectado)/.test(msg||'');
  if(b){b.disabled=busy;b.textContent=busy?'CONECTANDO...':'CONECTAR';}
  if(i)i.classList.toggle('bad',!!(isErr&&codeBad));
}
/* Mensagem de erro do PeerJS para quem tenta entrar: o que houve + o que fazer */
function joinErrMsg(type){
  if(type==='peer-unavailable')return 'Sala não encontrada. Confira o código e peça ao host para manter a sala aberta.';
  if(type==='network'||type==='server-error'||type==='socket-error'||type==='socket-closed')return 'Sem conexão com o servidor P2P. Verifique a internet e tente de novo.';
  if(type==='webrtc')return 'Falha na conexão direta com o host. Tente trocar de rede (Wi-Fi ou 4G).';
  return 'Não foi possível entrar ('+(type||'conexão')+'). Tente de novo.';
}
/* Reentrada rápida: o código da última sala em que entrou fica guardado e já vem preenchido em ENTRAR EM SALA (some se o host encerrar a sala) */
function lastRoomGet(){try{return sanitizeRoomCode(localStorage.getItem('minisurv_last_room')||'');}catch(e){return '';}}
function lastRoomSet(c){try{localStorage.setItem('minisurv_last_room',sanitizeRoomCode(c));}catch(e){}}
function lastRoomForget(){try{localStorage.removeItem('minisurv_last_room');}catch(e){}}
function joinHintSync(){
  const i=$('joinCode'),h=$('joinHint');if(!h)return;
  const last=lastRoomGet();
  h.textContent=(i&&last&&i.value===last)?'Código da última sala preenchido. Toque no campo para trocar.':'';
}
function mpHostStart(){
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null; MP.conn=null; MP.connected=false; MP.myId=null;
  remotePlayers={}; nextZombieNetId=1; mpResetReconnect();
  const nameEl=$('hostName');
  MP.playerName=sanitizeName((nameEl&&nameEl.value)||'Host');
  if(nameEl) nameEl.value=MP.playerName;
  try{localStorage.setItem('minisurv_name',MP.playerName);}catch(e){}
  // mundo escolhido: save existente (abre ele), slot vazio (mundo novo que sera salvo la) ou temporario (slot 0)
  MP.slot=0;MP.save=null;
  if(mpSlot>0){
    if(slotRaw(mpSlot)){
      const sv=readSave(mpSlot);
      if(!sv){setStatus('hostStatus','Esse save não pôde ser aberto. Escolha outro mundo.',true);return;}
      MP.save=sv;
    }
    MP.slot=mpSlot;
  }
  const code=makeRoomCode();
  MP.roomCode='MINISURV-'+code;MP.isHost=true;MP.active=true;
  const hc=$('hostCode');if(hc)hc.textContent=code;
  const wrap=$('hostCodeWrap');if(wrap)wrap.classList.remove('hide');
  MP.players=mpPlayersList();
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
  me.on('open',id=>{MP.myId=id;MP._lobErr=false;setStatus('hostStatus','Sala criada! Aguardando jogadores...');console.log('[Host] peer aberto:',id);try{lobbyRender();}catch(e){}});
  me.on('connection',conn=>{
    console.log('[Host] nova conexão recebida');
    hostAcceptConn(conn);
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
      clearTimeout(hostRetryTimer);hostRetryTimer=setTimeout(()=>{if(MP.isHost&&MP.active&&!MP.gameStarted)hostOpenPeer(true,tries+1);},2500);
      return;
    }
    const msg=t==='unavailable-id'
      ?'Código de sala ocupado. Volte e crie outra sala.'
      :('Falha de conexão: '+(t||'erro desconhecido'));
    MP._lobErr=true;setStatus('hostStatus',msg,true);
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
  if(!MP.active||!MP.isHost||MP.gameStarted||!MP.roomCode) return;   // sala ainda aberta (com ou sem convidados): confere o código
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
  if(clean.length<4){ setStatus('joinStatus','Código inválido. Ele tem 6 letras e números, igual ao que o host mostra.',true,true); MP.active=false; return; }
  MP.isHost=false;MP.active=true;MP.roomCode='MINISURV-'+clean;MP.spawn=null;MP.save=null;MP.slot=0;
  setStatus('joinStatus','Carregando motor P2P...');
  loadPeerJS(err=>{
    if(err||typeof Peer==='undefined'){MP.active=false;MP.isHost=false;setStatus('joinStatus','Falha ao carregar o P2P. Confira a internet e tente de novo.',true);return;}
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
        setStatus('joinStatus','Tempo esgotado. Confira o código e se o host ainda está na sala.',true,true);
        try{conn.close();}catch(e){}
        try{if(MP.peer)MP.peer.destroy();}catch(e){}
        MP.peer=null;MP.conn=null;MP.active=false;MP.isHost=false;
      },15000);
      setupConn(conn,false);
    });
    MP.peer.on('error',err=>{
      console.error('[PeerJS convidado]',err);
      if(MP.gameStarted)return; // em partida: o laço de reconexão cuida disso
      setStatus('joinStatus',joinErrMsg(err&&err.type),true,!!(err&&err.type==='peer-unavailable'));
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
    el.innerHTML='<div>'+pxIcon('wifioff',5)+'</div><div style="font-size:calc(16px*var(--ui,1));font-weight:700">Conexão perdida</div><div id="reconnMsg" style="font-size:calc(13px*var(--ui,1));opacity:.85;max-width:calc(260px*var(--ui,1))"></div><button id="reconnQuit" style="margin-top:calc(8px*var(--ui,1));padding:calc(8px*var(--ui,1)) calc(18px*var(--ui,1));border-radius:calc(8px*var(--ui,1));border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:calc(13px*var(--ui,1))">Sair da partida</button>';
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
  MP.roster={};MP.players=[];MP.netId='guest';MP.slotIdx=1;MP.lobbyOn=false;MP._starting=false;MP._lobErr=false;MP.lobbyInfo='';
  hideReconnectUI();
}
function mpConnectionLost(){
  if(!MP.active||!MP.gameStarted||state==='menu')return;
  if(MP.isHost){
    hostSync();   // quedas de convidados sao tratadas uma a uma em hostConnClosed
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
function hostResumeGuest(conn,id){
  const r=MP.roster[id];
  try{
    conn.send({type:'welcome',id:id,idx:MP_IDS.indexOf(id),ig:1});
    conn.send({type:'worldInit',seed:MP.seed,map:selectedMap,sv:worldExtraPack(),sp:P?[Math.round(P.x),Math.round(P.y)]:undefined});
    conn.send({type:'start',map:selectedMap,resume:true,idx:MP_IDS.indexOf(id)});
  }catch(e){console.warn('[Host resume]',e);}
  hostSync();
  MP._vNext=0;
  toast((r&&r.name||'Jogador')+' conectado!');
  const pushSnap=()=>{if(conn.open&&state!=='menu')mpSend(packSnapshot());};
  setTimeout(pushSnap,150);setTimeout(pushSnap,500);setTimeout(pushSnap,1200);
  hostBroadcastLobby();
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
/* Host: gera o mundo da sala. Com mundo salvo (MP.save) usa a mesma semente e devolve tudo o que mudou nele; sem save, sorteia um mundo novo
   (que fica salvo no slot escolhido, se houver). Devolve o que o convidado precisa para montar o mesmo mundo */
function hostBuildWorld(){
  const L=MP.save;
  selectedMap = L?L.map:(mpSelectedMap || 'forest');
  const seed = L?L.seed:(Math.floor(Math.random()*1e9) + 1);
  MP.seed = seed;
  worldSeed=seed;curSlot=MP.slot;pendingSlot=MP.slot;
  genWorld(seed);
  if(!plane) throw new Error('plane não gerado');
  if(L) restoreWorldState(L);
  console.log('[Host] genWorld OK (seed='+seed+', slot='+MP.slot+'):',trees.length,'árvores,',rocks.length,'rochas');
  return {seed:seed,map:selectedMap,sv:worldExtraPack(),sp:L?[Math.round(L.P.x),Math.round(L.P.y)]:undefined};
}
/* ===== SALA (host) =====
   O host e o centro: cada convidado tem uma conexao propria (MP.conns[g1..g3]) e uma vaga na tabela MP.roster.
   Antes da partida a sala e um lobby: convidados marcam PRONTO e so o host inicia. Durante a partida a vaga de quem caiu fica reservada para ele voltar. */
const MAP_NOME={forest:'Floresta',desert:'Deserto',snow:'Neve',city:'Cidade'};
function mpPlayersList(){
  const a=[{id:'host',name:MP.playerName||'Host',ready:true,host:true,away:false}];
  for(const id of MP_IDS){ if(id==='host')continue; const r=MP.roster[id]; if(r)a.push({id:id,name:r.name,ready:!!r.ready,host:false,away:!!r.away}); }
  return a;
}
function mpWorldInfo(){
  const mp=MP.save?MP.save.map:(mpSelectedMap||'forest');
  return (MP.save?'Mundo salvo: ':'Mundo novo: ')+(MAP_NOME[mp]||'Floresta');
}
function hostSync(){
  if(!MP.isHost||MP._gc)return;
  const n=mpOpenConns().length;
  MP.connected=n>0;
  if(MP.gameStarted)MP.guestAway=n===0;   // "ninguem conectado": o host segue jogando sozinho ate alguem voltar
}
function hostBroadcastLobby(){
  if(!MP.isHost)return;
  MP.players=mpPlayersList();
  MP.lobbyInfo=mpWorldInfo();
  mpSend({type:'lobby',players:MP.players,info:MP.lobbyInfo,ig:MP.gameStarted?1:0,starting:MP._starting?1:0});
  try{lobbyRender();}catch(e){}
}
function hostFreeId(){for(const id of MP_IDS){if(id!=='host'&&!MP.roster[id])return id;}return null;}
function hostUniqueName(name,exceptId){
  const used=new Set([(MP.playerName||'').toLowerCase()]);
  for(const id in MP.roster){if(id!==exceptId)used.add(MP.roster[id].name.toLowerCase());}
  if(!used.has(name.toLowerCase()))return name;
  for(let n=2;n<10;n++){const c=name.slice(0,11-String(n).length+1)+n;if(!used.has(c.toLowerCase()))return c.slice(0,12);}
  return name;
}
function hostRefuse(conn,why){
  try{conn.send({type:'full',why:why});}catch(e){}
  setTimeout(()=>{try{conn.close();}catch(e){}},400);
}
function hostAcceptConn(conn){
  conn._netId=null;conn._lastRecv=performance.now();
  conn._helloT=setTimeout(()=>{if(!conn._netId){try{conn.close();}catch(e){}}},10000);   // quem nao se apresenta e descartado
  conn.on('data',d=>{conn._lastRecv=performance.now();handleNetData(d,true,conn);});
  conn.on('close',()=>hostConnClosed(conn));
  conn.on('error',err=>console.error('[conn error]',err));
}
function hostOnHello(conn,data){
  if(conn._netId)return;
  clearTimeout(conn._helloT);
  const name=sanitizeName(data.name);
  const prev=(typeof data.prev==='string'&&NET_OK_IDS.has(data.prev)&&data.prev!=='host'&&data.prev!=='guest')?data.prev:null;
  if(MP._starting){hostRefuse(conn,'iniciada');return;}
  if(MP.gameStarted&&state!=='menu'){
    // Partida em andamento: so volta quem ja estava nela (mesma vaga ou mesmo nome); a conexao antiga muda ha >4s e considerada caida
    const now=performance.now();
    const free=r=>!r.conn||!r.conn.open||(now-(r.conn._lastRecv||0)>4000);
    let id=null;
    if(prev&&MP.roster[prev]&&free(MP.roster[prev]))id=prev;
    if(!id){for(const k in MP.roster){const r=MP.roster[k];if(r.name.toLowerCase()===name.toLowerCase()&&free(r)){id=k;break;}}}
    if(!id){hostRefuse(conn,'iniciada');return;}
    const r=MP.roster[id];
    if(r.conn&&r.conn!==conn){const old=r.conn;r.conn=null;delete MP.conns[id];old._netId=null;try{old.close();}catch(e){}}
    r.conn=conn;r.away=false;conn._netId=id;MP.conns[id]=conn;
    hostResumeGuest(conn,id);
    return;
  }
  const id=hostFreeId();
  if(!id||Object.keys(MP.roster).length>=MP_MAX-1){hostRefuse(conn,'cheia');return;}
  MP.roster[id]={id:id,name:hostUniqueName(name,id),ready:false,away:false,conn:conn};
  conn._netId=id;MP.conns[id]=conn;
  try{conn.send({type:'welcome',id:id,idx:MP_IDS.indexOf(id),ig:0});}catch(e){}
  MP._lobErr=false;
  hostSync();
  hostBroadcastLobby();
}
function hostConnClosed(conn){
  clearTimeout(conn._helloT);
  const id=conn._netId;
  if(!id)return;
  conn._netId=null;
  if(MP.conns[id]===conn)delete MP.conns[id];
  const r=MP.roster[id];
  if(!r||r.conn!==conn)return;
  if(MP.gameStarted&&state!=='menu'){
    r.conn=null;r.away=true;r.ready=false;
    delete remotePlayers[id];
    for(const v of vehicles)vehSeatLeave(v,id);   // libera a vaga; se era o motorista, o passageiro assume (js/32)
    hostSync();
    toast(r.name+' desconectou: a vaga fica reservada para voltar');
  } else {
    delete MP.roster[id];
    hostSync();
  }
  hostBroadcastLobby();
}
function hostSetReady(id,ready){
  const r=MP.roster[id];if(!r||MP.gameStarted||MP._starting)return;
  r.ready=!!ready;
  hostBroadcastLobby();
}
function hostKick(id){
  const r=MP.roster[id];if(!r||MP.gameStarted)return;
  const c=r.conn;
  delete MP.roster[id];delete MP.conns[id];
  if(c){c._netId=null;try{c.send({type:'kick',why:'kick'});}catch(e){}setTimeout(()=>{try{c.close();}catch(e){}},300);}
  hostSync();hostBroadcastLobby();
}
/* O botao INICIAR so vale com pelo menos 1 convidado e todos prontos */
function hostCanStart(){
  if(!MP.isHost||!MP.active||MP.gameStarted||MP._starting)return false;
  const g=mpPlayersList().filter(p=>!p.host);
  return g.length>=1&&g.every(p=>p.ready&&!p.away);
}
function hostStartMatch(){
  if(!hostCanStart()){toast('Espere todos ficarem prontos');return false;}
  MP._starting=true;
  hostBroadcastLobby();
  setStatus('hostStatus','Gerando o mundo...');
  setTimeout(()=>{
    try{
      const wi=hostBuildWorld();
      for(const id in MP.roster){
        const r=MP.roster[id],c=r.conn;
        if(!c||!c.open)continue;
        c.send({type:'worldInit',seed:wi.seed,map:wi.map,sv:wi.sv,sp:wi.sp});
        c.send({type:'start',map:selectedMap,idx:MP_IDS.indexOf(id)});
      }
      for(const id in MP.roster){MP.roster[id].away=!(MP.roster[id].conn&&MP.roster[id].conn.open);}
      MP._starting=false;
      enterMultiplayerGame(true);   // com mundo salvo, usa MP.save (jogador, zumbis e relogio)
      hostBroadcastLobby();
    }catch(e){
      console.error('[Host start]',e);
      MP._starting=false;MP._lobErr=true;
      setStatus('hostStatus','Erro ao iniciar: '+(e.message||e),true);
      hostBroadcastLobby();
    }
  },60);
  return true;
}
/* Host: sem pacote de um convidado por 9s, so ele cai (os outros seguem) */
function hostCheckStale(){
  const now=performance.now();
  for(const id of Object.keys(MP.conns)){
    const c=MP.conns[id];
    if(c&&now-(c._lastRecv||now)>9000){c._lastRecv=now;try{c.close();}catch(e){}hostConnClosed(c);}
  }
}

/* ===== convidado: conexao com o host ===== */
function guestRoomClosed(msg){
  try{if(MP.peer)MP.peer.destroy();}catch(e){}
  MP.peer=null;MP.conn=null;MP.active=false;MP.isHost=false;MP.connected=false;MP.roomCode='';MP.lobbyOn=false;
  mpResetReconnect();
  if(state==='menu'){showScreen('mpjoinscreen');setStatus('joinStatus',msg,true);}
}
function setupConn(conn,isHostSide){
  let opened=false;
  const onOpen=()=>{
    if(opened) return;
    opened=true;
    if(MP.conn&&MP.conn!==conn){try{conn.close();}catch(e){}return;} // tentativa antiga que abriu tarde
    if(conn._joinTimer){clearTimeout(conn._joinTimer);conn._joinTimer=null;}
    MP.connected=true;MP.lastRecv=performance.now();
    try{conn.send({type:'hello',name:MP.playerName,prev:MP.gameStarted?MP.netId:null});}catch(e){}   // o host decide a vaga
    if(MP.reconnecting){
      // espera o host liberar a retomada; se não vier em 8s, derruba e tenta de novo
      clearTimeout(MP._rsT);
      MP._rsT=setTimeout(()=>{ if(MP.reconnecting){ MP.connected=false;MP.conn=null;try{conn.close();}catch(e){} mpGuestReconnectAttempt(); } },8000);
      return;
    }
    console.log('[MP] conn.on("open") disparado.');
    setStatus('joinStatus','Conectado! Entrando na sala...');
  };
  conn.on('open',onOpen);
  if(conn.open) setTimeout(onOpen,0);
  conn.on('data',data=>handleNetData(data,false,conn));
  conn.on('close',()=>{
    if(MP.conn&&MP.conn!==conn) return;            // conexão antiga já substituída
    MP.connected=false;
    if(MP.conn===conn) MP.conn=null;
    if(MP.active&&MP.gameStarted&&state!=='menu'){ mpConnectionLost(); return; } // em partida: espera/tenta reconectar
    if(MP.active&&MP.lobbyOn){ lastRoomForget(); guestRoomClosed('A sala foi encerrada.'); return; }
    if(MP.active) setStatus('joinStatus','Conexão encerrada.',true);
  });
  conn.on('error',err=>console.error('[conn error]',err));
}
/* O que o host repassa aos outros convidados (cada convidado so fala com o host). Eventos que so o host resolve nao sao repassados */
const NET_RELAY=new Set(['player','chat','evt','playerDied','playerRespawned','gameOver']);
const NET_HOST_ONLY_EVT=new Set(['zombieDmg','animalDmg']);
function handleNetData(data,isHostSide,conn){
  MP.lastRecv=performance.now();
  if(!data||typeof data!=='object'||typeof data.type!=='string') return;
  if(!NET_OK_TYPES.has(data.type)) return; // descarta tipo desconhecido
  const fromGuest=!!(isHostSide&&conn);   // pacote que um convidado mandou ao host
  if(fromGuest){
    if(data.type==='hello'){ hostOnHello(conn,data); return; }
    if(!conn._netId) return;               // quem ainda nao se apresentou e ignorado
    if(data.type==='ready'){ hostSetReady(conn._netId,!!data.r); return; }
    if(data.type==='leave'){ try{conn.close();}catch(e){} hostConnClosed(conn); return; }
    if(data.id!==undefined) data.id=conn._netId;   // o id vem da vaga, nunca do pacote (ninguem se passa por outro)
  }
  if(data.type==='hello'||data.type==='ready'||data.type==='leave') return;   // so o host recebe
  if(!isHostSide&&(data.type==='welcome'||data.type==='lobby'||data.type==='full'||data.type==='kick')){ guestRoomMsg(data); return; }
  const relay=()=>{ if(fromGuest&&NET_RELAY.has(data.type)&&!(data.type==='evt'&&NET_HOST_ONLY_EVT.has(data.kind))) mpSend(data,conn); };
  // Chat first — never blocked by heavier handlers
  if(data.type==='chat'){
    if(typeof data.text!=='string' || data.text.length>60) return;
    if(data.name!=null) data.name=sanitizeName(data.name);
    if(data.id!=null && !NET_OK_IDS.has(data.id)) return;
    relay();
    receiveChat(data);
    return;
  }
  // Heartbeat / RTT (a resposta vai so para quem perguntou)
  if(data.type==='ping'){
    const pong={type:'pong', t:data.t};
    if(fromGuest){ try{conn.send(pong);}catch(e){} } else mpSend(pong);
    return;
  }
  if(data.type==='pong'){
    if(Number.isFinite(data.t)){
      const rtt=Math.max(20, Math.min(800, performance.now()-data.t));
      if(fromGuest){ conn._rtt=rtt; let m=0; for(const c of mpOpenConns()) m=Math.max(m,c._rtt||0); MP.rtt=Math.max(20,m||rtt); }   // o host usa o pior RTT entre os convidados
      else MP.rtt=rtt;
    }
    MP.failCount=0;
    return;
  }
  relay();
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
        worldSeed=data.seed;   // o mesmo valor do host (alguns detalhes do mundo dependem dele)
        genWorld(data.seed);
        worldExtraApply(data.sv);   // portas, gelo quebrado e comida ja saqueada do mundo do host
        MP.spawn=(Array.isArray(data.sp)&&data.sp.length===2&&data.sp.every(isFiniteNum)&&Math.abs(data.sp[0])<=WW&&Math.abs(data.sp[1])<=WH)?[data.sp[0],data.sp[1]]:null;
        console.log('[Guest] mundo gerado:',trees.length,'árvores, plane?',!!plane);
      }catch(e){
        console.error('[Guest genWorld]',e);
        setStatus('joinStatus','Erro ao gerar mundo: '+(e.message||e),true);
      }
    }
  } else if(data.type==='start'){
    if(!isHostSide&&Number.isInteger(data.idx)&&data.idx>=1&&data.idx<MP_MAX){ MP.slotIdx=data.idx; MP.netId=MP_IDS[data.idx]; }
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
    rp.pk=data.pk?1:0;rp.lt=data.lt?1:0;
    rp.tx=pos.x;rp.ty=pos.y;
    if(rp.x===undefined){rp.x=pos.x;rp.y=pos.y;}
    rp.face=isFiniteNum(data.face)?data.face:rp.face;
    rp.moving=!!data.moving;rp.sprint=!!data.sprint;
    rp.weapon=(typeof data.weapon==='string'?data.weapon.slice(0,16):'fists');
    rp.swing=isFiniteNum(data.swing)?data.swing:0;
    rp.hold=(typeof data.hold==='string'&&HOLDABLE(data.hold)&&ITEMS[data.hold])?data.hold:'';
    rp.fw=Array.isArray(data.fw)?data.fw.filter(k=>typeof k==='string'&&WEAPONS[k]&&WEAPONS[k].firearm).slice(0,8):(rp.fw||[]);   // armas de fogo que o aliado já tem
    rp.hp=isFiniteNum(data.hp)?clamp(data.hp,0,100):rp.hp;
    rp.alive=data.alive!==false;rp.inVehicle=!!data.inVehicle;
    rp.bl=data.bl===1&&rp.alive;   // aliado sangrando
    if(Array.isArray(data.sl)&&data.sl.length>=4&&data.sl.every(isFiniteNum)){
      if(!rp.sl){rp.slT=performance.now();if(P&&!P.sleeping&&!P.dead)toast(rp.name+' foi dormir. Deite-se também para passar a noite');}
      rp.sl={s:SLI[data.sl[0]|0]||'t',hx:clamp(data.sl[1],-20,20),hy:clamp(data.sl[2],-20,20),tent:!!data.sl[3]};
    }else rp.sl=null;
    rp.st=data.st===1;
    rp.wp=(Array.isArray(data.wp)&&data.wp.length===2&&data.wp.every(isFiniteNum)&&data.wp[0]>=0&&data.wp[1]>=0&&data.wp[0]<=WW&&data.wp[1]<=WH)?data.wp:null;
    if(isFiniteNum(data.fx)&&isFiniteNum(data.fy)){rp.fx=data.fx;rp.fy=data.fy;rp.fl=isFiniteNum(data.fl)?data.fl:3;}else{rp.fx=null;rp.fy=null;}
    rp.ob=(Array.isArray(data.ob)&&data.ob.length>=3&&data.ob.every(isFiniteNum))?data.ob:null;   // o Observador que o outro jogador está vendo
    rp.gh=(Array.isArray(data.gh)&&data.gh.length>=5&&data.gh.every(isFiniteNum))?data.gh:null;   // a aparição que o outro está vendo
    rp.isHost=(data.id==='host');rp.anim=(rp.anim||0)+(data.moving?0.25:0);
    remotePlayers[data.id]=rp;
    // Teammate just died and we are also dead → end the match
    if(wasAlive && rp.alive===false && P && P.dead && !MP.gameOver && !isOtherPlayerAlive()){
      MP.gameOver=true; state='dead';
      setAmbient(0);setRain(false);
      showDeathScreen(false);
      toast('Todos morreram. Fim de jogo.');
    }
    rp.vehicleId=data.inVehicle?(data.vehicleId!==undefined?data.vehicleId:data.vs):undefined;   // em qual veículo o aliado está (conta nas vagas, js/32)
    if(data.vp===1&&data.inVehicle&&data.vs!==undefined){
      // passageiro: não manda o veículo, só diz em qual está
      const pv=vehicles.find(v=>v.id===data.vs);
      if(pv&&pv.passId!==data.id&&pv.passId!==myNetId()){   // (se o lugar é nosso, quem decide é o evento vehicleEnter)
        if(pv.driverId===data.id)pv.driverId=null;
        if(!pv.passId||!remotePlayers[pv.passId]||!remotePlayers[pv.passId].inVehicle)pv.passId=data.id;
      }
    }
    if(data.vehicleId !== undefined && Number.isFinite(data.vehicleX) && Number.isFinite(data.vehicleY)){
      const v = vehicles.find(v => v.id === data.vehicleId);
      // Motorista remoto é autoridade — nunca sobrescreve o carro que NÓS dirigimos (o passageiro, ao contrário, acompanha)
      if(v && (P.inVehicle !== v || imPassenger())){
        vehSetTarget(v, data.vehicleX, data.vehicleY, data.vehicleFace || 0); v._pT = performance.now();
        v.spd = data.vehicleSpd || 0;
        v.looted = data.vehicleLooted || false;
        v.driverId = data.id || v.driverId || 'remote';
        if(v.passId===data.id)v.passId=null;
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
      // Remote left their vehicle: libera a vaga dele (e o passageiro assume o volante, se for o caso)
      for(const v of vehicles)vehSeatLeave(v,data.id);
    }
  } else if(data.type==='snapshot'){
    if(!isHostSide && data && typeof data==='object') applySnapshot(data);
  } else if(data.type==='playerDied'){
    if(typeof data.id==='string' && NET_OK_IDS.has(data.id) && remotePlayers[data.id]){
      remotePlayers[data.id].alive=false;
      remotePlayers[data.id].hp=0;
    }
    // Se estamos mortos e ninguem mais esta vivo, acabou para todos
    if(P && P.dead && !MP.gameOver && !isOtherPlayerAlive()){
      MP.gameOver=true;
      state='dead';
      setAmbient(0);setRain(false);
      showDeathScreen(false);
      toast('Todos morreram. Fim de jogo.');
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
/* Convidado: mensagens da sala (vaga, lista de jogadores, sala cheia, expulsao) */
function guestRoomMsg(data){
  if(data.type==='welcome'){
    if(typeof data.id==='string'&&MP_IDS.indexOf(data.id)>0){ MP.netId=data.id; MP.slotIdx=MP_IDS.indexOf(data.id); }
    if(MP.roomCode)lastRoomSet(MP.roomCode.replace(/^MINISURV-/,''));   // entrou: guarda o código para a próxima vez
    if(!data.ig&&state==='menu'&&!MP.gameStarted){ MP.lobbyOn=true; MP.players=[]; MP._lobErr=false; try{lobbyShow();}catch(e){} }
  } else if(data.type==='lobby'){
    if(!Array.isArray(data.players)) return;
    const list=[];
    for(const p of data.players.slice(0,MP_MAX)){
      if(!p||typeof p.id!=='string'||!NET_OK_IDS.has(p.id)) continue;
      list.push({id:p.id,name:sanitizeName(p.name),ready:!!p.ready,host:p.id==='host',away:!!p.away});
    }
    MP.players=list;
    MP.lobbyInfo=typeof data.info==='string'?data.info.replace(/[^\wÀ-ÿ\s:.\-]/g,'').slice(0,40):'';
    MP._starting=!!data.starting;
    if(data.ig){   // em partida: quem saiu some do mundo
      for(const id in remotePlayers){ const p=list.find(q=>q.id===id); if(!p||p.away){ toast((remotePlayers[id].name||'Jogador')+' saiu'); delete remotePlayers[id]; } }
    }
    try{lobbyRender();}catch(e){}
  } else if(data.type==='full'){
    guestRoomClosed(data.why==='iniciada'?'A partida já começou. Peça ao host para criar outra sala.':'Sala cheia (máximo de '+MP_MAX+' jogadores). Peça ao host para liberar uma vaga.');
  } else if(data.type==='kick'){
    if(data.why!=='kick')lastRoomForget();
    guestRoomClosed(data.why==='kick'?'Você foi removido da sala pelo host.':'O host encerrou a sala.');
  }
}
/* Veículos que não dirigimos: guarda destino e interpola (antes pulavam a cada pacote e o snapshot desfazia a posição fresca do motorista) */
function vehSetTarget(v,x,y,f){
  if(v._nx===undefined||Math.hypot(x-v.x,y-v.y)>140){v.x=x;v.y=y;v.face=f;}
  v._nx=x;v._ny=y;v._nf=f;
}
function applySnapshot(snap){
  if(!snap || typeof snap !== 'object' || !MP.active) return;
  if(!MP.isHost&&Array.isArray(snap.ch))snap.ch.forEach((v,i)=>{if(chestList[i]&&v===1)chestList[i].open=true;});
  const nowS=performance.now();
  const quiet=nowS-(MP._tStruct||0)>LOCAL_GRACE;                 // nada nosso em transito: pode aceitar a versao do anfitriao
  const smode=!quiet?0:(snap.vfull===true?2:1);                  // 0: so soma, 1: soma e atualiza, 2: tambem tira o que o anfitriao nao tem
  if(!MP.isHost&&(Array.isArray(snap.tg)||Array.isArray(snap.rg))){ // árvores/pedras: o mapa do convidado fica IGUAL ao do anfitrião (tira o que sumiu E devolve o que o anfitrião ainda tem)
    let c1=applyGone(BASE_TREES,trees,snap.tg),c2=applyGone(BASE_ROCKS,rocks,snap.rg);
    if(nowS-(MP._tTree||0)>LOCAL_GRACE){
      if(restoreBase(BASE_TREES,BASE_TOBJ,trees,snap.tg))c1=true;
      if(restoreBase(BASE_ROCKS,BASE_ROBJ,rocks,snap.rg))c2=true;
      hpApply(trees,snap.th,4);hpApply(rocks,snap.rh,5);
    }
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
    if(smode<2)for(const c of campfires){   // fogueira so nossa (acabamos de acender): fica ate o anfitriao confirmar
      if(!merged.some(m=>Math.abs(m.x-c.x)<8&&Math.abs(m.y-c.y)<8)){
        merged.push({x:c.x,y:c.y,t:c.t||0,flicker:c.flicker||0});
      }
    }
    campfires = merged;
  }
  plotsApplySnapshot(snap.plots,smode);if(Array.isArray(snap.fr))for(const a of snap.fr)if(Array.isArray(a))fruitRemote({x:a[0],y:a[1],r:a[2]});if(Array.isArray(snap.br))for(const k of snap.br)structRemote(k);fenceApplySnapshot(snap.fn,smode);cellApplySnapshot(snap.pf,smode);if(Array.isArray(snap.gh))for(const a of snap.gh)if(Array.isArray(a))ghRemote({x:a[0],y:a[1]});
  stashSnapshot(snap.bx,smode);wellSnapshot(snap.wl);logSnapshot(snap.lg,smode);
  if(smode===2){doorsSync(snap.dr);iceSync(snap.ice);}   // portas e gelo quebrado tambem ficam iguais (antes so na entrada)
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
      const weDrive = (v === P?.inVehicle) && !imPassenger();
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
      weather=snap.weather;weatherK=Number.isFinite(snap.wk)?clamp(snap.wk,.4,1.6):1;wxF=Number.isFinite(snap.wf)?clamp(snap.wf,0,1):1;
      setRain(weather==='rain');
      toast(weather==='none'?'Clima limpo':wxStartMsg());
    }
  }
  if(Number.isFinite(snap.weatherTimer)) weatherTimer=clamp(snap.weatherTimer,0,300);
  weatherK=Number.isFinite(snap.wk)?clamp(snap.wk,.4,1.6):1;
  if(Number.isFinite(snap.wf)) wxF=clamp(snap.wf,0,1);
  if(Number.isFinite(snap.kills)) kills = snap.kills;
}
let BASE_TREES=[],BASE_ROCKS=[],BASE_TOBJ=new Map(),BASE_ROBJ=new Map();
/* chave "x,y" guardada no proprio objeto: montar ~5000 textos a cada snapshot completo (numero vira texto) pesava no celular */
function objKey(t){return t._k!==undefined&&t._kx===t.x&&t._ky===t.y?t._k:(t._kx=t.x,t._ky=t.y,t._k=t.x+','+t.y);}
function goneList(base,arr){const cur=new Set();for(let i=0;i<arr.length;i++)cur.add(objKey(arr[i]));const g=[];for(const k of base)if(!cur.has(k))g.push(k);return g;}
/* o convidado perdeu uma árvore/pedra que o anfitrião ainda tem (golpe perdido, queda de conexão...): devolve do mapa original */
function restoreBase(base,objs,arr,gone){
  if(!Array.isArray(gone)||!objs||!objs.size)return false;
  const g=new Set(gone),have=new Set();for(let i=0;i<arr.length;i++)have.add(objKey(arr[i]));let ch=false;
  for(const k of base){if(g.has(k)||have.has(k))continue;const o=objs.get(k);if(o){arr.push(Object.assign({},o));ch=true;}}
  return ch;
}
function hpPack(arr,full){const o=[];for(const t of arr)if(Number.isFinite(t.hp)&&t.hp<full-.001)o.push([t.x,t.y,Math.round(t.hp*100)/100]);return o;}
function hpApply(arr,list,full){
  if(!Array.isArray(list))return;
  const m=new Map();for(const a of list)if(Array.isArray(a)&&Number.isFinite(a[2]))m.set(a[0]+','+a[1],a[2]);
  for(const o of arr){const h=m.get(objKey(o));if(h!==undefined)o.hp=h;else if(Number.isFinite(o.hp)&&o.hp<full-.001)o.hp=full;}
}
function applyGone(base,arr,gone){
  if(!Array.isArray(gone)||!gone.length)return false;
  const g=new Set(gone);let ch=false;
  for(let i=arr.length-1;i>=0;i--)if(g.has(objKey(arr[i]))){arr.splice(i,1);ch=true;}
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
  // Listas grandes e quase paradas (cercas, pisos, baús, estruturas quebradas...) só vão quando mudam ou no snapshot completo (3 s)
  const sentL=MP._last||(MP._last={});
  const delta=(k,v)=>{const j=JSON.stringify(v);if(fullV||sentL[k]!==j){sentL[k]=j;return v;}return undefined;};
  const vPack=[];
  for(const v of vehicles){
    let inc=fullV||!!v.driverId||!!v.dying||Math.abs(v.spd||0)>1;
    if(!inc){ for(const an of anchors){ if(Math.abs(v.x-an.x)<800&&Math.abs(v.y-an.y)<800){inc=true;break;} } }
    if(!inc) continue;
    vPack.push({id:v.id,x:Math.round(v.x),y:Math.round(v.y),w:v.w,h:v.h,col:v.col,looted:!!v.looted,spd:+(v.spd||0).toFixed(1),face:+(v.face||0).toFixed(2),hp:v.hp,maxHp:v.maxHp,dying:!!v.dying,destroyed:!!v.destroyed,explodeT:v.explodeT});
  }
  return {type:'snapshot',day,dark:+dark.toFixed(3),T:+T.toFixed(1),weather,weatherTimer:Math.round(weatherTimer),wk:+weatherK.toFixed(2),wf:+wxF.toFixed(2),kills,
    zs:zPack,
    it:iPack,
    an:aPack,
    vehicles:vPack,vfull:fullV,
    campfires:campfires.map(c=>({x:Math.round(c.x),y:Math.round(c.y),t:c.t||0,flicker:+(c.flicker||0).toFixed(2)})),
    tents:delta('tt',tents.map(t=>[Math.round(t.x),Math.round(t.y)])),
    bx:delta('bx',stashPack()),wl:delta('wl',wellPack()),lg:delta('lg',logPack()),
    plots:plotsPack(),fr:fruitPack(),gh:delta('gh',ghPack()),fn:delta('fn',fencePack()),br:delta('br',structPack()),pf:delta('pf',cellPack()),
    dr:fullV?doorsPack():undefined,ice:fullV?icePack():undefined,
    th:fullV?hpPack(trees,4):undefined,rh:fullV?hpPack(rocks,5):undefined,
    sc:SCW.on?1:0,
    bd:packBirds(),
    tg:fullV?goneList(BASE_TREES,trees):undefined,rg:fullV?goneList(BASE_ROCKS,rocks):undefined,tn:fullV?grownPack(trees):undefined,rn:fullV?grownPack(rocks):undefined,
    ch:chestList.map(c=>c.open?1:0)
  };
}
function myNetId(){
  return MP.isHost ? 'host' : (MP.netId||'guest');
}
function packMyPlayer(){
  if(!P) return {type:'player',id:myNetId(),name:MP.playerName||'Jogador',x:0,y:0,alive:false};
  const p = {type:'player',id:myNetId(),name:MP.playerName||'Jogador',
    x:Math.round(P.x),y:Math.round(P.y),face:+P.face.toFixed(2),
    moving:!!P.moving,sprint:!!P.sprint,weapon:P.tool||P.weapon||'fists',swing:+(P.swing||0).toFixed(2),
    hp:Math.round(P.hp),alive:!P.dead,inVehicle:!!P.inVehicle,skin:SKIN_SEL,pk:P.pack?1:0,lt:(P.torch&&P.flashOn&&!P.sleeping)?1:0,hold:P.hold||'',fw:Object.keys(P.firearms||{}).filter(k=>P.firearms[k])};
  if(OBS.on&&!P.inside&&!P.inVehicle)p.ob=[Math.round(OBS.x),Math.round(OBS.y),OBS.glitch>0?1:0];
  if(GH.on&&GH.b)p.gh=[GH.b.x|0,GH.b.y|0,Math.round(GH.x),Math.round(GH.y),GH.kill>0?1:0];
  if(P.sitting)p.st=1;
  if(WP&&!WP.follow)p.wp=[Math.round(WP.x),Math.round(WP.y)];   // ponto marcado no mapa: os outros veem o simbolo
  if(P.bleed&&!P.dead)p.bl=1;   // sangrando: os aliados veem as gotas e o aviso ao lado da barra de vida (arquivo 31)
  if(P.sleeping){const sl=P.sleeping;p.sl=[SLC[sl.s]|0,sl.hx|0,sl.hy|0,sl.tent?1:0];}
  if(P.fish){p.fx=Math.round(P.fish.x);p.fy=Math.round(P.fish.y);p.fl=P.fish.ph?0:+Math.max(0,P.fish.wait-P.fish.t).toFixed(1);}
  if(P.inVehicle&&imPassenger()){
    p.vs=P.inVehicle.id;p.vp=1;   // passageiro: só avisa em qual veículo está; quem manda no veículo é o motorista
  }else if(P.inVehicle){
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
  const L=isHost?MP.save:null;   // mundo salvo do host
  // Fullscreen no MP: só marca intenção. O navegador exige gesto do usuário
  // (enterMultiplayerGame é disparado por evento de rede, não por toque).
  // O primeiro toque em jogo chama tryFullscreenFromGesture().
  if(CFG.fullscreen&&!KBM) userWantsFS=true;
  else userWantsFS=false;
  WP=null;   // nenhum ponto marcado de uma partida anterior vai para esta
  MP.isHost=isHost;MP.gameStarted=true;MP.reconnecting=false;MP.guestAway=false;MP.lobbyOn=false;
  try{
    if(!plane) throw new Error('mundo não carregado');
    const SO=[[0,0],[40,40],[-40,40],[40,-40]][isHost?0:(MP.slotIdx|0)]||[40,40];   // cada jogador nasce num ponto diferente, perto do host
    const offX = SO[0];
    const offY = SO[1];
    const spx=(!isHost&&MP.spawn)?MP.spawn[0]-70:plane.x, spy=(!isHost&&MP.spawn)?MP.spawn[1]:plane.y;   // convidado nasce perto de onde o host esta
    // ⚠️ ORDEM CORRETA: cria P PRIMEIRO
    if(L) restorePlayerState(L); else
    P={x:spx+70+offX, y:spy+offY, r:5, hp:100, food:85, water:85, stam:100, temp:0,
      face:Math.PI/2, moving:false, sprint:false, exhausted:false, cd:0, swing:0, flash:0, bleed:false, dead:false,
      weapon:'fists', melee:null, meleeWeapons:[], firearms:{}, ammo:0, arrows:0,
      inv:[{t:'bandage',n:1},{t:'water',n:1}],
      walk:0, inside:null, inVehicle:null};
    if(!isHost&&guestRestore()) setTimeout(()=>{try{toast('Você voltou com o que conquistou neste mundo');}catch(e){}},900);   // convidado: volta com o inventario que ja tinha aqui
    pushOut(P,P.r);
    rebuildSolidGrid();
    // ⚠️ DEPOIS de criar P, aí sim popula zumbis (só no Host)
    if(isHost){
      if(L) restoreZombies(L); else if(zombies.length===0) populate();
      console.log('[Host] populate —',zombies.length,'zumbis');
    } else {
      // Guest começa limpo e recebe autoridade do host via snapshot
      zombies=[];
      campfires=[];
      animals=animals||[]; // mundo seed já gerou; host sobrescreve via snap
    }
    if(!L){T=0; kills=0; spawnTimer=3; day=1; update._lastDay=1;}   // mundo salvo: o relogio, o dia e os abates vem do save
    shake=0; flash=0; dark=0; MP._vNext=0;
    try{missionsInit();}catch(e){}
    recentRemoved=[]; recentAdded=[];
    atkHeld=false; sprintHeld=false; touchGas=0; touchSteer=0; stepT=0;
    remotePlayers={}; MP.gameOver=false; MP.syncT=0;
    restoreWalkHUD();
    applyHudClasses();
    buildInv(); updateHud(true);
    state='play';
    if(isHost&&curSlot>0){saveGame();refreshContinue();}   // o mundo do host ja nasce salvo no slot (ou e atualizado)
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

