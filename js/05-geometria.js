/* ============ GEOMETRIA ============ */
/* Contorno do lago: UMA função usada pelo desenho, pela colisão e pelo minimapa
   (antes a colisão usava círculos maiores que o lago desenhado). */
function lakeWobble(l,ang){
  if(l.fountain)return 1;
  if(l._seed===undefined) l._seed=(l.cx*12.9898+l.cy*78.233)%100;
  const s=l._seed;
  return 0.82+0.12*Math.sin(ang*2.3+s)+0.08*Math.cos(ang*4.1-s*0.5)+0.05*Math.sin(ang*7+s*1.3);
}
/* ===== GELO SOLIDO (lagos congelados do mapa de Neve) =====
   Uma parte de cada lago (posicao fixa, calculada do proprio lago: nao usa o sorteio do mundo) e gelo firme: da pra andar em cima.
   O peso fica registrado por celula de 26 px: quem fica parado (ou corre) no mesmo ponto acumula tensao, o gelo estala (4s), racha (7s)
   e quebra (11s), abrindo um buraco de agua onde o personagem cai. A tensao e maior perto da borda (gelo mais fino) e vai sumindo se a pessoa sai de cima. */
function iceOf(l){
  if(!l._ip){const a=fracHash(l.cx*.0137+l.cy*.0071)*6.283;l._ip={x:l.cx+Math.cos(a)*l.r*.26,y:l.cy+Math.sin(a)*l.r*.24,rx:l.r*.6,ry:l.r*.52};}
  return l._ip;
}
function iceSolid(l,x,y){
  const q=iceOf(l),ex=(x-q.x)/q.rx,ey=(y-q.y)/q.ry;
  if(ex*ex+ey*ey>=1)return false;
  const hs=l.holes;if(hs)for(let i=0;i<hs.length;i++){const h=hs[i];if((x-h.x)*(x-h.x)+(y-h.y)*(y-h.y)<h.r*h.r)return false;}
  return true;
}
function addIceHole(l,x,y,remote){
  if(!l.holes)l.holes=[];
  l.holes.push({x:Math.round(x),y:Math.round(y),r:16});
  if(l._st)l._st.clear();
  const d=P?Math.hypot(P.x-x,P.y-y):0;
  if(d<400){beep(110,.3,'sawtooth',.06*(1-d/400),-60,'amb');beep(1800,.06,'square',.04*(1-d/400),-1200,'amb');}
  for(let i=0;i<16;i++)parts.push({x:x+rnd(-10,10),y:y+rnd(-6,6),vx:rnd(-50,50),vy:rnd(-70,-20),t:.7,c:i%3?'#e8f6ff':'#5aa8d8'});
  if(!remote&&MP.active)sendEvt('iceBreak',{l:lakes.indexOf(l),x:Math.round(x),y:Math.round(y)});
}
function iceTick(dt){
  if(selectedMap!=='snow'||!P)return;
  for(const l of lakes){const st=l._st;if(!st||!st.size)continue;for(const [k,o] of st){o.s-=dt*.12;if(o.s<=0)st.delete(k);}}
  if(P.dead||P.inVehicle)return;
  for(const l of lakes){
    if(!l.frozen||l.fountain||!iceSolid(l,P.x,P.y))continue;
    const q=iceOf(l),dn=Math.min(1,Math.hypot((P.x-q.x)/q.rx,(P.y-q.y)/q.ry));
    const rate=(1+dn*.9)*(P.sprint?1.5:(P.moving?.7:1));
    if(!l._st)l._st=new Map();
    const cx=Math.floor(P.x/26),cy=Math.floor(P.y/26),k=cx*100003+cy;
    let o=l._st.get(k);if(!o){o={s:0,x:cx*26+13,y:cy*26+13,a:0};l._st.set(k,o);}
    o.s+=dt*rate+dt*.12;
    if(o.s>4&&o.a<1){o.a=1;beep(1500,.05,'square',.035,-900);beep(700,.12,'sawtooth',.02,-300);}
    if(o.s>7&&o.a<2){o.a=2;shake=Math.max(shake,2);beep(900,.05,'square',.06,-700);beep(380,.2,'sawtooth',.05,-250);toast('O gelo está rachando! Saia daí');}
    if(o.s>5.5&&o.a>=1&&Math.random()<dt*1.4)beep(1200+Math.random()*700,.04,'square',.02,-700);
    if(o.s>=11){shake=Math.max(shake,6);addIceHole(l,P.x,P.y,false);toast('O gelo quebrou!');}
    return;
  }
}
function drawIcePatch(l){
  const q=iceOf(l);
  ctx.save();lakeShorePath(l,.97);ctx.clip();
  ctx.beginPath();
  for(let i=0;i<=28;i++){const a=i/28*6.283,w=1+(fracHash(l.cx*.31+i%14*1.7)-.5)*.14;const X=q.x+Math.cos(a)*q.rx*w,Y=q.y+Math.sin(a)*q.ry*w;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}
  ctx.closePath();
  const g=ctx.createRadialGradient(q.x-q.rx*.2,q.y-q.ry*.25,q.rx*.1,q.x,q.y,q.rx);
  g.addColorStop(0,'#e4f2fa');g.addColorStop(.6,'#c8e2f0');g.addColorStop(1,'#a8cce0');
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#f6fcff';ctx.lineWidth=1.6;ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;
  for(let i=0;i<6;i++){const a=fracHash(l.cx*.7+i*3.3)*6.283,r0=fracHash(l.cy*.9+i*1.9)*q.rx*.5;const X=q.x+Math.cos(a)*r0,Y=q.y+Math.sin(a)*r0*.8;ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(X+(fracHash(i+l.cx)-.5)*30,Y+(fracHash(i*2+l.cy)-.5)*10);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<10;i++){const a=fracHash(l.cx*.5+i*2.1)*6.283,r0=Math.sqrt(fracHash(l.cy*.4+i*5.3))*q.rx*.85;ctx.fillRect(Math.round(q.x+Math.cos(a)*r0),Math.round(q.y+Math.sin(a)*r0*.85),2,1);}
  // rachaduras onde ha tensao acumulada
  if(l._st){
    ctx.strokeStyle='rgba(40,80,110,.75)';ctx.lineWidth=1;
    for(const o of l._st.values()){
      if(o.s<3.5)continue;const n=2+Math.min(5,Math.floor((o.s-3.5)*.8)),len=6+Math.min(14,(o.s-3.5)*2.2);
      for(let i=0;i<n;i++){const a=i/n*6.283+o.x*.1;let X=o.x,Y=o.y;ctx.beginPath();ctx.moveTo(X,Y);for(let j=0;j<3;j++){const aa=a+(fracHash(o.x+i*7+j)-.5)*.9;X+=Math.cos(aa)*len/3;Y+=Math.sin(aa)*len/3*.8;ctx.lineTo(X,Y);}ctx.stroke();}
    }
  }
  ctx.restore();
  if(l.holes)for(const h of l.holes){
    ctx.fillStyle='#e8f6ff';ctx.beginPath();ctx.ellipse(h.x,h.y,h.r+2,(h.r+2)*.85,0,0,6.283);ctx.fill();
    ctx.fillStyle='#17506f';ctx.beginPath();ctx.ellipse(h.x,h.y,h.r-1,(h.r-1)*.8,0,0,6.283);ctx.fill();
    ctx.strokeStyle='rgba(150,210,240,.6)';ctx.lineWidth=1;const w=(T*1.2)%1;ctx.beginPath();ctx.ellipse(h.x,h.y,(h.r-3)*(.4+w*.5),(h.r-3)*.8*(.4+w*.5),0,0,6.283);ctx.stroke();
  }
  ctx.restore();
}
/* profundidade 0..1 no ponto: 0 na margem, 1 a partir de ~24 px para dentro (chafariz da cidade não afunda ninguém) */
function lakeDepth(x,y){
  if(ORLA&&y>ORLA.top&&inSea(x,y))return Math.min(1,(y-orlaShore(x))/24);
  for(const l of lakes){
    if(l.fountain)continue;
    const dx=x-l.cx,dy=(y-l.cy)/0.92,d2=dx*dx+dy*dy,lim=l.r*1.08;
    if(d2>lim*lim)continue;
    let a=Math.atan2(dy,dx);if(a<0)a+=6.283;
    const edge=l.r*lakeWobble(l,a),d=Math.sqrt(d2);
    if(d<edge){if(l.frozen&&iceSolid(l,x,y))return 0;return Math.min(1,(edge-d)/24);}
  }
  return 0;
}
/* superfície da água em volta de quem está afundado: elipse azul translúcida que esconde o corte do corpo, com marolas */
function waterSurface(x,y,depth,k){
  const t=T*3,rx=(6+depth*3)*k,ry=(2.6+depth*.8)*k,X=Math.round(x),Y=Math.round(y);
  ctx.save();
  ctx.fillStyle='rgba(38,112,176,'+(.5+.25*depth).toFixed(2)+')';            // metade da frente da elipse: cobre o corte do corpo sem tapar a cabeça
  ctx.beginPath();ctx.ellipse(X,Y,rx,ry,0,0,3.1416);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(205,235,255,.75)';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(X,Y,rx,ry,0,0,3.1416);ctx.stroke();
  const w=(t%1);ctx.globalAlpha=.55*(1-w);ctx.strokeStyle='#e6f6ff';           // marola que se abre
  ctx.beginPath();ctx.ellipse(X,Y,rx+3+w*7*k,ry+1.5+w*3*k,0,0,6.283);ctx.stroke();
  ctx.restore();
}
function nearFountain(x,y){
  for(const l of lakes)if(l.fountain&&Math.hypot(x-l.cx,(y-l.cy)/.92)<l.r*1.6)return true;
  return false;
}
function pointInLake(x,y){
  if(ORLA&&y>ORLA.top&&inSea(x,y))return true;
  for(const l of lakes){
    const dx=x-l.cx, dy=(y-l.cy)/0.92, d2=dx*dx+dy*dy, lim=l.r*1.08;
    if(d2>lim*lim) continue;
    let a=Math.atan2(dy,dx); if(a<0) a+=6.283; // mesma faixa 0..2π do desenho
    if(Math.sqrt(d2)<l.r*lakeWobble(l,a)) return !(l.frozen&&iceSolid(l,x,y));
  }
  return false;
}
/* ===== ORLA DA CIDADE: calcadao de ondas, praia e mar raso na borda de baixo (direita, esquerda e topo ficam com o chao cinza da cidade) =====
   Tudo e derivado das ruas ja geradas e de um gerador proprio (mkRng): nao consome o _rng, entao o resto do mundo continua igual. */
let ORLA=null;
function orlaShore(x){const o=ORLA;return o.sea+9*Math.sin(x*.0042+o.p1)+5*Math.sin(x*.011+o.p2)+3*Math.sin(x*.027+o.p3);}
function orlaSand(x){const o=ORLA;return orlaShore(x)-o.sandW-6*Math.sin(x*.0063+o.p2);}
function orlaHit(e,r){   // estruturas da orla (quiosque, torre, barcos, pedras, grade do pier)
  if(e.y<ORLA.yb-4)return;
  for(const w of ORLA.rects)pushRect(e,r,w);
  for(const w of ORLA.rails)pushRect(e,r,w);
}
function onSand(x,y){return !!ORLA&&y>ORLA.yb&&y>orlaSand(x)&&y<=orlaShore(x)&&!onPier(x,y);}
function onPier(x,y){for(const p of ORLA.piers)if(x>p.x-p.w/2&&x<p.x+p.w/2&&y>=p.y0&&y<=p.y1)return true;return false;}
function inSea(x,y){return !!ORLA&&y>ORLA.top&&y>orlaShore(x)&&!onPier(x,y);}
function genOrla(){
  let yb=0,xb=0;
  for(const r of roads){if(r.y+r.h>yb)yb=r.y+r.h;if(r.x+r.w>xb)xb=r.x+r.w;}
  {   // margem da direita igual a da esquerda (a geracao ja terminou, entao cortar o mundo aqui nao mexe no sorteio)
    let x0=1e9;for(const r of roads)if(r.x<x0)x0=r.x;
    const nw=Math.round(xb+x0);
    if(nw<WW){
      WW=nw;
      const kx=a=>a.filter(e=>e.x<WW-6);
      trees=kx(trees);rocks=kx(rocks);decorations=kx(decorations);items=kx(items);animals=kx(animals);vehicles=vehicles.filter(v=>v.x<WW-24);
    }
  }
  const m=WH-yb;
  if(m<90)return;
  const h=mkRng(((Math.round(yb)*131+Math.round(xb)*71+WW)%99991)/99991);
  const sandW=Math.round(clamp(m*.32,34,110)),seaD=clamp(m*.4,56,200);
  const sea=Math.max(WH-seaD,yb+sandW+22);
  ORLA={yb,xb,sea,sandW,top:sea-24,p1:h()*6.28,p2:h()*6.28,p3:h()*6.28,piers:[],rects:[],rails:[]};
  const o=ORLA;
  for(const fx of [.18+h()*.14,.58+h()*.22]){
    const x=Math.round(WW*fx),sh=orlaShore(x);
    const pr={x,w:30,y0:Math.round(orlaSand(x)-2),y1:Math.round(Math.min(WH-14,sh+60+h()*70))};
    o.piers.push(pr);
    const L=x-15,ys=Math.round(Math.min(sh,orlaShore(L),orlaShore(L+30)))-2;   // grade nas laterais e na ponta: so se entra no pier pela areia
    o.rails.push({x:L-4,y:ys,w:4,h:pr.y1-ys+3},{x:L+30,y:ys,w:4,h:pr.y1-ys+3},{x:L-4,y:pr.y1-1,w:38,h:4});
  }
  const keep=a=>a.filter(e=>e.y<yb-6);
  trees=keep(trees);rocks=keep(rocks);decorations=keep(decorations);items=keep(items);animals=keep(animals);
  vehicles=vehicles.filter(v=>v.y<yb-10);
  const dec=(x,y,type,solid)=>{decorations.push({x:Math.round(x),y:Math.round(y),type,solid:!!solid,seed:h()});};
  const nearPier=x=>o.piers.some(p=>Math.abs(x-p.x)<p.w/2+22);
  const prom=x=>orlaSand(x)-yb;
  for(let x=60+h()*60;x<WW-50;x+=118+h()*60){          // palmeiras do calcadao
    if(nearPier(x))continue;
    const ph=prom(x);
    dec(x,ph>=40?yb+ph-14:orlaSand(x)+8,'palmorla',true);
  }
  for(let x=140;x<WW-60;x+=260){if(!nearPier(x)&&prom(x)>=24)dec(x,yb+9,'lamp',true);}
  for(let x=300+h()*100;x<WW-80;x+=380+h()*120){if(!nearPier(x)&&prom(x)>=34)dec(x,yb+prom(x)*.42,'bench',true);}
  for(let x=520+h()*200;x<WW-120;x+=1000+h()*400){
    if(nearPier(x))continue;
    const kx=x,ky=prom(kx)>=60?yb+prom(kx)*.55:orlaSand(kx)+16;
    dec(kx,ky,'kiosk',false);o.rects.push({x:kx-22,y:ky-9,w:44,h:11});
    items.push({t:h()<.5?'water':'food',x:Math.round(kx+h()*30-15),y:Math.round(ky+14)});
  }
  for(let x=110+h()*80;x<WW-60;x+=95+h()*80){          // guarda-sois e toalhas
    if(nearPier(x))continue;
    const sy=orlaSand(x),shy=orlaShore(x),y=sy+(shy-sy)*(.35+h()*.3);
    if(shy-sy<26)continue;
    if(h()<.62){dec(x,y,'umbrella',false);o.rects.push({x:x-2,y:y-3,w:4,h:4});dec(x+14,y+8,'towel',false);}
    else dec(x,y+4,'towel',false);
  }
  for(const fx of [.31,.77]){const x=Math.round(WW*(fx+h()*.06));if(!nearPier(x)){const sy=orlaSand(x),shy=orlaShore(x);{const ly=sy+(shy-sy)*.55;dec(x,ly,'lifeguard',false);o.rects.push({x:x-11,y:ly-8,w:22,h:9});}}}
  for(let x=90+h()*60;x<WW-50;x+=190+h()*90){          // boias
    if(nearPier(x))continue;
    const y=orlaShore(x)+Math.min(54,(WH-orlaShore(x))*.55);
    if(y<WH-8)dec(x,y,'buoy',false);
  }
  for(let i=0;i<4;i++){                                // barcos e pedras no mar
    const x=Math.round(WW*(.08+h()*.84));if(nearPier(x))continue;
    const sh=orlaShore(x),room=WH-sh;
    if(room>74){const by=sh+Math.min(room-22,46+h()*50);dec(x,by,'boat',false);o.rects.push({x:x-22,y:by-8,w:44,h:10});}
  }
  for(let i=0;i<7;i++){
    const x=Math.round(WW*(.04+h()*.92));if(nearPier(x))continue;
    const sh=orlaShore(x),room=WH-sh;
    if(room>60){const ry=sh+14+h()*Math.min(40,room-30);dec(x,ry,'searock',false);o.rects.push({x:x-9,y:ry-6,w:18,h:7});}
  }
  lampList=decorations.filter(d=>d.type==='lamp');
}
let _PAVE=null,_SANDP=null;
function orlaPatterns(){
  if(_PAVE)return;
  let c=document.createElement('canvas');c.width=48;c.height=16;let g=c.getContext('2d');
  g.fillStyle='#cfc9ba';g.fillRect(0,0,48,16);
  for(let x=0;x<48;x++){const y=Math.round(6+3.2*Math.sin(x/48*6.283));g.fillStyle='#7d786e';g.fillRect(x,y,1,4);g.fillStyle='#e6e1d3';g.fillRect(x,y-2,1,1);}
  _PAVE=ctx.createPattern(c,'repeat');
  c=document.createElement('canvas');c.width=32;c.height=32;g=c.getContext('2d');
  g.fillStyle='#e0cb92';g.fillRect(0,0,32,32);
  const r=mkRng(.37);
  for(let i=0;i<22;i++){g.fillStyle=i%3?'#cdb577':'#efdfa8';g.fillRect(Math.floor(r()*31),Math.floor(r()*31),2,1+(i%2));}
  _SANDP=ctx.createPattern(c,'repeat');
}
function drawOrla(vx0,vy0,vx1,vy1){
  const o=ORLA;if(!o)return;
  orlaPatterns();
  if(vy1<o.yb)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,WW,WH);ctx.clip();
  const xa=Math.max(Math.floor(vx0/8)*8-8,-8),xe=Math.min(Math.ceil(vx1/8)*8+8,WW+8);
  const band=(fTop,fBot)=>{ctx.beginPath();ctx.moveTo(xa,fTop(xa));for(let x=xa+8;x<=xe;x+=8)ctx.lineTo(x,fTop(x));for(let x=xe;x>=xa;x-=8)ctx.lineTo(x,fBot(x));ctx.closePath();};
  const yb=()=>o.yb+0,sand=orlaSand,shore=orlaShore,bot=()=>WH+12;
  band(yb,sand);ctx.fillStyle=_PAVE;ctx.fill();                       // calcadao de ondas
  ctx.strokeStyle='#8f8a7f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xa,sand(xa));for(let x=xa+8;x<=xe;x+=8)ctx.lineTo(x,sand(x));ctx.stroke();
  band(sand,shore);ctx.fillStyle=_SANDP;ctx.fill();                   // areia
  band(x=>shore(x)-9,shore);ctx.fillStyle='rgba(140,105,55,.32)';ctx.fill();
  const t=T;
  band(shore,bot);ctx.fillStyle='#16688f';ctx.fill();                 // mar: fundo
  band(shore,x=>shore(x)+46+4*Math.sin(x*.03+t*.8));ctx.fillStyle='#2189b3';ctx.fill();
  band(shore,x=>shore(x)+20+3*Math.sin(x*.05+t*1.2));ctx.fillStyle='#3fb0c9';ctx.fill();
  band(shore,x=>shore(x)+8+2*Math.sin(x*.07+t*1.6));ctx.fillStyle='#86d9dc';ctx.fill();
  ctx.strokeStyle='rgba(235,250,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();
  for(let x=Math.floor(xa/36)*36;x<xe;x+=36){
    for(let k=0;k<9;k++){
      const y=shore(x)+30+k*26+3*Math.sin(t*1.1+x*.02+k),dx=x+((t*12+k*13)%36);
      if(y>WH)break;ctx.moveTo(dx,y);ctx.lineTo(dx+12,y);
    }
  }
  ctx.stroke();
  for(let x=xa;x<xe;x+=8){                                            // espuma da arrebentacao
    const fy=shore(x)+Math.round(1.8*Math.sin(t*1.7+x*.05));
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(x,fy-1,9,3);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x,fy+4+Math.round(Math.sin(t*1.3+x*.09)*2),9,1);
  }
  for(const p of o.piers){                                            // pier de madeira (da pra andar por cima)
    if(p.x+p.w<vx0||p.x-p.w>vx1)continue;
    const L=p.x-p.w/2,len=p.y1-p.y0;
    R(L+4,p.y0+6,p.w,len,'rgba(0,30,50,.28)');
    R(L,p.y0,p.w,len,'#8a6a44');
    for(let y=p.y0+3;y<p.y1;y+=6)R(L,y,p.w,1,'#6e5232');
    R(L,p.y0,2,len,'#5a4228');R(L+p.w-2,p.y0,2,len,'#5a4228');
    for(let y=p.y0+10;y<p.y1;y+=38){R(L-2,y,4,5,'#4a3622');R(L+p.w-2,y,4,5,'#4a3622');}
    R(L-2,p.y1-3,p.w+4,4,'#4a3622');
  }
  for(const w of o.rails){   // corrimao do pier (laterais e ponta)
    if(w.x>vx1||w.x+w.w<vx0)continue;
    R(w.x,w.y,w.w,w.h,'#6e5232');R(w.x,w.y,w.w>w.h?w.w:1,w.w>w.h?1:w.h,'#b08a5c');
  }
  ctx.restore();
}
/* Meia-largura/altura do veículo alinhada aos eixos, considerando a rotação (carro de lado ocupa 20x36, não 36x20) */
/* Terreno sob o carro: estrada = melhor aderência e velocidade; fora dela depende do mapa */
const TERR={
  road:  {id:'road', spd:1,   acc:1,   steer:1,   coast:.08},
  icy:   {id:'road', spd:.92, acc:.85, steer:.88, coast:.14},
  lot:   {id:'lot',  spd:.84, acc:.85, steer:.95, coast:.06, dust:'#8a8a82'},
  grass: {id:'grass',spd:.86, acc:.85, steer:.95, coast:.06, dust:'#7a6a4a'},
  sand:  {id:'sand', spd:.75, acc:.7,  steer:.85, coast:.035,dust:'#d2b87c'},
  snow:  {id:'snow', spd:.72, acc:.65, steer:.78, coast:.16, dust:'#eef4fa'},
  water: {id:'water',spd:.3,  acc:.4,  steer:.7,  coast:.03, dust:'#8cc8f0'}
};
const CAR_TOP=96; // referencia antiga; cada veiculo tem a sua velocidade em VEH
/* Cada veiculo tem personalidade propria (todos os veiculos de um mapa sao do mesmo tipo):
   carro (cidade): carroceria de aco, o mais resistente e o mais rapido no asfalto, mas baixo e ruim fora da estrada
   quadriciclo (floresta): leve e agil, o mais versatil (mato, trilha, terra), exposto e frágil
   moto de neve (neve): a mais rapida do jogo na neve, desliza muito, quase nao anda em chao sem neve, a mais fragil
   buggy (deserto): motor forte e arrancada rapida, gaiola de tubos resistente, voa na areia
   terr = multiplicador de velocidade por tipo de chao; armor = quanto do dano de batida chega ao veiculo; ram = forca ao atropelar */
const VEH={
  car:  {top:118,acc:44,rev:-34,steerK:.95,hp:160,armor:.7, ram:1.3,terr:{road:1.0,icy:.9,lot:.82,grass:.62,sand:.45,snow:.5,water:.25}},
  atv:  {top:98, acc:54,rev:-34,steerK:1.2,hp:95, armor:1,  ram:1,  terr:{road:.98,icy:.8,lot:.95,grass:1.04,sand:.85,snow:.78,water:.4}},
  sled: {top:122,acc:50,rev:-26,steerK:.95,hp:80, armor:1.15,ram:.8,terr:{road:.48,icy:1.0,lot:.45,grass:.5,sand:.4,snow:1.05,water:.2}},
  buggy:{top:108,acc:58,rev:-34,steerK:1.1,hp:125,armor:.85,ram:1.1,terr:{road:.95,icy:.8,lot:.9,grass:.92,sand:1.0,snow:.62,water:.35}}
};
function vehSpec(v){return VEH[vehKind(v)]||VEH.car;}
function vehTerr(v,tr){   // terreno visto por ESTE veiculo
  const sp=vehSpec(v),key=tr===TERR.icy?'icy':tr.id,gl=(key==='snow'||key==='icy');
  const o=Object.assign({},tr,{spd:sp.terr[key]!==undefined?sp.terr[key]:tr.spd,steer:tr.steer*sp.steerK});
  if(vehKind(v)==='sled'){o.coast=gl?.12:.02;if(gl)o.acc=tr.acc*1.25;}     // esquis: deslizam na neve, travam no chão seco
  else if(vehKind(v)==='atv'&&(key==='grass'||key==='road'))o.acc=tr.acc*1.2;
  else if(vehKind(v)==='buggy'&&key==='sand'){o.acc=tr.acc*1.12;o.coast=.05;}
  return o;
}
function carTopAt(x,y){const wf=(weather==='rain'||weather==='sand')?.92:1;const t=P&&P.inVehicle?vehSpec(P.inVehicle).top:CAR_TOP;return t*terrainFor(x,y).spd*wf;}
function terrainFor(x,y){
  if(pointInLake(x,y)) return TERR.water;
  if(onCityRoad(x,y,0)) return selectedMap==='snow'?TERR.icy:TERR.road;
  if(onSand(x,y)) return TERR.sand;
  return selectedMap==='city'?TERR.lot:(selectedMap==='desert'?TERR.sand:(selectedMap==='snow'?TERR.snow:TERR.grass));
}
function vehHalf(v){
  if(v._hf!==v.face||v._hw!==v.w){
    const f=v.face||0,c=Math.abs(Math.cos(f)),sn=Math.abs(Math.sin(f));
    v._hx=(c*v.w+sn*v.h)/2;v._hy=(sn*v.w+c*v.h)/2;v._hf=v.face;v._hw=v.w;
  }
  return v;
}
/* Grade de pontos para solidPoint: árvores, pedras, fogueiras e decorações sólidas (milhares num mundo grande) são consultadas por célula,
   em vez de varrer tudo a cada tentativa. Reconstrói sozinha se algum array foi trocado/encolheu; só acrescenta o que foi adicionado no fim. */
const SPG_C=64;let SPG=null;
function spgSync(){
  let g=SPG;
  if(!g||g.at!==trees||g.ar!==rocks||g.ac!==campfires||g.ad!==decorations||trees.length<g.nt||rocks.length<g.nr||campfires.length<g.nc||decorations.length<g.nd){
    g=SPG={m:new Map(),at:trees,ar:rocks,ac:campfires,ad:decorations,nt:0,nr:0,nc:0,nd:0};
  }
  const put=o=>{const k=(Math.floor(o.x/SPG_C)+8)*4096+Math.floor(o.y/SPG_C)+8;let a=g.m.get(k);if(!a){a=[];g.m.set(k,a);}a.push(o);};
  for(;g.nt<trees.length;g.nt++)put(trees[g.nt]);
  for(;g.nr<rocks.length;g.nr++)put(rocks[g.nr]);
  for(;g.nc<campfires.length;g.nc++)put(campfires[g.nc]);
  for(;g.nd<decorations.length;g.nd++)if(decorations[g.nd].solid)put(decorations[g.nd]);
  return g.m;
}
function solidPoint(x,y,m){
  for(const b of blds){if(x>b.x-m&&x<b.x+b.w+m&&y>b.y-m&&y<b.y+b.h+m)return true;}
  {
    const gm=spgSync(),cx0=Math.floor((x-m)/SPG_C),cx1=Math.floor((x+m)/SPG_C),cy0=Math.floor((y-m)/SPG_C),cy1=Math.floor((y+m)/SPG_C);
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){
      const a=gm.get((cx+8)*4096+cy+8);if(!a)continue;
      for(let i=0;i<a.length;i++){const o=a[i];if(Math.abs(o.x-x)<m&&Math.abs(o.y-y)<m)return true;}
    }
  }
  for(const v of vehicles){vehHalf(v);if(x>v.x-v._hx-m&&x<v.x+v._hx+m&&y>v.y-v._hy-m&&y<v.y+v._hy+m)return true;}
  if(plane&&x>plane.x-38-m&&x<plane.x+38+m&&y>plane.y-18-m&&y<plane.y+18+m)return true;
  if(pointInLake(x,y))return true;
  if(ORLA&&y>ORLA.yb-4){for(const w of ORLA.rects)if(x>w.x-m&&x<w.x+w.w+m&&y>w.y-m&&y<w.y+w.h+m)return true;for(const w of ORLA.rails)if(x>w.x-m&&x<w.x+w.w+m&&y>w.y-m&&y<w.y+w.h+m)return true;}
  if(FIELD&&FIELD.fence)for(const w of FIELD.fence){if(x>w.x-m&&x<w.x+w.w+m&&y>w.y-m&&y<w.y+w.h+m)return true;}
  return false;
}
/* Grade de paredes: em mundo grande são milhares de retângulos; cada colisão consulta só as células em volta */
const WG_C=96;let WG=null;
function wallGrid(){
  if(!WG||WG.ref!==walls||WG.n!==walls.length){
    const m=new Map();
    for(const w of walls){
      const x0=Math.floor(w.x/WG_C),x1=Math.floor((w.x+w.w)/WG_C),y0=Math.floor(w.y/WG_C),y1=Math.floor((w.y+w.h)/WG_C);
      for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){const k=(cx+8)*4096+cy+8;let a=m.get(k);if(!a){a=[];m.set(k,a);}a.push(w);}
    }
    WG={m,ref:walls,n:walls.length};
  }
  return WG.m;
}
function pointSolid(px,py){
  {const a=wallGrid().get((Math.floor(px/WG_C)+8)*4096+Math.floor(py/WG_C)+8);if(a)for(let i=0;i<a.length;i++){const w=a[i];if(px>=w.x&&px<=w.x+w.w&&py>=w.y&&py<=w.y+w.h)return true;}}
  for(const t of trees){const dx=px-t.x,dy=py-t.y;if(dx>-4&&dx<4&&dy>-4&&dy<4&&dx*dx+dy*dy<12)return true;}
  for(const v of vehicles){vehHalf(v);if(px>=v.x-v._hx&&px<=v.x+v._hx&&py>=v.y-v._hy&&py<=v.y+v._hy)return true;}
  if(plane&&px>=plane.x-35&&px<=plane.x+35&&py>=plane.y-16&&py<=plane.y+16)return true;
  // (lago não bloqueia tiro nem cuspe)
  return false;
}
/* Grade espacial — evita varrer milhares de árvores/rochas por entity/frame */
const SOLID_GRID=128;
let solidGrid=null;
function rebuildSolidGrid(){
  SPG=null;
  solidGrid=new Map();
  const put=(x,y,kind,ref)=>{
    const cx=Math.floor(x/SOLID_GRID), cy=Math.floor(y/SOLID_GRID);
    const k=cx+','+cy;
    let arr=solidGrid.get(k);
    if(!arr){ arr=[]; solidGrid.set(k,arr); }
    arr.push({x,y,kind,ref});
  };
  for(const t of trees) put(t.x,t.y,'tree',t);
  for(const r of rocks) put(r.x,r.y,'rock',r);
  for(const d of decorations) if(d.solid) put(d.x,d.y,'decor',d);
  for(const t of tents){put(t.x-12,t.y-6,'decor',t);put(t.x+12,t.y-6,'decor',t);put(t.x,t.y-10,'decor',t);}
}
function querySolidNear(x,y,pad){
  if(!solidGrid) return [];
  const cx0=Math.floor((x-pad)/SOLID_GRID), cx1=Math.floor((x+pad)/SOLID_GRID);
  const cy0=Math.floor((y-pad)/SOLID_GRID), cy1=Math.floor((y+pad)/SOLID_GRID);
  const out=[];
  for(let cx=cx0;cx<=cx1;cx++){
    for(let cy=cy0;cy<=cy1;cy++){
      const arr=solidGrid.get(cx+','+cy);
      if(arr) for(let i=0;i<arr.length;i++) out.push(arr[i]);
    }
  }
  return out;
}
function pushOut(e,r){
  // Árvores / rochas / decorações sólidas via grade (bem mais barato)
  const near=querySolidNear(e.x,e.y,24);
  for(let i=0;i<near.length;i++){
    const n=near[i];
    const dx=e.x-n.x, dy=e.y-n.y;
    if(dx>22||dx<-22||dy>22||dy<-22) continue;
    const rad=n.kind==='tree'?r+4:r+6;
    const d=Math.hypot(dx,dy);
    if(d<rad){
      if(d>.001){ e.x=n.x+dx/d*rad; e.y=n.y+dy/d*rad; }
      else e.x+=rad;
    }
  }
  for(const v of vehicles){
    if(v===e||Math.abs(v.x-e.x)>50||Math.abs(v.y-e.y)>50)continue;
    vehHalf(v);
    const cx=clamp(e.x,v.x-v._hx,v.x+v._hx),cy=clamp(e.y,v.y-v._hy,v.y+v._hy);
    const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
    if(d<r){if(d>.001){e.x=cx+dx/d*r;e.y=cy+dy/d*r;}else{e.x+=r;}}
  }
  if(plane&&e.x>plane.x-40&&e.x<plane.x+40&&e.y>plane.y-22&&e.y<plane.y+22){
    const cx=clamp(e.x,plane.x-35,plane.x+35),cy=clamp(e.y,plane.y-16,plane.y+16);
    const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
    if(d<r){if(d>.001){e.x=cx+dx/d*r;e.y=cy+dy/d*r;}else{e.x+=r;}}
  }
  {
    const gm=wallGrid(),cx0=Math.floor((e.x-r)/WG_C),cx1=Math.floor((e.x+r)/WG_C),cy0=Math.floor((e.y-r)/WG_C),cy1=Math.floor((e.y+r)/WG_C);
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){const a=gm.get((cx+8)*4096+cy+8);if(a)for(let i=0;i<a.length;i++)pushRect(e,r,a[i]);}
  }
  if(FIELD&&FIELD.fence)for(const w of FIELD.fence)pushRect(e,r,w);
  if(ORLA)orlaHit(e,r);
  for(let i=0;i<blds.length;i++){      // portas fechadas e móveis (só do prédio onde a pessoa está)
    const b=blds[i];
    if(e.x<b.x-10||e.x>b.x+b.w+10||e.y<b.y-10||e.y>b.y+b.h+10)continue;
    if(b.doors&&!e.inVehicle)for(let k=0;k<b.doors.length;k++){
      const d=b.doors[k];if(d.open)continue;
      pushRect(e,r,d.r);
      const q=d.r,ddx=e.x-clamp(e.x,q.x,q.x+q.w),ddy=e.y-clamp(e.y,q.y,q.y+q.h);
      if(ddx*ddx+ddy*ddy<(r+2.5)*(r+2.5)){
        if(e===P){P._door=d;P._doorF=DOORF;}
        else if(e.kind!==undefined&&!e.dead&&e._brkF!==DOORF&&(e.lock>0||e.alert>0||e.lastSeen)){e._brkF=DOORF;zBreakDoor(e,d,Math.max(DOOR_DT,.016));}
      }
    }
    if(e.x<b.x||e.x>b.x+b.w||e.y<b.y||e.y>b.y+b.h||!b.furn)continue;
    for(const f of b.furn)pushRect(e,r,f);
    break;
  }
}
/* anda em subpassos curtos, resolvendo a colisão a cada um: nada atravessa parede ou cerca fina, nem com FPS baixo */
function stepMove(e,dx,dy,r){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2.5)),sx=dx/n,sy=dy/n;
  for(let i=0;i<n;i++){e.x+=sx;e.y+=sy;pushOut(e,r);}
}
function pushRect(e,r,w){
  if(e.x<w.x-r||e.x>w.x+w.w+r||e.y<w.y-r||e.y>w.y+w.h+r)return;
  const cx=clamp(e.x,w.x,w.x+w.w),cy=clamp(e.y,w.y,w.y+w.h);
  const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
  if(d<r){
    if(d>.001){e.x=cx+dx/d*r;e.y=cy+dy/d*r;}
    else{
      const l=e.x-w.x,rr=w.x+w.w-e.x,tp=e.y-w.y,bt=w.y+w.h-e.y,m=Math.min(l,rr,tp,bt);
      if(m===l)e.x=w.x-r;else if(m===rr)e.x=w.x+w.w+r;else if(m===tp)e.y=w.y-r;else e.y=w.y+w.h+r;
    }
  }
}
/* Segmento (x1,y1)->(x2,y2) cruza algum retângulo de parede? Teste exato (as paredes têm só 6px,
   então amostrar de 8 em 8px deixava passar). Usado em tiros, golpes e ataques de zumbi. */
/* Segmento x retângulo (slab) */
function segRectHit(x1,y1,x2,y2,w){
  const dx=x2-x1,dy=y2-y1;
  let t0=0,t1=1;
  if(Math.abs(dx)<1e-9){ if(x1<w.x||x1>w.x+w.w)return false; }
  else{ let a=(w.x-x1)/dx,b=(w.x+w.w-x1)/dx; if(a>b){const q=a;a=b;b=q;} if(a>t0)t0=a; if(b<t1)t1=b; if(t0>t1)return false; }
  if(Math.abs(dy)<1e-9){ if(y1<w.y||y1>w.y+w.h)return false; }
  else{ let a=(w.y-y1)/dy,b=(w.y+w.h-y1)/dy; if(a>b){const q=a;a=b;b=q;} if(a>t0)t0=a; if(b<t1)t1=b; if(t0>t1)return false; }
  return true;
}
/* Primeiro prédio cujas paredes cortam o segmento (ou null). Filtra por prédio antes de olhar as 5 paredes: bem mais leve que varrer todas. */
function wallBlockerAt(x1,y1,x2,y2){
  const minx=Math.min(x1,x2),maxx=Math.max(x1,x2),miny=Math.min(y1,y2),maxy=Math.max(y1,y2);
  for(let i=0;i<blds.length;i++){
    const b=blds[i];
    if(maxx<b.x||minx>b.x+b.w||maxy<b.y||miny>b.y+b.h)continue;
    const ws=b.walls;
    for(let k=0;k<ws.length;k++) if(segRectHit(x1,y1,x2,y2,ws[k])) return b;
    const ds=b.doors;if(ds)for(let k=0;k<ds.length;k++) if(!ds[k].open&&segRectHit(x1,y1,x2,y2,ds[k].r)) return b;
  }
  return null;
}
function wallBlocks(x1,y1,x2,y2){ return wallBlockerAt(x1,y1,x2,y2)!==null; }
function castRay(x,y,ang,maxd){
  const cx=Math.cos(ang),cy=Math.sin(ang);
  // Finer step + larger hit radius so firearms reliably hit (esp. multiplayer guest)
  for(let d=4;d<=maxd;d+=3){
    const px=x+cx*d,py=y+cy*d;
    for(const z of zombies){
      if(z.dead)continue;
      const hitR = Math.max(10, (z.r||5)+6);
      const dx=z.x-px,dy=(z.y-5)-py;
      if(dx*dx+dy*dy<hitR*hitR&&!wallBlocks(px,py,z.x,z.y-5))return{x:px,y:py,z,animal:null};
    }
    // Animais ao longo do raio (todas as armas de fogo / arco)
    for(const an of animals){
      if(an.dead) continue;
      const hitR=an.k==='deer'||an.k==='boar'||an.k==='camel'?14:10;
      const dx=an.x-px, dy=(an.y-3)-py;
      if(dx*dx+dy*dy<hitR*hitR&&!wallBlocks(px,py,an.x,an.y-3)) return{x:px,y:py,z:null,animal:an};
    }
    // Only block on solid walls/trees, not every frame (keeps shots fair)
    if(d>12 && pointSolid(px,py+5))return{x:px,y:py,z:null,animal:null};
  }
  return{x:x+cx*maxd,y:y+cy*maxd,z:null,animal:null};
}
/* ===== Colisão do veículo: retângulo ORIENTADO (carroceria inteira) contra paredes, cerca, prédios, árvores, pedras, outros veículos e avião ===== */
function obbHitsRect(cx,cy,c,s,L,W,x0,y0,x1,y1){
  const ex=Math.abs(c)*L+Math.abs(s)*W,ey=Math.abs(s)*L+Math.abs(c)*W;
  if(cx+ex<x0||cx-ex>x1||cy+ey<y0||cy-ey>y1)return false;
  const mx=(x0+x1)/2,my=(y0+y1)/2,hx=(x1-x0)/2,hy=(y1-y0)/2,dx=mx-cx,dy=my-cy;
  if(Math.abs(dx*c+dy*s)>L+hx*Math.abs(c)+hy*Math.abs(s))return false;
  if(Math.abs(-dx*s+dy*c)>W+hx*Math.abs(s)+hy*Math.abs(c))return false;
  return true;
}
function obbHitsCircle(cx,cy,c,s,L,W,px,py,rad){
  const dx=px-cx,dy=py-cy,lx=dx*c+dy*s,ly=-dx*s+dy*c;
  const qx=clamp(lx,-L,L),qy=clamp(ly,-W,W);
  return (lx-qx)*(lx-qx)+(ly-qy)*(ly-qy)<rad*rad;
}
function vehicleOverlap(v){
  vehicleOverlap._n=(vehicleOverlap._n|0)+1;
  if(!solidGrid) rebuildSolidGrid();
  const c=Math.cos(v.face||0),s=Math.sin(v.face||0);
  const L=(v.w||36)*0.5,W=(v.h||20)*0.46;
  const cx=v.x,cy=v.y,R=L+W+2;
  let cnt=0;
  {
    const gm=wallGrid(),cx0=Math.floor((cx-R)/WG_C),cx1=Math.floor((cx+R)/WG_C),cy0=Math.floor((cy-R)/WG_C),cy1=Math.floor((cy+R)/WG_C);
    for(let gx=cx0;gx<=cx1;gx++)for(let gy=cy0;gy<=cy1;gy++){
      const a=gm.get((gx+8)*4096+gy+8);if(!a)continue;
      for(let i=0;i<a.length;i++){
        const w=a[i];
        if(w._vc===vehicleOverlap._n)continue;w._vc=vehicleOverlap._n;      // parede que cruza várias células: conta uma vez só
        if(w.x>cx+R||w.x+w.w<cx-R||w.y>cy+R||w.y+w.h<cy-R)continue;
        if(obbHitsRect(cx,cy,c,s,L,W,w.x-1,w.y-1,w.x+w.w+1,w.y+w.h+1))cnt++;
      }
    }
  }
  if(FIELD&&FIELD.fence)for(const w of FIELD.fence)if(obbHitsRect(cx,cy,c,s,L,W,w.x-1,w.y-1,w.x+w.w+1,w.y+w.h+1))cnt++;
  for(let i=0;i<blds.length;i++){const b=blds[i];if(b.x>cx+R||b.x+b.w<cx-R||b.y>cy+R||b.y+b.h<cy-R)continue;if(obbHitsRect(cx,cy,c,s,L,W,b.x,b.y,b.x+b.w,b.y+b.h))cnt++;} // carro não entra em casa
  const near=querySolidNear(cx,cy,R+14);
  for(let i=0;i<near.length;i++){
    const n=near[i],rad=n.kind==='tree'?9:(n.kind==='rock'?12:10);
    if(obbHitsCircle(cx,cy,c,s,L,W,n.x,n.y,rad))cnt++;
  }
  for(const o of vehicles){ // outros veículos (parados ou destruídos) também são sólidos
    if(o===v)continue;
    if(Math.abs(o.x-cx)>R+30||Math.abs(o.y-cy)>R+30)continue;
    vehHalf(o);
    if(obbHitsRect(cx,cy,c,s,L,W,o.x-o._hx+2,o.y-o._hy+2,o.x+o._hx-2,o.y+o._hy-2))cnt++;
  }
  if(plane&&obbHitsRect(cx,cy,c,s,L,W,plane.x-35,plane.y-16,plane.x+35,plane.y+16))cnt++;
  return cnt;
}
function vehicleHitsEnv(v){return vehicleOverlap(v)>0;}
/* qual OUTRO veículo está na frente do carro (a carroceria avançada 3px encosta nele)? serve para o dano da batida */
function vehicleOtherAt(v,dirSign){
  const f=v.face||0,c=Math.cos(f),s=Math.sin(f),L=(v.w||36)*0.5,W=(v.h||20)*0.46;
  const cx=v.x+c*3*dirSign,cy=v.y+s*3*dirSign;
  for(const o of vehicles){
    if(o===v||o.destroyed)continue;
    if(Math.abs(o.x-cx)>L+W+30||Math.abs(o.y-cy)>L+W+30)continue;
    vehHalf(o);
    if(obbHitsRect(cx,cy,c,s,L,W,o.x-o._hx+2,o.y-o._hy+2,o.x+o._hx-2,o.y+o._hy-2))return o;
  }
  return null;
}
function losClear(x1,y1,x2,y2){ return !wallBlocks(x1,y1,x2,y2); } // teste exato (antes amostrava de 8 em 8px e atravessava paredes de 6px)


/* ===== Navegação: zumbi entra/sai de prédios pela PORTA e contorna quinas ===== */
function bldAt(x,y){
  for(let i=0;i<blds.length;i++){const b=blds[i];if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h)return b;}
  return null;
}
/* devolve {x,y,t}: ponto para onde andar agora; t=true quando é o próprio alvo (sem desvio) */
function zNav(z,gx,gy){
  let ex=gx,ey=gy,triv=true;
  const zb=bldAt(z.x,z.y), tb=bldAt(gx,gy);
  if(zb!==tb){
    triv=false;
    if(zb){            // zumbi dentro de um prédio, alvo fora (ou em outro): sai pela porta
      const cx=zb.doorX+zb.door/2, dy=zb.y+zb.h;
      if(Math.abs(z.x-cx)<zb.door/2-3&&z.y>dy-28){ex=cx;ey=dy+24;} else {ex=cx;ey=dy-14;}
    } else {           // zumbi fora, alvo dentro: vai até a frente da porta e entra reto
      const cx=tb.doorX+tb.door/2, dy=tb.y+tb.h;
      if(Math.abs(z.x-cx)<tb.door/2-3&&z.y>dy-30&&z.y<dy+50){ex=cx;ey=dy-20;} else {ex=cx;ey=dy+18;}
    }
  }
  // Dentro do prédio: se há parede interna no caminho, vai pela passagem
  if(zb&&bldAt(ex,ey)===zb){const rt=intRoute(zb,z.x,z.y,ex,ey);if(rt){ex=rt.x;ey=rt.y;triv=false;}}
  // Obstáculo no caminho: contorna pela quina mais vantajosa (e se mantém nela até chegar)
  const bo=wallBlockerAt(z.x,z.y,ex,ey);
  if(bo&&bo!==zb){
    let c=null;
    if(z._cr&&z._cb===bo&&Math.hypot(z._cr[0]-z.x,z._cr[1]-z.y)>=12&&!wallBlocks(z.x,z.y,z._cr[0],z._cr[1])) c=z._cr; // histerese
    if(!c){
      const m=16, cs=[[bo.x-m,bo.y-m],[bo.x+bo.w+m,bo.y-m],[bo.x-m,bo.y+bo.h+m],[bo.x+bo.w+m,bo.y+bo.h+m]];
      const pen=Math.max(bo.w,bo.h)*.8+40;
      let best=null,bs=1e9,bestAny=null,bsAny=1e9;
      for(const q of cs){
        const dz=Math.hypot(q[0]-z.x,q[1]-z.y); if(dz<12) continue;     // já está nessa quina
        let sc=dz+Math.hypot(ex-q[0],ey-q[1]);
        if(wallBlocks(q[0],q[1],ex,ey)) sc+=pen;                        // dessa quina ainda não enxerga o destino
        if(sc<bsAny){bsAny=sc;bestAny=q;}
        if(sc<bs&&!wallBlocks(z.x,z.y,q[0],q[1])){bs=sc;best=q;}
      }
      c=best||bestAny;
      z._cr=c;z._cb=bo;
    }
    if(c){ex=c[0];ey=c[1];triv=false;}
  } else { z._cr=null; z._cb=null; }
  return {x:ex,y:ey,t:triv};
}

