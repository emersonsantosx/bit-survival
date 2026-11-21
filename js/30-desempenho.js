/* ============ DESEMPENHO (sem mexer no visual) ============
   Camadas fixas do mundo em blocos prontos. O chao (azulejos) e as ruas da cidade nunca mudam durante a partida, mas eram repintados retangulo
   por retangulo a cada quadro (centenas deles). Agora cada bloco de 256x256 px do mundo e pintado UMA vez num canvas e depois so e carimbado
   na tela com drawImage. A imagem sai igual, pixel por pixel (conferido contra a versao anterior nas 4 mapas).
   Cada bloco leva 2 px de sobra em volta, para nao abrir fresta entre blocos quando o zoom do carro deixa a escala quebrada.
   As figurinhas de cerca (js/19) seguem a mesma ideia. layerCachesFlush() descarta tudo: chamada ao gerar um mundo novo. */
const GC_SZ=256,GC_M=2,GC_MAX=48;
const GC={sig:'',layers:{}};
function layerCachesFlush(){
  for(const n in GC.layers){const m=GC.layers[n];for(const c of m.values()){if(c)c.width=0;}m.clear();}
  GC.sig='';
}
/* monta (ou pega pronto) o bloco cx,cy da camada m; cv fica null fora do mundo */
function layerBlock(m,cx,cy,paint){
  const k=cx*4096+cy;let cv=m.get(k);
  if(cv===undefined){
    const bx=cx*GC_SZ,by=cy*GC_SZ,w=Math.min(GC_SZ,WW-bx),h=Math.min(GC_SZ,WH-by);
    if(w>0&&h>0){
      cv=document.createElement('canvas');cv.width=w+GC_M*2;cv.height=h+GC_M*2;
      const g=cv.getContext('2d');g.translate(GC_M-bx,GC_M-by);
      g.beginPath();g.rect(0,0,WW,WH);g.clip();   // mesmo recorte do mundo que a tela usa
      paint(g,bx-GC_M,by-GC_M,bx+w+GC_M,by+h+GC_M);
    } else cv=null;
    if(m.size>=GC_MAX){const old=m.keys().next().value;const oc=m.get(old);if(oc)oc.width=0;m.delete(old);}
    m.set(k,cv);
  } else if(cv){m.delete(k);m.set(k,cv);}   // usado agora: vai para o fim da fila (sai por ultimo)
  return cv;
}
/* name: camada; x0..y1: area do mundo a cobrir; paint(g,wx0,wy0,wx1,wy1): pinta no pincel g a area (ja com a sobra) em coordenadas do mundo */
function layerDraw(name,x0,y0,x1,y1,paint){
  if(x1<=x0||y1<=y0)return;
  const sig=selectedMap+'|'+WW+'|'+WH;
  if(GC.sig!==sig){layerCachesFlush();GC.sig=sig;}
  const m=GC.layers[name]||(GC.layers[name]=new Map());
  const keep=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  const c0=Math.max(0,Math.floor(x0/GC_SZ)),c1=Math.floor((x1-1)/GC_SZ),r0=Math.max(0,Math.floor(y0/GC_SZ)),r1=Math.floor((y1-1)/GC_SZ);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){
    const cv=layerBlock(m,cx,cy,paint);
    if(cv)ctx.drawImage(cv,cx*GC_SZ-GC_M,cy*GC_SZ-GC_M);
  }
  ctx.imageSmoothingEnabled=keep;
}
/* adianta o trabalho: monta no maximo UM bloco ainda nao pronto da area (sem desenhar), para o bloco novo nao ser montado de uma vez na hora em que entra na tela */
function layerWarm(name,x0,y0,x1,y1,paint){
  const m=GC.layers[name];if(!m||GC.sig!==selectedMap+'|'+WW+'|'+WH)return;
  const c0=Math.max(0,Math.floor(x0/GC_SZ)),c1=Math.floor((Math.min(x1,WW)-1)/GC_SZ),r0=Math.max(0,Math.floor(y0/GC_SZ)),r1=Math.floor((Math.min(y1,WH)-1)/GC_SZ);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){
    if(m.get(cx*4096+cy)===undefined){layerBlock(m,cx,cy,paint);return;}
  }
}
/* chao: tx0..tx1/ty0..ty1 sao os azulejos visiveis (como no laco antigo) */
function groundPaint(g,wx0,wy0,wx1,wy1){
  const q=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const a=Math.max(0,Math.floor(wx0/16)),b=Math.min(Math.ceil(WW/16),Math.ceil(wx1/16)),c=Math.max(0,Math.floor(wy0/16)),d=Math.min(Math.ceil(WH/16),Math.ceil(wy1/16));
  for(let ty=c;ty<d;ty++)for(let tx=a;tx<b;tx++)groundTileDraw(q,tx,ty);
}
function groundChunksDraw(tx0,tx1,ty0,ty1){
  if(tx1<=tx0||ty1<=ty0)return true;
  layerDraw('ground',tx0*16,ty0*16,tx1*16,ty1*16,groundPaint);
  if(selectedMap==='forest')layerWarm('ground',tx0*16-GC_SZ,ty0*16-GC_SZ,tx1*16+GC_SZ,ty1*16+GC_SZ,groundPaint);   // so a floresta: unico mapa de chao pesado
  return true;
}
/* ruas, calcadas, faixas e cruzamentos da cidade */
function cityRoadsChunksDraw(vx0,vy0,vx1,vy1){
  layerDraw('croads',Math.max(0,vx0),Math.max(0,vy0),Math.min(WW,vx1),Math.min(WH,vy1),(g,wx0,wy0,wx1,wy1)=>{
    const q=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
    drawCityRoads(wx0,wy0,wx1,wy1,q);
  });
}
