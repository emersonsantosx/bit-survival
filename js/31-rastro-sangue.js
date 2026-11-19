/* RASTRO DE SANGUE
   Quem está sangrando deixa gotinhas no chão por onde anda (e uma ou outra quando está parado). A gota nasce vermelha e brilhante, escurece
   como sangue seco e some sozinha. A chuva lava mais rápido e a neve e a areia cobrem mais rápido (mesmo fator das manchas de zumbi, ver decayK em js/11).
   Só enfeita: não tem colisão, não entra no save nem no multiplayer, e a lista é limitada a CAP gotas. Não usa o sorteio da semente do mundo (só Math.random).
   Gota nascida dentro de prédio ou sobre piso construído é desenhada por cima do piso (drawBloodDrops com indoor=true, chamado em js/14); as de fora ficam junto das manchas de zumbi, embaixo dos veículos. */
(function(){
const LIFE=26,CAP=80;
let drops=[],lx=null,ly=null,acc=0,nextStep=18,idle=0;
window.bloodReset=function(){drops=[];lx=null;ly=null;acc=0;nextStep=18;idle=0;};
window.bloodList=()=>drops;
function add(x,y,big){
  const m=LIFE*(.8+Math.random()*.4);
  drops.push({x:x,y:y,l:m,m:m,s:big?2:(Math.random()<.3?2:1),r:Math.random()<.5?1:0,in:!!P.inside||(window.floorAt?floorAt(Math.floor(x/16),Math.floor(y/16)):false)});
  if(drops.length>CAP)drops.shift();
}
/* chamada todo quadro em que o jogador está sangrando (survivalTick, js/11) */
window.bloodDrip=function(dt){
  if(!P||P.dead||P.inVehicle||P.sleeping||pointInLake(P.x,P.y)){lx=null;idle=0;return;}   // carro, cama e água não pingam
  if(lx===null){lx=P.x;ly=P.y;}
  const d=Math.hypot(P.x-lx,P.y-ly);lx=P.x;ly=P.y;
  if(d>40){acc=0;return;}   // teleporte (porta, renascer): não risca o caminho todo
  if(P.moving){
    idle=0;acc+=d;
    if(acc>=nextStep){acc-=nextStep;nextStep=14+Math.random()*12;add(P.x+(Math.random()*4-2),P.y+2+(Math.random()*3-1),false);}
  }else{
    idle+=dt;
    if(idle>=1.3){idle=0;add(P.x+(Math.random()*6-3),P.y+2+(Math.random()*3-1),true);}   // parado: pinga no mesmo lugar, formando uma manchinha
  }
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
})();
