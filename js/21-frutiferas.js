/* ============ FRUTIFERAS E PLANTAS SELVAGENS ============
   Algumas arvores, arbustos e cactos que ja existem no mapa dao fruto. Quem da fruto sai de um hash da posicao
   (nao usa o _rng do mundo), entao o mundo e os saves continuam iguais.
   Floresta e cidade: macieira (copa larga) e arbusto de frutinhas. Deserto: tamareira (palmeira) e cacto de fruta. Neve: nada selvagem
   (la a comida vem das casas, das hortas abandonadas e da estufa).
   Colher tira os frutos e eles voltam depois de um tempo. Comer o fruto devolve 1 semente (SEED_OF em js/10) para plantar. */
(function(){
const REGROW=DAY_SECONDS*1.5;
let waiting=[];   // objetos (arvore ou enfeite) sem fruto agora; o:_pk = segundos ate frutificar
const YIELD={apple:[2,4],berry:[3,5],date:[3,5],pricklypear:[2,3]};
const NAME={apple:'macieira',berry:'arbusto de frutinhas',date:'tamareira',pricklypear:'cacto'};

/* o que cada objeto da: item ou null (calculado uma vez e guardado no objeto) */
function fruitOf(o){
  if(o._fr!==undefined)return o._fr;
  let f=null;const m=selectedMap;
  if(o.type===undefined){   // arvore
    if((m==='forest'||m==='city')&&(o.k|0)===1&&posHash(o.x,o.y,11)<.2)f='apple';
    else if(m==='desert'&&(o.k|0)===6&&posHash(o.x,o.y,12)<.7)f='date';
  }else{                    // enfeite
    if(m==='forest'){if(o.type==='berry')f='berry';else if((o.type==='bush'||o.type==='bush2')&&posHash(o.x,o.y,13)<.25)f='berry';}
    else if(m==='desert'&&(o.type==='cactus_sm'||o.type==='cactus_bg'||o.type==='cactus_tall')&&posHash(o.x,o.y,14)<.6)f='pricklypear';
  }
  return o._fr=f;
}
const ripe=o=>!!fruitOf(o)&&!(o._pk>0);

/* ---- alvo do botao de interagir (usado pelo pickTarget) ---- */
function fruitCands(){
  const out=[];
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping)return out;
  const near=(o,rad)=>{
    if(Math.abs(o.x-P.x)>26||Math.abs(o.y-P.y)>26||!ripe(o))return;
    const d=Math.max(0,Math.hypot(o.x-P.x,o.y-P.y)-P.r-rad);
    if(d<=11)out.push({k:'fruit',act:'COLHER',o,d,b:-1,px:o.x,py:o.y,key:'f'+o.x+','+o.y});
  };
  for(const t of trees)near(t,7);
  for(const d of decorations)near(d,4);
  return out;
}
function fruitPick(o){
  if(!o||!ripe(o))return;
  const f=fruitOf(o),y=YIELD[f],n=rint(y[0],y[1]);
  let left=0;
  for(let i=0;i<n;i++){
    if(!addItem(f)){left++;const it={t:f,x:o.x+rnd(-8,8),y:o.y+rnd(2,10)};items.push(it);if(MP.active)sendEvt('itemAdded',{t:it.t,x:it.x,y:it.y});}
  }
  setWait(o,REGROW);
  if(MP.active)sendEvt('fruitSet',{x:o.x,y:o.y,r:Math.round(REGROW)});
  beep(520,.07,'triangle',.05,100);
  for(let i=0;i<7;i++)parts.push({x:o.x+rnd(-8,8),y:o.y-rnd(8,26),vx:rnd(-20,20),vy:rnd(-30,-5),t:.45,c:f==='apple'?'#e03a2a':f==='berry'?'#8a3aa8':f==='date'?'#e8902a':'#e0407a'});
  toast('Colheu: '+n+' '+ITEMS[f].n.toLowerCase()+(left?' · '+left+' no chão (inventário cheio)':' · coma para ganhar uma semente'));
  try{track('harvest');}catch(e){}
}
function setWait(o,r){o._pk=r;if(!waiting.includes(o))waiting.push(o);}
function fruitTick(dt){
  if(!waiting.length)return;
  for(const o of waiting)o._pk-=dt;
  if(waiting.some(o=>o._pk<=0))waiting=waiting.filter(o=>{if(o._pk>0)return true;o._pk=0;return false;});
}

/* ---- desenho: os frutos aparecem por cima da copa enquanto estao maduros ---- */
const APPLE_AT=[[-17,-40],[-9,-51],[3,-58],[12,-46],[19,-38],[-2,-39],[-21,-47],[8,-36],[-12,-34],[1,-48]];
function fruitOver(o){
  const f=fruitOf(o);if(!f||o._pk>0)return;
  const x=o.x,y=o.y;
  if(f==='apple'){
    for(let i=0;i<APPLE_AT.length;i++){
      if(posHash(o.x,o.y,20+i)<.3)continue;
      const a=APPLE_AT[i],ax=Math.round(x+a[0]),ay=Math.round(y+a[1]);
      R(ax,ay,2,2,'#d8302a');R(ax,ay,1,1,'#f8b0a0');
    }
  }else if(f==='date'){
    const v=Math.floor((o.seed||0)*4)&3,sw=v-1.5,tx=Math.round(Math.sin(1.6)*sw*2.2);
    const bx=x+tx,by=y-57;
    R(bx-4,by,1,3,'#e8902a');R(bx-2,by+1,1,3,'#c8661a');R(bx,by,1,3,'#e8902a');R(bx+2,by+1,1,3,'#c8661a');R(bx-3,by+3,1,2,'#e8902a');R(bx+1,by+3,1,2,'#c8661a');
  }else if(f==='berry'){
    const P2=[[-4,-8],[1,-9],[-2,-5],[3,-6],[-5,-4],[4,-3],[0,-7],[-3,-7]];
    for(const q of P2){R(x+q[0],y+q[1],1,1,'#8a3aa8');}
    R(x-2,y-6,1,1,'#d8b0f0');R(x+3,y-7,1,1,'#d8b0f0');
  }else if(f==='pricklypear'){
    const ty=o.type==='cactus_tall'?[[-1,-24],[-8,-19],[6,-21]]:o.type==='cactus_bg'?[[-1,-18],[-9,-13],[-6,-14]]:[[-1,-9],[-4,-6],[2,-7]];
    for(const q of ty){R(x+q[0],y+q[1],2,2,'#e0407a');R(x+q[0],y+q[1],1,1,'#ffb0d0');}
  }
}

/* ---- save e multiplayer: so os que estao sem fruto precisam ser guardados ---- */
function fruitPack(){return waiting.filter(o=>o._pk>0).map(o=>[o.x,o.y,Math.round(o._pk)]);}
function fruitLoad(a){
  for(const o of waiting)o._pk=0;waiting=[];
  if(!Array.isArray(a))return;
  const m=new Map();for(const t of trees)m.set(t.x+','+t.y,t);for(const d of decorations){const k=d.x+','+d.y;if(!m.has(k))m.set(k,d);}
  for(const r of a){
    if(!Array.isArray(r)||!Number.isFinite(r[0])||!Number.isFinite(r[1])||!Number.isFinite(r[2]))continue;
    const o=m.get(r[0]+','+r[1]);if(o&&fruitOf(o)&&r[2]>0)setWait(o,Math.min(REGROW,r[2]));
  }
}
function fruitRemote(d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  const r=Number.isFinite(d.r)?clamp(d.r,1,REGROW):REGROW;
  for(const t of trees)if(t.x===d.x&&t.y===d.y&&fruitOf(t)){setWait(t,r);return;}
  for(const q of decorations)if(q.x===d.x&&q.y===d.y&&fruitOf(q)){setWait(q,r);return;}
}
function fruitReset(){for(const o of waiting)o._pk=0;waiting=[];}

window.fruitOf=fruitOf;window.fruitRipe=ripe;window.fruitCands=fruitCands;window.fruitPick=fruitPick;window.fruitTick=fruitTick;window.fruitOver=fruitOver;
window.fruitPack=fruitPack;window.fruitLoad=fruitLoad;window.fruitRemote=fruitRemote;window.fruitReset=fruitReset;window.FRUIT_NAME=NAME;
})();
