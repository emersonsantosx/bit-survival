/* Orientacao: o jogo e sempre em paisagem em celulares/tablets (telas de toque). */
(function(){
  try{
    if(!matchMedia('(pointer:coarse)').matches)return;
    // 1) Tenta travar ja na abertura (funciona em app instalado/tela cheia; navegadores comuns podem recusar).
    try{ lockLandscape(); }catch(e){}
    // 2) Icone pixel do aviso: celular em pe, seta, celular deitado
    const cv=document.getElementById('rotateCv');
    if(cv){const c=cv.getContext('2d');
      const bx=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
      bx(3,6,8,13,'#E8E0CC');bx(4,7,6,10,'#171A20');bx(6,18,2,1,'#171A20');
      bx(15,12,9,2,'#C79A54');bx(22,10,1,6,'#C79A54');bx(23,11,1,4,'#C79A54');bx(24,12,1,2,'#C79A54');
      bx(27,9,13,8,'#8DA568');bx(28,10,11,6,'#171A20');bx(38,12,1,2,'#8DA568');
    }
    // 3) Primeiro toque (em qualquer lugar) ou toque no aviso: tela cheia + trava em paisagem
    const goLand=force=>{
      try{
        if((force||CFG.fullscreen)&&!isFullscreen()) requestFullscreenLandscape(true);
        else lockLandscape();
      }catch(e){}
    };
    const rot=document.getElementById('rotate'),btn=document.getElementById('rotateBtn');
    if(rot)['pointerdown','pointerup','touchstart','touchend','click'].forEach(t=>rot.addEventListener(t,e=>e.stopPropagation()));
    if(btn)btn.addEventListener('click',e=>{e.preventDefault();goLand(true);});
    document.addEventListener('pointerdown',function once(){document.removeEventListener('pointerdown',once,true);goLand(false);},true);
    // 4) Em retrato durante a partida solo: pausa, para o jogador nao ser atacado sem ver a tela
    const portrait=matchMedia('(orientation:portrait)');
    const onChange=()=>{try{if(portrait.matches&&state==='play'&&!MP.active)pause();}catch(e){}};
    if(portrait.addEventListener)portrait.addEventListener('change',onChange);else if(portrait.addListener)portrait.addListener(onChange);
  }catch(e){}
})();
