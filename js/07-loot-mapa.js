/* ===== Reposição de loot nas casas =====
   Cada cômodo lembra quantos itens de loot foram tirados dele. 3 dias de jogo depois do primeiro saque ele repõe a mesma quantidade
   (no máximo 3), mas só se estiver vazio e sem ninguém dentro do prédio; se ainda tem item pendente no cômodo, nada nasce. */
const LOOT_RESPAWN=3*DAY_SECONDS;
/* ===== Marcador de item (só multiplayer): avisa o aliado de um item, como o "ping" dos battle royale ===== */
let pings=[],pingCD=0;
const PING_LIFE=45000;
function pingAdd(from,t,x,y,mine){
  pings=pings.filter(q=>q.from!==from);            // um marcador por jogador: o novo substitui o antigo
  pings.push({from,t,x,y,mine,at:performance.now()});
}
function sendPing(it){
  if(!MP.active||!MP.connected||!P||P.dead||!it||!ITEMS[it.t])return false;
  const now=performance.now();
  if(now<pingCD){return false;}
  pingCD=now+1200;
  pingAdd('me',it.t,Math.round(it.x),Math.round(it.y),true);
  sendEvt('ping',{t:it.t,x:Math.round(it.x),y:Math.round(it.y)});
  toast('Marcou: '+ITEMS[it.t].n);beep(880,.08,'sine',.05);
  return true;
}
/* botão discreto em cima do item mais próximo (só multiplayer): tocar nele marca o item para o aliado. O toque no botão não aciona o joystick */
let pingBadge=null;                    // {x,y,it} em pixels do canvas, atualizado a cada quadro
function pingCandidate(){
  if(!MP.active||!MP.connected||!P||P.dead||P.inVehicle||state!=='play')return null;
  let b=null,bd=34;
  for(const it of items){if(!ITEMS[it.t])continue;const d=Math.hypot(it.x-P.x,it.y-P.y);if(d<bd){bd=d;b=it;}}
  return b;
}
function drawPingBadge(){
  pingBadge=null;
  const it=pingCandidate();if(!it)return;
  const bob=Math.sin(performance.now()/260)*1.5;
  const x=(it.x-camX)*Z,y=Math.max(16,(it.y-camY)*Z-31*Z+bob);
  pingBadge={x,y,it};
  const mine=pings.find(q=>q.mine&&Math.abs(q.x-it.x)<3&&Math.abs(q.y-it.y)<3);
  const col=mine?'#4aa3ff':'#ffd84a';
  ctx.save();ctx.translate(x,y);
  ctx.globalAlpha=.82;
  ctx.fillStyle='rgba(10,14,20,.78)';ctx.beginPath();ctx.arc(0,0,11,0,6.283);ctx.fill();
  ctx.lineWidth=1.5;ctx.strokeStyle=col;ctx.stroke();
  ctx.globalAlpha=1;ctx.fillStyle=col;
  if(mine){ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-1,3);ctx.lineTo(4,-3);ctx.stroke();}
  else{ctx.beginPath();ctx.arc(0,-2,3.4,0,6.283);ctx.fill();ctx.beginPath();ctx.moveTo(-2.6,-0.2);ctx.lineTo(2.6,-0.2);ctx.lineTo(0,5);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(10,14,20,.9)';ctx.beginPath();ctx.arc(0,-2,1.2,0,6.283);ctx.fill();}
  ctx.restore();
}
function pingBadgeHit(p){            // p: ponto do toque em pixels do canvas
  const b=pingBadge;if(!b||!b.it||!items.includes(b.it))return null;
  const sx=(b.it.x-camX)*Z,sy=(b.it.y-camY)*Z;
  if(Math.hypot(p.x-b.x,p.y-b.y)<24||Math.hypot(p.x-sx,p.y-(sy-5*Z))<14)return b.it;
  return null;
}
function allyHasFirearm(t){for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Array.isArray(rp.fw)&&rp.fw.includes(t))return true;}return false;}
function pingNearest(){if(state==='play'&&!P.inVehicle)sendPing(nearestItem());}
function recvPing(d){
  if(!d||typeof d.t!=='string'||!ITEMS[d.t]||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  if(d.x<0||d.y<0||d.x>WW||d.y>WH)return;
  const now=performance.now();if(now-(recvPing._l||0)<400)return;recvPing._l=now;
  let nm='AMIGO';for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.name){nm=String(rp.name).toUpperCase().slice(0,12);break;}}
  pingAdd('ally',d.t,d.x,d.y,false);
  toast(nm+' marcou: '+ITEMS[d.t].n);beep(990,.09,'sine',.06);setTimeout(()=>beep(1320,.09,'sine',.05),90);
}
function updatePings(){
  if(!pings.length)return;
  const now=performance.now();
  pings=pings.filter(q=>now-q.at<PING_LIFE&&(now-q.at<1800||items.some(it=>it.t===q.t&&Math.abs(it.x-q.x)<6&&Math.abs(it.y-q.y)<6)));
}
function pingCol(q){return q.mine?'#4aa3ff':'#ffd84a';}
/* no mundo: anel no chão, seta e ícone do item acima dele (vale também por cima do telhado) */
function drawPingsWorld(){
  if(!pings.length)return;
  const now=performance.now();
  for(const q of pings){
    const c=pingCol(q),bob=Math.round(Math.sin(now/180)*2),pulse=((now/700)%1);
    ctx.save();
    ctx.globalAlpha=.85*(1-pulse);ctx.strokeStyle=c;ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(q.x,q.y,4+pulse*9,2+pulse*4.5,0,0,6.283);ctx.stroke();
    ctx.globalAlpha=1;
    const ax=Math.round(q.x),ay=Math.round(q.y)-16+bob;
    R(ax-3,ay,7,1,c);R(ax-2,ay+1,5,1,c);R(ax-1,ay+2,3,1,c);R(ax,ay+3,1,1,c);       // seta para baixo
    R(ax-3,ay-1,7,1,'rgba(0,0,0,.45)');
    const ic=ITEMS[q.t]&&ITEMS[q.t].e?pxCanvas(ITEMS[q.t].e):null;
    if(ic){ctx.imageSmoothingEnabled=false;ctx.drawImage(ic,ax-(ic.width>>1),ay-ic.height-2);}
    if(P){const dm=Math.round(Math.hypot(q.x-P.x,q.y-P.y)/10);if(dm>4){ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(dm+'m',ax+1,ay-(ic?ic.height:8)-3);ctx.fillStyle=c;ctx.fillText(dm+'m',ax,ay-(ic?ic.height:8)-4);}}
    ctx.restore();
  }
}
/* na tela: marcador fora da tela vira uma seta na borda apontando para o item, com a distância */
function drawPingsEdge(){
  if(!pings.length||!P)return;
  const m=26;
  for(const q of pings){
    const sx=(q.x-camX)*Z,sy=(q.y-camY)*Z;
    if(sx>=m&&sx<=W-m&&sy>=m&&sy<=H-m)continue;
    const cx=W/2,cy=H/2,dx=sx-cx,dy=sy-cy,k=Math.min((W/2-m)/Math.max(1,Math.abs(dx)),(H/2-m)/Math.max(1,Math.abs(dy)));
    const ex=cx+dx*k,ey=cy+dy*k,a=Math.atan2(dy,dx),c=pingCol(q);
    ctx.save();ctx.translate(ex,ey);
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.arc(0,0,15,0,6.283);ctx.fill();
    ctx.rotate(a);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(7,-6);ctx.lineTo(7,6);ctx.closePath();ctx.fill();
    ctx.rotate(-a);
    const ic=ITEMS[q.t]&&ITEMS[q.t].e?pxCanvas(ITEMS[q.t].e):null;
    if(ic){ctx.imageSmoothingEnabled=false;const sc=Math.min(1.6,18/Math.max(ic.width,ic.height));ctx.drawImage(ic,-ic.width*sc/2,-ic.height*sc/2,ic.width*sc,ic.height*sc);}
    ctx.font='bold 10px "Courier New",monospace';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(Math.round(Math.hypot(q.x-P.x,q.y-P.y)/10)+'m',1,27);ctx.fillStyle=c;ctx.fillText(Math.round(Math.hypot(q.x-P.x,q.y-P.y)/10)+'m',0,26);
    ctx.restore();
  }
}

/* ===== Aliado no multiplayer: ponto no minimapa, seta na borda da tela e mapa grande ===== */
const ALLY_COL=rp=>rp.isHost?'#ff8080':'#80ffa0';
function mmMarkers(){
  mmDot(P.x,P.y,4,4,Math.floor(T*2)%2?'#ffffff':'#4aa3ff');
  for(const c of campfires)mmDot(c.x,c.y,2,2,'#ff8020');
  for(const t of tents)mmDot(t.x,t.y,3,2,'#8DA568');
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp||!Number.isFinite(rp.x)||rp.alive===false)continue;
    mmDot(rp.x,rp.y,6,6,'#000',true);                       // contorno escuro: o aliado destaca em qualquer fundo
    mmDot(rp.x,rp.y,4,4,ALLY_COL(rp),true);
  }
  if(WP){wpUpdate();if(WP)mmDot(WP.x,WP.y,5,5,Math.floor(T*3)%2?'#ffffff':WP_COL,true);}
  drawPingsMini();
}
/* ===== Ponto marcado no mapa grande: um lugar qualquer ou o aliado (que passa a ser seguido). Fica só para quem marcou ===== */
let WP=null;     // {x,y,label,follow:id|null}
function wpUpdate(){
  if(!WP)return;
  if(WP.follow){
    const rp=remotePlayers[WP.follow];
    if(!rp||rp.alive===false||!Number.isFinite(rp.x)){toast('Você perdeu o contato com '+WP.label);WP=null;return;}
    WP.x=rp.x;WP.y=rp.y;
  }else if(P&&Math.hypot(WP.x-P.x,WP.y-P.y)<45){toast('Você chegou: '+WP.label);WP=null;}
}
const WP_COL='#4ae0ff';
function wpDist(){return Math.round(Math.hypot(WP.x-P.x,WP.y-P.y)/10);}
function wpPick(wx,wy,K){          // o que está embaixo do toque: aliado, lago, vila, acampamento ou só um ponto
  const tol=16/K;                  // 16 px de tela em unidades de mundo
  let best=null,bd=tol;
  for(const id in remotePlayers){const rp=remotePlayers[id];if(!rp||rp.alive===false||!Number.isFinite(rp.x))continue;const d=Math.hypot(rp.x-wx,rp.y-wy);if(d<bd){bd=d;best={x:rp.x,y:rp.y,follow:id,label:String(rp.name||'ALIADO').toUpperCase().slice(0,10)};}}
  if(best)return best;
  for(const l of lakes){const lx=l.cx,ly=l.cy;if(Math.hypot(lx-wx,ly-wy)<(l.r||150)+tol)return {x:lx,y:ly,label:l.fountain?'FONTE':selectedMap==='desert'?'OASIS':'LAGO',follow:null};}
  for(const t of towns){if(Math.hypot(t.x-wx,t.y-wy)<Math.max(tol,160))return {x:t.x,y:t.y,label:'VILA',follow:null};}
  for(const c of campfires)if(Math.hypot(c.x-wx,c.y-wy)<tol)return {x:c.x,y:c.y,label:'FOGUEIRA',follow:null};
  for(const c of tents)if(Math.hypot(c.x-wx,c.y-wy)<tol)return {x:c.x,y:c.y,label:'TENDA',follow:null};
  if(LM&&Math.hypot(LM.cx-wx,LM.cy-wy)<Math.max(tol,120))return {x:LM.cx,y:LM.cy,label:LM.kind==='temple'?'TEMPLO':'ACAMPAMENTO',follow:null};
  return {x:wx,y:wy,label:'PONTO',follow:null};
}
/* mapa grande: toque no minimapa (ou tecla M). No solo congela o jogo; no multiplayer o mundo continua e o mapa fica translúcido */
let bigOpen=false,bigTimer=0,bigPrevState='play';
const bigV={z:1,cx:0,cy:0};
function bmGeom(){                      // escala (K) e deslocamento (tx,ty) do mapa grande na tela; mantém o mapa sempre cobrindo a área
  const c=$('bmc'),S=c.width,K=S/Math.max(WW,WH)*bigV.z,mw=WW*K,mh=WH*K;
  let tx=S/2-bigV.cx*K,ty=S/2-bigV.cy*K;
  tx=mw<=S?(S-mw)/2:clamp(tx,S-mw,0);ty=mh<=S?(S-mh)/2:clamp(ty,S-mh,0);
  bigV.cx=(S/2-tx)/K;bigV.cy=(S/2-ty)/K;
  return {c,S,K,tx,ty};
}
function bmZoomAt(f,clientX,clientY){   // zoom mantendo fixo o ponto sob o dedo/mouse
  const G=bmGeom(),r=G.c.getBoundingClientRect();if(!r.width)return;
  const px=clientX==null?G.S/2:(clientX-r.left)*G.S/r.width,py=clientY==null?G.S/2:(clientY-r.top)*G.S/r.height;
  const wx=(px-G.tx)/G.K,wy=(py-G.ty)/G.K;
  bigV.z=clamp(bigV.z*f,1,8);
  const K2=G.S/Math.max(WW,WH)*bigV.z;
  bigV.cx=wx-(px-G.S/2)/K2;bigV.cy=wy-(py-G.S/2)/K2;
  bmGeom();bigMapDraw();
}
function bigMapOpen(){
  if(bigOpen||state!=='play'||!P||P.dead)return;
  const el=$('bigmap');if(!el)return;
  bigOpen=true;bigPrevState=state;
  atkHeld=false;sprintHeld=false;joy.id=null;joy.active=false;joy.x=joy.y=0;
  if(!MP.active)state='mapview';
  el.classList.toggle('mp',!!MP.active);
  const bh=$('bmhint');if(bh)bh.textContent=MP.active?'Toque para marcar um ponto, ou no aliado para segui-lo. Arraste para mover, pinça ou +/- para zoom. Toque fora para fechar':'Toque para marcar um ponto. Arraste para mover, pinça ou +/- para zoom. Toque fora para fechar';
  el.classList.remove('hide');
  const css=Math.max(200,Math.min(innerWidth-20,innerHeight-70,760)),dpr=Math.min(2,window.devicePixelRatio||1),px=Math.round(css*dpr);
  const c=$('bmc');c.style.width=css+'px';c.style.height=css+'px';c.width=px;c.height=px;
  bigV.z=1;bigV.cx=WW/2;bigV.cy=WH/2;
  bigMapDraw();
  bigTimer=setInterval(bigMapDraw,120);
}
function bigMapClose(){
  if(!bigOpen)return;
  bigOpen=false;clearInterval(bigTimer);bigTimer=0;
  const el=$('bigmap');if(el)el.classList.add('hide');
  if(state==='mapview')state='play';
  last=performance.now();lastFrameTs=0;
}
function bigMapDraw(){
  if(!bigOpen||!P)return;
  if(P.dead||state==='dead'||state==='pause'){bigMapClose();return;}
  const G=bmGeom(),c=G.c,g=c.getContext('2d'),S=G.S,K=G.K,t=performance.now();
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  g.fillStyle='#0b100b';g.fillRect(0,0,S,S);
  g.setTransform(1,0,0,1,G.tx,G.ty);                           // daqui em diante: coordenadas do mundo x K
  paintMapBase(g,K);
  const u=Math.max(1,S/380);                                   // tamanho dos marcadores: fixo na tela, não cresce com o zoom
  g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=Math.max(1,u*.7);g.strokeRect(MM_X0*K,MM_Y0*K,MM_SPAN*K,MM_SPAN*K);
  g.fillStyle='#ff8020';for(const f of campfires)g.fillRect(f.x*K-u,f.y*K-u,2*u,2*u);
  g.fillStyle='#4a6b2a';for(const f of tents)g.fillRect(f.x*K-1.5*u,f.y*K-u,3*u,2*u);
  for(const q of pings){g.fillStyle=Math.floor(t/300)%2?pingCol(q):'#fff';g.beginPath();g.arc(q.x*K,q.y*K,2.2*u,0,6.283);g.fill();}
  g.font='bold '+Math.round(9*u)+'px "Courier New",monospace';g.textAlign='center';
  const leg=[];
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp||rp.alive===false||!Number.isFinite(rp.x))continue;
    const x=rp.x*K,y=rp.y*K,col=ALLY_COL(rp),nm=String(rp.name||'ALIADO').toUpperCase().slice(0,10);
    g.strokeStyle=col;g.lineWidth=u;g.globalAlpha=.8*(1-((t/900)%1));g.beginPath();g.arc(x,y,3*u+((t/900)%1)*9*u,0,6.283);g.stroke();g.globalAlpha=1;
    g.fillStyle='#000';g.beginPath();g.arc(x,y,4.2*u,0,6.283);g.fill();g.fillStyle=col;g.beginPath();g.arc(x,y,3.2*u,0,6.283);g.fill();
    g.fillStyle='#000';g.fillText(nm,x+1,y-6*u+1);g.fillStyle=col;g.fillText(nm,x,y-6*u);
    leg.push({nm,col,d:Math.round(Math.hypot(rp.x-P.x,rp.y-P.y)/10)});
  }
  if(WP)wpUpdate();
  if(WP){
    const wx=WP.x*K,wy=WP.y*K;
    g.strokeStyle=WP_COL;g.lineWidth=Math.max(1,u*.8);g.setLineDash([4*u,3*u]);g.beginPath();g.moveTo(P.x*K,P.y*K);g.lineTo(wx,wy);g.stroke();g.setLineDash([]);
    g.fillStyle='#000';g.beginPath();g.moveTo(wx,wy-7*u);g.lineTo(wx+5*u,wy);g.lineTo(wx,wy+7*u);g.lineTo(wx-5*u,wy);g.closePath();g.fill();
    g.fillStyle=WP_COL;g.beginPath();g.moveTo(wx,wy-5.5*u);g.lineTo(wx+3.8*u,wy);g.lineTo(wx,wy+5.5*u);g.lineTo(wx-3.8*u,wy);g.closePath();g.fill();
    g.fillStyle='#000';g.fillText(WP.label,wx+1,wy+13*u+1);g.fillStyle=WP_COL;g.fillText(WP.label,wx,wy+13*u);
  }
  const px=P.x*K,py=P.y*K;
  g.save();g.translate(px,py);
  g.fillStyle='rgba(74,163,255,.3)';g.beginPath();g.arc(0,0,(5+Math.sin(t/250)*1.5)*u,0,6.283);g.fill();
  g.rotate(P.face||0);g.fillStyle='#000';g.beginPath();g.moveTo(6.5*u,0);g.lineTo(-4.5*u,-4.2*u);g.lineTo(-4.5*u,4.2*u);g.closePath();g.fill();
  g.fillStyle='#ffffff';g.beginPath();g.moveTo(5*u,0);g.lineTo(-3.4*u,-3.2*u);g.lineTo(-3.4*u,3.2*u);g.closePath();g.fill();
  g.restore();
  g.fillStyle='#000';g.fillText('VOCÊ',px+1,py-8*u+1);g.fillStyle='#fff';g.fillText('VOCÊ',px,py-8*u);
  g.setTransform(1,0,0,1,0,0);
  const lg=$('bmleg');
  if(lg){
    const h='<span style="color:#fff">▲ VOCÊ</span>'+leg.map(l=>' &nbsp; <span style="color:'+l.col+'">● '+l.nm+' '+l.d+'m</span>').join('')+(WP?' &nbsp; <span style="color:'+WP_COL+'">◆ '+WP.label+' '+wpDist()+'m</span>':'')+' &nbsp; <span style="opacity:.6">zoom '+bigV.z.toFixed(1)+'x</span>';
    if(lg._h!==h){lg.innerHTML=h;lg._h=h;}
  }
}
/* toque no mapa grande: aliado = seguir; lago/vila/templo etc. = marcar o lugar; qualquer outro ponto = marcar ali; tocar de novo no alvo remove */
function bigMapTap(clientX,clientY){
  const G=bmGeom(),r=G.c.getBoundingClientRect();if(!r.width)return;
  const k=G.S/r.width;
  const wx=((clientX-r.left)*k-G.tx)/G.K,wy=((clientY-r.top)*k-G.ty)/G.K;
  if(wx<0||wy<0||wx>WW||wy>WH)return;
  const kk=G.K/k;                                                      // px de tela por unidade de mundo
  if(WP){const px=(WP.x-wx)*kk,py=(WP.y-wy)*kk;if(Math.hypot(px,py)<18){WP=null;bigMapDraw();return;}}
  const pk=wpPick(wx,wy,kk);
  WP=pk;
  if(pk.follow)toast('Seguindo '+pk.label+'. Toque nele de novo para parar');
  bigMapDraw();
}
/* gestos no mapa grande: um dedo arrasta, dois dedos fazem pinça, roda do mouse dá zoom, toque curto marca */
(function(){
  const c=$('bmc');if(!c)return;
  const ptrs=new Map();let moved=false,sx=0,sy=0,pinch=null;
  c.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    try{c.setPointerCapture(e.pointerId);}catch(_){}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===1){moved=false;sx=e.clientX;sy=e.clientY;pinch=null;}
    else if(ptrs.size===2){const a=[...ptrs.values()];pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1};moved=true;}
  });
  c.addEventListener('pointermove',e=>{
    const o=ptrs.get(e.pointerId);if(!o)return;
    e.preventDefault();
    if(ptrs.size>=2&&pinch){
      o.x=e.clientX;o.y=e.clientY;
      const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;
      bmZoomAt(d/pinch.d,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);pinch.d=d;return;
    }
    if(!moved&&Math.hypot(e.clientX-sx,e.clientY-sy)<7)return;
    moved=true;
    const G=bmGeom(),r=c.getBoundingClientRect(),k=G.S/r.width;
    bigV.cx-=(e.clientX-o.x)*k/G.K;bigV.cy-=(e.clientY-o.y)*k/G.K;
    o.x=e.clientX;o.y=e.clientY;bmGeom();bigMapDraw();
  });
  const up=e=>{
    e.preventDefault();e.stopPropagation();
    const had=ptrs.delete(e.pointerId);
    if(ptrs.size===0){const tap=had&&!moved&&e.type==='pointerup';pinch=null;if(tap)bigMapTap(e.clientX,e.clientY);moved=false;}
    else if(ptrs.size===1){pinch=null;const o=[...ptrs.values()][0];sx=o.x;sy=o.y;moved=true;}
  };
  c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
  c.addEventListener('wheel',e=>{e.preventDefault();bmZoomAt(Math.exp(-e.deltaY*0.0015),e.clientX,e.clientY);},{passive:false});
})();
function drawPingsMini(){
  for(const q of pings)mmDot(q.x,q.y,3,3,Math.floor(performance.now()/300)%2?pingCol(q):'#fff',true);
}
/* ===== Regeneração de árvores e pedras =====
   O mundo é dividido em quadras de 200x200. Na geração cada quadra guarda quantas árvores e pedras tinha. Com o tempo, a quadra mais esvaziada
   (abaixo de 70% do original) ganha 1 novo item por tentativa, num ponto livre e fora da vista de todos os jogadores; nunca passa dos 70%,
   então regiões ainda cheias não recebem nada e o mapa nunca fica mais denso que o original. Só o anfitrião decide; o convidado recebe a lista. */
const RG_CELL=200,RG_FRAC=.7,RG_TREE_S=40,RG_ROCK_S=100;      // intervalo de tentativas em segundos de jogo (dia = 480 s)
let RG_BT=null,RG_BR=null,RG_SET_T=new Set(),RG_SET_R=new Set(),rgAccT=0,rgAccR=0;
function rgKey(x,y){return Math.floor(x/RG_CELL)+','+Math.floor(y/RG_CELL);}
function rgCount(arr){const m=new Map();for(const o of arr){const k=rgKey(o.x,o.y);m.set(k,(m.get(k)||0)+1);}return m;}
function regrowInit(){RG_BT=rgCount(trees);RG_BR=rgCount(rocks);RG_SET_T=new Set(trees.map(t=>t.x+','+t.y));RG_SET_R=new Set(rocks.map(t=>t.x+','+t.y));rgAccT=0;rgAccR=0;}
function rgTreeKind(){
  if(selectedMap==='snow')return Math.random()<.7?2:(Math.random()<.5?4:5);
  if(selectedMap==='desert')return Math.random()<.55?3:(Math.random()<.5?6:7);
  if(selectedMap==='city')return Math.random()<.4?1:(Math.random()<.5?0:8);
  return Math.random()<.35?0:(Math.random()<.5?1:(Math.random()<.6?9:10));
}
function rgInView(x,y){                                  // alguém vai ver esse ponto (ou está logo na borda da tela)? então nada nasce ali
  const hw=W/Z/2+100,hh=H/Z/2+100;
  if(P&&Math.abs(x-P.x)<hw&&Math.abs(y-P.y)<hh)return true;
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x)&&Math.abs(x-rp.x)<hw&&Math.abs(y-rp.y)<hh)return true;}
  return false;
}
function rgSpotOk(x,y,isTree){
  const mg=isTree?30:40;
  if(x<mg||y<mg||x>WW-mg||y>WH-mg)return false;
  const m=isTree?(selectedMap==='city'?30:22):(selectedMap==='city'?30:24);
  if(solidPoint(x,y,m)||onCityRoad(x,y,14))return false;
  for(const l of lakes)if(Math.hypot(l.cx-x,l.cy-y)<l.r+(isTree?25:30))return false;
  if(LM&&x>LM.x-30&&x<LM.x+LM.w+30&&y>LM.y-30&&y<LM.y+LM.h+30)return false;
  if(FIELD&&x>FIELD.x-30&&x<FIELD.x+FIELD.w+30&&y>FIELD.y-30&&y<FIELD.y+FIELD.h+30)return false;
  if(rgInView(x,y))return false;
  for(const it of items)if(Math.abs(it.x-x)<22&&Math.abs(it.y-y)<22)return false;
  for(const z of zombies)if(!z.dead&&Math.abs(z.x-x)<28&&Math.abs(z.y-y)<28)return false;
  for(const a of animals)if(!a.dead&&Math.abs(a.x-x)<28&&Math.abs(a.y-y)<28)return false;
  for(const t of tents)if(Math.abs(t.x-x)<34&&Math.abs(t.y-y)<34)return false;
  if(plane&&Math.abs(x-plane.x)<90&&Math.abs(y-plane.y)<70)return false;
  return true;
}
function regrowOne(isTree){
  if(!RG_BT)return false;
  const arr=isTree?trees:rocks,baseM=isTree?RG_BT:RG_BR,cur=rgCount(arr),baseSet=isTree?RG_SET_T:RG_SET_R;
  const cand=[];
  for(const [k,base] of baseM){
    if(base<(isTree?3:2))continue;                      // quadra que nunca teve material de verdade (lago, rua, deserto vazio) não ganha nada
    const c=cur.get(k)||0;
    if(c>=base*RG_FRAC)continue;                        // ainda tem material suficiente
    cand.push({k,r:c/base});
  }
  if(!cand.length)return false;
  cand.sort((a,b)=>a.r-b.r||Math.random()-.5);
  for(const cd of cand.slice(0,3)){                      // as mais esvaziadas primeiro
    const [cx,cy]=cd.k.split(',').map(Number);
    for(let i=0;i<16;i++){
      const x=Math.round(cx*RG_CELL+rnd(8,RG_CELL-8)),y=Math.round(cy*RG_CELL+rnd(8,RG_CELL-8));
      if(baseSet.has(x+','+y)||arr.some(o=>o.x===x&&o.y===y))continue;
      if(!rgSpotOk(x,y,isTree))continue;
      arr.push(isTree?{x,y,k:rgTreeKind(),hp:4,seed:Math.random(),n:1}:{x,y,hp:5,k:rint(0,4),seed:Math.random(),n:1});
      rebuildSolidGrid();
      return true;
    }
  }
  return false;
}
function updateRegrow(dt){
  if(MP.active&&!MP.isHost)return;
  if(!RG_BT)regrowInit();
  rgAccT+=dt;rgAccR+=dt;
  let n=0;
  while(rgAccT>=RG_TREE_S&&n<8){rgAccT-=RG_TREE_S;n++;regrowOne(true);}
  while(rgAccR>=RG_ROCK_S&&n<12){rgAccR-=RG_ROCK_S;n++;regrowOne(false);}
  if(rgAccT>RG_TREE_S*8)rgAccT=RG_TREE_S*8;if(rgAccR>RG_ROCK_S*4)rgAccR=RG_ROCK_S*4;
}
function grownPack(arr){return arr.filter(o=>o.n).map(o=>[o.x,o.y,o.k,_q(o.hp,2),Math.round(o.seed*1000)/1000]);}
function grownApply(arr,list){                          // convidado: espelha as árvores/pedras novas do anfitrião
  if(!Array.isArray(list))return false;
  const want=new Map(list.filter(a=>Array.isArray(a)&&Number.isFinite(a[0])&&Number.isFinite(a[1])).map(a=>[a[0]+','+a[1],a]));let ch=false;
  for(let i=arr.length-1;i>=0;i--){const o=arr[i];if(!o.n)continue;const k=o.x+','+o.y;if(want.has(k))want.delete(k);else{arr.splice(i,1);ch=true;}}
  for(const a of want.values()){if(!arr.some(o=>o.x===a[0]&&o.y===a[1])){arr.push({x:a[0],y:a[1],k:a[2]|0,hp:Number.isFinite(a[3])?a[3]:4,seed:Number.isFinite(a[4])?a[4]:Math.random(),n:1});ch=true;}}
  return ch;
}
let lootRespT=0;
function roomNearest(b,x,y){
  let best=null,bd=1e9;
  for(const r of b.rooms||[]){const dx=Math.max(r.x-x,0,x-r.x-r.w),dy=Math.max(r.y-y,0,y-r.y-r.h),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=r;}}
  return best;
}
function lootTaken(it){
  if(!it||!it.h)return;                         // só vale loot nascido na casa (não o que o jogador largou nem drops de zumbi)
  if(MP.active&&!MP.isHost)return;              // quem controla os itens é o anfitrião
  const b=blds.find(q=>it.x>=q.x&&it.x<=q.x+q.w&&it.y>=q.y&&it.y<=q.y+q.h);
  const r=b&&roomNearest(b,it.x,it.y);if(!r)return;
  r._owed=Math.min(3,(r._owed||0)+1);
  if(r._at===undefined)r._at=T+LOOT_RESPAWN;
}
function bldOccupied(b){
  const inB=q=>q&&q.x>=b.x&&q.x<=b.x+b.w&&q.y>=b.y&&q.y<=b.y+b.h;
  if(P&&!P.dead&&!P.inVehicle&&inB(P))return true;
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&!rp.inVehicle&&inB(rp))return true;}
  return false;
}
function updateLootRespawn(dt){
  if(MP.active&&!MP.isHost)return;
  lootRespT-=dt;if(lootRespT>0)return;lootRespT=2;
  for(const b of blds){
    if(!b.rooms)continue;
    for(const r of b.rooms){
      if(r._at===undefined||T<r._at)continue;
      if(bldOccupied(b))continue;                                     // espera o jogador sair: o loot nunca nasce na frente dele
      if(items.some(it=>inRoomRect(r,it.x,it.y,3))){r._at=undefined;continue;} // já tem loot pendente neste cômodo: não gera (a dívida fica guardada para quando ele esvaziar)
      const lootKey=LOOT[b.type]?b.type:(b.type==='mil'?'mil':b.type==='shop'||b.type==='gas'?'shop':'house');
      placeBldLoot(b,Math.max(1,r._owed|0),lootKey,r);
      r._at=undefined;r._owed=0;
    }
  }
}
function lootStatePack(){
  const out=[];
  blds.forEach((b,bi)=>{(b.rooms||[]).forEach((r,ri)=>{if(r._at!==undefined||r._owed>0)out.push([bi,ri,r._at!==undefined?_q(r._at,1):-1,r._owed|0]);});});
  return out;
}
function lootStateLoad(a){
  for(const q of Array.isArray(a)?a:[]){
    const b=blds[q[0]],r=b&&b.rooms&&b.rooms[q[1]];
    if(r&&Number.isFinite(q[2])){r._at=q[2]>=0?q[2]:undefined;r._owed=clamp(q[3]|0,1,3);}
  }
}
function addBuilding(x,y,w,h,type){
  const t=6,door=type==='garage'?34:26,doorX=x+Math.floor(w/2-door/2);
  let roof;
  if(selectedMap==='snow'){
    roof = type==='cabin'?'#5a3a2a':(type==='mil'?'#3a4a3a':'#405566');
  } else if(selectedMap==='desert'){
    roof = type==='barn'?'#7a3a20':(type==='mil'?'#6a7040':'#8a6030');
  } else if(selectedMap==='city'){
    roof = cityRoofColor(type);
  } else {
    roof = type==='cabin'?'#5a3a2a':(type==='mil'?'#56683f':type==='shop'?'#9a4040':pick(['#74503a','#5a606e','#6a4a4a','#6b5a38']));
  }
  const ws=[
    {x:x,y:y,w:w,h:t},
    {x:x,y:y,w:t,h:h},
    {x:x+w-t,y:y,w:t,h:h},
    {x:x,y:y+h-t,w:doorX-x,h:t},
    {x:doorX+door,y:y+h-t,w:x+w-(doorX+door),h:t}
  ];
  const floors = type==='apartment'?rint(3,5):(type==='office'?rint(2,3):1);
  // Variantes visuais por prédio (cor de chão / estilo)
  const style = rint(0,4);
  const b={x,y,w,h,type,roof,roofA:1,doorX,door,walls:ws,floors,style};
  for(const q of ws)walls.push(q);
  blds.push(b);
  genInterior(b);
  mkDoors(b);
  const lootKey = LOOT[type] ? type : (type==='mil'?'mil':type==='shop'||type==='gas'?'shop':'house');
  // Menos loot: chance de casa quase vazia + poucas unidades (prédios com mais cômodos têm um pouco mais)
  let n;
  if(_rng()<0.18) n=0; // 18% vazia
  else if(type==='mil') n=rint(2,4);
  else if(type==='clinic') n=rint(2,4);
  else if(type==='apartment'||type==='warehouse') n=rint(1,3);
  else if(type==='shop'||type==='gas') n=rint(1,3);
  else n=rint(0,2);
  if(n>0||type==='house'){ if(b.rooms.length>=6)n+=1; }
  if(n>0) n+=rint(0,Math.max(0,b.rooms.length-2));
  placeBldLoot(b,n,lootKey);
  if(b.type==='clinic')medicBonus(b);
}
function tryPlaceBuilding(cx,cy,type,pad){
  pad = pad==null ? (selectedMap==='city'?16:34) : pad;
  let w,h;
  if(type==='mil'){ w=rint(95,145); h=rint(75,110); }
  else if(type==='warehouse'){ w=rint(100,170); h=rint(70,125); }
  else if(type==='apartment'){ w=rint(55,110); h=rint(95,175); }
  else if(type==='office'){ w=rint(80,140); h=rint(75,130); }
  else if(type==='garage'){ w=rint(70,120); h=rint(45,75); }
  else if(type==='clinic'){ w=rint(65,115); h=rint(55,90); }
  else if(type==='gas'){ w=rint(60,100); h=rint(50,80); }
  else if(type==='barn'){ w=rint(85,130); h=rint(65,100); }
  else if(type==='shop'){ w=rint(50,100); h=rint(48,85); }
  else if(type==='cabin'){ w=rint(48,85); h=rint(45,75); }
  else { w=rint(48,105); h=rint(48,95); } // casas com mais variação de tamanho
  const x=Math.round(cx-w/2), y=Math.round(cy-h/2);
  if(x<40||y<40||x+w>WW-40||y+h>WH-40) return false;
  if(blds.some(b=>x<b.x+b.w+pad&&x+w+pad>b.x&&y<b.y+b.h+pad&&y+h+pad>b.y)) return false;
  addBuilding(x,y,w,h,type);
  return true;
}
function pickCityBuildingType(forceMil){
  if(forceMil) return 'mil';
  const r=_rng();
  if(r<0.18) return 'apartment';
  if(r<0.30) return 'office';
  if(r<0.42) return 'shop';
  if(r<0.52) return 'warehouse';
  if(r<0.60) return 'garage';
  if(r<0.66) return 'clinic';
  if(r<0.72) return 'gas';
  if(r<0.78) return 'mil';
  return 'house';
}

