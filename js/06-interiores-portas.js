/* ============ GERAÇÃO DE MUNDO ============ */
function cityRoofColor(type){
  if(type==='warehouse') return pick(['#3a3a4a','#2e3844','#404850']);
  if(type==='mil') return '#56683f';
  if(type==='shop') return pick(['#7a3030','#8a4040','#6a2828']);
  if(type==='apartment') return pick(['#4a5560','#3a4550','#555a68','#4a4a58']);
  if(type==='office') return pick(['#3a4a5a','#2a3a4a','#455568']);
  if(type==='garage') return '#4a4a40';
  if(type==='clinic') return '#d0d8e0';
  if(type==='gas') return '#6a5a30';
  return pick(['#4a4a52','#555560','#3e4248','#5a5860']);
}
/* ============ INTERIORES (cômodos, passagens e móveis) ============
   Cada prédio é dividido em cômodos por paredes internas com passagens. Os móveis ficam encostados nas paredes
   (ou no meio, em galpões) e nunca fecham o caminho: cada peça só entra se a porta e todas as passagens continuam ligadas.
   Tudo usa o gerador com semente (_rng), então os dois jogadores do multiplayer recebem o mesmo interior. */
const WT=6, IWT=4, GAPW=26;
/* [comprimento, espessura, modo, guarda loot]; modo: along = lado comprido junto da parede, perp = lado comprido para dentro, free = no meio do cômodo */
const FURN={
  couch:[26,11,'along',0], tv:[14,8,'along',0], table:[20,13,'along',1], bed:[27,15,'perp',0], bed2:[27,28,'perp',0], wardrobe:[18,9,'along',1],
  nightstand:[9,9,'along',1], shelf:[24,8,'along',1], counter:[28,9,'along',1], fridge:[11,11,'along',1], stove:[11,11,'along',0], ksink:[26,10,'along',1],
  desk:[22,12,'along',1], locker:[16,8,'along',1], crate:[11,11,'along',1], barrel:[9,9,'along',0], bench:[24,8,'along',0],
  medbed:[26,14,'perp',0], medcab:[16,8,'along',1], bunk:[26,13,'perp',0], rack:[26,8,'along',1], workbench:[28,12,'along',1],
  hay:[14,12,'along',0], plant:[8,8,'along',0], toilet:[9,11,'along',0], sink:[12,9,'along',1], tub:[30,14,'along',0], bookcase:[24,8,'along',1], dresser:[20,9,'along',1], lamp:[6,6,'along',0], pallet:[22,22,'free',1], aisle:[26,8,'free',1], meet:[44,16,'free',1]
};
const ROOMFURN={
  living:[['couch',1,1],['tv',1,1],['table',0,1],['bookcase',0,1],['shelf',0,1],['lamp',0,2],['plant',0,1]],
  bedroom:[['bed',1,1],['wardrobe',1,1],['nightstand',1,2],['dresser',0,1],['lamp',0,1],['plant',0,1]],
  bathroom:[['toilet',1,1],['sink',1,1],['tub',0,1]],
  kitchen:[['counter',1,3],['fridge',1,1],['stove',1,1],['table',1,1],['shelf',0,1]],
  storage:[['crate',2,4],['shelf',1,2],['barrel',0,2]],
  shop:[['shelf',2,4],['counter',1,1],['fridge',0,1],['aisle',1,2]],
  office:[['desk',2,4],['shelf',0,1],['locker',0,1],['plant',0,1]],
  meeting:[['meet',1,1],['shelf',0,1],['plant',0,1]],
  waiting:[['bench',2,4],['plant',1,2],['table',0,1]],
  exam:[['medbed',1,2],['medcab',1,2]],
  workshop:[['workbench',1,2],['shelf',1,2],['barrel',1,2],['crate',1,2]],
  hall:[['pallet',3,6],['aisle',1,3],['crate',1,3]],
  barracks:[['bunk',2,4],['locker',2,3]],
  armory:[['rack',2,3],['crate',1,2],['locker',0,1]],
  stall:[['hay',3,5],['crate',1,2],['barrel',0,1]]
};
const BLD_ROOMS={
  house:['living','kitchen','bedroom','bedroom','bathroom','storage','bedroom'], cabin:['living','bedroom','kitchen','bathroom','storage','bedroom'],
  apartment:['living','kitchen','bedroom','bedroom','bathroom','storage','bedroom'], shop:['shop','storage','shop','bathroom','storage'],
  gas:['shop','storage','bathroom','storage'], garage:['workshop','storage','workshop','storage'],
  clinic:['waiting','exam','exam','bathroom','storage','exam','exam'], office:['office','meeting','office','office','bathroom','storage','office'],
  warehouse:['hall','storage','hall','office','storage','bathroom','hall','storage'], mil:['barracks','armory','barracks','storage','armory','bathroom','storage','barracks'],
  barn:['stall','storage','stall','storage']
};
const ROOM_FLOOR={living:'wood',bedroom:'wood',kitchen:'tile',storage:'conc',shop:'tile',office:'carpet',meeting:'carpet2',waiting:'tile',exam:'tile2',bathroom:'tile2',workshop:'conc',hall:'conc',barracks:'conc',armory:'conc2',stall:'straw'};
function rectsHit(a,b,m){return a.x<b.x+b.w+m&&a.x+a.w+m>b.x&&a.y<b.y+b.h+m&&a.y+a.h+m>b.y;}
/* a ligação porta -> passagens continua livre? (grade de 4px; cada peça "engorda" 5px por causa do corpo do jogador) */
function intConnected(b,keys){
  const gs=4,nx=Math.ceil(b.w/gs),ny=Math.ceil(b.h/gs),bl=new Uint8Array(nx*ny);
  const mark=(r,pad)=>{
    const x0=Math.max(0,Math.floor((r.x-pad-b.x)/gs)),x1=Math.min(nx-1,Math.floor((r.x+r.w+pad-b.x)/gs));
    const y0=Math.max(0,Math.floor((r.y-pad-b.y)/gs)),y1=Math.min(ny-1,Math.floor((r.y+r.h+pad-b.y)/gs));
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      const px=b.x+cx*gs+gs/2,py=b.y+cy*gs+gs/2;
      if(px>=r.x-pad&&px<=r.x+r.w+pad&&py>=r.y-pad&&py<=r.y+r.h+pad)bl[cy*nx+cx]=1;
    }
  };
  for(const w of b.walls)mark(w,5);
  for(const f of b.furn)mark(f,5);
  const cell=p=>{const cx=Math.floor((p.x-b.x)/gs),cy=Math.floor((p.y-b.y)/gs);return (cx<0||cy<0||cx>=nx||cy>=ny)?-1:cy*nx+cx;};
  const ids=keys.map(cell);
  for(const id of ids)if(id<0||bl[id])return false;
  const seen=new Uint8Array(nx*ny),st=[ids[0]];seen[ids[0]]=1;
  while(st.length){
    const c=st.pop(),cx=c%nx,cy=(c/nx)|0;
    if(cx>0&&!bl[c-1]&&!seen[c-1]){seen[c-1]=1;st.push(c-1);}
    if(cx<nx-1&&!bl[c+1]&&!seen[c+1]){seen[c+1]=1;st.push(c+1);}
    if(cy>0&&!bl[c-nx]&&!seen[c-nx]){seen[c-nx]=1;st.push(c-nx);}
    if(cy<ny-1&&!bl[c+nx]&&!seen[c+nx]){seen[c+nx]=1;st.push(c+nx);}
  }
  for(const id of ids)if(!seen[id])return false;
  return true;
}
/* quantas células livres do piso NÃO dá pra alcançar a partir da porta (bolsões atrás de móveis) */
function intUnreached(b,st0){
  const gs=3,nx=Math.ceil(b.w/gs),ny=Math.ceil(b.h/gs);
  const mark=(arr,r,pad)=>{
    const x0=Math.max(0,Math.floor((r.x-pad-b.x)/gs)),x1=Math.min(nx-1,Math.floor((r.x+r.w+pad-b.x)/gs));
    const y0=Math.max(0,Math.floor((r.y-pad-b.y)/gs)),y1=Math.min(ny-1,Math.floor((r.y+r.h+pad-b.y)/gs));
    for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
      const px=b.x+cx*gs+gs/2,py=b.y+cy*gs+gs/2;
      const dx=Math.max(r.x-px,0,px-(r.x+r.w)),dy=Math.max(r.y-py,0,py-(r.y+r.h));
      if(dx*dx+dy*dy<pad*pad)arr[cy*nx+cx]=1;
    }
  };
  if(!b._ig){const g={bl:new Uint8Array(nx*ny),b5:new Uint8Array(nx*ny)};for(const w of b.walls){mark(g.bl,w,6.2);mark(g.b5,w,5);}b._ig=g;} // bl: por onde dá pra passar com folga; b5: onde o jogador cabe
  const bl=b._ig.bl.slice(),b5=b._ig.b5.slice();
  for(const f of b.furn){mark(bl,f,6.2);mark(b5,f,5);}
  const sx=Math.floor((st0.x-b.x)/gs),sy=Math.floor((st0.y-b.y)/gs);
  if(sx<0||sy<0||sx>=nx||sy>=ny||bl[sy*nx+sx])return 0;
  const seen=new Uint8Array(nx*ny),st=[sy*nx+sx];seen[st[0]]=1;
  while(st.length){
    const c=st.pop(),cx=c%nx,cy=(c/nx)|0;
    if(cx>0&&!bl[c-1]&&!seen[c-1]){seen[c-1]=1;st.push(c-1);}
    if(cx<nx-1&&!bl[c+1]&&!seen[c+1]){seen[c+1]=1;st.push(c+1);}
    if(cy>0&&!bl[c-nx]&&!seen[c-nx]){seen[c-nx]=1;st.push(c-nx);}
    if(cy<ny-1&&!bl[c+nx]&&!seen[c+nx]){seen[c+nx]=1;st.push(c+nx);}
  }
  // margem: células a até ~6px de um ponto alcançável (encostado no móvel) também contam como alcançáveis
  let fr=[];for(let i=0;i<nx*ny;i++)if(seen[i])fr.push(i);
  for(let d=0;d<3;d++){
    const nf=[];
    for(const c of fr){const cx=c%nx,cy=(c/nx)|0;
      if(cx>0&&!b5[c-1]&&!seen[c-1]){seen[c-1]=1;nf.push(c-1);}
      if(cx<nx-1&&!b5[c+1]&&!seen[c+1]){seen[c+1]=1;nf.push(c+1);}
      if(cy>0&&!b5[c-nx]&&!seen[c-nx]){seen[c-nx]=1;nf.push(c-nx);}
      if(cy<ny-1&&!b5[c+nx]&&!seen[c+nx]){seen[c+nx]=1;nf.push(c+nx);}}
    fr=nf;
  }
  let n=0;const lim=Math.floor(b.h/gs);
  for(let cy=0;cy<lim;cy++)for(let cx=0;cx<nx;cx++){const i=cy*nx+cx;if(!b5[i]&&!seen[i])n++;}
  return n;
}
/* ===== PORTAS =====
   Uma porta na entrada de cada prédio e uma em cada passagem entre cômodos. Nascem fechadas (nao mexem na geracao do mundo).
   open: 0 fechada, 1 aberta, 2 arrombada (nao fecha mais). O jogador abre ao encostar; os zumbis precisam arrombar. */
let DOORF=0,DOOR_DT=.016;
const DOOR_BREAK=[7,5,3.5,3,8,10,7,4.5,3,3.5];   // segundos para um zumbi sozinho arrombar: comum, rapido, brute, chefe, cuspidor, rastejante, gritador, inchado, berserker, yeti
function mkDoors(b){
  const bi=blds.length-1;
  b.doors=[{bi,di:0,r:{x:b.doorX,y:b.y+b.h-WT,w:b.door,h:WT},front:1,v:0,open:0,hp:1}];
  for(const g of b.gaps)b.doors.push({bi,di:b.doors.length,r:g.r,v:g.v?1:0,open:0,hp:1});
}
function doorSound(d,k){
  const x=d.r.x+d.r.w/2,y=d.r.y+d.r.h/2,dist=P?Math.hypot(P.x-x,P.y-y):0;if(dist>420)return;
  const v=.05*(1-dist/420);
  if(k==='open')beep(150,.14,'sawtooth',v,-70,'amb');else if(k==='close')beep(110,.08,'square',v*1.2,-30,'amb');
  else if(k==='hit')beep(85+Math.random()*25,.08,'square',v*1.6,-20,'amb');
  else if(k==='break'){beep(70,.25,'sawtooth',v*2,-40,'amb');beep(200,.1,'square',v*1.5,-90,'amb');}
}
function setDoor(d,st,remote){
  if(d.open===st)return;
  d.open=st;if(st===2)d.hp=0;
  doorSound(d,st===1?'open':st===2?'break':'close');
  if(st===2)for(let i=0;i<10;i++)parts.push({x:d.r.x+rnd(0,d.r.w),y:d.r.y+rnd(0,d.r.h),vx:rnd(-40,40),vy:rnd(-50,-10),t:.6,c:i%2?'#8a6a44':'#5e4426'});
  if(!remote&&MP.active)sendEvt('doorSet',{b:d.bi,i:d.di,s:st});
}
function zBreakDoor(z,d,dt){
  if(MP.active&&!MP.isHost)return;
  const T=DOOR_BREAK[z.kind]||7;
  d.hp-=dt/T;
  z._bang=(z._bang||0)-dt;
  if(z._bang<=0){z._bang=.5+Math.random()*.25;z.lunge=.12;doorSound(d,'hit');d.shake=.12;
    for(let i=0;i<2;i++)parts.push({x:d.r.x+rnd(0,d.r.w),y:d.r.y+rnd(0,d.r.h),vx:rnd(-20,20),vy:rnd(-30,-5),t:.35,c:'#8a6a44'});}
  if(d.hp<=0)setDoor(d,2);
}
function nearOpenDoor(){
  if(!P||P.inVehicle)return null;
  let best=null,bd=26;
  for(const b of blds){
    if(P.x<b.x-30||P.x>b.x+b.w+30||P.y<b.y-30||P.y>b.y+b.h+30||!b.doors)continue;
    for(const d of b.doors){
      if(d.open!==1)continue;
      const cx=clamp(P.x,d.r.x,d.r.x+d.r.w),cy=clamp(P.y,d.r.y,d.r.y+d.r.h),dd=Math.hypot(P.x-cx,P.y-cy);
      if(dd<bd&&dd>P.r+1.5){
        let blocked=false;for(const z of zombies)if(!z.dead&&Math.abs(z.x-cx)<z.r+d.r.w/2&&Math.abs(z.y-cy)<z.r+d.r.h/2+2){blocked=true;break;}
        if(!blocked){best=d;bd=dd;}
      }
    }
  }
  return best;
}
function drawDoors(b){
  if(!b.doors)return;
  for(const d of b.doors){
    const r=d.r,cx=r.x+r.w/2,cy=r.y+r.h/2;
    {const o=d.v?[IWT/2+3,0]:[0,IWT/2+3];if(!seeIn(b,cx-o[0],cy-o[1])&&!seeIn(b,cx+o[0],cy+o[1]))continue;}
    const sh=d.shake>0?Math.round((Math.random()-.5)*2):0;if(d.shake>0)d.shake-=.016;
    if(d.open===0){
      R(r.x+(d.v?0:sh),r.y+(d.v?sh:0),r.w,r.h,'#8a6a44');
      if(d.v){R(r.x+1,r.y,1,r.h,'#a88458');R(r.x+r.w-2,r.y,1,r.h,'#5e4426');R(r.x+r.w-2,r.y+r.h/2-1,1,2,'#c9a54a');}
      else{R(r.x,r.y+1,r.w,1,'#a88458');R(r.x,r.y+r.h-2,r.w,1,'#5e4426');R(r.x+r.w-4,r.y+r.h-2,2,1,'#c9a54a');}
      if(d.hp<.7){R(r.x+2,r.y+(d.v?4:1),d.v?1:5,d.v?5:1,'#3a2a1c');}
      if(d.hp<.35){R(r.x+(d.v?1:r.w-8),r.y+(d.v?r.h-9:2),d.v?1:6,d.v?6:1,'#2a1c10');}
    }else if(d.open===1){    // folha aberta, encostada na parede
      if(d.v){R(r.x,r.y-1,r.w,2,'#7a5e3a');R(r.x,r.y+r.h-1,r.w,2,'#7a5e3a');R(r.x+r.w,r.y,2,11,'#8a6a44');R(r.x+r.w,r.y,2,1,'#c9a54a');}
      else if(d.front){R(r.x,r.y-10,2,10,'#8a6a44');R(r.x,r.y-10,2,1,'#c9a54a');}
      else{R(r.x-1,r.y,2,r.h,'#7a5e3a');R(r.x+r.w-1,r.y,2,r.h,'#7a5e3a');R(r.x,r.y+r.h,11,2,'#8a6a44');R(r.x,r.y+r.h+1,1,1,'#c9a54a');}
    }else{    // arrombada: lascas no chao
      const hh=(d.bi*31+d.di*17)%7;
      R(r.x+1,r.y+(d.v?hh%4+2:1),d.v?3:5,2,'#6a4a2c');R(r.x+(d.v?0:r.w-6),r.y+r.h-(d.v?7:3),d.v?2:4,d.v?4:1,'#8a6a44');R(r.x+(r.w>>1),r.y+(r.h>>1),2,1,'#5e4426');
      if(d.v){R(r.x,r.y-1,r.w,1,'#7a5e3a');R(r.x,r.y+r.h,r.w,1,'#7a5e3a');}
    }
  }
}
function genInterior(b){
  const ix=b.x+WT,iy=b.y+WT,iw=b.w-2*WT,ih=b.h-2*WT,bottom=iy+ih;
  b.iw=[];b.gaps=[];b.furn=[];b.rooms=[];b.gadj=[];
  let rooms=[{x:ix,y:iy,w:iw,h:ih}];
  const area=iw*ih,cap=(b.type==='warehouse'||b.type==='mil')?8:7;let MINR=30;
  const MINROOMS={house:4,cabin:3,apartment:4,shop:3,clinic:4,office:4,garage:2,gas:2,warehouse:3,mil:4,barn:3};
  let target=Math.min(cap,Math.max(MINROOMS[b.type]||3,Math.round(area/2700)));
  const doorL=b.doorX-12,doorR=b.doorX+b.door+12;
  function trySplit(r,vert){
    for(let k=0;k<6;k++){
      let W,gapR,c1,c2,node;
      if(vert){
        if(r.w<2*MINR+IWT)return false;
        let px=Math.round(r.x+r.w*rnd(.36,.64));
        if(r.y+r.h>=bottom-1&&px+IWT/2>doorL&&px-IWT/2<doorR)px=(px<(doorL+doorR)/2)?Math.round(doorL-IWT/2):Math.round(doorR+IWT/2);
        px=clamp(px,r.x+MINR+IWT/2,r.x+r.w-MINR-IWT/2);
        if(r.y+r.h>=bottom-1&&px+IWT/2>doorL&&px-IWT/2<doorR)return false;
        const wx=Math.round(px-IWT/2),lo=r.y+10,hi=r.y+r.h-10-GAPW;
        const g0=Math.round(hi<lo?r.y+(r.h-GAPW)/2:lo+_rng()*(hi-lo));
        W={x:wx,y:r.y,w:IWT,h:r.h};gapR={x:wx,y:g0,w:IWT,h:GAPW};
        c1={x:r.x,y:r.y,w:wx-r.x,h:r.h};c2={x:wx+IWT,y:r.y,w:r.x+r.w-(wx+IWT),h:r.h};
        node={x:wx+IWT/2,y:g0+GAPW/2};
      }else{
        if(r.h<2*MINR+IWT)return false;
        const py=Math.round(r.y+r.h*rnd(.36,.64)),wy=Math.round(py-IWT/2);
        const lo=r.x+10,hi=r.x+r.w-10-GAPW;
        const g0=Math.round(hi<lo?r.x+(r.w-GAPW)/2:lo+_rng()*(hi-lo));
        if(wy-r.y<MINR||r.y+r.h-(wy+IWT)<MINR)return false;
        W={x:r.x,y:wy,w:r.w,h:IWT};gapR={x:g0,y:wy,w:GAPW,h:IWT};
        c1={x:r.x,y:r.y,w:r.w,h:wy-r.y};c2={x:r.x,y:wy+IWT,w:r.w,h:r.y+r.h-(wy+IWT)};
        node={x:g0+GAPW/2,y:wy+IWT/2};
      }
      // não pode tapar uma passagem que já existe (nem encostar na porta da frente)
      let bad=false;for(const g of b.gaps)if(rectsHit(W,g.r,3)){bad=true;break;}
      if(bad)continue;
      const pieces=[];
      if(vert){if(gapR.y-W.y>0)pieces.push({x:W.x,y:W.y,w:IWT,h:gapR.y-W.y});const e=gapR.y+GAPW;if(W.y+W.h-e>0)pieces.push({x:W.x,y:e,w:IWT,h:W.y+W.h-e});}
      else{if(gapR.x-W.x>0)pieces.push({x:W.x,y:W.y,w:gapR.x-W.x,h:IWT});const e=gapR.x+GAPW;if(W.x+W.w-e>0)pieces.push({x:e,y:W.y,w:W.x+W.w-e,h:IWT});}
      for(const q of pieces){b.iw.push(q);b.walls.push(q);walls.push(q);}
      b.gaps.push({x:node.x,y:node.y,r:gapR,v:vert});
      rooms.splice(rooms.indexOf(r),1,c1,c2);
      return true;
    }
    return false;
  }
  for(let g=0;g<60&&rooms.length<target;g++){
    rooms.sort((a,c)=>c.w*c.h-a.w*a.h);
    let done=false;
    for(let i=0;i<rooms.length&&!done;i++){
      const r=rooms[i];
      const pv=r.w/r.h>1.15?true:(r.h/r.w>1.15?false:_rng()<.5);
      done=trySplit(r,pv)||trySplit(r,!pv);
    }
    if(!done){if(MINR>24){MINR-=3;continue;}break;}
  }
  // grafo das passagens (para os zumbis acharem o caminho entre cômodos)
  const G=b.gaps;
  for(let i=0;i<G.length;i++){b.gadj[i]=[];}
  for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++){
    if(!intBlocked(b,G[i].x,G[i].y,G[j].x,G[j].y)){const d=Math.hypot(G[i].x-G[j].x,G[i].y-G[j].y);b.gadj[i].push([j,d]);b.gadj[j].push([i,d]);}
  }
  // tipo de cada cômodo: o da frente (onde fica a porta) é sempre o maior da lista; os outros seguem por tamanho
  rooms.sort((a,c)=>c.w*c.h-a.w*a.h);
  {const fi=rooms.findIndex(r=>b.doorX+b.door/2>=r.x&&b.doorX+b.door/2<=r.x+r.w&&bottom-8>=r.y&&bottom-8<=r.y+r.h);if(fi>0)rooms.unshift(rooms.splice(fi,1)[0]);}
  const kinds=BLD_ROOMS[b.type]||BLD_ROOMS.house;
  rooms.forEach((r,i)=>{r.k=kinds[i%kinds.length];r.fl=ROOM_FLOOR[r.k]||'wood';r.sd=Math.floor(_rng()*997);});
  b.rooms=rooms;
  // móveis
  const doorZone={x:b.doorX-4,y:bottom-30,w:b.door+8,h:32};
  const zones=[doorZone];for(const g of G)zones.push({x:g.r.x-(g.v?14:0),y:g.r.y-(g.v?0:14),w:g.r.w+(g.v?28:0),h:g.r.h+(g.v?0:28)});
  const keys=[{x:b.doorX+b.door/2,y:bottom-8}];for(const g of G)keys.push({x:g.x,y:g.y});
  const baseUn=intUnreached(b,keys[0]); // bolsões que já vêm das paredes; móveis não podem criar novos
  for(const r of rooms){
    const list=ROOMFURN[r.k]||[];
    for(const e of list){
      const cnt=rint(e[1],e[2]);
      for(let n=0;n<cnt;n++){
        const dbl=e[0]==='bed'&&_rng()<.3;   // algumas camas são de casal
        for(let t=0;t<14;t++){
          const kk=(dbl&&t<8)?'bed2':e[0],d=FURN[kk];
          let w,h,x,y,s;
          if(d[2]==='free'){
            w=d[0];h=d[1];if(_rng()<.5){const q=w;w=h;h=q;}
            if(r.w<w+20||r.h<h+20)continue;
            x=Math.round(rnd(r.x+10,r.x+r.w-10-w));y=Math.round(rnd(r.y+10,r.y+r.h-10-h));s='t';
          }else{
            s=pick(['t','b','l','r']);
            const horiz=(s==='t'||s==='b');
            if(d[2]==='along'){w=horiz?d[0]:d[1];h=horiz?d[1]:d[0];}else{w=horiz?d[1]:d[0];h=horiz?d[0]:d[1];}
            if(w>r.w-2||h>r.h-2)continue;
            if(horiz){x=Math.round(rnd(r.x+1,r.x+r.w-1-w));y=s==='t'?r.y:r.y+r.h-h;}
            else{y=Math.round(rnd(r.y+1,r.y+r.h-1-h));x=s==='l'?r.x:r.x+r.w-w;}
          }
          const f={x,y,w,h,k:kk,s,loot:!!d[3],sd:Math.floor(_rng()*997),room:r};
          let bad=false;
          for(const z of zones)if(rectsHit(f,z,0)){bad=true;break;}
          if(!bad)for(const o of b.furn)if(rectsHit(f,o,2)){bad=true;break;}
          if(bad)continue;
          b.furn.push(f);
          if(!intConnected(b,keys)||intUnreached(b,keys[0])>baseUn){b.furn.pop();continue;}
          break;
        }
      }
    }
  }
  /* Segunda passada, so com gerador proprio (nao consome o _rng, entao o resto do mundo nao muda): completa o que faz sentido em cada lugar.
     cozinha sempre com pia e fogao; casas com armario de remedios no banheiro; clinica com farmacia e mais armarios medicos; loja com geladeira de bebidas */
  {
    const lr=mkRng(((Math.round(b.x)*131+Math.round(b.y)*71+(b.w|0)*7)%99991)/99991);
    const addF=(r,kk)=>{
      const d=FURN[kk];
      for(let t=0;t<18;t++){
        const s=['t','b','l','r'][Math.floor(lr()*4)],horiz=(s==='t'||s==='b');
        const w=horiz?d[0]:d[1],h=horiz?d[1]:d[0];
        if(w>r.w-2||h>r.h-2)continue;
        let x,y;
        if(horiz){x=Math.round(r.x+1+lr()*(r.w-2-w));y=s==='t'?r.y:r.y+r.h-h;}
        else{y=Math.round(r.y+1+lr()*(r.h-2-h));x=s==='l'?r.x:r.x+r.w-w;}
        const f={x,y,w,h,k:kk,s,loot:!!d[3],sd:Math.floor(lr()*997),room:r};
        let bad=false;
        for(const z of zones)if(rectsHit(f,z,0)){bad=true;break;}
        if(!bad)for(const o of b.furn)if(rectsHit(f,o,2)){bad=true;break;}
        if(bad)continue;
        b.furn.push(f);
        if(!intConnected(b,keys)||intUnreached(b,keys[0])>baseUn){b.furn.pop();continue;}
        return f;
      }
      return null;
    };
    const cnt=(r,k)=>b.furn.filter(f=>f.room===r&&f.k===k).length;
    for(const r of rooms){
      if(r.k==='kitchen'){
        const fr=b.furn.filter(f=>f.room===r&&f.k==='counter');
        if(!cnt(r,'ksink')){const f=fr.shift();if(f)f.k='ksink';else addF(r,'ksink');}     // uma das bancadas vira a pia
        if(!cnt(r,'stove')){
          const f=fr.shift();
          if(f){const o=FURN.stove;f.k='stove';f.loot=false;if(f.s==='b')f.y=f.y+f.h-o[1];if(f.s==='r')f.x=f.x+f.w-o[0];f.w=o[0];f.h=o[1];}   // ou vira o fogao (menor que a bancada: so libera espaco)
          else addF(r,'stove');
        }
        if(!cnt(r,'fridge'))addF(r,'fridge');
      }
      else if(b.type==='clinic'){
        if(r.k==='exam'){while(cnt(r,'medcab')<2&&addF(r,'medcab')){}}
        else if(r.k==='waiting'){if(lr()<.6)addF(r,'medcab');}
        else if(r.k==='storage'){addF(r,'medcab');addF(r,'medcab');addF(r,'shelf');r.k='pharmacy';r.fl='tile2';}
        else if(r.k==='bathroom'&&!cnt(r,'medcab'))addF(r,'medcab');
      }
      else if(r.k==='bathroom'&&(b.type==='house'||b.type==='cabin'||b.type==='apartment')){if(!cnt(r,'medcab')&&lr()<.55)addF(r,'medcab');}
      else if(r.k==='shop'&&(b.type==='shop'||b.type==='gas')){if(!b.furn.some(f=>f.k==='fridge')&&lr()<.85)addF(r,'fridge');}
      else if(b.type==='mil'&&r.k==='storage'){if(lr()<.75)addF(r,'medcab');}
    }
  }
}
function intBlocked(b,x1,y1,x2,y2){const a=b.iw;for(let i=0;i<a.length;i++)if(segRectHit(x1,y1,x2,y2,a[i]))return true;return false;}
/* próximo ponto por onde o zumbi deve andar para ir de (fx,fy) a (tx,ty) dentro do prédio; null = pode ir reto */
function intRoute(b,fx,fy,tx,ty){
  const G=b.gaps;
  if(!G||!G.length||!intBlocked(b,fx,fy,tx,ty))return null;
  const n=G.length,dist=new Array(n).fill(1e9),prev=new Array(n).fill(-2),done=new Array(n).fill(false);
  for(let i=0;i<n;i++)if(!intBlocked(b,fx,fy,G[i].x,G[i].y)){dist[i]=Math.hypot(G[i].x-fx,G[i].y-fy);prev[i]=-1;}
  for(let it=0;it<n;it++){
    let u=-1,bu=1e9;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<bu){bu=dist[i];u=i;}
    if(u<0)break;done[u]=true;
    for(const e of b.gadj[u]){const nd=dist[u]+e[1];if(nd<dist[e[0]]){dist[e[0]]=nd;prev[e[0]]=u;}}
  }
  let best=-1,bs=1e9;
  for(let i=0;i<n;i++)if(dist[i]<1e9&&!intBlocked(b,G[i].x,G[i].y,tx,ty)){const s=dist[i]+Math.hypot(G[i].x-tx,G[i].y-ty);if(s<bs){bs=s;best=i;}}
  if(best<0)return null;
  let c=best;while(prev[c]>=0)c=prev[c];
  return {x:G[c].x,y:G[c].y};
}
/* ponto livre dentro de um cômodo (para nascer zumbi) */
function bldSpawnPoint(b){
  if(!b.rooms||!b.rooms.length)return {x:rnd(b.x+12,b.x+b.w-12),y:rnd(b.y+16,b.y+b.h-20)};
  for(let k=0;k<12;k++){
    const r=pick(b.rooms),x=rnd(r.x+8,r.x+r.w-8),y=rnd(r.y+8,r.y+r.h-8);
    let bad=false;for(const f of b.furn)if(x>f.x-7&&x<f.x+f.w+7&&y>f.y-7&&y<f.y+f.h+7){bad=true;break;}
    if(!bad)return {x,y};
  }
  return null;
}
/* loot em cima dos móveis (geladeira = comida e água, armário médico = curativos) */
function inRoomRect(r,x,y,m){return x>=r.x-m&&x<=r.x+r.w+m&&y>=r.y-m&&y<=r.y+r.h+m;}
function roomSpawnPoint(b,r){
  for(let k=0;k<12;k++){
    const x=rnd(r.x+8,r.x+r.w-8),y=rnd(r.y+8,r.y+r.h-8);
    let bad=false;for(const f of b.furn)if(x>f.x-7&&x<f.x+f.w+7&&y>f.y-7&&y<f.y+f.h+7){bad=true;break;}
    if(!bad)return {x,y};
  }
  return {x:r.x+r.w/2,y:r.y+r.h/2};
}
/* o que cada movel guarda (chave "comodo:movel" vence a do movel puro); quem nao esta aqui usa a tabela geral do tipo de predio */
const FLOOT={
  fridge:{food:6,water:5,meat:1}, ksink:{water:6,food:1}, sink:{water:4,bandage:3},
  medcab:{bandage:6,medkit:4}, 'exam:medcab':{bandage:6,medkit:5}, 'pharmacy:medcab':{bandage:6,medkit:5}, 'pharmacy:shelf':{bandage:6,medkit:4,water:1},
  'waiting:table':{water:3,food:1,bandage:1.5}, 'exam:shelf':{bandage:5,medkit:3},
  'kitchen:counter':{food:6,water:3}, 'kitchen:shelf':{food:7,water:3}, 'kitchen:table':{food:4,water:3},
  nightstand:{bandage:2,water:3,food:2,ammo:1,pistol:.15}, wardrobe:{cloth:7,backpack:1,bat:.4,katana:.12}, dresser:{cloth:6,bandage:1},
  bookcase:{cloth:1,food:1,water:1,bandage:1}, 'living:table':{food:3,water:4}, 'living:shelf':{food:2,water:3,bandage:1},
  'storage:crate':{wood:4,stone:3,food:3,water:2,ammo:1.5,arrows:1}, 'storage:shelf':{food:5,water:5,bandage:1.5,medkit:.7,cloth:1},
  'shop:shelf':{food:7,water:6,bandage:2,medkit:.5}, 'shop:aisle':{food:7,water:6,bandage:2}, 'shop:counter':{ammo:2,bandage:2,food:2,water:2,bat:.5}, 'shop:fridge':{water:8,food:3},
  desk:{food:2,water:3,bandage:1.5,ammo:.7,cloth:1}, locker:{bandage:3,food:2,water:2,medkit:1,ammo:1.5,bat:1},
  'barracks:locker':{ammo:6,medkit:2.5,bandage:3.5,food:3,water:3,pistol:1},
  'armory:rack':{pistol:4,smg:3,shotgun:2.5,rifle:2,ammo:5}, 'armory:crate':{ammo:9,medkit:2,bandage:2,smg:.8,shotgun:.8}, 'armory:locker':{ammo:5,medkit:2,bandage:2,pistol:1.5},
  workbench:{axe:3,bat:2,stone:3,wood:3,ammo:1.5,arrows:1.5}, 'workshop:shelf':{wood:3,stone:3,ammo:1.5,bandage:1}, 'workshop:crate':{wood:3,stone:3,ammo:2,axe:1},
  pallet:{food:3,water:3,wood:2,stone:2,ammo:1.5,bandage:1,cloth:1.5}, 'hall:aisle':{food:4,water:4,wood:2,stone:1,ammo:1,cloth:1}, 'hall:crate':{food:3,water:2,wood:2,stone:2,ammo:1.5,axe:.7},
  'stall:crate':{food:3,water:2,wood:3,corn:3,arrows:1},
  table:{food:3,water:3}, shelf:{food:4,water:4,bandage:1.2,cloth:1}, counter:{food:4,water:3,ammo:1}, crate:{wood:3,stone:3,food:2,water:2,ammo:1.5}
};
function furnLootTable(f,b){
  let t=FLOOT[(f.room&&f.room.k)+':'+f.k]||FLOOT[f.k];
  if(!t)return null;
  if(mapHasLake()&&(f.k==='workbench'||(f.k==='crate'&&(b.type==='cabin'||b.type==='garage'))))t=Object.assign({fishingrod:1.3},t); // vara de pesca na oficina e no deposito
  return t;
}
function placeBldLoot(b,n,lootKey,room){
  // room (opcional): reposição de loot num cômodo só; os itens da casa levam a marca h para o jogo saber que eram loot de casa
  const spots=b.furn.filter(f=>f.loot&&(!room||inRoomRect(room,f.x+f.w/2,f.y+f.h/2,0)));
  for(let i=0;i<n;i++){
    let x,y,t=null,tbl=null;
    if(spots.length){
      const f=spots[Math.floor(_rng()*spots.length)];
      x=f.x+f.w/2+rnd(-3,3);y=f.y+f.h/2+rnd(-2,2);
      tbl=furnLootTable(f,b);
    }else{
      const p=room?roomSpawnPoint(b,room):(bldSpawnPoint(b)||{x:b.x+b.w/2,y:b.y+b.h/2});x=p.x;y=p.y;
    }
    items.push({t:wpick(tbl||lakeLoot(LOOT[lootKey]||LOOT.house)),x:Math.round(x),y:Math.round(y),h:true});
  }
}
/* clinica sempre tem remedio de verdade: itens extras nos armarios medicos (gerador proprio, nao mexe no _rng) */
function medicBonus(b){
  const lr=mkRng(((Math.round(b.x)*29+Math.round(b.y)*53+(b.h|0))%99991)/99991);
  const spots=b.furn.filter(f=>f.k==='medcab');
  if(!spots.length)return;
  const n=2+(b.rooms.length>=6?1:0)+(lr()<.5?1:0);
  for(let i=0;i<n;i++){
    const f=spots[Math.floor(lr()*spots.length)];
    items.push({t:lr()<.6?'bandage':'medkit',x:Math.round(f.x+f.w/2+(lr()*6-3)),y:Math.round(f.y+f.h/2+(lr()*4-2)),h:true});
  }
}

