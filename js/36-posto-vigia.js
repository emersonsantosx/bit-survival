/* ============ POSTO DE VIGIA FLORESTAL (so no mapa da floresta) ============
   Torre de observacao de incendios: pernas de madeira com contraventamento, escada pelo sul, passarela com guarda-corpo em volta e cabine
   com janelas em todos os lados. Por dentro: mesa do localizador de fogo (circulo com mira), cama, fogao a lenha, mesa com radio e estante.
   Gerado pela semente do mundo (sorteio proprio: nao mexe no _rng), numa clareira. Nada vai para o save alem de P.tw.
   Andar: no chao, quem chega ao pe da escada por baixo sobe andando; na passarela o jogador anda em volta e entra pela porta.
   P.tw: ausente/0 = chao, 1 = na escada, 2 = em cima (passarela e cabine). Quem esta no alto usa as coordenadas do desenho do deck
   (LIFT px acima do pe das pernas) e nao e alcancado por zumbis nem bichos. Modulo no padrao dos 18..24: IIFE + window.*  */
(function(){
const DW=112,DH=100,LIFT=52,SW=20,CW=72,CH=60,ROOF_UP=18,WALL_H=24;
let TW=null,roofA=1,topA=1;
const R2=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

/* ---------- geometria (tudo a partir do centro do deck) ---------- */
function make(cx,cy){
  const dx=cx-DW/2,dy=cy-DH/2,db=cy+DH/2,foot=db+LIFT+8,ix=cx-CW/2,iy=dy+20;
  const t={cx,cy,dx,dy,db,foot,ix,iy};
  const r=(x,y,w,h,k)=>({x,y,w,h,k});
  t.walls=[r(ix,iy,CW,4),r(ix,iy,4,CH),r(ix+CW-4,iy,4,CH),r(ix,iy+CH-4,27,4),r(ix+CW-27,iy+CH-4,27,4)];   // porta de 18 px no meio da parede sul
  t.furn=[r(ix+4,iy+4,12,24,'cot'),r(ix+25,iy+4,22,8,'shelf'),r(ix+CW-17,iy+4,13,12,'stove'),r(ix+CW-14,iy+27,10,19,'desk'),r(ix+29,iy+23,14,13,'finder')];
  t.legs=[[dx+10,dy+LIFT+14],[dx+DW-10,dy+LIFT+14],[dx+10,db+LIFT-6],[dx+DW-10,db+LIFT-6]];
  t.stair=r(cx-SW/2,db+18,SW,foot-db-18);                         // trecho baixo da escada: barra quem esta no chao (o alto passa por cima)
  t.core={x:dx-8,y:dy-4,w:DW+16,h:foot+4-(dy-4)};                  // nada nasce nem se constroi aqui
  return t;
}
const hit=(R,x,y,m)=>x>R.x-m&&x<R.x+R.w+m&&y>R.y-m&&y<R.y+R.h+m;
function towerArea(x,y,m){return !!TW&&hit(TW.core,x,y,m||0);}
const inCab=(x,y)=>!!TW&&x>TW.ix&&x<TW.ix+CW&&y>TW.iy&&y<TW.iy+CH;

/* ---------- geracao ---------- */
function towerGen(seed){
  TW=null;roofA=1;topA=1;
  if(selectedMap!=='forest')return;
  const rr=mkRr((seed|0)*1103515245+4271);
  let F=null;
  for(let k=0;k<60&&!F;k++){
    const q=findSpot(rr,[[210,250],[180,230]]);if(!q)break;
    if(FIELD&&q.x<FIELD.x+FIELD.w+40&&q.x+q.w>FIELD.x-40&&q.y<FIELD.y+FIELD.h+40&&q.y+q.h>FIELD.y-40)continue;
    F=q;
  }
  if(!F)return;
  TW=make(Math.round(F.x+F.w/2),Math.round(F.y+80));
  // clareira em volta da torre: sem arvore, pedra, enfeite, item nem bicho
  const clr={x:TW.dx-36,y:TW.dy-26,w:DW+72,h:TW.foot-TW.dy+66},out=o=>!(hit(clr,o.x,o.y,0)||(o.x>clr.x&&o.x<clr.x+clr.w&&o.y>clr.y&&o.y<clr.y+clr.h+50&&trees.includes(o)));
  trees=trees.filter(out);rocks=rocks.filter(out);decorations=decorations.filter(out);items=items.filter(out);animals=animals.filter(out);
  lampList=decorations.filter(d=>d.type==='lamp');
}

/* ---------- colisao ---------- */
/* chamada pelo pushOut. Devolve true quando quem esta andando esta no alto (a colisao do chao nao vale para ele) */
function towerPush(e,r){
  if(!TW)return false;
  const T0=TW;
  if(e===P&&P.tw){
    // quem diz estar no alto mas esta longe da torre (renasceu, entrou num veiculo) volta ao chao
    if(!P.inVehicle&&e.x>T0.dx-30&&e.x<T0.dx+DW+30&&e.y>T0.dy-30&&e.y<T0.foot+30){upPush(e,r);return true;}
    P.tw=0;
  }
  if(e.x<T0.dx-16||e.x>T0.dx+DW+16||e.y<T0.dy||e.y>T0.foot+16)return false;
  for(const L of T0.legs)pushRect(e,r,{x:L[0]-3,y:L[1]-5,w:6,h:6});
  if(e===P&&!P.inVehicle&&Math.abs(e.x-T0.cx)<=SW/2-3&&e.y>T0.foot-10){   // chegou ao primeiro degrau vindo de baixo
    if(e.y<T0.foot+1){P.tw=1;upPush(e,r);return true;}
    return false;
  }
  pushRect(e,r,T0.stair);
  return false;
}
function upPush(e,r){
  const t=TW;
  if(e.tw===1){
    e.x=clamp(e.x,t.cx-SW/2+r,t.cx+SW/2-r);
    if(e.y>=t.foot+2){e.tw=0;return;}                // desceu
    if(e.y<t.db-3){e.tw=2;}                          // chegou ao deck
    return;
  }
  const gap=Math.abs(e.x-t.cx)<=SW/2-r+1;             // vao do guarda-corpo, no alto da escada
  e.x=clamp(e.x,t.dx+3+r,t.dx+DW-3-r);
  e.y=Math.max(e.y,t.dy+3+r);
  if(e.y>t.db-3-r){
    if(!gap)e.y=t.db-3-r;
    else{e.x=clamp(e.x,t.cx-SW/2+r,t.cx+SW/2-r);if(e.y>=t.db){e.tw=1;return;}}
  }
  for(const w of t.walls)pushRect(e,r,w);
  for(const f of t.furn)pushRect(e,r,f);
}
function towerHitVehicle(cx,cy,c,s,L,W){
  if(!TW)return 0;
  return obbHitsRect(cx,cy,c,s,L,W,TW.dx+4,TW.cy+14,TW.dx+DW-4,TW.foot)?1:0;
}
/* a cada quadro: telhado abre para quem esta dentro e a torre fica translucida para quem passa por tras dela */
function towerTick(dt){
  if(!P)return;
  if(P.tw&&(!TW||P.inVehicle))P.tw=0;   // outro mundo (sem torre)
  if(!TW)return;
  const t=TW,k=Math.min(1,dt*8);
  const cab=P.tw===2&&inCab(P.x,P.y-1);
  const behind=P.tw===2&&!cab&&P.y<t.iy+4&&P.x>t.ix-10&&P.x<t.ix+CW+10;   // atras do telhado, na passarela norte
  roofA+=((cab?0:behind?.3:1)-roofA)*k;
  const under=!P.tw&&!P.inVehicle&&P.x>t.dx-4&&P.x<t.dx+DW+4&&P.y>t.dy-ROOF_UP&&P.y<t.db+14;   // no chao, coberto pela torre
  topA+=((under?.38:1)-topA)*k;
}
/* onde os zumbis vao quando o alvo esta no alto: o pe da escada */
function towerAim(o){return o&&o.tw&&TW?{x:TW.cx,y:TW.foot+10}:o;}

/* ---------- sombra: o deck e a cabine ficam no alto, entao a sombra cai deslocada na direcao do sol, ligada ao chao pelas pernas ---------- */
function drawTowerShadow(vx0,vx1,vy0,vy1){
  const t=TW;if(!t||t.dx>vx1+120||t.dx+DW<vx0-120||t.dy>vy1+120||t.foot<vy0-120)return;
  const off=H=>[SUN.dx*H*SUN.len*.55,SUN.dy*H*SUN.len*.45];
  const a=off(58),b=off(86);
  ctx.fillStyle=SUN.fs;ctx.beginPath();
  const gy=t.dy+LIFT;
  ctx.rect(t.dx+a[0],gy+a[1],DW,DH-8);
  const poly=p=>{ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();};
  for(const L of t.legs){const x=L[0],y=L[1];poly(hullPts([[x-3,y-2],[x+3,y-2],[x+3,y+1],[x-3,y+1],[x+a[0]-3,y+a[1]],[x+a[0]+3,y+a[1]]]));}
  poly(hullPts([[t.ix+a[0],t.iy+LIFT+a[1]],[t.ix+CW+a[0],t.iy+LIFT+a[1]],[t.ix+CW+b[0],t.iy+LIFT+b[1]],[t.ix+b[0],t.iy+LIFT+b[1]],[t.ix+b[0],t.iy+LIFT+CH+b[1]-10],[t.ix+CW+b[0],t.iy+LIFT+CH+b[1]-10],[t.ix+a[0],t.iy+LIFT+CH+a[1]-10],[t.ix+CW+a[0],t.iy+LIFT+CH+a[1]-10]]));
  ctx.fill();
}

/* ---------- desenho ---------- */
const WOOD='#7a5632',HI='#9c7446',LO='#523720',INK='#2a1b10';
function beam(x0,y0,x1,y1,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
/* pernas e contraventamento (entram na ordem de profundidade pela base das pernas do sul) */
function drawTowerLegs(){
  const t=TW;if(!t)return;
  const L=t.legs;
  ctx.save();ctx.globalAlpha=topA<1?Math.max(.45,topA):1;
  for(const q of L){R2(q[0]-6,q[1]-3,12,6,'#3c3c36');R2(q[0]-5,q[1]-3,10,4,'#8a8a80');R2(q[0]-5,q[1]-3,10,1,'#b4b4a6');}   // sapatas de concreto
  const brace=(a,b,top)=>{
    beam(a[0],a[1]-3,b[0],top,3,INK);beam(b[0],b[1]-3,a[0],top,3,INK);beam(a[0],a[1]-3,b[0],top,1,WOOD);beam(b[0],b[1]-3,a[0],top,1,HI);
    beam(a[0],(a[1]+top)/2,b[0],(b[1]+top)/2,3,INK);beam(a[0],(a[1]+top)/2-.5,b[0],(b[1]+top)/2-.5,1,WOOD);
  };
  brace(L[2],L[3],t.db+4);
  for(const i of [0,1,2,3]){const q=L[i],top=i<2?t.dy+14:t.db-4;R2(q[0]-4,top,8,q[1]-top-1,INK);R2(q[0]-3,top,6,q[1]-top-2,WOOD);R2(q[0]-3,top,2,q[1]-top-2,HI);R2(q[0]+1,top,2,q[1]-top-2,LO);}
  ctx.restore();
}
function drawStairs(){
  const t=TW,x=t.cx-SW/2,y0=t.db-2,y1=t.foot,H=y1-y0;
  R2(x-3,y0,SW+6,H,INK);R2(x,y0,SW,H-1,'#33231a');
  for(let y=y0+2,i=0;y<y1-1;y+=6,i++){R2(x,y,SW,4,i&1?'#8a6439':'#946d3f');R2(x,y,SW,1,'#bd9159');R2(x,y+3,SW,1,LO);}
  for(const sx of [x-3,x+SW]){R2(sx,y0,3,H,WOOD);R2(sx,y0,1,H,HI);for(let y=y0+6;y<y1;y+=20){R2(sx-1,y-7,5,8,INK);R2(sx,y-6,3,6,HI);}}
}
function drawDeck(){
  const t=TW,x=t.dx,y=t.dy;
  R2(x-2,y-2,DW+4,DH+4,INK);
  for(let i=0;i<DH;i+=7){R2(x,y+i,DW,Math.min(7,DH-i),(i/7)&1?'#8e693e':'#977144');R2(x,y+i+6,DW,1,'#6b4b2b');}
  for(let i=0;i<14;i++)R2(x+4+((i*37)%(DW-10)),y+((i*7)%14)*7+1,1,5,'#6b4b2b');   // emendas das tabuas
  R2(x,y,DW,1,'#c39a63');R2(x,y,1,DH,'#c39a63');
  R2(x-2,t.db+2,DW+4,6,INK);R2(x,t.db+2,DW,4,LO);R2(x,t.db+2,DW,1,WOOD);   // espessura do deck (face sul)
}
function rail(x,y,w,h){R2(x-1,y-1,w+2,h+2,INK);R2(x,y,w,h,'#a67c4a');R2(x,y,w,1,'#d0a76e');}
function post(x,y){R2(x-2,y-8,5,11,INK);R2(x-1,y-7,3,9,'#a67c4a');R2(x-1,y-7,3,2,'#d0a76e');}
function railsBack(){
  const t=TW,x=t.dx,y=t.dy;
  rail(x+1,y-4,DW-2,2);for(let i=0;i<=4;i++)post(x+2+i*(DW-5)/4,y+1);
}
function railsFront(){
  const t=TW,x=t.dx,y=t.dy,b=t.db,g=SW/2+1;
  for(const sx of [x,x+DW-2]){rail(sx,y,2,DH-6);for(let i=1;i<4;i++)post(sx+1,y+i*(DH-2)/4);}
  rail(x+1,b-7,DW/2-g-1,2);rail(t.cx+g,b-7,DW/2-g-1,2);
  for(const px of [x+2,x+26,t.cx-g,t.cx+g,x+DW-27,x+DW-3])post(px,b-1);
}
function drawFloor(){
  const t=TW,x=t.ix,y=t.iy;
  R2(x,y,CW,CH,'#b08a58');
  for(let i=6;i<CW;i+=8)R2(x+i,y,1,CH,'#8e6c42');
  R2(t.cx-10,y+CH-3,20,5,'#6a4a2c');   // soleira
}
function drawWall(w){
  R2(w.x,w.y,w.w,w.h,LO);R2(w.x,w.y,w.w,1,HI);
  const lit=typeof dark==='number'&&dark>.4,g=lit?'#35506a':'#a8d4e4';   // vidro das janelas, nos quatro lados
  if(w.w>w.h){for(let i=4;i+9<w.w;i+=12){R2(w.x+i,w.y+1,9,2,g);R2(w.x+i,w.y+1,3,1,'#e4f6fc');}}
  else{for(let i=5;i+9<w.h;i+=12){R2(w.x+1,w.y+i,2,9,g);R2(w.x+1,w.y+i,1,3,'#e4f6fc');}}
}
function drawFurn(f){
  const x=f.x,y=f.y,w=f.w,h=f.h;
  R2(x+1,y+2,w,h,'rgba(0,0,0,.22)');R2(x-1,y-1,w+2,h+2,INK);
  if(f.k==='cot'){R2(x,y,w,h,'#6a4a2c');R2(x+1,y+1,w-2,h-2,'#d8d2c0');R2(x+2,y+2,w-4,5,'#f4f0e4');R2(x+1,y+10,w-2,h-11,'#5a7040');R2(x+1,y+10,w-2,2,'#7a9458');R2(x+1,y+17,w-2,1,'#465830');}
  else if(f.k==='shelf'){R2(x,y,w,h,WOOD);R2(x,y,w,1,HI);const c=['#b04a3a','#d8b048','#4a7a9a','#e0dccc','#5a7a40'];for(let i=0;i<5;i++){R2(x+2+i*4,y+2,3,4,c[i]);R2(x+2+i*4,y+2,3,1,'#fff6d8');}}
  else if(f.k==='stove'){R2(x,y,w,h,'#34363a');R2(x,y,w,1,'#6c7078');R2(x+2,y+2,5,5,'#17181a');R2(x+3,y+3,3,3,'#4a4c52');R2(x+8,y+1,4,4,'#585b62');R2(x+9,y+2,2,2,'#101112');R2(x+3,y+h-3,6,2,'#d86a28');}
  else if(f.k==='desk'){R2(x,y,w,h,'#8a6238');R2(x,y,w,1,'#b88a54');R2(x+2,y+2,6,8,'#4a5a42');R2(x+3,y+3,4,2,'#9ccf8a');R2(x+3,y+7,1,1,'#e8e0c0');R2(x+5,y+7,1,1,'#e8e0c0');R2(x+7,y,1,3,'#1c1c1c');R2(x+2,y+12,6,5,'#e8e2cc');R2(x+3,y+13,4,1,'#8a8470');}
  else{   // localizador de incendios: mapa redondo com mira
    R2(x,y,w,h,'#6a4a2c');R2(x,y,w,1,HI);
    const cx=x+w/2,cy=y+h/2;
    ctx.fillStyle='#b8882c';ctx.beginPath();ctx.arc(cx,cy,5.5,0,6.283);ctx.fill();
    ctx.fillStyle='#e4e0c4';ctx.beginPath();ctx.arc(cx,cy,4.2,0,6.283);ctx.fill();
    R2(cx-3,cy-1,3,2,'#7aa25a');R2(cx+1,cy+1,2,1,'#6a98b8');
    beam(cx-5,cy+3,cx+5,cy-3,1,'#3a2c10');R2(cx-6,cy+2,2,2,'#f0c050');R2(cx+4,cy-4,2,2,'#f0c050');
  }
}
/* fachada sul e telhado de quatro aguas (somem para quem esta dentro) */
function drawCabShell(a){
  const t=TW,x=t.ix,y=t.iy,b=y+CH,lit=typeof dark==='number'&&dark>.4;
  ctx.save();ctx.globalAlpha*=a;
  const fy=b-WALL_H;
  R2(x-1,fy,CW+2,WALL_H+1,INK);R2(x,fy,CW,WALL_H,'#855f38');
  for(let i=fy+4;i<b;i+=5)R2(x,i,CW,1,'#65462a');
  R2(x,fy,2,WALL_H,HI);R2(x+CW-2,fy,2,WALL_H,LO);
  for(const wx of [x+5,x+CW-24]){R2(wx-1,fy+6,21,13,'#e8dcc0');R2(wx,fy+7,19,11,lit?'#2c4660':'#7fb8d0');R2(wx+9,fy+7,1,11,'#e8dcc0');R2(wx,fy+12,19,1,'#e8dcc0');R2(wx+1,fy+8,5,2,'#d4f0fa');}
  R2(t.cx-10,fy+4,20,WALL_H-4,INK);R2(t.cx-9,fy+5,18,WALL_H-5,'#241810');R2(t.cx-9,fy+5,5,WALL_H-5,'#a4784a');R2(t.cx-5,fy+14,1,2,'#e8c860');   // porta aberta
  // telhado: aguas norte e oeste claras, sul e leste na sombra (sol a noroeste)
  const x0=x-6,x1=x+CW+6,y0=y-ROOF_UP,y1=fy+3,mx=t.cx,my=(y0+y1)/2,r=(x1-x0)*.16;
  const face=(p,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.closePath();ctx.fill();};
  R2(x0-1,y0-1,x1-x0+2,y1-y0+2,INK);
  face([x0,y0,x1,y0,mx+r,my,mx-r,my],'#8a9a6a');
  face([x0,y0,mx-r,my,x0,y1],'#76865a');
  face([x1,y0,x1,y1,mx+r,my],'#4a5838');
  face([x0,y1,mx-r,my,mx+r,my,x1,y1],'#5c6c46');
  for(let yy=y0+5;yy<y1;yy+=6)R2(x0+1,yy,x1-x0-2,1,'rgba(0,0,0,.14)');   // fileiras de telhas
  beam(x0,y0,mx-r,my,1,'#a8b886');beam(x1,y0,mx+r,my,1,'#39452a');beam(x0,y1,mx-r,my,1,'#8a9a6a');beam(x1,y1,mx+r,my,1,'#39452a');
  R2(mx-r,my-1,r*2,2,'#b4c492');
  R2(x0,y1-2,x1-x0,2,'#38422a');
  R2(mx-1,my-9,2,8,INK);R2(mx-2,my-11,4,3,'#c8c8c0');                                       // para-raios
  R2(x1-16,y0+5,7,8,INK);R2(x1-15,y0+6,5,6,'#6a6c72');R2(x1-15,y0+6,5,2,'#9a9ea6');         // chamine do fogao
  ctx.restore();
}
/* tudo o que fica no alto, desenhado depois do mundo: escada, deck, cabine e quem esta la em cima (em ordem de profundidade) */
function drawTowerTop(vx0,vx1,vy0,vy1){
  const t=TW;if(!t||t.dx>vx1+40||t.dx+DW<vx0-40||t.dy-40>vy1||t.foot+20<vy0)return;
  const ups=[];
  if(P.tw&&!P.inVehicle)ups.push({y:P.y,me:1});
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.tw&&rp.alive!==false&&!rp.inVehicle)ups.push({y:rp.y,rp});}
  ctx.save();ctx.globalAlpha=topA;
  drawStairs();drawDeck();railsBack();drawFloor();
  for(const w of t.walls)drawWall(w);
  const list=t.furn.map(f=>({y:f.y+f.h-3,f}));
  const man=e=>{ctx.save();ctx.globalAlpha=1;drawTowerPerson(e);ctx.restore();};
  const bottom=t.iy+CH;   // a fachada sul e o telhado cobrem quem esta antes dela; quem esta na passarela sul fica na frente
  for(const e of ups)if(e.y<bottom)list.push({y:e.y,e});
  list.sort((a,b)=>a.y-b.y);
  for(const q of list)q.f?drawFurn(q.f):man(q.e);
  if(roofA>.02)drawCabShell(roofA);
  for(const e of ups.filter(e=>e.y>=bottom&&e.y<t.db-4).sort((a,b)=>a.y-b.y))man(e);
  railsFront();
  for(const e of ups.filter(e=>e.y>=t.db-4).sort((a,b)=>a.y-b.y))man(e);
  ctx.restore();
}
/* chuva e neve nao aparecem dentro da cabine quando o telhado esta aberto */
function towerDry(x,y){return roofA<.5&&inCab(x,y);}
/* minimapa e mapa grande: a torre */
function towerMapMark(g,s){
  if(!TW)return;
  const x=TW.cx*s,y=TW.cy*s;
  g.fillStyle='#000';g.fillRect(x-3.5,y-3.5,7,7);g.fillStyle='#ff8c3a';g.fillRect(x-2.5,y-2.5,5,5);g.fillStyle='#fff';g.fillRect(x-1,y-1,2,2);
}

window.towerReset=()=>{TW=null;};window.towerGen=towerGen;window.towerArea=towerArea;window.towerPush=towerPush;window.towerHitVehicle=towerHitVehicle;window.towerTick=towerTick;window.towerAim=towerAim;
window.drawTowerShadow=drawTowerShadow;window.drawTowerLegs=drawTowerLegs;window.drawTowerTop=drawTowerTop;window.towerDry=towerDry;window.towerMapMark=towerMapMark;
window.towerInfo=()=>TW;window.towerDepth=()=>TW.db+LIFT-6;window.towerSheltered=(x,y)=>!!(P&&P.tw===2&&inCab(x,y));
})();
