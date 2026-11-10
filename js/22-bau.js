/* ============ BAU DE MADEIRA (guarda 15 itens) ============
   So de madeira (nao existe em nenhuma tabela de loot). Fabricar da a FERRAMENTA Bau (2 madeiras), igual ao tronco, a parede e a cerca: ela vai para o botao de construir
   e cada bau posicionado custa 4 madeiras. A previa (verde = pode, vermelho = nao cabe) fica na casa da grade a frente do jogador e o bau fica VIRADO PARA QUEM O COLOCA:
   olhando para cima ele mostra a frente, olhando para baixo mostra as costas, olhando para os lados mostra o lado com o fecho virado para o jogador. Nada de bau aparecendo do nada.
   Chegue perto e use o botao de interagir (ABRIR): toque num item da mochila para guardar, toque num item do bau para pegar. So da para desmontar vazio (devolve as 4 madeiras).
   Estado: stashes = [{x,y,o,s:[{t,n},...]}], o = 0 frente (para baixo), 1 costas (para cima), 2 virado para a esquerda, 3 virado para a direita.
   Save: stashPack/stashLoad. Multiplayer: eventos stashAdd, stashSet (conteudo inteiro) e stashDel;
   quem entra depois recebe os baus no snapshot (so cria os que faltam, o conteudo vem dos eventos). Modulo no padrao dos 18..21: IIFE + window.*  */
(function(){
const SLOTS=15,COST=4,REFUND=4,MAXN=9999,CELL=16;
let stashes=[],open=null,openAt=0;
const R2=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
const cleanO=o=>(o===1||o===2||o===3)?o:0;

/* ---------- espaco e montagem ---------- */
/* o ponto (x,y) e o pe do bau; ele ocupa a casa da grade de 16 px (x-8..x+8). Baus vizinhos podem encostar um no outro */
function spotOk(x,y){
  if(x<40||y<40||x>WW-40||y>WH-40)return false;
  for(const q of [[x-6,y-4],[x,y-4],[x+6,y-4]])if(solidPoint(q[0],q[1],4))return false;
  if(pointInLake(x,y+3)||pointInLake(x,y-8))return false;
  if(selectedMap==='city'&&onCityRoad(x,y,8))return false;
  if(window.playerWallBlocks&&playerWallBlocks(P.x,P.y,x,y))return false;
  if(stashes.some(s=>Math.abs(s.x-x)<15&&Math.abs(s.y-y)<12))return false;
  if(campfires.some(c=>Math.hypot(c.x-x,c.y-y)<22))return false;
  if(tents.some(t=>Math.hypot(t.x-x,t.y-y)<34))return false;
  if(window.wellList&&wellList().some(w=>Math.hypot(w.x-x,w.y-y)<30))return false;
  if(window.logList&&logList().some(l=>Math.hypot(l.x-x,l.y-y)<26))return false;
  return true;
}
/* o que o botao faz agora: casa da grade a frente do jogador + lado para onde o bau fica virado (para quem o coloca) */
function stashIntent(){
  const ang=P.face||0,fx=Math.cos(ang),fy=Math.sin(ang);
  const x=Math.floor((P.x+fx*26)/CELL)*CELL+CELL/2,y=Math.floor((P.y+fy*26)/CELL)*CELL+13;
  const o=Math.abs(fy)>=Math.abs(fx)?(fy>=0?1:0):(fx>=0?2:3);
  let bad=null;
  if(P.inside||bldAt(P.x,P.y))bad='Monte o baú ao ar livre';
  else if(countInv('wood')<COST)bad='Precisa de '+COST+' madeiras';
  else if(stashes.length>=200)bad='Baús demais';
  else if(!spotOk(x,y))bad='Sem espaço para o baú aqui';
  return {x,y,o,bad};
}
function stashSpot(){const it=P&&!P.inside&&stashIntent();return it&&!it.bad?{x:it.x,y:it.y,o:it.o}:null;}
function stashPlace(quiet){
  if(!P||P.dead||P.inVehicle||P.sleeping||P.sitting||P.tool!=='stash')return;
  if(quiet)return;   // segurar o botao nao repete: um bau por toque
  const it=stashIntent();
  if(it.bad){toast(it.bad);beep(130,.08,'square',.04);return;}
  removeInv('wood',COST);stashBuild(it);
}
function stashBuild(sp){
  sp=sp||stashSpot()||{x:Math.round(P.x+26),y:Math.round(P.y),o:0};
  const o=cleanO(sp.o);
  stashes.push({x:sp.x,y:sp.y,o,s:[]});rebuildSolidGrid();pushOut(P,P.r);
  if(MP.active){
    sendEvt('stashAdd',{x:sp.x,y:sp.y,o});
    if(MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
  }
  toast('Baú posicionado! Chegue perto e use ABRIR');buildSound();
  for(let i=0;i<8;i++)parts.push({x:sp.x+rnd(-8,8),y:sp.y-2,vx:rnd(-18,18),vy:rnd(-26,-6),t:.4,c:'#c8924e'});
}
function drawStashGhost(){
  if(!P||P.dead||P.inVehicle||P.inside||P.sleeping||P.sitting||P.tool!=='stash')return;
  const it=stashIntent(),a=.55+.2*Math.sin(T*6),c=it.bad?'230,90,80':'110,220,110',x0=it.x-CELL/2,y0=it.y-13;
  ctx.save();ctx.globalAlpha=.6;drawStash({x:it.x,y:it.y,o:it.o,s:[]});ctx.restore();
  ctx.fillStyle='rgba('+c+','+(a*.3).toFixed(2)+')';ctx.fillRect(x0,y0,CELL,CELL);
  ctx.fillStyle='rgba('+c+','+a.toFixed(2)+')';
  ctx.fillRect(x0,y0,CELL,1);ctx.fillRect(x0,y0+CELL-1,CELL,1);ctx.fillRect(x0,y0,1,CELL);ctx.fillRect(x0+CELL-1,y0,1,CELL);
  if(it.bad)ctx.fillRect(it.x-1,y0+CELL/2-1,2,2);
}
const find=(x,y)=>stashes.find(s=>Math.abs(s.x-x)<8&&Math.abs(s.y-y)<8)||null;
function stashNearby(){
  let b=null,bd=38;
  for(const s of stashes){const d=Math.hypot(s.x-P.x,s.y-P.y);if(d<bd){bd=d;b=s;}}
  return b;
}
function stashUsed(s){return s.s.length;}

/* ---------- guardar / pegar ---------- */
function syncOut(s){
  if(MP.active)sendEvt('stashSet',{x:s.x,y:s.y,s:s.s.map(q=>[q.t,q.n])});
}
function deposit(i){
  const s=open;if(!s||!P)return;
  const sl=P.inv[i];if(!sl)return;
  const ex=s.s.find(q=>q.t===sl.t);
  if(!ex&&s.s.length>=SLOTS){toast('Baú cheio ('+SLOTS+' espaços)');beep(120,.1,'square',.05);return;}
  const n=Math.min(sl.n,MAXN-(ex?ex.n:0));if(n<=0){toast('Esse espaço do baú está no limite');return;}
  if(ex)ex.n+=n;else s.s.push({t:sl.t,n:n});
  sl.n-=n;if(sl.n<=0)P.inv.splice(i,1);
  if(P.hold&&countInv(P.hold)<=0){P.hold=null;try{EAT=null;}catch(e){}}
  buildInv();syncOut(s);uiTap();render_();
}
function withdraw(i){
  const s=open;if(!s||!P)return;
  const sl=s.s[i];if(!sl)return;
  // guarda o que couber: pilha que ja existe na mochila sempre cabe; tipo novo precisa de vaga
  const has=P.inv.some(q=>q.t===sl.t);
  if(!has&&P.inv.length>=invCap()){toast(P.pack?'Mochila cheia':'Mochila cheia (uma mochila carrega 12)');beep(120,.1,'square',.05);return;}
  addItem(sl.t,sl.n);s.s.splice(i,1);
  syncOut(s);uiTap();render_();
}
function takeAll(){
  const s=open;if(!s)return;
  let moved=0;
  for(let i=s.s.length-1;i>=0;i--){
    const sl=s.s[i],has=P.inv.some(q=>q.t===sl.t);
    if(!has&&P.inv.length>=invCap())continue;
    addItem(sl.t,sl.n);s.s.splice(i,1);moved++;
  }
  if(!moved){toast(s.s.length?'Mochila cheia':'O baú está vazio');beep(120,.1,'square',.05);return;}
  if(s.s.length)toast('Pegou o que coube na mochila');
  syncOut(s);uiTap();render_();
}
function dismantle(){
  const s=open;if(!s)return;
  if(s.s.length){toast('Esvazie o baú para desmontar');beep(120,.1,'square',.05);return;}
  stashes.splice(stashes.indexOf(s),1);rebuildSolidGrid();
  if(MP.active)sendEvt('stashDel',{x:s.x,y:s.y});
  closeStash();
  for(let i=0;i<REFUND;i++)if(!addItem('wood',1)){items.push({t:'wood',x:s.x+rnd(-8,8),y:s.y+rnd(4,10)});}
  toast('Baú desmontado: +'+REFUND+' madeiras');beep(210,.06,'triangle',.05,-40);
  for(let i=0;i<8;i++)parts.push({x:s.x+rnd(-8,8),y:s.y-2,vx:rnd(-18,18),vy:rnd(-26,-6),t:.4,c:'#c8924e'});
}

/* ---------- tela ---------- */
const $s=id=>document.getElementById(id);
let dragEnd=0;
/* arrastar entre as duas grades: mochila (side 'p') e bau (side 'c'). Toque continua guardando/pegando, como antes. */
function moveTo(from,fi,to,ti){
  const s=open;if(!s||!P)return;
  if(from==='p'&&to==='p'){
    if(ti===fi||!P.inv[fi])return;
    const it=P.inv[fi];
    if(ti<P.inv.length){P.inv[fi]=P.inv[ti];P.inv[ti]=it;}else{P.inv.splice(fi,1);P.inv.push(it);}
    buildInv();uiTap();render_();
  }else if(from==='c'&&to==='c'){
    if(ti===fi||!s.s[fi])return;
    const it=s.s[fi];
    if(ti<s.s.length){s.s[fi]=s.s[ti];s.s[ti]=it;}else{s.s.splice(fi,1);s.s.push(it);}
    syncOut(s);uiTap();render_();
  }else if(from==='p')deposit(fi);
  else withdraw(fi);
}
function startDrag(e,side,i,btn){
  if(e.button>0)return;
  const sx=e.clientX,sy=e.clientY,id=e.pointerId;let ghost=null,over=null;
  const slotAt=(x,y)=>{const t=document.elementFromPoint(x,y);const b=t&&t.closest?t.closest('.islot'):null;return b&&!b.classList.contains('lock')&&b.dataset.side?b:null;};
  const mv=ev=>{
    if(ev.pointerId!==id)return;
    if(!ghost){
      if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;
      ghost=btn.cloneNode(true);ghost.style.cssText='position:fixed;z-index:99999;pointer-events:none;opacity:.85;width:'+btn.offsetWidth+'px;height:'+btn.offsetHeight+'px;transform:scale(1.1)';
      document.body.appendChild(ghost);btn.style.opacity='.35';
    }
    ghost.style.left=(ev.clientX-btn.offsetWidth/2)+'px';ghost.style.top=(ev.clientY-btn.offsetHeight/2)+'px';
    const o=slotAt(ev.clientX,ev.clientY);
    if(o!==over){if(over)over.style.outline='';over=o;if(over&&over!==btn)over.style.outline='2px solid #ffd84a';}
    ev.preventDefault();
  };
  const up=ev=>{
    if(ev.pointerId!==id)return;
    window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
    if(over)over.style.outline='';
    if(!ghost)return;
    ghost.remove();btn.style.opacity='';dragEnd=performance.now()+250;
    const o=ev.type==='pointercancel'?null:slotAt(ev.clientX,ev.clientY);
    if(o)moveTo(side,i,o.dataset.side,+o.dataset.i);
    else render_();
  };
  window.addEventListener('pointermove',mv,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
}
function slotBtn(sl,onTap,extra,side,idx){
  const b=document.createElement('button');b.type='button';b.className='islot'+(extra?' '+extra:'');
  b.dataset.side=side;b.dataset.i=idx;
  if(sl){
    b.insertAdjacentHTML('beforeend',pxFit(ITEMS[sl.t].e,32,28));
    if(sl.n>1)b.insertAdjacentHTML('beforeend','<span class="scnt">'+sl.n+'</span>');
    b.setAttribute('aria-label',ITEMS[sl.t].n+' x'+sl.n);b.title=ITEMS[sl.t].n;
    b.addEventListener('click',()=>{if(performance.now()<craftReadyAt||performance.now()<dragEnd)return;aud();onTap();});
    b.addEventListener('pointerdown',e=>startDrag(e,side,idx,b));
  }   // casa vazia continua sendo alvo do arrastar
  return b;
}
function render_(){
  const s=open;if(!s||!P)return;
  const cg=$s('stashgrid'),pg=$s('stashpack');if(!cg||!pg)return;
  cg.innerHTML='';pg.innerHTML='';
  for(let i=0;i<SLOTS;i++)cg.appendChild(slotBtn(s.s[i],()=>withdraw(i),s.s[i]?'':'empty','c',i));
  const cap=invCap();
  for(let i=0;i<SLOTS;i++){   // sempre 15 casas, igual ao bau: as que a mochila ainda nao tem aparecem com cadeado (mesma moldura dos dois lados)
    if(i>=cap){const l=document.createElement('button');l.type='button';l.className='islot lock';l.disabled=true;l.innerHTML=pxIcon('lock',2);pg.appendChild(l);}
    else pg.appendChild(slotBtn(P.inv[i],()=>deposit(i),P.inv[i]?'':'empty','p',i));
  }
  const u=$s('stashcnt');if(u)u.textContent=s.s.length+'/'+SLOTS;
  const pc=$s('stashpcap');if(pc)pc.textContent=P.inv.length+'/'+cap;
  const dm=$s('stashdismantle');if(dm){dm.disabled=s.s.length>0;dm.textContent=s.s.length?'DESMONTAR (VAZIO)':'DESMONTAR';}
  const ta=$s('stashall');if(ta)ta.disabled=!s.s.length;
}
function openStash(s){
  if(state!=='play'||!P||P.dead||!s)return;
  open=s;state='craft';craftReadyAt=performance.now()+300;
  const e=$s('stashscr');if(e)e.classList.remove('hide');
  render_();beep(260,.08,'triangle',.05,60);
}
function closeStash(){
  const e=$s('stashscr');if(e)e.classList.add('hide');
  if(open&&state==='craft')state='play';
  open=null;
}
function stashIsOpen(){return !!open;}

/* ---------- desenho: bau de madeira com cintas de ferro, tampa e fecho (virado para um dos 4 lados) ---------- */
function drawStash(s){
  const x=Math.round(s.x),y=Math.round(s.y),o=cleanO(s.o);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+3,o>=2?9:10,3.5,0,0,6.283);ctx.fill();
  if(o>=2){   // de lado: mais estreito, com o fecho no lado que olha para o jogador
    R2(x-7,y-11,14,13,'#4a2e1a');                       // contorno
    R2(x-6,y-10,12,5,'#b07a3e');R2(x-6,y-10,12,1,'#d6a468');          // tampa
    R2(x-6,y-5,12,6,'#8a5a2a');R2(x-6,y-5,12,1,'#5a3a24');            // corpo
    R2(x-4,y-10,2,11,'#6a7280');R2(x+2,y-10,2,11,'#6a7280');R2(x-4,y-10,2,1,'#c0c8d4');R2(x+2,y-10,2,1,'#c0c8d4');   // cintas
    const lx=o===2?x-7:x+5;R2(lx,y-8,2,4,'#ffd84a');R2(lx+(o===2?0:1),y-7,1,2,'#8a5a2a');   // fecho na ponta virada para o jogador
    R2(x-7,y,3,2,'#4a2e1a');R2(x+4,y,3,2,'#4a2e1a');
  }else{      // de frente (0) ou de costas (1)
    R2(x-8,y-11,16,13,'#4a2e1a');                       // contorno
    R2(x-7,y-10,14,5,'#b07a3e');R2(x-7,y-10,14,1,'#d6a468');          // tampa
    R2(x-7,y-5,14,6,'#8a5a2a');R2(x-7,y-5,14,1,'#5a3a24');            // corpo
    R2(x-5,y-10,2,11,'#6a7280');R2(x+3,y-10,2,11,'#6a7280');R2(x-5,y-10,2,1,'#c0c8d4');R2(x+3,y-10,2,1,'#c0c8d4');   // cintas de ferro
    if(o===0){R2(x-2,y-7,4,4,'#ffd84a');R2(x-1,y-6,2,2,'#8a5a2a');}            // fecho
    else{R2(x-3,y-6,2,2,'#3a3a44');R2(x+1,y-6,2,2,'#3a3a44');}                 // dobradicas (costas)
    R2(x-8,y,3,2,'#4a2e1a');R2(x+5,y,3,2,'#4a2e1a');                            // pes
  }
  if(s.s&&s.s.length){R2(x-6,y-11,2,1,'#d33');}                      // marca discreta: tem coisa dentro
}
function stashDepth(s){return s.y;}

/* ---------- save e rede ---------- */
const cleanSlots=a=>{const out=[];if(Array.isArray(a))for(const q of a){const t=Array.isArray(q)?q[0]:q&&q.t,n=Array.isArray(q)?q[1]:q&&q.n;if(typeof t==='string'&&ITEMS[t]&&Number.isFinite(n)&&n>=1&&!out.some(o=>o.t===t)&&out.length<SLOTS)out.push({t:t,n:Math.min(MAXN,Math.floor(n))});}return out;};
function stashPack(){return stashes.map(s=>[Math.round(s.x),Math.round(s.y),s.s.map(q=>[q.t,q.n]),cleanO(s.o)]);}
function stashLoad(a){
  stashes=[];
  if(Array.isArray(a))for(const q of a.slice(0,200)){if(Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1]))stashes.push({x:q[0],y:q[1],o:cleanO(q[3]),s:cleanSlots(q[2])});}
  rebuildSolidGrid();
}
function stashReset(){stashes=[];open=null;}
function stashRemote(kind,d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  let s=find(d.x,d.y);
  if(kind==='stashAdd'){if(!s&&stashes.length<200){stashes.push({x:d.x,y:d.y,o:cleanO(d.o),s:[]});rebuildSolidGrid();}}
  else if(kind==='stashSet'){
    if(!s&&stashes.length<200){s={x:d.x,y:d.y,o:cleanO(d.o),s:[]};stashes.push(s);rebuildSolidGrid();}
    if(s){s.s=cleanSlots(d.s);if(open===s)render_();}
  }else if(kind==='stashDel'){
    if(s){if(open===s)closeStash();stashes.splice(stashes.indexOf(s),1);rebuildSolidGrid();}
  }
}
function stashSnapshot(a){   // convidado que entra depois: cria os baus que faltam (o conteudo ja vem junto)
  if(!Array.isArray(a))return;
  let ch=false;
  for(const q of a.slice(0,200)){
    if(!Array.isArray(q)||!Number.isFinite(q[0])||!Number.isFinite(q[1])||find(q[0],q[1]))continue;
    stashes.push({x:q[0],y:q[1],o:cleanO(q[3]),s:cleanSlots(q[2])});ch=true;
  }
  if(ch)rebuildSolidGrid();
}

window.stashSpot=stashSpot;window.stashIntent=stashIntent;window.stashPlace=stashPlace;window.drawStashGhost=drawStashGhost;window.stashBuild=stashBuild;window.stashNearby=stashNearby;window.openStash=openStash;window.closeStash=closeStash;window.stashIsOpen=stashIsOpen;
window.drawStash=drawStash;window.stashDepth=stashDepth;window.stashPack=stashPack;window.stashLoad=stashLoad;window.stashReset=stashReset;window.stashRemote=stashRemote;window.stashSnapshot=stashSnapshot;
window.stashList=()=>stashes;window.stashTakeAll=takeAll;window.stashDismantle=dismantle;window.stashDeposit=deposit;window.stashWithdraw=withdraw;window.stashMove=moveTo;window.STASH_SLOTS=SLOTS;window.STASH_COST=COST;
})();
