/* ============ CERCA (barra quem anda, menos pela portinha; nada quebra a cerca, nem zumbi) ============
   Peca = pedaco de 16 px na borda entre casas da grade: {x,y,d,g}. d='h' (horizontal, na linha y, coluna x) ou 'v' (vertical, na linha x, fileira y).
   g=0 cerca, g=1 portinha. Com a ferramenta Cerca na mao: borda vazia = cerca (1 madeira), cerca = vira portinha (+1 madeira), portinha = remove (devolve 1 madeira).
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
/* o que o botao faz na borda da frente: 'FENCE' poe cerca, 'GATE' troca por portinha, 'REMOVE' tira a portinha */
function fenceIntent(){
  const e=frontEdge(),f=fenceAt(e.x,e.y,e.d);
  if(f&&f.s)return {e,act:'FIXED',bad:'Essa cerca não dá para mexer'};
  if(f)return f.g?{e,act:'REMOVE'}:{e,act:'GATE',cost:1,bad:countInv('wood')<1?'Falta madeira':null};
  const bad=fences.filter(q=>!q.s).length>=FENCE_MAX?'Cercas demais':countInv('wood')<1?'Falta madeira':edgeBad(e);
  return {e,act:'FENCE',cost:1,bad};
}
function send(f,g){if(MP.active)sendEvt('fenceSet',{x:f.x,y:f.y,d:f.d,g});}
function fenceBuild(quiet){
  if(!P||P.dead||P.inVehicle||P.inside||P.weapon!=='fence')return;
  const it=fenceIntent(),e=it.e;
  if(it.bad){if(!quiet){toast(it.bad);beep(130,.08,'square',.04);}return;}
  const m=mid(e);
  if(it.act==='FENCE'){
    removeInv('wood',1);const f={x:e.x,y:e.y,d:e.d,g:0};fences.push(f);fmap.set(fkey(f.x,f.y,f.d),f);send(f,0);
    beep(200,.06,'triangle',.05,-40);for(let i=0;i<4;i++)parts.push({x:m.x+rnd(-5,5),y:m.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-24,-6),t:.3,c:'#e8e4d8'});
  }else if(it.act==='GATE'){
    removeInv('wood',1);const f=fenceAt(e.x,e.y,e.d);f.g=1;send(f,1);
    beep(260,.07,'triangle',.05,60);if(!quiet)toast('Portinha colocada. Use de novo para remover');
  }else{
    const f=fenceAt(e.x,e.y,e.d);fences=fences.filter(q=>q!==f);fmap.delete(fkey(f.x,f.y,f.d));send(f,-1);
    addItem('wood');beep(150,.07,'sawtooth',.04,-30);if(!quiet)toast('Portinha removida (+1 madeira)');
  }
}

/* ---- colisao: cerca fechada empurra para fora (jogador, zumbis e animais); a portinha deixa passar ---- */
function fenceHit(e,r){
  if(!fences.length)return;
  const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL);
  for(let i=cx-1;i<=cx+1;i++)for(let j=cy;j<=cy+1;j++){const f=fmap.get('h'+i+','+j);if(f&&!f.g)pushRect(e,r,{x:i*CELL-.5,y:j*CELL-1.5,w:CELL+1,h:3});}
  for(let i=cx;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){const f=fmap.get('v'+i+','+j);if(f&&!f.g)pushRect(e,r,{x:i*CELL-1.5,y:j*CELL-.5,w:3,h:CELL+1});}
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
    }else{
      R(x-1,top-5,3,3,WH1);R(x-1,top+CELL-4,3,3,WH1);
      R(x,top-2,1,CELL-3,WH3);R(x-1,top+2,3,8,WH2);R(x-1,top+2,1,8,WH1);R(x+1,top+8,1,2,'#7a5a2a');
    }
  }
}
/* fantasma da ferramenta Cerca: verde = poe cerca, azul = vira portinha, laranja = tira a portinha, vermelho = nao pode */
function drawFenceGhost(){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||P.weapon!=='fence')return;
  const it=fenceIntent(),e=it.e,x=e.x*CELL,y=e.y*CELL,a=.6+.25*Math.sin(T*6);
  const c=it.bad?'230,90,80':it.act==='FENCE'?'110,220,110':it.act==='GATE'?'110,170,240':'240,170,70';
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  if(e.d==='h'){ctx.fillRect(x,y-1,CELL,3);ctx.fillRect(x,y-7,1,7);ctx.fillRect(x+CELL-1,y-7,1,7);}
  else{ctx.fillRect(x-1,y,3,CELL);ctx.fillRect(x-1,y-6,3,1);ctx.fillRect(x-1,y+CELL-1,3,1);}
}

/* ---- salvar, carregar e sincronizar ---- */
const pack=f=>[f.x,f.y,f.d==='h'?0:1,f.g?1:0];
function fencePack(){return fences.filter(f=>!f.s).map(pack);}
/* cercas da cidade (casas): fixas, brancas, nao entram no save (nascem de novo com o mundo) e ninguem mexe nelas */
function fenceCityClear(){fences=fences.filter(f=>!f.s);reindex();}
function fenceCityAdd(list){
  for(const r of list){if(fenceAt(r[0],r[1],r[2]===1?'v':'h'))continue;fences.push({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:r[3]?1:0,s:1});}
  reindex();
}
function fenceLoad(a){
  fences=fences.filter(f=>f.s);
  if(Array.isArray(a))for(const r of a){
    if(!Array.isArray(r)||!Number.isFinite(r[0])||!Number.isFinite(r[1])||fences.length>=FENCE_MAX+2000||fenceAt(Math.round(r[0]),Math.round(r[1]),r[2]===1?'v':'h'))continue;
    fences.push({x:Math.round(r[0]),y:Math.round(r[1]),d:r[2]===1?'v':'h',g:r[3]?1:0});
  }
  reindex();
}
function fenceRemote(d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y)||(d.d!=='h'&&d.d!=='v'))return;
  const f=fenceAt(d.x,d.y,d.d);
  if(f&&f.s)return;
  if(d.g===-1){if(f){fences=fences.filter(q=>q!==f);fmap.delete(fkey(f.x,f.y,f.d));}return;}
  if(f){f.g=d.g?1:0;return;}
  if(fences.length>=FENCE_MAX+2000)return;
  const n={x:Math.round(d.x),y:Math.round(d.y),d:d.d,g:d.g?1:0};fences.push(n);fmap.set(fkey(n.x,n.y,n.d),n);
}
function fenceApplySnapshot(a){if(Array.isArray(a))for(const r of a)if(Array.isArray(r))fenceRemote({x:r[0],y:r[1],d:r[2]===1?'v':'h',g:r[3]?1:0});}

window.fenceCityClear=fenceCityClear;window.fenceCityAdd=fenceCityAdd;window.fenceHit=fenceHit;window.fenceBuild=fenceBuild;window.fenceIntent=fenceIntent;window.fencesInView=fencesInView;window.fenceDepth=fenceDepth;window.drawFence=drawFence;window.drawFenceGhost=drawFenceGhost;
window.fencePack=fencePack;window.fenceLoad=fenceLoad;window.fenceRemote=fenceRemote;window.fenceApplySnapshot=fenceApplySnapshot;window.fenceList=()=>fences;
})();
