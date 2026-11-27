/* ACABAMENTO DE CHUVA E NEVE
   - Chuva: poças que vão se formando enquanto chove e secam depois, com ondinhas de chuva. Nada é guardado em lista: cada célula de 88 px do mundo
     decide, por um número derivado da posição e da semente do mundo, se tem uma poça (igual para todos no multiplayer). Só as visíveis são desenhadas.
     O reflexo da lanterna, dos faróis, das fogueiras e dos postes nas poças é desenhado em drawLighting (arquivo 14), usando a lista daqui.
   - Neve: acumula aos poucos sobre os objetos enquanto neva (cerca de 70 s) e derrete devagar depois (cerca de 150 s). No mapa da neve já vem cheia.
     Sprites prontos (copas de árvore, telhados, varandas) trocam de versão ao passar de 50%; os objetos simples crescem a capa de neve pixel a pixel.
   - Cidade: asfalto e cimento nao formam poca. Na chuva a rua escurece (molhada), a agua corre pela sarjeta ate os bueiros e as gotas respingam no
     chao; poca so na terra dos gramados (parques, lotes vazios e quintais).
   Nada aqui pinta a tela inteira. */
(function(){
const WX={wet:0,snow:0,k:-1};window.WX=WX;
window.wxUpdate=function(dt){
  const seed=window.WX_SEED|0;
  if(WX.k!==seed){WX.k=seed;WX.wet=weather==='rain'?wxAmt():0;WX.snow=weather==='snow'?wxAmt():0;PCELL.clear();}   // mundo novo ou carregado: parte do ponto em que o clima esta
  WX.wet=weather==='rain'?Math.min(1,WX.wet+dt*wxAmt()/50):Math.max(0,WX.wet-dt/110);
  WX.snow=weather==='snow'?Math.min(1,WX.snow+dt*wxAmt()/70):Math.max(0,WX.snow-dt/150);
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
  const city=selectedMap==='city';
  if(selectedMap!=='snow'&&hash(ix,iy,1)<(city?.7:.34)){
    const x=ix*CELL+8+hash(ix,iy,2)*(CELL-16),y=iy*CELL+8+hash(ix,iy,3)*(CELL-16),rx=9+hash(ix,iy,4)*21,ry=rx*(.36+.14*hash(ix,iy,5));
    let ok=x>24&&y>24&&x<WW-24&&y<WH-24&&!pointInLake(x,y)&&!pointInLake(x-rx,y)&&!pointInLake(x+rx,y);
    if(ok)for(const q of[[0,0],[-rx,0],[rx,0],[0,-ry-4],[0,ry+2]])if(bldAt(x+q[0],y+q[1])){ok=false;break;}
    if(ok&&city)for(const q of[[0,0],[-rx-2,0],[rx+2,0],[0,-ry-2],[0,ry+2],[-rx*.75,-ry*.75],[rx*.75,-ry*.75],[-rx*.75,ry*.75],[rx*.75,ry*.75]])   // cidade: a poca inteira tem de caber na grama
      if(!inCityGarden(x+q[0],y+q[1])||onCityPath(x+q[0],y+q[1])||onCityRoad(x+q[0],y+q[1],8)){ok=false;break;}
    if(ok)p={x:x,y:y,rx:rx,ry:ry,ph:hash(ix,iy,6)};
  }
  if(PCELL.size>4000)PCELL.clear();
  PCELL.set(key,p);return p;
}
/* ---------- chuva na cidade: rua molhada, sarjeta, bueiros e respingos ---------- */
const DRAIN=160;   // um bueiro a cada 160 px em cada lado da rua
/* trechos da rua r fora dos cruzamentos, ao longo do eixo dela, cortados na area visivel */
function curbSpans(r,a0,a1){
  const v=r.vert,s=Math.max(a0,v?r.y:r.x),e=Math.min(a1,v?r.y+r.h:r.x+r.w);
  if(e<=s)return [];
  const cut=[];
  for(const q of cityInter){
    if(q.x+q.w<=r.x||q.x>=r.x+r.w||q.y+q.h<=r.y||q.y>=r.y+r.h)continue;
    const c0=v?q.y:q.x,c1=c0+(v?q.h:q.w);if(c1>s&&c0<e)cut.push([c0,c1]);
  }
  cut.sort((a,b)=>a[0]-b[0]);
  const out=[];let p=s;
  for(const c of cut){if(c[0]>p)out.push([p,c[0]]);p=Math.max(p,c[1]);}
  if(e>p)out.push([p,e]);
  return out;
}
function cityRain(vx0,vy0,vx1,vy1){
  const w=(P&&P.inside)?0:WX.wet,wet=w>=.04,rain=weather==='rain',sky=1-dark*.85;
  const vr=roads.filter(r=>r.x-8<vx1&&r.x+r.w+8>vx0&&r.y-8<vy1&&r.y+r.h+8>vy0);
  if(wet){   // asfalto e calcada escurecidos (um caminho so: os cruzamentos nao escurecem em dobro)
    ctx.fillStyle='rgba(14,26,48,'+(.2*w).toFixed(3)+')';ctx.beginPath();
    for(const r of vr){
      const x=Math.max(vx0,r.x-(r.vert?8:0)),y=Math.max(vy0,r.y-(r.vert?0:8)),X=Math.min(vx1,r.x+r.w+(r.vert?8:0)),Y=Math.min(vy1,r.y+r.h+(r.vert?0:8));
      if(X>x&&Y>y)ctx.rect(x,y,X-x,Y-y);
    }
    ctx.fill();
  }
  const gw=1+Math.round(2*w),water='rgba('+(dark>.5?'80,108,155':'138,172,208')+','+((.28+.32*sky)*w).toFixed(3)+')',foam='rgba(225,240,252,'+((.25+.4*sky)*w).toFixed(3)+')';
  for(const r of vr){
    const v=r.vert,a0=v?vy0:vx0,a1=v?vy1:vx1;
    for(const sp of curbSpans(r,a0-DRAIN,a1+DRAIN))for(let side=0;side<2;side++){
      const c=v?(side?r.x+r.w:r.x):(side?r.y+r.h:r.y),dir=side?-1:1;   // dir: para dentro da rua
      const bar=(a,len,off,th,col)=>{const o=dir>0?c+off:c-off-th;if(v)R(o,a,th,len,col);else R(a,o,len,th,col);};
      if(wet){   // agua encostada no meio-fio, correndo
        const s=Math.max(sp[0],a0),e=Math.min(sp[1],a1);
        if(e>s){
          bar(s,e-s,0,gw,water);
          const flow=rain?T*22:0;
          for(let k=Math.floor((s-flow)/22)-1;;k++){
            const j=Math.floor(hash(k,side+(v?2:0),11)*8),a=Math.round(k*22+j+flow);if(a>=e)break;
            const m=Math.max(a,s),n=Math.min(a+5,e);if(n>m)bar(m,n-m,k&1?0:gw-1,1,foam);
          }
        }
      }
      for(let a=Math.floor(sp[0]/DRAIN)*DRAIN+DRAIN/2;a<sp[1];a+=DRAIN){   // bueiros (fora das faixas de pedestre)
        if(a-7<sp[0]+14||a+7>sp[1]-14||a+20<a0||a-20>a1)continue;
        bar(a-7,14,0,5,'#6a6d74');bar(a-6,12,1,3,'#17181c');
        for(let i=-4;i<=4;i+=4)bar(a+i,1,1,3,'#55585f');
        if(wet){
          if(rain){const t=(T*2+hash(a,c,12))%1;bar(a-10+Math.round(t*4),2,1,1,foam);bar(a+8-Math.round(t*4),2,1,1,foam);}   // a agua entrando pelos dois lados
          VP.push({x:v?c+dir*3:a,y:v?a:c+dir*3,rx:v?4:16,ry:v?12:4,s:1,curb:true});   // a luz reflete na agua da sarjeta
        }
      }
    }
  }
  if(wet&&rain){   // respingos das gotas no chao: nascem e somem em lugares diferentes a cada volta
    const G=26;
    for(let ix=Math.floor(vx0/G);ix<=vx1/G;ix++)for(let iy=Math.floor(vy0/G);iy<=vy1/G;iy++){
      const t=T*2.2+hash(ix,iy,13)*7,n=Math.floor(t),f=t-n;if(f>.4)continue;
      const x=Math.round(ix*G+hash(ix+n*31,iy,14)*G),y=Math.round(iy*G+hash(ix,iy+n*37,15)*G);
      const col='rgba(222,236,250,'+((.2+.4*sky)*w*(1-f*1.6)*wxAmt()).toFixed(3)+')';
      if(f<.14)R(x,y,1,1,col);else{const d=f<.27?2:3;R(x-d,y,2,1,col);R(x+d-1,y,2,1,col);R(x,y-1,1,1,col);}
    }
  }
}

let VP=[];
window.wxPuddles=()=>VP;
window.drawPuddles=function(vx0,vy0,vx1,vy1){
  VP=[];
  if(selectedMap==='city')cityRain(vx0,vy0,vx1,vy1);
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
      for(let k=0;k<2;k++){const t=(T*1.4+p.ph*3+k*.5)%1;ctx.globalAlpha=(1-t)*.55*w*wxAmt();ctx.beginPath();ctx.ellipse(p.x+(k?rx*.25:-rx*.2),p.y+(k?-ry*.1:ry*.1),Math.max(1,rx*.55*t),Math.max(.5,ry*.55*t),0,0,6.283);ctx.stroke();}
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
