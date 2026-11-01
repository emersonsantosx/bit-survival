/* ============ PLANTACAO (enxada, canteiro, sementes, crescer, regar, colher, estufa e regras por mapa) ============
   Este arquivo roda dentro de uma funcao propria: so os nomes da lista no fim ficam visiveis para o resto do jogo.
   Canteiro = quadrado de 16 px {cx,cy,c,g,w}: c = planta (ou null se so arado), g = tempo de crescimento acumulado (s), w = umidade restante (s). */
(function(){
const CELL=16,PLOT_MAX=90;
/* maps: onde vinga ao ar livre (numa estufa vinga em qualquer mapa). dry: velocidade de crescimento sem agua (1 = nao liga). */
const CROPS={
  corn:  {n:'Milho',    seed:'seed_corn',  grow:1.5*DAY_SECONDS,yield:['corn',2,3],   seedBack:[1,2],maps:['forest','city','desert'],dry:.25},
  potato:{n:'Batata',   seed:'seed_potato',grow:1.2*DAY_SECONDS,yield:['potato',3,4], seedBack:[1,2],maps:['forest','city'],         dry:.35},
  melon: {n:'Melancia', seed:'seed_melon', grow:2*DAY_SECONDS,  yield:['melon',1,2],  seedBack:[1,2],maps:['desert'],                dry:.6}    // aguenta a seca do deserto
};
const MAPN={forest:'floresta',city:'cidade',desert:'deserto',snow:'neve'};
/* ---- estufas: 3x3 canteiros (48 px), alinhadas a grade; dentro dela da para plantar em qualquer mapa ---- */
let ghs=[];
const GH=CELL*3;
function ghAt(x,y){for(const g of ghs)if(x>=g.x&&x<g.x+GH&&y>=g.y&&y<g.y+GH)return g;return null;}
const SEED2CROP={};for(const k in CROPS)SEED2CROP[CROPS[k].seed]=k;
let plots=[];

/* ---- terreno: onde da para arar ---- */
function soilBad(x,y){   // texto do motivo se NAO der para arar ali; null se der
  if(selectedMap==='snow'&&!ghAt(x,y))return 'O solo está congelado demais: monte uma estufa';
  if(x<24||y<24||x>WW-24||y>WH-24)return 'Longe demais da borda do mapa';
  if(bldNear(x,y,8))return 'Perto demais de uma construção';
  if(pointInLake(x,y)||pointInLake(x+8,y)||pointInLake(x-8,y)||pointInLake(x,y+8)||pointInLake(x,y-8))return 'Não dá para arar na água';
  if(solidPoint(x,y,6))return 'Tem algo no caminho';
  if(onCityRoad(x,y,6))return 'Não dá para arar o asfalto';
  if(selectedMap==='city'&&ORLA&&(onSand(x,y)||onPier(x,y)))return 'Não dá para arar a orla';
  if(selectedMap==='city'&&!ghAt(x,y)&&!inCityGarden(x,y))return 'Na cidade só dá para arar em praças, parques e lotes vazios';
  return null;
}
const plotAt=(cx,cy)=>plots.find(p=>p.cx===cx&&p.cy===cy);
const cellOf=v=>Math.floor(v/CELL);
function frontCell(){return {cx:cellOf(P.x+Math.cos(P.face)*14),cy:cellOf(P.y+Math.sin(P.face)*14)};}
const mature=p=>!!p.c&&p.g>=CROPS[p.c].grow;
function stage(p){if(!p.c)return -1;const f=p.g/CROPS[p.c].grow;return f>=1?3:f>=.6?2:f>=.25?1:0;}
function seedInInv(){for(const s in SEED2CROP)if(countInv(s)>0)return s;return null;}
const cropOk=(c,x,y)=>CROPS[c].maps.includes(selectedMap)||!!ghAt(x,y);
function seedFor(p){   // primeira semente do inventario que vinga neste canteiro
  const x=p.cx*CELL+8,y=p.cy*CELL+8;
  for(const s in SEED2CROP)if(countInv(s)>0&&cropOk(SEED2CROP[s],x,y))return s;
  return null;
}
function nearWater(x,y){for(const l of lakes){if(l.fountain)continue;if(Math.hypot(x-l.cx,(y-l.cy)/.92)<l.r*1.08+55)return true;}return false;}
function mark(p){const x=p.cx*CELL+8,y=p.cy*CELL+8;p.nw=nearWater(x,y);p.gh=!!ghAt(x,y);return p;}

/* ---- crescimento ---- */
function plantTick(dt){
  if(!plots.length)return;
  const rain=weather==='rain',dry=selectedMap==='desert'?2:1;
  for(const p of plots){
    if(p.nw)p.w=Math.max(p.w,DAY_SECONDS*.5);                                  // perto do lago/oasis a terra fica sempre umida
    else if(rain&&!p.gh)p.w=Math.max(p.w,DAY_SECONDS*.6);
    else if(p.w>0)p.w=Math.max(0,p.w-dt*dry*(p.gh?.5:1));                     // na estufa a terra seca mais devagar
    if(p.c){const cr=CROPS[p.c];if(p.g<cr.grow)p.g=Math.min(cr.grow,p.g+dt*(p.w>0?1:cr.dry)*(p.gh?1.25:1));}   // sem agua cresce mais devagar (conforme a planta)
  }
}

/* ---- o que o botao de interagir pode fazer aqui (usado pelo pickTarget) ---- */
function plotCands(){
  const out=[];
  if(!P||P.dead||P.inVehicle||P.inside)return out;
  const seed=seedInInv(),water=countInv('water')>0;
  for(const p of plots){
    const x=p.cx*CELL,y=p.cy*CELL;
    if(Math.abs(x+8-P.x)>40||Math.abs(y+8-P.y)>40)continue;
    const px=clamp(P.x,x,x+CELL),py=clamp(P.y,y,y+CELL),ed=Math.max(0,Math.hypot(P.x-px,P.y-py)-P.r);
    if(ed>12)continue;
    let act=null;
    if(mature(p))act='COLHER';
    else if(!p.c&&seed)act='PLANTAR';
    else if(p.c&&p.w<DAY_SECONDS*.25&&water)act='REGAR';
    if(act)out.push({k:'plot',act,p,d:ed,b:-2,px:x+8,py:y+8,key:'p'+p.cx+','+p.cy+act});
  }
  if(P.weapon==='hoe'&&plots.length<PLOT_MAX){   // enxada na mao: oferece arar a casa a frente
    const f=frontCell();
    if(!plotAt(f.cx,f.cy))out.push({k:'plot',act:'ARAR',cell:f,d:4,b:3,px:f.cx*CELL+8,py:f.cy*CELL+8,key:'pt'+f.cx+','+f.cy});
  }
  return out;
}
function send(p){if(MP.active)sendEvt('plotSet',{cx:p.cx,cy:p.cy,c:p.c,g:Math.round(p.g),w:Math.round(p.w)});}
function puff(x,y,col,n){for(let i=0;i<n;i++)parts.push({x:x+rnd(-6,6),y:y+rnd(-3,3),vx:rnd(-24,24),vy:rnd(-40,-10),t:rnd(.3,.6),c:col});}
function plotDo(T){
  const a=T.act;
  if(a==='ARAR'){
    const f=T.cell,x=f.cx*CELL+8,y=f.cy*CELL+8,bad=soilBad(x,y);
    if(plotAt(f.cx,f.cy))return;
    if(bad){toast(bad);beep(130,.08,'square',.04);return;}
    const p=mark({cx:f.cx,cy:f.cy,c:null,g:0,w:0});plots.push(p);send(p);
    P.swing=Math.max(P.swing||0,.25);beep(110,.1,'triangle',.05,-30);puff(x,y,'#6a4a2c',8);
    toast('Terra arada! Plante uma semente');return;
  }
  const p=T.p;if(!p||!plots.includes(p))return;
  if(a==='PLANTAR'){
    if(p.c)return;
    const s=seedFor(p);
    if(!s){const s0=seedInInv();if(s0){const c=CROPS[SEED2CROP[s0]];toast(c.n+' não vinga aqui ('+c.maps.map(m=>MAPN[m]).join(' e ')+', ou numa estufa)');beep(130,.08,'square',.04);}return;}
    removeInv(s,1);p.c=SEED2CROP[s];p.g=0;send(p);
    beep(260,.07,'sine',.04);puff(p.cx*CELL+8,p.cy*CELL+8,'#6a4a2c',5);toast('Plantou: '+CROPS[p.c].n);
  }else if(a==='REGAR'){
    if(countInv('water')<1)return;
    removeInv('water',1);p.w=DAY_SECONDS*.9;send(p);
    beep(430,.1,'sine',.045);puff(p.cx*CELL+8,p.cy*CELL+6,'#8cc8f0',7);toast('Regou a plantação');
  }else if(a==='COLHER'){
    if(!mature(p))return;
    const cr=CROPS[p.c],got=[];
    const give=(t,n)=>{for(let i=0;i<n;i++){if(!addItem(t)){const it={t,x:p.cx*CELL+8+rnd(-6,6),y:p.cy*CELL+8+rnd(-4,4)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}}};
    const n=rint(cr.yield[1],cr.yield[2]),ns=rint(cr.seedBack[0],cr.seedBack[1]);
    give(cr.yield[0],n);give(cr.seed,ns);
    p.c=null;p.g=0;send(p);
    beep(520,.08,'triangle',.05,120);puff(p.cx*CELL+8,p.cy*CELL+4,'#e8c040',9);
    toast('Colheu: '+n+' '+ITEMS[cr.yield[0]].n+' e '+ns+' semente'+(ns>1?'s':''));
    try{track('harvest');}catch(e){}
  }
}

/* ---- desenho ---- */
function plotsInView(vx0,vx1,vy0,vy1){return plots.filter(p=>p.cx*CELL+CELL>vx0&&p.cx*CELL<vx1&&p.cy*CELL+CELL>vy0-24&&p.cy*CELL<vy1+4);}
function drawPlots(vx0,vx1,vy0,vy1){   // so o chao arado (as plantas entram na fila por profundidade, junto dos personagens)
  for(const p of plotsInView(vx0,vx1,vy0,vy1)){
    const x=p.cx*CELL,y=p.cy*CELL,wet=p.w>0;
    R(x+1,y+1,CELL-2,CELL-2,wet?'#3a2716':'#5a3d22');
    R(x+1,y+1,CELL-2,1,wet?'#4a3320':'#6a4a2c');
    for(let r=3;r<CELL-2;r+=4)R(x+2,y+r,CELL-4,1,wet?'#2a1c0e':'#46301a');
  }
}
function drawPlant(p){
  const st=stage(p);if(st<0)return;
  const x=p.cx*CELL+4,y=p.cy*CELL+CELL-1,ok=p.w>0,g1=ok?'#5aa040':'#8a9a40',g2=ok?'#7ac05a':'#a8b050';
  if(p.c==='potato'){
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x+1,y-5,6,5,g1);R(x+3,y-6,2,1,g2);}
    else if(st===2){R(x,y-8,8,8,g1);R(x+1,y-9,6,2,g2);R(x+2,y-6,2,2,g2);R(x+5,y-4,2,2,g2);}
    else{R(x,y-9,8,9,g1);R(x+1,y-10,6,2,g2);R(x+1,y-7,2,2,'#c58ad0');R(x+5,y-8,2,2,'#c58ad0');R(x+3,y-3,2,2,'#c8924e');}   // flores roxas e batata a mostra
    return;
  }
  if(p.c==='melon'){
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x,y-3,8,2,g1);R(x+2,y-5,2,2,g2);}
    else if(st===2){R(x-1,y-4,10,3,g1);R(x+1,y-6,3,2,g2);R(x+5,y-6,3,2,g2);R(x+3,y-3,3,3,'#3e7a2e');}
    else{R(x-1,y-4,10,3,g1);R(x+1,y-6,3,2,g2);R(x,y-8,9,8,'#3e7a2e');R(x+1,y-9,7,1,'#6fcf6f');for(let k=1;k<9;k+=2)R(x+k-0,y-7,1,6,'#6fcf6f');R(x+3,y-10,2,2,'#5a3a24');}   // melancia listrada
    return;
  }
  if(st===0){R(x+3,y-3,2,2,g2);R(x+4,y-4,1,1,g1);}
  else if(st===1){R(x+3,y-7,2,7,g1);R(x,y-6,3,1,g2);R(x+5,y-5,3,1,g2);}
  else if(st===2){R(x+3,y-11,2,11,g1);R(x-1,y-8,4,1,g2);R(x+5,y-9,4,1,g2);R(x,y-5,3,1,g2);R(x+5,y-4,3,1,g2);}
  else{
    R(x+3,y-15,2,15,g1);R(x-1,y-11,4,1,g2);R(x+5,y-12,4,1,g2);R(x-1,y-6,4,1,g2);R(x+5,y-7,4,1,g2);
    R(x+5,y-10,3,5,'#e8c040');R(x+5,y-10,1,5,'#c89a20');R(x+2,y-17,4,2,'#c8a860');   // espiga e pendao
  }
}
/* estufa: piso de tabuas, moldura de madeira e vidro claro (desenhada junto do chao arado) */
function drawGreenhouses(vx0,vx1,vy0,vy1){
  for(const g of ghs){
    if(g.x+GH<vx0||g.x>vx1||g.y+GH<vy0-20||g.y>vy1)continue;
    R(g.x,g.y,GH,GH,'#7a6a4a');R(g.x+1,g.y+1,GH-2,GH-2,'#8a7a58');
    for(let k=1;k<3;k++){R(g.x+k*CELL,g.y+1,1,GH-2,'#6a5a3c');R(g.x+1,g.y+k*CELL,GH-2,1,'#6a5a3c');}
  }
}
function drawGreenhouseFrame(g){   // moldura e vidro, na profundidade da borda de baixo
  ctx.fillStyle='rgba(190,235,250,.16)';ctx.fillRect(g.x,g.y,GH,GH);
  R(g.x,g.y,GH,2,'#e8e0c8');R(g.x,g.y+GH-2,GH,2,'#e8e0c8');R(g.x,g.y,2,GH,'#e8e0c8');R(g.x+GH-2,g.y,2,GH,'#e8e0c8');
  for(const c of [[g.x,g.y],[g.x+GH-3,g.y],[g.x,g.y+GH-3],[g.x+GH-3,g.y+GH-3]]){R(c[0],c[1]-6,3,9,'#8a6a44');R(c[0],c[1]-6,3,1,'#c9a54a');}
  R(g.x+2,g.y+2,GH-4,1,'rgba(255,255,255,.35)');
}

/* ---- salvar, carregar e sincronizar ---- */
const pack=p=>[p.cx,p.cy,p.c||0,Math.round(p.g),Math.round(p.w)];
function plotsPack(){return plots.map(pack);}
function plotsLoad(a){
  plots=[];
  if(!Array.isArray(a))return;
  for(const r of a){
    if(!Array.isArray(r)||!Number.isFinite(r[0])||!Number.isFinite(r[1]))continue;
    const c=CROPS[r[2]]?r[2]:null;
    plots.push(mark({cx:r[0],cy:r[1],c,g:c&&Number.isFinite(r[3])?clamp(r[3],0,CROPS[c].grow):0,w:Number.isFinite(r[4])?Math.max(0,r[4]):0}));
  }
}
function plotRemote(d){
  if(!d||!Number.isFinite(d.cx)||!Number.isFinite(d.cy)||plots.length>PLOT_MAX+10)return;
  const c=CROPS[d.c]?d.c:null;let p=plotAt(d.cx,d.cy);
  if(!p){p=mark({cx:d.cx,cy:d.cy,c:null,g:0,w:0});plots.push(p);}
  p.c=c;p.g=c&&Number.isFinite(d.g)?clamp(d.g,0,CROPS[c].grow):0;p.w=Number.isFinite(d.w)?Math.max(0,d.w):0;
}
function plotsApplySnapshot(a){if(Array.isArray(a))for(const r of a)if(Array.isArray(r))plotRemote({cx:r[0],cy:r[1],c:r[2]||null,g:r[3],w:r[4]});}
function ghPack(){return ghs.map(g=>[g.x,g.y]);}
function ghLoad(a){
  ghs=[];
  if(Array.isArray(a))for(const r of a)if(Array.isArray(r)&&Number.isFinite(r[0])&&Number.isFinite(r[1])&&ghs.length<20)ghs.push({x:Math.round(r[0]),y:Math.round(r[1])});
  for(const p of plots)mark(p);
}
function ghRemote(d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||ghs.length>=20||ghs.some(g=>g.x===d.x&&g.y===d.y))return;
  ghs.push({x:Math.round(d.x),y:Math.round(d.y)});for(const p of plots)mark(p);
}
/* acha onde montar a estufa: a frente do jogador, alinhada aos canteiros, em chao livre e sem tocar outra estufa */
function ghSpot(){
  if(P.inside||bldAt(P.x,P.y))return null;
  for(const d of [34,46,58]){
    for(const da of [0,.5,-.5,1,-1]){
      const a=(P.face||0)+da,cx=cellOf(P.x+Math.cos(a)*d)-1,cy=cellOf(P.y+Math.sin(a)*d)-1,x=cx*CELL,y=cy*CELL;
      if(x<40||y<40||x+GH>WW-40||y+GH>WH-40)continue;
      let bad=false;
      for(let i=0;i<=3&&!bad;i++)for(let j=0;j<=3&&!bad;j++){const px=x+i*CELL,py=y+j*CELL;if(pointInLake(px,py)||solidPoint(px,py,4)||bldNear(px,py,6)||(selectedMap==='city'&&onCityRoad(px,py,4)))bad=true;}
      if(bad)continue;
      if(ghs.some(g=>Math.abs(g.x-x)<GH+2&&Math.abs(g.y-y)<GH+2))continue;
      if(plots.some(p=>p.cx*CELL>=x-CELL&&p.cx*CELL<=x+GH&&p.cy*CELL>=y-CELL&&p.cy*CELL<=y+GH))continue;
      return {x,y};
    }
  }
  return null;
}
function ghBuild(sp){
  const g={x:sp.x,y:sp.y};ghs.push(g);for(const p of plots)mark(p);
  if(MP.active)sendEvt('ghAdd',{x:g.x,y:g.y});
  for(let i=0;i<12;i++)parts.push({x:g.x+rnd(0,GH),y:g.y+GH-rnd(0,8),vx:rnd(-20,20),vy:rnd(-30,-8),t:.5,c:i%2?'#e8e0c8':'#bfe8f4'});
}
const plotAria={ARAR:'Arar a terra',PLANTAR:'Plantar semente',REGAR:'Regar',COLHER:'Colher'};

window.ghPack=ghPack;window.ghLoad=ghLoad;window.ghRemote=ghRemote;window.ghSpot=ghSpot;window.ghBuild=ghBuild;window.drawGreenhouses=drawGreenhouses;window.drawGreenhouseFrame=drawGreenhouseFrame;window.ghList=()=>ghs;window.plotList=()=>plots;
window.plantTick=plantTick;window.plotCands=plotCands;window.plotDo=plotDo;window.drawPlots=drawPlots;window.plotsInView=plotsInView;window.drawPlant=drawPlant;
window.plotsPack=plotsPack;window.plotsLoad=plotsLoad;window.plotRemote=plotRemote;window.plotsApplySnapshot=plotsApplySnapshot;window.plotAria=plotAria;
})();
