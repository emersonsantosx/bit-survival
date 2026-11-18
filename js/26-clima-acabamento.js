/* ACABAMENTO DE CHUVA E NEVE
   - Chuva: poças que vão se formando enquanto chove e secam depois, com ondinhas de chuva. Nada é guardado em lista: cada célula de 88 px do mundo
     decide, por um número derivado da posição e da semente do mundo, se tem uma poça (igual para todos no multiplayer). Só as visíveis são desenhadas.
     O reflexo da lanterna, dos faróis, das fogueiras e dos postes nas poças é desenhado em drawLighting (arquivo 14), usando a lista daqui.
   - Neve: acumula aos poucos sobre os objetos enquanto neva (cerca de 70 s) e derrete devagar depois (cerca de 150 s). No mapa da neve já vem cheia.
     Sprites prontos (copas de árvore, telhados, varandas) trocam de versão ao passar de 50%; os objetos simples crescem a capa de neve pixel a pixel.
   Nada aqui pinta a tela inteira. */
(function(){
const WX={wet:0,snow:0,k:-1};window.WX=WX;
window.wxUpdate=function(dt){
  const seed=window.WX_SEED|0;
  if(WX.k!==seed){WX.k=seed;WX.wet=weather==='rain'?1:0;WX.snow=weather==='snow'?1:0;PCELL.clear();}   // mundo novo ou carregado: o clima de agora ja vale cheio
  WX.wet=weather==='rain'?Math.min(1,WX.wet+dt/50):Math.max(0,WX.wet-dt/110);
  WX.snow=weather==='snow'?Math.min(1,WX.snow+dt/70):Math.max(0,WX.snow-dt/150);
};
window.snowAcc=()=>selectedMap==='snow'?1:WX.snow;
window.snowOn=()=>selectedMap==='snow'||WX.snow>=.5;
/* capa de neve no topo de um objeto: x = canto esquerdo, yb = linha de baixo da capa, w = largura, maxH = altura com neve cheia */
window.snowCap=function(x,yb,w,maxH){
  const k=window.snowAcc();if(k<.06)return;
  const h=Math.max(1,Math.round(maxH*k));
  R(x,yb-h,w,h,'#e8f4f8');
  if(h>1){R(x+1,yb-h,w-2,1,'#ffffff');R(x,yb-1,w,1,'#c4d4e0');}
  if(k>.8&&w>6)R(x+2,yb-h-1,w-4,1,'#f4fafc');
};

/* ---------- poças ---------- */
const CELL=88,PCELL=new Map();
function hash(ix,iy,n){let h=(Math.imul(ix,73856093)^Math.imul(iy,19349663)^Math.imul((window.WX_SEED|0)+n*977,83492791))>>>0;h^=h>>>13;h=Math.imul(h,1274126177)>>>0;h^=h>>>16;return (h>>>0)/4294967296;}
function puddleOf(ix,iy){
  const key=(ix+512)*2048+iy+512;let p=PCELL.get(key);if(p!==undefined)return p;
  p=null;
  if(selectedMap!=='snow'&&hash(ix,iy,1)<.34){
    const x=ix*CELL+8+hash(ix,iy,2)*(CELL-16),y=iy*CELL+8+hash(ix,iy,3)*(CELL-16),rx=9+hash(ix,iy,4)*21,ry=rx*(.36+.14*hash(ix,iy,5));
    let ok=x>24&&y>24&&x<WW-24&&y<WH-24&&!pointInLake(x,y)&&!pointInLake(x-rx,y)&&!pointInLake(x+rx,y);
    if(ok)for(const q of[[0,0],[-rx,0],[rx,0],[0,-ry-4],[0,ry+2]])if(bldAt(x+q[0],y+q[1])){ok=false;break;}
    if(ok)p={x:x,y:y,rx:rx,ry:ry,ph:hash(ix,iy,6)};
  }
  if(PCELL.size>4000)PCELL.clear();
  PCELL.set(key,p);return p;
}
let VP=[];
window.wxPuddles=()=>VP;
window.drawPuddles=function(vx0,vy0,vx1,vy1){
  VP=[];
  const w=WX.wet;if(w<.04||(P&&P.inside)||selectedMap==='snow')return;
  const s=.3+.7*w,sky=1-dark*.85,rain=weather==='rain';
  const x0=Math.floor((vx0-30)/CELL),x1=Math.floor((vx1+30)/CELL),y0=Math.floor((vy0-30)/CELL),y1=Math.floor((vy1+30)/CELL);
  for(let ix=x0;ix<=x1;ix++)for(let iy=y0;iy<=y1;iy++){
    const p=puddleOf(ix,iy);if(!p)continue;
    const rx=p.rx*s,ry=p.ry*s;VP.push(p);p.s=s;
    ctx.fillStyle='rgba(18,30,52,'+(.5*w).toFixed(3)+')';ctx.beginPath();ctx.ellipse(p.x,p.y,rx+1,ry+1,0,0,6.283);ctx.fill();   // borda escura (terra molhada)
    ctx.fillStyle='rgba('+(dark>.5?'70,95,140':'140,175,215')+','+((.2+.3*sky)*w).toFixed(3)+')';
    ctx.beginPath();ctx.ellipse(p.x-rx*.12,p.y-ry*.12,rx*.88,ry*.8,0,0,6.283);ctx.fill();                                  // o ceu refletido
    if(sky>.35){ctx.fillStyle='rgba(235,245,255,'+(.22*sky*w).toFixed(3)+')';ctx.beginPath();ctx.ellipse(p.x-rx*.3,p.y-ry*.3,rx*.35,ry*.25,0,0,6.283);ctx.fill();}   // brilho
    if(rain){   // ondinhas das gotas
      ctx.strokeStyle='rgba(225,238,250,.5)';ctx.lineWidth=1;
      for(let k=0;k<2;k++){const t=(T*1.4+p.ph*3+k*.5)%1;ctx.globalAlpha=(1-t)*.55*w;ctx.beginPath();ctx.ellipse(p.x+(k?rx*.25:-rx*.2),p.y+(k?-ry*.1:ry*.1),Math.max(1,rx*.55*t),Math.max(.5,ry*.55*t),0,0,6.283);ctx.stroke();}
      ctx.globalAlpha=1;
    }
  }
};

})();

/* LAREIRA: casas e cabanas cujo telhado tem chamine ganham uma lareira por dentro (arquivo 06 coloca o movel; se nao couber, o telhado perde a chamine).
   Acesa na neve o tempo todo; nos outros mapas, de noite ou com chuva. Acesa ela esquenta (como fogueira), seca a roupa, assa comida, ilumina o comodo
   e solta fumaca pela chamine. Nada e guardado: a lareira nasce da semente da casa, igual nos dois jogadores. */
function bldWantsChimney(b){
  if(b.type!=='house'&&b.type!=='cabin')return false;
  const L=b._look||(b._look=bldLook(b));
  return !L._noChim&&(L.ext.indexOf('chimney')>=0||L.ext.indexOf('chimneyStone')>=0);
}
function bldDropChimney(b){const L=b._look||(b._look=bldLook(b));L._noChim=true;b._rc=null;}
function hearthBox(f){return f.w>=f.h?{x:f.x+5,y:f.y+3,w:f.w-10,h:f.h-5}:{x:f.x+3,y:f.y+5,w:f.w-5,h:f.h-10};}
function hearthLit(){return selectedMap==='snow'||weather==='rain'||weather==='snow'||dark>.3;}
function hearthOf(b){return b&&b._hearth&&b.furn&&b.furn.indexOf(b._hearth)>=0?b._hearth:null;}
function hearthOn(b){return !!(hearthOf(b)&&hearthLit());}
function hearthNear(x,y,r){   // lareira acesa do predio em que o jogador esta, mais perto que r (so conta dentro de casa)
  const b=P&&P.inside,f=hearthOf(b);if(!f||!hearthLit())return null;
  const d=Math.hypot(f.x+f.w/2-x,f.y+f.h/2-y);return d<r?{f:f,d:d}:null;
}
function drawHearthFlames(b){
  const f=hearthOf(b);if(!f||!hearthLit()||!seeIn(b,f.x+f.w/2,f.y+f.h/2))return;
  const o=hearthBox(f),n=Math.max(2,Math.floor((o.w>=o.h?o.w:o.h)/3));
  for(let i=0;i<n;i++){
    const fx=o.w>=o.h?o.x+1+i*3:o.x+1,fy=o.w>=o.h?o.y+1:o.y+1+i*3;
    const hh=2+Math.round((Math.sin(T*9+i*1.9)+1)*(Math.min(o.w,o.h)>4?1.4:.9));
    const bw=o.w>=o.h?2:Math.min(o.w-2,2+hh),bh=o.w>=o.h?Math.min(o.h-1,hh+1):2;
    R(fx,fy+(o.w>=o.h?o.h-1-bh:0),bw,bh,'#e0501a');
    R(fx,fy+(o.w>=o.h?o.h-1-Math.max(1,bh-1):0),Math.max(1,bw-(o.w>=o.h?1:1)),Math.max(1,bh-1),'#ffa030');
  }
  R(o.x+2,o.y+o.h-2,o.w-4,1,'#ffd870');
}
