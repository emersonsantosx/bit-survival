/* ============ MILHARAL (só Floresta) ============ */
let FIELD=null;
const SCW={on:true,t:20,sway:0},CORNT={t:25};
function inCorn(x,y){const F=FIELD;return !!F&&x>F.x+6&&x<F.x+F.w-6&&y>F.y+6&&y<F.y+F.h-6;}
function mkRr(n){let st=n>>>0;return()=>{st=(st+0x6D2B79F5)>>>0;let t=st;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
/* acha um retângulo livre (sem prédio, estrada, lago, carro nem avião) usando o sorteio próprio da semente */
function findSpot(rr,sizes){
  for(const [FW,FH] of sizes){
    for(let k=0;k<700;k++){
      const x=150+rr()*(WW-FW-300),y=150+rr()*(WH-FH-300);
      const ov=(ax,ay,aw,ah,m)=>x<ax+aw+m&&x+FW>ax-m&&y<ay+ah+m&&y+FH>ay-m;
      let bad=false;
      for(const b of blds)if(ov(b.x,b.y,b.w,b.h,60)){bad=true;break;}
      if(bad)continue;
      for(const r of roads)if(ov(r.x,r.y,r.w,r.h,24)){bad=true;break;}
      if(bad)continue;
      for(const l of lakes){const dx=Math.max(x-l.cx,0,l.cx-(x+FW)),dy=Math.max(y-l.cy,0,l.cy-(y+FH));if(Math.hypot(dx,dy)<l.r*1.2+40){bad=true;break;}}
      if(bad)continue;
      for(const v of vehicles)if(ov(v.x-30,v.y-30,60,60,10)){bad=true;break;}
      if(bad)continue;
      if(plane&&Math.hypot(plane.x-(x+FW/2),plane.y-(y+FH/2))<330)continue;
      return {x:Math.round(x),y:Math.round(y),w:FW,h:FH};
    }
  }
  return null;
}
function genField(seed){
  FIELD=null;
  if(selectedMap!=='forest')return;
  const rr=mkRr((seed|0)*2654435761+977);
  const F=findSpot(rr,[[300,230],[260,200],[220,170]]);
  if(!F)return;
  F.cx=F.x+F.w/2;F.cy=F.y+F.h/2;F.sx=Math.round(F.cx);F.sy=Math.round(F.cy+6);
  // limpa o terreno: nada de árvore, pedra ou enfeite dentro da plantação
  const m=14,inR=(o)=>o.x>F.x-m&&o.x<F.x+F.w+m&&o.y>F.y-m&&o.y<F.y+F.h+m;
  trees=trees.filter(o=>!inR(o));rocks=rocks.filter(o=>!inR(o));decorations=decorations.filter(o=>!inR(o));
  items=items.filter(o=>!inR(o));animals=animals.filter(o=>!inR(o));
  lampList=decorations.filter(d=>d.type==='lamp');
  // pés de milho em fileiras, com corredores e uma clareira para o espantalho
  F.stalks=[];F.spots=[];F.cols=[];
  for(let c=0,x=F.x+16;x<F.x+F.w-10;c++,x+=13){
    const aisle=(c%5===4),center=Math.abs(x-F.cx)<15;
    F.cols.push({x:x,aisle:aisle||center});
    for(let y=F.y+18;y<F.y+F.h-6;y+=9){
      if(aisle||center){ if(!center&&((y-F.y)%18<9))F.spots.push([Math.round(x),Math.round(y)]); continue; }
      if(Math.abs(y-F.cy)<15)continue;
      if(Math.hypot(x-F.cx,y-F.cy)<38)continue;
      F.stalks.push([Math.round(x+(rr()-.5)*4),Math.round(y+(rr()-.5)*3),rr()<.5?0:1,rr()<.2?1:0]);
    }
  }
  for(let x=F.x+20;x<F.x+F.w-16;x+=22)if(Math.abs(x-F.cx)>30)F.spots.push([Math.round(x),Math.round(F.cy)]);
  F.bales=[[F.x+8,F.y+F.h-8],[F.x+F.w-8,F.y+8]];
  { // cerca sólida (com as 4 entradas de 32px) e fardos de feno
    const g=16,fw=[];
    for(const ey of [F.y,F.y+F.h]){fw.push({x:F.x-2,y:ey-2,w:F.w/2-g+2,h:4});fw.push({x:F.cx+g,y:ey-2,w:F.w/2-g+2,h:4});}
    for(const ex of [F.x,F.x+F.w]){fw.push({x:ex-2,y:F.y-2,w:4,h:F.h/2-g+2});fw.push({x:ex-2,y:F.cy+g,w:4,h:F.h/2-g+2});}
    for(const b of F.bales)fw.push({x:b[0]-6,y:b[1]-5,w:13,h:9});
    F.fence=fw;
  }
  FIELD=F;
  if(F.spots.length){for(let i=0;i<2;i++){const sp=F.spots[Math.floor(rr()*F.spots.length)];items.push({t:'corn',x:sp[0],y:sp[1]});}}
  SCW.on=rr()<.7;SCW.t=rnd(25,60);CORNT.t=rnd(40,70);
}
const YT={on:false,t:30,cool:0};
function updateYeti(dt){
  if(selectedMap!=='snow'||!P||(MP.active&&!MP.isHost))return;
  YT.cool=Math.max(0,YT.cool-dt);
  const yeti=zombies.find(z=>!z.dead&&z.kind===9);
  const anchors=[P];
  if(MP.active)for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x))anchors.push(rp);}
  if(weather!=='snow'){
    YT.on=false;
    if(yeti&&anchors.every(a=>Math.hypot(a.x-yeti.x,a.y-yeti.y)>320)){yeti.dead=true;} // a nevasca passou: ele some na neve
    return;
  }
  if(!YT.on){YT.on=true;YT.t=rnd(30,60);}
  if(yeti||YT.cool>0||day<2||P.dead)return;
  YT.t-=dt;
  if(YT.t>0)return;
  const a0=anchors[Math.floor(Math.random()*anchors.length)];
  for(let k=0;k<16;k++){
    const a=rnd(0,6.283),d=rnd(280,370),x=a0.x+Math.cos(a)*d,y=a0.y+Math.sin(a)*d;
    if(x<60||y<60||x>WW-60||y>WH-60||solidPoint(x,y,24)||bldAt(x,y)||pointInLake(x,y)||inAnyView(x,y,100))continue;
    const z=spawnZ(x,y,9);z.alert=14;z.tx=a0.x;z.ty=a0.y;
    YT.cool=300;
    toast('Algo enorme se move na nevasca...');
    if(MP.active)sendEvt('yeti',{});
    try{zombieVoice(z,'alert');}catch(e){}
    return;
  }
  YT.t=8;
}
function updateCornfield(dt){
  const F=FIELD;if(!F||!P)return;
  if(!MP.active||MP.isHost){ // no multiplayer só o anfitrião decide; o convidado recebe pelo snapshot
    SCW.t-=dt;
    if(SCW.t<=0){
      // só muda quando NENHUM jogador está por perto olhando
      let far=Math.hypot(P.x-F.sx,P.y-F.sy)>330||P.inside;
      if(MP.active)for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x)&&Math.hypot(rp.x-F.sx,rp.y-F.sy)<=330)far=false;}
      if(far){SCW.on=Math.random()<.6;SCW.t=rnd(35,90);}
      else SCW.t=4;
    }
  }
  if(!MP.active||MP.isHost){
    CORNT.t-=dt;
    if(CORNT.t<=0){
      CORNT.t=rnd(45,80);
      const inF=items.filter(o=>o.t==='corn'&&inCorn(o.x,o.y)).length;
      if(inF<3&&F.spots.length){
        const sp=F.spots[Math.floor(Math.random()*F.spots.length)];
        if(Math.hypot(sp[0]-P.x,sp[1]-P.y)>40){
          items.push({t:'corn',x:sp[0],y:sp[1]});
          if(MP.active)sendEvt('itemAdded',{t:'corn',x:sp[0],y:sp[1]});
        }
      }
    }
  }
  const h=inCorn(P.x,P.y);
  if(h&&!F._in&&!F._told){F._told=true;toast('Milharal: quem te persegue perde você de vista');}
  F._in=h;
}
const _stalkCache={};
function stalkSprite(v,ear){
  const k=v+'_'+ear;if(_stalkCache[k])return _stalkCache[k];
  const c=document.createElement('canvas');c.width=16;c.height=32;const g=c.getContext('2d');
  const Q=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  Q(5,29,6,2,'rgba(0,0,0,.25)');
  Q(7,6,2,24,'#3f6e2a');Q(7,6,1,24,'#58903a');
  const o=v?1:0;
  Q(2-o,14,5,2,'#4f8a33');Q(1-o,15,2,2,'#4f8a33');Q(9+o,18,6,2,'#4f8a33');Q(13+o,19,2,2,'#3f6e2a');Q(3,22,4,2,'#3f6e2a');Q(9,11,5,2,'#58903a');Q(1,26,6,2,'#4f8a33');
  Q(6,0,1,6,'#c8a850');Q(8,1,1,5,'#c8a850');Q(7,0,2,3,'#d8b860');
  if(ear){Q(9,15,4,9,'#8ab04a');Q(10,13,2,3,'#e8c040');Q(10,16,2,7,'#e8c040');}
  return _stalkCache[k]=c;
}
function drawStalk(c){
  const sp=stalkSprite(c[2],c[3]);
  ctx.imageSmoothingEnabled=false;
  const sw=Math.round(Math.sin(T*1.6+c[0]*.07+c[1]*.05)*1);
  ctx.drawImage(sp,c[0]-8+sw,c[1]-31);
}
function drawCornFlat(vx0,vx1,vy0,vy1){
  const F=FIELD;if(!F)return;
  if(F.x>vx1||F.x+F.w<vx0||F.y>vy1||F.y+F.h<vy0)return;
  R(F.x,F.y,F.w,F.h,'#4b3a22');
  for(const c of F.cols){
    if(c.aisle)R(c.x-5,F.y,10,F.h,'#6d5830');
    else R(c.x-1,F.y+2,2,F.h-4,'#5d4829');
  }
  R(F.cx-15,F.y,30,F.h,'#7d6538');
  R(F.x,F.cy-15,F.w,30,'#7d6538');
  R(F.cx-34,F.cy-26,68,56,'#86703f');
  // cerca de madeira com quatro entradas (norte, sul, leste, oeste)
  const post=(x,y)=>{R(x-1,y-8,3,10,'#6a4a2a');R(x-1,y-8,3,2,'#8a6a3a');};
  const gap=16;
  for(const ey of [F.y,F.y+F.h]){
    R(F.x,ey-5,F.w/2-gap,2,'#7a5a32');R(F.x,ey-2,F.w/2-gap,2,'#7a5a32');
    R(F.cx+gap,ey-5,F.w/2-gap,2,'#7a5a32');R(F.cx+gap,ey-2,F.w/2-gap,2,'#7a5a32');
    for(let x=F.x;x<=F.x+F.w;x+=15){if(Math.abs(x-F.cx)>gap)post(x,ey);}
    post(F.cx-gap,ey);post(F.cx+gap,ey);
  }
  for(const ex of [F.x,F.x+F.w]){
    R(ex-1,F.y,2,F.h/2-gap,'#7a5a32');R(ex-1,F.cy+gap,2,F.h/2-gap,'#7a5a32');
    for(let y=F.y;y<=F.y+F.h;y+=15){if(Math.abs(y-F.cy)>gap)post(ex,y);}
    post(ex,F.cy-gap);post(ex,F.cy+gap);
  }
  for(const b of F.bales){R(b[0]-6,b[1]-5,13,9,'#c8a440');R(b[0]-6,b[1]-5,13,2,'#e0c060');R(b[0]-1,b[1]-5,2,9,'#a88428');R(b[0]-6,b[1]+3,13,1,'#8a6a20');}
}
function drawScarecrow(F){
  const x=F.sx,y=F.sy,sw=SCW.on?Math.round(Math.sin(T*1.3)):0;
  R(x-6,y+1,13,2,'rgba(0,0,0,.3)');
  R(x-1,y-34,3,36,'#4a3220');R(x-15,y-26,31,3,'#4a3220');           // poste e travessa de madeira escura
  if(!SCW.on){R(x-12,y-24,2,2,'#b89c48');R(x+9,y-23,3,2,'#b89c48');R(x-5,y,2,1,'#b89c48');R(x+3,y+1,3,1,'#b89c48');return;}
  const tw=Math.round(Math.sin(T*2.1+x)*1),pulse=.55+.45*Math.sin(T*5);
  // casaco rasgado, apodrecido, com palha saindo pelos buracos
  R(x-7,y-26,14,14,'#2e2218');R(x-7,y-22,14,2,'#1a120a');R(x-7,y-17,14,2,'#1a120a');
  R(x-3,y-26,1,14,'#1a120a');R(x+3,y-26,1,14,'#1a120a');
  R(x-5,y-12,2,3,'#2e2218');R(x-1,y-12,2,4,'#2e2218');R(x+3,y-12,3,3,'#2e2218');     // barra esfarrapada
  R(x-4,y-20,3,2,'#6a2a22');R(x+2,y-16,2,3,'#6a2a22');                                // manchas escuras
  R(x-8,y-19,2,2,'#b89c48');R(x+6,y-23,2,2,'#b89c48');R(x-2,y-13,2,2,'#b89c48');       // palha
  // braços magros e compridos com dedos em garra
  R(x-17+sw,y-26,5,2,'#3a2a1a');R(x+13+sw,y-26,5,2,'#3a2a1a');
  R(x-15,y-28,2,5,'#3a2a1a');R(x+14,y-28,2,5,'#3a2a1a');
  R(x-19+sw,y-25,1,5,'#a89a78');R(x-17+sw,y-24,1,6,'#a89a78');R(x-15+sw,y-24,1,5,'#a89a78');
  R(x+17+sw,y-25,1,5,'#a89a78');R(x+15+sw,y-24,1,6,'#a89a78');R(x+13+sw,y-24,1,5,'#a89a78');
  R(x-20+sw,y-21,2,1,'#b89c48');R(x+18+sw,y-21,2,1,'#b89c48');
  // pernas de pano preto
  R(x-5,y-12,4,11,'#1e1812');R(x+1,y-12,4,11,'#1e1812');R(x-6,y-3,5,2,'#3a2a1a');R(x+1,y-3,5,2,'#3a2a1a');
  // cabeça de saco encardido, costurado
  R(x-6,y-37,12,11,'#8a7a55');R(x-6,y-37,12,2,'#a09068');R(x+4,y-35,2,9,'#6a5a3a');
  R(x-1,y-30,1,2,'#5a4a2e');R(x-4,y-27,1,2,'#5a4a2e');                                 // rugas e remendo
  // olhos vazios, só buracos escuros
  R(x-4,y-34,3,3,'#0a0606');R(x+1,y-34,3,3,'#0a0606');
  // boca costurada em zigue-zague
  R(x-4,y-28,9,1,'#0a0606');for(let i=-4;i<=4;i+=2){R(x+i,y-30,1,5,'#0a0606');}
  // chapéu de aba larga, rasgado e torto
  R(x-10,y-39+tw,20,2,'#1a140e');R(x-5,y-45,10,6,'#241a10');R(x-5,y-41,10,1,'#4a3220');R(x-8,y-38,3,2,'#1a140e');
  R(x+6,y-38,4,2,'#1a140e');R(x+8,y-37,2,1,'#0a0606');
  // palha caindo do pescoço
  R(x-7,y-27,2,4,'#b89c48');R(x+5,y-27,2,5,'#b89c48');R(x+6,y-23,1,2,'#b89c48');
}
/* "Sabor" do mundo: cada semente sorteia densidades e formatos diferentes (mais mata, mais pedra, mais vilas, mais lagos...). Igual para anfitrião e convidado. */
let FL={tree:1,rock:1,decor:1,fauna:1,towns:1,lakes:0,clr:1,clp:.8};
function worldFlavor(){
  FL={tree:rnd(.75,1.3),rock:rnd(.7,1.35),decor:rnd(.8,1.25),fauna:rnd(.8,1.3),towns:rnd(.8,1.2),lakes:rint(0,1),clr:rnd(.7,1.4),clp:rnd(.62,.9)};
}
function genWorld(seed) {
  setWorldSize();
  setRng(seed);
  worldFlavor();
  solidGrid=null;SPG=null;FIELD=null;LM=null;chestList=[];   // grades de colisão do mundo anterior não podem vazar para a geração (senão o mesmo seed gera mundos diferentes)
  try {
  trees=[];rocks=[];blds=[];walls=[];items=[];zombies=[];roads=[];decals=[];parts=[];tracers=[];towns=[];lakes=[];vehicles=[];campfires=[];tents=[];spits=[];decorations=[];animals=[];
  cityInter=[];cityCrash=null;lampList=[];ORLA=null;
  plane=null;

  if(selectedMap==='city') genCity(); else genRural();
  // Um único lago isolado — Floresta e Neve; no Deserto é um oásis menor (seed-determinístico = sync no multiplayer)
  lakes=[];
  const lakeN=Math.max(1,Math.round(WAREA*(selectedMap==='desert'?.45:.5)))+FL.lakes;     // mundo maior: vários lagos/oásis
  if(mapHasLake()&&selectedMap!=='city')for(let li=0;li<lakeN;li++){
    let cx=0,cy=0,mainR=160,valid=false,lTries=0;
    for(const fm of [1,.6,.35,.15]){ if(valid)break; lTries=0;
    while(!valid && lTries<300){
      lTries++;
      cx=rnd(850,WW-850); cy=rnd(850,WH-850); mainR=selectedMap==='desert'?rnd(62,82):rnd(130,175);
      let ok=true;
      for(const b of blds){
        if(Math.hypot(b.x+b.w/2-cx, b.y+b.h/2-cy) < Math.max(mainR+380*fm,mainR+80)){ ok=false; break; }
      }
      if(!ok) continue;
      for(const r of roads){
        const rx=clamp(cx,r.x,r.x+r.w), ry=clamp(cy,r.y,r.y+r.h);
        if(Math.hypot(cx-rx,cy-ry) < Math.max(mainR+280*fm,mainR+50)){ ok=false; break; }
      }
      if(!ok) continue;
      for(const t of towns){
        if(Math.hypot(t.x-cx,t.y-cy) < Math.max(mainR+450*fm,mainR+120)){ ok=false; break; }
      }
      if(!ok) continue;
      for(const l of lakes){ if(Math.hypot(l.cx-cx,l.cy-cy) < l.r+mainR+450*fm){ ok=false; break; } }   // um lago longe do outro
      if(ok) valid=true;
    }
    }
    if(valid){
      const blobs=[{x:cx,y:cy,r:mainR}];
      const subCount=selectedMap==='desert'?rint(5,8):rint(8,14);
      for(let j=0;j<subCount;j++){
        const ang=(j/subCount)*6.283+rnd(-0.2,0.2);
        const dist=mainR*rnd(0.5,0.82);
        blobs.push({x:cx+Math.cos(ang)*dist, y:cy+Math.sin(ang)*dist, r:rnd(mainR*0.4,mainR*0.65)});
      }
      const islands=[], islCount=selectedMap==='desert'?0:rint(1,3);
      for(let j=0;j<islCount;j++){
        const ang=rnd(0,6.283), dist=rnd(0,mainR*0.5);
        islands.push({x:cx+Math.cos(ang)*dist, y:cy+Math.sin(ang)*dist, r:rnd(10,20)});
      }
      const pads=[], padCount=selectedMap==='forest'?rint(12,20):(selectedMap==='desert'?0:rint(4,8));
      for(let j=0;j<padCount;j++){
        const ang=rnd(0,6.283), dist=rnd(mainR*0.35,mainR*0.92);
        pads.push({x:cx+Math.cos(ang)*dist, y:cy+Math.sin(ang)*dist, r:rnd(2,4)});
      }
      lakes.push({cx,cy,r:mainR,blobs,islands,pads,frozen:selectedMap==='snow'});
      if(selectedMap==='desert'){ // palmeiras em volta do oásis
        const pn=rint(7,10);
        for(let j=0;j<pn;j++){
          const ang=(j/pn)*6.283+rnd(-.25,.25), d=mainR*rnd(1.18,1.5);
          const px=cx+Math.cos(ang)*d, py=cy+Math.sin(ang)*d;
          if(onCityRoad(px,py,20)) continue;
          trees.push({x:Math.round(px),y:Math.round(py),k:6,hp:4,seed:_rng()});
        }
      }
    }
  }
  if(selectedMap==='city'&&cityCrash){ // fonte na praça (ao lado da queda do helicóptero)
    const fx=cityCrash.x,fy=cityCrash.y; // fonte sempre no centro da praça
    lakes.push({cx:fx,cy:fy,r:26,blobs:[],islands:[],pads:[],frozen:false,fountain:true});
    const clr=(a,m)=>{for(let i=a.length-1;i>=0;i--)if(Math.hypot(a[i].x-fx,a[i].y-fy)<m)a.splice(i,1);};
    clr(trees,58);clr(rocks,58);clr(decorations,60);clr(items,60);
  }
  let vId = 0;
  const carCols=['#7a3030','#30507a','#505050','#6a6a30','#8a7030','#4a6a8a','#2a5a3a','#6a3a5a','#3a3a3a','#8a5a20'];
  if(selectedMap==='city'){ vId=genCityVehicles(vId,carCols); } else { vId=genRuralVehicles(vId,carCols); }
  let planeX=rnd(500,WW-500),planeY=rnd(500,WH-500),validPlane=false,pTries=0;
  if(selectedMap==='city'&&cityCrash){ // destroços do avião ao lado da fonte (centro fica livre pra fonte)
    let best=null;
    for(const [ox,oy] of [[-150,-10],[150,-10],[0,-150],[0,150],[-130,-100],[130,100],[-130,100],[130,-100]]){
      const qx=cityCrash.x+ox,qy=cityCrash.y+oy;
      if(qx<cityCrash.bx+60||qx>cityCrash.bx+cityCrash.bw-60||qy<cityCrash.by+60||qy>cityCrash.by+cityCrash.bh-60)continue;
      if(blds.some(b=>qx+60>b.x&&qx-60<b.x+b.w&&qy+60>b.y&&qy-60<b.y+b.h)||onCityRoad(qx,qy,50))continue;
      best=[qx,qy];break;
    }
    if(!best)best=[cityCrash.x-150,cityCrash.y-10];
    planeX=best[0]; planeY=best[1]; validPlane=true;
  }
  while(!validPlane&&pTries<500){
    pTries++;
    planeX=rnd(500,WW-500);planeY=rnd(500,WH-500);
    if(pointInLake(planeX,planeY))continue;
    if(onCityRoad(planeX,planeY,80))continue;
    let ok=true;
    const thr=pTries<350?350:220;
    for(const b of blds)if(Math.hypot(b.x+b.w/2-planeX,b.y+b.h/2-planeY)<thr){ok=false;break;}
    if(ok)validPlane=true;
  }
  plane={x:planeX,y:planeY,w:70,h:46};
  for(let i=0;i<5;i++)items.push({t:wpick({food:4,water:4,bandage:3,ammo:4,pistol:1,smg:1}),x:plane.x+rnd(-25,25),y:plane.y+rnd(-12,12)});

  const treeCount=Math.round((selectedMap==='desert'?180:selectedMap==='snow'?560:selectedMap==='city'?300:900)*WAREA*FL.tree);
  const centers=[];
  for(let i=0,nc=Math.round(40*WAREA);i<nc;i++)centers.push({x:rnd(100,WW-100),y:rnd(100,WH-100),r:rnd(140,400)*FL.clr});
  let count=0,g=0;
  while(count<treeCount&&g<12000*WAREA){
    g++;
    let x,y;
    if(_rng()<FL.clp){const c=pick(centers),a=rnd(0,6.283),d=_rng()*c.r;x=c.x+Math.cos(a)*d;y=c.y+Math.sin(a)*d;}
    else{x=rnd(30,WW-30);y=rnd(30,WH-30);}
    if(x<30||y<30||x>WW-30||y>WH-30||solidPoint(x,y,selectedMap==='city'?30:22))continue;
    if(onCityRoad(x,y,14))continue;
    let nearLake=false;
    for(const l of lakes)if(Math.hypot(l.cx-x,l.cy-y)<l.r+25){nearLake=true;break;}
    if(nearLake)continue;
    // Map-specific tree variety
    let k;
    if(selectedMap==='snow') k = _rng()<.7?2:(_rng()<.5?4:5); // pine / dead / snowy oak
    else if(selectedMap==='desert') k = _rng()<.55?3:(_rng()<.5?6:7); // dead / palm / scrub
    else if(selectedMap==='city') k = _rng()<.4?1:(_rng()<.5?0:8); // oak / bushy / street tree
    else k = _rng()<.35?0:(_rng()<.5?1:(_rng()<.6?9:10)); // pine-ish / oak / birch / big
    trees.push({x:Math.round(x),y:Math.round(y),k:k,hp:4,seed:_rng()});count++;
  }

  const rockCount=Math.round((selectedMap==='desert'?240:selectedMap==='snow'?260:selectedMap==='city'?0:320)*WAREA*FL.rock);
  let rc=0,rg=0;
  while(rc<rockCount&&rg<12000*WAREA){
    rg++;
    let x,y;
    if(_rng()<FL.clp-.1){const c=pick(centers),a=rnd(0,6.283),d=_rng()*c.r;x=c.x+Math.cos(a)*d;y=c.y+Math.sin(a)*d;}
    else{x=rnd(40,WW-40);y=rnd(40,WH-40);}
    if(x<40||y<40||x>WW-40||y>WH-40||solidPoint(x,y,selectedMap==='city'?30:24))continue;
    if(onCityRoad(x,y,14))continue;
    let nearLake=false;
    for(const l of lakes)if(Math.hypot(l.cx-x,l.cy-y)<l.r+30){nearLake=true;break;}
    if(nearLake)continue;
    rocks.push({x:Math.round(x),y:Math.round(y),hp:5,k:rint(0,4),seed:_rng()});
    rc++;
  }

  const decorList = DECOR_BY_MAP[selectedMap] || DECOR_BY_MAP.forest;
  const decorCount = Math.round((selectedMap==='city'?280:selectedMap==='desert'?320:selectedMap==='snow'?340:450)*WAREA*FL.decor);
  let dc=0,dg=0;
  while(dc<decorCount&&dg<14000*WAREA){
    dg++;
    const x=rnd(40,WW-40),y=rnd(40,WH-40);
    if(solidPoint(x,y,selectedMap==='city'?22:16))continue;
    if(onCityRoad(x,y,8))continue;
    let nearLake=false;
    for(const l of lakes)if(Math.hypot(l.cx-x,l.cy-y)<l.r+10){nearLake=true;break;}
    if(nearLake)continue;
    const type=pick(decorList);
    const solid = ['cactus_bg','cactus_tall','crate','trash','hydrant','sign','bench','lamp','snowman','pine_sm','log','stump','dumpster','mailbox','barrier','yucca'].includes(type);
    decorations.push({x:Math.round(x),y:Math.round(y),type:type,solid:solid,seed:_rng()});
    dc++;
  }

  if(selectedMap==='city')cityLamps();
  lampList=decorations.filter(d=>d.type==='lamp'); // postes: abrem luz na escuridão à noite
  let oc=0,og=0;
  while(oc<Math.round(26*WAREA)&&og<700*WAREA){
    og++;
    const x=rnd(60,WW-60),y=rnd(60,WH-60);
    if(solidPoint(x,y,14)||pointInLake(x,y))continue;
    items.push({t:wpick(OUT_LOOT),x,y});oc++;
  }
  const stoneGround=Math.round((selectedMap==='city'?70:40)*WAREA);   // cidade tem menos pedras: mais pedra solta no chão
  for(let i=0;i<stoneGround;i++){
    const x=rnd(60,WW-60),y=rnd(60,WH-60);
    if(!solidPoint(x,y,14))items.push({t:'stone',x,y});
  }

  weather=pickWeather(_rng);
  weatherTimer=rnd(120,240);
  weatherParticles=[];
  // Animais por mapa (passivos, caça = comida)
  animals=[];birds=[];birdsReady=false;flockT=rnd(15,40);
  const animalPlan=
    selectedMap==='forest'?[{k:'deer',n:8},{k:'rabbit',n:12},{k:'boar',n:5}]:
    selectedMap==='snow'?[{k:'rabbit',n:10},{k:'wolf',n:6},{k:'deer',n:4}]:
    selectedMap==='desert'?[{k:'camel',n:5},{k:'scorpion',n:8}]:
    selectedMap==='city'?[{k:'rat',n:14},{k:'dog',n:6}]:[];
  for(const plan of animalPlan){
    let ac=0,ag=0;
    while(ac<Math.round(plan.n*WAREA*FL.fauna)&&ag<400*WAREA){
      ag++;
      const x=rnd(60,WW-60),y=rnd(60,WH-60);
      if(solidPoint(x,y,12)||pointInLake(x,y))continue;
      if(plane&&Math.hypot(x-plane.x,y-plane.y)<120)continue;
      const aHp=plan.k==='boar'||plan.k==='wolf'?12:(plan.k==='deer'||plan.k==='camel'?8:4);
      animals.push({x,y,k:plan.k,face:rnd(0,6.28),spd:0,hp:aHp,
        max:aHp, flee:0, wt:rnd(0,3), tx:x, ty:y, dead:false});
      ac++;
    }
  }
  genField(seed);
  genLandmark(seed);
  if(selectedMap==='city')genOrla();
  genAmbientProps(seed);
  rebuildSolidGrid();
  BASE_TREES=trees.map(t=>t.x+','+t.y);BASE_ROCKS=rocks.map(t=>t.x+','+t.y);regrowInit(); // referência para sincronizar o que foi derrubado/quebrado
  buildMinimap();
  }catch(e){
    console.error('[genWorld] FALHOU na linha:',e.stack);
    throw e;
  } finally {
    setRng(null);
  }
}
/* Minimapa: janela de MM_SPAN unidades em volta do jogador (o mapa grande inteiro em 76 px ficaria ilegível); a base é desenhada uma vez do mundo todo */
let MM_SPAN=2800,MM_K=76/2800,MM_X0=0,MM_Y0=0;
function mmFrame(){          // posiciona a janela e desenha a base; depois disso: x do mapa = (x-MM_X0)*MM_K
  MM_X0=clamp(P.x-MM_SPAN/2,0,Math.max(0,WW-MM_SPAN));MM_Y0=clamp(P.y-MM_SPAN/2,0,Math.max(0,WH-MM_SPAN));
  mm.clearRect(0,0,76,76);
  mm.drawImage(mmStatic,Math.round(MM_X0*MM_K),Math.round(MM_Y0*MM_K),76,76,0,0,76,76);
}
function mmDot(x,y,w,h,col,edge){   // marcador; se edge, fica preso na borda quando o ponto está fora da janela
  let px=(x-MM_X0)*MM_K,py=(y-MM_Y0)*MM_K;
  if(edge){px=clamp(px,2,74);py=clamp(py,2,74);}
  mm.fillStyle=col;mm.fillRect(Math.round(px)-(w>>1),Math.round(py)-(h>>1),w,h);
}
function buildMinimap(){
  MM_SPAN=Math.min(2800,WW);MM_K=76/MM_SPAN;
  const side=Math.ceil(WW*MM_K);
  mmStatic.width=side;mmStatic.height=Math.ceil(WH*MM_K);
  bigBase=null;
  paintMapBase(mms,MM_K);
}
/* desenha o fundo do mapa (estradas, lagos, prédios...) em qualquer escala: o minimapa usa 76 px por 2800 unidades, o mapa grande usa o mundo todo */
function paintMapBase(g,s){
  /* cores escolhidas para o lago e as vilas se destacarem do chão em cada mapa */
  const M=selectedMap,C=M==='snow'?{land:'#e6eef5',road:'#9fb0bf',lake:'#2f86d0',edge:'#0e3f73'}
    :M==='desert'?{land:'#e0c68f',road:'#a98a55',lake:'#1f9ae0',edge:'#0b4a78'}
    :M==='city'?{land:'#3a3d45',road:'#85795f',lake:'#3aa6f5',edge:'#d6efff'}
    :{land:'#5f8a4a',road:'#d9c493',lake:'#1f86e8',edge:'#e6f6ff'};
  g.fillStyle=C.land;
  g.fillRect(0,0,Math.ceil(WW*s),Math.ceil(WH*s));
  if(M==='city'&&ORLA){const o=ORLA;
    g.fillStyle='#bdb8aa';g.fillRect(0,o.yb*s,Math.ceil(WW*s),Math.ceil((o.sea-o.sandW-o.yb)*s));
    g.fillStyle='#e0cb92';g.fillRect(0,(o.sea-o.sandW)*s,Math.ceil(WW*s),Math.ceil(o.sandW*s)+1);
    g.fillStyle='#2a8fb8';g.fillRect(0,o.sea*s,Math.ceil(WW*s),Math.ceil((WH-o.sea)*s)+1);
  }
  g.fillStyle=C.road;
  for(const r of roads)g.fillRect(r.x*s,r.y*s,Math.max(1,r.w*s),Math.max(1,r.h*s));
  if(FIELD){g.fillStyle='#d9b84a';g.fillRect(FIELD.x*s,FIELD.y*s,Math.max(2,FIELD.w*s),Math.max(2,FIELD.h*s));}
  if(LM){g.fillStyle=LM.kind==='temple'?'#f0c830':'#9fe4ff';g.fillRect(LM.cx*s-2,LM.cy*s-2,5,5);g.fillStyle='#000';g.fillRect(LM.cx*s-1,LM.cy*s-1,3,3);g.fillStyle=LM.kind==='temple'?'#f0c830':'#9fe4ff';g.fillRect(LM.cx*s-.5,LM.cy*s-.5,1.5,1.5);}
  g.fillStyle=C.lake;g.strokeStyle=C.edge;g.lineWidth=1.2;g.lineJoin='round';
  for(const l of lakes){
    lakeShorePath(l,1,g,s,0,0); g.fill(); g.stroke();
  }
  for(const b of blds){
    g.fillStyle=
      b.type==='mil'?'#7f9a3a':
      b.type==='shop'||b.type==='gas'?'#ec6a6a':
      b.type==='warehouse'?'#8a9aaa':
      b.type==='apartment'?'#a9b6d0':
      b.type==='office'?'#8aa0c0':
      b.type==='clinic'?'#f4f7fb':
      b.type==='garage'?'#b7ab88':
      b.type==='barn'?'#b8582e':
      b.type==='cabin'?'#9a6638':'#e0b57e';
    const bx=Math.floor(b.x*s),by=Math.floor(b.y*s),bw=Math.max(2,Math.ceil(b.w*s)),bh=Math.max(2,Math.ceil(b.h*s));
    g.fillRect(bx,by,bw,bh);
    if(bw>=4&&bh>=4){g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1;g.strokeRect(bx+.5,by+.5,bw-1,bh-1);}
    g.strokeStyle=C.edge;
  }
}
let bigBase=null;
function zombieScale(z){
  if(!z) return 1;
  if(z.kind===9) return 1.45;
  if(z.kind===3) return 1.35;
  if(z.kind===2||z.kind===7) return 1.28;
  if(z.kind===8) return 1.05;
  if(z.crawler||z.kind===5) return 0.85;
  return 1;
}
// Agressivos perseguem; caças fogem — zumbis ignoram animais
const ANIMAL_AGGRO={wolf:1,boar:1,dog:1,scorpion:1,rat:1};
const ANIMAL_PREY={deer:1,rabbit:1,camel:1,crow:1,vulture:1};

/* ===== PÁSSAROS: cada mapa tem as suas espécies. Andam no chão, voam quando sentem alguém chegando e cruzam o céu em bandos ===== */
const BIRD_SP={
  sabia:     {n:'Sabiá',      body:'#7a5a3a',belly:'#d88a4a',wing:'#5e422a',beak:'#e0b040',sz:1,  cnt:9, snd:'chirp'},
  bemtevi:   {n:'Bem-te-vi',  body:'#8a7a5a',belly:'#f0d040',wing:'#6a5a40',beak:'#2a2a2a',sz:1,  cnt:6, snd:'chirp'},
  perdiz:    {n:'Perdiz-da-neve',body:'#e8eef4',belly:'#ffffff',wing:'#c0ccd8',beak:'#2a2a30',sz:1.1,cnt:8,snd:'cluck'},
  pardalneve:{n:'Pardal-da-neve',body:'#f2f4f6',belly:'#ffffff',wing:'#2a2a32',beak:'#e0a030',sz:.9,cnt:7, snd:'chirp'},
  calhandra: {n:'Calhandra',  body:'#b89a60',belly:'#e8d8a8',wing:'#8a6a38',beak:'#5a4a30',sz:1,  cnt:9, snd:'chirp'},
  urubu:     {n:'Urubu',      body:'#2a2a2e',belly:'#3a3a40',wing:'#1e1e22',beak:'#c88050',sz:1.6,cnt:6, soar:true},
  pombo:     {n:'Pombo',      body:'#8a8e98',belly:'#a8acb8',wing:'#6a6e78',beak:'#c0a090',sz:1.1,cnt:12,snd:'coo'},
  corvo:     {n:'Corvo',      body:'#22222a',belly:'#2e2e38',wing:'#16161c',beak:'#3a3a44',sz:1.2,cnt:8, snd:'caw'},
  gaivota:   {n:'Gaivota',    body:'#f2f4f6',belly:'#ffffff',wing:'#8a94a2',beak:'#e0a030',sz:1.2,cnt:7, snd:'gull'}
};
const BIRD_MAP={forest:['sabia','bemtevi'],snow:['perdiz','pardalneve'],desert:['calhandra','urubu'],city:['pombo','corvo','gaivota']};
const BIRD_FLOCK={forest:['sabia','bemtevi'],snow:['pardalneve','perdiz'],desert:['calhandra'],city:['pombo','corvo','gaivota']};
let birds=[],birdsReady=false,flockT=25,birdChirpT=6,birdSeq=0;
const BKEYS=Object.keys(BIRD_SP),BST=['ground','fly','land','soar'];
function birdAnchors(){ // todos os jogadores vivos (anfitrião + convidado)
  const a=[];if(P&&!P.dead)a.push({x:P.x,y:P.y});
  if(MP.active)for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x))a.push({x:rp.x,y:rp.y});}
  if(!a.length&&P)a.push({x:P.x,y:P.y});
  return a;
}
function birdOK(x,y){
  if(x<50||y<50||x>WW-50||y>WH-50)return false;
  if(pointInLake(x,y)||bldAt(x,y))return false;
  return querySolidNear(x,y,9).length===0;
}
function birdSound(b){
  const sp=BIRD_SP[b.sp];if(!sp||!sp.snd||!P)return;
  if(Math.hypot(b.x-P.x,b.y-P.y)>230)return;
  const f=rnd(0.9,1.15);
  if(sp.snd==='chirp'){beep(2300*f,.05,'sine',.016,700);setTimeout(()=>beep(2900*f,.05,'sine',.014,-600),90);}
  else if(sp.snd==='coo'){beep(420*f,.16,'sine',.02,-60);}
  else if(sp.snd==='caw'){beep(760*f,.14,'sawtooth',.016,-260);}
  else if(sp.snd==='gull'){beep(1500*f,.2,'sawtooth',.014,-600);}
  else beep(900*f,.08,'triangle',.016,-250);
}
function newBird(spk,x,y,st){
  return {id:++birdSeq,sp:spk,x:x,y:y,z:0,zt:0,st:st||'ground',face:Math.random()<.5?-1:1,vx:0,vy:0,t:0,wt:rnd(0,3),peck:0,ph:Math.random()*6.28,idle:rnd(30,100),tx:x,ty:y,mv:false,leave:false,gone:0,transit:false};
}
function initBirds(){
  birds=[];birdsReady=true;
  const list=BIRD_MAP[selectedMap]||[];
  const night=dark>.66;
  for(const spk of list){
    const sp=BIRD_SP[spk];
    if(spk==='gaivota'&&!ORLA)continue;
    if(sp.soar){ // urubus rodando no céu em 2 ou 3 grupos
      const nCnt=Math.max(sp.cnt,Math.round(sp.cnt*WAREA*.7)),groups=Math.max(1,Math.round(nCnt/3));let made=0;
      for(let g=0;g<groups;g++){
        const cx=rnd(300,WW-300),cy=rnd(300,WH-300),rad=rnd(70,130),dir=Math.random()<.5?-1:1;
        const n=g===groups-1?nCnt-made:Math.ceil(nCnt/groups);
        for(let i=0;i<n;i++){
          const b=newBird(spk,cx,cy,'soar');b.cx=cx;b.cy=cy;b.rad=rad*rnd(.85,1.15);b.ang=i/n*6.283+rnd(-.3,.3);b.w=dir*rnd(.28,.4);b.z=b.zt=rnd(44,58);
          birds.push(b);made++;
        }
      }
      continue;
    }
    for(let i=0,tries=0,cnt=Math.max(sp.cnt,Math.round(sp.cnt*WAREA*.7));i<cnt&&tries<600*WAREA;tries++){
      const x=rnd(80,WW-80),y=spk==='gaivota'?orlaSand(x)+rnd(0,(orlaShore(x)-orlaSand(x))*.9):rnd(80,WH-80);   // gaivotas ficam na praia
      if(!birdOK(x,y))continue;
      if(Math.hypot(x-P.x,y-P.y)<90)continue;
      const b=newBird(spk,x,y,'ground');
      if(night){b.st='gone';b.gone=rnd(3,30);}
      birds.push(b);i++;
    }
  }
}
function birdTakeoff(b,fx,fy,leave){
  const sp=BIRD_SP[b.sp];
  const a=(fx!==undefined)?Math.atan2(b.y-fy,b.x-fx)+rnd(-.7,.7):rnd(0,6.283);
  const v=rnd(58,84)*(sp.sz>1.2?.9:1);
  b.vx=Math.cos(a)*v;b.vy=Math.sin(a)*v*.8;b.st='fly';b.z=Math.max(b.z,1);b.zt=rnd(24,44);b.t=leave?99:rnd(2.4,5.5);b.leave=!!leave;b.face=b.vx>=0?1:-1;b.mv=false;
  birdSound(b);
}
function scareBirds(x,y,r){ // barulho (tiro, explosão) espanta as aves do chão por perto
  if(MP.active&&!MP.isHost)return;
  for(const b of birds)if(b.st==='ground'&&Math.hypot(b.x-x,b.y-y)<r*.7)birdTakeoff(b,x,y);
}
function updateBirds(dt){
  if(!P||!selectedMap)return;
  if(MP.active&&!MP.isHost){updateBirdsGuest(dt);return;} // convidado só mostra o que o anfitrião simula
  if(!birdsReady)initBirds();
  const night=dark>.66,dawn=dark<.5;
  const sc=[];
  if(!P.dead)sc.push({x:P.x,y:P.y,r:P.inVehicle?(Math.abs(P.inVehicle.spd||0)>18?165:70):(P.sprint?105:(P.moving?58:22))});
  if(MP.active)for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x))sc.push({x:rp.x,y:rp.y,r:rp.inVehicle?120:(rp.sprint?105:(rp.moving?58:22))});}
  for(const z of zombies)if(!z.dead&&Math.abs(z.x-P.x)<420&&Math.abs(z.y-P.y)<420)sc.push({x:z.x,y:z.y,r:30});
  // sons ambiente de dia
  if(!night){birdChirpT-=dt;if(birdChirpT<=0){birdChirpT=rnd(6,15);const g=birds.filter(b=>b.st==='ground'&&Math.hypot(b.x-P.x,b.y-P.y)<220);if(g.length)birdSound(g[Math.floor(Math.random()*g.length)]);}}
  // bandos cruzando o céu (de dia, longe de onde ninguém vê, atravessando a tela)
  if(!night){
    flockT-=dt;
    if(flockT<=0){
      flockT=rnd(35,80);
      const fl=BIRD_FLOCK[selectedMap]||[];
      if(fl.length&&birds.filter(b=>b.transit).length<8){
        const an=birdAnchors(),AP=an[Math.floor(Math.random()*an.length)];
        const spk=fl[Math.floor(Math.random()*fl.length)],a=rnd(0,6.283),n=3+Math.floor(Math.random()*3);
        const sx=AP.x+Math.cos(a)*640,sy=AP.y+Math.sin(a)*640,lat=rnd(-130,130);
        const tx=AP.x-Math.cos(a)*640-Math.sin(a)*lat,ty=AP.y-Math.sin(a)*640+Math.cos(a)*lat;
        const dx=tx-sx,dy=ty-sy,d=Math.hypot(dx,dy),v=rnd(54,72);
        for(let i=0;i<n;i++){
          const b=newBird(spk,sx+rnd(-30,30)-Math.sin(a)*i*14,sy+rnd(-30,30)+Math.cos(a)*i*14,'fly');
          b.transit=true;b.vx=dx/d*v;b.vy=dy/d*v;b.z=b.zt=rnd(44,66);b.t=70;b.face=b.vx>=0?1:-1;b.ph=i*.7;
          birds.push(b);
        }
      }
    }
  }
  for(let i=birds.length-1;i>=0;i--){
    const b=birds[i];
    b.ph+=dt;
    if(b.transit){
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.t-=dt;
      if(b.t<=0||!birdAnchors().some(q=>Math.hypot(b.x-q.x,b.y-q.y)<=760)){birds.splice(i,1);}
      continue;
    }
    if(b.st==='gone'){
      if(!night){
        b.gone-=dt;
        if(b.gone<=0&&dawn){
          let ok=false;
          for(let k=0;k<30&&!ok;k++){
            const an=birdAnchors(),AP=an[Math.floor(Math.random()*an.length)];
            const a=rnd(0,6.283),d=rnd(380,900),x=AP.x+Math.cos(a)*d,y=AP.y+Math.sin(a)*d;
            if(!birdOK(x,y)||inAnyView(x,y,120))continue;
            b.x=x;b.y=y;ok=true;
            if(BIRD_SP[b.sp].soar){b.st='soar';b.cx=x;b.cy=y;b.rad=rnd(70,130);b.ang=rnd(0,6.283);b.w=(Math.random()<.5?-1:1)*rnd(.28,.4);b.z=b.zt=rnd(44,58);}
            else{b.st='ground';b.z=0;b.wt=rnd(0,2);}
          }
          if(!ok)b.gone=3;
        }
      }
      continue;
    }
    if(night&&b.st!=='fly'&&b.st!=='land'){ // anoitece: as aves vão embora
      if(!inAnyView(b.x,b.y,30)){b.st='gone';b.gone=rnd(5,40);continue;}
      if(b.st==='soar'){b.st='fly';b.vx=Math.cos(b.ang+1.57*Math.sign(b.w))*70;b.vy=Math.sin(b.ang+1.57*Math.sign(b.w))*60;b.leave=true;b.t=99;continue;}
      birdTakeoff(b,undefined,undefined,true);continue;
    }
    if(b.st==='soar'){
      b.ang+=b.w*dt;
      const nx=b.cx+Math.cos(b.ang)*b.rad,ny=b.cy+Math.sin(b.ang)*b.rad*.72;
      const dx=nx-b.x;if(Math.abs(dx)>.02)b.face=dx>=0?1:-1;
      b.x=nx;b.y=ny;b.z=b.zt+Math.sin(b.ph*.8)*3;
      continue;
    }
    if(b.st==='ground'){
      for(const s of sc){
        const d=Math.hypot(b.x-s.x,b.y-s.y);
        if(d<s.r){birdTakeoff(b,s.x,s.y);break;}
      }
      if(b.st!=='ground')continue;
      b.idle-=dt;
      if(b.idle<=0){b.idle=rnd(45,120);if(!night){birdTakeoff(b);continue;}}
      if(b.peck>0){b.peck-=dt;}
      else if(b.mv){
        const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy);
        if(d<2){b.mv=false;b.wt=rnd(1,3);}
        else{
          const sp=BIRD_SP[b.sp].sz>1.2?15:21,nx=b.x+dx/d*sp*dt,ny=b.y+dy/d*sp*dt;
          if(querySolidNear(nx,ny,8).length||pointInLake(nx,ny)){b.mv=false;b.wt=.4;}
          else{b.x=nx;b.y=ny;b.face=dx>=0?1:-1;}
        }
      }else{
        b.wt-=dt;
        if(b.wt<=0){
          if(Math.random()<.55){b.peck=rnd(.8,2.2);b.wt=rnd(.5,1.5);}
          else{
            for(let k=0;k<6;k++){const a=rnd(0,6.283),d=rnd(14,50),x=b.x+Math.cos(a)*d,y=b.y+Math.sin(a)*d;if(birdOK(x,y)){b.tx=x;b.ty=y;b.mv=true;break;}}
            if(!b.mv)b.wt=1;
          }
        }
      }
      continue;
    }
    if(b.st==='fly'){
      b.t-=dt;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<70&&b.vx<0)b.vx=-b.vx;if(b.x>WW-70&&b.vx>0)b.vx=-b.vx;
      if(b.y<70&&b.vy<0)b.vy=-b.vy;if(b.y>WH-70&&b.vy>0)b.vy=-b.vy;
      b.face=b.vx>=0?1:-1;
      b.z+=(b.zt-b.z)*Math.min(1,dt*2.2);
      if(b.leave){
        if(!inAnyView(b.x,b.y,50)&&night){b.st='gone';b.gone=rnd(5,40);b.z=0;}
        else if(!night){b.leave=false;b.t=1;}
      }else if(b.t<=0){
        let ok=false;
        for(let k=0;k<14&&!ok;k++){
          const x=b.x+b.vx*rnd(.5,1.3)+rnd(-40,40),y=b.y+b.vy*rnd(.5,1.3)+rnd(-40,40);
          if(birdOK(x,y)){b.tx=x;b.ty=y;ok=true;}
        }
        if(ok)b.st='land';else b.t=1.5;
      }
      continue;
    }
    if(b.st==='land'){
      const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy),v=Math.min(60,Math.max(18,d*1.4));
      if(d>1.5){b.x+=dx/d*v*dt;b.y+=dy/d*v*dt;b.face=dx>=0?1:-1;}
      b.z=Math.min(b.z,Math.max(0,d*.55));
      if(d<2.5||b.z<.4){b.st='ground';b.z=0;b.x=b.tx;b.y=b.ty;b.wt=rnd(.6,1.6);b.mv=false;}
    }
  }
}

/* Convidado: aves seguem o que o anfitrião mandou (posição suavizada); sons e animação são locais */
function updateBirdsGuest(dt){
  for(const b of birds){
    b.ph+=dt;
    const dx=(b._nx===undefined?b.x:b._nx)-b.x,dy=(b._ny===undefined?b.y:b._ny)-b.y;
    if(Math.abs(dx)+Math.abs(dy)>160){b.x=b._nx;b.y=b._ny;}
    else{const k=Math.min(1,dt*9);b.x+=dx*k;b.y+=dy*k;}
    if(b._nz!==undefined)b.z+=(b._nz-b.z)*Math.min(1,dt*9);
  }
  if(dark<=.66){birdChirpT-=dt;if(birdChirpT<=0){birdChirpT=rnd(6,15);const g=birds.filter(b=>b.st==='ground'&&Math.hypot(b.x-P.x,b.y-P.y)<220);if(g.length)birdSound(g[Math.floor(Math.random()*g.length)]);}}
}
function packBirds(){
  const an=birdAnchors(),out=[];
  for(const b of birds){
    if(b.st==='gone')continue;
    let near=false;for(const q of an)if(Math.abs(b.x-q.x)<950&&Math.abs(b.y-q.y)<950){near=true;break;}
    if(!near)continue;
    out.push([b.id,BKEYS.indexOf(b.sp),Math.round(b.x),Math.round(b.y),Math.round(b.z),BST.indexOf(b.st),(b.face>0?1:0)|(b.peck>0?2:0)|(b.mv?4:0)|(b.transit?8:0),Math.round(b.vx||0),Math.round(b.vy||0)]);
  }
  return out;
}
function applyBirds(list){
  if(!Array.isArray(list))return;
  const byId=new Map();for(const b of birds)byId.set(b.id,b);
  const next=[];
  for(const a of list){
    if(!Array.isArray(a)||a.length<9)continue;
    const spk=BKEYS[a[1]];if(!spk||!Number.isFinite(a[2])||!Number.isFinite(a[3]))continue;
    let b=byId.get(a[0]);
    if(!b){b=newBird(spk,a[2],a[3],BST[a[5]]||'ground');b.id=a[0];b.z=a[4]||0;}
    const prevSt=b.st;
    b._nx=a[2];b._ny=a[3];b._nz=a[4]||0;b.st=BST[a[5]]||'ground';
    b.face=(a[6]&1)?1:-1;b.peck=(a[6]&2)?1:0;b.mv=!!(a[6]&4);b.transit=!!(a[6]&8);b.vx=a[7];b.vy=a[8];
    if(prevSt==='ground'&&b.st==='fly'&&!b.transit)birdSound(b);
    next.push(b);
  }
  birds=next;
}
function drawBirdBody(b,x,y,air){
  const sp=BIRD_SP[b.sp],s=sp.sz*.72;   // passaro de verdade e bem menor que a pessoa (a pessoa tem uns 20 px)
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(b.face*s,s);
  if(!air){
    const hop=b.mv?-Math.abs(Math.sin(b.ph*16))*1.2:0,pk=b.peck>0?(Math.sin(b.ph*18)>0?1:0):0;
    R(-1,-2,1,2,'#7a5a3a');R(1,-2,1,2,'#7a5a3a');
    R(-4,-6+hop+pk,8,4,sp.body);R(-3,-3+hop+pk,6,2,sp.belly);
    R(-6,-6+hop+pk,3,2,sp.wing);R(-3,-6+hop+pk,5,2,sp.wing);
    if(pk||b.peck>0&&!b.mv){R(3,-5+hop+pk*2,3,3,sp.body);R(6,-4+hop+pk*2,2,1,sp.beak);R(5,-5+hop+pk*2,1,1,'#111');}
    else{R(3,-8+hop,3,3,sp.body);R(6,-7+hop,2,1,sp.beak);R(5,-7+hop,1,1,'#111');}
  }else{
    const soar=b.st==='soar';
    const ph=Math.sin(T*(soar?0:22)+b.ph*3);
    R(-3,-1,6,3,sp.body);R(-2,1,4,1,sp.belly);R(3,-2,3,3,sp.body);R(6,-1,2,1,sp.beak);R(5,-2,1,1,'#111');R(-6,0,3,2,sp.wing);
    if(soar){R(-9,-2,18,2,sp.wing);R(-8,-3,16,1,sp.wing);R(-10,-1,2,1,sp.wing);R(8,-1,2,1,sp.wing);}
    else if(ph>.33){R(-4,-7,5,6,sp.wing);R(-1,-6,2,5,sp.belly);}
    else if(ph<-.33){R(-5,1,9,4,sp.wing);R(-7,3,3,2,sp.wing);}
    else{R(-7,-2,13,2,sp.wing);}
  }
  ctx.restore();
}
function drawBirdsGround(vx0,vx1,vy0,vy1,list){
  for(const b of birds){
    if(b.st==='gone'||b.transit)continue;
    if(!((b.st==='ground'||b.st==='land')&&b.z<2))continue;
    if(b.x>vx0&&b.x<vx1&&b.y>vy0&&b.y<vy1)list.push({y:b.y,k:12,o:b});
  }
}
function drawBirdsAir(vx0,vx1,vy0,vy1){
  for(const b of birds){
    if(b.st==='gone')continue;
    if(!b.transit&&(b.st==='ground'||(b.st==='land'&&b.z<2)))continue;
    if(b.x<vx0-20||b.x>vx1+20||b.y-b.z<vy0-20||b.y-b.z>vy1+20)continue;
    const sp=BIRD_SP[b.sp];
    ctx.globalAlpha=.22*Math.max(.3,1-b.z/110);
    ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(Math.round(b.x+b.z*.25),Math.round(b.y+2),Math.max(2,3*sp.sz*(1-b.z/200)),Math.max(1,1.2*sp.sz*(1-b.z/200)),0,0,6.283);ctx.fill();
    ctx.globalAlpha=1;
    drawBirdBody(b,b.x,b.y-b.z,true);
  }
}
function updateAnimals(dt){
  if(!animals||!animals.length) return;
  // No multiplayer só o host simula; guest recebe posições no snapshot
  if(MP.active && !MP.isHost) return;
  for(const a of animals){
    if(a.dead) continue;
    a.atkCD=(a.atkCD||0)-dt;
    const _ax0=a.x,_ay0=a.y;
    const aggressive=!!ANIMAL_AGGRO[a.k];
    const prey=!!ANIMAL_PREY[a.k] || !aggressive;
    // Alvo: player local + remote (host vê os dois)
    let target=null, tDist=1e9;
    if(P&&!P.dead){ const d=Math.hypot(P.x-a.x,P.y-a.y); if(d<tDist){tDist=d;target=P;} }
    if(MP.active){
      for(const id in remotePlayers){
        const rp=remotePlayers[id];
        if(!rp||rp.alive===false||!Number.isFinite(rp.x)) continue;
        const d=Math.hypot(rp.x-a.x,rp.y-a.y);
        if(d<tDist){ tDist=d; target={x:rp.x,y:rp.y,_remote:true,id}; }
      }
    }
    if(aggressive && target && tDist<160){
      // Persegue até ~22px e para (não cola no player). Se o alvo está dirigindo, o alcance conta a partir da lataria
      let reach=tDist;
      if(target===P&&P.inVehicle){const v=vehHalf(P.inVehicle);const ex=Math.max(0,Math.abs(a.x-v.x)-v._hx),ey=Math.max(0,Math.abs(a.y-v.y)-v._hy);reach=Math.hypot(ex,ey)+10;}
      if(reach>22){
        const dx=target.x-a.x, dy=target.y-a.y, d=Math.hypot(dx,dy)||1;
        const spd=a.k==='wolf'||a.k==='dog'?48:(a.k==='boar'?38:(a.k==='scorpion'?42:36));
        a.x+=dx/d*spd*dt; a.y+=dy/d*spd*dt;
        a.face=Math.atan2(dy,dx);
      } else if(a.atkCD<=0 && !target._remote && !wallBlocks(a.x,a.y,target.x,target.y)){
        // Ataca só o player local (guest aplica via proximidade no host... host ataca local; remote toma se perto no client deles)
        a.atkCD=1.1;
        animalHurt(a.k==='boar'?12:(a.k==='wolf'?10:(a.k==='scorpion'?8:6)), 0.15);
        a.lunge=0.12;
        animalVoice(a,'attack');
      }
      // Se passou do alcance máximo, desiste
      if(tDist>200){ a.wt=0.5; }
    } else if(prey && target && tDist<110){
      // Foge, mas só até ~180 de distância — depois para (dá pra caçar)
      if(tDist<175){
        const dx=a.x-target.x, dy=a.y-target.y, d=Math.hypot(dx,dy)||1;
        const spd=a.k==='rabbit'||a.k==='crow'?68:(a.k==='deer'?52:40);
        a.x+=dx/d*spd*dt; a.y+=dy/d*spd*dt;
        a.face=Math.atan2(dy,dx);
        a.flee=0.8;
      }
    } else if(a.flee>0){
      a.flee-=dt;
      const fs=a.fsp||28;if(a.flee<=0)a.fsp=0;
      a.x+=Math.cos(a.face)*fs*dt; a.y+=Math.sin(a.face)*fs*dt;
    } else {
      a.wt-=dt;
      if(a.wt<=0){ a.wt=rnd(2,5); a.tx=clamp(a.x+rnd(-70,70),40,WW-40); a.ty=clamp(a.y+rnd(-70,70),40,WH-40); }
      const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);
      if(d>4){ a.x+=dx/d*16*dt; a.y+=dy/d*16*dt; a.face=Math.atan2(dy,dx); }
    }
    a.x=clamp(a.x,20,WW-20); a.y=clamp(a.y,20,WH-20);
    // Colisão com ambiente (árvores, pedras, paredes, veículos): anda em subpassos, sem atravessar
    const ar=a.k==='deer'||a.k==='camel'||a.k==='boar'?8:(a.k==='wolf'||a.k==='dog'?6:4);
    if(a.k==='crow'||a.k==='vulture'){pushOut(a,ar);}
    else{const mdx=a.x-_ax0,mdy=a.y-_ay0;a.x=_ax0;a.y=_ay0;stepMove(a,mdx,mdy,ar);}
    // Evita lago (não-voadores)
    if(a.k!=='crow'&&a.k!=='vulture'&&pointInLake(a.x,a.y)){
      // empurra para fora do lago
      const L=lakes[0];
      if(L){
        const dx=a.x-L.cx, dy=a.y-L.cy, d=Math.hypot(dx,dy)||1;
        let ang=Math.atan2(dy/0.92,dx); if(ang<0) ang+=6.283;
        const rr=L.r*lakeWobble(L,ang)+12;
        a.x=L.cx+Math.cos(ang)*rr;
        a.y=L.cy+Math.sin(ang)*rr*0.92;
      }
    }
  }
  animals=animals.filter(a=>!a.dead);
}
function damageAnimal(a,dmg,net){
  if(!a||a.dead) return;
  a.hp-=dmg; a.flee=1.2;
  if(MP.active&&!MP.isHost)a._predT=0.8; // convidado: mantém o dano local até o host confirmar
  for(let i=0;i<3;i++)parts.push({x:a.x,y:a.y-2,vx:rnd(-25,25),vy:rnd(-35,5),t:.3,c:'#a03030',g:1});
  addFloater(a.x,a.y-12, Math.round(dmg),'#ffb0a0');
  hitConfirm();
  animalVoice(a,'hurt');
  // Guest avisa o host pra aplicar dano de verdade
  if(MP.active && !MP.isHost){
    sendEvt('animalDmg',{x:Math.round(a.x),y:Math.round(a.y),k:a.k,dmg:dmg});
  }
  if(a.hp<=0){
    a.dead=true;
    if(!net)track('killAnimal');
    addFloater(a.x,a.y-18,'+carne','#ffa060');
    for(let i=0;i<8;i++)parts.push({x:a.x,y:a.y,vx:rnd(-35,35),vy:rnd(-45,10),t:.45,c:'#a03030',g:1});
    if(!MP.active || MP.isHost){
      items.push({t:'meat',x:a.x,y:a.y});
      if(MP.active) sendEvt('itemAdded',{t:'meat',x:a.x,y:a.y});
    }
    toast('Caçou: carne crua');
  }
}
function drawAnimal(a){
  if(a.dead) return;
  const x=a.x,y=a.y,dep=lakeDepth(x,y);
  if(dep>=.04){ctx.save();ctx.beginPath();ctx.rect(x-24,y-40,48,40+3-dep*6);ctx.clip();}   // na água só a parte de cima do bicho aparece
  shadow(x,y+2,6,3);
  ctx.save();ctx.translate(x,y);ctx.rotate(a.face||0);
  const col=
    a.k==='deer'?'#8a6a40':a.k==='rabbit'?'#c8c0b0':a.k==='boar'?'#4a3a2a':
    a.k==='wolf'?'#7a7a88':a.k==='camel'?'#c2a060':a.k==='scorpion'?'#8a6a30':
    a.k==='vulture'?'#4a4a50':a.k==='rat'?'#6a5a50':a.k==='dog'?'#9a7a50':
    a.k==='crow'?'#2a2a30':'#888';
  if(a.k==='deer'||a.k==='camel'){ R(-6,-3,12,6,col); R(4,-5,5,4,col); R(6,-8,2,4,'#5a4a30'); R(-5,-5,2,3,'#5a4a30'); R(3,2,2,3,'#5a4a30'); }
  else if(a.k==='rabbit'||a.k==='rat'){ R(-3,-2,6,4,col); R(2,-4,3,3,col); R(1,-7,1,3,col); R(3,-7,1,3,col); }
  else if(a.k==='boar'){ R(-5,-3,10,6,col); R(3,-4,4,4,col); R(5,-2,3,2,'#e0d0c0'); }
  else if(a.k==='wolf'||a.k==='dog'){ R(-5,-2,10,5,col); R(3,-4,4,4,col); R(-6,0,3,2,col); }
  else if(a.k==='scorpion'){ R(-4,-1,8,3,col); R(3,-2,3,2,col); R(5,-4,1,4,'#6a4a20'); }
  else if(a.k==='vulture'||a.k==='crow'){ R(-4,-1,8,3,col); R(-6,-3,5,2,col); R(1,-3,5,2,col); R(3,-2,3,2,'#c07040'); }
  else { R(-3,-2,6,4,col); }
  ctx.restore();
  if(dep>=.04){ctx.restore();waterSurface(x,y+3-dep*6,dep,.7);}
  // Barra de vida (vermelha, igual zumbis)
  if(a.max && (a.hp<a.max || (P && Math.hypot(P.x-x,P.y-y)<100))){
    const bw=12, ratio=clamp(a.hp/a.max,0,1);
    R(x-bw/2,y-16,bw,2,'#300000');
    R(x-bw/2,y-16,Math.max(1,bw*ratio),2,'#dd3333');
  }
}
const ZSHIRTS=['#6b4e3a','#8a8a98','#8ab0c0','#3d5a4a','#58503a'];
const ZFLESH=['#7a9a5a','#86a062','#6e9462','#8a9a6a','#789070'];
/* Aparência do zumbi: mesma função no host (spawn) e no convidado (snapshot) */
function zombieLook(kind,si){
  const t=ZTYPES[kind]||ZTYPES[0];
  const v=(si|0)%5;
  const skin=kind===9?'#d8e0ea':kind===3?'#556b2f':kind===2?'#8a5a4a':kind===4?'#7ac070':kind===5?'#6a8060':kind===6?'#c0a0a0':kind===7?'#4a7a38':kind===8?'#c05040':kind===0?ZFLESH[v]:kind===1?'#a0b070':t.color;
  const shirt=kind===9?'#f0f4f8':kind===3?'#b22222':kind===2?'#3a1a1a':kind===5?'#4a3a20':kind===6?'#7a4a7a':kind===7?'#5a4a30':kind===8?'#5a1010':kind===4?'#c8b830':kind===1?'#c0a050':ZSHIRTS[v];
  const M=ZMAP[selectedMap];                                    // cada mapa tem o seu povo de zumbis
  if(M){if(kind===0)return {skin:M.fl[v],shirt:M.sh[v]};const o=M.look&&M.look[kind];if(o)return {skin:o[0],shirt:o[1]};}
  return {skin:skin,shirt:shirt};
}
/* true se o ponto aparece (ou está quase aparecendo) na tela de algum jogador: zumbi novo nunca nasce à vista */
function inAnyView(x,y,m){
  const vw=W/Z,vh=H/Z;
  if(vw>0&&x>camX-m&&x<camX+vw+m&&y>camY-m&&y<camY+vh+m)return true;
  if(MP.active){const r=Math.hypot(vw,vh)/2+m;for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false&&Number.isFinite(rp.x)&&Math.hypot(rp.x-x,rp.y-y)<r)return true;}}
  return false;
}
function spawnZ(x,y,kind){
  if(kind===undefined) kind=pickZombieKind();
  kind=clamp(kind|0,0,ZTYPES.length-1);
  const t=ZTYPES[kind];
  const dd=dayDiff();
  const si=Math.floor(Math.random()*5), look=zombieLook(kind,si);
  const z={
    netId:(MP.active&&MP.isHost?'z'+(nextZombieNetId++):'local'+(nextZombieNetId++)),
    x,y,kind,
    hp:t.hp*dd.hp, max:t.hp*dd.hp,
    spd:t.spd*dd.spd, dmg:Math.round(t.dmg*dd.dmg), r:t.r,
    face:rnd(0,6.28),tx:x,ty:y,wt:rnd(0,3),
    cd:0,alert:0,lock:0,hit:0,anim:rnd(0,6),
    vx:0,vy:0,seen:false,losT:rnd(0,.3),
    moving:false,dead:false,lunge:0,
    screamT:kind===6?rnd(3,8):0,
    spitT:kind===4?rnd(1,3):0,
    ranged:!!t.ranged, range:t.range, crawler:!!t.crawler, screams:!!t.screams,
    bloater:!!t.bloater, berserk:!!t.berserk, yeti:!!t.yeti,
    si:si, skin:look.skin, shirt:look.shirt
  };
  zombies.push(z);return z;
}
function populate(){
  if(!P){ console.warn('[populate] chamado sem P definido — ignorado'); return; }
  if(!Array.isArray(blds) || !Array.isArray(towns)) return;
  // Mais zumbis iniciais na cidade
  const cityBonus=selectedMap==='city'?1.35:1;
  const ini=(MAPDIFF[selectedMap]||MAPDIFF.forest).init;
  // os zumbis nascem só no mapa aberto, nunca dentro das casas
  for(const t of towns){
    if(!t) continue;
    const around=Math.round(6*cityBonus);
    for(let i=0;i<around;i++)for(let k=0;k<10;k++){
      if(Math.random()>ini)break;
      const x=t.x+rnd(-280,280),y=t.y+rnd(-280,280);
      if(x<30||y<30||x>WW-30||y>WH-30||solidPoint(x,y,12)||bldNear(x,y,18))continue;
      spawnZ(x,y);break;
    }
  }
  let c=0,g=0;
  const openCap=Math.round(40*cityBonus*ini*WAREA);
  while(c<openCap&&g<600*WAREA){
    g++;
    const x=rnd(40,WW-40),y=rnd(40,WH-40);
    if(Math.hypot(x-P.x,y-P.y)<500||solidPoint(x,y,12)||bldNear(x,y,18))continue;
    spawnZ(x,y);c++;
  }
}

