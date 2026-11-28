/* ============ INTERIORES TEMATICOS, etapa 1: lojas da cidade ============
   Cada loja com letreiro ganha planta, piso e moveis do ramo (pizzaria, bar, cafe, farmacia, mercado 24h e loja de roupas).
   Roda DEPOIS que o mundo inteiro nasceu e usa so gerador proprio: nao consome o _rng, entao ruas, arvores, itens de fora etc. continuam
   iguais para a mesma semente (saves e multiplayer). Loja sem letreiro continua com o interior generico.
   Moveis sempre vistos de cima, com luz a noroeste (borda norte/oeste clara). */
(function(){
const THEME_BY_SIGN={PIZZA:'pizza',BAR:'bar',CAFE:'cafe',FARMA:'farma','24H':'market',LOJA:'boutique'};
/* [comprimento, profundidade, modo, guarda loot] (mesmo formato de FURN) */
Object.assign(FURN,{
  pcounter:[36,11,'along',1], oven:[26,20,'along',0], prep:[28,12,'along',1], pboxes:[11,11,'along',1], diner:[24,22,'free',1],
  barcounter:[46,14,'along',1], bottles:[28,8,'along',1], stool:[7,7,'free',0], pool:[36,21,'free',0], bartable:[18,18,'free',1], jukebox:[13,10,'along',0],
  cafecounter:[38,14,'along',1], pastry:[26,10,'along',1], cafetable:[16,16,'free',1],
  pharmcounter:[36,11,'along',1], medshelf:[28,8,'along',1], medisle:[28,9,'free',1],
  checkout:[28,13,'free',1], freezer:[28,13,'free',1], produce:[28,12,'along',1], drinks:[30,10,'along',1],
  clothrack:[28,10,'free',1], mannequin:[9,9,'along',0], fitting:[18,15,'along',0], display:[24,14,'free',1]
});
Object.assign(FLOOT,{
  pcounter:{food:6,water:4,ammo:1,bandage:1}, prep:{food:8,tomato:3,water:1,meat:1}, pboxes:{food:6,cloth:1}, diner:{food:5,water:3},
  'pkitchen:shelf':{food:7,water:3,tomato:2.5,potato:1,seed:1}, 'pkitchen:crate':{food:5,tomato:2,potato:1.5,wood:1},
  barcounter:{water:6,food:3,bat:1,ammo:1,bandage:1}, bottles:{water:8,bandage:1.5}, bartable:{water:4,food:2,ammo:.7},
  cafecounter:{water:5,food:5,bandage:.6}, pastry:{food:8,apple:1.5,water:1}, cafetable:{water:4,food:3}, 'cafe:bookcase':{cloth:1,food:1,water:1,bandage:1},
  pharmcounter:{bandage:6,medkit:2.5,water:1}, medshelf:{bandage:7,medkit:3,water:1}, medisle:{bandage:5,medkit:1.5,water:3,food:1},
  'pharmacy:crate':{bandage:4,medkit:2,water:2,cloth:1}, 'farma:medcab':{bandage:5,medkit:5},
  checkout:{food:3,water:3,ammo:1,bandage:1.5,backpack:.4}, freezer:{meat:3,fish:1,food:5}, produce:{apple:3,tomato:2.5,carrot:2.5,potato:2,melon:1}, drinks:{water:9,food:2},
  'market:aisle':{food:8,water:5,bandage:1.5,medkit:.4,seed:.8},
  clothrack:{cloth:8,backpack:1}, display:{cloth:6,backpack:1.2,bat:.4}, 'boutique:shelf':{cloth:6,backpack:1,bandage:1,food:1}
});
const FLOORS={pizza:'checker',bar:'barwood',cafe:'cafetile',farma:'tile2',market:'tile',boutique:'parquet'};
const BACK={pizza:[['pkitchen','tile'],['storage','conc']],bar:[['storage','conc'],['pkitchen','tile']],cafe:[['pkitchen','tile'],['storage','conc']],
  farma:[['pharmacy','tile2'],['storage','conc']],market:[['storage','conc'],['storage','conc']],boutique:[['storage','conc'],['office','carpet']]};

function shopTheme(b){
  if(selectedMap!=='city'||b.type!=='shop')return null;
  const w=window.shopSignWord&&shopSignWord(b);
  return w?THEME_BY_SIGN[w]||null:null;
}

/* ---- planta: salao grande na frente (com a porta), banheiro numa lateral e os fundos atras ---- */
function buildPlan(b,theme,lr){
  const ix=b.x+WT,iy=b.y+WT,iw=b.w-2*WT,ih=b.h-2*WT,bottom=iy+ih;
  const old=new Set(b.iw);
  walls=walls.filter(w=>!old.has(w));
  b.walls=b.walls.filter(w=>!old.has(w));
  b.iw=[];b.gaps=[];b.furn=[];b.gadj=[];delete b._ig;b._fc=null;
  const wall=q=>{if(q.w<=0||q.h<=0)return;b.iw.push(q);b.walls.push(q);walls.push(q);};
  const hasBack=ih>=92&&iw>=84,backH=hasBack?Math.round(clamp(ih*.38,40,ih-58)):0;
  const hasBath=iw>=124&&ih>=70,bathLeft=lr()<.5,bw=hasBath?Math.round(clamp(iw/2-34,32,40)):0;
  const sy=hasBack?iy+backH+IWT:iy,sh=bottom-sy;
  const salon={x:ix+(hasBath&&bathLeft?bw+IWT:0),y:sy,w:iw-(hasBath?bw+IWT:0),h:sh,k:theme,fl:FLOORS[theme]};
  const rooms=[salon];
  if(hasBath){
    const wx=bathLeft?ix+bw:ix+iw-bw-IWT;
    const g0=Math.round(sy+clamp((sh-GAPW)*(.25+lr()*.5),2,Math.max(2,sh-GAPW-2)));
    wall({x:wx,y:sy,w:IWT,h:g0-sy});wall({x:wx,y:g0+GAPW,w:IWT,h:bottom-g0-GAPW});
    b.gaps.push({x:wx+IWT/2,y:g0+GAPW/2,r:{x:wx,y:g0,w:IWT,h:GAPW},v:true});
    rooms.push({x:bathLeft?ix:wx+IWT,y:sy,w:bw,h:sh,k:'bathroom',fl:'tile'});
  }
  if(hasBack){
    const wy=iy+backH,two=iw>=112;
    const kw=two?Math.round((iw-IWT)*.58):iw,kLeft=!(hasBath&&!bathLeft);   // os fundos principais ficam do lado oposto ao banheiro
    const main={x:two&&!kLeft?ix+iw-kw:ix,y:iy,w:kw,h:backH,k:BACK[theme][0][0],fl:BACK[theme][0][1]};
    const x0=Math.max(main.x,salon.x)+4,x1=Math.min(main.x+main.w,salon.x+salon.w)-4-GAPW;
    const g0=Math.round(x0+Math.max(0,x1-x0)*(.2+lr()*.6));
    wall({x:ix,y:wy,w:g0-ix,h:IWT});wall({x:g0+GAPW,y:wy,w:ix+iw-g0-GAPW,h:IWT});
    b.gaps.push({x:g0+GAPW/2,y:wy+IWT/2,r:{x:g0,y:wy,w:GAPW,h:IWT},v:false});
    rooms.push(main);
    if(two){
      const vx=kLeft?ix+kw:ix+iw-kw-IWT,gy=Math.round(iy+(backH-GAPW)/2);
      wall({x:vx,y:iy,w:IWT,h:gy-iy});wall({x:vx,y:gy+GAPW,w:IWT,h:wy-gy-GAPW});
      b.gaps.push({x:vx+IWT/2,y:gy+GAPW/2,r:{x:vx,y:gy,w:IWT,h:GAPW},v:true});
      rooms.push({x:kLeft?vx+IWT:ix,y:iy,w:iw-kw-IWT,h:backH,k:BACK[theme][1][0],fl:BACK[theme][1][1]});
    }
  }
  const G=b.gaps;
  for(let i=0;i<G.length;i++)b.gadj[i]=[];
  for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++){
    if(!intBlocked(b,G[i].x,G[i].y,G[j].x,G[j].y)){const d=Math.hypot(G[i].x-G[j].x,G[i].y-G[j].y);b.gadj[i].push([j,d]);b.gadj[j].push([i,d]);}
  }
  for(const r of rooms)r.sd=Math.floor(lr()*997);
  b.rooms=rooms;
  return {rooms,salon,bottom};
}

/* ---- colocacao dos moveis: cada peca so entra se nao tapar porta/passagem nem criar canto inalcancavel ---- */
function placer(b,bottom,lr){
  const zones=[{x:b.doorX-4,y:bottom-30,w:b.door+8,h:32}];
  for(const g of b.gaps)zones.push({x:g.r.x-(g.v?14:0),y:g.r.y-(g.v?0:14),w:g.r.w+(g.v?28:0),h:g.r.h+(g.v?0:28)});
  const keys=[{x:b.doorX+b.door/2,y:bottom-8}];for(const g of b.gaps)keys.push({x:g.x,y:g.y});
  const baseUn=intUnreached(b,keys[0]);
  const isFree=k=>FURN[k][2]==='free';
  function tryAdd(r,f,near){
    if(f.x<r.x||f.y<r.y||f.x+f.w>r.x+r.w||f.y+f.h>r.y+r.h)return false;
    for(const z of zones)if(rectsHit(f,z,0))return false;
    for(const o of b.furn){
      if(o===near){if(rectsHit(f,o,1))return false;continue;}
      if(rectsHit(f,o,2))return false;
      if(o.room!==r)continue;
      const g=rectGap(f,o);
      if(isFree(f.k)||isFree(o.k)){if(g<12&&!(f.k==='stool'&&o.k==='stool'&&g>=3))return false;}
      else if(g>6&&g<12)return false;
    }
    b.furn.push(f);
    if(!intConnected(b,keys)||intUnreached(b,keys[0])>baseUn){b.furn.pop();return false;}
    return true;
  }
  const make=(r,k,x,y,w,h,s)=>({x:Math.round(x),y:Math.round(y),w,h,k,s,loot:!!FURN[k][3],sd:Math.floor(lr()*997),room:r});
  /* encostado numa parede; at = posicao desejada ao longo dela (0 a 1). sides: paredes em ordem de preferencia */
  function wall(r,k,sides,at){
    const d=FURN[k];
    for(const s of sides){
      const horiz=s==='t'||s==='b',w=horiz?d[0]:d[1],h=horiz?d[1]:d[0];
      const span=(horiz?r.w-w:r.h-h);if(span<0||w>r.w||h>r.h)continue;
      const want=Math.round(span*(at===undefined?lr():at));
      for(let off=0;off<=span;off+=2)for(const p of off?[want-off,want+off]:[want]){
        if(p<0||p>span)continue;
        const x=horiz?r.x+p:(s==='l'?r.x:r.x+r.w-w),y=horiz?(s==='t'?r.y:r.y+r.h-h):r.y+p;
        const f=make(r,k,x,y,w,h,s);if(tryAdd(r,f))return f;
      }
    }
    return null;
  }
  /* solto no meio: o mais perto possivel de (ax, ay), em fracao do comodo */
  function free(r,k,ax,ay){
    const d=FURN[k],c=[];
    for(const rot of [false,true]){
      const w=rot?d[1]:d[0],h=rot?d[0]:d[1];
      if(w===h&&rot)continue;
      const tx=r.x+(r.w-w)*ax,ty=r.y+(r.h-h)*ay;
      for(let y=r.y+(h>=20?3:2);y+h<=r.y+r.h-2;y+=3)for(let x=r.x+2;x+w<=r.x+r.w-2;x+=3)c.push({x,y,w,h,s:rot?'l':'t',q:Math.hypot(x-tx,y-ty)+(rot?14:0)});
    }
    c.sort((p,q)=>p.q-q.q);
    for(let i=0,n=0;i<c.length&&n<700;i++,n++){const q=c[i],f=make(r,k,q.x,q.y,q.w,q.h,q.s);if(tryAdd(r,f))return f;}
    return null;
  }
  /* banquetas do lado de dentro de um balcao encostado na parede */
  function stools(r,bar,n){
    if(!bar)return;const s=bar.s,horiz=s==='t'||s==='b',len=horiz?bar.w:bar.h;
    for(let i=0;i<n;i++){
      const p=4+i*11;if(p+7>len-2)break;
      const x=horiz?bar.x+p:(s==='l'?bar.x+bar.w+2:bar.x-9),y=horiz?(s==='t'?bar.y+bar.h+2:bar.y-9):bar.y+p;
      tryAdd(r,make(r,'stool',x,y,7,7,s),bar);
    }
  }
  return {wall,free,stools};
}

function furnish(b,theme,plan,lr){
  const P_=placer(b,plan.bottom,lr),{wall,free,stools}=P_,S=plan.salon,R_=plan.rooms;
  const side=lr()<.5?['l','r']:['r','l'],far=side[1];
  const area=S.w*S.h,many=(per,min,max)=>Math.round(clamp(area/per,min,max));
  const seats=(k,n)=>{const spots=[[.08,.55],[.92,.55],[.08,.95],[.92,.95],[.5,.4],[.3,.7],[.7,.7],[.5,.15]];for(let i=0,c=0;i<spots.length&&c<n;i++)if(free(S,k,spots[i][0],spots[i][1]))c++;};
  const back=R_.filter(r=>r!==S&&r.k!=='bathroom'),bath=R_.find(r=>r.k==='bathroom');
  if(theme==='pizza'){
    wall(S,'pcounter',['t',side[0],side[1]],.5);
    if(!back.length)wall(S,'oven',[side[0],'t',side[1]],0);
    seats('diner',many(2300,2,6));
    wall(S,'drinks',[far,side[0],'t'],.2);
    wall(S,'plant',['b'],0);wall(S,'plant',['b'],1);
  }else if(theme==='bar'){
    const bar=wall(S,'barcounter',[side[0],'t',side[1]],.25);
    stools(S,bar,4);
    free(S,'pool',.78,.55);
    wall(S,'jukebox',[far,'t','b'],.1);
    wall(S,'bottles',['t',side[0],far],.9);
    seats('bartable',many(3200,1,4));
  }else if(theme==='cafe'){
    const c=wall(S,'cafecounter',['t',side[0],side[1]],.3);
    stools(S,c,3);
    wall(S,'pastry',[side[0],'t',side[1]],.5);
    wall(S,'couch',[far,'b'],.4);
    seats('cafetable',many(2200,2,6));
    wall(S,'bookcase',[far,'t'],.9);
    wall(S,'plant',['b'],0);wall(S,'plant',['b'],1);
  }else if(theme==='farma'){
    wall(S,'pharmcounter',['t',side[0],side[1]],.5);
    wall(S,'medshelf',[side[0],'t'],.15);wall(S,'medshelf',[side[0],'t'],.8);
    wall(S,'medshelf',[far,'t'],.15);wall(S,'medcab',['t',far],.9);
    for(let i=0,n=many(5200,1,3);i<n;i++)free(S,'medisle',[.28,.72,.5][i],[.55,.55,.3][i]);
    wall(S,'bench',[far,'b'],.9);wall(S,'plant',['b'],0);
  }else if(theme==='market'){
    free(S,'checkout',.14,.88);
    wall(S,'drinks',['t',far],.1);wall(S,'drinks',['t',far],.9);
    wall(S,'produce',[far,side[0]],.7);
    free(S,'aisle',.3,.45);
    free(S,'freezer',.86,.86);
    for(let i=1,n=many(2800,2,5);i<n;i++)free(S,'aisle',[.22,.78,.22,.78,.5][i],[.35,.35,.62,.62,.3][i]);
    wall(S,'shelf',[side[0],'t'],.3);
  }else if(theme==='boutique'){
    free(S,'checkout',.86,.86);
    wall(S,'fitting',['t',side[0]],0);
    free(S,'clothrack',.25,.4);
    free(S,'display',.6,.5);
    for(let i=1,n=many(3400,2,4);i<n;i++)free(S,'clothrack',[.2,.8,.2,.8][i],[.35,.35,.75,.75][i]);
    wall(S,'fitting',['t',side[0]],.18);
    wall(S,'shelf',[side[0],'t'],.55);wall(S,'shelf',[far,'t'],.4);
    wall(S,'mannequin',['b'],.15);wall(S,'mannequin',['b'],.85);wall(S,'mannequin',[far,'t'],.9);
  }
  for(const r of back){
    if(r.k==='pkitchen'){
      if(theme==='pizza'){wall(r,'oven',['t','l','r'],.1);wall(r,'prep',['t','r','l'],.9);wall(r,'ksink',['r','l','t','b'],.2);wall(r,'fridge',['l','r','t','b'],.8);wall(r,'pboxes',['b','l','r','t'],.1);}
      else{wall(r,'stove',['t','l','r'],.1);wall(r,'ksink',['t','r','l'],.6);wall(r,'fridge',['t','l','r','b'],.95);wall(r,'prep',['l','r','b','t'],.6);}
      wall(r,'shelf',['b','r','l','t'],.9);
    }else if(r.k==='pharmacy'){
      wall(r,'medcab',['t','l','r'],.1);wall(r,'medcab',['t','l','r'],.9);wall(r,'medshelf',['l','r','b','t'],.5);wall(r,'crate',['b','r','l','t'],.9);
    }else if(r.k==='office'){
      wall(r,'desk',['t','r','l'],.5);wall(r,'locker',['l','r','b','t'],.3);wall(r,'plant',['b','r','l'],1);
    }else{
      wall(r,'shelf',['t','l','r'],.2);wall(r,'shelf',['l','r','b','t'],.7);
      wall(r,theme==='bar'?'barrel':'crate',['t','r','l','b'],.9);wall(r,theme==='bar'?'barrel':theme==='pizza'?'pboxes':'crate',['r','b','t','l'],.5);
      wall(r,theme==='bar'?'bottles':'crate',['b','r','l','t'],.2);
    }
  }
  if(bath){wall(bath,'toilet',['t','l','r'],.5);wall(bath,'sink',['b','l','r','t'],.2);}
}

/* os itens da loja (nascidos com o interior generico) mudam para os moveis novos, com o tipo que combina com o lugar */
function moveLoot(b,lr){
  const spots=b.furn.filter(f=>f.loot);
  for(const it of items){
    if(!it.h||it.x<b.x||it.x>b.x+b.w||it.y<b.y||it.y>b.y+b.h)continue;
    if(!spots.length){const r=b.rooms[0];it.x=Math.round(r.x+r.w/2);it.y=Math.round(r.y+r.h/2);continue;}
    const f=spots[Math.floor(lr()*spots.length)];
    it.x=Math.round(f.x+f.w/2+(lr()*6-3));it.y=Math.round(f.y+f.h/2+(lr()*4-2));
    if(it.t==='flashlight'||/seed/i.test(it.t))continue;   // lanterna e sementes (sorteios extras) continuam sendo o que eram
    const tb=furnLootTable(f,b);if(!tb)continue;
    let sum=0;for(const k in tb)sum+=tb[k];
    let v=lr()*sum,t=null;for(const k in tb){v-=tb[k];if(v<=0){t=k;break;}}
    if(t==='seed')t=rollSeed(posHash(it.x,it.y,7));
    if(t)it.t=t;
  }
}

function shopsTheme(){
  for(let bi=0;bi<blds.length;bi++){
    const b=blds[bi],theme=shopTheme(b);if(!theme)continue;
    const lr=mkRng(((Math.round(b.x)*211+Math.round(b.y)*89+(b.w|0)*13+(b.h|0))%99991)/99991);
    if(b._hearth){b._hearth=null;if(window.bldDropChimney)bldDropChimney(b);}
    const plan=buildPlan(b,theme,lr);
    b.theme=theme;
    furnish(b,theme,plan,lr);
    b.doors=[{bi,di:0,r:{x:b.doorX,y:b.y+b.h-WT,w:b.door,h:WT},front:1,v:0,open:0,hp:1}];
    for(const g of b.gaps)b.doors.push({bi,di:b.doors.length,r:g.r,v:g.v?1:0,open:0,hp:1});
    moveLoot(b,lr);
  }
}
/* save de antes das lojas novas: item solto que ficou dentro de uma parede interna sai para o lado */
function shopsFixItems(){
  for(const b of blds){
    if(!b.theme)continue;
    for(const it of items)for(const w of b.iw){
      if(it.x<w.x||it.x>w.x+w.w||it.y<w.y||it.y>w.y+w.h)continue;
      if(w.w>=w.h)it.y=Math.round(w.y+w.h+6);
      else it.x=Math.round(it.x<w.x+w.w/2?w.x-6:w.x+w.w+6);
    }
  }
}

/* ---- pisos ---- */
const floorBase=floorDraw;
floorDraw=function(c,r,ox,oy){
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-ox),Math.round(y-oy),w,h);};
  const grid=(s,a,b2)=>{for(let y=r.y,j=0;y<r.y+r.h;y+=s,j++)for(let x=r.x,i=0;x<r.x+r.w;x+=s,i++)R(x,y,Math.min(s,r.x+r.w-x),Math.min(s,r.y+r.h-y),(i+j)&1?b2:a);};
  if(r.fl==='checker')grid(9,'#b9a585','#8e5a48');
  else if(r.fl==='cafetile'){grid(10,'#a88a68','#9a7c5c');for(let y=r.y+9;y<r.y+r.h;y+=10)for(let x=r.x+9;x<r.x+r.w;x+=10)R(x,y,1,1,'#6e5440');}
  else if(r.fl==='barwood'){
    R(r.x,r.y,r.w,r.h,'#4a3226');
    for(let row=0,y=r.y;y<r.y+r.h;y+=5,row++){R(r.x,y,r.w,1,'#39251c');for(let x=r.x+((row*13+r.sd)%29);x<r.x+r.w;x+=29)R(x,y,1,Math.min(5,r.y+r.h-y),'#39251c');}
  }else if(r.fl==='parquet'){
    for(let y=r.y,j=0;y<r.y+r.h;y+=8,j++)for(let x=r.x,i=0;x<r.x+r.w;x+=8,i++){
      const w=Math.min(8,r.x+r.w-x),h=Math.min(8,r.y+r.h-y),v=(i+j)&1;R(x,y,w,h,v?'#9a7a56':'#8e6e4c');
      for(let k=2;k<8;k+=3){if(v){if(k<h)R(x,y+k,w,1,'#82643f');}else if(k<w)R(x+k,y,1,h,'#7c5e3c');}
    }
  }else floorBase(c,r,ox,oy);
};

/* ---- sprites vistos de cima. L(u,v,du,dv): u ao longo da parede, v para dentro do comodo (0 = encostado na parede) ---- */
const disc=(R,cx,cy,rad,col)=>{for(let j=-rad;j<=rad;j++){const k=Math.round(Math.sqrt(rad*rad-j*j+rad*.7));R(cx-k,cy+j,k*2,1,col);}};
const DRAW={
  pcounter(R,L,n){L(0,0,n.len,n.dep,'#6a2a22');L(1,1,n.len-2,n.dep-2,'#b8483a');L(1,n.dep-3,n.len-2,2,'#e8dcc0');
    L(3,2,8,6,'#2a2e34');L(4,3,6,2,'#7ac0a0');                                  // caixa registradora
    L(n.len-13,2,10,7,'#c9a066');L(n.len-12,3,8,5,'#e0bc84');L(n.len-10,4,4,3,'#a83a2a');},
  oven(R,L,n,f){const x=f.x,y=f.y,w=f.w,h=f.h;R(x,y,w,h,'#4a2a20');R(x+1,y+1,w-2,h-2,'#8a4a34');
    const cx=x+(w>>1),cy=y+(h>>1),rad=Math.min(w,h)>>1;disc(R,cx,cy,rad-2,'#a85c40');disc(R,cx-1,cy-1,rad-4,'#c4724e');disc(R,cx-2,cy-2,Math.max(1,rad-7),'#d88a62');
    L((n.len>>1)-6,n.dep-6,12,6,'#1c1210');L((n.len>>1)-4,n.dep-4,8,3,'#c8501c');L((n.len>>1)-2,n.dep-3,4,2,'#ffb030');
    L(2,2,4,4,'#2a2422');L(3,3,2,2,'#0e0c0a');},                                    // chamine
  prep(R,L,n){L(0,0,n.len,n.dep,'#6a7076');L(1,1,n.len-2,n.dep-2,'#c2c8ce');
    L(3,3,7,6,'#e8d2a0');L(4,4,5,4,'#f4e2b8');L(12,3,5,5,'#c83a2a');L(13,4,2,2,'#f06a50');L(19,3,6,3,'#7a5430');L(20,7,5,2,'#3a8a40');},
  pboxes(R,L,n,f){const x=f.x,y=f.y;R(x,y,f.w,f.h,'#8a6a40');R(x,y,f.w-2,f.h-2,'#d8b478');R(x,y,f.w-2,1,'#f0d4a0');R(x+3,y+3,4,4,'#b8402e');R(x+4,y+4,2,2,'#e8dcc0');},
  diner(R,L,n,f){const x=f.x,y=f.y,w=f.w,h=f.h,cx=x+(w>>1),cy=y+(h>>1);
    for(const [a,b2] of [[cx-3,y],[cx-3,y+h-5],[x,cy-3],[x+w-5,cy-3]]){R(a,b2,6,5,'#4e2e1c');R(a+1,b2+1,4,3,'#8a5a36');}
    R(x+4,y+4,w-8,h-8,'#7a2018');
    for(let j=y+5;j<y+h-5;j+=3)for(let i=x+5;i<x+w-5;i+=3)R(i,j,Math.min(3,x+w-5-i),Math.min(3,y+h-5-j),(((i-x-5)/3+(j-y-5)/3)&1)?'#c8392c':'#eadfd0');
    if(f.sd%3){disc(R,cx,cy,3,'#c88a3a');disc(R,cx,cy,2,'#f0c04a');R(cx-1,cy-1,1,1,'#b8301c');R(cx+1,cy,1,1,'#b8301c');R(cx,cy+1,1,1,'#3a8a40');}
    else{R(cx-3,cy-2,3,3,'#f4f4f0');R(cx+1,cy,3,3,'#f4f4f0');}},
  barcounter(R,L,n){L(0,0,n.len,4,'#2a1a12');                                       // prateleira de garrafas atras
    const g=['#3a8a52','#b87a2a','#8ac0d0','#8a2a2a','#d8c060'];for(let i=0;i<n.len-3;i+=4)L(2+i,1,2,2,g[(i/4+n.sd)%5|0]);
    L(0,5,n.len,n.dep-5,'#3a2014');L(1,6,n.len-2,n.dep-7,'#7a4628');L(1,6,n.len-2,1,'#a8663c');
    for(let i=5;i<n.len-6;i+=12){L(i,8,3,3,'#e8c050');L(i,8,3,1,'#fff4d0');}
    L(n.len-8,5,5,3,'#c8ced4');},                                                  // chopeira
  bottles(R,L,n){L(0,0,n.len,n.dep,'#3a2416');L(1,1,n.len-2,n.dep-2,'#5a3a22');
    const g=['#3a8a52','#b87a2a','#8ac0d0','#8a2a2a','#d8c060'];for(let i=0;i<n.len-4;i+=3){L(2+i,2,2,2,g[(i/3+n.sd)%5|0]);L(2+i,5,2,2,g[(i/3+n.sd+2)%5|0]);}},
  stool(R,L,n,f){const cx=f.x+3,cy=f.y+3;disc(R,cx,cy,3,'#2a1a12');disc(R,cx,cy,2,'#a83a30');R(cx-1,cy-1,2,1,'#d8685a');},
  pool(R,L,n,f){const x=f.x,y=f.y,w=f.w,h=f.h;R(x,y,w,h,'#3a2012');R(x+1,y+1,w-2,h-2,'#7a4a28');R(x+1,y+1,w-2,1,'#a86e40');R(x+3,y+3,w-6,h-6,'#1e7a48');R(x+3,y+3,w-6,1,'#145a34');
    for(const a of [x+2,x+(w>>1)-1,x+w-5])for(const b2 of [y+2,y+h-5]){if(w<h&&a!==x+2&&a!==x+w-5)continue;R(a,b2,3,3,'#0c0c0c');}
    if(w<h)for(const a of [x+2,x+w-5])R(a,y+(h>>1)-1,3,3,'#0c0c0c');
    const px=(i,j,col)=>R(x+Math.round(w*i),y+Math.round(h*j),2,2,col);
    px(.28,.46,'#f4f4f0');px(.6,.42,'#d8b030');px(.66,.52,'#c83a2a');px(.66,.34,'#2a5ac0');px(.72,.44,'#1a1a1a');
    if(w>=h)R(x+6,y+h-7,13,1,'#d8b078');else R(x+w-7,y+6,1,13,'#d8b078');},
  bartable(R,L,n,f){const cx=f.x+9,cy=f.y+9;
    for(const [a,b2] of [[cx-3,f.y],[cx-3,f.y+13],[f.x,cy-3],[f.x+13,cy-3]]){R(a,b2,5,5,'#2e1c12');R(a+1,b2+1,3,3,'#6e462a');}
    disc(R,cx,cy,5,'#3a2214');disc(R,cx,cy,4,'#8a5a34');R(cx-3,cy-2,2,2,'#e8c050');R(cx+1,cy,2,2,'#e8c050');R(cx,cy-3,1,3,'#3a8a52');},
  jukebox(R,L,n){L(0,0,n.len,n.dep,'#4a1a3a');L(1,1,n.len-2,n.dep-2,'#9a3a7a');L(3,2,n.len-6,3,'#40d0e0');L(2,n.dep-4,n.len-4,2,'#ffb43a');for(let i=3;i<n.len-3;i+=2)L(i,n.dep-4,1,2,'#4a1a3a');},
  cafecounter(R,L,n){L(0,0,n.len,n.dep,'#4a3022');L(1,1,n.len-2,n.dep-2,'#c8a878');L(1,n.dep-3,n.len-2,2,'#8a6444');
    L(3,1,12,8,'#5a6068');L(4,2,10,3,'#c8ced4');L(5,6,3,2,'#1a1c20');L(10,6,3,2,'#1a1c20');L(5,9,2,2,'#f4f4f0');   // maquina de espresso
    for(let i=0;i<3;i++){L(19+i*4,3,3,3,'#f4f4f0');L(20+i*4,4,1,1,'#5a3018');}
    L(n.len-6,2,4,6,'#7a4a28');},
  pastry(R,L,n){L(0,0,n.len,n.dep,'#5a4030');L(1,1,n.len-2,n.dep-2,'#cfe4ea');
    const g=['#c88a3a','#7a4020','#e07a8a','#e8c060'];for(let i=0;i<n.len-5;i+=5){L(2+i,2,3,3,g[(i/5+n.sd)%4|0]);L(3+i,6,3,2,g[(i/5+n.sd+1)%4|0]);}
    L(2,1,n.len-8,1,'#ffffff');},
  cafetable(R,L,n,f){const cx=f.x+8,cy=f.y+8;
    for(const [a,b2] of [[cx-3,f.y],[cx-3,f.y+11]]){R(a,b2,5,5,'#3a2618');R(a+1,b2+1,3,3,'#a87a4a');}
    disc(R,cx,cy,5,'#6a4a30');disc(R,cx,cy,4,'#e4d4b8');R(cx-3,cy-1,3,3,'#f8f8f4');R(cx-2,cy,1,1,'#6a3a1a');if(f.sd%2)R(cx+1,cy-1,3,2,'#c88a3a');},
  pharmcounter(R,L,n){L(0,0,n.len,n.dep,'#7a8a90');L(1,1,n.len-2,n.dep-2,'#eef3f4');L(1,n.dep-3,n.len-2,2,'#2f9a6a');
    const m=n.len>>1;L(m-1,2,3,7,'#2f9a6a');L(m-3,4,7,3,'#2f9a6a');L(3,2,7,5,'#2a2e34');L(4,3,5,2,'#7ac0d0');L(n.len-9,3,3,4,'#d84a4a');L(n.len-5,3,3,4,'#4a8ac0');},
  medshelf(R,L,n){L(0,0,n.len,n.dep,'#8a969c');L(1,1,n.len-2,n.dep-2,'#e6ecee');
    const g=['#d84a4a','#4a8ac0','#3aa06a','#e8a030','#f8f8f8'];for(let i=0;i<n.len-4;i+=3){L(2+i,2,2,2,g[(i/3+n.sd)%4|0]);L(2+i,5,2,2,g[(i/3+n.sd+3)%4|0]);}},
  medisle(R,L,n){DRAW.medshelf(R,L,n);L(1,n.dep>>1,n.len-2,1,'#8a969c');},
  checkout(R,L,n){L(0,0,n.len,n.dep,'#33404a');L(1,1,n.len-2,n.dep-2,'#7a8a94');L(2,3,15,7,'#1c2024');for(let i=4;i<16;i+=3)L(i,3,1,7,'#343a40');
    L(19,2,7,6,'#2a2e34');L(20,3,5,2,'#7ac0a0');L(5,5,3,3,'#d8b040');L(20,9,5,2,'#d84a4a');},
  freezer(R,L,n){L(0,0,n.len,n.dep,'#7a868e');L(1,1,n.len-2,n.dep-2,'#e4ecf0');L(3,3,n.len-6,n.dep-6,'#8ec8e0');
    const g=['#d86a5a','#e8d8a0','#7ab870','#c890b0'];for(let i=0;i<n.len-9;i+=5)L(4+i,4+(i&1),3,3,g[(i/5+n.sd)%4|0]);L(n.len>>1,3,1,n.dep-6,'#e4ecf0');L(4,3,6,1,'#d8f0fa');},
  produce(R,L,n){L(0,0,n.len,n.dep,'#5a3e22');L(1,1,n.len-2,n.dep-2,'#8a6434');
    const g=[['#c8302a','#f06a50'],['#e87a20','#ffaa50'],['#4a9a38','#7ac860'],['#c89a5a','#e0bc80']];
    for(let k=0;k<4;k++){const u=2+k*6;if(u+5>n.len)break;const q=g[(k+n.sd)%4];L(u,2,5,n.dep-4,'#3e2a16');for(let v=2;v<n.dep-3;v+=3){L(u,v,2,2,q[0]);L(u+3,v+1,2,2,q[0]);L(u,v,1,1,q[1]);}}},
  drinks(R,L,n){L(0,0,n.len,n.dep,'#4a5a66');L(1,1,n.len-2,n.dep-2,'#bcd8e4');
    const g=['#d83a3a','#3a8ad8','#e8a030','#4ab060'];for(let i=0;i<n.len-4;i+=3){L(2+i,2,2,2,g[(i/3+n.sd)%4|0]);L(2+i,5,2,2,g[(i/3+n.sd+1)%4|0]);}
    L(1,n.dep-2,n.len-2,1,'#e8f6fc');for(let i=10;i<n.len-2;i+=10)L(i,1,1,n.dep-2,'#4a5a66');},
  clothrack(R,L,n){L(0,(n.dep>>1)-1,n.len,2,'#8a9098');
    const g=['#c04a4a','#3a6ab0','#d8b040','#4a8a5a','#7a4a8a','#d8d4cc','#2e3440'];
    for(let i=2,k=0;i<n.len-3;i+=3,k++){const col=g[(k+n.sd)%g.length],v=1+(k+n.sd)%2;L(i,v,2,n.dep-2-v,col);L(i,(n.dep>>1)-1,2,1,'rgba(0,0,0,.35)');}
    L(0,1,1,n.dep-2,'#5a6068');L(n.len-1,1,1,n.dep-2,'#5a6068');},
  display(R,L,n){L(0,0,n.len,n.dep,'#5a4028');L(1,1,n.len-2,n.dep-2,'#c8a474');
    const g=['#3a6ab0','#c04a4a','#4a8a5a','#e0d8c8','#2e3440','#d8a040'];let k=n.sd;
    for(let v=2;v+4<n.dep;v+=6)for(let u=2;u+5<n.len;u+=7,k++){L(u,v,5,4,g[k%6]);L(u+1,v,3,1,'rgba(255,255,255,.4)');}},
  mannequin(R,L,n,f){const cx=f.x+4,cy=f.y+4,col=['#c04a4a','#3a6ab0','#4a8a5a','#d8b040'][f.sd%4];disc(R,cx,cy,4,'#4a3a2a');R(cx-4,cy-1,9,4,col);R(cx-4,cy-1,9,1,'rgba(255,255,255,.3)');disc(R,cx,cy,2,'#e0c8a8');},
  fitting(R,L,n){L(0,0,n.len,n.dep,'#5a4430');L(1,1,n.len-2,n.dep-2,'#7a5e44');L(2,1,n.len-4,2,'#bcd8e4');L(5,5,8,5,'#9a7a58');
    L(1,n.dep-3,n.len-2,3,'#8a2a3a');for(let i=2;i<n.len-2;i+=3)L(i,n.dep-3,1,3,'#b8485a');}
};
const furnBase=furnDraw;
furnDraw=function(c,f,ox,oy){
  const d=DRAW[f.k];if(!d)return furnBase(c,f,ox,oy);
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-ox),Math.round(y-oy),w,h);};
  const s=f.s,horiz=s==='t'||s==='b',len=horiz?f.w:f.h,dep=horiz?f.h:f.w;
  const L=(u,v,du,dv,col)=>{
    if(s==='t')R(f.x+u,f.y+v,du,dv,col);else if(s==='b')R(f.x+u,f.y+f.h-v-dv,du,dv,col);
    else if(s==='l')R(f.x+v,f.y+u,dv,du,col);else R(f.x+f.w-v-dv,f.y+u,dv,du,col);
  };
  if(f.k!=='stool'&&f.k!=='clothrack'&&f.k!=='mannequin'&&f.k!=='diner'&&f.k!=='bartable'&&f.k!=='cafetable')R(f.x+1,f.y+f.h,f.w,2,'rgba(0,0,0,.30)');
  else R(f.x+3,f.y+f.h-1,f.w-4,2,'rgba(0,0,0,.22)');
  d(R,L,{len,dep,sd:f.sd},f);
  // luz a noroeste nas pecas em bloco: fio claro ao norte/oeste, fio escuro ao sul/leste
  if(f.k!=='stool'&&f.k!=='clothrack'&&f.k!=='mannequin'&&f.k!=='diner'&&f.k!=='bartable'&&f.k!=='cafetable'){
    R(f.x,f.y,f.w,1,'rgba(255,255,255,.22)');R(f.x,f.y,1,f.h,'rgba(255,255,255,.14)');
    R(f.x,f.y+f.h-1,f.w,1,'rgba(0,0,0,.25)');R(f.x+f.w-1,f.y,1,f.h,'rgba(0,0,0,.20)');
  }
};
window.shopTheme=shopTheme;window.shopsTheme=shopsTheme;window.shopsFixItems=shopsFixItems;
})();
