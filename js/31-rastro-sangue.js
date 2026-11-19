/* RASTRO DE SANGUE
   Quem está sangrando deixa gotinhas no chão por onde anda (e uma ou outra quando está parado). A gota nasce vermelha e brilhante, escurece
   como sangue seco e some sozinha. A chuva lava mais rápido e a neve e a areia cobrem mais rápido (mesmo fator das manchas de zumbi, ver decayK em js/11).
   Multiplayer: cada jogador manda só "estou sangrando" (bl:1 no pacote do jogador, js/12) e cada tela desenha as gotas dos aliados por conta própria,
   como já faz com as pegadas. Perto do aliado ferido aparece também uma gotinha vermelha ao lado da barra de vida (drawBleedMark), para saber quem precisa de bandagem.
   Só enfeita: não tem colisão, não entra no save, e a lista é limitada a CAP gotas. Não usa o sorteio da semente do mundo (só Math.random).
   Gota nascida dentro de prédio ou sobre piso construído é desenhada por cima do piso (drawBloodDrops com indoor=true, chamado em js/14); as de fora ficam junto das manchas de zumbi, embaixo dos veículos. */
(function(){
const LIFE=26,CAP=160,NEAR=620;   // NEAR: aliado mais longe que isso (em px) não deixa gotas, ninguém ia ver
let drops=[];
const mkSt=()=>({lx:null,ly:null,acc:0,next:18,idle:0});
let me=mkSt();
window.bloodReset=function(){drops=[];me=mkSt();for(const id in remotePlayers)delete remotePlayers[id]._bs;};
window.bloodList=()=>drops;
function add(x,y,big,inb){
  const m=LIFE*(.8+Math.random()*.4);
  drops.push({x:x,y:y,l:m,m:m,s:big?2:(Math.random()<.3?2:1),r:Math.random()<.5?1:0,in:!!inb||(window.floorAt?floorAt(Math.floor(x/16),Math.floor(y/16)):false)});
  if(drops.length>CAP)drops.shift();
}
/* um passo da trilha de quem está em (x,y): st guarda o estado de cada pessoa; moving diz se está andando */
function step(st,x,y,moving,dt,inb){
  if(st.lx===null){st.lx=x;st.ly=y;}
  const d=Math.hypot(x-st.lx,y-st.ly);st.lx=x;st.ly=y;
  if(d>40){st.acc=0;return;}   // teleporte (porta, renascer): não risca o caminho todo
  if(moving){
    st.idle=0;st.acc+=d;
    if(st.acc>=st.next){st.acc-=st.next;st.next=14+Math.random()*12;add(x+(Math.random()*4-2),y+2+(Math.random()*3-1),false,inb);}
  }else{
    st.idle+=dt;
    if(st.idle>=1.3){st.idle=0;add(x+(Math.random()*6-3),y+2+(Math.random()*3-1),true,inb);}   // parado: pinga no mesmo lugar, formando uma manchinha
  }
}
/* chamada todo quadro em que o jogador está sangrando (survivalTick, js/11) */
window.bloodDrip=function(dt){
  if(!P||P.dead||P.inVehicle||P.sleeping||pointInLake(P.x,P.y)){me.lx=null;me.idle=0;return;}   // carro, cama e água não pingam
  step(me,P.x,P.y,!!P.moving,dt,!!P.inside);
};
/* aliado sangrando (rp.bl vem do pacote dele): chamada todo quadro para cada aliado, em js/11 */
window.bloodDripRemote=function(rp,dt){
  const st=rp._bs||(rp._bs=mkSt());
  if(!rp.bl||rp.alive===false||rp.inVehicle||rp.sl||!Number.isFinite(rp.x)||!P||Math.hypot(rp.x-P.x,rp.y-P.y)>NEAR||pointInLake(rp.x,rp.y)){st.lx=null;st.idle=0;return;}
  if(Math.random()<dt*4)parts.push({x:rp.x,y:rp.y-2,vx:0,vy:10,t:.5,c:'#a01818',g:1});   // mesmo pingo que o jogador vê em si
  step(st,rp.x,rp.y,!!rp.moving,dt,!!bldAt(rp.x,rp.y));
};
/* envelhece as gotas; k = fator de clima (chuva lava mais rápido) */
window.bloodAge=function(dt,k){
  for(let i=drops.length-1;i>=0;i--){drops[i].l-=dt*(k||1);if(drops[i].l<=0)drops.splice(i,1);}
};
window.drawBloodDrops=function(vx0,vx1,vy0,vy1,indoor){
  if(!drops.length)return;
  for(let i=0;i<drops.length;i++){
    const d=drops[i];
    if(d.in!==indoor||d.x<vx0||d.x>vx1||d.y<vy0||d.y>vy1)continue;
    const fresh=d.l>d.m*.55;                       // primeiro brilhante, depois seco
    const c=fresh?'#8c1616':'#5a1010';
    ctx.globalAlpha=Math.min(1,d.l/6)*.95;          // somem aos poucos nos últimos segundos
    if(d.s===2){
      R(d.x-1,d.y-1,3,2,c);R(d.x+(d.r?1:-1),d.y+1,1,1,c);
      if(fresh)R(d.x-1,d.y-1,1,1,'#b52a2a');       // brilho de sangue fresco
    }else{
      R(d.x,d.y,d.r?2:1,1,c);
    }
  }
  ctx.globalAlpha=1;
};
/* gotinha vermelha ao lado da barra de vida do aliado que está sangrando (pisca de leve) */
window.drawBleedMark=function(rp){
  const x=Math.round(rp.x)+9,y=Math.round(rp.y)-19;
  ctx.globalAlpha=.88+.12*Math.sin(performance.now()/170);
  R(x-1,y,5,4,'#2a0606');R(x,y-1,3,1,'#2a0606');R(x,y+4,3,1,'#2a0606');   // contorno escuro para aparecer em qualquer chão
  R(x+1,y,1,1,'#ff3a3a');R(x,y+1,3,2,'#ff3a3a');R(x+1,y+3,1,1,'#ff3a3a');R(x+1,y+1,1,1,'#ffc0c0');
  ctx.globalAlpha=1;
};
})();
