/* ============ CERCA E PORTAO (estilo Minecraft: pecas separadas, bate para desmontar, nada de zumbi quebrando) ============
   Peca = pedaco de 16 px na borda entre casas da grade: {x,y,d,g,o}. d='h' (horizontal, na linha y, coluna x) ou 'v' (vertical, na linha x, fileira y).
   g=0 cerca, g=1 portao (o=1 aberto). Ferramenta Cerca poe cerca (1 madeira); ferramenta Portao poe portao (2 madeiras) ou troca uma cerca por ele.
   Quem anda bate na peca com qualquer arma para desmontar (machado e mais rapido) e recupera a madeira. Zumbi nao quebra nada.
   Tambem da para quebrar alguns objetos do mapa (bancos, caixotes, toras, placas...), menos predios, carros e coisas fundamentais.
   Este arquivo roda dentro de uma funcao propria: so os nomes da lista no fim ficam visiveis para o resto do jogo. */
(function(){
const CELL=16,FENCE_MAX=400;
let fences=[];
const fkey=(x,y,d)=>d+x+','+y;
let fmap=new Map();
function reindex(){fmap=new Map();for(const f of fences)fmap.set(fkey(f.x,f.y,f.d),f);}
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
/* o que o botao faz na borda da frente: FENCE poe cerca, GATE poe portao, REPLACE troca a cerca por portao */
function fenceIntent(){
  const e=frontEdge(),f=fenceAt(e.x,e.y,e.d),gateTool=P.weapon==='gate',cost=gateTool?2:1;
  if(f){
    if(f.s)return {e,act:'FIXED',bad:'Essa cerca é da cidade: bata nela para desmontar'};
    if(gateTool&&!f.g)return {e,act:'REPLACE',cost,bad:countInv('wood')<cost?'Falta madeira':null};
    return {e,act:'FIXED',bad:f.g?'Já tem um portão aqui (bata para desmontar)':'Já tem uma cerca aqui (bata para desmontar)'};
  }
  const bad=fences.filter(q=>!q.s).length>=FENCE_MAX?'Cercas demais':countInv('wood')<cost?'Falta madeira':edgeBad(e);
  return {e,act:gateTool?'GATE':'FENCE',cost,bad};
}
function send(f,g){if(MP.active)sendEvt('fenceSet',{x:f.x,y:f.y,d:f.d,g,o:f.o?1:0});}
function fenceBuild(quiet){
  if(!P||P.dead||P.inVehicle||P.inside||(P.weapon!=='fence'&&P.weapon!=='gate'))return;
  const it=fenceIntent(),e=it.e;
  if(it.bad){if(!quiet){toast(it.bad);beep(130,.08,'square',.04);}return;}
  const m=mid(e);
  if(it.act==='REPLACE'){
    removeInv('wood',it.cost);const f=fenceAt(e.x,e.y,e.d);f.g=1;f.o=0;f.hp=undefined;send(f,1);addItem('wood');   // a cerca trocada devolve 1 madeira
    beep(260,.07,'triangle',.05,60);return;
  }
  removeInv('wood',it.cost);const f={x:e.x,y:e.y,d:e.d,g:it.act==='GATE'?1:0,o:0};fences.push(f);fmap.set(fkey(f.x,f.y,f.d),f);send(f,f.g);
  beep(200,.06,'triangle',.05,-40);for(let i=0;i<4;i++)parts.push({x:m.x+rnd(-5,5),y:m.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-24,-6),t:.3,c:'#e8e4d8'});
}

/* ---- portinha: abre e fecha com o botao de interagir; fechada barra como a cerca, aberta deixa passar ---- */
const gateRect=f=>f.d==='h'?{x:f.x*CELL,y:f.y*CELL-2,w:CELL,h:4}:{x:f.x*CELL-2,y:f.y*CELL,w:4,h:CELL};
function fenceGateCands(){
  const out=[];if(!P||P.dead||P.inVehicle||P.inside||!fences.length)return out;
  const cx=Math.floor(P.x/CELL),cy=Math.floor(P.y/CELL);
  for(let i=cx-2;i<=cx+3;i++)for(let j=cy-2;j<=cy+3;j++)for(const d of ['h','v']){
    const f=fmap.get(d+i+','+j);if(!f||!f.g)continue;
    const r=gateRect(f),px=clamp(P.x,r.x,r.x+r.w),py=clamp(P.y,r.y,r.y+r.h),ed=Math.max(0,Math.hypot(P.x-px,P.y-py)-P.r);
    if(ed<=12)out.push({f,ed,px,py});
  }
  return out;
}
function fenceToggle(f){
  if(!f||!f.g)return;
  f.o=f.o?0:1;send(f,1);
  beep(f.o?240:170,.09,'triangle',.05,f.o?60:-60);
}

/* ---- colisao: cerca fechada empurra para fora (jogador, zumbis e animais); a portinha aberta deixa passar ---- */
function fenceHit(e,r){
  if(!fences.length)return;
  const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL);
  for(let i=cx-1;i<=cx+1;i++)for(let j=cy;j<=cy+1;j++){const f=fmap.get('h'+i+','+j);if(f&&!(f.g&&f.o))pushRect(e,r,{x:i*CELL-.5,y:j*CELL-1.5,w:CELL+1,h:3});}
  for(let i=cx;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){const f=fmap.get('v'+i+','+j);if(f&&!(f.g&&f.o))pushRect(e,r,{x:i*CELL-1.5,y:j*CELL-.5,w:3,h:CELL+1});}
}

/* ---- quebrar: bater com qualquer arma desmonta cerca, portao e alguns objetos; recupera madeira ---- */
const BREAK={   // hp, madeira devolvida [min,max], som (w=madeira, s=metal/pedra)
  log:{hp:4,wood:[2,2],n:'Tora'},stump:{hp:3,wood:[1,1],n:'Toco'},frozen_log:{hp:4,wood:[2,2],n:'Tora'},
  bench:{hp:4,wood:[2,2],n:'Banco'},crate:{hp:3,wood:[1,2],n:'Caixote'},sign:{hp:2,wood:[1,1],n:'Placa'},
  barrier:{hp:5,wood:[0,0],n:'Barreira',s:1},mailbox:{hp:3,wood:[0,0],n:'Caixa de correio',s:1},trash:{hp:2,wood:[0,0],n:'Lixeira',s:1},
  cone:{hp:1,wood:[0,0],n:'Cone',s:1},snowman:{hp:2,wood:[0,0],n:'Boneco de neve'}
};
const broken=new Set();   // chaves das cercas da cidade e dos objetos do mapa ja destruidos (vai no save)
const fk=f=>'f:'+f.d+f.x+','+f.y,dk=d=>'d:'+d.x+','+d.y+','+d.type;
function giveWood(n,x,y){for(let i=0;i<n;i++){if(!addItem('wood')){const it={t:'wood',x:x+rnd(-5,5),y:y+rnd(-3,3)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}}}
function structTarget(w){
  if(!P||P.dead||P.inVehicle||P.inside)return null;
  const reach=(w.range||18)+8;let best=null;
  const consider=(r,o,kind)=>{
    const px=clamp(P.x,r.x,r.x+r.w),py=clamp(P.y,r.y,r.y+r.h),d=Math.max(0,Math.hypot(P.x-px,P.y-py)-P.r);
    if(d>reach)return;
    if(d>3&&Math.abs(wrap(Math.atan2(py-P.y,px-P.x)-P.face))>1.35)return;   // so o que esta a frente
    if(!best||d<best.d)best={d,o,kind,x:px,y:py};
  };
  const cx=Math.floor(P.x/CELL),cy=Math.floor(P.y/CELL);
  for(let i=cx-3;i<=cx+4;i++)for(let j=cy-3;j<=cy+4;j++)for(const dd of ['h','v']){const f=fmap.get(dd+i+','+j);if(f)consider(gateRect(f),f,'f');}
  for(const d of decorations){
    if(!BREAK[d.type]||Math.abs(d.x-P.x)>reach+14||Math.abs(d.y-P.y)>reach+14)continue;
    consider({x:d.x-6,y:d.y-8,w:12,h:10},d,'d');
  }
  return best;
}
function structHit(st,w){
  const o=st.o,hp0=st.kind==='f'?3:BREAK[o.type].hp;
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
  if(st.kind==='f'){wood=o.g?2:1;nm=o.g?'Portão':'Cerca';}
  else{const b=BREAK[o.type];wood=rint(b.wood[0],b.wood[1]);nm=b.n;}
  removeKey(key);if(st.kind==='d'||o.s)broken.add(key);
  if(MP.active)sendEvt('structBreak',{k:key});
  giveWood(wood,st.x,st.y);
  toast(nm+' destruído(a)'+(wood?'! +'+wood+' Madeira':''));beep(240,.14,'triangle',.08,-60);
}
/* tira o objeto da lista (cerca da cidade, cerca do jogador ou decoracao) */
function removeKey(key){
  if(key.charAt(0)==='f'){
    const m=/^f:([hv])(-?\d+),(-?\d+)$/.exec(key);if(!m)return;
    const f=fenceAt(+m[2],+m[3],m[1]);if(f){fences=fences.filter(q=>q!==f);fmap.delete(fkey(f.x,f.y,f.d));}
  }else{
    const m=/^d:(-?\d+),(-?\d+),(.+)$/.exec(key);if(!m)return;
    const i=decorations.findIndex(d=>d.x===+m[1]&&d.y===+m[2]&&d.type===m[3]);
    if(i>=0){decorations.splice(i,1);rebuildSolidGrid();}
  }
}
function structRemote(k){if(typeof k!=='string'||k.length>60)return;broken.add(k);removeKey(k);}
function structPack(){return [...broken].slice(0,3000);}
function structLoad(a){   // depois de gerar o mundo e antes de carregar as cercas do jogador
  broken.clear();
  if(Array.isArray(a))for(const k of a)if(typeof k==='string'&&k.length<=60){broken.add(k);if(k.charAt(0)==='d'||(k.charAt(0)==='f'&&fmap.get(k.slice(2))&&fmap.get(k.slice(2)).s))removeKey(k);}
}

/* ---- desenho ---- */
function fencesInView(vx0,vx1,vy0,vy1){return fences.filter(f=>{const x=f.x*CELL,y=f.y*CELL;return x+CELL>vx0&&x-CELL<vx1&&y+CELL>vy0-12&&y-CELL<vy1+12;});}
function fenceDepth(f){return f.d==='h'?f.y*CELL:f.y*CELL+CELL-1;}
const PAL_W=['#f2efe6','#cfc9b8','#a8a290'],PAL_B=['#9a6a3a','#7a5230','#5a3c20'];   // branca (casas da cidade) e marrom (construida pelo jogador)
function drawFence(f){
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
/* fantasma das ferramentas Cerca e Portao: verde = poe, azul = troca a cerca por portao, vermelho = nao pode */
function drawFenceGhost(){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||(P.weapon!=='fence'&&P.weapon!=='gate'))return;
  const it=fenceIntent(),e=it.e,x=e.x*CELL,y=e.y*CELL,a=.6+.25*Math.sin(T*6);
  const c=it.bad?'230,90,80':it.act==='REPLACE'?'110,170,240':'110,220,110';
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  if(e.d==='h'){ctx.fillRect(x,y-1,CELL,3);ctx.fillRect(x,y-7,1,7);ctx.fillRect(x+CELL-1,y-7,1,7);}
  else{ctx.fillRect(x-1,y,3,CELL);ctx.fillRect(x-1,y-6,3,1);ctx.fillRect(x-1,y+CELL-1,3,1);}
}

/* ---- salvar, carregar e sincronizar ---- */
const pack=f=>[f.x,f.y,f.d==='h'?0:1,f.g?1:0,f.o?1:0];
function fencePack(){return fences.filter(f=>!f.s).map(pack);}
/* cercas da cidade (casas): fixas, brancas, nao entram no save (nascem de novo com o mundo) e ninguem mexe nelas */
function fenceCityClear(){fences=fences.filter(f=>!f.s);reindex();broken.clear();}
function fenceCityAdd(list){
  for(const r of list){if(fenceAt(r[0],r[1],r[2]===1?'v':'h'))continue;fences.push({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:r[3]?1:0,s:1});}
  reindex();
}
function fenceLoad(a){
  fences=fences.filter(f=>f.s);
  if(Array.isArray(a))for(const r of a){
    if(!Array.isArray(r)||!Number.isFinite(r[0])||!Number.isFinite(r[1])||fences.length>=FENCE_MAX+2000||fenceAt(Math.round(r[0]),Math.round(r[1]),r[2]===1?'v':'h'))continue;
    fences.push({x:Math.round(r[0]),y:Math.round(r[1]),d:r[2]===1?'v':'h',g:r[3]?1:0,o:r[3]&&r[4]?1:0});
  }
  reindex();
}
function fenceRemote(d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||(d.d!=='h'&&d.d!=='v'))return;
  const f=fenceAt(d.x,d.y,d.d);
  if(f&&f.s){if(f.g&&d.o!==undefined)f.o=d.o?1:0;return;}
  if(d.g===-1){if(f){fences=fences.filter(q=>q!==f);fmap.delete(fkey(f.x,f.y,f.d));}return;}
  if(f){f.g=d.g?1:0;f.o=f.g&&d.o?1:0;return;}
  if(fences.length>=FENCE_MAX+2000)return;
  const n={x:Math.round(d.x),y:Math.round(d.y),d:d.d,g:d.g?1:0,o:d.g&&d.o?1:0};fences.push(n);fmap.set(fkey(n.x,n.y,n.d),n);
}
function fenceApplySnapshot(a){if(Array.isArray(a))for(const r of a)if(Array.isArray(r))fenceRemote({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:r[3]?1:0,o:r[4]?1:0});}

window.structTarget=structTarget;window.structHit=structHit;window.structRemote=structRemote;window.structPack=structPack;window.structLoad=structLoad;window.fenceCityClear=fenceCityClear;window.fenceCityAdd=fenceCityAdd;window.fenceGateCands=fenceGateCands;window.fenceToggle=fenceToggle;window.fenceHit=fenceHit;window.fenceBuild=fenceBuild;window.fenceIntent=fenceIntent;window.fencesInView=fencesInView;window.fenceDepth=fenceDepth;window.drawFence=drawFence;window.drawFenceGhost=drawFenceGhost;
window.fencePack=fencePack;window.fenceLoad=fenceLoad;window.fenceRemote=fenceRemote;window.fenceApplySnapshot=fenceApplySnapshot;window.fenceList=()=>fences;
})();
