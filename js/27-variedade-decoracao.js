/* VARIEDADE DE DECORACAO
   As decoracoes (arbustos, flores, capim, cactos, pedrinhas, lixo...) ja guardam uma semente propria (d.seed, sorteada junto com o mundo).
   Aqui a semente vira variacao: espelhada ou nao, com frutinhas, flores, cogumelos, musgo, pedrinhas e outros enfeites, e alguns itens trocam de forma.
   Nao sorteia nada novo e nao muda a lista de decoracoes de nenhum mapa: o mundo e igual nos dois jogadores e nos saves. */
(function(){
const fr=v=>v-Math.floor(v);
const MIRROR=new Set(['bush','bush2','fern','tallgrass','berry','cactus_sm','cactus_bg','cactus_tall','yucca','drybush','sandrock','rock_sm','rock_moss','frozen_bush','snowpile','ice','crystal','icicle','dune','log','stump','frozen_log','sled','ski','trash','bench','crate','dumpster','barrier','mushroom','tumbleweed','bone']);
const q=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
const flor=(x,y,p,c)=>{q(x-1,y+3,1,3,'#3a8a3a');q(x-1,y,3,3,p);q(x,y+1,1,1,c);};     // florzinha de 3x3 com miolo
const FLOWER_COLS=[['#f4f4f0','#e0c020'],['#f070b0','#fff0a0'],['#f09030','#fff0a0'],['#a070e0','#fff0a0'],['#e04040','#ffd84a']];
const MUSH=[['#c04040','#fff'],['#a06a3a','#e8dcc0'],['#e0e0d0','#c0b090']];
const BERRY=['#d03030','#4060d0','#8a3aa8'];
window.decoDraw=function(d,base){
  const t=d.type,s=d.seed||0,x=d.x,y=d.y,h2=fr(s*977.13),h3=fr(s*131.7);
  // formas que trocam de desenho
  if(t==='cone'&&h3>.7){   // cone caido
    shadow(x,y+2,6,2);q(x-6,y-4,12,4,'#e08a20');q(x-6,y-4,3,4,'#c07018');q(x-1,y-4,1,4,'#fff');q(x+2,y-4,1,4,'#fff');return;}
  if(t==='hydrant'&&h3>.55){   // hidrante amarelo ou azul
    const c=h3>.8?['#2a5aa8','#4a7ad0','#1a3a78']:['#d8b020','#f0cc38','#9a7a10'];
    shadow(x,y+2,4,2);q(x-3,y-10,6,10,c[0]);q(x-4,y-12,8,3,c[1]);q(x-3,y-4,1,3,c[2]);q(x+2,y-4,1,3,c[2]);return;}
  if(MIRROR.has(t)&&fr(s*37.7)>.5){   // espelhado: a sombra do sol continua do lado certo
    const sd=SUN.dx;ctx.save();ctx.translate(2*x,0);ctx.scale(-1,1);SUN.dx=-sd;base(d);SUN.dx=sd;ctx.restore();
  }else base(d);
  switch(t){
    case'bush':
      if(h3<.35){for(const o of [[-3,-5],[2,-7],[4,-4],[-1,-8]])q(x+o[0],y+o[1],1,1,'#d03030');}                       // frutinhas
      else if(h3<.55){for(const o of [[-3,-8],[1,-9],[3,-6]])q(x+o[0],y+o[1],2,2,'#f080b0');}                           // florido
      else if(h3<.7){q(x-3,y-13,6,4,'#3a8a3a');q(x-2,y-14,3,1,'#4aa04a');}                                              // mais alto
      break;
    case'bush2':
      if(h3<.4){q(x-2,y-9,2,1,'#6aaa5a');q(x+2,y-7,2,1,'#6aaa5a');}
      else if(h3<.6){q(x+7,y-3,1,3,'#e8dcc0');q(x+6,y-5,3,2,'#c04040');q(x+7,y-5,1,1,'#fff');}
      break;
    case'flower_r':case'flower_b':case'flower_y':
      if(h3>.4){const c=FLOWER_COLS[Math.floor(h2*5)%5],c2=FLOWER_COLS[Math.floor(fr(h2*7.3)*5)%5];flor(x+6,y-6,c[0],c[1]);if(h3>.7)flor(x-6,y-5,c2[0],c2[1]);}
      break;
    case'mushroom':
      if(h3>.4){const m=MUSH[Math.floor(h2*3)%3];q(x+6,y-1,1,3,'#e8dcc0');q(x+4,y-3,5,2,m[0]);q(x+5,y-4,3,1,m[0]);q(x+5,y-3,1,1,m[1]);
        if(h3>.7){q(x-6,y,1,2,'#e8dcc0');q(x-7,y-2,3,2,m[0]);}}
      break;
    case'fern':
      if(h3>.5){q(x-7,y-4,1,3,'#4a8a3a');q(x+6,y-4,1,3,'#4a8a3a');q(x-5,y-7,1,2,'#5a9a4a');q(x+5,y-7,1,2,'#5a9a4a');}
      break;
    case'tallgrass':
      if(h3>.4){for(const i of [-3,-1,2])q(x+i,y-11-Math.abs(i),1,2,'#c8c070');}                                          // espigas secas
      break;
    case'berry':{
      const c=BERRY[Math.floor(h2*3)%3];for(const o of [[-3,-5],[0,-7],[3,-4],[-1,-3],[4,-7]])q(x+o[0],y+o[1],2,2,c);
      break;}
    case'cactus_sm':
      if(h3>.45){q(x-1,y-9,3,2,'#f070a0');q(x,y-10,1,1,'#ffe080');}
      break;
    case'cactus_bg':
      if(h3>.5){const c=h2<.5?'#f06090':'#f0d030';q(x-1,y-19,3,3,c);}
      if(h3>.8)for(const o of [[-8,-13],[8,-15]])q(x+o[0],y+o[1],2,2,'#d04050');                                          // frutos
      break;
    case'cactus_tall':
      if(h3>.5)q(x-1,y-24,3,3,h2<.5?'#f06090':'#f0d030');
      if(h3>.8)for(const o of [[-7,-18],[7,-20]])q(x+o[0],y+o[1],2,2,'#d04050');
      break;
    case'drybush':
      if(h3>.5){for(const o of [[-3,-6],[1,-8],[4,-5]])q(x+o[0],y+o[1],1,1,'#e0c060');}
      break;
    case'yucca':
      if(h3>.5){q(x,y-15,1,9,'#6a8a3a');q(x-1,y-18,3,4,'#f4efd0');q(x-2,y-16,1,2,'#f4efd0');q(x+2,y-16,1,2,'#f4efd0');}
      break;
    case'sandrock':case'rock_sm':case'rock_moss':
      if(h3>.5){q(x+8,y-1,3,2,'#a8a090');q(x+9,y-2,1,1,'#c0b8a8');}
      if(h3>.8)q(x-10,y,2,1,'#a8a090');
      break;
    case'frozen_bush':
      if(h3>.5&&h3<.78){q(x-4,y+1,1,3,'#c0e8f8');q(x+1,y+1,1,2,'#c0e8f8');q(x+4,y+1,1,3,'#a0d0e8');}
      else if(h3>=.78){for(const o of [[-3,-5],[1,-6],[3,-4]])q(x+o[0],y+o[1],2,2,'#d05050');q(x-3,y-5,1,1,'#f8d8d8');}   // frutinhas vermelhas congeladas
      else if(h3<.25){q(x-7,y-3,3,3,'#e8f4f8');q(x+5,y-9,3,2,'#f8fcff');}
      break;
    case'snowpile':
      if(h3>.5){q(x+8,y-2,6,3,'#f0f4f8');q(x+9,y-4,3,2,'#f8fcff');}
      if(h3>.8){q(x-12,y-1,5,2,'#f0f4f8');q(x-11,y-3,3,2,'#f8fcff');}
      else if(h3<.2){q(x-3,y-8,3,2,'#e0eaf2');}
      break;
    case'ice':
      if(h3>.5){q(x+7,y-2,5,3,'#a0d0e8');q(x+8,y-4,3,2,'#c0e8f8');}
      break;
    case'crystal':
      if(h3>.5){q(x+5,y-6,2,6,'#c8a0f0');q(x+4,y-8,4,3,'#e0c8ff');}
      break;
    case'icicle':
      if(h3>.4){q(x+6,y-6,2,6,'#c0e8f8');}
      break;
    case'trash':
      if(h3>.5&&h3<.8){q(x+6,y-3,5,3,'#2a2a30');q(x+7,y-4,3,1,'#3a3a44');q(x-9,y-1,3,1,'#f0f0e0');q(x+11,y,2,1,'#e0d8a0');}
      else if(h3>=.8){q(x-9,y-3,4,3,'#a0a8b0');q(x-9,y-4,4,1,'#c8d0d8');q(x+7,y-1,3,2,'#c04040');}     // lata caida e embalagem
      else if(h3<.25){q(x-3,y-14,6,2,'#6a7a6a');}                                                         // tampa aberta
      break;
    case'cone':
      if(h3>.4&&h3<=.7){q(x-2,y-12,4,1,'#f4f4f0');q(x-2,y-13,4,1,'#e08a20');}
      break;
    case'papers':
      if(h3>.5){q(x-7,y-2,5,2,'#f4f4e4');q(x+5,y-3,4,3,'#e8e0c0');}
      break;
    case'crate':
      if(h3>.6&&h3<.85){q(x+7,y-6,7,6,'#7a5a2a');q(x+7,y-6,7,1,'#9a7a4a');q(x+7,y-3,7,1,'#5a4a2a');}
      else if(h3>=.85){q(x-5,y-13,10,3,'#7a5a2a');q(x-5,y-13,10,1,'#9a7a4a');}                            // caixote empilhado
      else if(h3<.25){q(x-5,y-9,10,2,'#3a2a14');q(x-2,y-10,4,1,'#c8b070');}                                // tampa solta
      break;
    case'stump':
      if(h3>.5){q(x-3,y-8,2,2,'#c04040');q(x-3,y-9,1,1,'#fff');q(x+2,y-7,2,2,'#e0e0d0');}
      break;
    case'log':
      if(h3>.5){q(x-6,y-6,6,1,'#4a8a3a');q(x+1,y-6,3,1,'#5a9a4a');}
      break;
    case'bone':
      if(h3>.5){q(x-3,y-6,6,2,'#e8e0d0');q(x-3,y-7,2,3,'#e8e0d0');q(x+2,y-7,2,3,'#e8e0d0');}
      break;
    default:break;
  }
};
})();
