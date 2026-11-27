/* ====================== SO DENTRO DO APK ======================
   Este arquivo NAO e carregado pelo link do jogo: tools/preparar-apk.js copia ele para o app (como js/apk.js) na hora de compilar.
   Aqui ficam as diferencas do app Android: sem a tela "gire o celular" e sem o botao de tela cheia (o Android ja abre deitado e em tela
   cheia, ver config.xml e android/plugin-bit), botao/gesto de VOLTAR, pausa ao minimizar, margem da camera na HUD e teclado sem cobrir
   o campo de texto. */
(function(){
  const raiz=document.documentElement;
  raiz.classList.add('apk');
  const css=document.createElement('style');
  css.textContent=[
    'html.apk{--apk-l:0px;--apk-r:0px}',
    'html.apk #rotate,html.apk #pauseFS{display:none!important}',
    /* o desenho do jogo ocupa a tela toda; so os botoes e textos fogem do recorte da camera */
    'html.apk #hud{left:var(--apk-l);right:var(--apk-r)}',
    'html.apk #bchat,html.apk #missions{margin-right:var(--apk-r)}',
    'html.apk #chat-msgs,html.apk #fpsHud{margin-left:var(--apk-l)}',
    'html.apk #chat-panel{box-sizing:border-box;padding-right:var(--apk-r)}',
    'html.apk .screen{padding-left:calc(8px*var(--ui,1) + var(--apk-l));padding-right:calc(8px*var(--ui,1) + var(--apk-r))}',
    '#apkAviso{position:fixed;left:50%;bottom:calc(16px*var(--ui,1));transform:translateX(-50%);z-index:100000;pointer-events:none;white-space:nowrap;'+
      'background:#1f242c;color:#E8E0CC;border:calc(3px*var(--ui,1)) solid #3f4652;box-shadow:0 calc(3px*var(--ui,1)) 0 #0c0e12;'+
      'padding:calc(8px*var(--ui,1)) calc(12px*var(--ui,1));font:calc(12px*var(--ui,1))/1.4 "Courier New",monospace}'
  ].join('\n');
  document.head.appendChild(css);
  /* o app ja esta em tela cheia e travado em paisagem pelo Android: os pedidos feitos "do jeito do navegador" nao fazem nada aqui
     (a tela cheia do navegador dentro do app move o jogo para outra janela e atrapalha o VOLTAR) */
  window.requestFullscreenLandscape=function(){};
  window.lockLandscape=function(){return Promise.resolve();};

  /* o motor do multiplayer ja vem dentro do app; sem internet, avisa na hora em vez de ficar tentando conectar */
  const carregarPeer=window.loadPeerJS;
  window.loadPeerJS=function(cb){
    if(navigator.onLine!==false)return carregarPeer(cb);
    const id=MP.isHost?'hostStatus':'joinStatus';   // antes do cb, que zera MP.isHost
    cb&&cb(new Error('offline'));
    setStatus(id,'Sem internet. O multiplayer precisa de conexão.',true);
  };

  /* ---------- botao / gesto de VOLTAR ---------- */
  const el=id=>document.getElementById(id);
  const visivel=id=>{const e=el(id);return !!e&&!e.classList.contains('hide');};
  const toque=id=>{const e=el(id);if(e)e.click();};
  let aviso=null,avisoT=0,confirma='',confirmaT=0;
  function avisar(txt){
    if(!aviso){aviso=document.createElement('div');aviso.id='apkAviso';document.body.appendChild(aviso);}
    aviso.textContent=txt;aviso.style.display='';clearTimeout(avisoT);avisoT=setTimeout(()=>{aviso.style.display='none';},2000);
  }
  /* acoes que nao tem volta (fechar o jogo, sair da sala) pedem VOLTAR duas vezes seguidas */
  function duasVezes(chave,txt,fn){
    const agora=Date.now();
    if(confirma===chave&&agora-confirmaT<2000){confirma='';if(aviso)aviso.style.display='none';fn();}
    else{confirma=chave;confirmaT=agora;avisar(txt);}
  }
  const TELAS={mapscreen:'btnBackMap',slotscreen:'btnBackSlot',skinscreen:'btnBackSkins',achscreen:'btnBackAch',mpscreen:'btnMPBack',mphostscreen:'btnHostBack',mpjoinscreen:'btnJoinBack'};
  function voltar(){
    const campo=document.activeElement;
    if(campo&&campo.tagName==='INPUT'&&campo.type==='text')campo.blur();
    if(visivel('loading'))return;
    if(chatOpen){closeChat();return;}
    if(weaponWheelOpen){closeWeaponWheel();return;}
    if(bigOpen){bigMapClose();return;}
    if(visivel('keysscr')){keysClose();return;}
    if(visivel('slotConfirm')&&visivel('slotscreen')){closeSlotAsk();return;}
    if(visivel('invscr')||visivel('craftscr')||visivel('stashscr')){closeCraft();return;}
    if(visivel('configscreen')){toque('btnBackCfg');return;}
    if(visivel('pausescr')){resume();return;}
    if(visivel('deadscr'))return;   // morreu: a escolha e pelos botoes da tela
    if(visivel('mplobby')){duasVezes('sala','Voltar de novo para sair da sala',()=>toque('btnLobLeave'));return;}
    for(const id in TELAS)if(visivel(id)){toque(TELAS[id]);return;}
    if(visivel('menu')){duasVezes('app','Voltar de novo para fechar o jogo',()=>{if(navigator.app&&navigator.app.exitApp)navigator.app.exitApp();});return;}
    if(state==='play')pause();
  }
  window.apkVoltar=voltar;

  /* ---------- minimizar e voltar para o jogo ---------- */
  function minimizou(){
    try{
      saveGame();guestSave();   // guarda o progresso: o Android pode fechar o app em segundo plano (cada um so grava quando vale)
      if(state==='play'&&!MP.active)pause();
    }catch(e){}
    try{const w=musicWanted;musicStop();musicWanted=w;}catch(e){}
    try{if(AC&&AC.state==='running')AC.suspend();}catch(e){}
  }
  function reabriu(){
    try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}
    try{if(musicWanted&&!musicOn)musicStart();}catch(e){}
  }

  /* ---------- camera e teclado (avisados pelo Android, em px do jogo) ---------- */
  let tela={esq:0,dir:0,teclado:0,altura:0},movida=null;
  function ajustarTeclado(){
    if(movida){movida.style.transform='';movida=null;}
    if(!tela.teclado)return;
    const livre=tela.altura-tela.teclado,vv=window.visualViewport,alturaWeb=vv?vv.height:window.innerHeight;
    if(alturaWeb<=livre+2)return;   // este Android ja encolheu a pagina sozinho
    const chat=el('chat-panel');
    if(chatOpen&&chat){chat.style.top='0px';chat.style.height=livre+'px';return;}
    const campo=document.activeElement,t=campo&&campo.tagName==='INPUT'&&campo.closest&&campo.closest('.screen');
    if(!t)return;
    const sobra=campo.getBoundingClientRect().bottom+12-livre;
    if(sobra>0){t.style.transform='translateY(-'+Math.round(sobra)+'px)';movida=t;}
  }
  function aplicarTela(d){
    if(!d)return;
    const n=v=>Math.max(0,Number(v)||0);
    const antes=tela.teclado;
    tela={esq:n(d.esq),dir:n(d.dir),teclado:n(d.teclado),altura:n(d.altura)};
    raiz.style.setProperty('--apk-l',tela.esq+'px');raiz.style.setProperty('--apk-r',tela.dir+'px');
    if(antes&&!tela.teclado&&chatOpen)fitChatPanel();   // teclado fechou: o chat volta a altura toda
    ajustarTeclado();
  }
  window.apkTela=aplicarTela;
  const depois=()=>setTimeout(ajustarTeclado,0);
  window.addEventListener('resize',depois);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',depois);
  document.addEventListener('focusin',()=>setTimeout(ajustarTeclado,150));
  const ajustaChat=window.fitChatPanel;
  window.fitChatPanel=function(){ajustaChat();ajustarTeclado();};

  document.addEventListener('deviceready',()=>{
    document.addEventListener('backbutton',e=>{if(e&&e.preventDefault)e.preventDefault();try{voltar();}catch(err){console.error('[voltar]',err);}},false);
    document.addEventListener('pause',minimizou,false);
    document.addEventListener('resume',reabriu,false);
    if(window.cordova&&cordova.exec)cordova.exec(aplicarTela,()=>{},'BitApp','observar',[]);
  },false);
})();
