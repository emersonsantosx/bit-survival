/* DANO VISUAL NOS OBJETOS QUEBRAVEIS
   A pedra ja mostrava o quanto apanhou (rachaduras e lascas). Aqui o mesmo vale para tudo que da para destruir: arvores, cercas, portoes,
   paredes e portas, troncos, objetos do mapa (banco, caixote, placa, barreira, lixeira, boneco de neve...) e os moveis das casas.
   O estagio sai da vida que sobrou (dmgStage), entao a arma decide o quanto o objeto parece destruido: um machado tira metade da arvore
   no primeiro golpe e ela ja aparece bem cortada; com as maos leva muitos golpes e as marcas vao surgindo aos poucos.
   Estagio 0 = intacto. 1 a 4 = rachaduras, lascas, buraco e pedaco faltando, cada vez mais fortes.
   O desenho e feito por cima do sprite (sem refazer imagens) e so existe enquanto o objeto esta ferido.
   Nada aqui sorteia com rnd(): usa so a posicao do objeto, entao todos os jogadores veem as mesmas marcas. */
(function(){
const CELL=16;   // mesma grade das cercas (19-cerca.js)
const PAL={
  wood:{cr:'#25160a',lt:'#e0bc84',dk:'#120a04'},
  metal:{cr:'#262a2e',lt:'#c4ccd4',dk:'#14171a',rust:'#8a4a2a'},
  stone:{cr:'rgba(12,12,20,.8)',lt:'#eceef4',dk:'rgba(10,10,16,.9)'},
  cloth:{cr:'#2a2420',lt:'#f0e6c8',dk:'#18120e'},
  snow:{cr:'#7f95a8',lt:'#ffffff',dk:'#6a8094'},
  leaf:{cr:'#4a321c',lt:'#a8cc6a',dk:'#142410'},
  cactus:{cr:'#23401e',lt:'#d8e8a8',dk:'#1c3018'}
};
function hh(a,b,c){let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}

/* 0 intacto; 1 a 4 conforme a fracao de vida perdida (20% ja marca, 80% ou mais e o mais destruido) */
window.dmgStage=function(hp,max){
  if(!(max>0)||hp===undefined||!(hp<max-.001))return 0;
  const f=1-Math.max(0,hp)/max;
  return Math.min(4,1+Math.floor(f*4));
};

/* rachaduras, lascas, buraco e pedaco faltando dentro do retangulo (x,y,w,h), no material certo */
window.dmgFx=function(mat,x,y,w,h,stage,sx,sy){
  if(stage<=0||w<3||h<3)return;
  const p=PAL[mat]||PAL.wood;x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);sx=Math.round(sx);sy=Math.round(sy);
  if(mat==='leaf'){   // planta: falhas escuras na folhagem, galhinhos expostos e folhas caidas no pe
    for(let i=0;i<stage*2;i++){const lx=x+Math.floor(hh(sx,sy,i)*(w-2)),ly=y+Math.floor(hh(sy,sx,i+9)*(h-2));R(lx,ly,2,2,p.dk);if(i&1)R(lx,ly+1,3,1,p.cr);}
    for(let i=0;i<stage+1;i++)R(x-2+Math.floor(hh(sx,sy,30+i)*(w+3)),y+h-1+Math.floor(hh(sy,sx,40+i)*3),2,1,p.lt);
    return;
  }
  const n=stage+1;
  for(let i=0;i<n;i++){   // rachaduras: caminhada torta de cima para baixo, mais compridas a cada estagio
    let px=x+1+Math.floor(hh(sx,sy,i)*(w-2)),py=y+Math.floor(hh(sy,sx,i+9)*h*.35);
    const L=Math.round(h*(.3+.45*hh(sx+i,sy,5)))+stage;
    for(let s=0;s<L&&py<y+h;s++){R(px,py,1,1,p.cr);py++;if(hh(sx,sy+s,i+20)<.45){px+=hh(sx+s,sy,i+30)<.5?-1:1;if(px<x)px=x;if(px>=x+w)px=x+w-1;}}
  }
  if(stage>=2){   // lascas claras nas bordas (madeira exposta, metal riscado, po de pedra)
    for(let i=0;i<stage;i++){
      const side=hh(sx,sy,40+i),lx=side<.5?x+Math.floor(hh(sx,sy,50+i)*w):x+(side<.75?0:w-1),ly=side<.5?y:y+Math.floor(hh(sx,sy,60+i)*h);
      R(lx,ly,2,1,p.lt);R(lx,ly+1,1,1,p.cr);
    }
    if(mat==='metal')for(let i=0;i<stage;i++)R(x+Math.floor(hh(sx,sy,70+i)*(w-2)),y+Math.floor(hh(sy,sx,80+i)*(h-1)),2,1,p.rust);   // ferrugem nos amassados
  }
  if(stage>=3){   // buraco: mordida escura com borda clara
    const bw=Math.max(2,Math.round(w*.18)),bh=Math.max(2,Math.round(h*.2)),bx=x+Math.floor(hh(sx,sy,90)*(w-bw)),by=y+Math.floor(h*.35+hh(sy,sx,91)*h*.35);
    R(bx,by,bw,bh,p.dk);R(bx,by-1,bw,1,p.lt);R(bx+bw-1,by,1,bh,p.cr);
  }
  if(stage>=4){   // pedaco faltando num canto
    const cw=Math.max(3,Math.round(w*.3)),ch=Math.max(3,Math.round(h*.3)),left=hh(sx,sy,95)<.5,cx=left?x:x+w-cw;
    R(cx,y,cw,ch,p.dk);R(cx+(left?cw:-1),y,1,ch,p.lt);R(cx,y+ch,cw,1,p.lt);
    for(let i=0;i<3;i++)R(cx+Math.floor(hh(sx,sy,100+i)*cw),y+ch+1+i%2,1,1,p.lt);   // farelo caindo
  }
};

/* arvore: cortes de machado no tronco (cada estagio abre um corte novo, de lados alternados) e casca no chao */
window.treeDmgFx=function(t,stage){
  if(stage<=0)return;
  const x=Math.round(t.x),y=Math.round(t.y),sd=Math.round(t.x*7+t.y*13);
  for(let i=0;i<stage;i++){
    const side=((sd+i)&1)?1:-1,yy=y-3-i*3;
    R(x+(side>0?0:-3),yy,3,2,'#e0bc84');R(x+(side>0?0:-3),yy+2,3,1,'#25160a');   // corte claro com sombra embaixo
    if(stage>=3&&i<stage-2)R(x+(side>0?-3:0),yy+1,3,2,'#e0bc84');                   // corte dos dois lados: tronco quase partido
  }
  for(let i=0;i<stage;i++)R(x-6+Math.floor(hh(sd,i,3)*12),y+1+(i&1),1,1,'#6b4a2e');   // casca e lascas no chao
  if(stage>=4)R(x-1,y-3-stage*3,3,1,'#25160a');                                       // fenda no alto: vai cair
};

/* efeito de tremida logo apos o golpe (igual ao da pedra), em px de deslocamento */
window.hitWobble=function(o,amp){
  const a=o._hit!==undefined?T-o._hit:9;
  return a<.22?Math.round(Math.sin(a*70)*(1-a/.22)*(amp||1.5)):0;
};

/* retangulo e material de cada objeto do mapa que da para quebrar */
const DEC={
  log:['wood',-8,-6,16,7],frozen_log:['wood',-8,-6,16,7],stump:['wood',-5,-6,10,7],bench:['wood',-9,-7,18,8],crate:['wood',-6,-9,12,10],sign:['wood',-4,-14,8,14],
  barrier:['metal',-8,-9,16,9],mailbox:['metal',-4,-11,8,11],trash:['metal',-4,-10,8,10],cone:['metal',-3,-8,6,8],snowman:['snow',-6,-18,12,18],
  bush:['leaf',-7,-11,14,11],bush2:['leaf',-8,-12,16,12],berry:['leaf',-6,-9,12,9],drybush:['leaf',-6,-9,12,9],frozen_bush:['leaf',-7,-10,14,10],yucca:['leaf',-6,-12,12,12],
  cactus_sm:['cactus',-3,-9,6,9],cactus_bg:['cactus',-3,-18,6,17],cactus_tall:['cactus',-3,-23,6,22]
};
window.cityBushDmgFx=function(d){const b=window.CITY_BUSH;if(!b)return;const st=dmgStage(d.hp,b.hp);if(st)dmgFx('leaf',d.x-5,d.y-6,10,7,st,d.x,d.y);};
window.decorDmgFx=function(d){
  const e=DEC[d.type],b=window.BREAK&&BREAK[d.type];if(!e||!b)return;
  const st=dmgStage(d.hp,b.hp);if(st)dmgFx(e[0],d.x+e[1],d.y+e[2],e[3],e[4],st,d.x,d.y);
};
window.fenceDmgFx=function(f){
  const st=dmgStage(f.hp,HP_F[f.g|0]);if(!st)return;
  const x=f.x*CELL,y=f.y*CELL,tall=f.g>=2;
  if(f.d==='h')tall?dmgFx('wood',x,y-WH_,CELL,WH_+1,st,x,y):dmgFx('wood',x+1,y-7,CELL-2,8,st,x,y);
  else tall?dmgFx('wood',x-3,y-WH_+3,6,WH_+CELL-3,st,x,y):dmgFx('wood',x-1,y-5,3,CELL+1,st,x,y);
};
window.logDmgFx=function(L){
  const st=dmgStage(L.hp,4);if(!st)return;
  const x=Math.round(L.x),y=Math.round(L.y);
  if(L.a==='h')dmgFx('wood',x-20,y-7,40,9,st,x,y);else dmgFx('wood',x-5,y-20,10,38,st,x,y);
};
const STONEY={toilet:1,tub:1,sink:1,ksink:1,fireplace:1,tv:1};
window.furnDmgFx=function(f){
  const fb=fbOf(f),st=dmgStage(f.hp,fb.hp);if(!st)return;
  const mat=STONEY[f.k]?'stone':fb.tool==='pickaxe'?'metal':fb.mat[0][0]==='cloth'?'cloth':'wood';
  dmgFx(mat,f.x,f.y,f.w,f.h,st,f.x,f.y);
};

/* o golpe nao quebrou: avisa os outros jogadores quanta vida sobrou, para todos verem as mesmas marcas */
window.structDmgSend=function(key,hp){if(MP.active&&key)sendEvt('structDmg',{k:key,hp:Math.round(hp*100)/100});};
window.structFind=function(key){
  if(typeof key!=='string')return null;
  let m;
  if(key.charAt(0)==='m'){
    m=/^m:(\d+),(-?\d+),(-?\d+),(.+)$/.exec(key);if(!m)return null;
    const b=blds[+m[1]];return b&&b.furn?b.furn.find(q=>Math.round(q.x)===+m[2]&&Math.round(q.y)===+m[3]&&q.k===m[4])||null:null;
  }
  if(key.charAt(0)==='o'){
    m=/^o:(-?\d+),(-?\d+),([hv])$/.exec(key);if(!m)return null;
    return logList().find(l=>Math.round(l.x)===+m[1]&&Math.round(l.y)===+m[2]&&l.a===m[3])||null;
  }
  if(key.charAt(0)==='f'){m=/^f:([hv])(-?\d+),(-?\d+)$/.exec(key);return m?fenceAt(+m[2],+m[3],m[1])||null:null;}
  if(key.charAt(0)==='c'){m=/^c:(-?\d+),(-?\d+)$/.exec(key);return m?cityDecor.find(d=>d.t==='bush'&&d.x===+m[1]&&d.y===+m[2])||null:null;}
  m=/^d:(-?\d+),(-?\d+),(.+)$/.exec(key);if(!m)return null;
  return decorations.find(d=>d.x===+m[1]&&d.y===+m[2]&&d.type===m[3])||null;
};
window.structDmgRemote=function(data){
  if(!data||!Number.isFinite(data.hp))return;
  const o=structFind(data.k);if(!o)return;
  if(o.hp===undefined||data.hp<o.hp)o.hp=clamp(data.hp,0,20);   // so desce: um aviso atrasado nao "conserta" o objeto
  o._hit=T;
};
})();
