/* ====================== VEICULO NA AGUA (todos os mapas) ======================
   So visual: lago da floresta, buraco no gelo da neve, oasis do deserto e mar raso da cidade. A parte do veiculo que esta sobre a agua
   (lakeDepth > 0) fica submersa: rodas e bordas cobertas de agua, espuma na linha d'agua, balanco leve, marolas parado, e andando o
   rastro de espuma atras e os respingos na frente. Quanto mais fundo, mais a agua sobe pelo veiculo; o meio (bancos, teto) fica de fora.
   Nada e sincronizado nem salvo: cada aparelho calcula pela posicao do veiculo (campos com _ ficam fora do save e do snapshot). */
const VW_RGB='36,118,166';
/* estado deste quadro; null = veiculo inteiro em terra firme */
function vehWaterState(v){
  const L=v.w||36,W=v.h||20,c=Math.cos(v.face||0),s=Math.sin(v.face||0);
  let sum=0,max=0;
  for(const a of[-.5,0,.5])for(const b of[-.55,0,.55]){
    const d=lakeDepth(v.x+a*L*c-b*W*s,v.y+a*L*s+b*W*c);
    sum+=d;if(d>max)max=d;
  }
  const w=v._water||(v._water={t:T,x:v.x,y:v.y,spd:0,dir:1,wake:[],drops:[],acc:0,dacc:0});
  const dt=T-w.t;
  if(dt<0||dt>.5){w.wake.length=0;w.drops.length=0;w.spd=0;w.x=v.x;w.y=v.y;w.t=T;}   // voltou para a tela ou carregou outro mundo
  else if(dt>0){
    const dx=v.x-w.x,dy=v.y-w.y,along=(dx*c+dy*s)/dt;
    w.spd+=(Math.min(160,Math.hypot(dx,dy)/dt)-w.spd)*Math.min(1,dt*8);
    if(Math.abs(along)>4)w.dir=along>0?1:-1;
    w.x=v.x;w.y=v.y;w.t=T;
    vehWaterStep(v,w,dt,L,W,c,s,max>.02&&!v.destroyed);
  }
  if(max<=.02&&!w.wake.length&&!w.drops.length)return null;
  return {w,L,W,c,s,max,depth:sum/9};
}
/* rastro e respingos */
function vehWaterStep(v,w,dt,L,W,c,s,wet){
  for(const q of w.wake){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;}
  w.wake=w.wake.filter(q=>q.t<q.life);
  for(const q of w.drops){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vz-=170*dt;q.z+=q.vz*dt;}
  w.drops=w.drops.filter(q=>q.t<.8&&q.z>=0);
  if(!wet||w.spd<8){w.acc=0;w.dacc=0;return;}
  const k=Math.min(1,w.spd/80),back=-w.dir*L*.5,front=w.dir*L*.42;
  w.acc+=dt*(10+24*k);
  while(w.acc>=1){
    w.acc--;
    for(const side of[-1,1]){   // duas linhas de espuma que se abrem em V
      const ly=side*W*.52,x=v.x+back*c-ly*s,y=v.y+back*s+ly*c,out=side*(7+16*k);
      if(lakeDepth(x,y)>.02&&w.wake.length<90)w.wake.push({x,y,vx:-s*out,vy:c*out,t:0,life:.55+.55*k,a:v.face||0,n:2+Math.round(Math.random()*2)});
    }
  }
  w.dacc+=dt*(w.spd>18?8+40*k:0);
  while(w.dacc>=1){
    w.dacc--;
    const side=Math.random()<.5?-1:1,lx=Math.random()<.75?front+rnd(-4,4):back+rnd(-3,3),ly=side*(W*.5+rnd(0,3));
    const x=v.x+lx*c-ly*s,y=v.y+lx*s+ly*c;
    if(lakeDepth(x,y)<=.02||w.drops.length>=50)continue;
    const out=side*rnd(10,34)*(.5+k),fw=w.dir*rnd(-10,25)*k;
    w.drops.push({x,y,z:1,vx:fw*c-s*out,vy:fw*s+c*out,vz:rnd(22,52)*(.45+k*.7),t:0,sz:Math.random()<.3?2:1});
  }
}
/* antes do veiculo (coordenadas do mundo): marolas e rastro de espuma na superficie */
function vehWaterUnder(v,st){
  const {w,L,W,max}=st;
  ctx.save();
  if(max>.02){
    ctx.strokeStyle='#e6f6ff';ctx.lineWidth=1;
    const calm=1-Math.min(1,w.spd/45);
    if(calm>.05)for(let i=0;i<2;i++){
      const p=(T*.55+i*.5)%1;
      const x=v.x,y=v.y;
      if(lakeDepth(x,y)<=.02)break;
      ctx.globalAlpha=.45*(1-p)*calm;
      ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),L*.56+p*13,W*.66+p*10,v.face||0,0,6.283);ctx.stroke();
    }
  }
  for(const q of w.wake){
    if(lakeDepth(q.x,q.y)<=.02)continue;
    const f=1-q.t/q.life;
    ctx.save();ctx.globalAlpha=.75*f;ctx.translate(q.x,q.y);ctx.rotate(q.a);
    ctx.fillStyle='#e6f6ff';ctx.fillRect(-q.n,-1,q.n*2+1,2);
    ctx.fillStyle='#8cc8e4';ctx.fillRect(-q.n,1,q.n*2+1,1);
    ctx.restore();
  }
  ctx.restore();
}
/* contorno de cada veiculo (os mesmos retangulos do desenho, js/13): a agua so pinta em cima do veiculo, nunca um quadrado em volta */
const VW_MASK={};
function vehWaterMask(K,L,W){
  const key=K+L+'x'+W;if(VW_MASK[key])return VW_MASK[key];
  const wheels=(x2,w,h,y)=>[[-L/2+(K==='car'?4:1),-W/2-y,w,h],[x2,-W/2-y,w,h],[-L/2+(K==='car'?4:1),W/2-3,w,h],[x2,W/2-3,w,h]];
  const parts={
    car:[[-L/2,-W/2,L,W],...wheels(L/2-8,4,5,2)],
    atv:[[-L/2+4,-W/2+3,L-8,W-6],[-L/2,-W/2+4,6,W-8],[L/2-13,-W/2,3,W],[L/2-4,-3,4,6],...wheels(L/2-9,7,5,2)],
    sled:[[-L/2,-W/2+3,13,W-6],[-L/2+4,-W/2+2,L-8,W-4],[L/2-16,-W/2,3,W],[L/2-4,-3,5,6],[L/2-12,-W/2-1,13,3],[L/2-12,W/2-2,13,3],[L/2+1,-W/2-2,2,2],[L/2+1,W/2,2,2]],
    buggy:[[-L/2+3,-W/2+3,L-6,W-6],[-L/2-1,-5,4,10],[-6,-W/2+2,13,W-4],...wheels(L/2-10,8,6,3)]
  }[K];
  const set=new Set(),px=[];
  for(const [x,y,w,h] of parts)for(let j=Math.round(y);j<Math.round(y)+h;j++)for(let i=Math.round(x);i<Math.round(x)+w;i++){
    const k=i+','+j;if(!set.has(k)){set.add(k);px.push([i,j]);}
  }
  px.sort((p,q)=>p[1]-q[1]||p[0]-q[0]);   // linha por linha
  return VW_MASK[key]={set,px};
}
/* por cima do casco e das rodas e por baixo de quem vai no veiculo (coordenadas locais: +X = frente): a agua subindo pela borda */
function vehWaterHull(v,st){
  const {L,W,c,s,max}=st;
  if(max<=.02)return;
  const m=vehWaterMask(vehKind(v),L,W),wet=new Map(),dc=new Map();
  for(const [x,y] of m.px){
    const gx=x>>1,gy=y>>1,gk=gx*512+gy;let d=dc.get(gk);   // profundidade por bloco de 2 px (barato)
    if(d===undefined){const lx=gx*2+1,ly=gy*2+1;d=lakeDepth(v.x+lx*c-ly*s,v.y+lx*s+ly*c);dc.set(gk,d);}
    if(d<=.02)continue;
    /* e: 0 no meio do veiculo, 1 na borda; a linha d'agua entra mais quanto mais fundo, e ondula */
    const ex=Math.abs(x+.5)/(L/2),ey=Math.abs(y+.5)/(W/2),e=Math.pow(ex*ex*ex*ex+ey*ey*ey*ey,.25);
    const line=.98-.38*Math.min(1,d*1.4)+Math.sin(T*4+x*.45+y*.7)*.05;
    if(e>=line)wet.set(x+','+y,{x,y,d,over:e-line,side:ex>ey});
  }
  /* pinta em faixas: pixels vizinhos na mesma linha e com a mesma forca saem num retangulo so (poucas dezenas de desenhos por veiculo) */
  let run=null;const foam=[],out=()=>{if(run)R(run.x,run.y,run.n,1,'rgba('+VW_RGB+','+(run.a/10)+')');run=null;};
  for(const q of wet.values()){   // na ordem de entrada: o contorno ja vem linha por linha
    const a=Math.round(Math.min(.86,.46+.2*q.d+q.over*.8)*10);
    if(run&&run.y===q.y&&run.x+run.n===q.x&&run.a===a)run.n++;else{out();run={x:q.x,y:q.y,n:1,a};}
    /* espuma na linha d'agua: pixel molhado encostado num pixel seco do veiculo */
    const ix=q.x-(q.side?Math.sign(q.x+.5):0),iy=q.y-(q.side?0:Math.sign(q.y+.5)),k=ix+','+iy;
    if(m.set.has(k)&&!wet.has(k)){
      const f=.6+.35*Math.sin(T*5+q.x*.9-q.y*.6);
      if(f>.4)foam.push(q.x,q.y,f);
    }
  }
  out();
  for(let i=0;i<foam.length;i+=3)R(foam[i],foam[i+1],1,1,'rgba(226,244,255,'+foam[i+2].toFixed(2)+')');
}
/* depois do veiculo (coordenadas do mundo): respingos no ar */
function vehWaterOver(st){
  for(const q of st.w.drops){
    R(q.x,q.y-q.z,q.sz,q.sz,q.t<.35?'#f0faff':'#a8d8f0');
  }
}
