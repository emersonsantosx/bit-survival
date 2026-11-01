/* ============ ESTADO ============ */
let state='menu';
let selectedMap='forest';
let mpSelectedMap='forest';
let weather='none';
let weatherTimer=120;
let weatherParticles=[];
let cityInter=[],cityCrash=null,lampList=[];
let trees=[],rocks=[],blds=[],walls=[],items=[],zombies=[],roads=[],decals=[],parts=[],tracers=[],towns=[],lakes=[],vehicles=[],campfires=[],tents=[],spits=[],decorations=[],animals=[];
let remotePlayers={};
let nextZombieNetId=1;
let plane=null;
let P=null,T=0,kills=0,shake=0,flash=0,spawnTimer=3,dark=0,day=1,hudT=0;
const DECAL_LIFE=45; // segundos até a mancha de sangue sumir
let atkHeld=false,sprintHeld=false,noiseT=0,tt=null;
let recentRemoved=[],recentAdded=[]; // convidado: mudanças de itens ainda não confirmadas pelo host
let touchGas=0,touchSteer=0,stepT=0;
let MP={gameStarted:false,reconnecting:false,guestAway:false,seed:null,reconnStart:0,reconnTries:0,active:false,isHost:false,peer:null,conn:null,roomCode:'',connected:false,syncT:0,lastRecv:0,myId:null,scriptLoaded:false,playerName:'Jogador',gameOver:false,rtt:80,pingT:0,snapT:0.16,failCount:0};
// STUN + TURN públicos (openrelay) — ajuda celular em 4G/CGNAT
const PEER_ICE={iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:openrelay.metered.ca:80', username:'openrelayproject', credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443', username:'openrelayproject', credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp', username:'openrelayproject', credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:80?transport=tcp', username:'openrelayproject', credential:'openrelayproject'}
], iceTransportPolicy:'all'};
function mpSend(data){
  if(!MP.conn||!MP.conn.open) return false;
  try{ MP.conn.send(data); return true; }
  catch(e){ MP.failCount=(MP.failCount||0)+1; return false; }
}
/* Validação básica de pacotes / nomes (anti-lixo) */
const NET_OK_TYPES=new Set(['worldInit','start','evt','player','snapshot','chat','gameOver','playerDied','playerRespawned','ping','pong']);
const NET_OK_MAPS=new Set(['forest','desert','snow','city']);
const NET_OK_EVT=new Set(['mission','treeDmg','rockDmg','itemRemoved','itemAdded','vehicleEnter','vehicleExit','vehicleLooted','shot','spit','campfireAdded','campfireRemoved','yeti','chestOpen','tentAdded','sleepSkip','zombieDmg','animalDmg','vehicleDying','vehicleExploded','vehDmg','ping','bolt','zAtk','aAtk','curse','doorSet','plotSet','iceBreak','ghAdd']);
const NET_OK_IDS=new Set(['host','guest']);
function sanitizeName(n){
  if(typeof n!=='string') return 'Jogador';
  // Letras (incl. acentos), números, espaço e -_. — sem regex unicode avançada (WebView antigo)
  const s=n.replace(/[^a-zA-Z0-9À-ÿ\s\-_.]/g,'').replace(/\s+/g,' ').trim().slice(0,12);
  return s || 'Jogador';
}
function sanitizeRoomCode(c){
  if(typeof c!=='string') return '';
  return c.replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,6);
}
function isFiniteNum(v){ return typeof v==='number' && Number.isFinite(v); }
function clampWorldPos(x,y){
  return { x: clamp(x,0,WW), y: clamp(y,0,WH) };
}
/* Chat multiplayer (não altera HUD) */
let chatOpen=false;
const chatLog=[]; // {name,text,me,t}
function setChatButtonVisible(on){
  const b=$('bchat');
  if(!b) return;
  if(on) b.classList.add('show'); else b.classList.remove('show');
  document.body.classList.toggle('haschat',!!on);
  if(!on) b.classList.remove('has-new');
}
let chatUnread=0;
function chatTime(t){const d=new Date(t||Date.now());return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
function chatAddHistory(e){
  const box=$('chat-hist'); if(!box) return;
  const empty=box.querySelector('.empty'); if(empty) empty.remove();
  const stick=(box.scrollHeight-box.scrollTop-box.clientHeight)<40||chatOpen===false;
  const el=document.createElement('div');
  el.className='cm'+(e.me?' me':'')+(e.sys?' sys':'');
  if(e.sys) el.textContent=e.text;
  else {
    const n=document.createElement('span'); n.className='cn'; n.textContent=e.me?'Você':(e.name||'?');
    const tm=document.createElement('span'); tm.className='ctm'; tm.textContent=chatTime(e.t);
    n.appendChild(tm); el.appendChild(n);
    el.appendChild(document.createTextNode(e.text));
  }
  box.appendChild(el);
  while(box.children.length>120) box.removeChild(box.firstChild);
  if(stick||e.me) box.scrollTop=box.scrollHeight;
}
function chatShowEmpty(){
  const box=$('chat-hist'); if(!box||box.children.length) return;
  const d=document.createElement('div'); d.className='empty'; d.textContent='Nenhuma mensagem ainda.\nEscreva abaixo para falar com o seu parceiro.'; d.style.whiteSpace='pre-line'; box.appendChild(d);
}
function resetChatHistory(){
  chatLog.length=0; chatUnread=0;
  const box=$('chat-hist'); if(box) box.innerHTML='';
  const b=$('bchat'); if(b){ b.removeAttribute('data-n'); b.classList.remove('has-new'); }
}
function pushChatBubble(name, text, me, sys){
  // Histórico completo (aba do chat)
  const entry={name,text,me:!!me,sys:!!sys,t:Date.now()};
  chatLog.push(entry); if(chatLog.length>120) chatLog.shift();
  chatAddHistory(entry);
  if(!me&&!sys&&!chatOpen){
    chatUnread++;
    const b=$('bchat'); if(b){ b.setAttribute('data-n',chatUnread>9?'9+':String(chatUnread)); }
  }
  // Balão rápido no topo (some sozinho). Com a aba aberta ele fica escondido.
  const box=$('chat-msgs');
  if(!box) return;
  const el=document.createElement('div');
  el.className='chat-bubble'+(me?' me':'')+(sys?' sys':'');
  if(sys) el.textContent=text;
  else {
    const n=document.createElement('span'); n.className='cn'; n.textContent=(name||'?')+': ';
    el.appendChild(n);
    el.appendChild(document.createTextNode(text));
  }
  box.appendChild(el);
  while(box.children.length>6) box.removeChild(box.firstChild);
  // Auto-fade after a few seconds
  setTimeout(()=>{ if(el.parentNode){ el.style.opacity='0'; el.style.transition='opacity .4s'; setTimeout(()=>{if(el.parentNode)el.remove();},450);} }, 8000);
}
/* Ajusta a aba à área visível: com o teclado do celular aberto ela fica inteira acima dele */
function fitChatPanel(){
  const p=$('chat-panel'); if(!p||!chatOpen) return;
  const vv=window.visualViewport;
  if(!vv){ return; }
  const w=Math.min(420,vv.width);
  p.style.top=vv.offsetTop+'px';
  p.style.height=vv.height+'px';
  p.style.width=w+'px';
  p.style.left=(vv.offsetLeft+vv.width-w)+'px';
  p.style.right='auto';
  const h=$('chat-hist'); if(h) h.scrollTop=h.scrollHeight;
}
function openChat(){
  if(!MP.active) return;
  if(state!=='play' && state!=='craft') return;
  chatOpen=true;
  document.body.classList.add('chatopen');
  const p=$('chat-panel'); if(p) p.classList.add('open');
  chatUnread=0; const b=$('bchat'); if(b){ b.classList.remove('has-new'); b.removeAttribute('data-n'); }
  if(!$('chat-hist').children.length) chatShowEmpty();
  fitChatPanel();
  const h=$('chat-hist'); if(h) h.scrollTop=h.scrollHeight;
  const inp=$('chat-input');
  if(inp){ inp.value=''; updateChatCount(); try{inp.focus({preventScroll:true});}catch(e){} setTimeout(()=>{ try{inp.focus({preventScroll:true});}catch(e){} fitChatPanel(); }, 120); }
  // Solta controles para não atacar enquanto digita
  atkHeld=false; sprintHeld=false; joy.id=null; joy.active=false; joy.x=joy.y=0;
}
function closeChat(){
  chatOpen=false;
  document.body.classList.remove('chatopen');
  const p=$('chat-panel');
  if(p){ p.classList.remove('open'); p.style.top=p.style.height=p.style.width=p.style.left=p.style.right=''; }
  const inp=$('chat-input'); if(inp){ try{inp.blur();}catch(e){} }
}
function updateChatCount(){
  const inp=$('chat-input'), c=$('chat-count'); if(c&&inp) c.textContent=(inp.value||'').length+'/60';
}
function sendChatMessage(){
  if(!MP.active) return;
  const inp=$('chat-input');
  let text=(inp&&inp.value||'').trim();
  if(!text) return;
  if(text.length>60) text=text.slice(0,60);
  const name=(MP.playerName||'Jogador').slice(0,12);
  const msg={type:'chat', name:name, text:text, id:myNetId(), t:Date.now()};
  pushChatBubble(name, text, true, false);
  const trySend=()=>{
    try{ if(MP.conn&&MP.conn.open){ MP.conn.send(msg); return true; } }catch(e){ console.error('[chat send]',e); }
    return false;
  };
  if(!trySend()){ setTimeout(trySend,120); setTimeout(trySend,400); }
  // A aba continua aberta para a conversa seguir: limpa o campo e mantém o foco
  if(inp){ inp.value=''; updateChatCount(); try{inp.focus({preventScroll:true});}catch(e){} }
}
function receiveChat(data){
  if(!data || typeof data.text!=='string') return;
  if(data.id && data.id===myNetId()) return;
  const text=String(data.text).trim().slice(0,60);
  if(!text) return;
  const name=(typeof data.name==='string'?data.name:'Amigo').slice(0,12);
  pushChatBubble(name, text, false, false);
  if(!chatOpen){ const b=$('bchat'); if(b) b.classList.add('has-new'); }
  try{ beep(620,.06,'sine',.04); }catch(e){}
}

const joy={id:null,ox:0,oy:0,px:0,py:0,x:0,y:0,active:false};

/* ============ FULLSCREEN LANDSCAPE ============ */
function lockLandscape(){
  try{
    if(screen.orientation && typeof screen.orientation.lock === 'function'){
      return screen.orientation.lock('landscape').catch(()=>{
        return screen.orientation.lock('landscape-primary').catch(()=>{});
      });
    }
  }catch(e){}
  return Promise.resolve();
}
// userWantsFS: only true when game starts or player explicitly re-enables via pause menu
let userWantsFS=false;
function tryFullscreenFromGesture(){
  // Called from real user input (touch/click) so browsers allow requestFullscreen
  if(!userWantsFS || !CFG.fullscreen) return;
  if(state!=='play' && state!=='craft' && state!=='pause') return;
  if(isFullscreen()) return;
  requestFullscreenLandscape(true);
}
function requestFullscreenLandscape(force){
  if(!force && !userWantsFS) return;
  userWantsFS=true;
  try{
    const el = document.documentElement;
    const already = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const goFS = () => {
      if(already) return Promise.resolve();
      if(el.requestFullscreen) return el.requestFullscreen();
      if(el.webkitRequestFullscreen) return Promise.resolve(el.webkitRequestFullscreen());
      if(el.msRequestFullscreen) return Promise.resolve(el.msRequestFullscreen());
      return Promise.resolve();
    };
    goFS().then(()=>{
      lockLandscape();
      setTimeout(lockLandscape, 120);
      setTimeout(lockLandscape, 400);
    }).catch(()=>{
      lockLandscape();
      setTimeout(lockLandscape, 200);
    });
  }catch(e){
    try{ lockLandscape(); }catch(_){}
  }
}
// Only re-lock orientation on rotate — NEVER force fullscreen back automatically
window.addEventListener('orientationchange', ()=>{
  if(userWantsFS && (state==='play' || state==='craft' || state==='pause' || state==='dead')){
    setTimeout(lockLandscape, 150);
  }
});
document.addEventListener('fullscreenchange', ()=>{
  // If user left fullscreen (system gesture), respect it — do not re-enter
  if(!document.fullscreenElement){
    // Keep userWantsFS as-is; only pause menu can re-enable
    if(userWantsFS) lockLandscape();
  }
});
document.addEventListener('webkitfullscreenchange', ()=>{
  if(!document.webkitFullscreenElement){
    if(userWantsFS) lockLandscape();
  }
});

/* ============ INVENTÁRIO ============ */
function addItem(type, n){
  n = n || 1;
  try{track('get_'+type,n);}catch(e){}
  for(const slot of P.inv){
    if(slot.t === type){ slot.n += n; buildInv(); return true; }
  }
  if(P.inv.length >= invCap()) return false;
  P.inv.push({t: type, n: n});
  buildInv();
  return true;
}
function countInv(t){
  let total = 0;
  for(const slot of P.inv) if(slot.t === t) total += slot.n;
  return total;
}
function removeInv(t, n){
  n = n || 1;
  for(let i = P.inv.length - 1; i >= 0 && n > 0; i--){
    if(P.inv[i].t === t){
      const take = Math.min(n, P.inv[i].n);
      P.inv[i].n -= take;
      n -= take;
      if(P.inv[i].n <= 0) P.inv.splice(i, 1);
    }
  }
  buildInv();
}

