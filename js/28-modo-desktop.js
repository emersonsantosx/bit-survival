/* MODO DESKTOP (teclado + mouse)
   O jogo descobre sozinho se esta num computador (mouse e teclado) ou num celular/tablet (toque) e adapta controles e interface:
   - computador: WASD/setas andam, Shift corre, o personagem mira onde esta o mouse, clique esquerdo ataca, direito interage, roda do mouse troca de arma;
     os botoes de toque somem, aparecem as teclas ao lado dos botoes e NAO pede tela cheia nem trava em paisagem;
   - celular: tudo continua igual (joystick e botoes na tela).
   Se a pessoa mudar de ideia no meio (tocar na tela num notebook com toque, ou apertar uma tecla com teclado no tablet), a interface troca na hora.
   KBM (declarado em 01-base.js) vale true no modo teclado e mouse. */
(function(){
const KEYS={};                          // teclas apertadas (por e.code)
const M={x:0,y:0,has:false};            // mouse em coordenadas do canvas
let hintShown=false,wheelT=0;
const typing=e=>{const t=e&&e.target;return !!(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable));};
function detect(){
  if(window.cordova||window.Capacitor||IS_MOBILE)return false;
  let coarse=false,hover=true;
  try{coarse=matchMedia('(pointer:coarse)').matches;hover=matchMedia('(hover:hover)').matches;}catch(e){}
  return !coarse&&hover;
}
function releaseAll(){
  for(const k in KEYS)delete KEYS[k];
  try{atkHeld=false;sprintHeld=false;touchGas=0;touchSteer=0;}catch(e){}
}
window.setInputMode=function(kbm){
  kbm=!!kbm;if(kbm===KBM&&document.body.classList.contains(kbm?'kbm':'touchmode'))return;
  KBM=kbm;releaseAll();
  document.body.classList.toggle('kbm',kbm);document.body.classList.toggle('touchmode',!kbm);
  if(kbm){joy.id=null;joy.active=false;joy.x=joy.y=0;}else M.has=false;
  try{resize();}catch(e){}
  if(kbm)tagKeys();
};
/* teclas para o jogo (usadas por update() em 11-pesca-update.js) */
window.kbMove=function(){
  if(!KBM)return null;
  let x=0,y=0;
  if(KEYS.KeyA||KEYS.ArrowLeft)x-=1;if(KEYS.KeyD||KEYS.ArrowRight)x+=1;
  if(KEYS.KeyW||KEYS.ArrowUp)y-=1;if(KEYS.KeyS||KEYS.ArrowDown)y+=1;
  if(!x&&!y)return null;
  const l=Math.hypot(x,y);return{x:x/l,y:y/l};
};
window.kbAim=function(){   // angulo do personagem ate o mouse (null se o mouse ainda nao se mexeu)
  if(!KBM||!M.has||!P)return null;
  const wx=camX+M.x/Z,wy=camY+M.y/Z;
  return Math.atan2(wy-(P.y-6),wx-P.x);
};
let kbDrv=false;
window.kbVehicle=function(){   // dirigir com WASD/setas (os botoes de toque ficam escondidos); sem tecla apertada, deixa quem mexeu em touchGas/touchSteer
  const g=(KEYS.KeyW||KEYS.ArrowUp?1:0)-(KEYS.KeyS||KEYS.ArrowDown?1:0),s=(KEYS.KeyD||KEYS.ArrowRight?1:0)-(KEYS.KeyA||KEYS.ArrowLeft?1:0);
  if(g||s){touchGas=g;touchSteer=s;kbDrv=true;}
  else if(kbDrv){touchGas=0;touchSteer=0;kbDrv=false;}   // acabou de soltar as teclas
};
/* botoes escondidos continuam recebendo os mesmos eventos: as teclas apertam o botao de verdade */
function press(id,down){const b=$(id);if(!b)return;try{b.dispatchEvent(new PointerEvent(down?'pointerdown':'pointerup',{bubbles:true,cancelable:true,pointerId:77,pointerType:'mouse'}));}catch(e){}}
const HOLD={KeyB:'hoe'};
/* ---- quem muda o modo ---- */
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'||e.pointerType==='pen'){if(KBM)setInputMode(false);}
  else if(e.pointerType==='mouse'&&!IS_MOBILE&&!KBM&&!window.cordova)setInputMode(true);
},true);
document.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  if(!KBM&&!IS_MOBILE&&!window.cordova&&(e.movementX||e.movementY))setInputMode(true);
  if(!KBM)return;
  const p=toCanvasXY(e);M.x=p.x;M.y=p.y;M.has=true;
},true);
/* ---- mouse no jogo ---- */
cv.addEventListener('pointerdown',e=>{
  if(!KBM||e.pointerType!=='mouse')return;
  e.stopImmediatePropagation();                 // nao deixa o antigo joystick de toque assumir o clique
  aud();
  if(state!=='play'||!P)return;
  e.preventDefault();
  const p=toCanvasXY(e);M.x=p.x;M.y=p.y;M.has=true;
  if(e.button===0){
    const hit=MP.active?pingBadgeHit(p):null;if(hit){sendPing(hit);return;}
    atkHeld=true;attack();
  }else if(e.button===2){pickup();}
},true);
window.addEventListener('pointerup',e=>{if(KBM&&e.pointerType==='mouse'&&e.button===0)atkHeld=false;});
cv.addEventListener('contextmenu',e=>{if(KBM)e.preventDefault();});
document.getElementById('hud').addEventListener('contextmenu',e=>{if(KBM)e.preventDefault();});
window.addEventListener('wheel',e=>{
  if(!KBM||state!=='play'||chatOpen||weaponWheelOpen||(e.target&&e.target.closest&&e.target.closest('#chat-panel,#bigmap')))return;
  const t=performance.now();if(t-wheelT<140)return;wheelT=t;
  if(P&&!P.inVehicle)cycleWeapon();
},{passive:true});
/* ---- teclado ---- */
window.addEventListener('keydown',e=>{
  if(typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;   // Ctrl+W, Alt+tab etc. continuam sendo do navegador
  const gameKey=/^(Key[A-Z]|Digit\d|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Tab|F1)$/.test(e.code);
  if(gameKey&&!KBM&&!IS_MOBILE&&!window.cordova&&(state==='play'||state==='pause'))setInputMode(true);   // apertou tecla: e teclado
  if(!KBM)return;
  if(keysOpen()){
    if(e.code==='Escape'||e.code==='KeyH'||e.code==='F1'||e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();keysClose();}
    return;
  }
  if(e.code==='F1'||(e.code==='KeyH'&&!chatOpen&&state==='play')){e.preventDefault();keysOpen2();return;}
  if(e.code==='Tab'){e.preventDefault();if(state==='play'&&!chatOpen&&P&&!P.inVehicle){if(weaponWheelOpen)closeWeaponWheel();else openWeaponWheel();}return;}
  if(e.repeat){return;}
  KEYS[e.code]=true;
  if(state!=='play')return;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprintHeld=true;
  else if(e.code==='KeyX'){press('tools',true);press('tools',false);}
  else if(HOLD[e.code])press(HOLD[e.code],true);
  else if(e.code==='Enter'&&P&&P.inVehicle)exitVehicle();
},true);
window.addEventListener('keyup',e=>{
  if(!KBM)return;
  delete KEYS[e.code];
  if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprintHeld=false;
  else if(HOLD[e.code])press(HOLD[e.code],false);
},true);
window.addEventListener('blur',()=>{releaseAll();if(KBM&&state==='play'&&!MP.active){try{pause();}catch(e){}}});   // alt-tab: pausa e solta as teclas
/* ---- dicas de teclas ao lado dos botoes ---- */
function tagKeys(){
  const t={bpause:'Esc',bcraft:'C',bpack:'I',bflash:'F',pick:'E',tools:'X',hoe:'B',bchat:'T'};
  for(const id in t){const e=$(id);if(e)e.dataset.key=t[id];}
}
/* ---- tela de controles ---- */
const ROWS=[
  ['Andar','W A S D  ou  setas'],['Correr','Shift'],['Mirar','Mouse'],['Atacar, atirar, pescar','Clique esquerdo  ou  Espaço'],
  ['Pegar, interagir, veículo','Clique direito  ou  E'],['Trocar de arma','Q  ou  roda do mouse'],['Roda de armas','Tab'],
  ['Usar item da mochila','1 a 6'],['Mochila','I'],['Fabricar','C'],['Lanterna','F'],['Descartar último item','R'],
  ['Ferramenta de construção / arar','X  /  B'],['Mapa grande','M'],['Chat (multiplayer)','T'],['Dirigir','W S acelera e freia, A D vira, E sai'],
  ['Pausa','Esc'],['Esta tela','H  ou  F1'],['Tela cheia','F11']
];
function buildKeys(){
  if($('keysscr'))return;
  const d=document.createElement('div');d.id='keysscr';d.className='screen hide';
  d.innerHTML='<div class="card"><h1>CONTROLES</h1><div class="keyrows">'+ROWS.map(r=>'<div class="kr"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'</div><button class="menu-btn" id="keysclose">ENTENDI</button></div>';
  document.body.appendChild(d);
  d.querySelector('#keysclose').addEventListener('click',e=>{e.preventDefault();keysClose();});
}
function keysOpen(){const e=$('keysscr');return !!(e&&!e.classList.contains('hide'));}
function keysOpen2(){buildKeys();if(state==='play')pause();setTimeout(()=>{$('keysscr').classList.remove('hide');},0);}
function keysClose(){const e=$('keysscr');if(e)e.classList.add('hide');}
window.keysToggle=()=>{if(keysOpen())keysClose();else keysOpen2();};
buildKeys();
/* botao CONTROLES no menu de pausa (so aparece no desktop, por CSS) */
{const p=$('pauseCfg');if(p&&!$('pauseKeys')){const b=document.createElement('button');b.className='menu-btn sec';b.id='pauseKeys';b.textContent='CONTROLES';b.style.cssText=p.style.cssText;p.parentNode.insertBefore(b,p);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();aud();buildKeys();$('keysscr').classList.remove('hide');});}}
/* dica de comandos ao comecar a jogar (uma vez por visita) */
setInterval(()=>{
  if(!KBM||hintShown||state!=='play')return;
  hintShown=true;try{if(sessionStorage.getItem('bs_kbhint'))return;sessionStorage.setItem('bs_kbhint','1');}catch(e){}
  try{toast('WASD anda · Mouse mira · Clique ataca · H mostra os controles');}catch(e){}
},1000);
/* estado inicial */
KBM=detect();document.body.classList.toggle('kbm',KBM);document.body.classList.toggle('touchmode',!KBM);
if(KBM)tagKeys();
try{resize();}catch(e){}
})();
