/* Este arquivo roda dentro de uma funcao propria: tudo o que ele define fica escondido dos outros arquivos,
   menos a lista abaixo (o que os outros arquivos realmente usam). Para expor mais um nome, acrescente-o aqui. */
(function(){
// funcoes (ja existem desde o inicio do bloco)
window.mkRng=mkRng;
window.genAmbientProps=genAmbientProps;
window.shadow=shadow;
window.addPulse=addPulse;
window.ambLife=ambLife;
window.ambFx=ambFx;
window.updateLighting=updateLighting;
window.applyBolt=applyBolt;
window.drawAmbProp=drawAmbProp;
window.drawIceCracks=drawIceCracks;
window.lakeGlints=lakeGlints;
window.render=render;
/* ============ ARQUITETURA POR MAPA ============
   Cada prédio tem um visual próprio: formato do telhado, material da fachada, janelas, porta, varanda e enfeites.
   O visual sai de uma tabela por mapa e por tipo de prédio, sorteada por um hash da posição do prédio (sem gastar o
   sorteio do mundo), então mundo, loot, saves e multiplayer continuam idênticos: só a aparência muda.
   Tudo é desenhado uma vez em canvas pequenos e reaproveitado a cada quadro. */
const _shC={};
function shadeCol(hex,k){                 // k>0 clareia, k<0 escurece; sempre devolve #rrggbb
  const key=hex+'|'+k;if(_shC[key])return _shC[key];
  const n=parseInt(hex.slice(1),16),t=k<0?0:255,a=Math.abs(k);
  const f=v=>Math.round(v+(t-v)*a).toString(16).padStart(2,'0');
  return _shC[key]='#'+f(n>>16)+f((n>>8)&255)+f(n&255);
}
function bHash(b,k){                      // 0..1 estável para o mesmo prédio e o mesmo k
  let t=0;for(let i=0;i<b.type.length;i++)t=(t*31+b.type.charCodeAt(i))|0;
  let h=(Math.imul(b.x|0,374761393)+Math.imul(b.y|0,668265263)+Math.imul(b.w|0,40503)+Math.imul(b.h|0,9973)+Math.imul(k|0,2246822519)+t)|0;
  h=Math.imul(h^(h>>>15),2246822519);h=Math.imul(h^(h>>>13),3266489917);h^=h>>>16;
  return (h>>>0)/4294967296;
}
function mkRng(s){let a=(s*4294967296)>>>0||1;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

/* shape: formato do telhado | tex: textura | roof: cores | mat: material da parede | wall: cores | win: janelas | porch: entrada | ext: [enfeite, chance] */
const ARCH={
  forest:{
    house:{shape:['gableH','gableV','hip','cross','gableH','hip'],tex:['shingle','shingle','slate','moss','shingle'],roof:['#74503a','#5a606e','#6a4a4a','#6b5a38','#4a5a44','#7a6a50','#8a3a30','#4a525c'],mat:['siding','siding','plank','stone'],wall:['#c9b890','#8fa08a','#b8a090','#a8b4bc','#c8c0a8','#9a7a52','#d8c8a0','#8a98a8'],win:['shutter','shutter','plain'],porch:['deck','deck','steps','none'],ext:[['chimney',.75],['dormer',.3],['woodpile',.35],['planter',.4]]},
    cabin:{shape:['gableH','gableV','shed','gableH'],tex:['shingle','thatch','moss','shingle'],roof:['#5a3a2a','#6a4a30','#4a3a2a','#6b5a38'],mat:['log'],wall:['#8a5e38','#6a4426','#7c5030','#946a40'],win:['shutter','plain'],porch:['deck','deck','steps','none'],ext:[['chimneyStone',.9],['woodpile',.65],['skylight',.2]]},
    shop:{shape:['flat','gableH','shed'],tex:['shingle','metal'],roof:['#9a4040','#7a3030','#8a5a3a','#4a6a7a'],mat:['plank','siding'],wall:['#a8825a','#8a9a8a','#b0a080','#7a8aa0'],win:['awning'],porch:['steps','deck'],ext:[['sign',1],['vent',.5],['ac',.3]]},
    mil:{shape:['flat'],tex:['concrete'],roof:['#56683f','#4e5e3a'],mat:['concrete'],wall:['#6a7258','#5e6850'],win:['slit'],porch:['sandbag'],ext:[['camo',1],['antenna',.8],['vent',.6],['dish',.3]]}
  },
  snow:{
    house:{shape:['gableH','gableV','hip','cross','gableH','aframe'],tex:['slate','shingle','shingle'],roof:['#3e4a5c','#4a5a6e','#5a3a2a','#6a3a30','#38485a','#505a66'],mat:['plank','plank','siding','stone'],wall:['#6a4a34','#5a3e2a','#7a5a40','#7a8aa0','#8a7a7a','#9aa4b0','#8a5a44'],win:['shutter','plain'],porch:['deck','steps','none'],ext:[['chimneyStone',.9],['dormer',.3],['woodpile',.5],['drift',1]]},
    cabin:{shape:['aframe','gableH','gableV','aframe','shed'],tex:['shingle','slate'],roof:['#5a3a2a','#4a3a34','#3e4a5c','#6a3a30'],mat:['log'],wall:['#6a4a34','#5a3e2a','#7a5232','#84603c'],win:['shutter','plain'],porch:['deck','none'],ext:[['chimneyStone',1],['woodpile',.7],['drift',1]]},
    shop:{shape:['gableH','shed','flat'],tex:['shingle','metal'],roof:['#6a3a30','#38485a','#505a66'],mat:['plank','siding'],wall:['#7a5a40','#7a8aa0','#8a7a7a'],win:['awning'],porch:['steps','deck'],ext:[['sign',1],['vent',.4],['drift',1]]},
    mil:{shape:['flat'],tex:['concrete'],roof:['#3a4a3a','#4a5a4a'],mat:['concrete'],wall:['#5a6a68','#6a746e'],win:['slit'],porch:['sandbag'],ext:[['antenna',.9],['vent',.6],['dish',.4],['drift',1]]}
  },
  desert:{
    house:{shape:['flat','flat','flatStep','hip','dome','shed','flatStep'],tex:['tile','plain'],texBy:{hip:['tile'],shed:['metal'],flat:['plain'],flatStep:['plain'],dome:['plain']},roof:['#b5603a'],roofBy:{hip:['#b5603a','#c47040','#a85a34'],shed:['#8a4a2a','#7a6a58','#6a7a80']},mat:['adobe','adobe','stucco','stucco'],wall:['#d2a66a','#c89a5c','#e0b880','#b88850','#dcc090','#e8dcc0','#c07a4a'],win:['awning','plain','plain'],porch:['pergola','pergola','steps','none'],door:['#2a8a8a','#5a3a24','#8a3a30','#3a6aa0','#4a8a5a'],ext:[['vigas',.7],['tank',.3],['dish',.3],['solar',.2],['laundry',.25],['ladder',.25],['barrel',.35]]},
    shop:{shape:['flat','flatStep','shed'],tex:['plain','metal'],roof:['#8a6a3a','#8a4a2a'],mat:['adobe','stucco'],wall:['#d8b078','#e0c898','#c89a5c','#d0a070'],win:['awning'],porch:['pergola','steps'],door:['#2a8a8a','#8a3a30','#3a6aa0'],ext:[['sign',1],['vigas',.6],['crate',.5],['vent',.3]]},
    barn:{shape:['gambrel','gableH','gambrel'],tex:['metal'],roof:['#8a4a2a','#9a5a30','#7a6a58','#6a3a2a'],mat:['metal','plank'],wall:['#7a4a30','#8a5a3a','#6a5a48','#8a3a28'],win:['slit'],porch:['none'],door:['#8a3a28'],ext:[['cupola',.6],['vent',.7],['hay',.6]]},
    mil:{shape:['flat'],tex:['concrete'],roof:['#8a8458','#7a7a50'],mat:['concrete'],wall:['#9a9060','#8a8458'],win:['slit'],porch:['sandbag'],ext:[['camo',1],['antenna',.8],['dish',.4],['vent',.5]]}
  },
  city:{
    house:{shape:['gableH','gableV','hip','cross','gableH','hip'],tex:['shingle','shingle','slate'],roof:['#4a4a52','#5a5a60','#6a5a50','#3e4650','#5a4a46','#7a4a40'],mat:['siding','siding','brick','stucco'],wall:['#d8cfb8','#c8b8a0','#b8c4c8','#a8553a','#c8a888','#9aa8b4','#8a9a88'],win:['shutter','plain','plain'],porch:['steps','steps','deck','none'],ext:[['chimney',.5],['ac',.4],['dormer',.2],['bin',.4]]},
    apartment:{shape:['flat'],tex:['gravel'],roof:['#4a5560','#3a4550','#555a68','#4a4a58'],mat:['brick','concrete','stucco'],wall:['#a8553a','#8a4a3a','#b86a48','#a09a90','#b8b0a0','#9a8878'],win:['plain'],porch:['steps'],ext:[['bulkhead',.9],['ac',.9],['tank',.4],['antenna',.4],['vent',.7]]},
    office:{shape:['flat','flatStep'],tex:['gravel'],roof:['#4a5560','#555a68','#3a4550'],mat:['glass','concrete'],wall:['#5a7a96','#4a6a86','#6a8aa6','#8a8d92'],win:['glass'],porch:['steps'],ext:[['helipad',.3],['ac',.9],['antenna',.7],['vent',.6],['solar',.3]]},
    shop:{shape:['flat','flat','shed'],tex:['gravel','metal'],roof:['#7a3030','#8a4040','#6a2828','#5a606a'],mat:['brick','stucco','plank'],wall:['#b86a48','#c8b8a0','#a8825a','#9aa8b4'],win:['awning','glass'],porch:['steps'],ext:[['sign',1],['ac',.6],['vent',.5]]},
    warehouse:{shape:['sawtooth','gableH','flat'],tex:['metal'],roof:['#6a7480','#7a8490','#586470','#8a8f94'],mat:['metal','concrete'],wall:['#7a8490','#8a9098','#6a747e','#9a9a90'],win:['highslit'],porch:['dock'],ext:[['vent',1],['ac',.4],['skylight',.5]]},
    garage:{shape:['shed','flat','gableH'],tex:['metal','gravel'],roof:['#6a7480','#5a606a','#7a4a40'],mat:['metal','concrete','brick'],wall:['#7a8490','#a09a90','#a8553a','#8a9098'],win:['highslit','plain'],porch:['none'],ext:[['vent',.8],['ac',.3]]},
    clinic:{shape:['flat'],tex:['gravel'],roof:['#c8d0d8','#b8c4cc'],mat:['stucco'],wall:['#e8ecee','#dfe6ea','#d8e4e8'],win:['plain'],porch:['ramp'],door:['#3a6aa0'],ext:[['cross',1],['ac',.7],['helipad',.15],['vent',.4]]},
    gas:{shape:['flat'],tex:['gravel'],roof:['#c8a030','#a03030','#d0d0d0'],mat:['stucco','concrete'],wall:['#e8e0c8','#d8d8d8'],win:['glass'],porch:['canopy'],ext:[['stripe',1],['sign',.6],['vent',.5]]},
    mil:{shape:['flat'],tex:['concrete'],roof:['#56683f','#4e5e3a'],mat:['concrete'],wall:['#6a7258','#5e6850'],win:['slit'],porch:['sandbag'],ext:[['camo',1],['antenna',1],['dish',.5],['vent',.5]]}
  }
};
function bldLook(b){
  const m=selectedMap,A=ARCH[m]||ARCH.forest,T=A[b.type]||A.house;
  const H=k=>bHash(b,k),P_=(a,k)=>a[Math.floor(H(k)*a.length)];
  const shape=P_(T.shape,1);
  const L={shape:shape,mat:P_(T.mat,3),wall:P_(T.wall,4),win:P_(T.win,5),porch:P_(T.porch,6),ext:[]};
  L.tex=(T.texBy&&T.texBy[shape])?P_(T.texBy[shape],2):P_(T.tex,2);
  L.roof=(T.roofBy&&T.roofBy[shape])?P_(T.roofBy[shape],7):P_(T.roof,7);
  if(m==='desert'&&(shape==='flat'||shape==='dome'||shape==='flatStep'))L.roof=shadeCol(L.wall,-.2);   // telhado de barro da mesma cor da parede
  L.trim=shadeCol(L.wall,.3);
  L.acc=P_(['#3f6a4a','#3a5a8a','#8a3a30','#2a6a6a','#6a4a2a','#7a4a7a'],8);      // venezianas e toldos
  L.door=P_(T.door||['#5a3a24','#3a4a5a','#6a2a24','#2a5a4a','#4a3a2a'],9);
  L.snow=m==='snow';L.heavy=shape==='aframe';
  let i=0;for(const e of T.ext){if(H(20+i)<e[1])L.ext.push(e[0]);i++;}
  return L;
}

/* ---- telhados ---- */
function rfEdges(q,w,h,c){q(0,0,w,1,shadeCol(c,.3));q(0,0,1,h,shadeCol(c,-.2));q(w-1,0,1,h,shadeCol(c,-.35));q(0,h-2,w,2,shadeCol(c,-.4));}
function rfTex(q,x,y,w,h,L,dir,sd){
  if(w<=2||h<=2)return;
  const tx=L.tex,hz=dir==='h',dk='rgba(0,0,0,.17)',lt='rgba(255,255,255,.08)';
  if(tx==='metal'){for(let i=2;i<(hz?w:h);i+=4){if(hz){q(x+i,y,1,h,dk);q(x+i+1,y,1,h,lt);}else{q(x,y+i,w,1,dk);q(x,y+i+1,w,1,lt);}}return;}
  if(tx==='thatch'){const r=mkRng(sd);for(let i=0,n=Math.round(w*h/6);i<n;i++){const px=x+r()*w,py=y+r()*h,len=2+Math.floor(r()*4),col=r()<.5?'rgba(0,0,0,.2)':'rgba(255,240,170,.18)';hz?q(px,py,1,len,col):q(px,py,len,1,col);}return;}
  if(tx==='gravel'||tx==='concrete'||tx==='plain')return;
  const st=tx==='slate'||tx==='tile'?5:4,along=hz?h:w,cross=hz?w:h;
  for(let j=st-1,row=0;j<along;j+=st,row++){
    if(hz)q(x,y+j,w,1,dk);else q(x+j,y,1,h,dk);
    if(tx==='tile'){if(hz)q(x,y+j+1,w,1,lt);else q(x+j+1,y,1,h,lt);}
    const off=(row%2)*3;
    for(let i=off+2;i<cross;i+=6){if(hz)q(x+i,y+j-st+1,1,st-1,'rgba(0,0,0,.09)');else q(x+j-st+1,y+i,st-1,1,'rgba(0,0,0,.09)');}
  }
}
function rfOverlay(q,w,h,L,H){
  const r=mkRng(H(17));
  if(L.tex==='moss'){for(let i=0;i<11;i++){const pw=4+Math.floor(r()*8);q(r()*(w-pw),r()*(h-3),pw,2+Math.floor(r()*2),r()<.5?'rgba(96,140,60,.6)':'rgba(70,110,50,.55)');}}
  else if(L.tex==='slate'){for(let i=0,n=Math.round(w*h/60);i<n;i++)q(r()*w,r()*h,5,3,r()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.08)');}
}
const RF={
  gableH(q,w,h,L,H){
    const c=L.roof,rg=Math.round(h*(L.heavy?.5:(.4+H(1)*.16)));
    q(0,0,w,rg,shadeCol(c,.1));q(0,rg,w,h-rg,shadeCol(c,-.12));
    rfTex(q,0,1,w,rg-2,L,'h',H(2));rfTex(q,0,rg+2,w,h-rg-4,L,'h',H(3));
    q(0,rg-1,w,2,shadeCol(c,.3));q(0,rg+1,w,1,shadeCol(c,-.32));
    rfEdges(q,w,h,c);L._rg=rg;
  },
  gableV(q,w,h,L,H){
    const c=L.roof,rg=Math.round(w*(.42+H(1)*.16));
    q(0,0,rg,h,shadeCol(c,.1));q(rg,0,w-rg,h,shadeCol(c,-.14));
    rfTex(q,1,0,rg-2,h,L,'v',H(2));rfTex(q,rg+2,0,w-rg-4,h,L,'v',H(3));
    q(rg-1,0,2,h,shadeCol(c,.3));q(rg+1,0,1,h,shadeCol(c,-.32));
    rfEdges(q,w,h,c);L._rg=rg;
  },
  hip(q,w,h,L,H){
    const c=L.roof,m=Math.floor(Math.min(w,h)/2);
    for(let k=0;k<m;k++){
      q(k,k,w-2*k,1,shadeCol(c,.14));q(k,h-1-k,w-2*k,1,shadeCol(c,-.2));
      q(k,k,1,h-2*k,shadeCol(c,-.02));q(w-1-k,k,1,h-2*k,shadeCol(c,-.12));
      if(k%4===3){const dk='rgba(0,0,0,.16)';q(k,k,w-2*k,1,dk);q(k,h-1-k,w-2*k,1,dk);q(k,k,1,h-2*k,dk);q(w-1-k,k,1,h-2*k,dk);}
      q(k,k,1,1,shadeCol(c,.3));q(w-1-k,k,1,1,shadeCol(c,.2));q(k,h-1-k,1,1,shadeCol(c,-.3));q(w-1-k,h-1-k,1,1,shadeCol(c,-.35));
    }
    const gw=w-2*m,gh=h-2*m;
    if(gw>0&&gh>0)q(m,m,gw,gh,shadeCol(c,.22));   // cumeeira: com altura/largura ímpar sobrava uma linha transparente no meio do telhado
  },
  cross(q,w,h,L,H){
    RF.gableH(q,w,h,L,H);
    const c=L.roof,ww=Math.round(w*(.32+H(4)*.12)),wx=Math.round(H(5)<.5?w*.12:w-ww-w*.12),wh=Math.round(h*.62),rg=Math.round(ww/2),mainRg=L._rg;
    q(wx-1,0,ww+2,wh+1,'rgba(0,0,0,.3)');
    q(wx,0,rg,wh,shadeCol(c,.14));q(wx+rg,0,ww-rg,wh,shadeCol(c,-.1));
    rfTex(q,wx+1,0,rg-1,wh,L,'v',H(6));rfTex(q,wx+rg+1,0,ww-rg-2,wh,L,'v',H(7));
    q(wx+rg-1,0,2,wh,shadeCol(c,.32));q(wx+rg+1,0,1,wh,shadeCol(c,-.3));
    q(wx,wh-2,ww,2,shadeCol(c,-.4));q(wx,0,ww,1,shadeCol(c,.3));
    L._rg=mainRg;L._blk=[wx,0,ww,wh];
  },
  flat(q,w,h,L,H,cut){
    const c=L.roof,r=mkRng(H(8));
    q(0,0,w,h,c);
    for(let i=0,n=Math.round(w*h/34);i<n;i++)q(r()*w,r()*h,1,1,r()<.5?'rgba(255,255,255,.1)':'rgba(0,0,0,.14)');
    q(0,0,w,2,shadeCol(c,.22));q(0,0,2,h,shadeCol(c,.12));q(w-2,0,2,h,shadeCol(c,-.12));q(0,h-3,w,3,shadeCol(c,-.32));
    q(2,2,w-4,1,'rgba(0,0,0,.22)');q(2,2,1,h-5,'rgba(0,0,0,.16)');
    if(selectedMap==='desert'){cut(0,0,2,2);cut(w-2,0,2,2);cut(0,h-2,2,2);cut(w-2,h-2,2,2);}
  },
  flatStep(q,w,h,L,H,cut){
    RF.flat(q,w,h,L,H,cut);
    const c=L.roof,bw=Math.round(w*(.35+H(9)*.15)),bh=Math.round(h*(.4+H(10)*.15)),bx=H(11)<.5?5:w-bw-5,by=5;
    q(bx+2,by+3,bw,bh,'rgba(0,0,0,.28)');
    q(bx,by,bw,bh,shadeCol(c,.1));q(bx,by,bw,2,shadeCol(c,.3));q(bx,by,2,bh,shadeCol(c,.18));q(bx+bw-2,by,2,bh,shadeCol(c,-.1));q(bx,by+bh-3,bw,3,shadeCol(c,-.3));
    L._blk=[bx,by,bw,bh];
  },
  dome(q,w,h,L,H,cut){
    RF.flat(q,w,h,L,H,cut);
    const rd=Math.round(Math.min(w,h)*.26),cx=Math.round(w*(.35+H(12)*.3)),cy=Math.round(h*.46),col=H(13)<.5?'#e8dcc0':shadeCol(L.roof,.25);
    for(let y=-rd;y<=rd;y++){const hf=Math.floor(Math.sqrt(rd*rd-y*y));q(cx-hf+2,cy+y+3,hf*2,1,'rgba(0,0,0,.25)');}
    for(let y=-rd;y<=rd;y++){const hf=Math.floor(Math.sqrt(rd*rd-y*y));q(cx-hf,cy+y,hf*2,1,shadeCol(col,-.12));q(cx-hf,cy+y,Math.max(1,Math.floor(hf*.9)),1,col);}
    q(cx-Math.round(rd*.5),cy-Math.round(rd*.55),3,2,'rgba(255,255,255,.6)');q(cx-1,cy-rd-3,2,4,shadeCol(col,-.3));
    L._blk=[cx-rd,cy-rd,rd*2,rd*2];
  },
  shed(q,w,h,L,H){
    const c=L.roof,n=4,bh=h/n;
    for(let i=0;i<n;i++)q(0,i*bh,w,bh+1,shadeCol(c,.16-i*.1));
    rfTex(q,1,1,w-2,h-4,L,'h',H(14));
    rfEdges(q,w,h,c);q(0,0,w,2,shadeCol(c,.35));
  },
  sawtooth(q,w,h,L,H){
    const c=L.roof,n=Math.max(2,Math.round(h/15)),pt=h/n;
    for(let i=0;i<n;i++){
      const y=Math.round(i*pt),a=Math.round(pt*.62),g=Math.round(pt*.2);
      q(0,y,w,pt+1,shadeCol(c,.04));q(0,y,w,a,shadeCol(c,-.06));
      q(0,y+a,w,g,'#8ab4c8');q(0,y+a+g,w,Math.max(1,Math.round(pt*.18)),shadeCol(c,-.3));
      rfTex(q,0,y+1,w,a-1,L,'h',H(15+i));
    }
    rfEdges(q,w,h,c);
  },
  gambrel(q,w,h,L,H){
    const c=L.roof,a=Math.round(h*.2),m=Math.round(h*.5);
    q(0,0,w,a,shadeCol(c,-.05));q(0,a,w,m-a,shadeCol(c,.12));q(0,m,w,h-m-a,shadeCol(c,-.1));q(0,h-a,w,a,shadeCol(c,-.28));
    rfTex(q,0,1,w,h-3,L,'h',H(16));
    q(0,a-1,w,1,shadeCol(c,.3));q(0,h-a,w,1,shadeCol(c,.1));q(0,m-1,w,2,shadeCol(c,.34));
    rfEdges(q,w,h,c);L._rg=m;
  }
};
RF.aframe=RF.gableH;
function rfSnow(q,w,h,L,H,lite){
  const r=mkRng(H(18)),sn='#f2f8fc',sh='#c8dcec',hv=(L.heavy&&!lite)?1:0,rg=L._rg;
  if(L.shape==='flat'||L.shape==='flatStep'||L.shape==='dome'){
    if(lite){q(3,3,w-6,3,sn);for(let i=0;i<5;i++)q(3+r()*(w-12),3+r()*(h-10),4+r()*6,2,sn);return;}
    for(let y=3;y<h-5;y+=3){const x0=3+Math.floor(r()*5),x1=w-3-Math.floor(r()*5);q(x0,y,x1-x0,3,sn);q(x0,y+3,x1-x0,1,sh);}for(let i=0;i<9;i++)q(4+r()*(w-16),4+r()*(h-14),4+r()*6,2+Math.floor(r()*2),shadeCol(L.roof,-.05));q(3,h-6,w-6,2,sh);return;
  }
  for(let x=0;x<w;x+=3){const d=lite?2+Math.floor(r()*2):hv?3+Math.floor(r()*6):3+Math.floor(r()*5);q(x,0,3,d,sn);q(x,d,3,1,sh);}
  if(L.shape==='gableV'){for(let y=0;y<h;y+=6)if(r()<.75)q(rg-1,y,2,6,sn);}
  else if(rg){
    if(hv){
      let dd=rg*.85;for(let x=0;x<w;x+=3){dd=Math.max(rg*.6,Math.min(rg-1,dd+(r()-.5)*4));const d=Math.round(dd);q(x,0,3,d,sn);q(x,d,3,1,sh);}
      let d2=(h-rg)*.25;for(let x=0;x<w;x+=4){d2=Math.max((h-rg)*.1,Math.min((h-rg)*.5,d2+(r()-.5)*4));const d=Math.round(d2);q(x,rg,4,d,sn);q(x,rg+d,4,1,sh);}
    }else for(let x=0;x<w;x+=6)if(r()<.75)q(x,rg-1,6,2,sn);
  }
  for(let i=0;i<(lite?3:hv?5:16);i++){const pw=lite?4+Math.floor(r()*7):6+Math.floor(r()*13);const px=2+r()*(w-pw-4),py=Math.round(h*.3+r()*h*.55),ph=2+Math.floor(r()*(lite?2:3));q(px,py,pw,ph,sn);q(px,py+ph,pw,1,sh);}
}
function rfDisc(q,cx,cy,rd,col){for(let y=-rd;y<=rd;y++){const hf=Math.floor(Math.sqrt(rd*rd-y*y+.5));q(cx-hf,cy+y,hf*2+1,1,col);}}
function rfExtras(q,w,h,L,H,snowNow){
  const used=L._blk?[L._blk.slice()]:[];let sd=0;
  const spot=(ew,eh,y0,y1)=>{
    for(let t=0;t<8;t++){
      const ex=Math.round(5+H(40+sd*8+t)*Math.max(1,w-ew-10)),ey=Math.round(y0+H(44+sd*8+t)*Math.max(1,y1-eh-y0));
      if(used.every(u=>ex>u[0]+u[2]+2||ex+ew+2<u[0]||ey>u[1]+u[3]+2||ey+eh+2<u[1])){used.push([ex,ey,ew,eh]);return [ex,ey];}
    }
    return null;
  };
  const sn=snowNow?'#f2f8fc':null;
  for(const e of L.ext){
    sd++;let p;
    switch(e){
      case 'chimney':case 'chimneyStone':{
        p=spot(7,9,H(60)<.5?-3:3,Math.round(h*.5));if(!p)break;
        const st=e==='chimneyStone',col=st?'#8a8a86':'#7a4a3a';L._chimP=[p[0],p[1]];
        q(p[0]+1,p[1]+8,7,2,'rgba(0,0,0,.28)');q(p[0],p[1],7,9,col);q(p[0],p[1],7,2,shadeCol(col,.25));q(p[0]+1,p[1]+2,5,2,'#241810');q(p[0],p[1]+8,7,1,shadeCol(col,-.3));
        if(st){q(p[0]+2,p[1]+5,2,1,shadeCol(col,-.2));q(p[0]+4,p[1]+6,2,1,shadeCol(col,.15));}else{q(p[0]+3,p[1]+4,1,4,'rgba(0,0,0,.18)');}
        if(sn){q(p[0],p[1]-1,7,2,sn);}
        break;}
      case 'dormer':{
        if(L.shape==='flat'||L.shape==='shed'||L.shape==='dome'||L.shape==='flatStep'||L.shape==='gableV')break;
        p=spot(13,10,Math.round(h*.5),h-6);if(!p)break;
        const c=shadeCol(L.roof,.06);
        q(p[0]+1,p[1]+2,13,10,'rgba(0,0,0,.25)');q(p[0],p[1],13,10,c);q(p[0],p[1],6,10,shadeCol(c,.12));q(p[0]+6,p[1],7,10,shadeCol(c,-.12));q(p[0]+5,p[1],2,10,shadeCol(c,.3));
        q(p[0]+3,p[1]+6,7,3,'#6a90b0');q(p[0]+3,p[1]+6,7,1,'rgba(255,255,255,.4)');q(p[0]+2,p[1]+9,9,1,'#e8e0d0');
        if(sn)q(p[0],p[1],13,2,sn);
        break;}
      case 'skylight':{p=spot(9,6,4,h-8);if(!p)break;q(p[0]-1,p[1]-1,11,8,shadeCol(L.roof,-.35));q(p[0],p[1],9,6,'#8ab4c8');q(p[0],p[1],9,1,'rgba(255,255,255,.5)');q(p[0]+4,p[1],1,6,'rgba(0,0,0,.25)');break;}
      case 'vent':{p=spot(5,5,4,h-8);if(!p)break;q(p[0]+1,p[1]+4,5,2,'rgba(0,0,0,.25)');rfDisc(q,p[0]+2,p[1]+2,2,'#8a9098');q(p[0]+1,p[1]+1,2,2,'#262a2e');break;}
      case 'ac':{p=spot(11,8,4,h-10);if(!p)break;q(p[0]+1,p[1]+7,11,2,'rgba(0,0,0,.28)');q(p[0],p[1],11,8,'#8a9098');q(p[0],p[1],11,1,'#b4bac0');rfDisc(q,p[0]+5,p[1]+4,2,'#3a3e44');q(p[0]+4,p[1]+3,2,2,'#6a7078');break;}
      case 'solar':{p=spot(18,10,4,h-12);if(!p)break;q(p[0]+1,p[1]+2,18,10,'rgba(0,0,0,.22)');q(p[0],p[1],18,10,'#2a3f6a');for(let i=3;i<18;i+=4)q(p[0]+i,p[1],1,10,'#5a7ab0');for(let j=3;j<10;j+=3)q(p[0],p[1]+j,18,1,'#5a7ab0');q(p[0],p[1],18,1,'#aab6c8');break;}
      case 'dish':{p=spot(8,8,4,h-10);if(!p)break;q(p[0]+2,p[1]+7,8,2,'rgba(0,0,0,.25)');rfDisc(q,p[0]+3,p[1]+3,3,'#d8dce0');q(p[0]+2,p[1]+2,2,2,'#8a9098');q(p[0]+3,p[1]+3,5,1,'#5a6068');break;}
      case 'antenna':{p=spot(5,12,4,h-14);if(!p)break;q(p[0]+3,p[1]+10,5,2,'rgba(0,0,0,.25)');q(p[0]+2,p[1],1,12,'#3a3e44');q(p[0],p[1]+2,5,1,'#3a3e44');q(p[0]+1,p[1]+5,3,1,'#3a3e44');q(p[0]+2,p[1]-1,1,1,'#e04040');break;}
      case 'tank':{p=spot(14,15,4,h-16);if(!p)break;q(p[0]+3,p[1]+4,13,13,'rgba(0,0,0,.22)');rfDisc(q,p[0]+6,p[1]+6,6,'#7a8288');rfDisc(q,p[0]+5,p[1]+5,4,'#9aa2a8');q(p[0]+2,p[1]+3,3,1,'rgba(255,255,255,.5)');q(p[0]+1,p[1]+6,11,1,'rgba(0,0,0,.2)');break;}
      case 'bulkhead':{p=spot(14,11,4,h-14);if(!p)break;q(p[0]+2,p[1]+3,14,11,'rgba(0,0,0,.25)');q(p[0],p[1],14,11,'#9a9a96');q(p[0],p[1],14,2,'#bcbcb8');q(p[0]+5,p[1]+6,4,5,'#2a2a2c');q(p[0],p[1]+10,14,1,'rgba(0,0,0,.3)');break;}
      case 'helipad':{if(w<80||h<64)break;p=spot(22,22,6,h-24);if(!p)break;q(p[0],p[1],22,22,'#3a3e44');q(p[0],p[1],22,1,'#e8e8e0');q(p[0],p[1]+21,22,1,'#e8e8e0');q(p[0],p[1],1,22,'#e8e8e0');q(p[0]+21,p[1],1,22,'#e8e8e0');q(p[0]+6,p[1]+5,2,12,'#e8e8e0');q(p[0]+14,p[1]+5,2,12,'#e8e8e0');q(p[0]+6,p[1]+10,10,2,'#e8e8e0');break;}
      case 'camo':{
        const r=mkRng(H(70)),cols=selectedMap==='desert'?['#a08850','#6a6a3a','#8a7040']:['#3e5030','#6a6a3a','#4a4030'];
        for(let i=0;i<26;i++){q(4+r()*(w-24),4+r()*(h-14),10+r()*14,5+r()*7,cols[Math.floor(r()*cols.length)]);}
        break;}
      case 'sign':{const sc=['#c04030','#2f6aa0','#2a7a4a','#d0a030'][Math.floor(H(71)*4)],sw=Math.round(w*.5),sx=Math.round((w-sw)/2),sy=h-13;
        q(sx+1,sy+2,sw,7,'rgba(0,0,0,.25)');q(sx,sy,sw,7,'#e8e0d0');q(sx+1,sy+1,sw-2,5,sc);
        for(let i=3;i<sw-4;i+=4)q(sx+i,sy+2,2,3,'#f0ece0');
        break;}
      case 'cross':{const cx=Math.round(w/2-8),cy=Math.round(h/2-8);q(cx,cy,16,16,'#f0f0ec');q(cx+6,cy+2,4,12,'#d03a3a');q(cx+2,cy+6,12,4,'#d03a3a');break;}
      case 'stripe':{q(0,h-9,w,3,'#e8e8e0');q(0,h-6,w,3,'#c03030');break;}
      case 'vigas':{for(let y=6;y<h-6;y+=7){q(-3,y,3,2,'#5a3a22');q(w,y,3,2,'#5a3a22');q(-3,y,3,1,'#7a5a3a');q(w,y,3,1,'#7a5a3a');}break;}
      case 'laundry':{p=spot(22,8,4,h-12);if(!p)break;q(p[0],p[1],1,8,'#5a3a22');q(p[0]+21,p[1],1,8,'#5a3a22');q(p[0],p[1]+1,22,1,'#d8d8d0');const cl=['#c04030','#e8e0d0','#3a6aa0','#d0a030'];for(let i=0;i<4;i++)q(p[0]+2+i*5,p[1]+2,4,4,cl[(i+Math.floor(H(72)*4))%4]);break;}
      case 'ladder':{p=spot(5,14,4,h-16);if(!p)break;q(p[0],p[1],1,14,'#6a4a2a');q(p[0]+4,p[1],1,14,'#6a4a2a');for(let j=2;j<14;j+=3)q(p[0],p[1]+j,5,1,'#8a6a42');break;}
      case 'cupola':{const cx=Math.round(w/2-6),cy=(L._rg||Math.round(h/2))-6;q(cx+2,cy+3,12,12,'rgba(0,0,0,.22)');q(cx,cy,12,12,shadeCol(L.roof,.15));q(cx,cy,12,2,shadeCol(L.roof,.4));q(cx+2,cy+4,8,5,'#2a1a14');for(let i=0;i<4;i++)q(cx+2,cy+4+i*1,8,1,i%2?'#4a3a2a':'#2a1a14');break;}
      default:break;
    }
  }
}
function bldRoofBuild(b,snowNow){
  const L=b._look||(b._look=bldLook(b)),H=k=>bHash(b,k+100);
  const M=12,w=b.w+6,h=b.h-7;
  const cv=document.createElement('canvas');cv.width=w+2*M;cv.height=h+M+4;
  const c=cv.getContext('2d');
  const q=(x,y,ww,hh,col)=>{c.fillStyle=col;c.fillRect(Math.round(x)+M,Math.round(y)+M,Math.round(ww),Math.round(hh));};
  const cut=(x,y,ww,hh)=>c.clearRect(Math.round(x)+M,Math.round(y)+M,ww,hh);
  L._rg=0;L._blk=null;
  (RF[L.shape]||RF.gableH)(q,w,h,L,H,cut);
  rfOverlay(q,w,h,L,H);
  if(snowNow)rfSnow(q,w,h,L,H,!L.snow);
  rfExtras(q,w,h,L,H,snowNow);
  b._rc=cv;b._rx=b.x-3-M;b._ry=b.y-6-M;b._rcS=snowNow;
}
function drawRoof(b){
  const sn=(weather==='snow'||selectedMap==='snow')?1:0;
  if(!b._rc||b._rcS!==sn)bldRoofBuild(b,sn);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  ctx.globalAlpha=b.roofA;ctx.drawImage(b._rc,b._rx,b._ry);ctx.globalAlpha=1;
  ctx.imageSmoothingEnabled=sm;
}

/* ---- chão em volta do prédio: varanda, degraus e enfeites (desenhado antes de itens e veículos) ---- */
function bldGroundBuild(b,snowNow){
  const L=b._look||(b._look=bldLook(b)),H=k=>bHash(b,k+200),r=mkRng(H(1));
  const cv=document.createElement('canvas');cv.width=b.w+24;cv.height=b.h+10;
  const c=cv.getContext('2d');
  const q=(x,y,ww,hh,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-b.x)+12,Math.round(y-b.y),Math.round(ww),Math.round(hh));};
  const dx=b.doorX,dw=b.door,by=b.y+b.h,bx=b.x,bw=b.w;
  switch(L.porch){
    case 'deck':
      q(dx-5,by,dw+10,7,'#8a6a44');for(let j=2;j<7;j+=2)q(dx-5,by+j,dw+10,1,'#6a4e30');
      q(dx-5,by,1,7,'#4a3422');q(dx+dw+4,by,1,7,'#4a3422');q(dx-5,by+5,2,2,'#3a2a1a');q(dx+dw+3,by+5,2,2,'#3a2a1a');q(dx-4,by+7,dw+8,1,'rgba(0,0,0,.25)');break;
    case 'steps':
      q(dx-3,by,dw+6,2,'#a2a2a0');q(dx-2,by+2,dw+4,2,'#8e8e8c');q(dx-1,by+4,dw+2,2,'#7a7a78');q(dx-1,by+6,dw+2,1,'rgba(0,0,0,.25)');break;
    case 'ramp':
      q(dx-8,by,dw+16,6,'#9aa0a4');for(let i=0;i<dw+16;i+=4)q(dx-8+i,by,1,6,'rgba(0,0,0,.15)');q(dx-8,by+5,dw+16,1,'#d0b030');q(dx-8,by+6,dw+16,1,'rgba(0,0,0,.25)');break;
    case 'dock':
      q(dx-12,by,dw+24,5,'#4a4a50');for(let i=0;i<dw+24;i+=6)q(dx-12+i,by,3,5,'#d0b030');q(dx-12,by+5,dw+24,1,'rgba(0,0,0,.3)');break;
    case 'canopy':
      q(bx+4,by,bw-8,8,'#55585c');q(bx+4,by+7,bw-8,1,'#d0b030');
      for(const f of [.22,.78]){const px=bx+bw*f-3;q(px,by+2,6,5,'#c03030');q(px,by+2,6,1,'#e8e0d0');q(px+1,by+3,4,1,'#222');}
      break;
    case 'sandbag':
      for(const sx of [dx-17,dx+dw+3]){for(let row=0;row<2;row++){for(let i=0;i<14;i+=5){q(sx+i+(row?2:0),by+row*3,5,3,row?'#9a8a5a':'#aa9a68');q(sx+i+(row?2:0),by+row*3+2,5,1,'rgba(0,0,0,.25)');}}}
      break;
    case 'pergola':
      q(dx-8,by,dw+16,9,'rgba(0,0,0,.16)');for(let i=0;i<9;i+=3)q(dx-8,by+i,dw+16,1,'#7a5a36');q(dx-8,by,2,9,'#5a3a22');q(dx+dw+6,by,2,9,'#5a3a22');break;
    default:
      q(dx+3,by,dw-6,2,'#6a5a48');
  }
  for(const e of L.ext){
    switch(e){
      case 'woodpile':{const y=by-24,px=H(80)<.5?bx-10:bx+bw+2;q(px,y,8,6,'#5a3a22');for(let i=0;i<4;i++){q(px+1+i*2,y+1,1,2,'#9a7a4a');q(px+1+i*2,y+3,1,2,'#8a6a3a');}q(px,y+6,8,1,'rgba(0,0,0,.25)');if(snowNow)q(px,y-1,8,2,'#f2f8fc');break;}
      case 'planter':q(dx-11,by+1,7,3,'#6a4a2a');for(let i=0;i<3;i++)q(dx-10+i*2,by,1,2,['#d04a6a','#e8c040','#e8e0f0'][(i+Math.floor(H(81)*3))%3]);q(dx-11,by+4,7,1,'rgba(0,0,0,.2)');break;
      case 'drift':
        for(let x=bx-4;x<bx+bw+4;x+=4){if(x>dx-4&&x<dx+dw+4)continue;const d=1+Math.floor(r()*4);q(x,by,4,d,'#f2f8fc');q(x,by+d,4,1,'#c8dcec');}
        for(let y=by-18;y<by;y+=5){const d=1+Math.floor(r()*3);q(bx-d,y,d,5,'#f2f8fc');q(bx+bw,y,d,5,'#f2f8fc');}
        break;
      case 'bin':{const px=bx+bw+2;q(px,by-14,7,10,'#34523a');q(px,by-14,7,2,'#4a6e50');q(px,by-4,7,1,'rgba(0,0,0,.3)');break;}
      case 'barrel':{const px=bx-9;q(px,by-14,6,8,'#7a4a2a');q(px,by-12,6,1,'#3a2a1a');q(px,by-9,6,1,'#3a2a1a');q(px,by-14,6,1,'#9a6a40');q(px,by-6,6,1,'rgba(0,0,0,.3)');break;}
      case 'crate':{const px=bx+bw+2;q(px,by-11,8,8,'#9a7a4a');q(px,by-11,8,1,'#bc9a64');q(px+3,by-11,1,8,'#6a4e30');q(px,by-8,8,1,'#6a4e30');q(px,by-3,8,1,'rgba(0,0,0,.3)');break;}
      case 'hay':{const px=bx+bw+7;for(const oy of [0,9]){rfDisc(q,px,by-9-oy,4,'#b89c50');rfDisc(q,px,by-9-oy,2,'#d4b866');q(px-4,by-5-oy,9,1,'rgba(0,0,0,.2)');}break;}
    }
  }
  b._gc=cv;b._gcS=snowNow;
}
function drawBldGround(b){
  const sn=(weather==='snow'||selectedMap==='snow')?1:0;
  if(!b._gc||b._gcS!==sn)bldGroundBuild(b,sn);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(b._gc,b.x-12,b.y);
  ctx.imageSmoothingEnabled=sm;
}

/* ---- fachada (parede sul, onde ficam porta e janelas) ---- */
function bldFacadeBuild(b,night){
  const L=b._look||(b._look=bldLook(b)),H=k=>bHash(b,k+300),r=mkRng(H(1));
  const w=b.w,fh=13,wc=L.wall;
  const cv=document.createElement('canvas');cv.width=w;cv.height=fh;
  const c=cv.getContext('2d');
  const q=(x,y,ww,hh,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(ww),Math.round(hh));};
  q(0,0,w,fh,wc);
  switch(L.mat){
    case 'plank':for(let x=3;x<w;x+=4){q(x,0,1,fh,'rgba(0,0,0,.2)');if(r()<.3)q(x-3,0,3,fh,'rgba(255,255,255,.07)');}break;
    case 'siding':for(let y=3;y<fh;y+=3){q(0,y,w,1,'rgba(0,0,0,.15)');q(0,y+1,w,1,'rgba(255,255,255,.07)');}break;
    case 'log':for(let y=2;y<fh;y+=3){q(0,y,w,1,'rgba(0,0,0,.3)');q(0,y+1,w,1,'rgba(255,255,255,.1)');q(0,y,2,2,shadeCol(wc,.25));q(w-2,y,2,2,shadeCol(wc,.15));}break;
    case 'brick':for(let y=2,row=0;y<fh;y+=3,row++){q(0,y,w,1,'rgba(235,225,205,.22)');for(let x=(row%2)*3;x<w;x+=6)q(x,y+1,1,2,'rgba(235,225,205,.18)');}break;
    case 'stucco':for(let i=0,n=Math.round(w*fh/9);i<n;i++)q(r()*w,r()*fh,1,1,r()<.5?'rgba(255,255,255,.14)':'rgba(0,0,0,.1)');break;
    case 'adobe':for(let i=0,n=Math.round(w*fh/8);i<n;i++)q(r()*w,r()*fh,1,1,r()<.5?'rgba(255,240,200,.16)':'rgba(80,40,10,.12)');q(0,2,w,1,shadeCol(wc,.2));for(let i=0;i<w/18;i++)q(r()*w,3+r()*4,1,2+r()*3,'rgba(80,40,10,.22)');break;
    case 'stone':for(let y=2;y<fh;y+=4){for(let x=-Math.floor(r()*4);x<w;){const sw=4+Math.floor(r()*5);q(x,y,sw,3,shadeCol(wc,r()*.3-.15));q(x+sw-1,y,1,3,'rgba(0,0,0,.28)');x+=sw;}q(0,y+3,w,1,'rgba(0,0,0,.25)');}break;
    case 'concrete':for(let x=15;x<w;x+=16)q(x,0,1,fh,'rgba(0,0,0,.2)');for(let i=0;i<w/14;i++)q(r()*w,r()*fh,3+r()*5,1+r()*2,'rgba(0,0,0,.07)');break;
    case 'metal':for(let x=2;x<w;x+=3){q(x,0,1,fh,'rgba(0,0,0,.2)');q(x+1,0,1,fh,'rgba(255,255,255,.08)');}break;
    case 'glass':q(0,0,w,fh,shadeCol(wc,-.35));break;
  }
  q(0,fh-3,w,3,shadeCol(wc,-.38));q(0,fh-3,w,1,'rgba(255,255,255,.12)');   // base
  q(0,0,1,fh,'rgba(0,0,0,.3)');q(w-1,0,1,fh,'rgba(0,0,0,.4)');
  const dl=b.doorX-b.x,dw=b.door,tp=b.type;
  // janelas
  const rows=(b.floors||1)>1?2:1,wy=3,wh=rows>1?3:5;
  const glass=()=>night?(r()<.45?'#ffd070':'#1c2838'):'#6a90b0';
  const zones=[[3,dl-3],[dl+dw+3,w-3]];
  for(const z of zones){
    const zw=z[1]-z[0];if(zw<8)continue;
    if(L.win==='glass'){
      for(let row=0;row<rows;row++){const y=wy+row*(rows>1?4:0),hh=rows>1?3:7;
        q(z[0],y,zw,hh,night?'#ffd890':'#8ab4c8');q(z[0],y,zw,1,'rgba(255,255,255,.4)');
        for(let x=z[0]+9;x<z[1];x+=10)q(x,y,1,hh,shadeCol(wc,-.4));
        if(night)for(let x=z[0];x<z[1];x+=10)if(r()<.5)q(x,y,10,hh,'#1c2838');}
      continue;
    }
    if(L.win==='highslit'){q(z[0]+2,3,zw-4,2,night?'#ffd070':'#9ab8c4');q(z[0]+2,3,zw-4,1,'rgba(255,255,255,.35)');continue;}
    if(L.win==='slit'){for(let x=z[0]+2;x<z[1]-4;x+=9){q(x,4,6,2,'#14181a');q(x,4,6,1,'#2a3236');}continue;}
    const ww=L.win==='awning'?10:8,n=Math.min(3,Math.max(1,Math.floor((zw+3)/(ww+5)))),gap=(zw-n*ww)/(n+1);
    for(let i=0;i<n;i++){
      const x=Math.round(z[0]+gap*(i+1)+i*ww);
      for(let row=0;row<rows;row++){
        const y=wy+row*4,gc=glass();
        if(L.win==='awning'){
          q(x-1,y+2,ww+2,wh,'#e8e0d0');q(x,y+3,ww,wh-1,gc);
          for(let s=0;s<ww+2;s+=3)q(x-1+s,2,3,3,(s/3|0)%2?'#e8e0d0':L.acc);
          q(x-1,5,ww+2,1,'rgba(0,0,0,.3)');
          break;
        }
        q(x-1,y-1,ww+2,wh+2,L.trim);q(x,y,ww,wh,gc);q(x,y,ww,1,'rgba(255,255,255,.3)');
        if(wh>3)q(x+Math.floor(ww/2),y,1,wh,'rgba(0,0,0,.25)');
        if(L.win==='shutter'){q(x-3,y-1,2,wh+2,L.acc);q(x+ww+1,y-1,2,wh+2,L.acc);}
        if(rows===1)q(x-1,y+wh+1,ww+2,1,'rgba(0,0,0,.25)');
      }
    }
  }
  // porta
  if(tp==='garage'||(tp==='warehouse')){
    q(dl-1,2,dw+2,fh-2,'#2a2c2e');q(dl,3,dw,fh-3,'#8a8f94');for(let y=4;y<fh;y+=2)q(dl,y,dw,1,'rgba(0,0,0,.28)');q(dl,3,dw,1,'#b0b4b8');
  }else if(tp==='barn'){
    q(dl-1,2,dw+2,fh-2,'#e8dcc0');q(dl,3,dw,fh-3,L.door);q(dl+Math.floor(dw/2),3,1,fh-3,'#e8dcc0');for(let i=0;i<fh-3;i++){q(dl+1+Math.floor(i*(dw/2-2)/(fh-4)),3+i,1,1,'#e8dcc0');q(dl+dw-2-Math.floor(i*(dw/2-2)/(fh-4)),3+i,1,1,'#e8dcc0');}
  }else if(L.win==='glass'||tp==='clinic'||tp==='gas'){
    q(dl-1,2,dw+2,fh-2,L.trim);q(dl,3,dw,fh-3,night?'#ffd890':'#7aa6bc');q(dl,3,dw,1,'rgba(255,255,255,.4)');q(dl+Math.floor(dw/2),3,1,fh-3,L.trim);
  }else if(tp==='mil'){
    q(dl-1,2,dw+2,fh-2,'#2a3028');q(dl,3,dw,fh-3,'#4a5248');for(let x=0;x<dw;x+=4)q(dl+x,3,2,2,'#d0b030');q(dl+dw-4,8,2,1,'#c9a54a');
  }else{
    q(dl-1,2,dw+2,fh-2,L.trim);q(dl,3,dw,fh-3,'#241810');q(dl,3,3,fh-3,L.door);q(dl+2,8,1,1,'#c9a54a');
  }
  if(tp==='shop'&&L.win!=='awning'&&L.win!=='glass')q(dl-1,1,dw+2,1,L.acc);
  if(selectedMap==='city'&&bHash(b,95)<.4){   // pichações na fachada
    const gr=mkRng(H(5)),cols=['#e84a7a','#4ad0e8','#e8d84a','#6ae84a','#f4f4f4'];
    for(let t=0;t<2+((gr()*2)|0);t++){
      let gx=3+gr()*(w-18),gy=4+gr()*7;const col=cols[(gr()*cols.length)|0],len=6+((gr()*8)|0);
      if(gx>dl-9&&gx<dl+dw+2)continue;
      for(let i=0;i<len;i++){q(gx+i,gy+(i%4<2?0:1),1,1,col);if(i%5===0)q(gx+i,gy-1-(i%3),1,2,col);}
    }
  }
  // neve: pingentes no beiral e neve acumulada na base
  if(L.snow){
    for(let x=1;x<w-1;x+=3)if(r()<.55)q(x,2,1,1+Math.floor(r()*3),'#dcecf6');
    for(let x=0;x<w;x+=3){if(x>dl-3&&x<dl+dw+3)continue;q(x,fh-2-(r()<.5?1:0),3,2,'#f2f8fc');}
  }
  q(0,0,w,1,'rgba(0,0,0,.5)');q(0,1,w,1,'rgba(0,0,0,.32)');q(0,2,w,1,'rgba(0,0,0,.14)');   // sombra do beiral
  q(0,fh-1,w,1,'rgba(0,0,0,.35)');
  b._fcd=cv;b._fcN=night;
}
function drawFacade(b){
  const nt=dark>.4?1:0;
  if(!b._fcd||b._fcN!==nt)bldFacadeBuild(b,nt);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(b._fcd,b.x,b.y+b.h-13);
  {const fd=b.doors&&b.doors[0];if(fd&&fd.open){ctx.fillStyle='#120c08';ctx.fillRect(b.doorX,b.y+b.h-10,b.door,10);if(fd.open===2){ctx.fillStyle='#6a4a2c';ctx.fillRect(b.doorX+1,b.y+b.h-4,4,2);ctx.fillRect(b.doorX+b.door-6,b.y+b.h-2,4,1);}else{ctx.fillStyle='#8a6a44';ctx.fillRect(b.doorX,b.y+b.h-10,2,10);}}}
  ctx.imageSmoothingEnabled=sm;
}
/* ============ ILUMINAÇÃO v2 ============
   Cor do dia por horário, sombras que seguem o sol, luzes coloridas, raios de sol, vaga-lumes, relâmpagos e vinheta.
   Tudo usa sprites pré-desenhados (sem gradientes novos por quadro). */
const SUN={dx:0,dy:.4,len:.5,a:.3,e:1,h:12,fs:'rgba(8,10,28,.3)'};
function updateSun(){
  const h=(START_HOUR+T/DAY_SECONDS*24)%24;SUN.h=h;
  if(P&&P.inside){SUN.e=.6;SUN.dx=0;SUN.dy=.3;SUN.len=.35;SUN.a=.28;SUN.fs='rgba(8,10,28,.28)';return;}
  const st=(h-5.5)/14;let e,dx,a0;
  if(st>0&&st<1){e=Math.sin(Math.PI*st);dx=-Math.cos(Math.PI*st);a0=.32;}
  else{const mt=Math.min(1,Math.max(0,((h-19.5+24)%24)/10));e=Math.sin(Math.PI*mt);dx=-Math.cos(Math.PI*mt);a0=.16;}
  const wf=weather==='rain'?.5:weather==='snow'?.65:weather==='sand'?.6:1; // céu fechado: sombra suave
  SUN.e=e;SUN.dx=dx;SUN.dy=.4;SUN.len=Math.min(2.5,.32+(1-e)*2.1);
  SUN.a=a0*Math.min(1,.4+e*1.4)*wf;
  SUN.fs='rgba(8,10,28,'+SUN.a.toFixed(3)+')';
}
function shadow(x,y,rx,ry){
  const k=SUN.len;
  ctx.fillStyle=SUN.fs;ctx.beginPath();
  ctx.ellipse(Math.round(x+SUN.dx*k*rx*.75),Math.round(y+SUN.dy*k*ry*.9),rx*(1+.35*k*Math.abs(SUN.dx)),ry*(1+.12*k),0,0,6.283);ctx.fill();
}
function hullPts(pts){
  pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[],up=[];
  for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
  for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
  lo.pop();up.pop();return lo.concat(up);
}
function bldShadow(b){
  const H=b.type==='apartment'?44:b.type==='office'?50:b.type==='warehouse'||b.type==='barn'?30:b.type==='shop'||b.type==='gas'?26:22;
  const tx=SUN.dx*H*SUN.len*.55,ty=SUN.dy*H*SUN.len*.45;
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const hp=hullPts([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x+tx,y+ty],[x+w+tx,y+ty],[x+w+tx,y+h+ty],[x+tx,y+h+ty]]);
  ctx.fillStyle=SUN.fs;ctx.beginPath();ctx.moveTo(hp[0][0],hp[0][1]);for(let i=1;i<hp.length;i++)ctx.lineTo(hp[i][0],hp[i][1]);ctx.closePath();ctx.fill();
}
/* cor do dia (multiplicação): amanhecer rosado, manhã dourada, dia limpo, entardecer laranja, crepúsculo roxo */
const GK=[[3.5,[255,255,255]],[4.5,[190,140,185]],[5.5,[240,160,135]],[6.3,[255,190,145]],[7.2,[255,225,185]],[8.8,[255,244,224]],[10.5,[255,255,255]],[15,[255,255,255]],[16.5,[255,238,205]],[17.7,[255,214,158]],[18.7,[255,184,124]],[19.5,[236,140,122]],[20.3,[190,120,150]],[21.2,[150,125,178]],[21.9,[255,255,255]]];
const MAPG={forest:[250,255,240],desert:[255,247,226],snow:[236,243,255],city:[245,247,252]};
const WEATHG={rain:[200,212,230],snow:[226,236,250],sand:[255,236,205]};
const NIGHTC={forest:'4,10,22',desert:'16,8,30',snow:'8,16,42',city:'6,8,22'};
function gradeRGB(h){
  let c=[255,255,255];
  if(h>=3.5&&h<21.9){
    for(let i=1;i<GK.length;i++){
      if(h<=GK[i][0]){const a=GK[i-1],b=GK[i],t=(h-a[0])/(b[0]-a[0]);c=[a[1][0]+(b[1][0]-a[1][0])*t,a[1][1]+(b[1][1]-a[1][1])*t,a[1][2]+(b[1][2]-a[1][2])*t];break;}
    }
  }
  const m=MAPG[selectedMap]||MAPG.forest,w=WEATHG[weather]||[255,255,255];
  return [c[0]*m[0]*w[0]/65025,c[1]*m[1]*w[1]/65025,c[2]*m[2]*w[2]/65025];
}
const MAPTINT={forest:[226,246,216],snow:[220,234,255],desert:[255,234,196],city:[232,234,242]};
const MAPWARM={forest:'255,160,70',snow:'255,170,160',desert:'255,115,45',city:'255,150,95'};
function drawGrade(){
  const c=gradeRGB(SUN.h);
  if(c[0]<251||c[1]<251||c[2]<251){
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle='rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }
  // cor própria de cada mapa (floresta esverdeada, neve azulada, deserto alaranjado, cidade acinzentada); some à noite e dentro de casa
  const mt=MAPTINT[selectedMap],ds=1-dark;
  if(mt&&ds>.05&&!(P&&P.inside)){
    const k=.85*ds;
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle='rgb('+Math.round(255-(255-mt[0])*k)+','+Math.round(255-(255-mt[1])*k)+','+Math.round(255-(255-mt[2])*k)+')';ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
    if(selectedMap==='city'&&perfTotal()<2){try{ctx.globalCompositeOperation='saturation';ctx.globalAlpha=.3*ds;ctx.fillStyle='#808080';ctx.fillRect(0,0,W,H);}catch(e){}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  }
  // brilho quente do sol baixo (nascer e pôr do sol), mais forte e na cor do mapa
  const h=SUN.h,wg=Math.max(0,1-Math.abs(h-18.3)/2.1)+Math.max(0,1-Math.abs(h-6.2)/1.6);
  const wa=.17*wg*(weather==='none'?1:.4);
  if(wa>.008){ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba('+(MAPWARM[selectedMap]||'255,150,70')+','+wa.toFixed(3)+')';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
}
/* sprites */
function mkSprite(sz,stops){const c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d'),gr=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);for(const s of stops)gr.addColorStop(s[0],s[1]);g.fillStyle=gr;g.fillRect(0,0,sz,sz);return c;}
const ffSprite=mkSprite(32,[[0,'rgba(220,255,140,.95)'],[.25,'rgba(170,255,110,.45)'],[1,'rgba(120,255,90,0)']]);
const warmSprite=mkSprite(128,[[0,'rgba(255,238,190,.75)'],[.35,'rgba(255,200,120,.32)'],[1,'rgba(255,160,70,0)']]);
const greenSprite=mkSprite(64,[[0,'rgba(150,255,110,.7)'],[1,'rgba(90,230,70,0)']]);
const coneC=(()=>{
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  try{g.filter='blur(5px)';}catch(e){}
  const gr=g.createLinearGradient(0,0,250,0);gr.addColorStop(0,'rgba(255,248,215,.55)');gr.addColorStop(.5,'rgba(255,240,190,.22)');gr.addColorStop(1,'rgba(255,235,170,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(4,64);g.lineTo(250,10);g.lineTo(250,118);g.closePath();g.fill();
  return c;
})();
const vigC=document.createElement('canvas');
function ensureVig(){
  if(vigC.width===W&&vigC.height===H)return;
  vigC.width=W;vigC.height=H;const g=vigC.getContext('2d');
  const gr=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.42,W/2,H/2,Math.hypot(W,H)*.52);
  gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.7)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
}
function drawVignette(indoor){
  if(!W||!H)return;ensureVig();
  const a=indoor?.85:Math.min(1,.38+dark*.42+(weather==='rain'?.1:0));
  ctx.globalAlpha=a;ctx.drawImage(vigC,0,0);ctx.globalAlpha=1;
}
/* raios de sol atravessando a copa (manhã e fim de tarde) */
const SHAFTG=(()=>{const g=document.createElement('canvas').getContext('2d');const gr=g.createLinearGradient(0,0,70,0);gr.addColorStop(0,'rgba(255,225,150,0)');gr.addColorStop(.5,'rgba(255,225,150,1)');gr.addColorStop(1,'rgba(255,225,150,0)');return gr;})();
function drawShafts(){
  if(selectedMap!=='forest'||weather!=='none'||dark>.35||perfTotal()>0)return;
  const lowSun=Math.max(0,1-SUN.e*1.15);
  const a=.2*lowSun;if(a<.012)return;
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=SHAFTG;
  for(let i=0;i<4;i++){
    const bw=34+(i%3)*18,span=W+bw*3;
    let x=((i*span/4+camX*Z*.22+T*(4+i))%span+span)%span-bw*1.5;
    ctx.save();ctx.translate(x,0);ctx.rotate(.5);ctx.scale(bw/70,1);
    ctx.globalAlpha=a*(.55+.45*Math.sin(T*.35+i*1.7));
    ctx.fillRect(0,-H*.4,70,H*2.2);ctx.restore();
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
/* partículas de luz: vaga-lumes (noite, floresta) e poeira dourada (dia, floresta e deserto) */
const FF=[];for(let i=0;i<26;i++)FF.push({x:0,y:0,vx:0,vy:0,ph:Math.random()*6.28,on:false});
const MOTE=[];for(let i=0;i<22;i++)MOTE.push({x:Math.random(),y:Math.random(),s:.3+Math.random()*.7,ph:Math.random()*6.28});
const LP=[];  // pulsos de luz (tiro, explosão)
function addPulse(x,y,r,d,col){LP.push({x:x,y:y,r:r,t:d,d:d,col:col||'w'});if(LP.length>12)LP.shift();}
const LT={f:0,next:14,q:[]};
function applyBolt(delay){ // mesmo raio e mesmo trovão para todos (dentro de casa não se vê o clarão)
  if(!P||P.inside)return;
  LT.f=1;LT.q.push({t:.12,v:.8},{t:.3,v:.55});
  setTimeout(()=>{try{boom(1.6,.28,110);beep(55,.7,'sine',.07,-20);}catch(e){}},delay*1000);
}
function updateLighting(dt){
  updateSun();
  for(let i=LP.length-1;i>=0;i--){LP[i].t-=dt;if(LP[i].t<=0)LP.splice(i,1);}
  // vaga-lumes
  if(selectedMap==='forest'&&dark>.3&&weather!=='rain'&&perfTotal()<2){
    for(const f of FF){
      if(!f.on||Math.hypot(f.x-P.x,f.y-P.y)>230){const a=Math.random()*6.283,d=40+Math.random()*170;f.x=P.x+Math.cos(a)*d;f.y=P.y+Math.sin(a)*d;f.vx=f.vy=0;f.on=true;}
      f.ph+=dt;f.vx+=(Math.random()-.5)*40*dt;f.vy+=(Math.random()-.5)*40*dt;
      f.vx=Math.max(-12,Math.min(12,f.vx));f.vy=Math.max(-12,Math.min(12,f.vy));f.x+=f.vx*dt;f.y+=f.vy*dt;
    }
  }else for(const f of FF)f.on=false;
  // relâmpagos (só com chuva e fora de prédios)
  if(weather==='rain'&&(!MP.active||MP.isHost)){ // só o anfitrião sorteia o raio; o convidado recebe pelo evento 'bolt'
    LT.next-=dt;
    if(LT.next<=0){
      LT.next=12+Math.random()*22;
      const delay=.5+Math.random()*1.6;
      applyBolt(delay);
      if(MP.active)sendEvt('bolt',{d:+delay.toFixed(2)});
    }
  }
  for(let i=LT.q.length-1;i>=0;i--){LT.q[i].t-=dt;if(LT.q[i].t<=0){LT.f=Math.max(LT.f,LT.q[i].v);LT.q.splice(i,1);}}
  LT.f=Math.max(0,LT.f-dt*3.2);
}
/* ============ AMBIENTAÇÃO DOS MAPAS ============
   Sons por mapa e hora, neblina, nevasca, gelo que racha, fumaça de chaminé, miragem, calor, redemoinhos,
   estrelas, letreiros e outdoors. Tudo é cosmético e NÃO consome o _rng: o mundo e os saves continuam iguais. */
const fracHash=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
const GL3={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','4':'101101111001001','-':'000000111000000'};
function glyphs(Rf,txt,x,y,col){ // texto em fonte 3x5 de pixel
  for(let i=0;i<txt.length;i++){const g=GL3[txt[i]];if(!g)continue;for(let k=0;k<15;k++)if(g[k]==='1')Rf(x+i*4+(k%3),y+((k/3)|0),1,1,col);}
}
/* ---- sons ambiente ---- */
const AMB={cri:2,owl:20,bird:3,wind:5,wave:2,gull:9,ice:10};
function ambVol(){if(!P)return 0;if(P.inside)return .3;if(P.inVehicle&&vehKind(P.inVehicle)==='car')return .4;return 1;}
function ambGust(d,f0,f1,v,type,q){
  if(!AC||!nbuf)return;const vol=volFor('amb')*ambVol();if(vol<=0||v<=0)return;
  try{
    const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
    s.buffer=nbuf;s.loop=true;f.type=type||'bandpass';f.Q.value=q||.9;
    f.frequency.setValueAtTime(f0,t);f.frequency.linearRampToValueAtTime(f1,t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*vol,t+d*.4);g.gain.linearRampToValueAtTime(.0001,t+d);
    s.connect(f);f.connect(g);g.connect(AOUT);s.start(t);s.stop(t+d+.05);
  }catch(e){}
}
function ambTone(f,d,type,v,slide){const k=ambVol();if(k<=0)return;beep(f,d,type,v*k,slide,'amb');}
const iceFx=[];
function ambLife(dt){
  if(!P||P.dead||!AC||state==='menu')return;
  for(const k in AMB)AMB[k]-=dt;
  const hod=SUN.h,night=dark>.55,m=selectedMap,rain=weather==='rain';
  // vento (copas na floresta, uivo na neve, areia no deserto)
  if(AMB.wind<=0){
    if(m==='forest'){AMB.wind=rnd(7,14);}                                  // sem som de folhas
    else if(m==='snow'){
      AMB.wind=blizzK>.35?rnd(1.6,3):rnd(6,12);   // sem som de vento na neve
    }
    else if(m==='desert'){AMB.wind=weather==='sand'?rnd(2,4):rnd(8,14);}
    else{AMB.wind=rnd(14,26);}
  }
  // grilos e coruja (noite)
  if(night&&!rain&&(m==='forest'||m==='desert'||m==='city')&&AMB.cri<=0){
    AMB.cri=rnd(1.2,3.2)*(m==='city'?2.2:1);
    const n=3+((Math.random()*2)|0),f0=4200+rnd(-200,200);
    for(let i=0;i<n;i++)setTimeout(()=>ambTone(f0,.03,'square',.006),i*55);
  }
  if(night&&!rain&&m==='forest'&&AMB.owl<=0){
    AMB.owl=rnd(22,55);ambTone(430,.4,'sine',.035,-90);setTimeout(()=>ambTone(380,.55,'sine',.032,-70),520);
  }
  // cantoria de manhã (floresta)
  if(m==='forest'&&hod>=4.8&&hod<9.6&&weather==='none'&&AMB.bird<=0){
    AMB.bird=rnd(1.6,3.8)*(hod<7.6?1:1.9);
    const base=rnd(2400,3600),n=3+((Math.random()*3)|0);
    for(let i=0;i<n;i++)setTimeout(()=>ambTone(base*rnd(.9,1.15),.06,'sine',.014,rnd(-500,700)),i*85);
  }
  // mar: ondas e gaivotas
  if(m==='city'&&ORLA){
    const dsh=orlaShore(P.x)-P.y;
    if(dsh>-320&&dsh<300){   // só se ouve o mar na praia e perto dela
      const lv=Math.pow(1-clamp(dsh,0,300)/300,1.6);
      if(AMB.wave<=0){AMB.wave=rnd(4.2,7);ambGust(3.4,650,1500,.09*lv+.004,'bandpass',.5);}
      if(!night&&dsh<260&&AMB.gull<=0){
        AMB.gull=rnd(8,18);
        ambTone(1650,.22,'sawtooth',.012,-650);setTimeout(()=>ambTone(1500,.28,'sawtooth',.011,-600),260);
        if(Math.random()<.6)setTimeout(()=>ambTone(1700,.2,'sawtooth',.01,-700),620);
      }
    }
  }
  // gelo que racha (perto do lago congelado)
  if(m==='snow'&&AMB.ice<=0){
    for(const l of lakes){
      if(l.fountain||!l.frozen)continue;
      const d=Math.hypot(P.x-l.cx,P.y-l.cy);if(d>l.r+130)continue;
      AMB.ice=rnd(9,22);
      const a=Math.random()*6.283,rr=l.r*rnd(.1,.7),cx=l.cx+Math.cos(a)*rr,cy=l.cy+Math.sin(a)*rr*.9;
      iceFx.push({x:cx,y:cy,a:Math.random()*6.283,t:.9,s:fracHash(cx+cy)});
      const k=clamp(1-d/(l.r+130),.25,1);
      ambGust(.12,2800,7000,.13*k,'highpass',1);ambTone(2200,.09,'square',.02*k,-1500);
      setTimeout(()=>{ambGust(.08,2000,5000,.07*k,'highpass',1);},170);
      break;
    }
  }
  for(let i=iceFx.length-1;i>=0;i--){iceFx[i].t-=dt;if(iceFx[i].t<=0)iceFx.splice(i,1);}
}
/* ---- nevasca ---- */
let blizzK=0,_blzOn=false;
function blizzTarget(){
  if(selectedMap!=='snow'||weather!=='snow')return 0;
  return fracHash((worldSeed%9973)*.37+Math.floor(T/110)*7.13)<.45?1:0;
}
function ambFx(dt){
  if(!P)return;
  blizzK+=(blizzTarget()-blizzK)*Math.min(1,dt*.35);
  if(!_blzOn&&blizzK>.6){_blzOn=true;toast('Nevasca! Visão curta e frio intenso');}
  else if(_blzOn&&blizzK<.2)_blzOn=false;
}
/* ---- neblina (floresta) ---- */
const fogSp=mkSprite(128,[[0,'rgba(240,246,244,.85)'],[.5,'rgba(240,246,244,.4)'],[1,'rgba(240,246,244,0)']]);
function fogAmount(){if(selectedMap!=='forest')return 0;return clamp(1-Math.abs(SUN.h-5.8)/2.7,0,1)*(weather==='none'?1:.5);}
function drawFog(vx0,vx1,vy0,vy1){
  if(selectedMap!=='forest'||perfTotal()>=2||(P&&P.inside))return;
  const fa=fogAmount(),CS=240,gx0=Math.floor(vx0/CS)-1,gx1=Math.ceil(vx1/CS),gy0=Math.floor(vy0/CS)-1,gy1=Math.ceil(vy1/CS);
  if(fa>.02){
    for(let gx=gx0;gx<=gx1;gx++)for(let gy=gy0;gy<=gy1;gy++){
      const h=fracHash(gx*91.7+gy*37.3);if(h<.35)continue;
      const sz=230+h*150,cx=gx*CS+fracHash(gx+gy*3.1)*CS+Math.sin(T*.07+h*9)*26,cy=gy*CS+fracHash(gy+gx*2.3)*CS;
      ctx.globalAlpha=Math.min(.7,fa*2.3*(.5+h*.5));ctx.drawImage(fogSp,cx-sz/2,cy-sz*.32,sz,sz*.64);
    }
  }
  const la=.3+fa*.5;
  for(const l of lakes){
    if(l.fountain||l.cx+l.r*1.6<vx0||l.cx-l.r*1.6>vx1||l.cy+l.r*1.6<vy0||l.cy-l.r*1.6>vy1)continue;
    for(let i=0;i<12;i++){
      const a=i/12*6.283+Math.sin(T*.05+i)*.15,rr=l.r*(.55+.45*fracHash(i+l.cx)),sz=110+fracHash(i*5+l.cy)*70;
      ctx.globalAlpha=la*(.8+.2*Math.sin(T*.4+i));ctx.drawImage(fogSp,l.cx+Math.cos(a)*rr-sz/2,l.cy+Math.sin(a)*rr*.9-sz*.3,sz,sz*.6);
    }
  }
  ctx.globalAlpha=1;
}
/* ---- miragem (deserto, meio-dia) ---- */
function heatK(){return selectedMap==='desert'&&weather==='none'&&!(P&&P.inside)?clamp(1-Math.abs(SUN.h-14)/3.6,0,1):0;}
function drawMirage(vx0,vx1,vy0,vy1){
  const hk=heatK();if(hk<.08||perfTotal()>=2)return;
  const CS=720,gx0=Math.floor(vx0/CS)-1,gx1=Math.ceil(vx1/CS),gy0=Math.floor(vy0/CS)-1,gy1=Math.ceil(vy1/CS);
  for(let gx=gx0;gx<=gx1;gx++)for(let gy=gy0;gy<=gy1;gy++){
    const h=fracHash(gx*53.1+gy*17.9);if(h<.55)continue;
    const cx=gx*CS+fracHash(gx*2+gy)*CS,cy=gy*CS+fracHash(gy*2+gx)*CS,d=Math.hypot(cx-P.x,cy-P.y);
    if(d<190||d>900||pointInLake(cx,cy)||bldAt(cx,cy))continue;
    const a=hk*Math.min(1,(d-190)/150)*Math.min(1,(900-d)/220)*(.5+.1*Math.sin(T*1.3+h*9)),rx=70+h*60;
    ctx.globalAlpha=a*.55;ctx.fillStyle='#cfe8f2';ctx.beginPath();ctx.ellipse(cx,cy,rx,rx*.16,0,0,6.283);ctx.fill();
    ctx.globalAlpha=a*.4;ctx.fillStyle='#8cc4dc';ctx.beginPath();ctx.ellipse(cx,cy+2,rx*.8,rx*.09,0,0,6.283);ctx.fill();
    ctx.globalAlpha=a*.7;ctx.fillStyle='#ffffff';
    for(let i=0;i<5;i++){const w=rx*(.9-i*.12),yy=cy-5+i*3+Math.sin(T*2.2+i*1.7+h*7)*1.2;ctx.fillRect(cx-w+Math.sin(T*1.5+i)*4,yy,w*2,1);}
    ctx.globalAlpha=1;
  }
}
function drawIceFx(){
  for(const f of iceFx){
    const g=1-f.t/.9,a=Math.min(1,f.t*2.2);
    ctx.globalAlpha=a;ctx.strokeStyle='#f4fbff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(f.x,f.y);
    let x=f.x,y=f.y,ang=f.a;for(let i=0;i<7;i++){if(i/7>g*1.4)break;ang+=(fracHash(f.s*50+i)-.5)*1.4;x+=Math.cos(ang)*9;y+=Math.sin(ang)*8;ctx.lineTo(x,y);}
    ctx.stroke();ctx.globalAlpha=1;
  }
}
/* ---- chaminés (neve) e letreiros / outdoors (cidade) ---- */
const SIGN_COL=[['#ff4fa0','255,79,160'],['#3ad8ff','58,216,255'],['#ffb43a','255,180,58'],['#5aff8a','90,255,138'],['#ff5a4a','255,90,74']];
const SIGN_SP=SIGN_COL.map(c=>mkSprite(64,[[0,'rgba('+c[1]+',.75)'],[.45,'rgba('+c[1]+',.28)'],[1,'rgba('+c[1]+',0)']]));
let _sgB=null,citySigns=[];
function buildSigns(){
  _sgB=blds;citySigns=[];
  if(selectedMap!=='city')return;
  const WORDS={shop:['BAR','LOJA','24H','CAFE','PIZZA','FARMA'],gas:['POSTO'],garage:['AUTO'],apartment:['HOTEL'],office:['BANCO'],clinic:['SAUDE']};
  for(const b of blds){
    const w=WORDS[b.type];if(!w||b.w<34)continue;
    if(b.type==='shop'||b.type==='office'||b.type==='apartment'){if(bHash(b,90)<.25)continue;}
    const txt=w[Math.floor(bHash(b,91)*w.length)],ci=Math.floor(bHash(b,92)*SIGN_COL.length),bw=txt.length*4+3;
    const bx=Math.round(Math.max(b.x+2,Math.min(b.x+b.w-bw-2,b.doorX+b.door/2-bw/2))),by=b.y+b.h-21;
    citySigns.push({b,txt,ci,bx,by,bw,cx:bx+bw/2,cy:by+4,ph:bHash(b,93)*9});
  }
}
function citySignsList(){if(_sgB!==blds)buildSigns();return citySigns;}
function bldTopFx(b){
  if(b.roofA<.3)return;
  if(selectedMap==='snow'&&b._look&&b._look._chimP&&b._rc){   // fumaça sai da chaminé que o telhado já tem
    const cx=Math.round(b._rx+b._look._chimP[0]+3),cy=b._ry+b._look._chimP[1]+1,ph0=bHash(b,78);
    for(let k=0;k<5;k++){
      const ph=(T*.32+k*.2+ph0)%1,s2=2+Math.round(ph*5);
      ctx.globalAlpha=.55*(1-ph)*b.roofA;ctx.fillStyle='#d4dbe0';
      ctx.fillRect(Math.round(cx+Math.sin(ph*5+k*2)*2+ph*8+blizzK*ph*10-s2/2),Math.round(cy-3-ph*34-s2/2),s2,s2);
    }
    ctx.globalAlpha=1;
  }
  if(selectedMap==='city'){
    for(const s of citySignsList()){
      if(s.b!==b)continue;
      const on=dark>.35,flick=on&&Math.sin(T*23+s.ph)>.93?.4:1,col=SIGN_COL[s.ci][0];
      R(s.bx-1,s.by-1,s.bw+2,9,'#1a1a22');R(s.bx,s.by,s.bw,7,on?'#12121a':'#3a3a46');
      ctx.globalAlpha=b.roofA*(on?flick:.55);glyphs(R,s.txt,s.bx+1,s.by+1,on?col:'#9a9aa8');ctx.globalAlpha=1;
    }
  }
}
/* ---- fumaça, whiteout e calor na tela ---- */
const whiteC=document.createElement('canvas');
function ensureWhite(){
  if(whiteC.width===W&&whiteC.height===H)return;
  whiteC.width=W;whiteC.height=H;const g=whiteC.getContext('2d');
  const gr=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.16,W/2,H/2,Math.hypot(W,H)*.5);
  gr.addColorStop(0,'rgba(232,240,250,0)');gr.addColorStop(1,'rgba(232,240,250,.92)');
  g.fillStyle=gr;g.fillRect(0,0,W,H);
}
function drawScreenFx(){
  if(blizzK>.02){
    ensureWhite();const k=blizzK*(1-dark*.6);
    ctx.globalAlpha=Math.min(1,k*1.05);ctx.drawImage(whiteC,0,0);
    ctx.globalAlpha=.2*k;ctx.fillStyle='#e4edf6';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
  const hk=heatK();
  if(hk>.15&&perfTotal()<2){ // tremor do ar: faixas claras ondulando e subindo do chão quente
    ctx.fillStyle='rgba(255,244,214,'+(.045*hk).toFixed(3)+')';
    for(let i=0;i<9;i++){
      const y0=((i*H/9)+T*16)%H;
      for(let x=0;x<W;x+=28)ctx.fillRect(x,Math.round(y0+Math.sin(T*2.4+x*.035+i*1.9)*3),28,2);
    }
  }
}

function drawIceCracks(l){
  ctx.strokeStyle='rgba(240,250,255,.55)';ctx.lineWidth=1;
  for(let i=0;i<8;i++){
    let a=fracHash(l.cx*.13+i*7.7)*6.283,r0=l.r*(.08+fracHash(l.cy*.17+i)*.25),x=l.cx+Math.cos(a)*r0,y=l.cy+Math.sin(a)*r0*.9;
    ctx.beginPath();ctx.moveTo(x,y);
    for(let j=0;j<5;j++){a+=(fracHash(i*11+j*3.1+l.cx)-.5)*1.1;x+=Math.cos(a)*l.r*.1;y+=Math.sin(a)*l.r*.09;ctx.lineTo(x,y);}
    ctx.stroke();
  }
}
/* carcaças de carro no deserto e outdoors na cidade: colocados depois da geração, com gerador próprio (não mexem no sorteio do mundo) */
function genAmbientProps(seed){
  const r=mkRng(fracHash(seed*.000013+3.1));
  const add=(type,x,y,solid,extra)=>decorations.push(Object.assign({x:Math.round(x),y:Math.round(y),type:type,solid:!!solid,seed:r()},extra||{}));
  if(selectedMap==='desert'){
    const n=Math.round(10*WAREA);
    for(let i=0,g=0;i<n&&g<500;g++){
      const x=90+r()*(WW-180),y=90+r()*(WH-180);
      if(solidPoint(x,y,30)||bldAt(x,y)||pointInLake(x,y))continue;
      add('wreck',x,y,true);add('pt',x-9,y,true);add('pt',x+9,y,true);i++;
    }
  }
  if(selectedMap==='city'&&roads.length){
    const n=Math.round(9*WAREA);
    for(let i=0,g=0;i<n&&g<700;g++){
      const rd=roads[Math.floor(r()*roads.length)];let x,y;
      if(!rd.vert){x=rd.x+160+r()*Math.max(1,rd.w-320);y=r()<.5?rd.y-26:rd.y+rd.h+26;}
      else{x=r()<.5?rd.x-26:rd.x+rd.w+26;y=rd.y+160+r()*Math.max(1,rd.h-320);}
      if(x<80||y<80||x>WW-80||y>WH-80||!cityFree(x,y,24,14)||(ORLA&&y>ORLA.yb-50)||solidPoint(x,y,26))continue;
      add('billboard',x,y,true,{ad:Math.floor(r()*4)});add('pt',x-12,y,true);add('pt',x+12,y,true);i++;
    }
  }
}
function drawAmbProp(d){
  const x=d.x,y=d.y;
  if(d.type==='wreck'){
    shadow(x,y+4,16,5);
    const big=d.seed>.5;
    R(x-14,y-5,28,11,'#6a3a24');R(x-14,y-5,28,2,'#8a5236');R(x-14,y+4,28,2,'#4a2616');
    R(x-6,y-9,13,5,'#5a3020');R(x-5,y-8,11,3,'#1a1410');
    R(x+8,y-4,6,8,'#3a2a22');R(x+9,y-3,4,6,'#1a1410');
    R(x-12,y+5,5,3,'#2a2a2a');R(x+6,y+5,5,3,'#2a2a2a');
    if(big){R(x-14,y-5,6,11,'#7a4a30');R(x-16,y+1,3,2,'#9a9a9a');R(x-13,y-3,4,3,'#2a1a10');}
    R(x-2,y-2,5,2,'#8a4a2a');R(x+3,y-5,2,1,'#c07040');
    R(x-14,y+6,10,2,'#d8c08a');R(x+4,y+6,12,2,'#e0c890');
  }else if(d.type==='billboard'){
    shadow(x,y+2,17,3);
    const AD=[['HOTEL','#1c2a5a','#ffd24a'],['PIZZA','#7a1c1c','#ffe8b0'],['BANCO','#1c4a2c','#e8f0c0'],['CAFE','#4a2a1c','#ffd8a0']][d.ad|0];
    R(x-12,y-14,3,16,'#4a4038');R(x+9,y-14,3,16,'#4a4038');
    R(x-17,y-31,34,19,'#2a2a32');R(x-16,y-30,32,17,AD[1]);
    glyphs(R,AD[0],Math.round(x-(AD[0].length*4-1)/2),y-27,AD[2]);
    R(x-12,y-19,24,1,AD[2]);R(x-9,y-17,18,1,'rgba(255,255,255,.35)');R(x-6,y-15,12,1,'rgba(255,255,255,.2)');
    R(x-15,y-33,3,2,'#ffe8a0');R(x+12,y-33,3,2,'#ffe8a0');
  }
}

function drawLighting(sx,sy){
  const tier=perfTotal();
  ctx.setTransform(1,0,0,1,0,0);
  drawScreenFx();
  drawGrade();
  const sp=(x,y)=>[(x-camX)*Z+sx,(y-camY)*Z+sy];
  const headlit=[];
  if(dark>.02){
    const LS=lightC.width>0?W/lightC.width:1;
    lctx.setTransform(1,0,0,1,0,0);lctx.imageSmoothingEnabled=true;
    lctx.globalCompositeOperation='source-over';
    lctx.clearRect(0,0,lightC.width,lightC.height);
    lctx.fillStyle='rgba('+(NIGHTC[selectedMap]||NIGHTC.forest)+','+(.86*dark).toFixed(3)+')';
    lctx.fillRect(0,0,lightC.width,lightC.height);
    lctx.globalCompositeOperation='destination-out';
    const punch=(cx,cy,r,al)=>{if(al!==undefined)lctx.globalAlpha=al;lctx.drawImage(lightSprite,(cx-r)/LS,(cy-r)/LS,2*r/LS,2*r/LS);if(al!==undefined)lctx.globalAlpha=1;};
    for(const c of campfires){
      const [fx,fy]=sp(c.x,c.y),fr=(84+Math.sin((c.flicker||0))*4+Math.sin((c.flicker||0)*2.3+1)*3)*Z;
      if(fx<-fr||fy<-fr||fx>W+fr||fy>H+fr)continue;
      punch(fx,fy,fr);
    }
    for(const l of lampList){
      const [lx,ly]=sp(l.x,l.y-8),lr=74*Z;
      if(lx<-lr||ly<-lr||lx>W+lr||ly>H+lr)continue;
      punch(lx,ly,lr);
    }
    if(selectedMap==='city')for(const sg of citySignsList()){   // letreiros: iluminam a calçada em frente
      if(sg.b.roofA<.3)continue;
      const [qx,qy]=sp(sg.cx,sg.cy+8),qr=40*Z;
      if(qx<-qr||qy<-qr||qx>W+qr||qy>H+qr)continue;
      punch(qx,qy,qr,.85);
    }
    if(dark>.15){
      for(const v of vehicles){
        if(v.destroyed)continue;
        const burning=!!v.dying;
        if(!burning&&!((P&&P.inVehicle===v)||(v.driverId&&remotePlayers[v.driverId])))continue;
        const [hx0,hy0]=sp(v.x,v.y);
        if(hx0<-230*Z||hy0<-230*Z||hx0>W+230*Z||hy0>H+230*Z)continue;
        if(burning){punch(hx0,hy0,64*Z);continue;}
        headlit.push(v);
        const cf=Math.cos(v.face||0),sf=Math.sin(v.face||0);
        for(let k=0;k<5;k++){const dd=22+k*24;punch(hx0+cf*dd*Z,hy0+sf*dd*Z,(30+k*8)*Z);}
      }
    }
    for(const q of LP){const [qx,qy]=sp(q.x,q.y);punch(qx,qy,q.r*Z,Math.min(1,q.t/q.d*1.4));}
    lctx.globalCompositeOperation='source-over';
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(lightC,0,0,lightC.width,lightC.height,0,0,W,H);
    // luar: um sopro de azul frio por cima da escuridão
    ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(60,90,160,'+(.07*dark).toFixed(3)+')';ctx.fillRect(0,0,W,H);
    // brilho colorido das luzes (aditivo); em chão claro (neve) o brilho é menor para não estourar
    const GL=selectedMap==='snow'?.4:selectedMap==='desert'?.75:1;
    ctx.globalCompositeOperation='lighter';
    for(const c of campfires){
      const [fx,fy]=sp(c.x,c.y),fl=1+Math.sin((c.flicker||0)*1.7)*.07+Math.sin((c.flicker||0)*4.1)*.05,fr=78*Z*fl;
      if(fx<-fr||fy<-fr||fx>W+fr||fy>H+fr)continue;
      ctx.globalAlpha=Math.min(1,dark*1.15)*.5*GL;
      ctx.drawImage(fireSprite,fx-fr,fy-fr-4*Z,2*fr,2*fr);
      ctx.globalAlpha=Math.min(1,dark*1.15)*.3*GL;
      const cr=24*Z*fl;ctx.drawImage(warmSprite,fx-cr,fy-cr-6*Z,2*cr,2*cr);
    }
    ctx.globalAlpha=Math.min(1,dark*1.1)*GL;
    for(const l of lampList){
      const [lx,ly]=sp(l.x,l.y-8),lr=64*Z;
      if(lx<-lr||ly<-lr||lx>W+lr||ly>H+lr)continue;
      ctx.drawImage(lampSprite,lx-lr,ly-lr,2*lr,2*lr);
    }
    if(selectedMap==='city')for(const sg of citySignsList()){   // brilho colorido dos letreiros
      if(sg.b.roofA<.3)continue;
      const [qx,qy]=sp(sg.cx,sg.cy+3),qr=46*Z;
      if(qx<-qr||qy<-qr||qx>W+qr||qy>H+qr)continue;
      ctx.globalAlpha=Math.min(1,dark*1.1)*(Math.sin(T*23+sg.ph)>.93?.5:.95);
      ctx.drawImage(SIGN_SP[sg.ci],qx-qr,qy-qr,2*qr,2*qr);
    }
    ctx.globalAlpha=Math.min(1,dark*1.1)*GL;
    ctx.globalAlpha=1;
    // faróis: cone de luz e halo
    if(tier<2)for(const v of headlit){
      const [hx0,hy0]=sp(v.x,v.y),cf=Math.cos(v.face||0),sf=Math.sin(v.face||0);
      ctx.save();ctx.translate(hx0+cf*14*Z,hy0+sf*14*Z);ctx.rotate(v.face||0);
      ctx.globalAlpha=Math.min(1,dark*1.3);ctx.drawImage(coneC,0,-64*Z*.8,256*Z*.8,128*Z*.8);
      ctx.restore();
    }
    ctx.globalAlpha=1;
    // chamas de veículo em chamas
    for(const v of vehicles){
      if(!v.dying)continue;
      const [vx,vy]=sp(v.x,v.y),r=(54+Math.random()*8)*Z;
      ctx.globalAlpha=Math.min(1,dark*1.2);ctx.drawImage(fireSprite,vx-r,vy-r,2*r,2*r);
    }
    // cuspe ácido brilha em verde
    for(const s of spits){const [qx,qy]=sp(s.x,s.y),r=22*Z;if(qx<-r||qy<-r||qx>W+r||qy>H+r)continue;ctx.globalAlpha=Math.min(1,dark*1.2);ctx.drawImage(greenSprite,qx-r,qy-r,2*r,2*r);}
    ctx.globalAlpha=1;
    // olhos de zumbi brilhando no escuro
    if(dark>.45&&tier<2){
      ctx.fillStyle='#ff3a1e';
      for(const z of zombies){
        if(z.dead||z.crawler||z.x<camX-10||z.x>camX+W/Z+10||z.y<camY-10||z.y>camY+H/Z+10)continue;   // quem rasteja não tem olho brilhando
        const [zx,zy]=sp(z.x,z.y),sc=(typeof zombieScale==='function'?zombieScale(z):1);
        if(Math.sin(z.face||0)<-.5)continue; // de costas
        const zbd=bldAt(z.x,z.y);if(zbd&&P.inside!==zbd&&zbd.roofA>.2)continue; // dentro de uma casa com o teto fechado: os olhos não aparecem através da parede
        ctx.globalAlpha=Math.min(1,(dark-.4)*2)*(z.kind===9?1:.8);
        ctx.fillRect(zx-2.5*Z*sc,zy-12*Z*sc,1.6*Z,1.3*Z);ctx.fillRect(zx+1*Z*sc,zy-12*Z*sc,1.6*Z,1.3*Z);
      }
      ctx.globalAlpha=1;
    }
    // vaga-lumes
    if(selectedMap==='forest'&&tier<2){
      for(const f of FF){
        if(!f.on)continue;
        const [fx,fy]=sp(f.x,f.y);if(fx<-20||fy<-20||fx>W+20||fy>H+20)continue;
        const b=Math.max(0,Math.sin(f.ph*2.1));const al=b*b*b*Math.min(1,dark*1.5);if(al<.03)continue;
        ctx.globalAlpha=al;const r=7*Z;ctx.drawImage(ffSprite,fx-r,fy-r-3*Z*Math.sin(f.ph),2*r,2*r);
      }
      ctx.globalAlpha=1;
    }
    ctx.globalCompositeOperation='source-over';
    ctx.imageSmoothingEnabled=false;
  }
  // pulsos de luz (clarão de tiro e explosão) também de dia, mais fracos
  if(LP.length){
    ctx.globalCompositeOperation='lighter';
    for(const q of LP){
      const [qx,qy]=sp(q.x,q.y),r=q.r*Z*1.1;
      ctx.globalAlpha=Math.min(1,q.t/q.d*1.3)*(dark>.1?1:.45);
      ctx.drawImage(q.col==='o'?fireSprite:warmSprite,qx-r,qy-r,2*r,2*r);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  // faróis: as duas luzes brancas na frente do veículo
  if(headlit.length){
    ctx.fillStyle='#ffffff';
    for(const v of headlit){
      const cf=Math.cos(v.face||0),sf=Math.sin(v.face||0),[hx0,hy0]=sp(v.x,v.y),hl=(v.w||36)/2-1,hw=Math.min(6,(v.h||20)/2-3);
      for(const sd of [-1,1]){
        const lx=hx0+(cf*hl-sf*hw*sd)*Z,ly=hy0+(sf*hl+cf*hw*sd)*Z;
        ctx.fillRect(lx-1.5*Z,ly-1*Z,3*Z,2*Z);
      }
    }
  }
  // poeira dourada no ar (dia)
  if(tier===0&&dark<.5&&(selectedMap==='forest'||selectedMap==='desert')&&weather==='none'){
    ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffe6b0';
    const al=.16+.3*Math.max(0,1-SUN.e);
    for(const m of MOTE){
      const x=((m.x*W+T*8*m.s+camX*Z*.3)%W+W)%W,y=((m.y*H+Math.sin(T*.6+m.ph)*14+T*3*m.s)%H+H)%H;
      ctx.globalAlpha=al*(.5+.5*Math.sin(T*1.3+m.ph));ctx.fillRect(x,y,Math.max(1,Z*.9),Math.max(1,Z*.9));
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  drawShafts();
  drawVignette(false);
  // relâmpago
  if(LT.f>.02&&!P.inside){
    ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(170,195,255,'+(LT.f*.5).toFixed(3)+')';ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }
}
function lakeGlints(l){
  if(l.fountain)return;
  const day=dark<.5;if(day&&SUN.e<.15)return;
  const R0=l.r,cx=l.cx,cy=l.cy;
  for(let i=0;i<22;i++){
    const ang=i*2.399,rad=Math.sqrt((i+.5)/22)*R0*.78,px=cx+Math.cos(ang)*rad,py=cy+Math.sin(ang)*rad*.88;
    const ph=Math.sin(T*(1.2+(i%5)*.23)+i*3.1);
    if(ph<.78)continue;
    const a=(ph-.78)/.22;
    ctx.fillStyle=day?'rgba(255,255,255,'+(.85*a).toFixed(2)+')':'rgba(190,215,255,'+(.55*a).toFixed(2)+')';
    ctx.fillRect(Math.round(px)-1,Math.round(py),3,1);ctx.fillRect(Math.round(px),Math.round(py)-1,1,3);
  }
}
function render(){
  if(!P)return;
  const sx=shake>0?Math.round(rnd(-shake,shake)):0,sy=shake>0?Math.round(rnd(-shake,shake)):0;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#070a07';ctx.fillRect(0,0,W,H);
  if(P.inside){
    const b=P.inside;
    const ox=Math.round(-(P.x-W/(2*Z))*Z),oy=Math.round(-(P.y-H/(2*Z))*Z);
    camX=-ox/Z;camY=-oy/Z;
    ctx.setTransform(Z,0,0,Z,ox+sx,oy+sy);
    R(0,0,WW,WH,'#040604');
    drawInterior(b);
    // Draw remote players inside this building (skip if they are in a vehicle)
    for(const id in remotePlayers){
      const rp=remotePlayers[id];
      if(!rp || rp.alive===false || rp.inVehicle) continue;
      if(rp.x<b.x||rp.x>b.x+b.w||rp.y<b.y||rp.y>b.y+b.h||!seeIn(b,rp.x,rp.y)) continue;
      if(rp.sl)drawSleeper(rp.x,rp.y,rp.sl,remoteLook(rp));else human(rp.x,rp.y,rp.face||0,{...remoteLook(rp),moving:rp.moving,anim:rp.anim||0,wpn:rp.hold?null:(rp.weapon||'fists'),hold:rp.hold||null,swing:rp.swing||0,ph:punchHand(rp,rp.swing||0),flash:rp.flash||0});
      const label=(rp.name||(rp.isHost?'HOST':'AMIGO')).toUpperCase().slice(0,12);
      ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
      ctx.fillStyle=rp.isHost?'#ff8080':'#80ffa0';ctx.fillText(label,rp.x,rp.y-21);
      if(rp.hp!==undefined){const hp=clamp(rp.hp,0,100);R(rp.x-6,rp.y-18,12,2,'#300000');R(rp.x-6,rp.y-18,Math.max(1,12*hp/100),2,'#dd3333');}
    }
    for(const an of animals)if(!an.dead&&an.x>=b.x&&an.x<=b.x+b.w&&an.y>=b.y&&an.y<=b.y+b.h&&seeIn(b,an.x,an.y))drawAnimal(an);
    if(P.sleeping)drawSleeper(P.x,P.y,P.sleeping,myLook());else human(P.x,P.y,P.face,{...myLook(),moving:P.moving,anim:P.walk,wpn:P.hold?null:P.weapon,hold:P.hold||null,swing:P.swing,ph:punchHand(P,P.swing),flash:P.flash});drawEatBar();
    for(const z of zombies)if(!z.dead&&z.x>=b.x&&z.x<=b.x+b.w&&z.y>=b.y&&z.y<=b.y+b.h&&seeIn(b,z.x,z.y)){
      human(z.x,z.y,z.face,{skin:z.hit>0?'#ffd0d0':z.skin,shirt:z.shirt,zv:z.si|0,moving:z.moving,anim:z.anim,zombie:true,lunge:z.lunge>0,s:zombieScale(z),kind:z.kind,spitter:z.ranged,wind:z.windT>0,screamer:z.screams,crawler:z.crawler,brute:z.kind===2,boss:z.kind===3,yeti:z.kind===9,bloater:z.bloater||z.kind===7});
      if(z.hp<z.max){R(z.x-6,z.y-20,12,2,'#300000');R(z.x-6,z.y-20,Math.max(1,12*z.hp/z.max),2,'#dd3333');}
    }
    if(GH.on&&GH.b===b)drawGhost();
    for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.gh&&rp.alive!==false&&rp.gh[0]===(b.x|0)&&rp.gh[1]===(b.y|0)&&!(GH.on&&GH.b===b))drawGhostAt(rp.gh[2],rp.gh[3],!!rp.gh[4]);}
    drawPingsWorld();
    // Tudo abaixo (cuspe, tiros, partículas, números) só é visível DENTRO do prédio onde o jogador está
    ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();
    // Cuspe também aparece dentro de prédios (antes só causava dano invisível)
    for(const s of spits){
      ctx.fillStyle='rgba(120,230,80,.85)';ctx.beginPath();ctx.arc(s.x,s.y,4,0,6.283);ctx.fill();
      ctx.fillStyle='rgba(180,255,120,.6)';ctx.beginPath();ctx.arc(s.x,s.y,2,0,6.283);ctx.fill();
    }
    // E3: tracers + particles inside buildings (were skipped by early return)
    if(CFG.tracers){
      for(const t of tracers){
        ctx.globalAlpha=Math.min(1,t.t*14);ctx.strokeStyle='#ffe27a';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();ctx.globalAlpha=1;
      }
    }
    for(const p of parts)if(!p.g)R(p.x,p.y,2,2,p.c);
    // Números de dano / feedback
    ctx.textAlign='center';ctx.font='bold 9px "Courier New",monospace';
    for(const f of floaters){
      ctx.globalAlpha=Math.min(1,f.t*1.4);
      ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y);
      ctx.globalAlpha=1;
    }
    ctx.restore();
    // Screen overlays (flash, joystick, minimap) — shared with outdoor path
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgb(255,238,214)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';drawVignette(true);
    ghostFx();sleepFx();drawPingsEdge();drawPingBadge();
    if(CFG.dmgflash&&flash>0){ctx.fillStyle='rgba(190,0,0,'+(flash*.7).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
    else if(CFG.screenflash&&P.hp<30&&!P.dead){ctx.fillStyle='rgba(120,0,0,'+(.1+.07*Math.sin(T*6)).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
    if(joy.active&&!P.inVehicle){
      ctx.globalAlpha=.55;ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.fillStyle='rgba(255,255,255,.12)';
      ctx.beginPath();ctx.arc(joy.ox,joy.oy,JR,0,6.283);ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(joy.px,joy.py,JK,0,6.283);ctx.fill();ctx.globalAlpha=1;
    }
    mmFrame();
    mmMarkers();
    return;
  }
  const ox=Math.round(-(P.x-W/(2*Z))*Z),oy=Math.round(-(P.y-H/(2*Z))*Z);
  camX=-ox/Z;camY=-oy/Z;
  ctx.setTransform(Z,0,0,Z,ox+sx,oy+sy);
  const vx0=camX-24,vy0=camY-24,vx1=camX+W/Z+24,vy1=camY+H/Z+24;
  const groundCol=selectedMap==='snow'?'#d0d8e0':selectedMap==='desert'?'#c2a65d':selectedMap==='city'?'#555a60':'#386a2c';
  R(0,0,WW,WH,groundCol);
  ctx.save();ctx.beginPath();ctx.rect(0,0,WW,WH);ctx.clip();   // azulejos da ultima coluna/linha nao passam do fim do mundo (borda preta lisa)
  const tx0=Math.max(0,Math.floor(vx0/16)),tx1=Math.min(WW/16,Math.ceil(vx1/16));
  const ty0=Math.max(0,Math.floor(vy0/16)),ty1=Math.min(WH/16,Math.ceil(vy1/16));
  for(let ty=ty0;ty<ty1;ty++)for(let tx=tx0;tx<tx1;tx++){
    const h=((tx*73856093)^(ty*19349663))>>>0,v=h%100;
    const px=tx*16,py=ty*16;
    if(selectedMap==='forest'){
      if(v<30) R(px,py,16,16,'#356427');
      else if(v<40) R(px,py,16,16,'#3d7230');
      else if(v<48){ R(px+4,py+4,3,3,'#4a8a3a'); R(px+10,py+9,2,2,'#2a5a20'); }
      else if(v<52) R(px+6,py+8,4,2,'#5a9a4a');
    } else if(selectedMap==='desert'){
      if(v<28) R(px,py,16,16,'#b89c54');
      else if(v<40) R(px,py,16,16,'#cbb06a');
      else if(v<48) R(px,py,16,16,'#d4b878');
      else if(v<55){ R(px+3,py+5,2,2,'#a88848'); R(px+10,py+10,2,2,'#e0c890'); }
    } else if(selectedMap==='snow'){
      if(v<30) R(px,py,16,16,'#c2ccd6');
      else if(v<42) R(px,py,16,16,'#d8e0e8');
      else if(v<50) R(px,py,16,16,'#e4ecf2');
      else if(v<56){ R(px+4,py+6,3,3,'#b0c0d0'); R(px+9,py+3,2,2,'#f0f4f8'); }
    } else { // city
      if(v<25) R(px,py,16,16,'#4e5359');
      else if(v<35) R(px,py,16,16,'#5a6068');
      else if(v<42) R(px+6,py+6,4,4,'#606060');
      else if(v<48){ R(px+2,py+2,12,1,'#4a4a50'); R(px+2,py+8,12,1,'#4a4a50'); }
      else if(v<52) R(px+5,py+5,6,6,'#3a3a40');
    }
  }
  ctx.restore();
  for(const l of lakes){
    const lr=l.r*1.25;
    if(l.cx+lr>vx0&&l.cx-lr<vx1&&l.cy+lr>vy0&&l.cy-lr<vy1) drawLake(l);
  }
  if(selectedMap==='city'){ drawCityRoads(vx0,vy0,vx1,vy1); drawOrla(vx0,vy0,vx1,vy1); }
  else for(const r of roads){
    if(r.x>vx1||r.x+r.w<vx0||r.y>vy1||r.y+r.h<vy0)continue;
    const roadCol=selectedMap==='snow'?'#98a4b0':selectedMap==='desert'?'#8c7c5c':selectedMap==='city'?'#3a3a40':'#7a6a4a';
    R(r.x,r.y,r.w,r.h,roadCol);
    // Edge lines
    if(selectedMap==='city'){
      R(r.x,r.y,r.w,1,'#666');R(r.x,r.y+r.h-1,r.w,1,'#666');
      if(r.w>r.h){ for(let i=r.x+8;i<r.x+r.w-8;i+=18) R(i,r.y+r.h/2-1,10,2,'#c0c050'); }
      else { for(let i=r.y+8;i<r.y+r.h-8;i+=18) R(r.x+r.w/2-1,i,2,10,'#c0c050'); }
    } else if(selectedMap==='desert'){
      R(r.x,r.y,r.w,1,'#a09070');R(r.x,r.y+r.h-1,r.w,1,'#a09070');
    } else if(selectedMap==='snow'){
      R(r.x,r.y,r.w,2,'#e8f0f8'); // snow piled on roadside
    }
  }
  // Sangue no chao (manchas e respingos) fica ABAIXO dos veiculos; so itens e entidades aparecem por cima
  for(const d of decals){
    if(d.x<vx0||d.x>vx1||d.y<vy0||d.y>vy1)continue;
    ctx.globalAlpha=Math.max(0,Math.min(1,d.l/12));R(d.x-6,d.y-2,12,6,'#5a1010');
  }
  ctx.globalAlpha=1;
  for(const p of parts)if(p.g)R(p.x,p.y,2,2,p.c);
  for(const b of blds)if(b.x-12<vx1&&b.x+b.w+12>vx0&&b.y<vy1&&b.y+b.h+10>vy0)drawBldGround(b);   // varanda, degraus e enfeites no chão, antes de veículos e itens
  drawCornFlat(vx0,vx1,vy0,vy1);   // terreno dos marcos/milharal ANTES dos veículos (carro nunca some embaixo)
  drawLMFlat(vx0,vx1,vy0,vy1);
  drawPrints(vx0,vx1,vy0,vy1);
  for(const v of vehicles)if(v.x+v.w>vx0&&v.x-v.w<vx1&&v.y+v.h>vy0&&v.y-v.h<vy1)drawVehicle(v);
  if(plane&&plane.x+60>vx0&&plane.x-60<vx1&&plane.y+50>vy0&&plane.y-50<vy1)drawPlane(plane);
  const vis=b=>b.x<vx1&&b.x+b.w>vx0&&b.y<vy1&&b.y+b.h>vy0;
  for(const b of blds){
    if(!vis(b))continue;
    bldShadow(b);
    const style=b.style||0;
    const flBase=
      b.type==='mil'?'#5a6250':
      b.type==='shop'||b.type==='gas'?'#a09a90':
      b.type==='warehouse'?'#5a5a62':
      b.type==='apartment'?'#6a7078':
      b.type==='office'?'#5a6878':
      b.type==='clinic'?'#c8d0d8':
      b.type==='garage'?'#7a7868':
      b.type==='barn'?'#8a4a2a':
      b.type==='cabin'?'#7a5a3a':
      (selectedMap==='city'?'#6b665c':'#8a6b47');
    // Variação de tom por prédio
    const fl = style===1?'#5a5248':style===2?'#6e6558':style===3?'#4a5048':style===4?'#706058':flBase;
    R(b.x,b.y,b.w,b.h,fl);
    // Detalhe de parede (tijolo / madeira) por estilo
    if(style===1||style===3){
      for(let fy=b.y+10;fy<b.y+b.h-8;fy+=7)
        for(let fx=b.x+4;fx<b.x+b.w-6;fx+=9) R(fx,fy,7,1,'rgba(0,0,0,.12)');
    } else if(style===2){
      for(let fx=b.x+6;fx<b.x+b.w-6;fx+=8) R(fx,b.y+6,1,b.h-12,'rgba(0,0,0,.1)');
    }
    // Floor grain / tiles
    if(b.type==='shop'||b.type==='warehouse'||b.type==='office'||b.type==='garage'){
      for(let fy=b.y+10;fy<b.y+b.h-8;fy+=10) R(b.x+4,fy,b.w-8,1,'rgba(0,0,0,.08)');
    } else {
      for(let fy=b.y+8;fy<b.y+b.h-6;fy+=8) R(b.x+3,fy,b.w-6,1,'rgba(0,0,0,.1)');
    }
    // Windows
    const winCol = dark>0.4 ? '#ffe080' : '#6a90b0';
    const floors=b.floors||1;
    if(floors>1 || b.type==='apartment'||b.type==='office'){
      const rows=Math.max(2, floors);
      for(let row=0;row<rows;row++){
        const wy=b.y+10+row*Math.floor((b.h-24)/rows);
        for(let wx=b.x+8;wx<b.x+b.w-14;wx+=14){
          R(wx,wy,8,6,winCol);R(wx+1,wy+1,6,4,'rgba(255,255,255,.2)');
        }
      }
    } else {
      const wx1=b.x+10, wx2=b.x+b.w-18;
      R(wx1,b.y+12,8,7,winCol);R(wx1+1,b.y+13,6,5,'rgba(255,255,255,.25)');
      if(b.w>70){ R(wx2,b.y+12,8,7,winCol);R(wx2+1,b.y+13,6,5,'rgba(255,255,255,.25)'); }
    }
    if(b.type==='mil'){ R(b.x+b.w/2-4,b.y+10,8,5,'#3a4a30'); }
    if(b.type==='shop'){ R(b.x+6,b.y+4,b.w-12,3,'#c04030'); }
    if(b.type==='gas'){ R(b.x+6,b.y+4,b.w-12,3,'#d0b030'); R(b.x+8,b.y+5,4,2,'#222'); }
    if(b.type==='clinic'){ R(b.x+b.w/2-5,b.y+8,10,3,'#e04040'); R(b.x+b.w/2-1,b.y+5,2,9,'#e04040'); }
    if(b.type==='garage'){ R(b.doorX-2,b.y+b.h-14,b.door+4,10,'#2a2a28'); } // portão
    R(b.doorX,b.y+b.h-6,b.door,6,'#3a2a1c');
    R(b.doorX+2,b.y+b.h-5,3,2,'#5a4a30');
  }
  let nearIt=null,nd=24;
  for(const it of items){
    if(it.x<vx0||it.x>vx1||it.y<vy0||it.y>vy1||itemIndoor(it))continue;
    const d=Math.hypot(it.x-P.x,it.y-P.y);
    if(d<nd){nd=d;nearIt=it;}
  }
  for(const it of items){
    if(it.x<vx0||it.x>vx1||it.y<vy0||it.y>vy1||itemIndoor(it))continue;
    drawItem(it,it===nearIt);
  }
  const wallCol=selectedMap==='snow'?'#4a5a6a':selectedMap==='desert'?'#7a5a3a':selectedMap==='city'?'#3a3a42':'#5a4636';
  for(const w of walls){
    if(w.x>vx1||w.x+w.w<vx0||w.y>vy1||w.y+w.h<vy0)continue;
    R(w.x,w.y,w.w,w.h,wallCol);
  }
  for(const b of blds)if(vis(b))drawFacade(b);   // fachada sul: material da parede, janelas e porta de cada prédio
  const list=[];
  for(const t of trees)if(t.x>vx0-36&&t.x<vx1+36&&t.y>vy0&&t.y<vy1+80)list.push({y:t.y,k:0,o:t});
  for(const d of decorations)if(d.x>vx0&&d.x<vx1&&d.y>vy0&&d.y<vy1+24)list.push({y:d.y,k:6,o:d});
  for(const r of rocks)if(r.x>vx0&&r.x<vx1&&r.y>vy0&&r.y<vy1+24)list.push({y:r.y,k:3,o:r});
  for(const c of campfires)if(c.x>vx0&&c.x<vx1&&c.y>vy0&&c.y<vy1)list.push({y:c.y,k:4,o:c});
  for(const t of tents)if(t.x>vx0-30&&t.x<vx1+30&&t.y>vy0&&t.y<vy1+30)list.push({y:t.y,k:9,o:t});
  for(const z of zombies)if(!z.dead&&z.x>vx0&&z.x<vx1&&z.y>vy0&&z.y<vy1)list.push({y:z.y,k:1,o:z});
  for(const a of animals)if(!a.dead&&a.x>vx0&&a.x<vx1&&a.y>vy0&&a.y<vy1)list.push({y:a.y,k:7,o:a});
  drawBirdsGround(vx0,vx1,vy0,vy1,list);
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    // Hide character sprite while remote is driving — only the car is shown
    if(rp.inVehicle) continue;
    if(rp.sl&&rp.sl.tent) continue;
    if(rp.x>vx0&&rp.x<vx1&&rp.y>vy0&&rp.y<vy1)list.push({y:rp.y,k:5,o:rp});
  }
  if(FIELD){
    for(const c of FIELD.stalks)if(c[0]>vx0-10&&c[0]<vx1+10&&c[1]>vy0&&c[1]<vy1+34)list.push({y:c[1],k:11,o:c});
    if(FIELD.sx>vx0-30&&FIELD.sx<vx1+30&&FIELD.sy>vy0&&FIELD.sy<vy1+40)list.push({y:FIELD.sy,k:10,o:FIELD});
  }
  if(OBS.on&&!P.inside)list.push({y:OBS.y,k:8,o:OBS});
  if(!P.inside)for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.ob&&rp.alive!==false&&!rp.inVehicle)list.push({y:rp.ob[1],k:8,o:{x:rp.ob[0],y:rp.ob[1],alpha:1,glitch:rp.ob[2]?.3:0}});}
  if(!P.inVehicle&&!(P.sleeping&&P.sleeping.tent))list.push({y:P.y,k:2,o:P});
  list.sort((a,b)=>a.y-b.y);
  for(const e of list){
    if(e.k===0)drawTree(e.o);
    else if(e.k===3)drawRock(e.o);
    else if(e.k===4)drawCampfire(e.o);
    else if(e.k===9)drawTent(e.o);
    else if(e.k===6)drawDecoration(e.o);
    else if(e.k===7){ drawAnimal(e.o); }
    else if(e.k===8){ drawObserver(e.o); }
    else if(e.k===10){ drawScarecrow(e.o); }
    else if(e.k===11){ drawStalk(e.o); }
    else if(e.k===12){ shadow(e.o.x,e.o.y,2*BIRD_SP[e.o.sp].sz,1); drawBirdBody(e.o,e.o.x,e.o.y,false); }
    else if(e.k===1){
      const z=e.o;
      human(z.x,z.y,z.face,{skin:z.hit>0?'#ffd0d0':z.skin,shirt:z.shirt,zv:z.si|0,moving:z.moving,anim:z.anim,zombie:true,lunge:z.lunge>0,s:zombieScale(z),kind:z.kind,spitter:z.ranged,wind:z.windT>0,screamer:z.screams,crawler:z.crawler,brute:z.kind===2,boss:z.kind===3,yeti:z.kind===9,bloater:z.bloater||z.kind===7});
      if(z.hp<z.max){R(z.x-6,z.y-20,12,2,'#300000');R(z.x-6,z.y-20,Math.max(1,12*z.hp/z.max),2,'#dd3333');}
    }else if(e.k===5){
      const rp=e.o;
      if(rp.alive!==false){
        if(rp.sl)drawSleeper(rp.x,rp.y,rp.sl,remoteLook(rp));else human(rp.x,rp.y,rp.face||0,{...remoteLook(rp),moving:rp.moving,anim:rp.anim||0,wpn:rp.hold?null:(rp.weapon||'fists'),hold:rp.hold||null,swing:rp.swing||0,ph:punchHand(rp,rp.swing||0),flash:rp.flash||0});
        const label=(rp.name||(rp.isHost?'HOST':'AMIGO')).toUpperCase().slice(0,12);
        ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
        ctx.fillStyle=rp.isHost?'#ff8080':'#80ffa0';ctx.fillText(label,rp.x,rp.y-21);
        if(rp.hp!==undefined){const hp=clamp(rp.hp,0,100);R(rp.x-6,rp.y-18,12,2,'#300000');R(rp.x-6,rp.y-18,Math.max(1,12*hp/100),2,'#dd3333');}
      }
    }else{
      if(P.sleeping)drawSleeper(P.x,P.y,P.sleeping,myLook());else human(P.x,P.y,P.face,{...myLook(),moving:P.moving,anim:P.walk,wpn:P.hold?null:P.weapon,hold:P.hold||null,swing:P.swing,ph:punchHand(P,P.swing),flash:P.flash});drawEatBar();
    }
  }
  for(const b of blds)if(vis(b)&&b.roofA>.02){drawRoof(b);bldTopFx(b);}
  drawIceFx();drawMirage(vx0,vx1,vy0,vy1);drawFog(vx0,vx1,vy0,vy1);
  drawPingsWorld();
  drawBirdsAir(vx0,vx1,vy0,vy1);
  for(const s of spits){
    if(s.x<vx0||s.x>vx1||s.y<vy0||s.y>vy1)continue;
    ctx.fillStyle='rgba(120,230,80,.85)';ctx.beginPath();ctx.arc(s.x,s.y,4,0,6.283);ctx.fill();
    ctx.fillStyle='rgba(180,255,120,.6)';ctx.beginPath();ctx.arc(s.x,s.y,2,0,6.283);ctx.fill();
  }
  if(weather!=='none'){
    if(weather==='sand'){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='rgba(196,150,80,.2)';ctx.fillRect(0,0,W,H);ctx.restore();} // névoa de areia
    ctx.fillStyle=weather==='rain'?'rgba(140,180,220,0.65)':(weather==='sand'?'rgba(214,178,110,0.8)':'rgba(240,248,255,0.85)');
    for(const wp of weatherParticles)if(wp.x>=camX-10&&wp.x<=camX+W/Z+10&&wp.y>=camY-10&&wp.y<=camY+H/Z+10)R(wp.x,wp.y,wp.sz,weather==='rain'?wp.sz*5:wp.sz,ctx.fillStyle);
  }
  for(const v of vapor){const a=.85*(1-v.t/.9);ctx.globalAlpha=a;const sz=3+Math.round(v.t*4);R(v.x-1,v.y-1,sz+2,sz+2,'#9fb2c6');R(v.x,v.y,sz,sz,'#f4f8fc');ctx.globalAlpha=1;}
  drawFishing();
  if(CFG.tracers){
    for(const t of tracers){
      ctx.globalAlpha=Math.min(1,t.t*14);ctx.strokeStyle='#ffe27a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();ctx.globalAlpha=1;
    }
  }
  for(const p of parts)if(!p.g)R(p.x,p.y,2,2,p.c);
  ctx.textAlign='center';ctx.font='bold 9px "Courier New",monospace';
  for(const f of floaters){
    ctx.globalAlpha=Math.min(1,f.t*1.4);
    ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y);
    ctx.globalAlpha=1;
  }
  drawLighting(sx,sy);
  ctx.setTransform(1,0,0,1,0,0);
  sleepFx();
  if(OBS.vis||OBS.glitch>0){
    if(OBS.vis){const va=.32*OBS.alpha,g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.65);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+va.toFixed(3)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    if(OBS.glitch>0){for(let i=0;i<9;i++){ctx.fillStyle=Math.random()<.5?'rgba(255,255,255,.12)':'rgba(0,0,0,.28)';ctx.fillRect(0,Math.random()*H,W,1+Math.random()*3*(OBS.glitch*4));}}
  }
  drawFishMini();drawPingsEdge();drawPingBadge();
  if(CFG.dmgflash&&flash>0){ctx.fillStyle='rgba(190,0,0,'+(flash*.7).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
  else if(CFG.screenflash&&P.hp<30&&!P.dead){ctx.fillStyle='rgba(120,0,0,'+(.1+.07*Math.sin(T*6)).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
  if(joy.active&&!P.inVehicle){
    ctx.globalAlpha=.55;ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.fillStyle='rgba(255,255,255,.12)';
    ctx.beginPath();ctx.arc(joy.ox,joy.oy,JR,0,6.283);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(joy.px,joy.py,JK,0,6.283);ctx.fill();ctx.globalAlpha=1;
  }
  // Minimapa: não redesenha todo frame em economia
  mmDrawT++;
  if((mmDrawT%perf().mmEvery)===0){
    mmFrame();
    mmMarkers();
  }
}

// constantes e variaveis (expostas depois de criadas)
window.fracHash=fracHash;
window.SUN=SUN;
Object.defineProperty(window,'blizzK',{get:()=>blizzK,set:v=>{blizzK=v;},configurable:true});   // variavel que muda: os outros arquivos sempre leem o valor atual
})();
