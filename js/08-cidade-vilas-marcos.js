/* ====================== CIDADE (grade de ruas → quarteirões → prédios) ======================
   Ordem importa: as RUAS nascem primeiro e os prédios só ocupam o interior dos quarteirões,
   então nenhuma rua atravessa casa. Prédios ficam em fileiras com vão mínimo para passar a pé,
   e as portas (sempre no lado sul) abrem para um vão livre. */
function onCityRoad(x,y,m){
  for(const r of roads){ if(x>r.x-m&&x<r.x+r.w+m&&y>r.y-m&&y<r.y+r.h+m) return true; }
  return false;
}
/* tamanhos dos prédios (maiores, para caber cômodos e móveis) */
function bldDims(type){
  const d=bldDims0(type),K=1.3;
  return [Math.round(d[0]*K),Math.round(d[1]*K)];
}
function bldDims0(type){
  switch(type){
    case 'mil': return [rint(135,190),rint(100,140)];
    case 'warehouse': return [rint(140,220),rint(96,150)];
    case 'apartment': return [rint(90,140),rint(135,195)];
    case 'office': return [rint(120,190),rint(100,150)];
    case 'garage': return [rint(100,150),rint(70,96)];
    case 'clinic': return [rint(100,150),rint(82,118)];
    case 'gas': return [rint(92,130),rint(74,100)];
    case 'shop': return [rint(92,145),rint(76,112)];
    case 'barn': return [rint(120,170),rint(90,125)];
    case 'cabin': return [rint(84,115),rint(72,100)];
    default: return [rint(90,140),rint(76,118)]; // casa
  }
}
function bldSize(type){
  return bldDims(type);
}
function cityPickType(zone){
  const r=_rng();
  if(zone==='mil') return r<.7?'mil':'warehouse';
  if(zone==='com') return r<.26?'apartment':r<.48?'office':r<.72?'shop':r<.82?'clinic':r<.9?'gas':'house';
  if(zone==='ind') return r<.5?'warehouse':r<.8?'garage':r<.9?'gas':'house';
  return r<.7?'house':r<.82?'apartment':r<.93?'shop':'garage'; // residencial
}
function cityFillBlock(bx,by,bw,bh,zone){
  const S=14, GAP=40;               // calçada/recuo e vão mínimo entre prédios
  const x0=bx+S, y0=by+S, x1=bx+bw-S, y1=by+bh-S;
  let y=y0, rows=0;
  while(y<y1-52 && rows<4){
    rows++;
    const rowH=Math.min(rint(130,215), y1-y);
    if(rowH<76) break;
    let x=x0+rint(0,12);
    while(x<x1-50){
      const type=cityPickType(zone);
      let sz=bldSize(type), w=Math.min(sz[0],x1-x), h=Math.min(sz[1],rowH);
      if(w<48||h<44) break;
      if(_rng()<0.14){ x+=w+GAP; continue; }           // lote vazio
      addBuilding(Math.round(x), Math.round(y+(rowH-h)), w, h, type); // alinhado embaixo: porta dá para o vão
      x+=w+rint(GAP,GAP+22);
    }
    y+=rowH+rint(46,58);
  }
}
/* Entulho/cascalho: pedras em lotes vazios e pátios industriais (fonte de pedra da cidade, longe de portas e passagens) */
function cityRubble(b,n){
  const x0=b.bx+18,y0=b.by+18,x1=b.bx+b.bw-18,y1=b.by+b.bh-18;
  for(let i=0,g=0;i<n&&g<80;g++){
    const x=rnd(x0,x1), y=rnd(y0,y1);
    let bad=false;
    for(const q of blds) if(x>q.x-34&&x<q.x+q.w+34&&y>q.y-34&&y<q.y+q.h+34){bad=true;break;}
    if(bad) continue;
    if(rocks.some(r=>Math.hypot(r.x-x,r.y-y)<22)) continue;
    rocks.push({x:Math.round(x),y:Math.round(y),hp:5,k:rint(0,4),seed:_rng()}); i++;
  }
}
function cityPark(bx,by,bw,bh,keepX,keepY,keepR){
  const x0=bx+16,y0=by+16,x1=bx+bw-16,y1=by+bh-16, pts=[];
  const n=Math.round(bw*bh/7000);
  for(let i=0,g=0;i<n&&g<80;g++){
    const x=rnd(x0,x1), y=rnd(y0,y1);
    if(keepR&&Math.hypot(x-keepX,y-keepY)<keepR) continue;
    if(pts.some(p=>Math.hypot(p.x-x,p.y-y)<34)) continue;
    pts.push({x,y}); i++;
    trees.push({x:Math.round(x),y:Math.round(y),k:_rng()<.5?1:8,hp:4,seed:_rng()});
  }
  for(let i=0;i<3;i++){
    const x=rnd(x0+10,x1-10), y=rnd(y0+10,y1-10);
    if(keepR&&Math.hypot(x-keepX,y-keepY)<keepR) continue;
    if(pts.some(p=>Math.hypot(p.x-x,p.y-y)<24)) continue;
    decorations.push({x:Math.round(x),y:Math.round(y),type:'bench',solid:true,seed:_rng()});
  }
  for(let i=0,g=0;i<rint(2,3)&&g<30;g++){ // pedras só dentro de parques
    const x=rnd(x0+10,x1-10), y=rnd(y0+10,y1-10);
    if(keepR&&Math.hypot(x-keepX,y-keepY)<keepR) continue;
    if(pts.some(p=>Math.hypot(p.x-x,p.y-y)<30)) continue;
    rocks.push({x:Math.round(x),y:Math.round(y),hp:5,k:rint(0,4),seed:_rng()}); i++;
  }
}
function genCity(){
  const M=170, xs=[], ys=[];
  for(const arr of [xs,ys]){ let p=M+rint(0,30); while(p<WW-M){ arr.push(p); p+=rint(330,400); } }   // vãos maiores: os quarteirões mantêm o tamanho com as ruas mais largas
  const rw=i=>(i%3===1?92:68);                 // a cada 3 ruas, uma avenida mais larga
  const ya=ys[0]-80, yb=ys[ys.length-1]+80, xa=xs[0]-80, xb=xs[xs.length-1]+80;
  for(let i=0;i<xs.length;i++) roads.push({x:Math.round(xs[i]-rw(i)/2),y:ya,w:rw(i),h:yb-ya,vert:true,main:i%3===1});
  for(let j=0;j<ys.length;j++) roads.push({x:xa,y:Math.round(ys[j]-rw(j)/2),w:xb-xa,h:rw(j),vert:false,main:j%3===1});
  for(let i=0;i<xs.length;i++) for(let j=0;j<ys.length;j++)
    cityInter.push({x:Math.round(xs[i]-rw(i)/2),y:Math.round(ys[j]-rw(j)/2),w:rw(i),h:rw(j)});
  // quarteirões
  const blocks=[];
  for(let i=0;i<xs.length-1;i++) for(let j=0;j<ys.length-1;j++){
    const bx=Math.round(xs[i]+rw(i)/2), by=Math.round(ys[j]+rw(j)/2);
    const bw=Math.round(xs[i+1]-rw(i+1)/2)-bx, bh=Math.round(ys[j+1]-rw(j+1)/2)-by;
    blocks.push({i,j,bx,by,bw,bh,cx:bx+bw/2,cy:by+bh/2,zone:'res'});
  }
  const shuffle=a=>{for(let k=a.length-1;k>0;k--){const q=Math.floor(_rng()*(k+1));const t=a[k];a[k]=a[q];a[q]=t;}return a;};
  // quarteirão da queda do avião: praça aberta no interior da cidade
  const inner=blocks.filter(b=>b.i>=1&&b.j>=1&&b.i<=xs.length-3&&b.j<=ys.length-3);
  const crash=pick(inner.length?inner:blocks);
  crash.zone='crash'; cityCrash={x:crash.cx,y:crash.cy,bx:crash.bx,by:crash.by,bw:crash.bw,bh:crash.bh};
  // bases militares longe do ponto de partida
  const far=shuffle(blocks.filter(b=>b!==crash&&Math.hypot(b.cx-crash.cx,b.cy-crash.cy)>800));
  for(let k=0;k<Math.min(Math.round(3*WAREA*.6),far.length);k++) far[k].zone='mil';
  for(const b of blocks){
    if(b.zone!=='res') continue;
    const r=_rng(), d=Math.hypot(b.cx-WW/2,b.cy-WH/2)/(2400*WSC);
    if(r<.11) b.zone='park';
    else if(r<.16) b.zone='empty';
    else if(d<.38) b.zone='com';
    else if(d<.75){ const q=_rng(); b.zone=q<.4?'com':q<.8?'res':'ind'; }
    else b.zone=_rng()<.55?'res':'ind';
  }
  for(const b of blocks){
    if(b.zone==='crash') cityPark(b.bx,b.by,b.bw,b.bh,b.cx,b.cy,95);
    else if(b.zone==='park') cityPark(b.bx,b.by,b.bw,b.bh);
    else if(b.zone==='empty') cityRubble(b,rint(5,8));                       // lote vazio com entulho
    else { cityFillBlock(b.bx,b.by,b.bw,b.bh,b.zone); if(b.zone==='ind') cityRubble(b,rint(1,3)); } // pátio industrial
  }
  // bairros (usados para espalhar zumbis iniciais): longe do ponto de partida
  const cand=shuffle(blocks.filter(b=>b!==crash&&Math.hypot(b.cx-crash.cx,b.cy-crash.cy)>520&&b.zone!=='park'&&b.zone!=='empty'));
  for(let k=0;k<Math.min(Math.round(12*WAREA*.7),cand.length);k++) towns.push({x:cand[k].cx,y:cand[k].cy,mil:cand[k].zone==='mil'});
}
function cityFree(x,y,hw,hh){
  for(const b of blds) if(x+hw>b.x-6&&x-hw<b.x+b.w+6&&y+hh>b.y-6&&y-hh<b.y+b.h+6) return false;
  for(const v of vehicles) if(Math.abs(v.x-x)<hw+22&&Math.abs(v.y-y)<hh+22) return false;
  return !onCityRoad(x,y,Math.max(hw,hh));
}
function genCityVehicles(vId,carCols){
  const place=(x,y,face)=>{
    for(const v of vehicles) if(Math.abs(v.x-x)<95&&Math.abs(v.y-y)<95) return;     // espaçados: rua sempre passável
    for(const q of cityInter) if(x>q.x-36&&x<q.x+q.w+36&&y>q.y-36&&y<q.y+q.h+36) return; // nunca no cruzamento
    vehicles.push({id:vId++,x:Math.round(x),y:Math.round(y),w:36,h:20,col:pick(carCols),looted:false,spd:0,face:face,hp:VEH.car.hp,maxHp:VEH.car.hp});
  };
  for(const r of roads){
    const n=rint(3,5);
    for(let k=0;k<n;k++){
      if(!r.vert){ const south=_rng()<.5; place(r.x+120+_rng()*(r.w-240), r.y+r.h*(south?.75:.25), south?0:Math.PI); }
      else { const east=_rng()<.5; place(r.x+r.w*(east?.75:.25), r.y+120+_rng()*(r.h-240), east?-Math.PI/2:Math.PI/2); }
    }
  }
  // carros na frente de garagens e postos (ao lado da porta, sem bloqueá-la)
  for(const b of blds){
    if((b.type!=='garage'&&b.type!=='gas')||_rng()>.6) continue;
    const cx=b.doorX+b.door+26, cy=b.y+b.h+20;
    if(cx>b.x+b.w-6) continue;
    if(cityFree(cx,cy,18,10)) vehicles.push({id:vId++,x:cx,y:cy,w:36,h:20,col:pick(carCols),looted:false,spd:0,face:0,hp:VEH.car.hp,maxHp:VEH.car.hp});
  }
  return vId;
}
function cityLamps(){
  const inBand=(x,y)=>cityInter.some(q=>x>q.x-26&&x<q.x+q.w+26&&y>q.y-26&&y<q.y+q.h+26);
  for(const r of roads){
    let side=1;
    if(!r.vert){
      for(let x=r.x+110;x<r.x+r.w-80;x+=150){ side=-side; const y=side>0?r.y+r.h+4:r.y-4; if(!inBand(x,y)) decorations.push({x:x,y:y,type:'lamp',solid:true,seed:_rng()}); }
    } else {
      for(let y=r.y+110;y<r.y+r.h-80;y+=150){ side=-side; const x=side>0?r.x+r.w+4:r.x-4; if(!inBand(x,y)) decorations.push({x:x,y:y,type:'lamp',solid:true,seed:_rng()}); }
    }
  }
}

/* ====================== VILAS (Floresta / Deserto / Neve) ======================
   Cada vila é feita em fileiras de prédios com uma rua em frente às portas (que ficam no lado sul).
   As ruas nascem junto com a vila e as estradas entre vilas só são traçadas por trajetos que não tocam
   nenhum prédio — nada de estrada atravessando casa. */
function bldSizeRural(type){
  return bldDims(type);
}
function ruralPickType(mil){
  if(mil&&_rng()<0.55) return 'mil';
  const r=_rng();
  if(selectedMap==='desert') return r<.25?'barn':(r<.5?'shop':'house');
  return r<.3?'cabin':(r<.55?'shop':'house');
}
function genTown(cx,cy,mil){
  const RD=34, FRONT=26, BACK=30, GAP0=44, MAXW=920;
  const rows=mil?2:rint(1,3), data=[];
  for(let r=0;r<rows;r++){
    const list=[]; let x=0,hmax=0;
    const target=mil?rint(2,3):rint(2,4);
    for(let k=0;k<target*3&&list.length<target;k++){
      const type=ruralPickType(mil), sz=bldSizeRural(type);
      if(x+sz[0]>MAXW) break;
      if(list.length>0&&_rng()<.12){ x+=Math.round(sz[0]*.5)+GAP0; continue; }   // lote vazio
      list.push({type:type,w:sz[0],h:sz[1],x:x});
      x+=sz[0]+rint(GAP0,GAP0+36);
      if(sz[1]>hmax) hmax=sz[1];
    }
    if(!list.length){ const type=ruralPickType(mil), sz=bldSizeRural(type); list.push({type:type,w:sz[0],h:sz[1],x:0}); hmax=sz[1]; }
    const last=list[list.length-1];
    data.push({list:list,W:last.x+last.w,hmax:hmax});
  }
  let W=0,H=0;
  for(const d of data){ if(d.W>W) W=d.W; H+=d.hmax+FRONT+RD+BACK; }
  H-=BACK;
  const ox=Math.round(cx-W/2), oy=Math.round(cy-H/2);
  if(ox-60<40||oy-20<40||ox+W+60>WW-40||oy+H+20>WH-40) return null;
  let y=oy; const hubs=[];
  for(const d of data){
    const off=Math.round((rint(0,1)?0:(W-d.W)/2));
    for(const b of d.list) addBuilding(ox+off+Math.round(b.x), y+d.hmax-b.h, b.w, b.h, b.type); // alinhado embaixo: porta dá para o vão e a rua
    const roadY=y+d.hmax+FRONT;
    roads.push({x:ox-47,y:roadY,w:W+47+44,h:RD,vert:false});
    hubs.push(roadY+RD/2);
    y=roadY+RD+BACK;
  }
  roads.push({x:ox-47,y:Math.round(hubs[0]-RD/2),w:RD,h:Math.round(hubs[hubs.length-1]-hubs[0]+RD),vert:true});
  return {x:cx,y:cy,mil:mil,hubx:ox-30,huby:Math.round(hubs[0])};
}
function genRural(){
  const count=Math.max(selectedMap==='desert'?4:6,Math.round((selectedMap==='desert'?4:6)*WAREA*.8*FL.towns));
  const spots=[]; let tries=0;
  while(spots.length<count&&tries<2500*WAREA){
    tries++;
    const x=rnd(450,WW-450), y=rnd(450,WH-450);
    if(spots.every(t=>Math.hypot(t.x-x,t.y-y)>800)) spots.push({x:x,y:y});
  }
  // bases militares: as duas últimas vilas (quando há 3 ou mais)
  const nMil=Math.max(2,Math.round(spots.length*(selectedMap==='desert'?.45:.33)));
  spots.forEach((p,i)=>{ p.mil=spots.length>=3&&i>=spots.length-nMil; });
  for(const p of spots){
    let t=null;
    for(let a=0;a<12&&!t;a++){
      // se a vila não couber no mapa naquele ponto, desloca para dentro e tenta de novo
      t=genTown(clamp(p.x+(a?rnd(-90,90):0),380,WW-380), clamp(p.y+(a?rnd(-90,90):0),380,WH-380), p.mil);
    }
    if(t) towns.push(t);
  }
  // estradas entre vilas: só trajetos livres de prédios
  const HW=28, MARG=24;
  const hit=r=>blds.some(b=>r.x<b.x+b.w+MARG&&r.x+r.w>b.x-MARG&&r.y<b.y+b.h+MARG&&r.y+r.h>b.y-MARG);
  const H=(x1,x2,y)=>({x:Math.round(Math.min(x1,x2)-HW/2),y:Math.round(y-HW/2),w:Math.round(Math.abs(x2-x1)+HW),h:HW,vert:false});
  const V=(x,y1,y2)=>({x:Math.round(x-HW/2),y:Math.round(Math.min(y1,y2)-HW/2),w:HW,h:Math.round(Math.abs(y2-y1)+HW),vert:true});
  const routes=(A,B)=>{
    const out=[
      [H(A.hubx,B.hubx,A.huby),V(B.hubx,A.huby,B.huby)],
      [V(A.hubx,A.huby,B.huby),H(A.hubx,B.hubx,B.huby)]
    ];
    for(const f of [.5,.3,.7,.15,.85]){      // H-V-H
      const mx=A.hubx+(B.hubx-A.hubx)*f;
      out.push([H(A.hubx,mx,A.huby),V(mx,A.huby,B.huby),H(mx,B.hubx,B.huby)]);
    }
    const mid=(A.huby+B.huby)/2, lo=Math.min(A.huby,B.huby), hi=Math.max(A.huby,B.huby);
    for(const my of [mid,mid-120,mid+120,mid-250,mid+250,lo-130,hi+130]){   // V-H-V
      if(my<80||my>WH-80) continue;
      out.push([V(A.hubx,A.huby,my),H(A.hubx,B.hubx,my),V(B.hubx,my,B.huby)]);
    }
    return out;
  };
  const tryLink=(A,B)=>{
    const ok=routes(A,B).find(o=>!o.some(hit));
    if(ok){ for(const r of ok) roads.push(r); return true; }
    return false;
  };
  // 1) cada vila liga à mais próxima já ligada; se não houver trajeto livre, tenta as outras por distância
  for(let i=1;i<towns.length;i++){
    const A=towns[i];
    const order=towns.slice(0,i).sort((p,q)=>Math.hypot(p.hubx-A.hubx,p.huby-A.huby)-Math.hypot(q.hubx-A.hubx,q.huby-A.huby));
    for(const B of order) if(tryLink(A,B)) break;
  }
  // 2) garante rede única: vilas isoladas tentam ligar com qualquer vila do grupo principal
  const touch=(p,q)=>p.x<=q.x+q.w&&p.x+p.w>=q.x&&p.y<=q.y+q.h&&p.y+p.h>=q.y;
  for(let pass=0;pass<3;pass++){
    const comp=roads.map((_,i)=>i), find=i=>comp[i]===i?i:(comp[i]=find(comp[i]));
    for(let i=0;i<roads.length;i++) for(let j=i+1;j<roads.length;j++) if(touch(roads[i],roads[j])) comp[find(i)]=find(j);
    const grp=t=>find(roads.findIndex(r=>t.hubx>=r.x&&t.hubx<=r.x+r.w&&t.huby>=r.y&&t.huby<=r.y+r.h));
    const g0=grp(towns[0]);
    let linked=false;
    for(const A of towns){
      if(grp(A)===g0) continue;
      const order=towns.filter(B=>grp(B)===g0).sort((p,q)=>Math.hypot(p.hubx-A.hubx,p.huby-A.huby)-Math.hypot(q.hubx-A.hubx,q.huby-A.huby));
      for(const B of order) if(tryLink(A,B)){linked=true;break;}
    }
    if(!linked) break;
  }
}
function ruralCarFree(x,y){
  for(const b of blds) if(x+18>b.x-4&&x-18<b.x+b.w+4&&y+10>b.y-4&&y-10<b.y+b.h+4) return false;
  for(const r of roads) if(x+18>r.x&&x-18<r.x+r.w&&y+10>r.y&&y-10<r.y+r.h) return false;
  for(const v of vehicles) if(Math.abs(v.x-x)<44&&Math.abs(v.y-y)<26) return false;
  return true;
}
function vehKind(v){return selectedMap==='snow'?'sled':selectedMap==='desert'?'buggy':selectedMap==='forest'?'atv':'car';}
const SLED_COLS=['#c03030','#2a6ab0','#e0a020','#2a8a50'],BUGGY_COLS=['#d08a30','#b04a2a','#d8c898','#4a8a8a'],ATV_COLS=['#3a6a2a','#b0452a','#c8a040','#4a5a3a'];
function genRuralVehicles(vId,carCols){
  const add=(x,y,face)=>{
    if(selectedMap==='snow'){vehicles.push({id:vId++,x:Math.round(x),y:Math.round(y),w:28,h:14,col:pick(SLED_COLS),looted:false,spd:0,face:face,hp:VEH.sled.hp,maxHp:VEH.sled.hp});return;}
    if(selectedMap==='forest'){vehicles.push({id:vId++,x:Math.round(x),y:Math.round(y),w:28,h:18,col:pick(ATV_COLS),looted:false,spd:0,face:face,hp:VEH.atv.hp,maxHp:VEH.atv.hp});return;}
    if(selectedMap==='desert'){vehicles.push({id:vId++,x:Math.round(x),y:Math.round(y),w:34,h:22,col:pick(BUGGY_COLS),looted:false,spd:0,face:face,hp:VEH.buggy.hp,maxHp:VEH.buggy.hp});return;}
    vehicles.push({id:vId++,x:Math.round(x),y:Math.round(y),w:36,h:20,col:pick(carCols),looted:false,spd:0,face:face,hp:VEH.car.hp,maxHp:VEH.car.hp});};
  // nas ruas e estradas (faixa da direita), bem espaçados
  for(const r of roads){
    const len=r.vert?r.h:r.w;
    if(len<160) continue;
    const n=Math.max(1,Math.floor(len/520));
    for(let k=0;k<n;k++){
      if(_rng()>.7) continue;
      let x,y,face;
      if(!r.vert){ const south=_rng()<.5; x=r.x+70+_rng()*(len-140); y=r.y+r.h*(south?.72:.28); face=south?0:Math.PI; }
      else{ const east=_rng()<.5; y=r.y+70+_rng()*(len-140); x=r.x+r.w*(east?.72:.28); face=east?-Math.PI/2:Math.PI/2; }
      let clear=true;
      for(const v of vehicles) if(Math.abs(v.x-x)<130&&Math.abs(v.y-y)<130){clear=false;break;}
      if(clear) add(x,y,face);
    }
  }
  // estacionados ao lado da porta (sem bloquear a entrada)
  for(const b of blds){
    if(b.type==='mil'||_rng()>.22) continue;
    const cx=b.doorX+b.door+26, cy=b.y+b.h+14;
    if(cx+18>b.x+b.w) continue;
    if(ruralCarFree(cx,cy)) add(cx,cy,0);
  }
  return vId;
}
/* ============ MARCOS: Templo Enterrado (deserto) e Acampamento da Expedição (neve) ============ */
let LM=null,chestList=[],prints=[];
function genLandmark(seed){
  LM=null;chestList=[];
  if(selectedMap!=='desert'&&selectedMap!=='snow')return;
  const isD=selectedMap==='desert';
  const rr=mkRr(((seed|0)*40503+(isD?7:13))^0x9E3779B9);
  const F=findSpot(rr,isD?[[190,150],[160,128]]:[[160,124],[140,110]]);
  if(!F)return;
  F.cx=Math.round(F.x+F.w/2);F.cy=Math.round(F.y+F.h/2);F.kind=isD?'temple':'camp';F.seen=false;
  const m=14,inR=o=>o.x>F.x-m&&o.x<F.x+F.w+m&&o.y>F.y-m&&o.y<F.y+F.h+m;
  trees=trees.filter(o=>!inR(o));rocks=rocks.filter(o=>!inR(o));decorations=decorations.filter(o=>!inR(o));
  items=items.filter(o=>!inR(o));animals=animals.filter(o=>!inR(o));
  const add=(type,x,y,solid,extra)=>{const d=Object.assign({x:Math.round(x),y:Math.round(y),type:type,solid:!!solid,seed:rr()},extra||{});decorations.push(d);return d;};
  const ch=(x,y,kind,main)=>{const d=add('chest',x,y,true,{kind:kind,main:!!main,open:false});chestList.push(d);};
  const {cx,cy}=F;
  if(isD){
    // muralha em ruínas com quatro entradas
    for(let x=F.x+6;x<=F.x+F.w-6;x+=11){
      for(const ey of [F.y+4,F.y+F.h-2]){ if(Math.abs(x-cx)<22)continue; if(rr()<.3)continue; add('ruinwall',x,ey,true); }
    }
    for(let y=F.y+14;y<=F.y+F.h-12;y+=11){
      for(const ex of [F.x+4,F.x+F.w-4]){ if(Math.abs(y-cy)<22)continue; if(rr()<.3)continue; add('ruinwall',ex,y,true); }
    }
    for(const [px,py] of [[F.x+8,F.y+8],[F.x+F.w-8,F.y+8],[F.x+8,F.y+F.h-4],[F.x+F.w-8,F.y+F.h-4]])add('pillar',px,py,true);
    for(const [px,py] of [[cx-44,cy-24],[cx+44,cy-24],[cx-44,cy+30],[cx+44,cy+30]])add('pillar',px,py,true);
    for(const sx of [-30,30]){add('statue',cx+sx,F.y+F.h-12,true);add('statue',cx+sx,F.y+16,true);}
    ch(cx,cy-10,'gold',true);ch(cx-70,cy+22,'sand',false);ch(cx+70,cy+22,'sand',false);
  }else{
    campfires.push({x:cx,y:cy,t:0,flicker:0});
    add('oldtent',cx-54,cy-20,true);add('oldtent',cx+56,cy-18,true);add('oldtent',cx-38,cy+38,true);
    add('crate',cx+24,cy-34,true);add('crate',cx+36,cy-32,true);add('crate',cx-18,cy-40,true);
    add('sled',cx+46,cy+34,false);add('flag',cx,cy-52,true);
    add('frozen',cx-16,cy+12,false);add('frozen',cx+14,cy+14,false);add('frozen',cx+2,cy-14,false);
    ch(cx+34,cy+8,'ice',true);ch(cx-54,cy-3,'ice',false);ch(cx+58,cy-1,'ice',false);
  }
  LM=F;
  lampList=decorations.filter(d=>d.type==='lamp');
}
function nearestChest(){
  let b=null,bd=26;
  for(const c of chestList){if(c.open)continue;const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;b=c;}}
  return b;
}
function nearestCactus(){
  if(selectedMap!=='desert')return null;
  let b=null,bd=24;
  for(const n of querySolidNear(P.x,P.y,26)){
    if(n.kind!=='decor'||!n.ref||(n.ref.type!=='cactus_bg'&&n.ref.type!=='cactus_tall'))continue;
    if(n.ref.sap&&T<n.ref.sap)continue;
    const d=Math.hypot(n.x-P.x,n.y-P.y);if(d<bd){bd=d;b=n.ref;}
  }
  return b;
}
const LM_SIDE_D=['water','water','food','bandage','ammo','cloth','cloth','food'];
const LM_SIDE_S=['cookedmeat','food','bandage','wood','cloth','ammo','water','cloth'];
function chestLoot(c){
  const isD=selectedMap==='desert',out=[];
  if(c.main){
    out.push(isD?'turban':'medkit',isD?'shotgun':'smg','ammo','ammo','medkit');
    out.push(isD?'water':'cookedmeat',isD?'water':'cookedmeat');
  }else{
    const tb=isD?LM_SIDE_D:LM_SIDE_S,n=2+(Math.random()<.5?1:0);
    for(let i=0;i<n;i++)out.push(tb[Math.floor(Math.random()*tb.length)]);
    if(Math.random()<.18)out.push('medkit');
  }
  return out;
}
function openChest(c,remote){
  if(c.open)return;
  c.open=true;
  for(let i=0;i<10;i++)parts.push({x:c.x+rnd(-6,6),y:c.y-8,vx:rnd(-30,30),vy:rnd(-60,-20),t:.6,c:c.kind==='gold'?'#f0c830':c.kind==='ice'?'#c8e4f4':'#c0a060'});
  beep(300,.1,'triangle',.06,160);setTimeout(()=>beep(520,.12,'sine',.05,200),90);
  if(!remote){
    const loot=chestLoot(c),n=loot.length;
    loot.forEach((t,i)=>{
      const a=-1.2+(i/Math.max(1,n-1))*(Math.PI+2.4)+1.57,r=15+(i%2)*5;
      let x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r+6;
      if(solidPoint(x,y,3)){x=c.x;y=c.y+16;}
      items.push({t:t,x:x,y:y});
      if(MP.active)sendEvt('itemAdded',{t:t,x:x,y:y});
    });
    if(MP.active)sendEvt('chestOpen',{x:c.x,y:c.y});
    toast(c.main?(c.kind==='gold'?'Você abriu o baú do templo!':'Você abriu o baú da expedição!'):'Baú aberto');
    if(c.main)try{track(c.kind==='gold'?'temple':'expedition');}catch(e){}
  }
  if(c.main&&(!MP.active||MP.isHost))lmCurse(c);
}
function lmCurse(c){
  const isD=c.kind==='gold';
  if(MP.active)sendEvt('curse',{d:isD?1:0});
  setTimeout(()=>{toast(isD?'A maldição do templo desperta! Tempestade e mortos-vivos':'Uma nevasca cai e algo se move no gelo!');},900);
  weather=isD?'sand':'snow';setRain(false);weatherTimer=100;weatherParticles=[];
  const kinds=isD?[0,0,1,5,6]:[0,0,2,1,5];
  kinds.forEach((k,i)=>{
    for(let t=0;t<40;t++){
      const a=rnd(0,6.283),d=rnd(110,420),x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;
      if(x<40||y<40||x>WW-40||y>WH-40||solidPoint(x,y,12)||inAnyView(x,y,100))continue;
      spawnZ(x,y,k);const z=zombies[zombies.length-1];if(z){z.alert=9;z.tx=c.x;z.ty=c.y;}
      break;
    }
  });
}
function updateLM(dt){
  if(!P)return;
  if(LM&&!LM.seen&&Math.hypot(P.x-LM.cx,P.y-LM.cy)<300){
    LM.seen=true;toast(LM.kind==='temple'?'Você avistou o Templo Enterrado':'Você avistou o Acampamento da Expedição');
  }
  const beach=selectedMap==='city'&&!!ORLA;
  if(selectedMap!=='desert'&&selectedMap!=='snow'&&!beach){if(prints.length)prints.length=0;return;}
  // pegadas na areia e na neve (o jogador e os zumbis por perto)
  const mark=(o,big)=>{
    if(beach&&!onSand(o.x,o.y)){o._lp=null;return;}   // na praia so a areia marca
    const lp=o._lp;
    if(!lp){o._lp={x:o.x,y:o.y,s:1};return;}
    const dx=o.x-lp.x,dy=o.y-lp.y;
    if(dx*dx+dy*dy>(big?11:9)*(big?11:9)){
      lp.s=-lp.s;
      prints.push({x:o.x,y:o.y,a:Math.atan2(dy,dx),s:lp.s,l:selectedMap==='snow'?(big?80:60):(big?40:30),z:!!big});
      lp.x=o.x;lp.y=o.y;
      if(prints.length>260)prints.shift();
    }
  };
  if(!P.inVehicle&&!P.inside&&!P.dead&&!pointInLake(P.x,P.y))mark(P,false);
  for(const z of zombies){if(z.dead||Math.abs(z.x-P.x)>260||Math.abs(z.y-P.y)>200)continue;if(z.moving!==false)mark(z,true);}
  const pdec=selectedMap==='snow'&&weather==='snow'?2.2+blizzK*3:1;   // nevando, a neve cobre as pegadas bem mais rápido
  for(let k=prints.length-1;k>=0;k--){prints[k].l-=dt*pdec;if(prints[k].l<=0)prints.splice(k,1);}
}
function drawPrints(vx0,vx1,vy0,vy1){
  if(!prints.length)return;
  const col=selectedMap==='snow'?'#9fb2c4':selectedMap==='city'?'#8f7640':'#a5854a';
  ctx.fillStyle=col;
  for(const p of prints){
    if(p.x<vx0||p.x>vx1||p.y<vy0||p.y>vy1)continue;
    ctx.globalAlpha=Math.min(1,p.l/10)*.55;
    const nx=Math.round(-Math.sin(p.a)*2*p.s),ny=Math.round(Math.cos(p.a)*2*p.s),sh=p.l<6?1:0;   // quase cobertas: encolhem
    ctx.fillRect(Math.round(p.x+nx)-1,Math.round(p.y+ny),(p.z?3:2)-sh,(p.z?4:3)-sh);
  }
  ctx.globalAlpha=1;
}
function drawLMFlat(vx0,vx1,vy0,vy1){
  const F=LM;if(!F)return;
  if(F.x>vx1||F.x+F.w<vx0||F.y>vy1||F.y+F.h<vy0)return;
  if(F.kind==='temple'){
    R(F.x,F.y,F.w,F.h,'#bfa070');
    for(let x=F.x;x<F.x+F.w;x+=16)R(x,F.y,1,F.h,'#ab8f5d');
    for(let y=F.y;y<F.y+F.h;y+=16)R(F.x,y,F.w,1,'#ab8f5d');
    R(F.x,F.y,F.w,3,'#8a6e44');R(F.x,F.y+F.h-3,F.w,3,'#8a6e44');R(F.x,F.y,3,F.h,'#8a6e44');R(F.x+F.w-3,F.y,3,F.h,'#8a6e44');
    // caminho com hieróglifos até o altar
    R(F.cx-9,F.cy+16,18,F.y+F.h-(F.cy+16),'#d2b57c');
    for(let y=F.cy+22;y<F.y+F.h-6;y+=12){R(F.cx-6,y,3,5,'#8a6e44');R(F.cx+3,y,3,5,'#8a6e44');R(F.cx-1,y+1,2,3,'#a8442a');}
    // altar em degraus
    R(F.cx-30,F.cy-30,60,46,'#a8895a');R(F.cx-24,F.cy-26,48,38,'#b89a68');R(F.cx-16,F.cy-22,32,30,'#cdb080');
    R(F.cx-30,F.cy+14,60,2,'#7a6240');
    // dunas invadindo as quinas
    R(F.x+4,F.y+4,26,10,'#e0c890');R(F.x+F.w-34,F.y+F.h-14,30,10,'#e0c890');R(F.x+F.w-24,F.y+6,18,6,'#e0c890');
  }else{
    R(F.x,F.y,F.w,F.h,'#d4dfe8');
    ctx.fillStyle='#bccad6';
    for(let i=0;i<9;i++){const px=F.x+((i*53)%F.w),py=F.y+((i*37)%F.h);ctx.fillRect(px,py,22,8);}
    R(F.cx-26,F.cy-18,52,36,'#aebdca');R(F.cx-20,F.cy-14,40,28,'#9fb0be');
    R(F.x,F.y,F.w,2,'#e8f0f6');R(F.x,F.y+F.h-2,F.w,2,'#e8f0f6');
  }
}
function drawAurora(){
  if(selectedMap!=='snow'||P.inside||dark<.3)return;
  const a=Math.min(.5,(dark-.3)*1.4)*(weather==='snow'?.5:1);
  if(a<=.02)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';
  const bands=[['rgba(60,255,150,','rgba(40,200,200,',.0,.16],['rgba(120,90,255,','rgba(60,220,200,',.07,.12],['rgba(60,255,190,','rgba(160,90,255,',.13,.1]];
  bands.forEach((b,bi)=>{
    const base=H*(.1+b[2]),hh=H*b[3];
    ctx.beginPath();
    const top=[],bot=[];
    for(let x=0;x<=W+16;x+=16){
      const wv=Math.sin(x*.011+T*.35+bi*2)*H*.05+Math.sin(x*.029+T*.6+bi)*H*.02;
      const th=hh*(.65+.35*Math.sin(x*.017+T*.28+bi*1.7));
      top.push([x,base+wv]);bot.push([x,base+wv+th]);
    }
    ctx.moveTo(top[0][0],top[0][1]);
    for(const q of top)ctx.lineTo(q[0],q[1]);
    for(let i=bot.length-1;i>=0;i--)ctx.lineTo(bot[i][0],bot[i][1]);
    ctx.closePath();
    const g=ctx.createLinearGradient(0,base-H*.05,0,base+hh+H*.05);
    g.addColorStop(0,b[0]+'0)');g.addColorStop(.35,b[0]+(a*.9).toFixed(3)+')');g.addColorStop(1,b[1]+'0)');
    ctx.fillStyle=g;ctx.fill();
  });
  ctx.restore();
}
