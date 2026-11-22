/* PASSAGEIRO NOS VEÍCULOS
   Cada veículo leva até 2 jogadores. O primeiro que entra dirige (v.driverId); o segundo vai de passageiro (v.passId).
   Os dois podem sair quando quiserem. Se o motorista sai, o passageiro assume o volante na hora (vehSeatLeave).
   Não existe flag no jogador: ser passageiro é v.passId === myNetId() (imPassenger), então nunca fica "preso" num estado velho.
   Só o motorista manda no veículo (posição, vida, física), como antes. O passageiro só acompanha: a posição dele segue o veículo
   (js/11) e o pacote dele leva vs (veículo) e vp:1 (passageiro), sem posição de veículo (js/12).
   Visual: nos veículos abertos o passageiro aparece atrás do motorista (moto de neve, quadriciclo) ou no banco do lado (buggy);
   no carro da cidade as cabeças aparecem pelo vidro. Cada aliado dentro do veículo ganha o nome flutuando em cima. */
(function(){
const SEATS=2;

window.imPassenger=function(){return !!(P&&P.inVehicle&&P.inVehicle.passId&&P.inVehicle.passId===myNetId());};

/* quem está no veículo sem contar a gente: pelas vagas marcadas e pelo que os pacotes dos aliados dizem */
function others(v){
  const me=myNetId(),s=new Set();
  if(v.driverId&&v.driverId!==me)s.add(v.driverId);
  if(v.passId&&v.passId!==me)s.add(v.passId);
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp||rp.alive===false||id===me||!rp.inVehicle)continue;
    if((v.id!==undefined&&rp.vehicleId===v.id)||(Number.isFinite(rp.x)&&Math.hypot(rp.x-v.x,rp.y-v.y)<18))s.add(id);
  }
  return s;
}
/* 'd' (vaga do motorista), 'p' (vaga do passageiro) ou null (lotado) */
window.vehFreeSeat=function(v){
  const o=others(v);
  if(o.size>=SEATS)return null;   // dois outros já estão lá (a gente não conta)
  return o.size===0?'d':'p';
};

/* entra no veículo: motorista se estiver vazio, passageiro se já tiver motorista, recusa se estiver lotado */
window.boardVehicle=function(nv){
  const me=myNetId();
  if(!nv.driverId&&nv.passId){nv.driverId=nv.passId;nv.passId=null;}   // sobrou só um passageiro: ele é o motorista
  const seat=vehFreeSeat(nv);
  if(!seat){say('Veículo lotado (2 lugares)!');beep(160,.08,'square',.05);return false;}
  if(seat==='p'&&Math.abs(nv.spd||0)>14){toast('Espere o veículo parar para entrar');beep(160,.08,'square',.05);return false;}
  if(nv.hp===undefined){nv.hp=100;nv.maxHp=100;}
  P.inVehicle=nv;nv.showHp=3;touchGas=0;touchSteer=0;
  if(seat==='d'){nv.spd=0;nv.driverId=me;if(nv.passId===me)nv.passId=null;}
  else nv.passId=me;
  showVehicleHUD();
  if(MP.active)sendEvt('vehicleEnter',{id:nv.id,driver:nv.driverId,who:me,seat:seat});
  if(seat==='p')toast('Passageiro: se o motorista sair, você assume o volante');
  else{const k=vehKind(nv);toast(k==='atv'?'Pilotando o quadriciclo':k==='sled'?'Pilotando a moto de neve':k==='buggy'?'Pilotando o buggy':'Dirigindo');}
  beep(440,.15,'square',.06);
  return true;
};

/* alguém (id) deixou o veículo: libera a vaga; se era o motorista e tem passageiro, o passageiro assume o volante.
   Roda igual em todas as telas (evento vehicleExit, pacote do aliado sem veículo, aliado que caiu), então todas chegam ao mesmo resultado. */
window.vehSeatLeave=function(v,id){
  if(!v||!id)return;
  if(v.passId===id){v.passId=null;return;}
  if(v.driverId!==id)return;
  v.driverId=null;v.spd=0;
  if(!v.passId)return;
  v.driverId=v.passId;v.passId=null;v._nx=undefined;
  if(P&&P.inVehicle===v&&v.driverId===myNetId()){
    touchGas=0;touchSteer=0;showVehicleHUD();
    say('Você assumiu o volante');beep(440,.15,'square',.06);
  }
};

/* dano que o ocupante levaria (zumbi, cuspe, bicho): o motorista aplica direto no veículo, que é dele; o passageiro avisa o dono do veículo */
window.riderHit=function(v,dmg){
  if(imPassenger()&&P.inVehicle===v&&MP.active&&MP.connected)hitOtherVehicle(v,dmg);
  else carTakeHit(v,dmg);
};

/* passageiro a cada quadro: fome, sede e regeneração seguem como no carro; a posição vem do veículo (js/11) */
window.passengerTick=function(dt){
  const v=P.inVehicle;
  if(P.fish)P.fish=null;
  v.showHp=3;P.sprint=false;touchGas=0;touchSteer=0;
  survivalTick(dt);
  if(P.dead)return;
  P.stam=Math.min(P._scap||100,P.stam+24*dt*(P._sreg||1));
  if(P.exhausted&&P.stam>Math.min(20,(P._scap||100)-8))P.exhausted=false;
  P.x=v.x;P.y=v.y;P.face=v.face||0;P.moving=false;
};

/* ---- visual ---- */
function seatLook(v,id,isMe){
  if(isMe)return myLook();
  const rp=id&&remotePlayers[id];
  return rp&&rp.alive!==false?remoteLook(rp):null;
}
window.vehPassLook=function(v){
  if(!v.passId)return null;
  return seatLook(v,v.passId,!!(P&&P.inVehicle===v&&v.passId===myNetId()));
};
/* carro fechado (cidade): cabeça e ombros de cada ocupante aparecem pelo vidro; motorista à esquerda, passageiro à direita */
function carSeat(sx,sy,lk){
  const sh=(lk.os==='tank'||lk.os==='bare')?lk.skin:lk.shirt;
  R(sx-4,sy-3,3,6,sh);R(sx-4,VLY>0?sy-3:sy+2,3,1,Sh(sh,.15));      // ombros (o realce fica do lado do sol: VLY, js/13)
  R(sx-2,sy-2,3,4,lk.hair);R(sx+1,sy-2,2,4,lk.skin);      // cabeça: cabelo atrás, rosto na frente
  if(lk.female)R(sx-3,sy-2,1,4,lk.hair);
}
window.drawCarSeats=function(v,L,W){
  const ld=vehDriverLook(v),lp=vehPassLook(v);
  if(!ld&&!lp)return;
  const sy=W/2-5.5;
  if(lp)carSeat(0,sy,lp);
  if(ld)carSeat(0,-sy,ld);
  R(-4,-W/2+3,6,W-6,'rgba(74,112,136,.2)');R(2,-W/2+3,8,W-6,'rgba(106,144,168,.14)');   // vidro por cima, para ficar "atrás da janela"
};
/* nome dos aliados que estão no veículo, flutuando em cima (o veículo esconde o personagem, então sem isso não dá para saber quem é) */
window.drawVehTags=function(v){
  const me=myNetId(),names=[];
  for(const id of [v.driverId,v.passId]){
    if(!id||id===me)continue;
    const rp=remotePlayers[id];
    if(rp&&rp.alive!==false)names.push({t:(rp.name||(rp.isHost?'HOST':'AMIGO')).toUpperCase().slice(0,10),c:ALLY_COL(rp)});
  }
  if(!names.length)return;
  const barUp=!v.destroyed&&(v.showHp>0||(v.hp!==undefined&&v.hp<(v.maxHp||100))||v.dying);
  const y=v.y-(v.dying?31:barUp?24:19);
  ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
  let w=0;for(const n of names)w+=ctx.measureText(n.t).width;w+=(names.length-1)*8;
  let x=v.x-w/2;
  names.forEach((n,i)=>{const tw=ctx.measureText(n.t).width;ctx.textAlign='left';ctx.fillStyle=n.c;ctx.fillText(n.t,x,y);x+=tw+8;});
  ctx.textAlign='center';
};
})();
