/* ============ BAU DE MADEIRA (guarda 15 itens) ============
   Fabricado so no crafting, so com madeira (nao existe em nenhuma tabela de loot). Ao fabricar, ele e montado na frente do jogador, ao ar livre.
   Cada bau tem 15 espacos (um por tipo de item, qualquer quantidade, igual a mochila). Chegue perto e use o botao de interagir (ABRIR):
   toque num item da mochila para guardar, toque num item do bau para pegar. So da para desmontar vazio (devolve parte da madeira).
   Estado: stashes = [{x,y,s:[{t,n},...]}]. Save: stashPack/stashLoad. Multiplayer: eventos stashAdd, stashSet (conteudo inteiro) e stashDel;
   quem entra depois recebe os baus no snapshot (so cria os que faltam, o conteudo vem dos eventos). Modulo no padrao dos 18..21: IIFE + window.*  */
(function(){
const SLOTS=15,COST=6,REFUND=4,MAXN=9999;
let stashes=[],open=null,openAt=0;
const R2=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

/* ---------- espaco e montagem ---------- */
function spotOk(x,y){
  if(x<40||y<40||x>WW-40||y>WH-40)return false;
  if(solidPoint(x,y,11)||pointInLake(x,y+8))return false;
  if(selectedMap==='city'&&onCityRoad(x,y,14))return false;
  if(window.playerWallBlocks&&playerWallBlocks(P.x,P.y,x,y))return false;
  if(stashes.some(s=>Math.hypot(s.x-x,s.y-y)<26))return false;
  if(campfires.some(c=>Math.hypot(c.x-x,c.y-y)<22))return false;
  if(tents.some(t=>Math.hypot(t.x-x,t.y-y)<34))return false;
  return true;
}
function stashSpot(){
  if(!P||P.inside||bldAt(P.x,P.y))return null;
  for(const d of [26,34,44]){
    for(const da of [0,.5,-.5,1,-1,1.6,-1.6,3.14]){
      const a=(P.face||0)+da,x=Math.round(P.x+Math.cos(a)*d),y=Math.round(P.y+Math.sin(a)*d);
      if(spotOk(x,y))return {x,y};
    }
  }
  return null;
}
function stashBuild(sp){
  sp=sp||stashSpot()||{x:Math.round(P.x+26),y:Math.round(P.y)};
  stashes.push({x:sp.x,y:sp.y,s:[]});rebuildSolidGrid();pushOut(P,P.r);
  if(MP.active){
    sendEvt('stashAdd',{x:sp.x,y:sp.y});
    if(MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
  }
  toast('Baú montado! Chegue perto e use ABRIR');buildSound();
  for(let i=0;i<8;i++)parts.push({x:sp.x+rnd(-8,8),y:sp.y-2,vx:rnd(-18,18),vy:rnd(-26,-6),t:.4,c:'#c8924e'});
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
function slotBtn(sl,onTap,extra){
  const b=document.createElement('button');b.type='button';b.className='islot'+(extra?' '+extra:'');
  if(sl){
    b.insertAdjacentHTML('beforeend',pxFit(ITEMS[sl.t].e,32,28));
    if(sl.n>1)b.insertAdjacentHTML('beforeend','<span class="scnt">'+sl.n+'</span>');
    b.setAttribute('aria-label',ITEMS[sl.t].n+' x'+sl.n);b.title=ITEMS[sl.t].n;
    b.addEventListener('click',()=>{if(performance.now()<craftReadyAt)return;aud();onTap();});
  }else b.disabled=true;
  return b;
}
function render_(){
  const s=open;if(!s||!P)return;
  const cg=$s('stashgrid'),pg=$s('stashpack');if(!cg||!pg)return;
  cg.innerHTML='';pg.innerHTML='';
  for(let i=0;i<SLOTS;i++)cg.appendChild(slotBtn(s.s[i],()=>withdraw(i),s.s[i]?'':'empty'));
  const cap=invCap();
  for(let i=0;i<cap;i++)pg.appendChild(slotBtn(P.inv[i],()=>deposit(i),P.inv[i]?'':'empty'));
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

/* ---------- desenho: bau de madeira com cintas de ferro, tampa e fecho ---------- */
function drawStash(s){
  const x=Math.round(s.x),y=Math.round(s.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+3,11,3.5,0,0,6.283);ctx.fill();
  R2(x-9,y-11,18,13,'#4a2e1a');                       // contorno
  R2(x-8,y-10,16,5,'#b07a3e');R2(x-8,y-10,16,1,'#d6a468');          // tampa
  R2(x-8,y-5,16,6,'#8a5a2a');R2(x-8,y-5,16,1,'#5a3a24');            // corpo
  R2(x-6,y-10,2,11,'#6a7280');R2(x+4,y-10,2,11,'#6a7280');R2(x-6,y-10,2,1,'#c0c8d4');R2(x+4,y-10,2,1,'#c0c8d4');   // cintas de ferro
  R2(x-2,y-7,4,4,'#ffd84a');R2(x-1,y-6,2,2,'#8a5a2a');              // fecho
  if(s.s&&s.s.length){R2(x-7,y-11,2,1,'#d33');}                      // marca discreta: tem coisa dentro
  R2(x-9,y,3,2,'#4a2e1a');R2(x+6,y,3,2,'#4a2e1a');                    // pes
}
function stashDepth(s){return s.y;}

/* ---------- save e rede ---------- */
const cleanSlots=a=>{const out=[];if(Array.isArray(a))for(const q of a){const t=Array.isArray(q)?q[0]:q&&q.t,n=Array.isArray(q)?q[1]:q&&q.n;if(typeof t==='string'&&ITEMS[t]&&Number.isFinite(n)&&n>=1&&!out.some(o=>o.t===t)&&out.length<SLOTS)out.push({t:t,n:Math.min(MAXN,Math.floor(n))});}return out;};
function stashPack(){return stashes.map(s=>[Math.round(s.x),Math.round(s.y),s.s.map(q=>[q.t,q.n])]);}
function stashLoad(a){
  stashes=[];
  if(Array.isArray(a))for(const q of a.slice(0,200)){if(Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1]))stashes.push({x:q[0],y:q[1],s:cleanSlots(q[2])});}
  rebuildSolidGrid();
}
function stashReset(){stashes=[];open=null;}
function stashRemote(kind,d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  let s=find(d.x,d.y);
  if(kind==='stashAdd'){if(!s&&stashes.length<200){stashes.push({x:d.x,y:d.y,s:[]});rebuildSolidGrid();}}
  else if(kind==='stashSet'){
    if(!s&&stashes.length<200){s={x:d.x,y:d.y,s:[]};stashes.push(s);rebuildSolidGrid();}
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
    stashes.push({x:q[0],y:q[1],s:cleanSlots(q[2])});ch=true;
  }
  if(ch)rebuildSolidGrid();
}

window.stashSpot=stashSpot;window.stashBuild=stashBuild;window.stashNearby=stashNearby;window.openStash=openStash;window.closeStash=closeStash;window.stashIsOpen=stashIsOpen;
window.drawStash=drawStash;window.stashDepth=stashDepth;window.stashPack=stashPack;window.stashLoad=stashLoad;window.stashReset=stashReset;window.stashRemote=stashRemote;window.stashSnapshot=stashSnapshot;
window.stashList=()=>stashes;window.stashTakeAll=takeAll;window.stashDismantle=dismantle;window.stashDeposit=deposit;window.stashWithdraw=withdraw;window.STASH_SLOTS=SLOTS;window.STASH_COST=COST;
})();
