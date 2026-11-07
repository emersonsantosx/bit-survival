/* ============ POCO (agua para beber, encher garrafa e manter a horta umida) ============
   Dois jeitos de aparecer:
   1) gerado com o mundo (mesma semente = mesmos pocos, nada de save): ao lado de algumas casas na floresta, na neve e no deserto, e, na cidade,
      so no fundo de alguns quintais cercados e gramados (nunca em praca);
   2) fabricado pelo jogador (8 pedras e 4 madeiras): monta na frente do personagem. Fica no save e vai para o convidado pelo snapshot/evento wellAdd.
   Regras por mapa (estado local de cada jogador, nao salvo): floresta e cidade sempre tem agua; deserto: cada poco rende poucos goles e se enche de
   novo devagar, e o poco fabricado so da certo perto de um oasis; neve: de noite ou nevando o poco congela, o primeiro uso quebra o gelo.
   Um canteiro perto de um poco fica sempre umido (como perto de um lago).
   Estado: wells = [{x,y,g:1 gerado | 0 do jogador}]. Modulo no padrao dos 18..22: IIFE + window.*  */
(function(){
const COST_STONE=8,COST_WOOD=4,NEAR=40,SIP=14,DESERT_MAX=3,DESERT_REFILL=90,THAW=150,OASIS_R=340;
let wells=[];
const R2=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};

/* ---------- regras ---------- */
function frozen(w){return selectedMap==='snow'&&(dark>=.5||weather==='snow')&&T>=(w.thaw||0);}
function oasisNear(x,y){for(const l of lakes)if(!l.fountain&&Math.hypot(x-l.cx,y-l.cy)<l.r+OASIS_R)return true;return false;}
function wellNearby(){
  let b=null,bd=NEAR;
  for(const w of wells){const d=Math.hypot(w.x-P.x,w.y-P.y);if(d<bd){bd=d;b=w;}}
  return b;
}
function wellNear(x,y,r){for(const w of wells)if(Math.abs(w.x-x)<r&&Math.abs(w.y-y)<r&&Math.hypot(w.x-x,w.y-y)<r)return true;return false;}
function wellUse(w){
  if(!w||!P||P.dead)return;
  const splash=()=>{for(let i=0;i<5;i++)parts.push({x:w.x+rnd(-5,5),y:w.y-6,vx:rnd(-12,12),vy:rnd(-30,-10),t:.35,c:'#8cc8f0'});};
  if(frozen(w)){
    w.thaw=T+THAW;toast('Você quebrou o gelo do poço');beep(300,.08,'square',.05,-120);
    for(let i=0;i<7;i++)parts.push({x:w.x+rnd(-6,6),y:w.y-6,vx:rnd(-24,24),vy:rnd(-40,-10),t:.4,c:'#e8f6ff'});
    return;
  }
  if(selectedMap==='desert'){   // pouca agua: poucos goles e volta devagar
    if(w.q===undefined){w.q=DESERT_MAX;w.qt=T;}
    w.q=Math.min(DESERT_MAX,w.q+Math.max(0,T-w.qt)/DESERT_REFILL);w.qt=T;
    if(w.q<1){toast('O poço secou por agora. Volte daqui a pouco');beep(140,.06,'square',.04);return;}
  }
  if(P.water<97){
    P.water=Math.min(100,P.water+SIP);toast('Você bebeu água do poço');
  }else{
    if(!addItem('water')){toast('Sede saciada · inventário cheio');return;}
    toast('Garrafa enchida no poço');
  }
  if(selectedMap==='desert')w.q-=1;
  beep(430,.1,'sine',.045);splash();
}

/* ---------- espaco e montagem ---------- */
function spotOk(x,y){
  if(x<40||y<40||x>WW-40||y>WH-40)return false;
  if(solidPoint(x,y,13)||pointInLake(x,y+8))return false;
  if(selectedMap==='city'&&onCityRoad(x,y,14))return false;
  if(window.playerWallBlocks&&playerWallBlocks(P?P.x:x,P?P.y:y,x,y))return false;
  if(wells.some(w=>Math.hypot(w.x-x,w.y-y)<30))return false;
  if(window.stashList&&stashList().some(s=>Math.hypot(s.x-x,s.y-y)<26))return false;
  if(campfires.some(c=>Math.hypot(c.x-x,c.y-y)<24))return false;
  if(tents.some(t=>Math.hypot(t.x-x,t.y-y)<36))return false;
  return true;
}
function wellSpot(){
  if(!P||P.inside||bldAt(P.x,P.y))return null;
  for(const d of [28,36,46]){
    for(const da of [0,.5,-.5,1,-1,1.6,-1.6,3.14]){
      const a=(P.face||0)+da,x=Math.round(P.x+Math.cos(a)*d),y=Math.round(P.y+Math.sin(a)*d);
      if(spotOk(x,y))return {x,y};
    }
  }
  return null;
}
function wellWhy(){   // por que nao da para montar aqui (null = da)
  if(P.inside||bldAt(P.x,P.y))return 'Monte o poço ao ar livre';
  if(selectedMap==='desert'&&!oasisNear(P.x,P.y))return 'No deserto o poço só dá água perto de um oásis';
  return wellSpot()?null:'Sem espaço para o poço aqui';
}
function wellBuild(sp){
  sp=sp||wellSpot()||{x:Math.round(P.x+30),y:Math.round(P.y)};
  wells.push({x:sp.x,y:sp.y,g:0});rebuildSolidGrid();pushOut(P,P.r);remark();
  if(MP.active){
    sendEvt('wellAdd',{x:sp.x,y:sp.y});
    if(MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
  }
  toast('Poço montado! Chegue perto e use ÁGUA');buildSound();
  for(let i=0;i<8;i++)parts.push({x:sp.x+rnd(-8,8),y:sp.y-2,vx:rnd(-18,18),vy:rnd(-26,-6),t:.4,c:'#a8a8a0'});
}
function remark(){try{if(window.plotsRemark)plotsRemark();}catch(e){}}   // canteiros ja arados perto do poco novo passam a ficar umidos

/* ---------- geracao (determinista: so hash da posicao, nao sorteia nada do mundo) ---------- */
function wellGenAdd(x,y){
  x=Math.round(x);y=Math.round(y);
  if(wells.some(w=>Math.hypot(w.x-x,w.y-y)<30))return false;
  wells.push({x,y,g:1});return true;
}
function wellsGen(){   // floresta, neve e deserto: ao lado de algumas casas (a cidade poe os seus nos quintais, em js/08)
  const map=selectedMap;if(map==='city')return;
  const cfg={forest:{ch:.3,max:6,want:['house','cabin','barn']},snow:{ch:.3,max:4,want:['cabin','house']},desert:{ch:.34,max:3,want:['house','barn','cabin']}}[map];
  if(!cfg)return;
  let n=0;
  for(const b of blds){
    if(n>=cfg.max)break;
    if(!cfg.want.includes(b.type))continue;
    const lr=mkRng(((Math.round(b.x)*53+Math.round(b.y)*79+(b.w|0)*7+11)%99989)/99989);
    if(lr()>=cfg.ch)continue;
    const dx=Number.isFinite(b.doorX)?b.doorX+(b.door||0)/2:b.x+b.w/2,dy=b.y+b.h;
    let done=false;
    for(let k=0;k<16&&!done;k++){
      const side=Math.floor(lr()*4),j=lr();let x,y;
      if(side===0){x=b.x+b.w+30+lr()*22;y=b.y+8+j*Math.max(6,b.h-16);}
      else if(side===1){x=b.x-30-lr()*22;y=b.y+8+j*Math.max(6,b.h-16);}
      else if(side===2){x=b.x+10+j*Math.max(6,b.w-20);y=b.y-14-lr()*14;}
      else{x=b.x+10+j*Math.max(6,b.w-20);y=b.y+b.h+30+lr()*16;}
      x=Math.round(x);y=Math.round(y);
      if(x<60||y<60||x>WW-60||y>WH-60)continue;
      if(Math.hypot(x-dx,y-dy)<44)continue;                              // nunca na porta
      if(solidPoint(x,y,20)||pointInLake(x,y+10)||bldAt(x,y)||bldAt(x,y-22)||onCityRoad(x,y,16))continue;
      if(trees.some(t=>Math.abs(t.x-x)<26&&t.y>y-30&&t.y<y+10))continue;   // sem copa por cima
      if(window.plotList&&plotList().some(p=>Math.abs(p.cx*16+8-x)<34&&Math.abs(p.cy*16+8-y)<34))continue;
      if(window.ghList&&ghList().some(g=>x>g.x-26&&x<g.x+74&&y>g.y-26&&y<g.y+74))continue;
      if(wells.some(w=>Math.hypot(w.x-x,w.y-y)<140))continue;
      if(wellGenAdd(x,y)){done=true;n++;}
    }
  }
  rebuildSolidGrid();
}
function wellReset(){wells=[];}

/* ---------- desenho: aro de pedra, dois postes, telhadinho, corda e balde ---------- */
function drawWell(w){
  const x=Math.round(w.x),y=Math.round(w.y),ice=frozen(w);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+3,12,4,0,0,6.283);ctx.fill();
  R2(x-10,y-8,20,11,'#3a3d44');                                        // contorno
  R2(x-9,y-7,18,9,'#9aa0a8');R2(x-9,y-7,18,2,'#c4cad2');                // pedra clara
  R2(x-9,y-1,18,3,'#6a7280');
  for(const [bx,by] of [[-6,-5],[0,-5],[5,-5],[-3,-2],[3,-2],[-8,-2]])R2(x+bx,y+by,1,2,'#6a7280');   // juntas das pedras
  R2(x-6,y-8,12,3,ice?'#dff3ff':'#2a6a9a');R2(x-5,y-8,5,1,ice?'#ffffff':'#5aa8d8');                   // agua (ou gelo)
  R2(x-9,y-22,2,15,'#5a3a24');R2(x+7,y-22,2,15,'#5a3a24');R2(x-9,y-22,1,15,'#8a5a2a');R2(x+7,y-22,1,15,'#8a5a2a');   // postes
  R2(x-12,y-27,24,5,'#8a2a20');R2(x-12,y-27,24,1,'#c8482e');R2(x-12,y-23,24,1,'#5a1a14');             // telhado
  R2(x-9,y-22,18,2,'#6a4428');                                                                          // viga
  const sw=Math.round(Math.sin(T*2+x)*1);
  R2(x,y-20,1,8,'#c8b080');                                                                              // corda
  R2(x-2+sw,y-12,5,4,'#8a5a2a');R2(x-2+sw,y-12,5,1,'#c8924e');R2(x-2+sw,y-10,5,1,'#5a3a24');            // balde
  if(ice){R2(x-9,y-7,1,1,'#fff');R2(x+8,y-7,1,1,'#fff');R2(x-11,y-27,1,1,'#fff');R2(x+10,y-27,2,1,'#e8f6ff');}   // geada
}
function wellDepth(w){return w.y+2;}

/* ---------- save e rede ---------- */
const okPt=q=>Array.isArray(q)&&Number.isFinite(q[0])&&Number.isFinite(q[1]);
function wellPack(){return wells.filter(w=>!w.g).map(w=>[Math.round(w.x),Math.round(w.y)]);}   // os gerados voltam sozinhos pela semente
function wellLoad(a){
  wells=wells.filter(w=>w.g);
  if(Array.isArray(a))for(const q of a.slice(0,100))if(okPt(q)&&!wells.some(w=>Math.abs(w.x-q[0])<8&&Math.abs(w.y-q[1])<8))wells.push({x:q[0],y:q[1],g:0});
  rebuildSolidGrid();remark();
}
function wellRemote(kind,d){
  if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.y))return;
  if(kind==='wellAdd'&&wells.length<200&&!wells.some(w=>Math.abs(w.x-d.x)<8&&Math.abs(w.y-d.y)<8)){wells.push({x:d.x,y:d.y,g:0});rebuildSolidGrid();remark();}
}
function wellSnapshot(a){
  if(!Array.isArray(a))return;
  let ch=false;
  for(const q of a.slice(0,100))if(okPt(q)&&!wells.some(w=>Math.abs(w.x-q[0])<8&&Math.abs(w.y-q[1])<8)){wells.push({x:q[0],y:q[1],g:0});ch=true;}
  if(ch){rebuildSolidGrid();remark();}
}

window.wellList=()=>wells;window.wellNearby=wellNearby;window.wellNear=wellNear;window.wellUse=wellUse;window.wellSpot=wellSpot;window.wellWhy=wellWhy;window.wellBuild=wellBuild;
window.wellGenAdd=wellGenAdd;window.wellsGen=wellsGen;window.wellReset=wellReset;window.drawWell=drawWell;window.wellDepth=wellDepth;
window.wellPack=wellPack;window.wellLoad=wellLoad;window.wellRemote=wellRemote;window.wellSnapshot=wellSnapshot;window.wellFrozen=frozen;
window.WELL_COST={stone:COST_STONE,wood:COST_WOOD};
})();
