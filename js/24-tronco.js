/* ============ TRONCO CAIDO (banco para sentar em volta da fogueira, do lago ou de onde quiser) ============
   Dois jeitos de aparecer:
   1) fabricado pelo jogador (so madeira) em qualquer espaco aberto, na frente do personagem. Fica no save e vai para o convidado (evento logAdd e snapshot);
   2) gerado com o mundo (so floresta e neve; mesma semente = mesmos troncos, nada de save): alguns espalhados em clareiras e perto dos lagos
      e, na neve, em volta da fogueira do acampamento abandonado.
   Cada tronco tem 2 lugares. Sentar: botao SENTAR perto do tronco; o jogador fica parado, recupera folego mais rapido, pode comer e beber; mexer o
   direcional, atacar ou levar dano levanta. Quem esta sentado olha para a fogueira mais proxima (ate 160 px), senao para o lado de onde veio.
   Estado: logs = [{x,y,a:'h'|'v',g:1 gerado | 0 do jogador}]; P.sitting = {L,sx,sy,i}. Modulo no padrao dos 18..23: IIFE + window.*  */
(function(){
const COST_WOOD=4,HALF=20,REACH=18,SEAT_DX=10,STAM_REGEN=40;
let logs=[];
const R2=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

/* ---------- geometria ---------- */
function seatsOf(L){return L.a==='h'?[{x:L.x-SEAT_DX,y:L.y-5},{x:L.x+SEAT_DX,y:L.y-5}]:[{x:L.x,y:L.y-SEAT_DX},{x:L.x,y:L.y+SEAT_DX}];}
function rectOf(L){return L.a==='h'?{x0:L.x-HALF-2,x1:L.x+HALF+2,y0:L.y-8,y1:L.y+3}:{x0:L.x-6,x1:L.x+6,y0:L.y-HALF-2,y1:L.y+HALF+3};}
function distToLog(L,x,y){const r=rectOf(L);return Math.hypot(Math.max(r.x0-x,0,x-r.x1),Math.max(r.y0-y,0,y-r.y1));}
function logNearby(){
  let b=null,bd=REACH;
  for(const L of logs){const d=distToLog(L,P.x,P.y);if(d<bd){bd=d;b=L;}}
  return b;
}
function seatTaken(s){
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.st&&rp.alive!==false&&Math.hypot(rp.x-s.x,rp.y-s.y)<8)return true;}
  return false;
}
/* pontos ao longo do eixo, para testar se o tronco cabe */
function axisPts(x,y,a){const o=[];for(let k=-HALF+2;k<=HALF-2;k+=9)o.push(a==='h'?[x+k,y-1]:[x,y+k]);return o;}
function spotOk(x,y,a,ignore){
  if(x<50||y<50||x>WW-50||y>WH-50)return false;
  for(const q of axisPts(x,y,a)){
    if(solidPoint(q[0],q[1],7)||pointInLake(q[0],q[1]+5))return false;
    if(selectedMap==='city'&&onCityRoad(q[0],q[1],8))return false;
  }
  if(bldAt(x,y)||bldAt(x,y-10))return false;
  if(logs.some(l=>l!==ignore&&Math.hypot(l.x-x,l.y-y)<26))return false;
  if(window.wellList&&wellList().some(w=>Math.hypot(w.x-x,w.y-y)<30))return false;
  if(window.stashList&&stashList().some(s=>Math.hypot(s.x-x,s.y-y)<26))return false;
  if(tents.some(t=>Math.hypot(t.x-x,t.y-y)<38))return false;
  if(campfires.some(c=>Math.hypot(c.x-x,c.y-y)<22))return false;
  if(window.plotList&&plotList().some(p=>Math.abs(p.cx*16+8-x)<30&&Math.abs(p.cy*16+8-y)<24))return false;
  return true;
}

/* ---------- montar ---------- */
function logSpot(){
  if(!P||P.inside||bldAt(P.x,P.y))return null;
  const fx=Math.cos(P.face||0),fy=Math.sin(P.face||0),a=Math.abs(fy)>=Math.abs(fx)?'h':'v';   // atravessado na frente de quem olha
  for(const d of [30,38,48]){
    for(const da of [0,.5,-.5,1,-1,1.6,-1.6,3.14]){
      const ang=(P.face||0)+da,x=Math.round(P.x+Math.cos(ang)*d),y=Math.round(P.y+Math.sin(ang)*d);
      if(spotOk(x,y,a))return {x,y,a};
    }
  }
  return null;
}
function logWhy(){
  if(P.inside||bldAt(P.x,P.y))return 'Monte o tronco ao ar livre';
  return logSpot()?null:'Sem espaço para o tronco aqui';
}
function logBuild(sp){
  sp=sp||logSpot()||{x:Math.round(P.x+32),y:Math.round(P.y),a:'h'};
  logs.push({x:sp.x,y:sp.y,a:sp.a,g:0});rebuildSolidGrid();pushOut(P,P.r);
  if(MP.active){
    sendEvt('logAdd',{x:sp.x,y:sp.y,a:sp.a==='h'?0:1});
    if(MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
  }
  toast('Tronco posicionado! Chegue perto e use SENTAR');buildSound();
  for(let i=0;i<7;i++)parts.push({x:sp.x+rnd(-14,14),y:sp.y-2,vx:rnd(-16,16),vy:rnd(-24,-6),t:.4,c:'#8a6238'});
}

/* ---------- sentar e levantar ---------- */
function faceFor(L,sx,sy,fromX,fromY){
  let cf=null,cd=160;
  for(const c of campfires){const d=Math.hypot(c.x-sx,c.y-sy);if(d<cd){cd=d;cf=c;}}
  if(cf)return Math.atan2(cf.y-sy,cf.x-sx);
  return L.a==='h'?(fromY>=L.y?Math.PI/2:-Math.PI/2):(fromX>=L.x?0:Math.PI);
}
function logSit(L){
  if(!L||!P||P.dead||P.inVehicle||P.sitting)return;
  if(P.sleeping)return;
  const free=seatsOf(L).map((s,i)=>({s,i})).filter(q=>!seatTaken(q.s));
  if(!free.length){toast('Os dois lugares estão ocupados');beep(150,.08,'square',.04);return;}
  free.sort((a,b)=>Math.hypot(a.s.x-P.x,a.s.y-P.y)-Math.hypot(b.s.x-P.x,b.s.y-P.y));
  const s=free[0].s,fx=P.x,fy=P.y;
  if(P.fish)cancelFishing();
  P.sitting={L,sx:s.x,sy:s.y,i:free[0].i,t:0};
  P.x=s.x;P.y=s.y;P.face=faceFor(L,s.x,s.y,fx,fy);P.moving=false;P.sprint=false;atkHeld=false;sprintHeld=false;
  beep(280,.1,'sine',.03,-40);
}
function standOk(x,y){return !solidPoint(x,y,P.r||5)&&!pointInLake(x,y)&&!(window.wallBlocks&&P.sitting&&wallBlocks(P.sitting.sx,P.sitting.sy,x,y));}
function logStand(quiet){
  const st=P&&P.sitting;if(!st)return;
  const L=st.L;P.sitting=null;
  const o=L.a==='h'?[[st.sx,L.y+13],[st.sx,L.y-16],[L.x-HALF-12,L.y],[L.x+HALF+12,L.y]]:[[L.x+14,st.sy],[L.x-14,st.sy],[L.x,L.y-HALF-12],[L.x,L.y+HALF+14]];
  const front=L.a==='h'?(Math.sin(P.face)>=0?0:1):(Math.cos(P.face)>=0?0:1);   // levanta para o lado em que estava olhando
  const order=L.a==='h'?[o[front],o[1-front],o[2],o[3]]:[o[front],o[1-front],o[2],o[3]];
  for(const q of order)if(standOk(q[0],q[1])){P.x=q[0];P.y=q[1];break;}
  if(!quiet)beep(380,.07,'sine',.03,50);
}
function sitTick(dt){
  P.moving=false;P.sprint=false;
  const st=P.sitting;st.t+=dt;
  if(!logs.includes(st.L)){P.sitting=null;return;}   // o tronco sumiu (mundo recarregado)
  survivalTick(dt);
  if(P.dead)return;
  P.stam=Math.min(P._scap||100,P.stam+STAM_REGEN*dt*(P._sreg||1));
  if(P.exhausted&&P.stam>Math.min(20,(P._scap||100)-8))P.exhausted=false;
  P.x=st.sx;P.y=st.sy;
  if(joy.active&&Math.hypot(joy.x,joy.y)>.45&&st.t>.25)logStand(false);
}

/* ---------- desenho: casca, aneis na ponta cortada, nos e, na neve, uma capa de neve ---------- */
function drawLog(L){
  const x=Math.round(L.x),y=Math.round(L.y),snow=selectedMap==='snow',h=L.a==='h';
  const bark='#6b4a2e',barkHi='#8a6238',barkLo='#4a3220',cut='#d9b27a',cutIn='#b98a52';
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y+(h?3:2),h?23:8,h?4:20,0,0,6.283);ctx.fill();
  const sd=((L.x*7+L.y*13)|0)&15;   // dispersao fixa dos nos e das juntas da casca
  ctx.save();ctx.translate(x,y);
  if(h){
    R2(-21,-8,42,11,'#2e2014');
    R2(-20,-7,40,9,bark);R2(-20,-7,40,2,barkHi);R2(-20,0,40,2,barkLo);
    for(let i=0;i<5;i++)R2(-17+((sd*3+i*8)%34),-5+(i%2)*2,1,3,barkLo);                   // sulcos da casca
    R2(-8+(sd%9),-4,3,2,barkLo);R2(-7+(sd%9),-4,1,1,'#2e2014');                           // no da madeira
    R2(-23,-6,3,8,'#2e2014');R2(-22,-5,3,6,cut);R2(-21,-4,1,4,cutIn);R2(-22,-5,3,1,'#f0d4a0');   // ponta cortada (aneis)
    R2(19,-6,2,2,'#2e2014');R2(19,-7,2,1,barkHi);R2(18,-1,3,2,'#2e2014');                   // outra ponta quebrada
    if(snow){R2(-19,-9,38,3,'#f0f6fa');R2(-16,-10,10,1,'#f0f6fa');R2(4,-10,8,1,'#f0f6fa');R2(-19,-6,38,1,'#cfdde8');}
  }else{
    R2(-6,-21,12,42,'#2e2014');
    R2(-5,-20,10,38,bark);R2(-5,-20,2,38,barkHi);R2(3,-20,2,38,barkLo);
    for(let i=0;i<5;i++)R2(-3+(i%2)*3,-17+((sd*3+i*8)%32),3,1,barkLo);
    R2(-1,-6+(sd%9),2,3,barkLo);
    R2(-6,16,12,5,'#2e2014');R2(-5,17,10,3,cut);R2(-3,18,6,1,cutIn);R2(-5,17,10,1,'#f0d4a0');   // ponta cortada virada para quem olha
    R2(-4,-22,8,2,'#2e2014');R2(-3,-22,6,1,barkHi);
    if(snow){R2(-6,-20,4,38,'#f0f6fa');R2(-7,-14,1,10,'#f0f6fa');R2(-2,-20,1,38,'#cfdde8');}
  }
  ctx.restore();
}
function logDepth(L){return L.a==='h'?L.y-6:L.y-14;}   // quem esta sentado (y do lugar) desenha por cima do tronco

/* ---------- geracao (floresta e neve): determinista, so a semente e as posicoes ---------- */
const LOG_MAX={forest:8,snow:6};
function logsGen(){
  const map=selectedMap,max=LOG_MAX[map];if(!max)return;
  const lr=mkRng((((worldSeed|0)>>>0)%99971+map.length*313)/99971%1);
  const add=(x,y,a)=>{if(spotOk(x,y,a)){logs.push({x:Math.round(x),y:Math.round(y),a,g:1});rebuildSolidGrid();return true;}return false;};
  // 1) em volta de fogueiras que ja nasceram com o mundo (acampamento da neve): ate 3 troncos, tangentes ao fogo
  for(const c of campfires.slice()){
    let n=0;
    for(const ang of [2.5,.7,-1.15,-2.6,1.6,-.35]){
      if(n>=3)break;
      const x=c.x+Math.cos(ang)*34,y=c.y+Math.sin(ang)*34,a=Math.abs(Math.sin(ang))>Math.abs(Math.cos(ang))?'h':'v';
      if(add(x,y,a))n++;
    }
  }
  // 2) espalhados: metade perto de lagos, o resto em clareiras (sorteio da semente com varias tentativas)
  const fixed=logs.length;
  for(let k=0;k<600&&logs.length-fixed<max-Math.min(fixed,max-2);k++){
    let x,y;
    const nearLake=(logs.length-fixed)%2===0&&lakes.some(l=>!l.fountain);
    if(nearLake){
      const ls=lakes.filter(l=>!l.fountain),l=ls[Math.floor(lr()*ls.length)],ang=lr()*6.283,rr=l.r*1.1+24+lr()*26;
      x=l.cx+Math.cos(ang)*rr;y=l.cy+Math.sin(ang)*rr*.92;
    }else{x=300+lr()*(WW-600);y=300+lr()*(WH-600);}
    x=Math.round(x);y=Math.round(y);
    const a=lr()<.5?'h':'v';
    if(trees.some(t=>Math.abs(t.x-x)<34&&t.y>y-34&&t.y<y+14))continue;    // clareira: sem arvore em cima nem copa por cima
    if(blds.some(b=>x>b.x-60&&x<b.x+b.w+60&&y>b.y-60&&y<b.y+b.h+60))continue;
    if(logs.some(l=>Math.hypot(l.x-x,l.y-y)<110))continue;                  // espalhados, nunca juntos
    add(x,y,a);
  }
}
function logReset(){logs=[];}

/* ---------- save e rede ---------- */
const okPt=q=>Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1]);
const same=(a,b)=>Math.abs(a.x-b.x)<8&&Math.abs(a.y-b.y)<8;
function logPack(){return logs.filter(l=>!l.g).map(l=>[Math.round(l.x),Math.round(l.y),l.a==='h'?0:1]);}   // os gerados voltam sozinhos pela semente
function mkFrom(q){return {x:q[0],y:q[1],a:q[2]===1?'v':'h',g:0};}
function logLoad(a){
  logs=logs.filter(l=>l.g);
  if(Array.isArray(a))for(const q of a.slice(0,200))if(okPt(q)&&!logs.some(l=>same(l,{x:q[0],y:q[1]})))logs.push(mkFrom(q));
  rebuildSolidGrid();
}
function logRemote(kind,d){
  if(kind!=='logAdd'||!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  if(logs.length<400&&!logs.some(l=>same(l,d))){logs.push(mkFrom([d.x,d.y,d.a]));rebuildSolidGrid();}
}
function logSnapshot(a){
  if(!Array.isArray(a))return;
  let ch=false;
  for(const q of a.slice(0,200))if(okPt(q)&&!logs.some(l=>same(l,{x:q[0],y:q[1]}))){logs.push(mkFrom(q));ch=true;}
  if(ch)rebuildSolidGrid();
}

window.logDist=distToLog;window.logList=()=>logs;window.logNearby=logNearby;window.logSit=logSit;window.logStand=logStand;window.logSitTick=sitTick;window.logSpot=logSpot;window.logWhy=logWhy;window.logBuild=logBuild;
window.logsGen=logsGen;window.logReset=logReset;window.drawLog=drawLog;window.logDepth=logDepth;window.logSeats=seatsOf;
window.logPack=logPack;window.logLoad=logLoad;window.logRemote=logRemote;window.logSnapshot=logSnapshot;
window.LOG_COST={wood:COST_WOOD};
})();
