/* ====================== CAMINHOS NATURAIS (floresta, deserto e neve) ======================
   Os retangulos de `roads` continuam sendo o esqueleto do mundo (ruas das vilas, estradas entre vilas, onde nascem carros, itens e arvores),
   entao o mundo e o multiplayer nao mudam. O que o jogador ve e anda vem daqui: cada rua e estrada tambem guarda a sua linha central
   (roadLines) e essa linha vira uma mascara de celulas de 4 px com
     - dobras arredondadas em arco (nada de cantos retos de 90 graus),
     - serpenteio: um campo suave de deslocamento (o mesmo no mundo todo) dobra todas as linhas juntas, entao estradas paralelas
     e cruzamentos continuam encaixados; largura variando ao longo do caminho,
     - borda irregular, em celulas, com franja de terra e pedrinhas.
   A mascara so depende das linhas (sem sorteio), entao todos os jogadores veem o mesmo caminho. A cidade nao usa nada disto.
   O desenho entra no proprio chao em blocos prontos (groundTileDraw, arquivo 14); o terreno sob o carro tambem le a mascara. */
let roadLines=[];
const RM={w:0,h:0,a:null,tw:0,t:null};
const RC=4;   // lado da celula da mascara, em px do mundo
function roadReset(){roadLines=[];RM.a=null;RM.t=null;}
function roadLineAdd(pts,w,k){   // k: quanto do serpenteio vale (1 = estrada entre vilas, volta a ~35% perto das vilas; menor = rua da vila, fixa)
  let h=0;for(const p of pts)h=(Math.imul(h,31)+Math.round(p[0])*7+Math.round(p[1])*13)|0;
  roadLines.push({pts:pts,w:w,k:k,seed:(h>>>0)%9973,r:56});
}
const RW_A=15;   // deslocamento maximo do serpenteio (px). Fica dentro da folga que arvores (20 px) e predios (24 px) ja tem das estradas
function roadWarp(x,y,out){
  const cx=x/RC,cy=y/RC;
  out[0]=RW_A*((rmNoise(cx,cy,105,31)*2-1)*.75+(rmNoise(cx,cy,38,33)*2-1)*.25);
  out[1]=RW_A*((rmNoise(cx,cy,105,32)*2-1)*.75+(rmNoise(cx,cy,38,34)*2-1)*.25);
}
function rmHash(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function rmNoise(x,y,sc,s){   // ruido de valor suave; x e y em celulas, sc = tamanho do "mancha" em celulas
  const fx=x/sc,fy=y/sc,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);
  const a=rmHash(ix,iy,s),b=rmHash(ix+1,iy,s),c=rmHash(ix,iy+1,s),d=rmHash(ix+1,iy+1,s);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function rmN1(t,s){const i=Math.floor(t),f=t-i,u=f*f*(3-2*f),a=rmHash(i,0,s),b=rmHash(i+1,0,s);return a+(b-a)*u;}
/* linha central -> pontos a cada ~3 px, com as dobras trocadas por arcos de raio r */
function roadDense(pts,R){
  const out=[];
  const seg=(x0,y0,x1,y1)=>{const d=Math.hypot(x1-x0,y1-y0),n=Math.max(1,Math.ceil(d/3));for(let k=1;k<=n;k++)out.push(x0+(x1-x0)*k/n,y0+(y1-y0)*k/n);};
  let cx=pts[0][0],cy=pts[0][1];out.push(cx,cy);
  for(let i=1;i<pts.length-1;i++){
    const p=pts[i],a=pts[i-1],b=pts[i+1];
    const la=Math.hypot(p[0]-a[0],p[1]-a[1]),lb=Math.hypot(b[0]-p[0],b[1]-p[1]);
    if(la<1||lb<1)continue;
    const ux=(p[0]-a[0])/la,uy=(p[1]-a[1])/la,vx=(b[0]-p[0])/lb,vy=(b[1]-p[1])/lb;
    if(Math.abs(ux*vy-uy*vx)<.05)continue;   // quase reto: sem arco
    const r=Math.min(R,la*.5,lb*.5);
    const e0x=p[0]-ux*r,e0y=p[1]-uy*r,e1x=p[0]+vx*r,e1y=p[1]+vy*r;
    seg(cx,cy,e0x,e0y);
    const n=Math.max(4,Math.ceil(r*1.7/3));
    for(let k=1;k<=n;k++){const t=k/n,m=1-t;out.push(m*m*e0x+2*m*t*p[0]+t*t*e1x,m*m*e0y+2*m*t*p[1]+t*t*e1y);}
    cx=e1x;cy=e1y;
  }
  const L=pts[pts.length-1];seg(cx,cy,L[0],L[1]);
  return out;
}
function roadStamp(L){
  const d=roadDense(L.pts,L.r),n=d.length/2,s=new Float32Array(n);
  for(let i=1;i<n;i++)s[i]=s[i-1]+Math.hypot(d[2*i]-d[2*i-2],d[2*i+1]-d[2*i-1]);
  const S=s[n-1],sd=L.seed,W2=L.w/2,w=RM.w,h=RM.h,a=RM.a,wp=[0,0];
  for(let i=0;i<n;i++){
    const k=L.k>=1?.35+.65*Math.min(1,Math.min(s[i],S-s[i])/170):L.k;   // perto da vila a estrada acompanha a rua
    roadWarp(d[2*i],d[2*i+1],wp);
    const hw=W2+2.4*(rmN1(s[i]/60,sd+13)*2-1);
    const px=d[2*i]+wp[0]*k,py=d[2*i+1]+wp[1]*k,r=hw+4.5;
    const x0=Math.max(0,Math.floor((px-r)/RC)),x1=Math.min(w-1,Math.floor((px+r)/RC)),y0=Math.max(0,Math.floor((py-r)/RC)),y1=Math.min(h-1,Math.floor((py+r)/RC));
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      if(a[cy*w+cx])continue;
      const dd=Math.hypot(cx*RC+RC/2-px,cy*RC+RC/2-py);
      if(dd>hw+3.6)continue;
      if(dd>hw-3.2){const j=(rmNoise(cx,cy,3,11)*2-1)*2.6+(rmHash(cx,cy,12)*2-1)*1.1;if(dd>hw+j)continue;}   // borda irregular
      a[cy*w+cx]=1;
    }
  }
}
function roadMaskBuild(){
  RM.w=Math.ceil(WW/RC);RM.h=Math.ceil(WH/RC);RM.a=new Uint8Array(RM.w*RM.h);
  for(const L of roadLines)roadStamp(L);
  RM.tw=Math.ceil(WW/16);RM.t=new Uint8Array(RM.tw*Math.ceil(WH/16));   // blocos de 16 px que tem estrada ou franja (so eles passam pelo desenho)
  const w=RM.w,h=RM.h,a=RM.a;
  for(let cy=0;cy<h;cy++)for(let cx=0;cx<w;cx++){
    if(!a[cy*w+cx])continue;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const x=cx+i,y=cy+j;if(x>=0&&y>=0&&x<w&&y<h)RM.t[(y>>2)*RM.tw+(x>>2)]=1;}
  }
}
function roadMaskAt(x,y){
  if(!RM.a)return false;
  const cx=Math.floor(x/RC),cy=Math.floor(y/RC);
  return cx>=0&&cy>=0&&cx<RM.w&&cy<RM.h&&RM.a[cy*RM.w+cx]===1;
}
const RPAL={
  forest:{t:['#766646','#7c6c4b','#836f4d'],edge:'#6a5a3c',fr:'#4b5c2b',peb:'#9a8c6c'},
  desert:{t:['#8a7a58','#908060','#867654'],edge:'#7a6a4c',fr:'#a68e50',peb:'#b4a074'},
  snow:  {t:['#98a4b0','#a0acb8','#929eaa'],edge:'#c6d0da',rim:'#e6eef6',fr:'#b9c5d1',peb:'#8a96a2'}
};
/* desenha, por cima do chao de um bloco de 16 px, as celulas de estrada, a borda e a franja (mesma conta no bloco pronto e no desenho direto) */
function roadTileDraw(q,tx,ty){
  if(!RM.t||!RM.t[ty*RM.tw+tx])return;
  const P_=RPAL[selectedMap];if(!P_)return;
  const w=RM.w,h=RM.h,a=RM.a,cx0=tx*4,cy0=ty*4;
  const g=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&a[y*w+x]===1;
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){
    const cx=cx0+i,cy=cy0+j,px=cx*RC,py=cy*RC;
    if(g(cx,cy)){
      const edge=!g(cx-1,cy)||!g(cx+1,cy)||!g(cx,cy-1)||!g(cx,cy+1),hh=rmHash(cx,cy,5);
      let col;
      if(edge)col=P_.rim?(hh<.6?P_.rim:P_.edge):(hh<.55?P_.edge:P_.t[1]);
      else{const n=rmNoise(cx,cy,6,3);col=P_.t[n<.36?0:n<.68?1:2];if(hh>.93)col=P_.t[(n<.5?2:0)];}
      q(px,py,RC,RC,col);
      if(rmHash(cx,cy,9)>.97)q(px+1,py+2,2,1,P_.peb);
    }else if(g(cx-1,cy)||g(cx+1,cy)||g(cx,cy-1)||g(cx,cy+1)){
      const hh=rmHash(cx,cy,5);
      if(hh<.32)q(px+1,py+1,2,2,P_.fr);
      else if(hh<.45)q(px,py+2,2,1,P_.fr);
    }
  }
}
window.roadTileDraw=roadTileDraw;
