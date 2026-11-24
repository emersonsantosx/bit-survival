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
/* MANCHAS DE SANGUE DE ZUMBI/ANIMAL (decals: {x,y,l}, l = vida restante em segundos, DECAL_LIFE no começo)
   No chão: poça em pixel art, uma de 6 formas (redonda, com lóbulo, respingo, arrastada, pequena, grande), espelhada ou não, sorteada só pela posição
   (nada além de x,y,l vai para o save e a rede, e todas as telas desenham a mesma poça). Nasce vermelho vivo com brilho e vai secando até marrom.
   Na água (lago, oásis, mar): vira uma nuvem vermelha que se espalha, dilui e some mais cedo, recortada pelo contorno da água (pointInLake).
   Só enfeita: não usa o sorteio da semente do mundo (hash da posição). */
const BL_FORMAS=[
  ['...aabbbaa...','..abbbbbbba..','.abbcbbbbbba.','abbbcbbbbbbba','.abbbbbbbbba.','..abbbbbbba..','...aabbbaa...'],
  ['..aabba......','.abbbbbaaa...','abbcbbbbbbaa.','abbbbbbbbbbba','.abbbbbbbbba.','..aabbbbbaa..','....aabba....'],
  ['.a.....a......','...aabba..a...','..abbbbbaa....','.abbcbbbbba..a','..abbbbba.....','.a.aabba......','......a...a...'],
  ['..aabbbaa..........','.abbbcbbbbaaabba...','abbbbbbbbbbbbbbba..','.aabbbbbbbaabbaa...','...aaabbbaa.aa.....'],
  ['.aabba..','abbcbba.','abbbbbba','.abbbba.','..aaaa..'],
  ['....aaabbbaaa....','..aabbbbbbbbbaa..','.abbbbcbbbbbbba..','abbbbcbbbbbbbbbba','abbbbbbbbbbbbbbba','.abbbbbbbbbbbba.a','..aabbbbbbbbaa...','....aaabbbaaa..a.','.a...............']
];
const BL_RUNS=BL_FORMAS.map(f=>{const w=Math.max(...f.map(r=>r.length)),runs=[];
  f.forEach((r,y)=>{let x=0;while(x<r.length){const ch=r[x];if(ch==='.'){x++;continue;}let e=x;while(e<r.length&&r[e]===ch)e++;runs.push([x,y,e-x,ch]);x=e;}});
  return {w,h:f.length,runs};});
const BL_PAL=(()=>{   // 16 passos de cor, do sangue fresco (0) ao seco (15)
  const A=[[106,15,15],[156,28,28],[210,74,74]],B=[[51,9,10],[78,15,16],[94,22,22]],hex=v=>'#'+v.map(n=>('0'+Math.round(n).toString(16)).slice(-2)).join('');
  return Array.from({length:16},(_,i)=>{const t=i/15,m=k=>A[k].map((n,j)=>n+(B[k][j]-n)*t);return {a:hex(m(0)),b:hex(m(1)),c:hex(m(2))};});})();
function blHash(x,y){let h=(Math.round(x)*73856093^Math.round(y)*19349663)>>>0;h^=h>>>13;h=Math.imul(h,0x5bd1e995)>>>0;h^=h>>>15;return h>>>0;}
window.bloodDecalShape=function(d){const h=blHash(d.x,d.y);return {f:h%BL_FORMAS.length,fx:(h>>>8)&1,fy:(h>>>9)&1};};   // forma sorteada pela posição (também usada nos testes)
function blWaterMask(d){   // quais pixels da vizinhança estão dentro da água (calculado uma vez por mancha)
  const R0=14,H0=Math.floor(R0*.7),m=[];for(let dy=-H0;dy<=H0;dy++)for(let dx=-R0;dx<=R0;dx++)m.push(pointInLake(d.x+dx,d.y+dy)?1:0);
  return m;
}
function blDrawGround(d,age){
  const sh=window.bloodDecalShape(d),F=BL_RUNS[sh.f],pal=BL_PAL[Math.min(15,Math.floor(age/2))];
  const ox=Math.round(d.x-F.w/2),oy=Math.round(d.y+1-F.h/2);
  for(const [x,y,w,ch] of F.runs){
    const rx=sh.fx?F.w-x-w:x,ry=sh.fy?F.h-1-y:y;
    R(ox+rx,oy+ry,w,1,ch==='a'?pal.a:ch==='c'?(age<22?pal.c:pal.b):pal.b);
  }
}
function blDrawWater(d,age,alpha){
  if(d.wm===undefined)d.wm=blWaterMask(d);
  const h=blHash(d.x,d.y),R0=14,W=R0*2+1,rad=Math.min(12.5,2.5+age*1.1),dil=1-.45*Math.min(1,age/22);
  const rows=Math.floor(R0*.7)*2+1;
  for(let pass=0;pass<2;pass++){
    ctx.globalAlpha=alpha*dil*(pass?.5:.32);
    const rr=pass?rad*.55:rad,col=pass?'#8c1818':'#b83a3a';
    for(let iy=0;iy<rows;iy++){
      const dy=iy-Math.floor(R0*.7);let run=-1;
      for(let ix=0;ix<=W;ix++){
        let on=false;
        if(ix<W){const dx=ix-R0,nz=blHash(d.x*3+dx,d.y*7+dy+h)%100/100,lim=rr*(.78+.42*nz);on=d.wm[iy*W+ix]&&(dx*dx+(dy*1.35)*(dy*1.35))<lim*lim;}
        if(on&&run<0)run=ix;
        if(!on&&run>=0){R(d.x-R0+run,d.y+dy,ix-run,1,col);run=-1;}
      }
    }
  }
}
window.drawBloodDecal=function(d){
  const age=DECAL_LIFE-d.l;
  if(d.w===undefined){let n=0;for(const [ox,oy] of [[0,0],[-5,0],[5,0],[0,-3],[0,3]])if(pointInLake(d.x+ox,d.y+oy))n++;d.w=n>=3;}   // na agua se a maioria dos 5 pontos da mancha esta dentro do lago (beira: vence o lado maior)
  if(d.w){const a=Math.max(0,Math.min(1,(d.l-18)/14));if(a>0)blDrawWater(d,age,a);}
  else{ctx.globalAlpha=Math.max(0,Math.min(1,d.l/12));blDrawGround(d,age);}
  ctx.globalAlpha=1;
};
})();
