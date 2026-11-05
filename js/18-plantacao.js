/* ============ PLANTACAO (enxada, canteiro, sementes, crescer, regar, colher, estufa e regras por mapa) ============
   Este arquivo roda dentro de uma funcao propria: so os nomes da lista no fim ficam visiveis para o resto do jogo.
   Canteiro = quadrado de 16 px {cx,cy,c,g,w}: c = planta (ou null se so arado), g = tempo de crescimento acumulado (s), w = umidade restante (s). */
(function(){
const CELL=16,PLOT_MAX=160,FALLOW=DAY_SECONDS;   // FALLOW: tempo que a terra arada vazia leva para voltar ao normal
/* maps: onde vinga ao ar livre (numa estufa vinga em qualquer mapa). dry: velocidade de crescimento sem agua (1 = nao liga). */
const CROPS={
  corn:  {n:'Milho',    seed:'seed_corn',  grow:1.5*DAY_SECONDS,yield:['corn',2,3],   seedBack:[1,2],maps:['forest','city','desert'],dry:.25},
  potato:{n:'Batata',   seed:'seed_potato',grow:1.2*DAY_SECONDS,yield:['potato',3,4], seedBack:[1,2],maps:['forest','city'],         dry:.35},
  melon: {n:'Melancia', seed:'seed_melon', grow:2*DAY_SECONDS,  yield:['melon',1,2],  seedBack:[1,2],maps:['desert'],                dry:.6},   // aguenta a seca do deserto
  tomato:{n:'Tomate',   seed:'seed_tomato',grow:1.2*DAY_SECONDS,yield:['tomato',3,4], seedBack:[1,2],maps:['forest','city'],         dry:.3},
  carrot:{n:'Cenoura',  seed:'seed_carrot',grow:1*DAY_SECONDS,  yield:['carrot',3,4], seedBack:[1,2],maps:['forest','city'],         dry:.35},
  /* perenes (keep): depois de colhida a planta fica e volta a dar fruto; nao devolvem semente (a semente vem de comer o fruto) */
  apple: {n:'Macieira', seed:'seed_apple', grow:3*DAY_SECONDS,  yield:['apple',3,4],  seedBack:[0,0],maps:['forest','city'],         dry:.5, keep:.65},
  berry: {n:'Arbusto de frutinhas',seed:'seed_berry',grow:1.6*DAY_SECONDS,yield:['berry',4,5],seedBack:[0,0],maps:['forest','city'],dry:.5,keep:.65},
  date:  {n:'Tamareira',seed:'seed_date',  grow:3*DAY_SECONDS,  yield:['date',4,5],   seedBack:[0,0],maps:['desert'],                dry:.7, keep:.65},
  cactus:{n:'Cacto',    seed:'seed_cactus',grow:2*DAY_SECONDS,  yield:['pricklypear',3,4],seedBack:[0,0],maps:['desert'],            dry:1,  keep:.65}   // cacto nao liga para a seca
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
  if(window.floorAt&&floorAt(Math.floor(x/CELL),Math.floor(y/CELL)))return 'Tem piso aqui: tire o piso para arar';
  if(window.bedAt&&bedAt(Math.floor(x/CELL),Math.floor(y/CELL)))return 'Tem uma cama aqui';
  if(pointInLake(x,y)||pointInLake(x+8,y)||pointInLake(x-8,y)||pointInLake(x,y+8)||pointInLake(x,y-8))return 'Não dá para arar na água';
  if(solidPoint(x,y,6))return 'Tem algo no caminho';
  if(onCityRoad(x,y,6))return 'Não dá para arar o asfalto';
  if(selectedMap==='city'&&(onCityPath(x,y)||onCityPath(x-7,y-7)||onCityPath(x+7,y+7)||onCityPath(x+7,y-7)||onCityPath(x-7,y+7)))return 'Não dá para arar o caminho';
  if(selectedMap==='city'&&ORLA&&(onSand(x,y)||onPier(x,y)))return 'Não dá para arar a orla';
  if(selectedMap==='city'&&!ghAt(x,y)&&!(inCityGarden(x,y)&&inCityGarden(x-7,y-7)&&inCityGarden(x+7,y-7)&&inCityGarden(x-7,y+7)&&inCityGarden(x+7,y+7)))return 'Na cidade só dá para arar onde tem grama (parques, lotes e quintais)';
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
  if(plots.some(p=>!p.c&&(p.e||0)>FALLOW))plots=plots.filter(p=>p.c||(p.e||0)<=FALLOW);
  const rain=weather==='rain',dry=selectedMap==='desert'?2:1;
  for(const p of plots){
    if(p.nw)p.w=Math.max(p.w,DAY_SECONDS*.5);                                  // perto do lago/oasis a terra fica sempre umida
    else if(rain&&!p.gh)p.w=Math.max(p.w,DAY_SECONDS*.6);
    else if(p.w>0)p.w=Math.max(0,p.w-dt*dry*(p.gh?.5:1));                     // na estufa a terra seca mais devagar
    if(!p.c)p.e=(p.e||0)+dt;else p.e=0;                                         // terra arada sem planta volta a ser terra depois de um tempo
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
  return out;
}
/* botao proprio da enxada: ara a casa a frente (nao disputa mais com itens, portas e camas) */
function hoeTill(quiet){
  if(!P||P.dead||P.inVehicle||P.inside||P.tool!=='hoe')return;
  const f=frontCell();
  if(plotAt(f.cx,f.cy)){if(!quiet)toast('Essa terra já está arada');return;}
  if(plots.length>=PLOT_MAX){if(!quiet)toast('Terra arada demais: plante ou espere voltar ao normal');return;}
  plotDo({act:'ARAR',cell:f,quiet});
}
function send(p){if(MP.active)sendEvt('plotSet',{cx:p.cx,cy:p.cy,c:p.c,g:Math.round(p.g),w:Math.round(p.w)});}
function puff(x,y,col,n){for(let i=0;i<n;i++)parts.push({x:x+rnd(-6,6),y:y+rnd(-3,3),vx:rnd(-24,24),vy:rnd(-40,-10),t:rnd(.3,.6),c:col});}
function plotDo(T){
  const a=T.act;
  if(a==='ARAR'){
    const f=T.cell,x=f.cx*CELL+8,y=f.cy*CELL+8,bad=soilBad(x,y);
    if(plotAt(f.cx,f.cy))return;
    if(bad){if(!T.quiet){toast(bad);beep(130,.08,'square',.04);}return;}
    const p=mark({cx:f.cx,cy:f.cy,c:null,g:0,w:0});plots.push(p);send(p);
    P.swing=Math.max(P.swing||0,.25);beep(110,.1,'triangle',.05,-30);puff(x,y,'#6a4a2c',8);
    toast('Terra arada! Plante uma semente (volta ao normal se ficar vazia)');return;
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
    give(cr.yield[0],n);if(ns>0)give(cr.seed,ns);
    if(cr.keep)p.g=cr.grow*cr.keep;else{p.c=null;p.g=0;}   // perene: continua plantada e rebrota
    send(p);
    beep(520,.08,'triangle',.05,120);puff(p.cx*CELL+8,p.cy*CELL+4,'#e8c040',9);
    toast('Colheu: '+n+' '+ITEMS[cr.yield[0]].n+(ns>0?' e '+ns+' semente'+(ns>1?'s':''):''));
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
  drawGhost();
}
/* ---- fantasma de construcao: com a enxada na mao mostra no chao a casa que sera arada (verde = pode, vermelho = nao pode) ---- */
function ghostFor(){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||P.tool!=='hoe')return null;
  const f=frontCell();
  if(plotAt(f.cx,f.cy))return null;                                   // ja arada: nada a mostrar
  const bad=plots.length>=PLOT_MAX?'Terra arada demais':soilBad(f.cx*CELL+8,f.cy*CELL+8);
  return {cx:f.cx,cy:f.cy,ok:!bad,why:bad};
}
function drawGhost(){
  const g=ghostFor();if(!g)return;
  const x=g.cx*CELL,y=g.cy*CELL,a=.55+.2*Math.sin(T*6),c=g.ok?'110,220,110':'230,90,80';
  ctx.fillStyle='rgba('+c+','+(a*.45).toFixed(2)+')';ctx.fillRect(x,y,CELL,CELL);
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  ctx.fillRect(x,y,CELL,1);ctx.fillRect(x,y+CELL-1,CELL,1);ctx.fillRect(x,y,1,CELL);ctx.fillRect(x+CELL-1,y,1,CELL);
  if(!g.ok){ctx.fillRect(x+3,y+3,2,2);ctx.fillRect(x+CELL-5,y+3,2,2);ctx.fillRect(x+CELL-5,y+CELL-5,2,2);ctx.fillRect(x+3,y+CELL-5,2,2);ctx.fillRect(x+7,y+7,2,2);}
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
  if(p.c==='tomato'){
    const lf=g1,lg=g2;
    if(st===0){R(x+3,y-2,2,2,lg);}
    else if(st===1){R(x+1,y-6,6,6,lf);R(x+3,y-8,2,2,lg);R(x+3,y-1,1,1,'#5a3a24');}
    else if(st===2){R(x+3,y-12,1,12,'#8a6a44');R(x,y-9,8,8,lf);R(x+1,y-11,6,3,lg);R(x+1,y-5,2,2,'#7ac05a');R(x+5,y-4,2,2,'#7ac05a');}
    else{R(x+3,y-12,1,12,'#8a6a44');R(x,y-10,8,9,lf);R(x+1,y-12,6,3,lg);R(x+1,y-6,3,3,'#d8402a');R(x+5,y-5,3,3,'#e8543a');R(x+2,y-2,2,2,'#d8402a');R(x+2,y-6,1,1,'#f8b0a0');}
    return;
  }
  if(p.c==='carrot'){
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x+2,y-4,1,4,g1);R(x+4,y-5,1,5,g2);R(x+5,y-3,1,3,g1);}
    else if(st===2){R(x+1,y-7,1,7,g1);R(x+3,y-9,1,9,g2);R(x+5,y-8,1,8,g1);R(x+7,y-6,1,6,g2);R(x+2,y-6,1,3,g2);}
    else{R(x+1,y-8,1,6,g1);R(x+3,y-10,1,8,g2);R(x+5,y-9,1,7,g1);R(x+7,y-7,1,5,g2);R(x+2,y-3,2,3,'#f09a2a');R(x+5,y-3,2,3,'#f09a2a');R(x+3,y-1,2,1,'#c8661a');}
    return;
  }
  if(p.c==='berry'){
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x+1,y-5,6,5,g1);R(x+2,y-6,4,1,g2);}
    else if(st===2){R(x-1,y-7,10,7,g1);R(x,y-9,8,3,g2);R(x+2,y-4,2,2,g2);}
    else{R(x-1,y-8,10,8,g1);R(x,y-10,8,3,g2);R(x,y-6,2,2,'#8a3aa8');R(x+4,y-7,2,2,'#a84cc8');R(x+7,y-4,2,2,'#8a3aa8');R(x+2,y-3,2,2,'#a84cc8');R(x+4,y-3,1,1,'#e8c8f0');}
    return;
  }
  if(p.c==='apple'){
    const x2=x+4,tk=ok?'#6a4a2a':'#7a6a40';
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x2-1,y-7,2,7,tk);R(x2-3,y-10,6,4,g1);R(x2-1,y-11,3,2,g2);}
    else if(st===2){R(x2-2,y-9,4,9,tk);R(x2-6,y-17,12,9,g1);R(x2-4,y-19,8,3,g2);R(x2-1,y-14,3,3,g2);}
    else{R(x2-2,y-9,4,9,tk);R(x2-7,y-18,14,10,g1);R(x2-5,y-20,10,3,g2);R(x2-5,y-14,2,2,'#e03a2a');R(x2+2,y-15,2,2,'#e03a2a');R(x2-1,y-11,2,2,'#e8543a');R(x2+4,y-11,2,2,'#e03a2a');R(x2-3,y-17,1,1,'#f8b0a0');}
    return;
  }
  if(p.c==='date'){
    const x2=x+4,tk=ok?'#8a6a3a':'#8a7a50',fr=ok?'#3e9a3e':'#7a9a40',fl=ok?'#5ab05a':'#a0b050';
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x2-1,y-4,2,4,tk);R(x2-4,y-7,3,2,fr);R(x2+1,y-7,3,2,fr);R(x2-1,y-8,2,2,fl);}
    else if(st===2){R(x2-1,y-10,2,10,tk);R(x2-6,y-13,5,2,fr);R(x2+1,y-13,5,2,fr);R(x2-4,y-15,3,2,fl);R(x2+1,y-15,3,2,fl);R(x2-1,y-16,2,3,fl);}
    else{R(x2-1,y-13,3,13,tk);for(let k=1;k<13;k+=3)R(x2-1,y-k,3,1,'#6a4a2a');R(x2-8,y-16,7,2,fr);R(x2+2,y-16,7,2,fr);R(x2-6,y-19,4,2,fl);R(x2+2,y-19,4,2,fl);R(x2-1,y-20,3,4,fl);R(x2-3,y-14,2,3,'#e8902a');R(x2+1,y-14,2,3,'#c8661a');R(x2-1,y-13,2,2,'#e8902a');}
    return;
  }
  if(p.c==='cactus'){
    const cg=ok?'#3a7a3a':'#6a8a40',ch=ok?'#4a9a4a':'#8aa050',x2=x+4;
    if(st===0){R(x+3,y-2,2,2,ch);}
    else if(st===1){R(x2-1,y-5,3,5,cg);R(x2-1,y-5,3,1,ch);}
    else if(st===2){R(x2-1,y-10,3,10,cg);R(x2-1,y-10,3,2,ch);R(x2-4,y-6,3,2,cg);R(x2-4,y-8,1,3,cg);}
    else{R(x2-1,y-14,3,14,cg);R(x2-1,y-14,3,2,ch);R(x2-5,y-9,4,2,cg);R(x2-5,y-12,2,4,cg);R(x2+2,y-7,4,2,cg);R(x2+5,y-10,2,4,cg);R(x2-1,y-16,3,2,'#e0407a');R(x2-5,y-14,2,2,'#e0407a');R(x2+5,y-12,2,2,'#e0407a');}
    return;
  }
  if(p.c==='melon'){
    if(st===0){R(x+3,y-2,2,2,g2);}
    else if(st===1){R(x,y-3,8,2,g1);R(x+2,y-5,2,2,g2);}
    else if(st===2){R(x-1,y-4,10,3,g1);R(x+1,y-6,3,2,g2);R(x+5,y-6,3,2,g2);R(x+3,y-3,3,3,'#3e7a2e');}
    else{R(x-1,y-4,10,3,g1);R(x+1,y-6,3,2,g2);R(x,y-8,9,8,'#3e7a2e');R(x+1,y-9,7,1,'#6fcf6f');for(let k=1;k<9;k+=2)R(x+k-0,y-7,1,6,'#6fcf6f');R(x+3,y-10,2,2,'#5a3a24');}   // melancia listrada
    return;
  }
  if(st===0){R(x+3,y-3,2,2,g2);R(x+4,y-4,1,1,g1);return;}
  /* milho: mesmo pe do milharal, cortado por altura conforme cresce (maduro tem espiga) */
  const sp=stalkSprite((p.cx+p.cy)&1,st>=3?1:0),hh=st===1?10:st===2?20:32;
  const sw=st>=3?Math.round(Math.sin(T*1.6+x*.07+y*.05)):0;
  ctx.imageSmoothingEnabled=false;
  const f0=ctx.filter;if(!ok)ctx.filter='sepia(.8)';
  ctx.drawImage(sp,0,32-hh,16,hh,x+4-8+sw,y-hh+1,16,hh);
  if(!ok)ctx.filter=f0||'none';
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
/* ---- hortas abandonadas: canteiros ja plantados e crescendo ao lado de algumas casas (fonte de comida e de sementes sem precisar de nada).
   Gerador proprio (hash da posicao da casa): nao consome o _rng do mundo, entao a geracao e o save continuam iguais. Roda no fim do genWorld.
   Floresta e cidade: horta de tomate, cenoura, batata, milho. Deserto: melancia, milho, tamareira, cacto. Neve: estufa abandonada ao lado das cabanas. ---- */
const GARDEN_CROPS={
  forest:{corn:2,potato:2,tomato:2,carrot:2,berry:1,apple:.5},
  city:{tomato:2.4,carrot:2.2,potato:2,corn:1.4,berry:1},
  desert:{melon:3,corn:2,cactus:1,date:.7},
  snow:{carrot:2,potato:2,tomato:1.6,corn:1.6,berry:1}
};
const GARDEN_CHANCE={forest:.4,city:.45,desert:.45,snow:.5};
function gardensGen(){
  plots=[];
  const map=selectedMap,table=GARDEN_CROPS[map],chance=GARDEN_CHANCE[map];if(!table||typeof blds==='undefined')return;
  const blocked=new Set();   // quadrados tocados por cerca ou parede (as cercas da cidade ja existem aqui)
  try{for(const f of fenceList()){blocked.add(f.x+','+f.y);if(f.d==='h')blocked.add(f.x+','+(f.y-1));else blocked.add((f.x-1)+','+f.y);}}catch(e){}
  const pickCrop=lr=>{let t=0;for(const k in table)t+=table[k];let r=lr()*t;for(const k in table){r-=table[k];if(r<0)return k;}return 'corn';};
  const want=map==='snow'?['cabin','house']:map==='desert'?['house','barn','cabin']:['house','cabin','barn'];
  let made=0,pl=0;
  const freeCell=(cx,cy)=>{
    if(blocked.has(cx+','+cy)||plotAt(cx,cy))return false;
    const x=cx*CELL+8,y=cy*CELL+8;
    for(const b of blds)if(x>b.x-14&&x<b.x+b.w+14&&y>b.y-14&&y<b.y+b.h+14)return false;   // folga em volta das paredes (porta e passagem)
    return map==='snow'?!pointInLake(x,y)&&!solidPoint(x,y,6)&&!onCityRoad(x,y,6):!soilBad(x,y);
  };
  const stageG=(c,lr)=>{const gr=CROPS[c].grow,r=lr();return r<.55?gr:gr*(.35+lr()*.6);};
  for(const b of blds){
    if(made>=(map==='snow'?3:12)||pl>=60)break;
    if(!want.includes(b.type))continue;
    const lr=mkRng(((Math.round(b.x)*41+Math.round(b.y)*67+(b.h|0)*5)%99991)/99991);
    if(lr()>=chance)continue;
    // horta de 3x2 quadrados (ou estufa 3x3 na neve) num dos lados da casa
    const W=3,Hh=map==='snow'?3:2;
    let spot=null;
    for(let k=0;k<14&&!spot;k++){
      const side=Math.floor(lr()*4),j=lr();
      let ax,ay;
      if(side===0){ax=b.x+b.w+10+lr()*18;ay=b.y+j*Math.max(8,b.h-Hh*CELL);}
      else if(side===1){ax=b.x-10-W*CELL-lr()*18;ay=b.y+j*Math.max(8,b.h-Hh*CELL);}
      else if(side===2){ax=b.x+j*Math.max(8,b.w-W*CELL);ay=b.y-10-Hh*CELL-lr()*14;}
      else{ax=b.x+j*Math.max(8,b.w-W*CELL);ay=b.y+b.h+10+lr()*14;}
      const cx=Math.round(ax/CELL),cy=Math.round(ay/CELL);let okc=true;
      for(let i=-1;i<=W&&okc;i++)for(let q=-1;q<=Hh&&okc;q++){
        const inside=i>=0&&i<W&&q>=0&&q<Hh;
        if(inside){if(!freeCell(cx+i,cy+q))okc=false;}
        else if(map==='snow'&&ghs.some(g=>Math.abs(g.x-(cx+i)*CELL)<GH+2&&Math.abs(g.y-(cy+q)*CELL)<GH+2))okc=false;
      }
      if(okc){const x0=cx*CELL-20,x1=(cx+W)*CELL+20,y0=cy*CELL-10,y1=(cy+Hh)*CELL+64;   // sem copa de arvore por cima da horta
        for(const t of trees)if(t.x>x0&&t.x<x1&&t.y>y0&&t.y<y1){okc=false;break;}}
      if(okc&&(cx*CELL<40||cy*CELL<40||(cx+W)*CELL>WW-40||(cy+Hh)*CELL>WH-40))okc=false;
      if(okc)spot={cx,cy};
    }
    if(!spot)continue;
    if(map==='snow'){
      ghs.push({x:spot.cx*CELL,y:spot.cy*CELL});
      for(let i=0;i<W;i++)for(let q=0;q<Hh;q++){
        if(lr()<.3)continue;   // alguns canteiros vazios (so a terra arada)
        const c=pickCrop(lr);plots.push(mark({cx:spot.cx+i,cy:spot.cy+q,c,g:stageG(c,lr),w:DAY_SECONDS*.4}));pl++;
      }
    }else{
      const rowCrop=[pickCrop(lr),pickCrop(lr)];
      for(let q=0;q<Hh;q++)for(let i=0;i<W;i++){
        if(lr()<.15)continue;
        const c=rowCrop[q];plots.push(mark({cx:spot.cx+i,cy:spot.cy+q,c,g:stageG(c,lr),w:0}));pl++;
      }
    }
    made++;
  }
  for(const g of ghs)for(const p of plots)mark(p);
  if(map==='snow')for(const p of plots)mark(p);
}
const plotAria={ARAR:'Arar a terra',PLANTAR:'Plantar semente',REGAR:'Regar',COLHER:'Colher'};

window.ghPack=ghPack;window.ghLoad=ghLoad;window.ghRemote=ghRemote;window.ghSpot=ghSpot;window.ghBuild=ghBuild;window.drawGreenhouses=drawGreenhouses;window.drawGreenhouseFrame=drawGreenhouseFrame;window.ghList=()=>ghs;window.plotList=()=>plots;
window.GREENHOUSE_OK=()=>selectedMap==='snow';   // estufa so onde nao da para arar ao ar livre
window.plantTick=plantTick;window.hoeTill=hoeTill;window.ghostFor=ghostFor;window.soilBad=soilBad;window.frontCell=frontCell;window.plotCands=plotCands;window.plotDo=plotDo;window.drawPlots=drawPlots;window.plotsInView=plotsInView;window.drawPlant=drawPlant;
window.gardensGen=gardensGen;window.plotsPack=plotsPack;window.plotsLoad=plotsLoad;window.plotRemote=plotRemote;window.plotsApplySnapshot=plotsApplySnapshot;window.plotAria=plotAria;
})();
