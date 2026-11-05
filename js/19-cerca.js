/* ============ CERCA, PORTAO, PAREDE E PORTA (estilo Minecraft: pecas separadas, bate para desmontar, nada de zumbi quebrando) ============
   Peca = pedaco de 16 px na borda entre casas da grade: {x,y,d,g,o}. d='h' (horizontal, na linha y, coluna x) ou 'v' (vertical, na linha x, fileira y).
   g=0 cerca, g=1 portao, g=2 parede de madeira (alta, bloqueia tiro, visao e golpe), g=3 porta de madeira (o=1 aberta). Portao e porta abrem e fecham com o botao de interagir.
    Ferramenta Cerca poe cerca (1 madeira rende 2 pecas); ferramenta Portao poe portao (1 madeira) ou troca uma cerca por ele.
   Quem anda bate na peca com qualquer arma para desmontar (machado e mais rapido) e recupera a madeira. Zumbi nao quebra nada.
   Tambem da para quebrar alguns objetos do mapa (bancos, caixotes, toras, placas...), menos predios, carros e coisas fundamentais.
   Este arquivo roda dentro de uma funcao propria: so os nomes da lista no fim ficam visiveis para o resto do jogo. */
(function(){
const CELL=16,FENCE_MAX=500;
const GT={fence:0,gate:1,wall:2,door:3},NAMES=['Cerca','Portão','Parede','Porta'],HP_F=[3,3,6,5];
const PIECE_COST={gate:1,wall:2,door:3};   // madeira por peca (a cerca rende 2 pecas por madeira)
const isFT=t=>t in GT,isOpenable=f=>f.g===1||f.g===3,isTall=f=>f.g>=2,gv=v=>(v===1||v===2||v===3)?v:0;
let tallN=0,tallSet=null;   // tallSet: celulas de 64 px (e vizinhas) com peca alta; descarta rapido quase todo ponto do segmento sem consultar o mapa
let fences=[];
const fkey=(x,y,d)=>d+x+','+y;
let fmap=new Map();
function reindex(){tallSet=null;fmap=new Map();tallN=0;for(const f of fences){fmap.set(fkey(f.x,f.y,f.d),f);if(isTall(f))tallN++;}}
function addPiece(f){tallSet=null;fences.push(f);fmap.set(fkey(f.x,f.y,f.d),f);if(isTall(f))tallN++;}
let remoteOp=false;   // true enquanto aplica algo vindo de outro jogador (o telhado que cair nao solta madeira de novo)
function dropPiece(f){tallSet=null;fences=fences.filter(q=>q!==f);fmap.delete(fkey(f.x,f.y,f.d));if(isTall(f)){tallN--;if(window.roofRecalc)roofRecalc(remoteOp);}}
const fenceAt=(x,y,d)=>fmap.get(fkey(x,y,d));

/* borda da grade mais perto do ponto a frente do jogador */
function frontEdge(){
  const fx=P.x+Math.cos(P.face)*12,fy=P.y+Math.sin(P.face)*12;
  const gx=Math.round(fx/CELL),gy=Math.round(fy/CELL);
  if(Math.abs(fx-gx*CELL)<Math.abs(fy-gy*CELL))return {x:gx,y:Math.floor(fy/CELL),d:'v'};
  return {x:Math.floor(fx/CELL),y:gy,d:'h'};
}
const mid=e=>e.d==='h'?{x:e.x*CELL+CELL/2,y:e.y*CELL}:{x:e.x*CELL,y:e.y*CELL+CELL/2};
function edgeBad(e){   // motivo se NAO der para por cerca ali; null se der
  const m=mid(e),ends=e.d==='h'?[[e.x*CELL,e.y*CELL],[e.x*CELL+CELL,e.y*CELL]]:[[e.x*CELL,e.y*CELL],[e.x*CELL,e.y*CELL+CELL]];
  if(m.x<24||m.y<24||m.x>WW-24||m.y>WH-24)return 'Longe demais da borda do mapa';
  if(pointInLake(m.x,m.y)||pointInLake(ends[0][0],ends[0][1])||pointInLake(ends[1][0],ends[1][1]))return 'Não dá para cercar na água';
  if(bldNear(m.x,m.y,4))return 'Perto demais de uma construção';
  if(selectedMap==='city'&&(onCityRoad(m.x,m.y,4)||(ORLA&&(onSand(m.x,m.y)||onPier(m.x,m.y)))))return 'Não dá para cercar a rua';
  if(solidPoint(m.x,m.y,3))return 'Tem algo no caminho';
  return null;
}
/* o que o botao faz na borda da frente: FENCE/GATE/WALL/DOOR poe a peca, REPLACE troca (cerca por portao, parede por porta) */
function fenceIntent(){
  const e=frontEdge(),f=fenceAt(e.x,e.y,e.d),tool=P.tool,cost=PIECE_COST[tool]||1;   // cerca: 1 madeira rende 2 pecas
  const lack=tool==='fence'?!(P._fcred>0)&&countInv('wood')<1:countInv('wood')<cost;
  if(f){
    if(f.s)return {e,act:'FIXED',bad:'Essa cerca é da cidade: bata nela para desmontar'};
    if((tool==='gate'&&f.g===0)||(tool==='door'&&f.g===2))return {e,act:'REPLACE',cost,bad:countInv('wood')<cost?'Falta madeira':null};
    return {e,act:'FIXED',bad:'Já tem '+(f.g===1?'um ':'uma ')+NAMES[f.g].toLowerCase()+' aqui (bata para desmontar)'};
  }
  const bad=fences.filter(q=>!q.s).length>=FENCE_MAX?'Construções demais':lack?'Falta madeira':edgeBad(e);
  return {e,act:{fence:'FENCE',gate:'GATE',wall:'WALL',door:'DOOR'}[tool],cost,bad};
}
function send(f,g){if(MP.active)sendEvt('fenceSet',{x:f.x,y:f.y,d:f.d,g:g,o:f.o?1:0});}
function fenceBuild(quiet){
  if(P&&CELL_TOOLS[P.tool]){if(window.cellBuild)cellBuild(quiet);return;}   // piso e telhado (modulo 20)
  if(!P||P.dead||P.inVehicle||P.inside||!isFT(P.tool))return;
  const it=fenceIntent(),e=it.e;
  if(it.bad){if(!quiet){toast(it.bad);beep(130,.08,'square',.04);}return;}
  const m=mid(e);
  if(it.act==='REPLACE'){
    removeInv('wood',it.cost);const f=fenceAt(e.x,e.y,e.d);tallSet=null;if(isTall(f))tallN--;f.g=GT[P.tool];if(isTall(f))tallN++;f.o=0;f.hp=undefined;send(f,f.g);
    beep(260,.07,'triangle',.05,60);return;
  }
  if(P.tool!=='fence')removeInv('wood',it.cost);else{if(!(P._fcred>0)){removeInv('wood',1);P._fcred=2;}P._fcred--;}
  const f={x:e.x,y:e.y,d:e.d,g:GT[P.tool],o:0};addPiece(f);send(f,f.g);
  beep(200,.06,'triangle',.05,-40);for(let i=0;i<4;i++)parts.push({x:m.x+rnd(-5,5),y:m.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-24,-6),t:.3,c:'#e8e4d8'});
}

/* ---- portinha: abre e fecha com o botao de interagir; fechada barra como a cerca, aberta deixa passar ---- */
const gateRect=f=>f.d==='h'?{x:f.x*CELL,y:f.y*CELL-2,w:CELL,h:4}:{x:f.x*CELL-2,y:f.y*CELL,w:4,h:CELL};
const solidRect=f=>f.d==='h'?{x:f.x*CELL-.5,y:f.y*CELL-(f.g>=2?2.5:1.5),w:CELL+1,h:f.g>=2?5:3}:{x:f.x*CELL-(f.g>=2?2.5:1.5),y:f.y*CELL-.5,w:f.g>=2?5:3,h:CELL+1};
function fenceGateCands(){
  const out=[];if(!P||P.dead||P.inVehicle||P.inside||!fences.length)return out;
  const cx=Math.floor(P.x/CELL),cy=Math.floor(P.y/CELL);
  for(let i=cx-2;i<=cx+3;i++)for(let j=cy-2;j<=cy+3;j++)for(const d of ['h','v']){
    const f=fmap.get(d+i+','+j);if(!f||!isOpenable(f))continue;
    const r=gateRect(f),px=clamp(P.x,r.x,r.x+r.w),py=clamp(P.y,r.y,r.y+r.h),ed=Math.max(0,Math.hypot(P.x-px,P.y-py)-P.r);
    if(ed<=12)out.push({f,ed,px,py});
  }
  return out;
}
function fenceToggle(f){
  if(!f||!isOpenable(f))return;
  f.o=f.o?0:1;send(f,f.g);
  beep(f.o?240:170,.09,'triangle',.05,f.o?60:-60);
}

/* ---- colisao: cerca fechada empurra para fora (jogador, zumbis e animais); a portinha aberta deixa passar ---- */
function fenceHit(e,r){
  if(!fences.length)return;
  const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL);
  for(let i=cx-1;i<=cx+1;i++)for(let j=cy;j<=cy+1;j++){const f=fmap.get('h'+i+','+j);if(f&&!(isOpenable(f)&&f.o))pushRect(e,r,solidRect(f));}
  for(let i=cx;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){const f=fmap.get('v'+i+','+j);if(f&&!(isOpenable(f)&&f.o))pushRect(e,r,solidRect(f));}
}

/* ---- quebrar: bater com qualquer arma desmonta cerca, portao e alguns objetos; recupera madeira ---- */
const BREAK={   // hp, madeira devolvida [min,max], som (w=madeira, s=metal/pedra)
  log:{hp:4,wood:[2,2],n:'Tora'},stump:{hp:3,wood:[1,1],n:'Toco'},frozen_log:{hp:4,wood:[2,2],n:'Tora'},
  bench:{hp:4,wood:[2,2],n:'Banco'},crate:{hp:3,wood:[1,2],n:'Caixote'},sign:{hp:2,wood:[1,1],n:'Placa'},
  barrier:{hp:5,wood:[0,0],n:'Barreira',s:1},mailbox:{hp:3,wood:[0,0],n:'Caixa de correio',s:1},trash:{hp:2,wood:[0,0],n:'Lixeira',s:1},
  cone:{hp:1,wood:[0,0],n:'Cone',s:1},snowman:{hp:2,wood:[0,0],n:'Boneco de neve'}
};
/* moveis das casas: machado para os de madeira, picareta para os de metal e louca. tool = arma exigida; hp = resistencia
   (machado tira 2 por golpe, picareta .85); mat = material devolvido [item,min,max]; n = nome */
const FBREAK={
  couch:{tool:'axe',hp:6,mat:[['cloth',2,3],['wood',1,2]],n:'Sofá'},tv:{tool:'pickaxe',hp:3,mat:[['stone',1,1]],n:'TV'},
  table:{tool:'axe',hp:5,mat:[['wood',2,3]],n:'Mesa'},bed:{tool:'axe',hp:6,mat:[['wood',2,3],['cloth',1,2]],n:'Cama'},bed2:{tool:'axe',hp:8,mat:[['wood',3,4],['cloth',2,3]],n:'Cama de casal'},
  medbed:{tool:'pickaxe',hp:5,mat:[['stone',2,2],['cloth',1,1]],n:'Maca'},bunk:{tool:'axe',hp:7,mat:[['wood',3,3],['cloth',1,1]],n:'Beliche'},
  wardrobe:{tool:'axe',hp:7,mat:[['wood',3,4]],n:'Guarda-roupa'},nightstand:{tool:'axe',hp:3,mat:[['wood',1,2]],n:'Criado-mudo'},
  shelf:{tool:'axe',hp:4,mat:[['wood',2,3]],n:'Prateleira'},counter:{tool:'axe',hp:6,mat:[['wood',2,3]],n:'Balcão'},
  fridge:{tool:'pickaxe',hp:5,mat:[['stone',2,3]],n:'Geladeira'},stove:{tool:'pickaxe',hp:5,mat:[['stone',2,3]],n:'Fogão'},
  ksink:{tool:'pickaxe',hp:4,mat:[['stone',2,2]],n:'Pia'},sink:{tool:'pickaxe',hp:4,mat:[['stone',1,2]],n:'Pia'},
  toilet:{tool:'pickaxe',hp:4,mat:[['stone',2,2]],n:'Vaso'},tub:{tool:'pickaxe',hp:6,mat:[['stone',3,3]],n:'Banheira'},
  desk:{tool:'axe',hp:5,mat:[['wood',2,3]],n:'Escrivaninha'},locker:{tool:'pickaxe',hp:4,mat:[['stone',2,2]],n:'Armário de aço'},
  medcab:{tool:'pickaxe',hp:4,mat:[['stone',2,2]],n:'Armário médico'},rack:{tool:'pickaxe',hp:5,mat:[['stone',2,3]],n:'Suporte de armas'},
  crate:{tool:'axe',hp:3,mat:[['wood',1,2]],n:'Caixote'},barrel:{tool:'axe',hp:3,mat:[['wood',1,2]],n:'Barril'},bench:{tool:'axe',hp:4,mat:[['wood',2,2]],n:'Banco'},
  workbench:{tool:'axe',hp:7,mat:[['wood',3,4]],n:'Bancada'},hay:{tool:'axe',hp:2,mat:[['cloth',1,1]],n:'Feno'},plant:{tool:'axe',hp:2,mat:[['wood',0,1]],n:'Planta'},
  bookcase:{tool:'axe',hp:5,mat:[['wood',2,3]],n:'Estante'},dresser:{tool:'axe',hp:5,mat:[['wood',2,3]],n:'Cômoda'},lamp:{tool:'axe',hp:1,mat:[['wood',0,1]],n:'Abajur'},
  pallet:{tool:'axe',hp:3,mat:[['wood',2,2]],n:'Palete'},aisle:{tool:'axe',hp:5,mat:[['wood',2,3]],n:'Gôndola'},meet:{tool:'axe',hp:8,mat:[['wood',4,4]],n:'Mesa de reunião'}
};
const FBREAK_DEF={tool:'axe',hp:4,mat:[['wood',1,2]],n:'Móvel'};
const fbOf=f=>FBREAK[f.k]||FBREAK_DEF;
const mk=(bi,f)=>'m:'+bi+','+Math.round(f.x)+','+Math.round(f.y)+','+f.k;
const broken=new Set();   // chaves das cercas da cidade e dos objetos do mapa ja destruidos (vai no save)
const fk=f=>'f:'+f.d+f.x+','+f.y,dk=d=>'d:'+d.x+','+d.y+','+d.type;
function giveWood(n,x,y){for(let i=0;i<n;i++){if(!addItem('wood')){const it={t:'wood',x:x+rnd(-5,5),y:y+rnd(-3,3)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}}}
function structTarget(w){
  if(!P||P.dead||P.inVehicle)return null;
  const reach=(w.range||18)+8;let best=null;
  const consider=(r,o,kind)=>{
    const px=clamp(P.x,r.x,r.x+r.w),py=clamp(P.y,r.y,r.y+r.h),d=Math.max(0,Math.hypot(P.x-px,P.y-py)-P.r);
    if(d>reach)return;
    if(d>3&&Math.abs(wrap(Math.atan2(py-P.y,px-P.x)-P.face))>1.35)return;   // so o que esta a frente
    if(!best||d<best.d)best={d,o,kind,x:px,y:py};
  };
  if(P.inside){   // dentro de casa: so os moveis
    if(P.inside.furn)for(const f of P.inside.furn)consider(f,f,'m');
    return best;
  }
  const cx=Math.floor(P.x/CELL),cy=Math.floor(P.y/CELL);
  for(let i=cx-3;i<=cx+4;i++)for(let j=cy-3;j<=cy+4;j++)for(const dd of ['h','v']){const f=fmap.get(dd+i+','+j);if(f)consider(gateRect(f),f,'f');}
  for(const d of decorations){
    if(!BREAK[d.type]||Math.abs(d.x-P.x)>reach+14||Math.abs(d.y-P.y)>reach+14)continue;
    consider({x:d.x-6,y:d.y-8,w:12,h:10},d,'d');
  }
  return best;
}
function furnHit(st,w){
  const f=st.o,fb=fbOf(f),b=P.inside;
  P.cd=w.cd;P.swing=.18;
  if(P.weapon!==fb.tool){toast(fb.n+': precisa de '+(fb.tool==='axe'?'machado':'picareta'));beep(150,.06,'square',.04);return;}
  if(f.hp===undefined)f.hp=fb.hp;
  f.hp-=Math.max(.5,w.chopRate||.5);shake=2;
  const metal=fb.tool==='pickaxe';
  if(metal)chopStone();else chopWood();
  for(let i=0;i<5;i++)parts.push({x:st.x,y:st.y-4,vx:rnd(-30,30),vy:rnd(-40,-5),t:.35,c:metal?'#9a9a9a':'#9a6a3a'});
  makeNoise(P.x,P.y,50);
  if(f.hp>0)return;
  const bi=blds.indexOf(b);if(bi<0)return;
  const key=mk(bi,f);
  furnRemove(b,f);broken.add(key);
  if(MP.active)sendEvt('structBreak',{k:key});
  const got=[];
  for(const m of fb.mat){const n=rint(m[1],m[2]);if(n<=0)continue;
    for(let i=0;i<n;i++){if(!addItem(m[0])){const it={t:m[0],x:f.x+f.w/2+rnd(-5,5),y:f.y+f.h/2+rnd(-3,3)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}}
    got.push(n+' '+ITEMS[m[0]].n);}
  toast(fb.n+' destruído(a)'+(got.length?'! +'+got.join(', '):''));beep(240,.14,'triangle',.08,-60);
}
function furnRemove(b,f){const i=b.furn.indexOf(f);if(i>=0)b.furn.splice(i,1);b._fc=null;}   // _fc: desenho guardado do interior
function structHit(st,w){
  if(st.kind==='m'){furnHit(st,w);return;}
  const o=st.o,hp0=st.kind==='f'?HP_F[o.g|0]:BREAK[o.type].hp;
  if(o.hp===undefined)o.hp=hp0;
  o.hp-=Math.max(.5,w.chopRate||.5);
  P.cd=w.cd;P.swing=.18;shake=2;
  const metal=st.kind==='d'&&BREAK[o.type].s;
  if(metal)chopStone();else chopWood();
  for(let i=0;i<5;i++)parts.push({x:st.x,y:st.y-4,vx:rnd(-30,30),vy:rnd(-40,-5),t:.35,c:metal?'#9a9a9a':st.kind==='f'&&o.s?'#e8e4d8':'#9a6a3a'});
  makeNoise(P.x,P.y,50);
  if(o.hp>0)return;
  const key=st.kind==='f'?fk(o):dk(o);
  let wood=0,nm='';
  if(st.kind==='f'){wood=o.g?1:((P._fbk=(P._fbk||0)+1)%2===0?1:0);nm=NAMES[o.g|0];}   // cerca: 1 madeira a cada 2 desmontadas (custou meia madeira)
  else{const b=BREAK[o.type];wood=rint(b.wood[0],b.wood[1]);nm=b.n;}
  removeKey(key);if(st.kind==='d'||o.s)broken.add(key);
  if(MP.active)sendEvt('structBreak',{k:key});
  giveWood(wood,st.x,st.y);
  toast(nm+' destruído(a)'+(wood?'! +'+wood+' Madeira':''));beep(240,.14,'triangle',.08,-60);
}
/* tira o objeto da lista (cerca da cidade, cerca do jogador ou decoracao) */
function removeKey(key){
  if(key.charAt(0)==='m'){
    const m=/^m:(\d+),(-?\d+),(-?\d+),(.+)$/.exec(key);if(!m)return;
    const b=blds[+m[1]];if(!b||!b.furn)return;
    const f=b.furn.find(q=>Math.round(q.x)===+m[2]&&Math.round(q.y)===+m[3]&&q.k===m[4]);if(f)furnRemove(b,f);
    return;
  }
  if(key.charAt(0)==='f'){
    const m=/^f:([hv])(-?\d+),(-?\d+)$/.exec(key);if(!m)return;
    const f=fenceAt(+m[2],+m[3],m[1]);if(f)dropPiece(f);
  }else{
    const m=/^d:(-?\d+),(-?\d+),(.+)$/.exec(key);if(!m)return;
    const i=decorations.findIndex(d=>d.x===+m[1]&&d.y===+m[2]&&d.type===m[3]);
    if(i>=0){decorations.splice(i,1);rebuildSolidGrid();}
  }
}
function structRemote(k){if(typeof k!=='string'||k.length>60)return;broken.add(k);remoteOp=true;try{removeKey(k);}finally{remoteOp=false;}}
function structPack(){return [...broken].slice(0,3000);}
function structLoad(a){   // depois de gerar o mundo e antes de carregar as cercas do jogador
  broken.clear();
  if(Array.isArray(a))for(const k of a)if(typeof k==='string'&&k.length<=60){broken.add(k);if(k.charAt(0)==='d'||k.charAt(0)==='m'||(k.charAt(0)==='f'&&fmap.get(k.slice(2))&&fmap.get(k.slice(2)).s))removeKey(k);}
}

/* ---- desenho ---- */
function fencesInView(vx0,vx1,vy0,vy1){return fences.filter(f=>{const x=f.x*CELL,y=f.y*CELL;return x+CELL>vx0&&x-CELL<vx1&&y+CELL>vy0-12&&y-CELL<vy1+12;});}
function fenceDepth(f){return f.d==='h'?f.y*CELL:f.y*CELL+CELL-1;}
const PAL_W=['#f2efe6','#cfc9b8','#a8a290'],PAL_B=['#9a6a3a','#7a5230','#5a3c20'];   // branca (casas da cidade) e marrom (construida pelo jogador)
function drawFence(f){
  if(f.g>=2){drawWall(f);return;}
  const x=f.x*CELL,y=f.y*CELL,WH1=(f.s?PAL_W:PAL_B)[0],WH2=(f.s?PAL_W:PAL_B)[1],WH3=(f.s?PAL_W:PAL_B)[2];
  if(f.d==='h'){
    if(!f.g){
      for(let k=0;k<4;k++){const px=x+k*4+1;R(px,y-6,2,7,WH1);R(px,y-7,2,1,WH2);R(px+1,y-6,1,7,WH2);}
      R(x,y-5,CELL,1,WH3);R(x,y-2,CELL,1,WH3);
    }else if(f.o){   // portinha aberta: so os dois postes e a folha virada para o lado
      R(x+1,y-7,2,8,WH1);R(x+CELL-3,y-7,2,8,WH1);R(x+1,y-8,2,1,WH2);R(x+CELL-3,y-8,2,1,WH2);
      R(x+1,y-13,3,6,WH2);R(x+1,y-13,1,6,WH1);R(x+3,y-12,1,5,WH3);
    }else{   // portinha: moldura com tabuas e travessa em diagonal
      R(x+1,y-7,2,8,WH1);R(x+CELL-3,y-7,2,8,WH1);R(x+1,y-8,2,1,WH2);R(x+CELL-3,y-8,2,1,WH2);
      R(x+3,y-5,CELL-6,5,WH2);R(x+3,y-5,CELL-6,1,WH1);R(x+3,y-1,CELL-6,1,WH1);
      for(let k=0;k<CELL-7;k++)R(x+3+k,y-1-((k*3/(CELL-7))|0),1,1,WH3);
      R(x+CELL-6,y-3,1,1,'#7a5a2a');
    }
  }else{
    const top=y;
    if(!f.g){
      for(let k=0;k<4;k++){const py=top+k*4+3;R(x-1,py-6,3,7,WH1);R(x-1,py-7,3,1,WH2);R(x+1,py-6,1,7,WH2);}
      R(x,top-4,1,CELL,WH3);R(x,top-1,1,CELL,WH3);
    }else if(f.o){
      R(x-1,top-5,3,3,WH1);R(x-1,top+CELL-4,3,3,WH1);
      R(x-1,top-4,7,2,WH2);R(x-1,top-4,7,1,WH1);
    }else{
      R(x-1,top-5,3,3,WH1);R(x-1,top+CELL-4,3,3,WH1);
      R(x,top-2,1,CELL-3,WH3);R(x-1,top+2,3,8,WH2);R(x-1,top+2,1,8,WH1);R(x+1,top+8,1,2,'#7a5a2a');
    }
  }
}
/* parede e porta de madeira: peca alta (14 px). Horizontal: tabuas de frente com tampo claro; vertical: coluna com tampo so na ponta de cima. */
const WH_=14,WP={top:'#c79a62',hi:'#b2814c',a:'#9a6a3a',b:'#8a5e38',seam:'#5e3e22',sh:'rgba(0,0,0,.32)',post:'#4a3018',door:'#7a5230',doorHi:'#946238'};
const isWallAt=(i,j,d)=>{const q=fmap.get(d+i+','+j);return !!q&&q.g>=2;};
function drawWall(f){
  const x=f.x*CELL,y=f.y*CELL,door=f.g===3;
  if(f.d==='h'){
    // continua reto: sem folga. Ponta solta, canto ou T: avanca 3 px (meia coluna) e cobre a coluna da parede que chega ali
    const x0=x-(isWallAt(f.x-1,f.y,'h')?0:3),x1=x+CELL+(isWallAt(f.x+1,f.y,'h')?0:3),w=x1-x0,ty=y-WH_;
    if(door&&f.o){   // aberta: dois batentes, verga e a folha virada para o lado
      R(x0,ty+1,3,WH_+2,WP.post);R(x1-3,ty+1,3,WH_+2,WP.post);R(x0,ty,w,3,WP.top);R(x0,ty+3,w,1,WP.hi);
      R(x+3,ty+5,3,WH_-4,WP.door);R(x+3,ty+5,1,WH_-4,WP.doorHi);R(x+3,y+1,3,1,WP.sh);
      return;
    }
    R(x0,ty+3,w,WH_-1,door?WP.door:WP.a);R(x0,ty,w,3,WP.top);R(x0,ty+3,w,1,WP.hi);
    if(door){R(x0,ty+3,3,WH_-1,WP.post);R(x1-3,ty+3,3,WH_-1,WP.post);R(x0+3,ty+3,w-6,1,WP.hi);for(let px=x0+6;px<x1-3;px+=4)R(px,ty+4,1,WH_-2,WP.seam);R(x1-7,ty+9,2,2,'#e0c050');}
    else{for(let px=x0+2;px<x1;px+=4){R(px,ty+4,1,WH_-2,WP.seam);if(px+1<x1)R(px+1,ty+4,1,WH_-2,WP.b);}}
    R(x0,y+1,w,1,WP.sh);
  }else{
    // a coluna so ganha topo (tampo) se for ponta solta. Se vem de cima ou sai de baixo de uma parede horizontal, comeca na linha do chao dela
    const joined=isWallAt(f.x,f.y-1,'v')||isWallAt(f.x-1,f.y,'h')||isWallAt(f.x,f.y,'h'),ty=y-WH_,x0=x-3,y0=joined?y:ty+3;
    if(door&&f.o){   // aberta: batentes no alto e embaixo e a folha aberta
      R(x0,y+CELL-3,6,3,WP.post);
      if(!joined){R(x0,ty,6,3,WP.top);R(x0+1,ty+3,4,WH_-4,WP.post);R(x0-2,ty+3,2,CELL-2,WP.door);R(x0-2,ty+3,1,CELL-2,WP.doorHi);}
      else{R(x0-2,y,2,CELL-4,WP.door);R(x0-2,y,1,CELL-4,WP.doorHi);}
      return;
    }
    R(x0,y0,6,y+CELL-y0,door?WP.door:WP.a);R(x0+3,y0,3,y+CELL-y0,door?WP.door:WP.b);
    if(!joined){R(x0,ty,6,3,WP.top);R(x0,ty+3,6,1,WP.hi);}
    if(door){R(x0,y+CELL-3,6,3,WP.post);R(x0+3,y+4,2,2,'#e0c050');if(!joined)R(x0,y-WH_+3,6,1,WP.hi);}
    else{for(let py=y-9;py<y+CELL;py+=4)if(py>=y0)R(x0,py,6,1,WP.seam);}
    R(x0,y+CELL,6,1,WP.sh);
  }
}
/* tiro, visao e golpe nao atravessam parede ou porta fechada (o resto do jogo chama isto de dentro de wallBlocks) */
function tallBuild(){
  tallSet=new Set();
  for(const f of fences){if(!isTall(f))continue;const cx=Math.floor(f.x*CELL/64),cy=Math.floor(f.y*CELL/64);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)tallSet.add((cx+i)*8192+(cy+j));}
}
function playerWallBlocks(x1,y1,x2,y2){
  if(!tallN)return false;
  if(!tallSet)tallBuild();
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),n=Math.max(1,Math.ceil(len/3));
  for(let k=0;k<=n;k++){
    const px=x1+dx*k/n,py=y1+dy*k/n;
    if(!tallSet.has(Math.floor(px/64)*8192+Math.floor(py/64)))continue;
    const gy=Math.round(py/CELL),gx=Math.round(px/CELL);
    if(Math.abs(py-gy*CELL)<=3){const f=fmap.get('h'+Math.floor(px/CELL)+','+gy);if(f&&f.g>=2&&!(f.g===3&&f.o))return true;}
    if(Math.abs(px-gx*CELL)<=3){const f=fmap.get('v'+gx+','+Math.floor(py/CELL));if(f&&f.g>=2&&!(f.g===3&&f.o))return true;}
  }
  return false;
}
/* o quadrado (cx,cy) encosta numa parede ou porta (apoio do telhado) */
function cellWalled(cx,cy){
  const t=fmap.get('h'+cx+','+cy),b=fmap.get('h'+cx+','+(cy+1)),l=fmap.get('v'+cx+','+cy),r=fmap.get('v'+(cx+1)+','+cy);
  return !!((t&&t.g>=2)||(b&&b.g>=2)||(l&&l.g>=2)||(r&&r.g>=2));
}
/* lados do quadrado (cx,cy) que tem parede ou porta: t, b, l, r (a cabeceira da cama vira para um deles) */
function cellWallDirs(cx,cy){
  const o=[],w=(d,x,y)=>{const q=fmap.get(d+x+','+y);return !!q&&q.g>=2;};
  if(w('h',cx,cy))o.push('t');if(w('h',cx,cy+1))o.push('b');if(w('v',cx,cy))o.push('l');if(w('v',cx+1,cy))o.push('r');
  return o;
}
/* abrigo montado pelo jogador: 0 = ao relento, 1 = so com telhado em cima, 2 = fechado (todo quadrado ligado a este tem telhado e
   paredes ou portas fechadas em volta; no maximo 150 quadrados). Fechado isola como um predio; so telhado protege um pouco do clima. */
let shK='',shT=0,shV=0;
function shelterAt(x,y){
  if(!window.roofAt)return 0;
  const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),k=cx+','+cy,now=performance.now();
  if(k===shK&&now-shT<400)return shV;
  shK=k;shT=now;shV=0;
  if(!roofAt(cx,cy))return shV;
  shV=1;
  if(!tallN)return shV;
  const blocked=(d,i,j)=>{const q=fmap.get(d+i+','+j);return !!q&&q.g>=2&&!(q.g===3&&q.o);};
  const seen=new Set([k]),st=[[cx,cy]];let sealed=true;
  while(st.length&&sealed){
    const c=st.pop(),i=c[0],j=c[1];
    for(const m of [['h',i,j,i,j-1],['h',i,j+1,i,j+1],['v',i,j,i-1,j],['v',i+1,j,i+1,j]]){
      if(blocked(m[0],m[1],m[2]))continue;
      const nx=m[3],ny=m[4],nk=nx+','+ny;
      if(seen.has(nk))continue;
      if(!roofAt(nx,ny)||seen.size>=150){sealed=false;break;}
      seen.add(nk);st.push([nx,ny]);
    }
  }
  if(sealed)shV=2;
  return shV;
}
window.shelterAt=shelterAt;
/* carro contra parede e porta fechada (a cerca baixa continua sem barrar carro, como antes) */
function wallsHitVehicle(cx,cy,c,s,L,W,R){
  if(!tallN)return 0;
  let n=0;const i0=Math.floor((cx-R)/CELL)-1,i1=Math.floor((cx+R)/CELL)+1,j0=Math.floor((cy-R)/CELL)-1,j1=Math.floor((cy+R)/CELL)+1;
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)for(const d of ['h','v']){
    const f=fmap.get(d+i+','+j);if(!f||f.g<2||(f.g===3&&f.o))continue;
    const r=solidRect(f);if(obbHitsRect(cx,cy,c,s,L,W,r.x,r.y,r.x+r.w,r.y+r.h))n++;
  }
  return n;
}
/* fantasma das ferramentas Cerca e Portao: verde = poe, azul = troca a cerca por portao, vermelho = nao pode */
function drawFenceGhost(){
  if(P&&CELL_TOOLS[P.tool]){if(window.drawCellGhost)drawCellGhost();return;}
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||!isFT(P.tool))return;
  const it=fenceIntent(),e=it.e,x=e.x*CELL,y=e.y*CELL,a=.6+.25*Math.sin(T*6);
  const c=it.bad?'230,90,80':it.act==='REPLACE'?'110,170,240':'110,220,110';
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  if(P.tool==='wall'||P.tool==='door'){   // volume da peca alta
    ctx.globalAlpha=.4;if(e.d==='h')ctx.fillRect(x-2,y-WH_,CELL+4,WH_+2);else ctx.fillRect(x-3,y-WH_,6,CELL+WH_);
    ctx.globalAlpha=1;if(e.d==='h'){ctx.fillRect(x-2,y-WH_,CELL+4,1);ctx.fillRect(x-2,y+1,CELL+4,1);}else{ctx.fillRect(x-3,y-WH_,6,1);ctx.fillRect(x-3,y+CELL,6,1);}
    return;
  }
  if(e.d==='h'){ctx.fillRect(x,y-1,CELL,3);ctx.fillRect(x,y-7,1,7);ctx.fillRect(x+CELL-1,y-7,1,7);}
  else{ctx.fillRect(x-1,y,3,CELL);ctx.fillRect(x-1,y-6,3,1);ctx.fillRect(x-1,y+CELL-1,3,1);}
}

/* ---- salvar, carregar e sincronizar ---- */
const pack=f=>[f.x,f.y,f.d==='h'?0:1,f.g|0,f.o?1:0];
function fencePack(){return fences.filter(f=>!f.s).map(pack);}
/* cercas da cidade (casas): fixas, brancas, nao entram no save (nascem de novo com o mundo) e ninguem mexe nelas */
function fenceCityClear(){fences=fences.filter(f=>!f.s);reindex();broken.clear();}   // (so as da cidade: sao sempre cercas baixas g 0 ou portoes g 1)
function fenceCityAdd(list){
  for(const r of list){if(fenceAt(r[0],r[1],r[2]===1?'v':'h'))continue;fences.push({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:r[3]?1:0,s:1});}
  reindex();
}
function fenceLoad(a){
  fences=fences.filter(f=>f.s);
  if(Array.isArray(a))for(const r of a){
    if(!Array.isArray(r)||!Number.isFinite(r[0])||!Number.isFinite(r[1])||fences.length>=FENCE_MAX+2000||fenceAt(Math.round(r[0]),Math.round(r[1]),r[2]===1?'v':'h'))continue;
    {const g=gv(r[3]);fences.push({x:Math.round(r[0]),y:Math.round(r[1]),d:r[2]===1?'v':'h',g:g,o:(g===1||g===3)&&r[4]?1:0});}
  }
  reindex();
}
function fenceRemote(d){remoteOp=true;try{fenceRemote_(d);}finally{remoteOp=false;}}
function fenceRemote_(d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||(d.d!=='h'&&d.d!=='v'))return;
  const f=fenceAt(d.x,d.y,d.d);
  if(f&&f.s){if(isOpenable(f)&&d.o!==undefined)f.o=d.o?1:0;return;}
  if(d.g===-1){if(f)dropPiece(f);return;}
  if(f){tallSet=null;if(isTall(f))tallN--;f.g=gv(d.g);if(isTall(f))tallN++;f.o=isOpenable(f)&&d.o?1:0;return;}
  if(fences.length>=FENCE_MAX+2000)return;
  const g=gv(d.g),n={x:Math.round(d.x),y:Math.round(d.y),d:d.d,g:g,o:(g===1||g===3)&&d.o?1:0};addPiece(n);
}
function fenceApplySnapshot(a){if(Array.isArray(a))for(const r of a)if(Array.isArray(r))fenceRemote({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:gv(r[3]),o:r[4]?1:0});}

window.cellWalled=cellWalled;window.cellWallDirs=cellWallDirs;window.playerWallBlocks=playerWallBlocks;window.wallsHitVehicle=wallsHitVehicle;window.structTarget=structTarget;window.structHit=structHit;window.structRemote=structRemote;window.structPack=structPack;window.structLoad=structLoad;window.fenceCityClear=fenceCityClear;window.fenceCityAdd=fenceCityAdd;window.fenceGateCands=fenceGateCands;window.fenceToggle=fenceToggle;window.fenceHit=fenceHit;window.fenceBuild=fenceBuild;window.fenceIntent=fenceIntent;window.fencesInView=fencesInView;window.fenceDepth=fenceDepth;window.drawFence=drawFence;window.drawFenceGhost=drawFenceGhost;
window.fencePack=fencePack;window.fenceLoad=fenceLoad;window.fenceRemote=fenceRemote;window.fenceApplySnapshot=fenceApplySnapshot;window.fenceList=()=>fences;
})();
