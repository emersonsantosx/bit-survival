/* ============ PISO E TELHADO (ferramentas de construcao por quadrado de 16 px, como o canteiro) ============
   Piso: tabuas no chao, 1 madeira por quadrado, sem apoio. Fica por baixo de tudo (jogador, itens, paredes).
   Telhado: 2 madeiras por quadrado, precisa de APOIO: ou o quadrado encosta numa parede/porta, ou encosta num telhado que ja tem apoio,
   ate 3 quadrados de distancia da parede mais perto. Tirou a parede, o telhado sem apoio cai (devolve 1 madeira por quadrado).
   Quem esta debaixo de um telhado o ve transparente (o grupo inteiro de quadrados ligados), de fora ele e solido.
   Enxergao (ferramenta 'mattress'): cama rustica de 1 quadrado, 2 madeiras + 3 panos, dorme 1 pessoa (mesmas regras das outras camas).
   A cabeceira vira para a parede que encosta nela (ou para o lado oposto ao jogador). Dormir DEBAIXO DE TELHADO cura mais (ver sleepSkipApply).
   Apertar o botao de construir sobre um quadrado que ja tem a peca da ferramenta TIRA a peca (devolve o custo; nao repete segurando o botao).
   Este arquivo roda dentro de uma funcao propria: so os nomes da lista no fim ficam visiveis para o resto do jogo. */
(function(){
const CELL=16,FLOOR_MAX=800,ROOF_MAX=500,BED_MAX=60,ROOF_SPAN=3,ROOF_H=14;   // ROOF_H: altura do telhado (a mesma da parede)
const COST={floor:{wood:1},roof:{wood:2},mattress:{wood:2,cloth:3}},NAME={floor:'Piso',roof:'Telhado',mattress:'Enxergão'},MAXN={floor:FLOOR_MAX,roof:ROOF_MAX,mattress:BED_MAX};
const floors=new Map(),roofs=new Map(),beds=new Map();   // beds: guarda tambem o retangulo em pixels (x,y,w,h), o lado da cabeceira s e k:'mattress' (como os moveis das casas)
const MAPS={floor:floors,roof:roofs,mattress:beds},KIND={floor:'f',roof:'r',mattress:'b'};   // chave 'x,y' (quadrado) -> {x,y}; o telhado guarda tambem a transparencia a
let dist=new Map(),ver=0,grpCache=null,grpVer=-1;
const key=(x,y)=>x+','+y;
const cellOf=v=>Math.floor(v/CELL);
const isCT=t=>t==='floor'||t==='roof'||t==='mattress';
const lackOf=t=>{for(const k in COST[t])if(countInv(k)<COST[t][k])return 'Falta '+(k==='wood'?'madeira':'pano');return null;};
const mkBed=(x,y,s)=>({x:x*CELL,y:y*CELL,cx:x,cy:y,w:CELL,h:CELL,s,k:'mattress'});

/* ---- apoio do telhado: distancia (em quadrados) ate o quadrado encostado numa parede ---- */
function walled(cx,cy){return !!window.cellWalled&&cellWalled(cx,cy);}
function recalc(){
  dist=new Map();const q=[];
  for(const r of roofs.values())if(walled(r.x,r.y)){dist.set(key(r.x,r.y),0);q.push(r);}
  for(let i=0;i<q.length;i++){
    const c=q[i],d=dist.get(key(c.x,c.y));if(d>=ROOF_SPAN)continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(c.x+dx,c.y+dy),n=roofs.get(k);if(n&&!dist.has(k)){dist.set(k,d+1);q.push(n);}}
  }
}
function canRoof(cx,cy){
  if(walled(cx,cy))return true;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const d=dist.get(key(cx+dx,cy+dy));if(d!==undefined&&d<ROOF_SPAN)return true;}
  return false;
}
/* chamado quando uma parede some (ou o telhado muda): derruba o que ficou sem apoio. quiet = veio de outro jogador: sem madeira no chao */
function roofRecalc(quiet){
  recalc();let fell=0;
  for(const [k,r] of [...roofs]){
    if(dist.has(k))continue;
    roofs.delete(k);fell++;ver++;
    if(!quiet){dropWood(1,r.x*CELL+8,r.y*CELL+8);send('r',r.x,r.y,0);}
  }
  if(fell){ver++;recalc();if(!quiet)toast('O telhado sem apoio caiu');}
}
function dropWood(n,x,y,t){for(let i=0;i<n;i++){const it={t:t||'wood',x:x+rnd(-4,4),y:y+rnd(-3,3)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}}
function send(k,x,y,on,s){if(MP.active)sendEvt('cellSet',s?{k,x,y,on:on?1:0,s}:{k,x,y,on:on?1:0});}

/* ---- onde pode construir ---- */
function cellBad(cx,cy,kind){   // motivo se NAO der para construir ali; null se der
  const x=cx*CELL+8,y=cy*CELL+8;
  if(x<24||y<24||x>WW-24||y>WH-24)return 'Longe demais da borda do mapa';
  for(const [ox,oy] of [[0,0],[-8,-8],[8,-8],[-8,8],[8,8]])if(pointInLake(x+ox,y+oy))return 'Não dá para construir na água';
  if(bldNear(x,y,10))return 'Perto demais de uma construção';
  if(selectedMap==='city'&&(onCityRoad(x,y,8)||(ORLA&&(onSand(x,y)||onPier(x,y)))))return 'Não dá para construir na rua';
  if(solidPoint(x,y,6))return 'Tem algo no caminho';
  if(window.ghAt&&ghAt(x,y))return 'Tem uma estufa aqui';
  if(kind!=='roof'&&window.plotList&&plotList().some(p=>p.cx===cx&&p.cy===cy))return 'Tem terra arada aqui';
  return null;
}
/* o que o botao faz no quadrado da frente: PLACE poe a peca, REMOVE tira */
/* lado da cabeceira do enxergao: encostada numa parede se tiver, senao do lado oposto ao jogador */
function bedSide(cx,cy){
  const a=P.face||0,face=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?'r':'l'):(Math.sin(a)>0?'b':'t');
  const w=window.cellWallDirs?cellWallDirs(cx,cy):[];
  return w.includes(face)?face:(w[0]||face);
}
function cellIntent(){
  const tool=P.tool,cx=cellOf(P.x+Math.cos(P.face)*14),cy=cellOf(P.y+Math.sin(P.face)*14),k=key(cx,cy),map=MAPS[tool];
  if(map.has(k))return {cx,cy,act:'REMOVE',bad:null};
  const s=tool==='mattress'?bedSide(cx,cy):null;
  if(map.size>=MAXN[tool])return {cx,cy,s,act:'PLACE',bad:(tool==='floor'?'Pisos':tool==='roof'?'Telhados':'Enxergões')+' demais'};
  let bad=cellBad(cx,cy,tool);
  if(!bad&&tool==='roof'&&!canRoof(cx,cy))bad='Precisa de apoio: encoste numa parede ou num telhado';
  if(!bad)bad=lackOf(tool);
  return {cx,cy,s,act:'PLACE',bad};
}
function cellBuild(quiet){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||!isCT(P.tool))return;
  const it=cellIntent(),tool=P.tool,map=MAPS[tool],x=it.cx*CELL+8,y=it.cy*CELL+8,kk=KIND[tool];
  if(it.bad){if(!quiet){toast(it.bad);beep(130,.08,'square',.04);}return;}
  if(it.act==='REMOVE'){
    if(quiet)return;   // segurar o botao nao desfaz o que acabou de por
    map.delete(key(it.cx,it.cy));ver++;send(kk,it.cx,it.cy,0);
    for(const t in COST[tool])for(let i=0;i<COST[tool][t];i++)if(!addItem(t))dropWood(1,x,y,t);
    for(let i=0;i<4;i++)parts.push({x:x+rnd(-5,5),y:y+rnd(-3,3),vx:rnd(-14,14),vy:rnd(-24,-6),t:.3,c:tool==='mattress'?'#d8bf7a':'#9a6a3a'});
    beep(180,.07,'triangle',.05,-50);
    if(tool==='roof')roofRecalc(false);
    return;
  }
  for(const t in COST[tool])removeInv(t,COST[tool][t]);
  map.set(key(it.cx,it.cy),tool==='mattress'?mkBed(it.cx,it.cy,it.s):{x:it.cx,y:it.cy,a:1});ver++;
  if(tool==='roof')recalc();
  send(kk,it.cx,it.cy,1,it.s);
  beep(210,.06,'triangle',.05,-40);for(let i=0;i<4;i++)parts.push({x:x+rnd(-6,6),y:y+rnd(-3,3),vx:rnd(-12,12),vy:rnd(-24,-6),t:.3,c:tool==='mattress'?'#e6d392':'#c79a62'});
}

/* ---- desenho ---- */
const FL=['#a47a48','#9a6e3e','#b08650'],FLd='#6a4a28',FLl='#c49a62';
function drawFloors(vx0,vx1,vy0,vy1){
  if(!floors.size)return;
  for(const f of floors.values()){
    const x=f.x*CELL,y=f.y*CELL;if(x+CELL<vx0||x>vx1||y+CELL<vy0||y>vy1)continue;
    const v=((f.x*7+f.y*13)&3);
    R(x,y,CELL,CELL,FL[v%3]);
    for(let j=0;j<4;j++){const py=y+j*4;R(x,py+3,CELL,1,'rgba(0,0,0,.2)');R(x,py,CELL,1,'rgba(255,255,255,.07)');}   // tabuas
    for(let j=0;j<4;j++){const off=((j+v)%3)*5+2;R(x+off,y+j*4,1,4,'rgba(0,0,0,.2)');}                             // emendas
    R(x+2,y+1,1,1,FLd);R(x+CELL-3,y+CELL-3,1,1,FLd);
    if(!floors.has(key(f.x,f.y-1)))R(x,y,CELL,1,FLl);if(!floors.has(key(f.x,f.y+1)))R(x,y+CELL-1,CELL,1,FLd);
    if(!floors.has(key(f.x-1,f.y)))R(x,y,1,CELL,'rgba(0,0,0,.28)');if(!floors.has(key(f.x+1,f.y)))R(x+CELL-1,y,1,CELL,'rgba(0,0,0,.28)');
  }
}
/* enxergao: moldura de madeira, colchao de palha, travesseiro e manta remendada. Desenhado com a cabeceira em cima e girado de 90 em 90 graus */
const ROT={t:[1,0,0,1],r:[0,1,-1,0],b:[-1,0,0,-1],l:[0,-1,1,0]};
function drawBeds(vx0,vx1,vy0,vy1){
  if(!beds.size)return;
  for(const b of beds.values()){
    if(b.x+CELL<vx0||b.x>vx1||b.y+CELL<vy0||b.y>vy1)continue;
    ctx.save();const m=ROT[b.s]||ROT.t;ctx.translate(b.x+8,b.y+8);ctx.transform(m[0],m[1],m[2],m[3],0,0);ctx.translate(-8,-8);
    bedArt((b.cx*3+b.cy*5)&3);ctx.restore();
  }
}
function bedArt(v){
  R(1,16,14,1,'rgba(0,0,0,.28)');
  R(0,0,16,16,'#4a3018');R(1,1,14,14,'#d8bf7a');                                    // moldura e colchao de palha
  for(let i=0;i<9;i++)R(2+((i*5+v*3)%12),2+((i*7+v)%12),2,1,i%2?'#e6d392':'#bd9f52');   // fios de palha
  R(0,0,16,2,'#7a5230');R(0,0,16,1,'#946238');R(0,14,16,2,'#5e3e22');                // cabeceira e pe da cama
  R(3,3,10,4,'#efe9d8');R(3,6,10,1,'#cfc7b0');R(3,3,10,1,'#fffaf0');                  // travesseiro
  R(1,8,14,6,'#8a3a3a');R(1,8,14,1,'#a54a4a');R(1,13,14,1,'#6a2a2a');                  // manta
  R(3,10,4,3,'#3a5a8a');R(9,9,4,3,'#c8a040');R(9,12,2,1,'#3a5a8a');                    // remendos
  for(let i=1;i<15;i+=2)R(i,8,1,1,'#e8dcb8');                                         // costura da dobra
}
/* o enxergao esta debaixo de um telhado? (dormir ai cura mais) */
const bedCovered=b=>!!b&&roofs.has(key(b.cx,b.cy));
/* quadrados ligados ao quadrado onde o jogador esta (mesmo telhado) */
function playerGroup(){
  if(!P||P.inside||P.dead)return null;
  const c=key(cellOf(P.x),cellOf(P.y));if(!roofs.has(c))return null;
  if(grpCache&&grpVer===ver&&grpCache.has(c))return grpCache;
  const set=new Set([c]),q=[c];
  for(let i=0;i<q.length;i++){const [x,y]=q[i].split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(roofs.has(k)&&!set.has(k)){set.add(k);q.push(k);}}}
  grpCache=set;grpVer=ver;return set;
}
const SH=['#8a4a30','#7e422a','#96543a'],SHd='#4a2214',SHl='#b86a48';
function drawRoofs(vx0,vx1,vy0,vy1){
  if(!roofs.size)return;
  const g=playerGroup();
  for(const r of roofs.values()){
    const x=r.x*CELL,y=r.y*CELL-ROOF_H;if(x+CELL<vx0||x>vx1||y+CELL<vy0||y>vy1)continue;
    const tgt=g&&g.has(key(r.x,r.y))?.28:1;r.a+=(tgt-r.a)*.18;if(Math.abs(tgt-r.a)<.01)r.a=tgt;
    if(r.a<.02)continue;
    ctx.globalAlpha=r.a;
    const v=((r.x*5+r.y*11)&3);
    R(x,y,CELL,CELL,SH[v%3]);
    for(let j=0;j<4;j++){const py=y+j*4;R(x,py+3,CELL,1,SHd);R(x,py,CELL,1,'rgba(255,255,255,.1)');}               // fiadas de telha
    for(let j=0;j<4;j++){const off=((j+v)%2)*4+((j&1)?0:4);for(let i=off;i<CELL;i+=8)R(x+i,y+j*4,1,3,'rgba(0,0,0,.2)');}
    const N=roofs.has(key(r.x,r.y-1)),S=roofs.has(key(r.x,r.y+1)),W=roofs.has(key(r.x-1,r.y)),E=roofs.has(key(r.x+1,r.y));
    if(!N)R(x,y,CELL,1,SHl);
    if(!S){R(x,y+CELL-2,CELL,2,SHd);R(x,y+CELL,CELL,2,'rgba(0,0,0,.28)');}          // beiral com sombra
    if(!W)R(x,y,1,CELL,SHd);if(!E)R(x+CELL-1,y,1,CELL,SHd);
    ctx.globalAlpha=1;
  }
}
function drawCellGhost(){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||!isCT(P.tool))return;
  const it=cellIntent(),x=it.cx*CELL,y=it.cy*CELL,a=.55+.2*Math.sin(T*6);
  const c=it.bad?'230,90,80':it.act==='REMOVE'?'240,170,70':'110,220,110';
  if(P.tool==='mattress'&&it.act==='PLACE'){   // previa da cama com a cabeceira no lado certo
    ctx.save();ctx.globalAlpha=.55;const m=ROT[it.s]||ROT.t;ctx.translate(x+8,y+8);ctx.transform(m[0],m[1],m[2],m[3],0,0);ctx.translate(-8,-8);bedArt(0);ctx.restore();
  }
  ctx.fillStyle='rgba('+c+','+(a*.4).toFixed(2)+')';
  const oy=P.tool==='roof'?y-ROOF_H:y;
  ctx.fillRect(x,oy,CELL,CELL);
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  ctx.fillRect(x,oy,CELL,1);ctx.fillRect(x,oy+CELL-1,CELL,1);ctx.fillRect(x,oy,1,CELL);ctx.fillRect(x+CELL-1,oy,1,CELL);
  if(P.tool==='roof'){ctx.fillRect(x,y,CELL,1);ctx.fillRect(x,y+CELL-1,CELL,1);ctx.fillRect(x,y,1,CELL);ctx.fillRect(x+CELL-1,y,1,CELL);}   // marca tambem o chao embaixo
  if(it.bad){ctx.fillRect(x+3,oy+3,2,2);ctx.fillRect(x+CELL-5,oy+3,2,2);ctx.fillRect(x+CELL-5,oy+CELL-5,2,2);ctx.fillRect(x+3,oy+CELL-5,2,2);ctx.fillRect(x+7,oy+7,2,2);}
}

/* ---- salvar, carregar e sincronizar ---- */
function cellPack(){return {f:[...floors.values()].map(c=>[c.x,c.y]),r:[...roofs.values()].map(c=>[c.x,c.y]),b:[...beds.values()].map(c=>[c.cx,c.cy,c.s])};}
const okCell=a=>Array.isArray(a)&&Number.isFinite(a[0])&&Number.isFinite(a[1])&&a[0]>=0&&a[1]>=0&&a[0]*CELL<WW&&a[1]*CELL<WH;
const okSide=v=>v==='t'||v==='b'||v==='l'||v==='r';
function cellLoad(d){
  floors.clear();roofs.clear();beds.clear();ver++;
  if(d&&Array.isArray(d.f))for(const a of d.f){if(floors.size>=FLOOR_MAX)break;if(okCell(a)){const x=Math.round(a[0]),y=Math.round(a[1]);floors.set(key(x,y),{x,y});}}
  if(d&&Array.isArray(d.r))for(const a of d.r){if(roofs.size>=ROOF_MAX)break;if(okCell(a)){const x=Math.round(a[0]),y=Math.round(a[1]);roofs.set(key(x,y),{x,y,a:1});}}
  if(d&&Array.isArray(d.b))for(const a of d.b){if(beds.size>=BED_MAX)break;if(okCell(a)){const x=Math.round(a[0]),y=Math.round(a[1]);beds.set(key(x,y),mkBed(x,y,okSide(a[2])?a[2]:'t'));}}
  roofRecalc(true);
}
function cellRemote(d){
  if(!d||(d.k!=='f'&&d.k!=='r'&&d.k!=='b')||!Number.isFinite(d.x)||!Number.isFinite(d.y)||d.x<0||d.y<0||d.x*CELL>=WW||d.y*CELL>=WH)return;
  const x=Math.round(d.x),y=Math.round(d.y),map=d.k==='f'?floors:d.k==='r'?roofs:beds,k=key(x,y),max=d.k==='f'?FLOOR_MAX:d.k==='r'?ROOF_MAX:BED_MAX;
  if(d.on){if(!map.has(k)&&map.size<max)map.set(k,d.k==='f'?{x,y}:d.k==='r'?{x,y,a:1}:mkBed(x,y,okSide(d.s)?d.s:'t'));}
  else map.delete(k);
  ver++;if(d.k==='r'||!d.on)roofRecalc(true);else recalc();
}
function cellApplySnapshot(d){
  if(!d)return;
  if(Array.isArray(d.f))for(const a of d.f)if(Array.isArray(a))cellRemote({k:'f',x:a[0],y:a[1],on:1});
  if(Array.isArray(d.r))for(const a of d.r)if(Array.isArray(a))cellRemote({k:'r',x:a[0],y:a[1],on:1});
  if(Array.isArray(d.b))for(const a of d.b)if(Array.isArray(a))cellRemote({k:'b',x:a[0],y:a[1],s:a[2],on:1});
}

window.cellBuild=cellBuild;window.cellIntent=cellIntent;window.drawCellGhost=drawCellGhost;window.drawFloors=drawFloors;window.drawRoofs=drawRoofs;
window.cellPack=cellPack;window.cellLoad=cellLoad;window.cellRemote=cellRemote;window.cellApplySnapshot=cellApplySnapshot;window.roofRecalc=roofRecalc;
window.drawBeds=drawBeds;window.bedCovered=bedCovered;window.bedList=()=>[...beds.values()];window.floorAt=(cx,cy)=>floors.has(key(cx,cy));window.bedAt=(cx,cy)=>beds.has(key(cx,cy));window.floorList=()=>[...floors.values()];window.roofList=()=>[...roofs.values()];
})();
