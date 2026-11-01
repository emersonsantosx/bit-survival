/* ============ RENDER ============ */
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
/* ===== Skins: 4 masculinas (1ª é a padrão) e 4 femininas. alt = cor da roupa quando duas pessoas usam a mesma skin =====
   os = roupa, hs = cabelo/chapéu, hat/band = cor de boné, faixa ou presilha, acc = acessório, beard = barba */
const SKINS=[
  {skin:'#e8b890',hair:'#0c0a09',shirt:'#3a5a8a',alt:'#8a3a3a',pants:'#3a3a48',f:false,os:'jacket',hs:'short',boot:'#241c16'},
  {skin:'#b9855a',hair:'#2a1d14',shirt:'#5a7a4a',alt:'#c08a3a',pants:'#4a4a34',f:false,os:'hoodie',hs:'cap',hat:'#8a3a2a',acc:'pack',pack:'#6a5a3a',boot:'#2a2418'},
  {skin:'#f0c8a0',hair:'#e0c060',shirt:'#4a7a7a',alt:'#8a5a9a',pants:'#3a4a6a',f:false,os:'tee',hs:'spiky',band:'#c04a3a',boot:'#e0dcd0'},
  {skin:'#6a4530',hair:'#1a1210',shirt:'#c9853a',alt:'#3a6a9a',pants:'#34343a',f:false,os:'vest',under:'#d8d4c8',hs:'afro',beard:true,boot:'#2a2018'},
  {skin:'#f0c4a0',hair:'#0c0a09',shirt:'#a8486a',alt:'#4a8a9a',pants:'#3a4a6a',f:true,os:'sweater',hs:'long',slv:.85,boot:'#3a2a20'},
  {skin:'#b9855a',hair:'#2a1d14',shirt:'#3a8a7a',alt:'#d0803a',pants:'#4a3a2a',f:true,os:'jacket',hs:'pony',acc:'pack',pack:'#5a4a3a',boot:'#241c16'},
  {skin:'#f2cfae',hair:'#e6c66a',shirt:'#6a4aa0',alt:'#4a9a5a',pants:'#3a3a58',f:true,os:'dress',hs:'pig',hat:'#e8d0e0',boot:'#3a2a30'},
  {skin:'#6a4530',hair:'#1a1210',shirt:'#d4a24a',alt:'#c04a5a',pants:'#2a2a30',f:true,os:'tee',hs:'buns',band:'#c04a5a',boot:'#e0dcd0'}
];
let SKIN_SEL=0;
try{const v=parseInt(localStorage.getItem('minisurv_skin'),10);if(v>=0&&v<SKINS.length)SKIN_SEL=v;}catch(e){}
function skinLook(i,alt){
  const s=SKINS[(i>=0&&i<SKINS.length)?i:0];
  return {skin:s.skin,hair:s.hair,shirt:alt?s.alt:s.shirt,pants:s.pants,female:s.f,os:s.os,hs:s.hs,slv:s.slv,bow:s.bow,hat:s.hat,band:s.band,acc:s.acc,pack:s.pack,under:s.under,beard:s.beard,boot:s.boot,bag:false};
}
/* Mapa da neve: todas as skins nascem agasalhadas (casaco, gorro com pompom e luvas); cores derivadas da propria skin.
   Só visual: a roupa não protege do frio (o antigo item Casaco Polar foi removido). */
function snowOutfit(lk,i){
  if(selectedMap!=='snow')return lk;
  const s=SKINS[(i>=0&&i<SKINS.length)?i:0],hatC=s.alt||'#8a3a3a';
  if(lk.os!=='robe')lk.os='parka';
  if(!(lk.hs==='long'||lk.hs==='pony'||lk.hs==='pig'))lk.hs='short';   // tira bonés e cabelos volumosos que não cabem sob o gorro
  lk.band=undefined;lk.beanie=hatC;lk.glove=Sh(hatC,-.3);lk.slv=.6;
  if(lk.female||lk.pants===lk.skin)lk.pants='#3a3a48';                  // calça quente no lugar de saia ou short
  return lk;
}
/* Regra da skin repetida: quem entrou como CONVIDADO usa a cor alternativa (os dois lados calculam igual) */
function myLook(){
  let alt=false;
  if(MP.active&&!MP.isHost){for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.skin===SKIN_SEL){alt=true;break;}}}
  const lk=skinLook(SKIN_SEL,alt);lk.bag=!!(P&&P.pack);return snowOutfit(lk,SKIN_SEL);
}
function remoteLook(rp){
  const lk=skinLook(rp.skin|0,!rp.isHost&&(rp.skin|0)===SKIN_SEL);lk.bag=!!rp.pk;return snowOutfit(lk,rp.skin|0);
}
function drawSkinPreview(cv,i){
  const c=cv.getContext('2d'),o=skinLook(i,false);
  c.clearRect(0,0,cv.width,cv.height);
  const Rr=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x+8,y+21,w,h);};
  humanBody(Rr,o,Math.PI/2);
}
/* clareia (k>0) ou escurece (k<0) uma cor #rrggbb, com cache */
const _shc={};
function Sh(c,k){
  const key=c+k;let r=_shc[key];if(r)return r;
  if(typeof c!=='string'||c.length!==7)return c;
  const n=parseInt(c.slice(1),16),f=k>=0?(v=>Math.round(v+(255-v)*k)):(v=>Math.round(v*(1+k)));
  return _shc[key]='#'+((1<<24)|(f(n>>16)<<16)|(f((n>>8)&255)<<8)|f(n&255)).toString(16).slice(1);
}
/* Estilo de cada zumbi (roupa, cabelo, calça). O comum tem 5 variantes pelo índice si, que já vai no snapshot */
const ZS_COMMON=[
  {os:'tee',hs:'hard',pants:'#3a3a2a',hair:'#2a2218',boot:'#2a2018'},      // operário com capacete rachado
  {os:'suit',hs:'short',pants:'#2a2a3a',hair:'#3a3028',boot:'#16161a'},    // executivo de gravata
  {os:'gown',hs:'bald',pants:null,hair:'#3a3a30',boot:null},               // paciente de avental, descalço
  {os:'camo',hs:'helm',pants:'#3a4a30',hair:'#2a2218',boot:'#2a2418'},     // soldado
  {os:'hoodie',hs:'hood',pants:'#34405a',hair:'#2a2218',boot:'#2a2a30'}    // capuz
];
const ZSTYLE={
  1:{os:'tank',hs:'band',band:'#9a2a2a',pants:'#5a5a4a',shorts:true,hair:'#3a3028',boot:'#d0ccc0'},
  2:{os:'brute',hs:'mask',pants:'#2a2a2e',hair:'#222',boot:'#18181a'},
  3:{os:'coat',hs:'bald',pants:'#3a1a1a',hair:'#222',boot:'#1a1010'},
  4:{os:'hazmat',hs:'hazhood',pants:'#c8b830',hair:'#222',boot:'#2a4a20'},
  5:{os:'tee',hs:'short',pants:'#3a3a2a',hair:'#2a2218',boot:'#2a2018'},
  6:{os:'dress',hs:'wild',pants:null,hair:'#d8d4cc',boot:null},
  7:{os:'bloat',hs:'bald',pants:'#2a3a20',hair:'#222',boot:'#1a1a14'},
  8:{os:'bare',hs:'mohawk',pants:'#4a1a1a',hair:'#a0201a',boot:'#1a1010'},
  9:{os:'fur',hs:'bald',pants:'#e6edf3',hair:'#f4f8fb',boot:'#e6edf3'}
};
const ZEYE=[ '#f0e060','#f0e060',null,'#ff4040','#b0ff70','#f0e060','#ffffff','#d8e870','#ff3030','#ff3030' ];
/* Zumbis exclusivos de cada mapa: a cidade mantém os moradores (operário, executivo, paciente, soldado, capuz);
   floresta, neve e deserto ganham gente que combina com o lugar. Cores de pele e roupa em fl/sh, estilos em common/kinds. */
const ZMAP={
  forest:{
    fl:['#6a8a4a','#728f52','#5f8548','#7a9250','#668a56'],
    sh:['#a83a2a','#d8741a','#4a6a3a','#3a6a8a','#8a8a4a'],
    common:[
      {os:'flannel',hs:'beanie',hat:'#a8402a',pants:'#3a4a5a',hair:'#3a2a18',boot:'#3a2a1a',patch:'#4a7a3a'},                 // lenhador
      {os:'vest',hs:'cap',hat:'#4a5a2a',under:'#4a5a38',pants:'#4a5a38',hair:'#2a2218',boot:'#2a2418',patch:'#4a7a3a'},       // caçador de colete laranja
      {os:'jacket',hs:'ranger',hat:'#5a6a3a',pants:'#4a4a38',hair:'#2a2218',boot:'#2a2018',patch:'#4a7a3a'},                  // guarda florestal
      {os:'jacket',hs:'bucket',hat:'#8a8a5a',pants:'#6a5a3a',shorts:true,acc:'pack',pack:'#b05a2a',hair:'#3a2a18',boot:'#4a3a28',patch:'#4a7a3a'}, // trilheiro de mochila
      {os:'vest',hs:'bucket',hat:'#c8b870',under:'#c8c0a0',pants:'#3a4a2a',hair:'#3a3028',boot:'#2a3a20',patch:'#4a7a3a'}      // pescador
    ],
    look:{1:['#8aa060','#6a9a50'],2:['#7a5a3a','#3a3a1a'],3:['#4a6a2a','#6a3a1a'],5:['#5a7a4a','#4a5a2a'],6:['#a8b090','#5a6a3a'],7:['#4a7a38','#5a5a2a'],8:['#a85a3a','#3a2a10']},
    kinds:{1:{os:'flannel',hs:'band',band:'#e0701a',pants:'#3a4a5a',hair:'#3a2a18',boot:'#3a2a1a',patch:'#4a7a3a'}}
  },
  snow:{
    fl:['#a8c0d0','#9ab4c8','#b0c4d4','#98b0c0','#a4bccc'],
    sh:['#c04a3a','#3a5a9a','#8a4a3a','#3a9aa8','#e0e4e8'],
    common:[
      {os:'jacket',hs:'beanie',hat:'#c04a3a',goggles:true,pants:'#2a3a5a',hair:'#3a3028',boot:'#2a2a30',patch:'#dff0fa'},     // esquiador
      {os:'parka',hs:'hoodfur',pants:'#3a3a44',hair:'#2a2218',boot:'#2a2a30',patch:'#dff0fa'},                                 // montanhista de parka
      {os:'sweater',hs:'ushanka',hat:'#6a5a4a',pants:'#4a4a50',hair:'#3a3028',boot:'#2a2018',patch:'#dff0fa'},                  // nórdico de ushanka
      {os:'hoodie',hs:'beanie',hat:'#3a9aa8',pants:'#2a2a30',hair:'#2a2218',boot:'#e0dcd0',patch:'#dff0fa'},                    // snowboarder
      {os:'parka',hs:'hoodfur',pants:'#d8dce0',hair:'#cfd6dc',boot:'#8a8a90',patch:'#dff0fa'}                                   // caçador camuflado de branco
    ],
    look:{1:['#a8c8d8','#c04a3a'],2:['#8a98a8','#3a4a5a'],3:['#7a98b0','#dfe8f0'],5:['#8aa8b8','#4a5a6a'],6:['#c8d4dc','#6a7a9a'],7:['#7a9ab0','#5a6a7a'],8:['#c07a6a','#3a4a6a']},
    kinds:{1:{os:'jacket',hs:'beanie',hat:'#c04a3a',pants:'#2a3a5a',hair:'#3a3028',boot:'#2a2a30',patch:'#dff0fa'},
           8:{os:'parka',hs:'hoodfur',pants:'#3a2a2a',hair:'#a0201a',boot:'#1a1010',patch:'#dff0fa'}}
  },
  desert:{
    fl:['#b89a6a','#a88a5a','#c0a478','#b08c5c','#a48458'],
    sh:['#d8c8a0','#4a6a8a','#e0805a','#d8cfae','#8a5a2a'],
    common:[
      {os:'robe',hs:'turban',hat:'#e8e0c8',veil:true,sash:'#a03a2a',pants:'#8a7a5a',hair:'#222',boot:'#5a4a30',patch:'#d8c090'},   // beduíno de turbante
      {os:'overalls',hs:'strawhat',hat:'#d8c070',band:'#a03a2a',under:'#c8b890',pants:'#4a6a8a',hair:'#3a2a18',boot:'#4a3a28',patch:'#d8c090'}, // garimpeiro
      {os:'hawaii',hs:'strawhat',hat:'#e8d890',band:'#3a8a7a',pants:'#d8c898',shorts:true,hair:'#3a2a18',boot:'#d0c8b0',patch:'#d8c090'},   // turista
      {os:'wrap',hs:'wraphead',pants:'#d8cfae',hair:'#3a3028',boot:'#d8cfae',patch:'#d8c090'},                                      // múmia enfaixada
      {os:'overalls',hs:'minehat',under:'#6a6a6a',pants:'#5a4a3a',hair:'#222',boot:'#2a2018',patch:'#d8c090'}                       // mineiro de capacete
    ],
    look:{1:['#c0a478','#d8d0b8'],2:['#a07a50','#4a2a1a'],3:['#9a8a5a','#a02020'],5:['#a88a5a','#6a5a3a'],6:['#d0b898','#8a4a3a'],7:['#8a8a4a','#6a5a2a'],8:['#c07a50','#5a2a1a']},
    kinds:{1:{os:'tank',hs:'turban',hat:'#d8d0b8',veil:true,pants:'#8a7a5a',hair:'#222',boot:'#5a4a30',patch:'#d8c090'},
           3:{os:'robe',hs:'turban',hat:'#a02020',sash:'#e0c040',pants:null,hair:'#222',boot:'#3a2a1a',patch:'#d8c090'}}
  }
};
function zstyle(kind,zv){
  const M=ZMAP[selectedMap];
  if(M){if(kind===0)return M.common[zv%5];if(M.kinds[kind])return M.kinds[kind];}
  return kind===0?ZS_COMMON[zv%5]:(ZSTYLE[kind]||ZS_COMMON[0]);
}
/* Corpo inteiro SEM mãos e armas (R = função de retângulo; o menu de skins usa a mesma função) */
function humanBody(R,o,face){
  const fx=Math.cos(face),fy=Math.sin(face);
  const z=!!o.zombie,kind=o.kind|0,zv=o.zv|0;
  const S=z?zstyle(kind,zv):o;
  const back=fy<-.5,front=fy>.2,ex=fx>.45?1:(fx<-.45?-1:0);
  const eL=ex>0?0:(ex<0?-3:-2),eR=ex>0?2:(ex<0?-1:1);
  const sbn=h=>{if(ex>=0)R(-3,-13,1,h,hair);if(ex<=0)R(2,-13,1,h,hair);}; // costeleta só do lado de trás do rosto
  const step=o.moving?Math.sin(o.anim):0;
  const l1=step>.3?-1:0,l2=step<-.3?-1:0;
  const skin=o.skin,shirt=o.shirt,hair=S.hair||o.hair||'#222';
  const pants=S.pants||skin,boot=S.boot===null?skin:(S.boot||'#241c16');
  const os=S.os||'tee',hs=S.hs||'short';
  const sd=Sh(shirt,-.25),sl=Sh(shirt,.25);
  // pernas e botas
  if(S.shorts){R(-4,-2+l1,3,2,pants);R(1,-2+l2,3,2,pants);R(-4,0+l1,3,3,skin);R(1,0+l2,3,3,skin);}
  else if(os==='dress'||os==='gown'){R(-4,-2+l1,3,5,skin);R(1,-2+l2,3,5,skin);}
  else{R(-4,-2+l1,3,5,pants);R(1,-2+l2,3,5,pants);}
  R(-4,1+l1,3,2,boot);R(1,1+l2,3,2,boot);
  if(z&&kind===0&&S.os==='gown'){R(-4,-1+l1,3,1,'#e8e4d8');}                 // bandagem na perna do paciente
  // mochila (de lado/frente aparece atrás; de costas cobre as costas)
  if(S.acc==='pack'&&!back){R(-5,-8,1,5,S.pack);R(4,-8,1,5,S.pack);}
  // mochila craftada/encontrada (P.pack): de lado fica atras do tronco, de frente so aparecem as bordas, de costas cobre as costas
  const bagOn=!!o.bag&&!z&&S.acc!=='pack',bagC='#7a5a34',bagS='#3a2a1a';
  if(bagOn&&!back){
    if(ex!==0){const bx=ex>0?-7:4;R(bx,-10,3,8,bagC);R(bx,-10,3,1,Sh(bagC,.25));R(bx,-5,3,2,Sh(bagC,-.25));R(bx+(ex>0?0:2),-9,1,6,Sh(bagC,-.3));}
    else{R(-5,-9,1,6,bagC);R(4,-9,1,6,bagC);R(-5,-9,1,1,Sh(bagC,.25));R(4,-9,1,1,Sh(bagC,.25));}
  }
  // tronco
  switch(os){
    case 'jacket':
      R(-4,-9,8,8,shirt);
      if(back){R(-3,-8,6,1,sl);R(-4,-2,8,1,sd);}
      else{R(0,-8,1,7,sd);R(-2,-9,4,1,sl);R(-3,-4,2,1,sd);R(1,-4,2,1,sd);R(-4,-2,8,1,sd);}
      break;
    case 'hoodie':
      R(-4,-9,8,8,shirt);R(-3,-10,6,2,sd);
      if(back)R(-3,-9,6,3,sd);else{R(-2,-4,4,2,sd);R(-1,-8,1,3,'#e8e4d8');R(1,-8,1,3,'#e8e4d8');}
      break;
    case 'vest':
      R(-4,-9,8,8,S.under||'#d8d4c8');R(-4,-9,3,8,shirt);R(1,-9,3,8,shirt);R(-4,-5,8,1,'#e8e8a0');
      if(back){R(-4,-9,8,8,shirt);R(-4,-5,8,1,'#e8e8a0');R(-1,-9,2,8,sd);}
      break;
    case 'sweater':
      R(-4,-9,8,8,shirt);R(-2,-9,4,1,sl);R(-4,-2,8,1,sd);R(-4,-3,8,1,sl);
      if(!back){R(-3,-7,1,4,sd);R(2,-7,1,4,sd);R(-1,-6,2,2,sl);}
      R(-4,-2,8,1,'#2a2018');R(0,-2,1,1,'#c9a03a');
      break;
    case 'tank':
      R(-4,-9,8,8,shirt);R(-4,-9,2,2,skin);R(2,-9,2,2,skin);R(-1,-9,2,1,skin);R(-4,-3,8,1,sd);
      break;
    case 'dress':
      R(-4,-9,8,8,shirt);R(-5,-3,10,4,shirt);R(-5,0,10,1,sd);R(-4,-4,8,1,sl);R(-1,-9,2,1,skin);
      if(z){R(-4,-8,2,3,skin);R(2,-1,3,2,skin);R(-5,0,2,1,skin);}
      break;
    case 'suit':
      R(-4,-9,8,8,shirt);R(-4,-9,2,8,sd);R(2,-9,2,8,sd);
      if(!back){R(-1,-9,2,3,'#d8d8dc');R(0,-7,1,6,'#7a1a1a');R(-1,-7,1,1,'#7a1a1a');}
      R(-4,-2,8,1,'#1a1a22');
      break;
    case 'gown':
      R(-4,-9,8,9,shirt);R(-4,0,8,1,sd);
      if(back){R(0,-9,1,9,sd);R(-1,-6,3,1,sl);}else{R(-1,-9,2,1,skin);R(-4,-9,1,2,sd);}
      break;
    case 'camo':
      R(-4,-9,8,8,shirt);R(-3,-8,2,2,'#2a3a2a');R(1,-6,3,2,'#566a44');R(-4,-4,3,2,'#566a44');R(0,-3,3,2,'#2a3a2a');
      if(!back){R(-4,-9,1,8,'#2a2a22');R(3,-9,1,8,'#2a2a22');R(-2,-5,2,2,'#4a4a3a');}
      R(-4,-2,8,1,'#2a2418');
      break;
    case 'brute':
      R(-4,-9,8,8,shirt);R(-5,-10,2,2,'#8a8a90');R(3,-10,2,2,'#8a8a90');R(-5,-11,1,1,'#b8b8c0');R(4,-11,1,1,'#b8b8c0');
      R(-4,-5,8,2,'#5a3a20');R(-1,-5,2,2,'#c0b040');R(-4,-9,2,8,Sh(shirt,.15));
      break;
    case 'coat':
      R(-4,-9,8,8,shirt);R(-5,-9,1,10,'#7a1010');R(4,-9,1,10,'#7a1010');R(-5,-10,2,2,'#ffe040');R(3,-10,2,2,'#ffe040');
      if(!back){R(-3,-9,6,1,'#7a1010');R(-1,-8,1,7,'#7a1010');R(-3,-7,1,1,'#ffe040');R(2,-6,1,1,'#ffe040');R(-3,-5,1,1,'#ffe040');}
      R(-4,-2,8,1,'#2a1010');
      break;
    case 'hazmat':
      R(-4,-9,8,8,shirt);R(-4,-5,8,1,Sh(shirt,-.3));R(-3,-8,2,1,'#2a2a2a');
      if(!back){R(0,-9,1,8,Sh(shirt,-.3));R(-2,-4,1,2,'#7aff50');R(2,-7,1,1,'#7aff50');}
      R(-4,-1,8,1,'#8a7a20');
      break;
    case 'bloat':
      R(-5,-10,10,10,shirt);R(-5,-4,10,2,Sh(shirt,-.3));
      if(!back){R(-3,-5,6,3,'#5a8a40');R(-2,-4,2,1,'#2a4a20');R(1,-5,2,2,'#9ad060');R(-4,-8,2,2,'#9ad060');R(2,-9,2,1,'#9ad060');}
      break;
    case 'bare':
      R(-4,-9,8,8,skin);R(-4,-6,8,2,'#d8d0b8');R(-4,-3,8,1,'#d8d0b8');R(-4,-8,1,3,Sh(skin,-.3));R(2,-7,1,2,Sh(skin,-.3));R(-4,-9,8,1,'#2a1a1a');
      if(!back){R(-3,-9,1,1,'#aaa');R(2,-9,1,1,'#aaa');}
      break;
    case 'fur':
      R(-4,-9,8,8,shirt);R(-5,-8,1,3,'#fff');R(4,-6,1,3,'#fff');R(-2,-3,4,2,'#cfdde8');
      break;
    case 'flannel':
      R(-4,-9,8,8,shirt);R(-3,-9,1,8,sd);R(0,-9,1,8,sd);R(3,-9,1,8,sd);R(-4,-7,8,1,sd);R(-4,-4,8,1,sd);R(-1,-9,2,1,skin);R(-4,-2,8,1,'#2a2018');R(0,-2,1,1,'#c9a03a');
      break;
    case 'parka':
      R(-5,-9,10,9,shirt);R(-5,-6,10,1,sd);R(-5,-3,10,1,sd);R(-5,0,10,1,'#e8e4d8');R(-4,-10,8,2,'#e8e4d8');
      if(!back)R(0,-8,1,8,Sh(shirt,-.35));
      break;
    case 'robe':
      R(-4,-9,8,8,shirt);R(-5,-1,10,2,shirt);R(-5,0,10,1,sd);R(-4,-5,8,1,S.sash||sd);R(-1,-9,2,1,skin);if(!back)R(0,-8,1,3,sd);
      break;
    case 'overalls':
      R(-4,-9,8,8,S.under||'#c8b890');R(-4,-5,8,4,shirt);R(-3,-9,1,4,shirt);R(2,-9,1,4,shirt);
      if(!back){R(-3,-5,1,1,'#d0b030');R(2,-5,1,1,'#d0b030');}
      break;
    case 'hawaii':
      R(-4,-9,8,8,shirt);R(-3,-8,1,1,'#f0e0e0');R(0,-7,1,1,'#f0d050');R(2,-5,1,1,'#f0e0e0');R(-3,-4,1,1,'#f0d050');R(1,-3,1,1,'#f0e0e0');R(-1,-9,2,1,skin);
      break;
    case 'wrap':
      R(-4,-9,8,8,'#d8cfae');for(let i=0;i<4;i++)R(-4,-8+i*2,8,1,'#b8ae8c');R(2,-3,2,3,'#d8cfae');R(3,-1,1,2,'#b8ae8c');
      break;
    default: // tee
      R(-4,-9,8,8,shirt);R(-4,-6,8,1,sl);R(-1,-9,2,1,skin);R(-4,-2,8,1,'#2a2018');
  }
  if(bagOn){
    if(back){R(-3,-10,6,8,bagC);R(-3,-10,6,1,Sh(bagC,.25));R(-2,-5,4,2,Sh(bagC,-.25));R(-3,-3,6,1,Sh(bagC,-.3));R(-4,-8,1,5,bagS);R(3,-8,1,5,bagS);R(-1,-8,2,1,bagS);}
    else if(ex!==0){R(ex>0?-2:1,-9,1,4,bagS);}                // alca no ombro
    else{R(-3,-9,1,5,bagS);R(2,-9,1,5,bagS);}                  // alcas no peito
  }
  // mochila de costas
  if(S.acc==='pack'&&back){R(-3,-9,6,7,S.pack);R(-3,-9,6,1,Sh(S.pack,.25));R(-2,-4,4,2,Sh(S.pack,-.25));R(-4,-8,1,4,Sh(S.pack,-.3));R(3,-8,1,4,Sh(S.pack,-.3));}
  else if(S.acc==='pack'){R(-3,-9,1,5,Sh(S.pack,-.2));R(2,-9,1,5,Sh(S.pack,-.2));}
  // cabeça
  R(-3,-15,6,6,skin);
  if(z&&hs!=='mask'&&hs!=='hazhood'){R(-3,-10,6,1,Sh(skin,-.18));}
  // cabelo / chapéu (parte de trás e de baixo, antes do rosto)
  switch(hs){
    case 'long':R(-3,-16,6,1,hair);if(back||ex>=0)R(-4,-16,1,8,hair);if(back||ex<=0)R(3,-16,1,8,hair);if(back)R(-4,-16,8,9,hair);break; // de lado, o cabelo cai só atrás e o olho da frente não some no preto
    case 'wild':R(-4,-16,8,1,hair);R(-4,-15,1,8,hair);R(3,-15,1,9,hair);R(-5,-10,1,3,hair);R(4,-9,1,3,hair);R(-5,-14,1,2,hair);if(back)R(-4,-16,8,10,hair);break;
    case 'pig':R(-5,-13,2,5,hair);R(3,-13,2,5,hair);R(-5,-13,2,1,S.hat||'#e8d0e0');R(3,-13,2,1,S.hat||'#e8d0e0');break;
    case 'pony':
      if(back)R(-1,-10,2,6,hair);else if(Math.abs(fx)>.5)R(Math.round(-fx*5)-1,-14,2,5,hair);else R(-4,-13,1,3,hair);break;
  }
  // rosto
  if(!back){
    if(z){
      const ec=ZEYE[kind]||'#f0e060';
      if(hs==='mask'){/* viseira desenhada abaixo */}
      else{const so=ex>0?[-1,1]:(ex<0?[-3,-1]:[-3,1]);R(so[0],-12,2,2,'#1a1410');R(so[1],-12,2,2,'#1a1410');R(eL,-12,1,1,ec);R(eR,-12,1,1,ec);
        if(front&&kind!==4)R(-1,-10,2,1,kind===6?'#400':'#7a1010');}
    }else{
      R(eL,-12,1,1,'#111');R(eR,-12,1,1,'#111');
      if(S.beard){R(-3,-11,6,2,hair);R(-1,-11,2,1,skin);}
    }
  }
  // cabelo / chapéu (camada da frente)
  switch(hs){
    case 'short':
      if(back)R(-3,-15,6,5,hair);else{R(-3,-15,6,2,hair);sbn(1);}break;
    case 'spiky':
      R(-3,-15,6,back?5:2,hair);R(-3,-17,1,2,hair);R(-1,-18,1,3,hair);R(1,-17,1,2,hair);R(2,-16,1,1,hair);
      if(!back)sbn(1);break;
    case 'afro':
      if(back)R(-4,-17,8,8,hair);else{R(-4,-17,8,4,hair);R(-4,-13,1,2,hair);R(3,-13,1,2,hair);}
      R(-3,-18,6,1,hair);break;
    case 'cap':{
      const hat=S.hat||'#8a3a2a';
      R(-3,-16,6,3,hat);R(-3,-17,6,1,Sh(hat,.2));
      if(back)R(-3,-13,6,3,hair);
      else{sbn(1);const bx=Math.round(fx*3),by=Math.round(fy*2)-13;R(bx-2,by,4,1,Sh(hat,-.35));}
      break;}
    case 'long':
      R(-3,-15,6,2,hair);
      if(!back){   // de lado a franja cai so do lado de tras: assim o olho de la nao se funde ao cabelo preto e o rosto mostra os dois olhos
        if(ex===0){R(-3,-13,2,1,hair);R(1,-13,2,1,hair);}else if(ex>0)R(-3,-13,2,1,hair);else R(1,-13,2,1,hair);
      }
      if(S.bow&&!back){R(2,-16,3,2,S.bow);R(3,-17,1,1,S.bow);R(3,-15,1,1,Sh(S.bow,-.25));}
      break;
    case 'pony':
      R(-3,-16,6,1,hair);R(-3,-15,6,back?5:2,hair);if(!back)sbn(1);break;
    case 'buns':
      R(-3,-15,6,back?5:2,hair);R(-4,-17,2,2,hair);R(2,-17,2,2,hair);if(!back)sbn(1);break;
    case 'pig':
      R(-3,-15,6,back?5:2,hair);if(!back)sbn(1);break;
    case 'band':
      R(-3,-15,6,back?5:2,hair);break;
    case 'bald':
      if(z&&kind===0)R(-3,-15,6,1,hair);if(z&&kind===0){R(-2,-14,2,1,'#e8e4d8');R(0,-13,3,1,'#e8e4d8');} break;
    case 'hard':
      R(-4,-17,8,3,'#c8a820');R(-3,-18,6,1,'#d8b830');R(-4,-14,8,1,'#8a7018');R(-1,-17,2,3,'#a88a18');R(1,-16,1,2,'#3a2a08');
      if(!back)sbn(1);break;
    case 'helm':
      R(-4,-17,8,4,'#4a5a3a');R(-3,-18,6,1,'#566a44');R(-4,-13,8,1,'#2a3a22');R(-2,-16,2,1,'#2a3a22');R(1,-15,2,1,'#6a7a54');
      if(!back){R(-4,-12,1,3,'#2a3a22');R(3,-12,1,3,'#2a3a22');}break;
    case 'hood':{
      const hc=Sh(shirt,-.1);
      if(back)R(-4,-17,8,8,hc);else{R(-4,-17,8,2,hc);R(-4,-15,2,3,hc);R(-4,-12,1,3,hc);R(2,-15,2,3,hc);R(3,-12,1,3,hc);R(-2,-15,4,2,Sh(skin,-.4));}
      break;}
    case 'mohawk':
      R(-1,-19,2,5,hair);R(-1,-14,2,back?5:1,hair);R(0,-20,1,1,hair);if(!back){R(-3,-15,6,1,Sh(skin,-.25));}break;
    case 'mask':
      R(-4,-16,8,7,back?'#3a3a40':'#4a4a50');R(-4,-16,8,1,'#6a6a70');
      if(!back){R(-3,-13,6,2,'#1a1a1a');R(-3,-13,6,1,'#e07a20');R(-1,-12,2,1,'#ffc060');R(-4,-9,2,1,'#6a6a70');R(2,-9,2,1,'#6a6a70');}break;
    case 'hazhood':
      R(-4,-16,8,3,'#c8b830');R(-4,-13,1,5,'#c8b830');R(3,-13,1,5,'#c8b830');R(-3,-17,6,1,'#c8b830');
      if(!back){R(-3,-12,2,2,'#1a1410');R(1,-12,2,2,'#1a1410');R(-2,-12,1,1,'#b0ff70');R(1,-12,1,1,'#b0ff70');R(-2,-10,4,2,'#2a2a2a');R(2,-10,2,2,'#555');R(-1,-10,1,1,'#7a7a7a');R(0,-14,1,1,'#b0ff70');R(-2,-13,1,1,'#7aff50');}
      else R(-4,-16,8,7,'#c8b830');break;
    case 'wild':
      R(-4,-16,8,3,hair);R(-5,-15,1,1,hair);R(4,-14,1,1,hair);if(back)R(-4,-16,8,10,hair);break;
    case 'beanie':{const hat=S.hat||'#a8402a';
      if(back)R(-3,-16,6,6,hat);else{R(-3,-16,6,3,hat);R(-3,-13,6,1,Sh(hat,-.3));sbn(1);}
      R(-1,-18,2,2,Sh(hat,.4));
      if(S.goggles&&!back){R(-3,-12,6,2,'#2a2a2e');R(-3,-12,6,1,'#e0702a');R(-2,-11,2,1,'#9ad8f0');R(1,-11,2,1,'#9ad8f0');}
      break;}
    case 'ushanka':{const hat=S.hat||'#6a5a4a';
      R(-4,-17,8,3,hat);R(-3,-18,6,1,Sh(hat,.2));R(-4,-14,1,4,hat);R(3,-14,1,4,hat);R(-4,-14,8,1,'#d8d0c0');
      if(back)R(-4,-17,8,7,hat);break;}
    case 'hoodfur':{const hc=Sh(shirt,-.1);
      if(back)R(-4,-17,8,8,hc);else{R(-4,-17,8,2,hc);R(-4,-15,2,3,hc);R(-4,-12,1,3,hc);R(2,-15,2,3,hc);R(3,-12,1,3,hc);R(-2,-15,4,2,Sh(skin,-.4));}
      R(-4,-16,8,1,'#e8e4d8');if(!back){R(-4,-15,1,6,'#e8e4d8');R(3,-15,1,6,'#e8e4d8');R(-3,-10,6,1,'#e8e4d8');}
      break;}
    case 'turban':{const hat=S.hat||'#e8e0c8';
      R(-4,-17,8,4,hat);R(-4,-14,8,1,Sh(hat,-.25));R(-3,-16,6,1,Sh(hat,.25));R(-4,-15,8,1,Sh(hat,-.12));R(2,-18,2,2,hat);
      if(back)R(-4,-17,8,8,hat);else if(S.veil)R(-3,-11,6,2,hat);
      break;}
    case 'strawhat':{const hat=S.hat||'#d8c070';
      R(-6,-15,12,2,hat);R(-3,-18,6,3,Sh(hat,.1));R(-3,-16,6,1,S.band||'#a03a2a');R(-6,-14,12,1,Sh(hat,-.3));break;}
    case 'ranger':{const hat=S.hat||'#5a6a3a';
      R(-5,-15,10,2,hat);R(-3,-18,6,3,hat);R(-3,-16,6,1,'#c8a840');R(-5,-14,10,1,Sh(hat,-.3));break;}
    case 'bucket':{const hat=S.hat||'#8a8a5a';
      R(-4,-17,8,3,hat);R(-5,-14,10,2,hat);R(-3,-18,6,1,Sh(hat,.2));R(-5,-13,10,1,Sh(hat,-.3));break;}
    case 'minehat':
      R(-4,-17,8,3,'#d8a820');R(-3,-18,6,1,'#e8b830');R(-4,-14,8,1,'#8a6a10');if(!back)R(0,-17,2,2,'#fff6a0');break;
    case 'wraphead':
      R(-3,-16,6,3,'#d8cfae');R(-3,-13,6,1,'#b8ae8c');R(-3,-15,6,1,'#b8ae8c');if(back)R(-3,-16,6,6,'#d8cfae');
      if(!back){R(-3,-11,6,1,'#d8cfae');R(2,-12,2,3,'#d8cfae');}break;
  }
  if(S.band&&hs!=='cap')R(-3,-14,6,1,S.band);
  if(S.band&&hs==='band')R(3,-14,2,2,S.band);
  if(o.beanie&&!z){ // gorro de lã com barra e pompom, sem "pontas" nos cantos (davam cara de bravo); cabelo comprido ainda aparece embaixo
    const hc=o.beanie;
    if(back){R(-4,-18,8,7,hc);R(-4,-11,8,1,'#e8e4d8');}
    else{R(-4,-18,8,3,hc);R(-4,-15,8,1,'#e8e4d8');}
    R(-3,-19,6,1,Sh(hc,.2));R(-1,-21,2,2,'#f4f4f4');
  }
  // detalhes por tipo de zumbi
  if(z){
    if(kind===0||kind===1||kind===5){
      const w=(kind===5?3:zv)|0;
      R(-3+(w*2)%5,-8+(w%3)*2,2,2,'#5a1212');                     // ferida
      if(kind!==1)R(-4+(w%2)*7,-3,1,2,skin);                      // rasgo na roupa
      if(front)R(-2+(w%3),-9,1,2,'#7a1010');                      // sangue no queixo
    }
    if(S.patch&&kind!==9){R(-3+(zv*2)%4,-8+(zv%3)*2,2,1,S.patch);R(1,-4,2,1,S.patch);if(!back)R(-3,-13,1,1,S.patch);}   // musgo, gelo ou areia
    if(kind===3){R(-4,-1,8,1,'#2a1010');R(-4,-6,1,3,Sh(skin,-.2));}
    if(kind===6&&front){R(-1,-10,2,2,'#400');R(-1,-10,2,1,'#fff');}
    if(kind===8&&!back){R(-3,-13,1,3,'#601010');R(2,-12,1,2,'#601010');}   // pintura de guerra
    if(kind===9){R(-7,-6,2,3,'#f4f8fb');R(5,-7,2,3,'#f4f8fb');R(-3,-13,6,1,'#c8dcec');R(-5,-13,10,1,'#c8dcec');}
  }
}
/* armas nas maos: usam os mesmos icones pixel art do inventario, giradas na direcao da mira */
const HELD={
  pistol:{ax:2,ay:3,gun:1,s:.8},smg:{ax:3,ay:3,gun:1,s:.88},shotgun:{ax:6,ay:3,gun:1,s:.92},rifle:{ax:5,ay:3,gun:1,s:.92},
  bow:{ax:3,ay:5,off:3},
  bat:{ax:1,ay:9,rot:Math.PI/4},axe:{ax:4,ay:9,rot:Math.PI/4},pickaxe:{ax:2,ay:9,rot:Math.PI/4},
  hoe:{ax:1,ay:9,rot:Math.PI/4,s:1.1},katana:{ax:1,ay:9,rot:Math.PI/4,s:1.2},spear:{ax:1,ay:9,rot:Math.PI/4,s:1.5},fishingrod:{ax:1,ay:9,rot:Math.PI/4,s:1.3}
};
/* arma branca (machado, picareta, taco, espada, lanca): olhando para a esquerda o desenho e o balanco sao o ESPELHO do golpe para a direita (antes, para a esquerda a arma ia de baixo para cima e a cabeca ficava de ponta-cabeca) */
function meleeLeft(wpn,face){const H=HELD[wpn];return !!H&&!H.gun&&wpn!=='bow'&&Math.cos(face)<0;}
function swingAngle(o,face){
  if(!(o.swing>0))return face;
  const d=(o.swing/.18-.5)*2.2;
  return meleeLeft(o.wpn,face)?face-d:face+d;
}
function drawHeld(wpn,hx,hy,a,left){
  const H=HELD[wpn];if(!H)return false;
  const cv=pxCanvas(H.ic||WEAPON_ICON[wpn]||wpn);if(!cv)return false;
  ctx.save();ctx.translate(hx,hy);
  if(left){ctx.scale(-1,1);ctx.rotate(Math.PI-a+(H.rot||0));}
  else ctx.rotate(a+(H.rot||0));
  if(H.gun&&Math.cos(a)<0)ctx.scale(1,-1);
  const sc=H.s||1;ctx.scale(sc,sc);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(cv,(H.off||0)/sc-H.ax,-H.ay);
  ctx.restore();return true;
}
/* braço = um traço reto de 2 px (sem cotovelo): manga na primeira metade, pele na segunda; coordenadas = centros do ombro e da mão */
function armLine(sx,sy,ex,ey,sleeve,skin,fr){
  const dx=ex-sx,dy=ey-sy,len=Math.hypot(dx,dy);
  if(len<.5)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.atan2(dy,dx));
  const h=Math.max(1,Math.round(len*(fr||.5)));
  ctx.fillStyle=sleeve;ctx.fillRect(0,-1,h,2);
  ctx.fillStyle=skin;ctx.fillRect(h,-1,len-h+1,2);
  ctx.restore();
}
function punchHand(h,sw){if(sw>0&&!h._pon)h._ph=(h._ph|0)^1;h._pon=sw>0;return h._ph|0;} // alterna soco direito/esquerdo a cada golpe
const TWO_HAND={pistol:1,rifle:1,shotgun:1,smg:1,bow:1,bat:1,axe:1,pickaxe:1,katana:1,spear:1,fishingrod:1,hoe:1}; // armas de duas mãos
function human(x,y,face,o){
  humanDraw(x,y,face,o);
  let d=lakeDepth(x,y);
  if(d>=.04){if(o.crawler)d*=.4;const k=o.s||1;waterSurface(x,y+(3-3*d)*k,d,k);}
}
function humanDraw(x,y,face,o){
  const fx=Math.cos(face),fy=Math.sin(face);
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  let depth=lakeDepth(x,y);if(depth<.04)depth=0;
  if(depth&&o.crawler)depth*=.4;                              // quem rasteja fica mais por cima
  let scaleM=o.s||1,offsetY=0;
  if(depth){offsetY=depth*9+Math.sin(T*5+x*.07)*.6*depth;}   // afunda até só a cabeça ficar para fora e balança na água
  if(scaleM!==1)ctx.scale(scaleM,scaleM);
  ctx.translate(0,offsetY);
  if(depth){ctx.beginPath();ctx.rect(-40,-80,80,80+(3-depth*12)-0);ctx.clip();}   // corta tudo abaixo da linha d'água (pescoço quando fundo)
  if(o.crawler){
    shadow(0,2,8,3);
    const bx=fx>=0?-1:1,ca=Math.sin(o.anim*0.5);
    R(bx*9,-2,3,3,'#5a1212');R(bx*11,-1,4,1,'#8a2a2a');R(bx*13,0,3,1,'#6a1a1a');           // tronco cortado e rastro
    R(-7,-3,14,5,o.shirt);R(-7,-3,14,1,Sh(o.shirt,-.25));R(-3,-2,2,2,'#5a1212');R(2,0,1,2,o.skin);R(-1,-3,1,4,'#d8d0b8');
    R(-2,-5,5,4,o.skin);R(-2,-5,5,1,o.hair);R(-2,-4,1,1,'#1a1410');R(1,-4,1,1,'#1a1410');R(-1,-2,2,1,'#7a1010');
    R(-9+ca*2,-2,3,3,o.skin);R(6-ca*2,-2,3,3,o.skin);R(-10+ca*2,-1,1,1,'#d8d0b8');R(9-ca*2,-1,1,1,'#d8d0b8');
    ctx.restore();return;
  }
  shadow(0,2,6,3);
  humanBody(R,o,face);
  let hx=Math.round(fx*6),hy=Math.round(fy*4)-5;
  if(o.zombie){
    const px=Math.round(-fy*3),py=Math.round(fx*3);
    const l=o.lunge?3:0;
    const zs=zstyle(o.kind|0,o.zv|0),zsl=(zs.os==='bare'||zs.os==='tank'||zs.os==='dress'||zs.os==='gown')?o.skin:(zs.os==='fur'?'#f4f8fb':o.shirt);
    const sv=Math.abs(fx)>.6,l2=(o.lunge?3:0);
    const sLx=sv?(fx>0?3:-3):-4,sRx=sv?(fx>0?3:-3):4;
    const aLx=sLx+Math.round(fx*(6+l2))+(sv?0:-1),aLy=-6+Math.round(fy*(3+l2))+(sv?-2:0);
    const aRx=sRx+Math.round(fx*(6+l2))+(sv?0:1),aRy=-6+Math.round(fy*(3+l2))+(sv?2:0);
    armLine(sLx,-8,aLx,aLy,zsl,o.skin);armLine(sRx,-8,aRx,aRy,zsl,o.skin);
    R(aLx-1,aLy-1,3,3,o.skin);R(aRx-1,aRy-1,3,3,o.skin);
    R(aLx,aLy,1,1,Sh(o.skin,-.3));R(aRx,aRy,1,1,Sh(o.skin,-.3));
    if(o.spitter)R(hx+fx*2,hy+fy*2-1,3,2,'#40ff40');
    if(o.wind)R(hx+fx*2-2,hy+fy*2-3,6,5,'#b0ff80'); // pré-aviso do cuspe
    if(o.screamer){R(hx+fx*2,hy+fy*2-2,3,3,'#600');R(hx+fx*2,hy+fy*2-1,2,1,'#fff');}
    if(o.brute){ // motosserra: cabo, motor laranja, lâmina com corrente girando
      const hz=Math.abs(fx)>=Math.abs(fy),sg=(hz?fx:fy)>=0?1:-1,vib=Math.sin(T*70)>0?1:0;
      const Q=(u,v,w,h,c)=>{ // u = ao longo da direção, v = de lado (h = espessura)
        if(hz)R(hx+(sg>0?u:-u-w),hy+v+vib-3,w,h,c);else R(hx+v,hy+(sg>0?u:-u-w)-3+vib,h,w,c);};
      const ph=Math.floor(T*14)%3;
      Q(-1,-1,5,4,'#1a1a1e');
      Q(2,-4,9,8,'#e07a20');Q(2,-4,9,2,'#f4a040');Q(2,2,9,2,'#a84a10');
      Q(4,-6,5,2,'#1a1a1e');Q(4,-5,1,2,'#1a1a1e');Q(8,-5,1,2,'#1a1a1e');
      Q(6,-3,3,3,'#f0e0c0');Q(7,-2,1,1,'#222');
      Q(11,-2,3,4,'#7a7e86');
      Q(14,-2,9,4,'#2a2a30');Q(14,-1,9,2,'#b8bcc4');
      for(let u=14+ph;u<23;u+=3){Q(u,-3,1,1,'#d8d8d8');Q(u,2,1,1,'#d8d8d8');}
      Q(23,-1,2,2,'#2a2a30');
    }
    if(o.yeti){R(-6,-10,12,3,'#f4f8fb');R(-5,-15,10,3,'#f4f8fb');R(-4,-3,8,3,'#e6edf3');R(-2,-12,1,1,'#ff3030');R(1,-12,1,1,'#ff3030');R(-2,-10,1,2,'#fff');R(1,-10,1,2,'#fff');R(hx-3,hy+1,2,3,'#f4f8fb');R(hx+2,hy+1,2,3,'#f4f8fb');}
    if(o.boss){R(hx-3,hy-3,7,2,'#ffe040');R(hx-3,hy-5,2,2,'#ffe040');R(hx+2,hy-5,2,2,'#ffe040');R(hx,hy-6,2,3,'#ffe040');}
  }else{
    {
      const sl=(o.os==='tank'||o.os==='bare')?o.skin:o.shirt,sgn=fx>=-.15?1:-1,sv=Math.abs(fx)>.6;
      const gk=o.glove||o.skin;                                         // luvas: a mão usa a cor da luva
      const two=TWO_HAND[o.wpn]&&!o.hold,st=o.moving?Math.round(Math.sin(o.anim)*1.5):0;
      const shR=sv?(fx>0?3:-3):4,shL=sv?shR:-4,sY=-8;                 // centros dos ombros
      const mS=sgn>0?shR:shL,oS=sgn>0?shL:shR;                        // ombro do braço principal / do outro
      if(two){
        // duas mãos no cabo: a de trás no encaixe da arma, a da frente alguns pixels adiante, as duas seguem o balanço do golpe
        const sa=swingAngle(o,face);
        const cx=Math.cos(sa),cy=Math.sin(sa);
        hx=Math.round(cx*5);hy=-6+Math.round(cy*3);
        const gap={bow:2,pistol:2,smg:3,shotgun:5,rifle:5}[o.wpn]||4;
        let ox=hx+Math.round(cx*gap),oy=hy+Math.round(cy*gap*.75);
        if(oy<-11)oy=-11;
        armLine(oS,sY,ox,oy,sl,gk,o.slv);armLine(mS,sY,hx,hy,sl,gk,o.slv);
        R(ox-1,oy-1,2,2,gk);
      } else {
        // uma mão só (punhos, pistola, item): braço principal em direção à mira, o outro solto ao lado, balançando ao andar
        hx=Math.round(fx*(o.female?4:5))+(sv?mS:mS+sgn);hy=-6+Math.round(fy*(o.female?2:3));
        if(o.swing>0&&o.wpn==='fists'&&!o.hold){
          // soco: recua o punho, estica o braço na direção do alvo e volta; a cada golpe troca de mão, a outra fica em guarda
          const p=1-o.swing/.18,ext=p<.3?-.45*(p/.3):Math.sin((p-.3)/.7*Math.PI);
          const pS=o.ph?oS:mS,gS=o.ph?mS:oS;
          const px=Math.round(pS+fx*(5+ext*4))+(sv?0:(o.ph?-sgn:sgn)),py=-6+Math.round(fy*(3+ext*3));
          const gx=gS+Math.round(fx*3),gy=-6+Math.round(fy*2);
          armLine(gS,sY,gx,gy,sl,gk,o.slv);R(gx-1,gy-1,2,2,gk);
          armLine(pS,sY,px,py,sl,gk,o.slv);
          hx=px;hy=py;
          if(ext>.85){R(hx-2,hy-2,4,4,o.skin);R(hx-1,hy-1,2,2,Sh(o.skin,-.15)); // impacto
            const ix=Math.round(hx+fx*4),iy=Math.round(hy+fy*3);R(ix-3,iy-1,1,1,'#fff');R(ix+2,iy-2,1,1,'#fff');R(ix,iy-3,1,1,'#ffe27a');R(ix+1,iy+2,1,1,'#ffe27a');}
        }else{
        armLine(oS,sY,oS,-3+st,sl,gk,o.slv);R(oS-1,-4+st,2,2,gk);
        armLine(mS,sY,hx,hy,sl,gk,o.slv);
        }
      }
    }
    R(hx-1,hy-1,2,2,o.glove||o.skin);
    const a=swingAngle(o,face);
    const wx=Math.cos(a),wy=Math.sin(a);
    drawHeld(o.wpn,hx,hy,a,meleeLeft(o.wpn,face));
    if(o.hold&&ITEMS[o.hold]){const hc=pxCanvas(ITEMS[o.hold].e);if(hc){ctx.imageSmoothingEnabled=false;ctx.drawImage(hc,Math.round(hx+wx*5-hc.width/2),Math.round(hy+wy*4-hc.height/2));}}
    const _fl={pistol:8,smg:10,shotgun:11,rifle:13}[o.wpn];
    if(_fl&&o.flash>0)R(hx+wx*_fl-2,hy+wy*_fl-2,5,4,'#ffe27a');
    if(o.wpn==='bow'&&o.swing>0){ const bx=hx+wx*4, by=hy+wy*4; R(bx+wx*6,by+wy*6-1,8,1,'#c0c0c8'); R(bx+wx*14,by+wy*14-1,2,2,'#a0a0a8'); }
  }
  ctx.restore();
}
function drawRock(r){
  const x=r.x,y=r.y;shadow(x,y+2,8,4);
  const base=selectedMap==='snow'?'#a8b8c8':selectedMap==='desert'?'#c8a878':selectedMap==='city'?'#707880':'#8a8a90';
  const top=selectedMap==='snow'?'#d0dce8':selectedMap==='desert'?'#e0c090':selectedMap==='city'?'#909aa0':'#a8a8b0';
  const k=r.k|0;
  if(k===0){R(x-7,y-6,14,8,base);R(x-6,y-10,12,6,top);R(x-4,y-13,8,4,top);}
  else if(k===1){R(x-6,y-8,12,10,base);R(x-5,y-12,10,6,top);R(x-2,y-14,5,3,top);}
  else if(k===2){R(x-8,y-5,16,7,base);R(x-6,y-8,12,5,top);R(x-3,y-11,6,4,top);}
  else if(k===3){R(x-5,y-7,10,9,base);R(x-4,y-11,8,5,top);R(x+2,y-5,4,4,base);}
  else{R(x-9,y-4,18,6,base);R(x-7,y-7,14,4,top);R(x-5,y-9,10,3,top);R(x+3,y-6,5,5,base);}
  R(x-3,y-4,2,2,'rgba(0,0,0,.25)');R(x+2,y-3,2,2,'rgba(255,255,255,.2)');
  if(selectedMap==='forest' && (k===0||k===1)) R(x-2,y-8,3,2,'#3a6a3a'); // moss
  if(weather==='snow'||selectedMap==='snow')R(x-7,y-7,14,2,'#e8f4f8');
}
/* ============ ÁRVORES ============
   Cada árvore é um sprite pré-desenhado (um por mapa, tipo e variação), bem maior que o personagem (que tem uns 20 px):
   pinheiros e carvalhos chegam a 50 ou 70 px. A variação (0 a 3) vem da semente que a árvore já tinha, então o mundo não muda.
   Quando o jogador passa atrás de uma copa, ela fica meio transparente. */
const TSP={};
function treeSprite(k,v,snow){
  const key=selectedMap+'|'+k+'|'+v+'|'+(snow?1:0);
  if(TSP[key])return TSP[key];
  const map=selectedMap,W=112,HH=112,ox=56,oy=106;
  const cv=document.createElement('canvas');cv.width=W;cv.height=HH;
  const c=cv.getContext('2d'),r=mkRng((k*7+v*13+map.length*29+1)/131);
  let top=0,half=0;
  const px=(x,y,w,h,col)=>{x=Math.round(x);y=Math.round(y);if(w<=0||h<=0)return;c.fillStyle=col;c.fillRect(ox+x,oy+y,w,h);if(-y>top)top=-y;if(Math.abs(x)>half)half=Math.abs(x);if(Math.abs(x+w)>half)half=Math.abs(x+w);};
  const ell=(cx,cy,rx,ry,col)=>{for(let y=-ry;y<=ry;y++){const hf=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry+.01))));px(cx-hf,cy+y,hf*2+1,1,col);}};
  const line=(x0,y0,x1,y1,t,col)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)px(x0+(x1-x0)*i/n-(t>>1),y0+(y1-y0)*i/n-(t>>1),t,t,col);};
  const WH='#f2f8fc',WS='#c8dcec';
  const trunk=(w,h,b,bend)=>{   // tronco afunilado, com raizes na base, veios de casca, nos e leve curvatura
    const bd=bend===undefined?Math.round((r()-.5)*2):bend;
    const cxAt=i=>Math.round(bd*Math.sin(i/h*2.5)*1.2);
    for(let i=0;i<h;i++){
      const fl=i<5?Math.round((5-i)*.4):0,wi=Math.max(2,Math.round(w*(1-.2*i/h))+fl*2);
      const x0=cxAt(i)-(wi>>1),band=Math.max(1,Math.round(wi*.28));
      px(x0,-1-i,wi,1,b[1]);px(x0,-1-i,band,1,b[2]);px(x0+wi-band,-1-i,band,1,b[0]);
    }
    const x00=cxAt(0)-((w+4)>>1);
    px(x00,-1,w+4,1,b[0]);px(x00-1,-1,2,1,b[1]);px(x00+w+3,-1,2,1,b[0]);   // pontas das raizes
    for(let s=0,n=Math.max(2,Math.round(w*h/36));s<n;s++){
      const len=3+Math.floor(r()*5),i=6+Math.floor(r()*Math.max(1,h-6-len)),off=1+Math.floor(r()*Math.max(1,Math.round(w*.8)-2));
      const x=cxAt(i)-(w>>1)+off;px(x,-1-i-len,1,len,b[0]);
      if(r()<.5)px(x-1,-1-i-len+1,1,Math.max(1,len-2),b[2]);
    }
    if(h>=20&&r()<.7){const i=Math.round(h*(.3+r()*.25)),x=cxAt(i)-(w>>1)+1+Math.floor(r()*Math.max(1,w-4));px(x,-1-i,2,2,b[0]);px(x,-2-i,2,1,b[2]);}
  };
  const br=(x0,y0,x1,y1,t,col)=>{const mx=(x0+x1)/2,my=(y0+y1)/2;line(x0,y0,mx,my,t,col);line(mx,my,x1,y1,Math.max(1,t-1),col);};   // galho que afina
  const fol=(cx,cy,rx,ry,p,sn)=>{
    ell(cx+1,cy+2,rx,ry,p[0]);ell(cx,cy,rx,ry,p[1]);
    ell(cx-Math.round(rx*.22),cy-Math.round(ry*.28),Math.max(2,Math.round(rx*.62)),Math.max(2,Math.round(ry*.58)),p[2]);
    for(let i=0,n=Math.round(rx*ry/8);i<n;i++){const a=r()*6.283,d=Math.sqrt(r());px(cx+Math.cos(a)*rx*.85*d,cy+Math.sin(a)*ry*.85*d,2,1,r()<.55?p[3]:p[0]);}
    if(sn){ell(cx-1,cy-Math.round(ry*.5),Math.round(rx*.72),Math.max(2,Math.round(ry*.36)),WH);ell(cx,cy-Math.round(ry*.3),Math.round(rx*.5),Math.max(1,Math.round(ry*.14)),WS);}
  };
  const tier=(cy,hw,h,p,sn)=>{
    for(let i=0;i<h;i++){
      const hf=Math.max(1,Math.round(hw*(i+1)/h)),y=cy-h+i;
      px(-hf,y,hf+1,1,i<h*.5?p[2]:p[1]);px(1,y,hf,1,p[0]);
      if(r()<.35)px(-hf,y,1,1,p[0]);
      if(sn&&i>1&&i<h*.7){px(-hf+1,y,Math.max(2,Math.round(hf*.55)),1,WH);}
    }
    px(-hw,cy-1,hw*2+1,1,'rgba(0,0,0,.4)');px(-hw+1,cy,hw*2-1,1,'rgba(0,0,0,.2)');
    if(sn){for(let x=-hw+1;x<hw;x+=4)px(x,cy-2,2,1,WH);}
  };
  const pine=(H,hw,n,p,tw,b,sn)=>{
    trunk(tw,12,b);
    const step=Math.round((H-14)/(n-.2)*.8);
    for(let i=0;i<n;i++){const cy=-10-i*step,w=Math.max(4,Math.round(hw*(1-i/n*.7)));tier(cy,w,Math.round(step*1.25)+4,p,sn);}
    px(-1,-10-(n-1)*step-Math.round(step*1.25)-3,2,3,sn?WH:p[2]);
  };
  const FB=['#3e2918','#5e402a','#7e5a3a'];
  const sn0=!!snow;
  if(map==='snow'){
    if(k===2){pine(66+v*3,16+v,5,['#10303b','#1b4a5a','#2d6676'],4,['#2a2a30','#4a4038','#6a5a4a'],true);}
    else if(k===4){ // árvore seca com neve
      const b=['#2a2a30','#4a4038','#6a5a4a'];trunk(5,34+v*3,b);
      br(0,-26,-12,-40-v*2,3,b[1]);br(0,-30,12,-44,3,b[1]);br(-6,-34,-10,-52,2,b[1]);br(5,-36,9,-54-v,2,b[1]);br(0,-34-v*3,-2,-58-v*3,2,b[1]);
      for(const q of [[-12,-41],[12,-45],[-10,-53],[9,-55],[-2,-59]])px(q[0]-2,q[1]-1,5,2,WH);
      px(-3,-8,7,2,WH);
    }else{ // carvalho carregado de neve
      trunk(7,34,['#2a2a30','#4a4038','#6a5a4a']);
      const p=['#223d38','#33564d','#4f7568','#9cc0b8'];
      for(const q of [[0,-50-v*2,10,8],[-12,-40,11,9],[12,-41,11,9],[0,-36,14,10],[-6,-46,9,8],[7,-47,9,8]])fol(q[0],q[1],q[2],q[3],p,true);
    }
  }else if(map==='desert'){
    if(k===3){
      if(v<2){ // árvore seca retorcida
        const b=['#3a2c1c','#5a4630','#7a6444'];trunk(6,30+v*4,b);
        br(0,-24,-14,-38,4,b[1]);br(0,-28,13,-42,4,b[1]);br(-8,-33,-12,-50,3,b[1]);br(7,-37,11,-52,3,b[1]);br(0,-30,1,-54-v*3,3,b[1]);
        px(-17,-41,4,3,b[2]);px(11,-45,5,3,b[2]);
      }else{ // acácia de copa achatada
        const b=['#3a2c1c','#5a4630','#7a6444'];trunk(5,36,b);br(0,-30,-10,-36,3,b[1]);br(0,-30,11,-35,3,b[1]);
        const p=['#4f6a28','#6f8a3a','#8fae4c','#c4dc88'];
        fol(-2,-40,24+v,7,p);fol(-14,-35,13,6,p);fol(14,-34,13,6,p);fol(0,-46,15,6,p);
      }
    }else if(k===6){ // palmeira
      const sw=v-1.5;
      const pcx=i=>Math.round(Math.sin(i/59*1.6)*sw*2.2);
      for(let i=0;i<60;i++){   // tronco curvo e continuo, mais grosso na base, com aneis
        const wi=Math.round(7-3*i/60)+(i<4?2:0),x=pcx(i)-(wi>>1),q=Math.max(1,wi>>2);
        px(x,-1-i,wi,1,i%5===0?'#5a4a28':i%5===1?'#a08a4c':'#8a7440');
        px(x,-1-i,q,1,i%5===0?'#6a5a30':'#b09a58');px(x+wi-q,-1-i,q,1,'#5a4a28');
      }
      px(pcx(0)-5,-1,2,1,'#8a7440');px(pcx(0)+4,-1,2,1,'#5a4a28');
      const tx=pcx(59),ty=-60;
      const fr=['#2f7a34','#3f9a44','#5ab85a'];
      for(let i=0;i<9;i++){
        const a=-3.14+i*.785+(v*.1),dx=Math.cos(a),dy=Math.sin(a)*.45,L=22+(i%2)*4;
        for(let s=1;s<=L;s++){const t=s/L,x=tx+dx*s,y=ty+dy*s+t*t*14;px(x,y,3,2,fr[(s>>2)%3]);if(s%3===0&&s>5){px(x,y+2,1,3,fr[0]);px(x,y-2,1,2,fr[2]);}}
      }
      ell(tx,ty+1,4,3,'#2a6a2e');px(tx-3,ty+3,3,3,'#5a3a1a');px(tx+1,ty+3,3,3,'#5a3a1a');
    }else{ // arbusto seco
      const p=['#4e5a26','#6a7a36','#8a9a4a','#b8c878'];
      fol(-6,-8,9,7,p);fol(6,-8,9,7,p);fol(0,-13,8,7,p);
      for(let i=0;i<5;i++)px(-8+i*4,-4,1,4,'#5a4630');
    }
  }else if(map==='city'){
    if(k===8){ // árvore de rua com grade na base
      px(-5,-3,11,3,'#3a3a40');px(-4,-2,9,1,'#5a5a62');
      trunk(4,26,FB);
      fol(0,-34,14+(v>>1),12,['#1f5f2c','#2f8a3c','#52b34e','#a4e47e']);fol(-8,-26,8,7,['#1f5f2c','#2f8a3c','#52b34e','#a4e47e']);fol(9,-27,8,7,['#1f5f2c','#2f8a3c','#52b34e','#a4e47e']);
    }else if(k===0){pine(46+v*2,12,4,['#16452a','#1f6638','#2e8648'],4,FB,sn0);}
    else{trunk(6,36,FB);const p=['#1f5a2c','#2f8038','#4fa84a','#90d870'];for(const q of [[0,-50,11,9],[-11,-40,11,9],[12,-41,11,9],[0,-38,15,11]])fol(q[0],q[1],q[2],q[3],p,sn0);}
  }else{ // floresta
    if(k===0){pine(58+v*4,17+v,5,['#133a1d','#1c5628','#2a7336'],5,FB,sn0);}
    else if(k===1){trunk(7,38,FB);const p=['#1d4d27','#2d7535','#4aa347','#8fd46e'];for(const q of [[0,-54-v*2,11,9],[-13,-42,12,10],[13,-43,12,10],[0,-40,17,12],[-7,-50,9,8],[8,-51,9,8]])fol(q[0],q[1],q[2],q[3],p,sn0);}
    else if(k===9){ // bétula
      trunk(5,41,['#a8a090','#e8e2d4','#fffaf0'],0);
      for(let i=0;i<8;i++)px(-2+(i%2),-8-i*5,3,1,'#2a2a2a');
      const p=['#3f7a34','#5a9e48','#86c262','#c4e88a'];for(const q of [[0,-52,9,9],[-8,-44,9,8],[8,-45,9,8],[0,-42,11,8]])fol(q[0],q[1],q[2],q[3],p,sn0);
    }else{ // copa grande
      trunk(10,50,['#34200f','#52361d','#704c2c']);
      const p=['#153a20','#1f5a2c','#32823a','#68b458'];for(const q of [[0,-70,14,10],[-16,-58,14,11],[16,-59,14,11],[0,-56,20,14],[-9,-66,11,9],[10,-67,11,9],[-22,-46,10,8],[22,-47,10,8]])fol(q[0],q[1],q[2],q[3],p,sn0);
    }
  }
  return TSP[key]={cv:cv,ox:ox,oy:oy,top:top,half:Math.max(8,half)};
}
function treeShadow(x,y,s){
  const L=Math.min(s.top,56)*SUN.len*.55,rw=s.half*.62;
  const tx=x+SUN.dx*L,ty=y+2+SUN.dy*L*.6;
  ctx.fillStyle=SUN.fs;ctx.beginPath();
  ctx.moveTo(x-2,y+2);ctx.lineTo(x+2,y+2);ctx.lineTo(tx+1.5,ty);ctx.lineTo(tx-1.5,ty);ctx.closePath();
  ctx.moveTo(tx+rw,ty);ctx.ellipse(tx,ty,rw*(1+.15*SUN.len),rw*.5,0,0,6.283);
  ctx.moveTo(x+5,y+2);ctx.ellipse(x,y+2,5,2,0,0,6.283);
  ctx.fill();
}
function drawTree(t){
  const x=t.x,y=t.y,k=t.k|0,v=Math.floor((t.seed||0)*4)&3;
  const s=treeSprite(k,v,weather==='snow'&&selectedMap!=='snow');
  treeShadow(x,y,s);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  const behind=P&&!P.inside&&P.y<y-3&&P.y>y-s.top&&Math.abs(P.x-x)<s.half;   // jogador atrás da copa
  if(behind)ctx.globalAlpha=.5;
  ctx.drawImage(s.cv,x-s.ox,y-s.oy);
  ctx.globalAlpha=1;ctx.imageSmoothingEnabled=sm;
}
function drawDecoration(d){
  const x=d.x,y=d.y;
  if(d.type==='wreck'||d.type==='billboard'){drawAmbProp(d);return;}
  switch(d.type){
    case'ruinwall':{
      shadow(x,y+2,7,3);const h=d.seed<.4?5:10;
      R(x-6,y-h,12,h+1,'#a88c5c');R(x-6,y-h,12,3,'#c4a874');R(x-2,y-h+4,1,Math.max(1,h-5),'#7a6240');
      if(d.seed>.8)R(x+2,y-h-3,4,3,'#a88c5c');
      break;}
    case'pillar':{
      shadow(x,y+3,8,3);const br=d.seed<.3,h=br?14:30;
      R(x-5,y-h,10,h,'#b8996a');R(x-5,y-h,3,h,'#cdb080');R(x+2,y-h,3,h,'#9a7e52');
      R(x-7,y-h-2,14,4,'#d0b080');R(x-7,y-3,14,4,'#a08458');
      if(br)R(x+4,y-3,6,3,'#b8996a');
      break;}
    case'statue':{
      shadow(x,y+3,8,3);
      R(x-6,y-3,12,4,'#3a3a42');R(x-5,y-26,10,24,'#2a2a30');R(x-5,y-26,10,2,'#3a3a44');
      R(x-4,y-35,8,9,'#2a2a30');R(x-4,y-41,2,6,'#2a2a30');R(x+2,y-41,2,6,'#2a2a30');R(x-1,y-30,6,3,'#3a3a44');
      R(x-5,y-24,10,2,'#d8b040');R(x+1,y-33,2,1,'#e8c040');
      break;}
    case'chest':{
      shadow(x,y+2,9,3);
      const col=d.kind==='gold'?['#8a5a1a','#f0c830','#5a3a10']:d.kind==='ice'?['#5a7a98','#c8e4f4','#3a5a78']:['#8a6a3a','#c0a060','#5a4426'];
      if(d.open){
        R(x-7,y-8,14,8,col[0]);R(x-7,y-8,14,2,col[1]);R(x-6,y-6,12,4,'#1a1008');
        R(x-7,y-17,14,5,col[0]);R(x-7,y-17,14,1,col[1]);R(x-7,y-13,14,1,col[2]);
      }else{
        R(x-7,y-8,14,8,col[0]);R(x-7,y-13,14,5,col[0]);R(x-7,y-13,14,1,col[1]);R(x-7,y-8,14,1,col[2]);
        R(x-7,y-13,2,13,col[1]);R(x+5,y-13,2,13,col[1]);R(x-1,y-9,3,4,'#ffd84a');R(x,y-8,1,2,'#503010');
        if(d.main&&((T*1.2)%2.4)<.3)R(x+3+Math.round(Math.sin(T*9)),y-15,2,2,'#fff');
      }
      break;}
    case'oldtent':{
      shadow(x,y+2,18,4);
      ctx.fillStyle='#6a7a58';ctx.beginPath();ctx.moveTo(x-17,y+1);ctx.lineTo(x,y-20);ctx.lineTo(x+17,y+1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#4a5a3c';ctx.beginPath();ctx.moveTo(x+2,y+1);ctx.lineTo(x,y-20);ctx.lineTo(x+17,y+1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#eef4f8';ctx.beginPath();ctx.moveTo(x-9,y-9);ctx.lineTo(x,y-20);ctx.lineTo(x+9,y-9);ctx.lineTo(x+4,y-11);ctx.lineTo(x,y-9);ctx.lineTo(x-4,y-11);ctx.closePath();ctx.fill();
      ctx.fillStyle='#1c2218';ctx.beginPath();ctx.moveTo(x-5,y+1);ctx.lineTo(x,y-9);ctx.lineTo(x+4,y+1);ctx.closePath();ctx.fill();
      R(x-17,y,34,2,'#eef4f8');
      break;}
    case'sled':
      shadow(x,y+2,11,3);R(x-11,y-1,22,1,'#3a2a1a');R(x-10,y-4,20,3,'#6a4a2a');R(x-6,y-9,12,5,'#8a6a3a');R(x-6,y-9,12,1,'#a98a5a');R(x-6,y-9,12,2,'#eef4f8');
      break;
    case'frozen':
      R(x-4,y-9,8,9,'#5a7aa0');R(x-3,y-14,6,5,'#c8d8e8');R(x-3,y-14,6,2,'#4a5a70');
      ctx.fillStyle='rgba(200,235,255,.38)';ctx.fillRect(x-6,y-16,12,18);R(x-5,y-15,2,16,'rgba(255,255,255,.35)');
      break;
    case'flag':
      R(x,y-32,2,34,'#6a4a2a');R(x+2,y-32,12+Math.round(Math.sin(T*3)*1.5),7,'#a83a3a');R(x+2,y-32,12,1,'#c85a5a');R(x+2,y-26,8,1,'#7a2a2a');
      break;
    case'bush':
      shadow(x,y+2,6,3);
      R(x-6,y-6,12,7,'#2a6a2a');R(x-5,y-9,10,4,'#3a8a3a');
      if(weather==='snow')R(x-5,y-7,10,2,'#e8f4f8');
      break;
    case'flower_r':
      R(x-1,y-1,2,3,'#3a8a3a');
      R(x-3,y-5,2,2,'#e04040');R(x+1,y-5,2,2,'#e04040');
      R(x-1,y-7,2,2,'#e04040');R(x-1,y-3,2,2,'#ff6060');
      break;
    case'flower_b':
      R(x-1,y-1,2,3,'#3a8a3a');
      R(x-3,y-5,2,2,'#4060e0');R(x+1,y-5,2,2,'#4060e0');
      R(x-1,y-7,2,2,'#4060e0');R(x-1,y-3,2,2,'#6080ff');
      break;
    case'mushroom':
      R(x-1,y-2,2,3,'#e8dcc0');
      R(x-4,y-4,8,3,'#c04040');R(x-3,y-6,6,2,'#d05050');
      R(x-2,y-5,1,1,'#fff');R(x+1,y-5,1,1,'#fff');
      break;
    case'fern':
      R(x-1,y-3,2,4,'#3a6a2a');
      for(let i=-4;i<=4;i+=2)R(x+i,y-4-Math.abs(i),1,3,'#4a8a3a');
      break;
    case'log':
      shadow(x,y+2,8,3);
      R(x-8,y-5,16,6,'#6a4a2a');R(x-8,y-5,16,2,'#8a6a4a');
      R(x-8,y-4,2,4,'#3a2a1a');R(x+6,y-4,2,4,'#3a2a1a');
      break;
    case'stump':
      shadow(x,y+2,6,3);
      R(x-5,y-5,10,7,'#5a3a1a');R(x-5,y-5,10,2,'#7a5a3a');
      R(x-3,y-4,2,3,'#3a2a1a');R(x+1,y-4,2,3,'#3a2a1a');
      break;
    case'lily':
      R(x-2,y-1,4,2,'#3a8a4a');R(x-3,y-2,6,3,'#4aa050');
      break;
    case'cactus_sm':
      R(x-1,y-7,3,9,'#3a7a3a');R(x-1,y-7,3,2,'#4a9a4a');
      R(x-4,y-4,3,2,'#3a7a3a');R(x+2,y-5,3,2,'#3a7a3a');
      break;
    case'cactus_bg':
      shadow(x,y+2,8,3);
      R(x-3,y-16,6,18,'#3a7a3a');R(x-3,y-16,6,3,'#4a9a4a');
      R(x-9,y-10,6,3,'#3a7a3a');R(x-9,y-12,3,5,'#3a7a3a');
      R(x+3,y-13,6,3,'#3a7a3a');R(x+6,y-15,3,5,'#3a7a3a');
      break;
    case'skull':
      R(x-4,y-4,8,6,'#e8e0d0');R(x-3,y-6,6,3,'#e8e0d0');
      R(x-3,y-3,2,2,'#333');R(x+1,y-3,2,2,'#333');
      R(x-1,y-1,2,1,'#a0a0a0');
      break;
    case'tumbleweed':
      ctx.fillStyle='#a08a5a';
      ctx.beginPath();ctx.arc(x,y-3,5,0,6.283);ctx.fill();
      ctx.strokeStyle='#6a5a3a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-4,y-3);ctx.lineTo(x+4,y-3);ctx.moveTo(x,y-7);ctx.lineTo(x,y+1);ctx.stroke();
      break;
    case'rock_sm':
      shadow(x,y+2,5,2);
      R(x-4,y-4,8,5,'#9a9a80');R(x-3,y-6,6,3,'#b8b8a0');
      break;
    case'bone':
      R(x-6,y-2,12,3,'#e8e0d0');
      R(x-6,y-3,3,5,'#e8e0d0');R(x+3,y-3,3,5,'#e8e0d0');
      break;
    case'dune':
      R(x-10,y-3,20,3,'#c8a878');R(x-8,y-5,16,2,'#d8b888');
      break;
    case'ice':
      R(x-6,y-3,12,4,'#a0d0e8');R(x-5,y-5,10,3,'#c0e8f8');
      R(x-3,y-4,2,2,'rgba(255,255,255,.6)');
      break;
    case'snowman':
      shadow(x,y+3,6,3);
      R(x-5,y-10,10,10,'#f0f4f8');R(x-4,y-18,8,8,'#f0f4f8');
      R(x-3,y-16,1,1,'#333');R(x+1,y-16,1,1,'#333');
      R(x-3,y-13,6,1,'#c05020');
      R(x-6,y-19,12,2,'#333');R(x-2,y-22,4,3,'#333');
      break;
    case'pine_sm':
      shadow(x,y+2,7,3);
      R(x-1,y-6,2,4,'#4a3a1a');
      R(x-5,y-10,10,5,'#1a5a2a');R(x-4,y-14,8,5,'#1a5a2a');R(x-2,y-17,4,4,'#1a5a2a');
      break;
    case'icicle':
      R(x,y-8,2,8,'#c0e8f8');R(x-3,y-6,2,6,'#a0d0e8');R(x+3,y-5,2,5,'#a0d0e8');
      break;
    case'frozen_bush':
      shadow(x,y+2,6,3);
      R(x-5,y-5,10,6,'#4a6a4a');R(x-6,y-8,12,4,'#e8f4f8');
      break;
    case'snowpile':
      shadow(x,y+2,7,3);
      R(x-7,y-3,14,4,'#f0f4f8');R(x-5,y-6,10,3,'#f8fcff');
      break;
    case'trash':
      shadow(x,y+2,5,3);
      R(x-4,y-10,8,10,'#4a5a4a');R(x-4,y-12,8,2,'#5a6a5a');
      R(x-2,y-8,1,6,'#3a4a3a');R(x+1,y-8,1,6,'#3a4a3a');
      break;
    case'bench':
      shadow(x,y+2,10,3);
      R(x-9,y-3,18,4,'#7a5a3a');R(x-9,y-6,18,2,'#8a6a4a');
      R(x-8,y-3,2,4,'#4a3a2a');R(x+6,y-3,2,4,'#4a3a2a');
      break;
    case'lamp':
      shadow(x,y+2,3,3);
      R(x-1,y-22,3,22,'#3a3a3a');
      R(x-4,y-26,10,5,'#4a4a4a');
      R(x-2,y-22,5,2,dark>.2?'#fff0b0':'#6a6a62'); // lâmpada
      break;
    case'palmorla':{
      shadow(x+8,y+2,18,4);
      const ln=d.seed<.5?-1:1,sw=Math.sin(T*1.2+d.seed*9)*1.5;
      for(let i=0;i<13;i++){const q=i/12;R(x+ln*Math.sin(q*1.5)*9-2.5,y-i*4.6-4,5-(q>.75?1:0),5,i%2?'#85653f':'#9a7a52');}
      const cx=x+ln*Math.sin(1.5)*9+sw,cy=y-60;
      for(let f=0;f<8;f++){
        const a=f/8*6.283+.3,col=f%2?'#2f7a3a':'#3e9449';
        for(let j=1;j<=11;j++)R(cx+Math.cos(a)*j*2.1,cy+Math.sin(a)*j*1.1+j*j*.07,3,2,col);
      }
      R(cx-2,cy+1,3,3,'#5a3a1e');R(cx+2,cy+2,3,3,'#6a4624');
      break;}
    case'umbrella':{
      const cols=['#e04a3a','#f0c030','#2a8fd0','#ef7fb0','#3aa860'],c=cols[Math.floor(d.seed*5)%5];
      shadow(x+5,y+3,18,4);R(x-1,y-30,2,32,'#e8e4d8');
      for(let r=0;r<9;r++){const w=Math.round(21*Math.sqrt(1-(r/9)*(r/9)));for(let k=-w;k<w;k+=4)R(x+k,y-30-r,Math.min(4,w-k),1,(((k+48)/4)|0)%2?c:'#f4f1e8');}
      R(x-21,y-30,42,1,'rgba(0,0,0,.22)');
      break;}
    case'towel':{
      const cols=['#e8503c','#f4d03c','#3a9ae0','#f08cb8','#58c070'],c=cols[Math.floor(d.seed*5)%5];
      R(x-9,y-3,18,8,c);R(x-9,y-1,18,1,'#f4f1e8');R(x-9,y+2,18,1,'#f4f1e8');
      break;}
    case'kiosk':{
      shadow(x,y+3,28,5);
      R(x-24,y-26,48,26,'#f2e9d2');R(x-24,y-4,48,4,'#d9cfb4');R(x-18,y-24,36,10,'#37526b');R(x-20,y-14,40,3,'#8a6a44');
      for(let i=0;i<12;i++)R(x-27+i*4.5,y-35,5,9,i%2?'#f4f1e8':'#e2503c');
      R(x-12,y-43,24,7,'#2a8fd0');R(x-9,y-41,18,1,'#f4f1e8');
      break;}
    case'lifeguard':{
      shadow(x,y+3,16,4);
      R(x-10,y-16,3,16,'#8a6a44');R(x+7,y-16,3,16,'#8a6a44');R(x-12,y-19,24,3,'#a8845a');
      R(x-9,y-36,18,17,'#e8e0cf');R(x-6,y-32,12,6,'#37526b');R(x-12,y-40,24,4,'#e2503c');
      R(x+9,y-52,1,14,'#444');R(x+10,y-52,8+Math.round(Math.sin(T*4)*1),5,'#e2503c');
      break;}
    case'buoy':{
      const by=Math.round(Math.sin(T*2+d.seed*9)*1.5);
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,8,3,0,0,6.283);ctx.stroke();
      R(x-3,y-9+by,6,3,'#e2503c');R(x-3,y-6+by,6,3,'#f4f1e8');R(x-3,y-3+by,6,3,'#e2503c');
      break;}
    case'boat':{
      const bo=Math.round(Math.sin(T*1.5+d.seed*9)*1.5);
      ctx.fillStyle='rgba(0,30,50,.25)';ctx.beginPath();ctx.ellipse(x,y+3,26,5,0,0,6.283);ctx.fill();
      ctx.fillStyle=d.seed<.5?'#8a3a2a':'#2a5a8a';ctx.beginPath();ctx.ellipse(x,y-3+bo,24,8,0,0,3.1416);ctx.fill();
      R(x-24,y-5+bo,48,3,'#d8c9a8');R(x-6,y-16+bo,14,11,'#e8e0cf');R(x-4,y-14+bo,10,4,'#37526b');R(x-8,y-18+bo,18,3,'#8a6a44');
      R(x+14,y-30+bo,2,26,'#6a5236');
      ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,28,5+Math.sin(T*2)*.6,0,0,6.283);ctx.stroke();
      break;}
    case'searock':{
      shadow(x,y+2,12,3);
      R(x-9,y-8,18,9,'#5b5f66');R(x-6,y-13,12,6,'#74787f');R(x-3,y-13,4,2,'#8a8e95');
      R(x-12,y-1,24,2,'rgba(255,255,255,.65)');
      break;}
    case'sign':
      shadow(x,y+2,3,3);
      R(x-1,y-14,2,12,'#5a5a5a');
      R(x-8,y-18,16,8,'#c05030');R(x-7,y-17,14,2,'#e8e8e8');R(x-6,y-13,10,1,'#e8e8e8');
      break;
    case'papers':
      R(x-4,y-2,8,3,'#f0f0e0');R(x-2,y-4,6,3,'#e0e0d0');R(x+1,y-1,4,2,'#f8f8e8');
      break;
    case'crate':
      shadow(x,y+2,7,3);
      R(x-6,y-10,12,10,'#8a6a3a');R(x-6,y-10,12,2,'#9a7a4a');
      R(x-6,y-6,12,1,'#5a4a2a');R(x-6,y-2,12,2,'#5a4a2a');
      break;
    case'hydrant':
      shadow(x,y+2,4,2);
      R(x-3,y-10,6,10,'#c03030');R(x-4,y-12,8,3,'#e04040');
      R(x-3,y-4,1,3,'#8a2020');R(x+2,y-4,1,3,'#8a2020');
      break;
    case'cone':
      shadow(x,y+2,4,2);
      R(x-2,y-12,4,12,'#e08a20');R(x-3,y-3,6,3,'#c07018');
      R(x-2,y-8,4,1,'#fff');R(x-1,y-5,2,1,'#fff');
      break;
    // --- new forest ---
    case'bush2':
      shadow(x,y+2,7,3);
      R(x-7,y-5,14,6,'#1a5a2a');R(x-5,y-8,10,4,'#2a7a3a');R(x-3,y-10,6,3,'#3a8a4a');
      if(weather==='snow')R(x-6,y-7,12,2,'#e8f4f8');
      break;
    case'flower_y':
      R(x-1,y-1,2,3,'#3a8a3a');
      R(x-3,y-5,2,2,'#e0c020');R(x+1,y-5,2,2,'#e0c020');
      R(x-1,y-7,2,2,'#e0c020');R(x-1,y-3,2,2,'#ffe040');
      break;
    case'tallgrass':
      for(let i=-3;i<=3;i+=2) R(x+i,y-6-Math.abs(i),1,7+Math.abs(i),'#4a8a3a');
      R(x-1,y-2,2,3,'#3a6a2a');
      break;
    case'berry':
      shadow(x,y+2,5,2);
      R(x-5,y-6,10,6,'#2a6a2a');R(x-4,y-8,8,3,'#3a8a3a');
      R(x-3,y-5,2,2,'#c02040');R(x+1,y-6,2,2,'#e03050');R(x-1,y-7,2,2,'#c02040');
      break;
    case'rock_moss':
      shadow(x,y+2,6,3);
      R(x-5,y-5,10,6,'#7a8a70');R(x-4,y-8,8,4,'#9aaa90');
      R(x-3,y-7,4,2,'#3a7a3a');R(x+1,y-5,3,2,'#2a6a2a');
      break;
    // --- new desert ---
    case'cactus_tall':
      shadow(x,y+2,5,3);
      R(x-2,y-22,5,24,'#3a7a3a');R(x-2,y-22,5,3,'#4a9a4a');
      R(x-8,y-14,6,3,'#3a7a3a');R(x-8,y-18,3,7,'#3a7a3a');
      R(x+3,y-16,6,3,'#3a7a3a');R(x+6,y-20,3,7,'#3a7a3a');
      R(x-1,y-10,1,1,'#e0c060');R(x+1,y-16,1,1,'#e0c060');
      break;
    case'drybush':
      shadow(x,y+2,6,2);
      R(x-5,y-5,10,5,'#8a7a4a');R(x-4,y-7,8,3,'#9a8a5a');
      R(x-6,y-4,3,2,'#6a5a30');R(x+3,y-5,3,2,'#6a5a30');
      break;
    case'sandrock':
      shadow(x,y+2,7,3);
      R(x-7,y-5,14,6,'#b09060');R(x-5,y-8,10,4,'#c8a878');R(x-3,y-10,6,3,'#d8b888');
      break;
    case'yucca':
      shadow(x,y+2,5,2);
      R(x-1,y-4,3,5,'#5a6a30');
      for(let i=0;i<5;i++){const a=-1.4+i*0.7;R(x+Math.round(Math.cos(a)*6),y-6+Math.round(Math.sin(a)*3),1,7,'#6a8a3a');}
      break;
    // --- new snow ---
    case'crystal':
      shadow(x,y+2,4,2);
      R(x-2,y-10,4,10,'#a0d8f0');R(x-3,y-12,6,3,'#c0e8f8');R(x-1,y-14,2,3,'#e0f4ff');
      R(x-4,y-6,2,5,'#90c8e0');R(x+2,y-7,2,6,'#90c8e0');
      break;
    case'frozen_log':
      shadow(x,y+2,8,3);
      R(x-8,y-5,16,6,'#5a4a3a');R(x-8,y-5,16,2,'#e8f4f8');
      R(x-6,y-3,3,3,'#a0d0e0');R(x+2,y-3,3,3,'#a0d0e0');
      break;
    case'ski':
      R(x-8,y-2,16,2,'#c0d0e0');R(x-7,y-4,3,3,'#a0b0c0');R(x+4,y-4,3,3,'#a0b0c0');
      break;
    case'flag':
      shadow(x,y+2,2,2);
      R(x-1,y-20,2,20,'#5a5a5a');
      R(x+1,y-20,10,6,'#c03030');R(x+1,y-18,8,2,'#e8e8e8');
      break;
    // --- new city ---
    case'dumpster':
      shadow(x,y+2,10,4);
      R(x-9,y-14,18,14,'#3a5a3a');R(x-9,y-16,18,3,'#4a6a4a');
      R(x-7,y-12,6,8,'#2a4a2a');R(x+1,y-12,6,8,'#2a4a2a');
      R(x-9,y-2,18,2,'#2a3a2a');
      break;
    case'graffiti':
      R(x-6,y-8,12,8,'#4a4a50');
      R(x-5,y-7,3,2,'#e040a0');R(x-1,y-6,4,2,'#40c0e0');R(x+3,y-5,3,2,'#e0e040');
      break;
    case'barrier':
      shadow(x,y+2,8,3);
      R(x-8,y-6,16,4,'#c05020');R(x-8,y-6,16,1,'#e8e8e8');R(x-8,y-3,16,1,'#e8e8e8');
      R(x-7,y-2,2,3,'#5a5a5a');R(x+5,y-2,2,3,'#5a5a5a');
      break;
    case'mailbox':
      shadow(x,y+2,4,2);
      R(x-1,y-8,2,8,'#4a4a4a');R(x-4,y-14,8,7,'#3060a0');R(x-4,y-15,8,2,'#4080c0');
      R(x-2,y-12,4,2,'#1a3a60');
      break;
    case'bike':
      shadow(x,y+2,8,2);
      ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x-5,y-3,3,0,6.283);ctx.stroke();
      ctx.beginPath();ctx.arc(x+5,y-3,3,0,6.283);ctx.stroke();
      R(x-4,y-6,8,1,'#5a5a5a');R(x-1,y-9,2,4,'#4a4a4a');
      break;
  }
}
function drawCampfire(c){
  const x=c.x,y=c.y;shadow(x,y+2,10,4);
  // Pedras em círculo
  for(let i=0;i<6;i++){
    const a=i*1.05, rx=Math.cos(a)*7, ry=Math.sin(a)*4;
    R(x+rx-2,y+ry-1,4,3,'#6a6a70');R(x+rx-1,y+ry-2,2,2,'#8a8a90');
  }
  // Lenha cruzada
  R(x-7,y-2,14,3,'#5a3a1c');R(x-2,y-5,3,8,'#6a4a28');R(x+1,y-4,3,7,'#4a2a14');
  // Chamas animadas (pontiagudas, não bloco de lava)
  const flick=c.flicker||0;
  const tongues=[
    {ox:0,  h:12+Math.sin(flick)*3,     w:5, phase:0},
    {ox:-4, h:9+Math.sin(flick*1.3+1)*2,w:3, phase:1},
    {ox:4,  h:8+Math.sin(flick*0.9+2)*2,w:3, phase:2},
    {ox:-2, h:6+Math.sin(flick*1.7)*2,  w:2, phase:3},
    {ox:2,  h:7+Math.cos(flick*1.1)*2,  w:2, phase:4}
  ];
  for(const t of tongues){
    const h=Math.max(3,Math.round(t.h)), w=t.w;
    const baseY=y-3;
    // base vermelha
    R(x+t.ox-w/2, baseY-h*0.35, w, Math.round(h*0.45), '#c02810');
    // meio laranja
    R(x+t.ox-w/2+0.5, baseY-h*0.7, Math.max(1,w-1), Math.round(h*0.4), '#ff7018');
    // ponta amarela
    R(x+t.ox-1, baseY-h, Math.max(1,w-2), Math.round(h*0.35), '#ffc030');
    // núcleo branco quente
    if(t.phase===0) R(x-1, baseY-Math.round(h*0.5), 2, Math.round(h*0.25), '#fff2a0');
  }
  // Brasas
  if(Math.random()<0.35) parts.push({x:x+rnd(-4,4),y:y-8,vx:rnd(-8,8),vy:rnd(-40,-15),t:rnd(.4,.8),c:pick(['#ff8020','#ffc040','#ffe080'])});
  if(dark>.1){ctx.fillStyle='rgba(255,120,30,'+(0.12*dark).toFixed(3)+')';ctx.beginPath();ctx.arc(x,y-4,52,0,6.283);ctx.fill();}
  if(weather==='rain'){ R(x-3,y-18,6,5,'rgba(90,90,90,.4)'); }
}
function drawCityRoads(vx0,vy0,vx1,vy1){
  const vr=[];
  for(const r of roads) if(!(r.x-8>vx1||r.x+r.w+8<vx0||r.y-8>vy1||r.y+r.h+8<vy0)) vr.push(r);
  const vi=cityInter.filter(q=>!(q.x-14>vx1||q.x+q.w+14<vx0||q.y-14>vy1||q.y+q.h+14<vy0));
  for(const r of vr){ // calçadas
    if(r.vert){R(r.x-8,r.y,8,r.h,'#7c7f84');R(r.x+r.w,r.y,8,r.h,'#7c7f84');}
    else{R(r.x,r.y-8,r.w,8,'#7c7f84');R(r.x,r.y+r.h,r.w,8,'#7c7f84');}
  }
  for(const r of vr) R(r.x,r.y,r.w,r.h,'#3a3a40'); // asfalto (cruzamentos ficam limpos)
  const inI=(px,py,w,h)=>{for(const q of vi)if(px+w>q.x-2&&px<q.x+q.w+2&&py+h>q.y-2&&py<q.y+q.h+2)return true;return false;};
  for(const r of vr){ // faixa central tracejada, sem atravessar cruzamentos
    if(!r.vert){
      const cy=r.y+Math.floor(r.h/2)-1, a=Math.max(r.x+6,Math.floor(vx0)), b=Math.min(r.x+r.w-6,vx1);
      for(let x=r.x+Math.floor((a-r.x)/20)*20;x<b;x+=20){ if(x<r.x+6||inI(x,cy,11,2))continue; R(x,cy,11,2,r.main?'#e0c040':'#c0c050'); }
    } else {
      const cx=r.x+Math.floor(r.w/2)-1, a=Math.max(r.y+6,Math.floor(vy0)), b=Math.min(r.y+r.h-6,vy1);
      for(let y=r.y+Math.floor((a-r.y)/20)*20;y<b;y+=20){ if(y<r.y+6||inI(cx,y,2,11))continue; R(cx,y,2,11,r.main?'#e0c040':'#c0c050'); }
    }
  }
  for(const q of vi){ // faixas de pedestres nos 4 lados de cada cruzamento
    for(let k=3;k<q.w-3;k+=6){ R(q.x+k,q.y-11,3,8,'#cfcfcf'); R(q.x+k,q.y+q.h+3,3,8,'#cfcfcf'); }
    for(let k=3;k<q.h-3;k+=6){ R(q.x-11,q.y+k,8,3,'#cfcfcf'); R(q.x+q.w+3,q.y+k,8,3,'#cfcfcf'); }
  }
}
function drawOpenVeh(K,v,L,W){
  const c=v.col;
  if(K==='sled'){
    R(-L/2,-W/2+3,13,W-6,'#1c1c20');for(let x=-L/2+1;x<-L/2+13;x+=3)R(x,-W/2+3,1,W-6,'#3a3a40'); // esteira
    R(L/2-12,-W/2-1,13,3,'#dfe8ee');R(L/2-12,W/2-2,13,3,'#dfe8ee');R(L/2+1,-W/2-2,2,2,'#dfe8ee');R(L/2+1,W/2,2,2,'#dfe8ee'); // esquis
    R(-L/2+4,-W/2+2,L-8,W-4,c);R(L/2-13,-W/2+3,11,W-6,c);
    R(L/2-12,-W/2+4,9,2,'rgba(255,255,255,.28)');R(-L/2+5,-W/2+3,L-12,1,'rgba(255,255,255,.2)');
    R(-L/2+6,-3,8,6,'#25252a');R(-L/2+7,-2,6,1,'#3a3a42');                     // banco
    R(L/2-15,-W/2+1,2,W-2,'#2a2a2e');R(L/2-16,-W/2,2,2,'#2a2a2e');R(L/2-16,W/2-2,2,2,'#2a2a2e'); // guidão
    R(L/2-12,-3,2,6,'rgba(170,215,240,.75)');                                 // para-brisa
    R(L/2-1,-3,2,6,'#f0e8a0');R(L/2-1,-1,1,2,'#fff8d0');R(-L/2,-3,1,6,'#c02828');
  }else if(K==='atv'){
    const wl=(x,y)=>{R(x,y,7,5,'#111');R(x+1,y+1,5,3,'#2e2e32');R(x+2,y,1,5,'#1a1a1a');R(x+4,y,1,5,'#1a1a1a');};
    wl(-L/2+1,-W/2-2);wl(L/2-9,-W/2-2);wl(-L/2+1,W/2-3);wl(L/2-9,W/2-3);        // pneus de trilha
    R(-L/2+4,-W/2+3,L-8,W-6,c);R(L/2-11,-W/2+4,10,W-8,c);
    R(L/2-10,-W/2+5,8,1,'rgba(255,255,255,.3)');
    R(-L/2+5,-3,9,6,'#2a2218');R(-L/2+6,-2,7,1,'#4a3a28');                       // banco
    R(-L/2+1,-W/2+4,5,W-8,'#3a3a3e');R(-L/2+2,-W/2+5,3,W-10,'#5a5a60');           // bagageiro traseiro
    R(L/2-12,-W/2+1,2,W-2,'#222');R(L/2-13,-W/2,2,2,'#222');R(L/2-13,W/2-2,2,2,'#222'); // guidão
    R(L/2-1,-3,2,6,'#f0e8a0');R(-L/2,-4,1,3,'#c02828');R(-L/2,1,1,3,'#c02828');
  }else{
    const wl=(x,y)=>{R(x,y,8,6,'#111');R(x+2,y+1,4,4,'#3a3a3e');R(x+3,y+2,2,2,'#6a6a70');};
    wl(-L/2+1,-W/2-3);wl(L/2-10,-W/2-3);wl(-L/2+1,W/2-3);wl(L/2-10,W/2-3);       // rodas grandes
    R(-L/2+3,-W/2+3,L-6,W-6,c);R(L/2-13,-W/2+4,12,W-8,c);
    R(L/2-12,-1,11,2,'rgba(255,255,255,.55)');R(-L/2+4,-W/2+3,L-8,1,'rgba(255,255,255,.2)');
    R(-L/2+2,-5,9,10,'#4a4a4e');R(-L/2+3,-4,7,2,'#6a6a70');R(-L/2-1,-W/2+6,3,2,'#2a2a2a'); // motor e escapamento
    R(-3,-W/2+4,6,5,'#3a2a1a');R(-3,W/2-9,6,5,'#3a2a1a');                      // bancos
    R(-6,-W/2+2,1,W-4,'#26262a');R(6,-W/2+2,1,W-4,'#26262a');R(-6,-W/2+2,13,1,'#26262a');R(-6,W/2-3,13,1,'#26262a'); // gaiola de proteção
    R(9,-W/2+4,2,W-8,'rgba(170,215,240,.6)');
    R(L/2-2,-W/2+4,2,3,'#f0e8a0');R(L/2-2,W/2-7,2,3,'#f0e8a0');R(-L/2,-W/2+5,1,3,'#c02828');R(-L/2,W/2-8,1,3,'#c02828');
  }
}
/* piloto visto de cima nos veículos abertos (moto de neve, quadriciclo, buggy): corpo, cabeça, braços no guidão e pernas */
function vehDriverLook(v){
  if(P&&P.inVehicle===v)return myLook();
  if(v.driverId){const rp=remotePlayers[v.driverId];if(rp&&rp.alive!==false)return remoteLook(rp);}
  return null;
}
function drawRider(K,lk,L,W){
  let cx,cy=0,hbx,hy;
  if(K==='sled'){cx=-5;hbx=0;hy=5;}else if(K==='atv'){cx=-4;hbx=2;hy=5;}else{cx=0;cy=Math.round(-W/2+6.5);hbx=7;hy=1;}
  const sh=(lk.os==='tank'||lk.os==='bare')?lk.skin:lk.shirt;
  R(cx+1,cy-4,4,2,lk.pants);R(cx+1,cy+2,4,2,lk.pants);R(cx+4,cy-4,2,2,lk.boot||'#2a2420');R(cx+4,cy+2,2,2,lk.boot||'#2a2420'); // pernas e botas
  if(lk.pack)R(cx-4,cy-3,2,6,'#3a3a2a');
  armLine(cx,cy-3,hbx,cy-hy,sh,lk.glove||lk.skin,lk.slv);armLine(cx,cy+3,hbx,cy+hy,sh,lk.glove||lk.skin,lk.slv);
  R(hbx-1,cy-hy-1,2,2,lk.glove||lk.skin);R(hbx-1,cy+hy-1,2,2,lk.glove||lk.skin);
  R(cx-2,cy-4,5,8,sh);R(cx-2,cy-4,5,1,Sh(sh,.15));R(cx-2,cy+3,5,1,Sh(sh,-.2));      // tronco e ombros
  R(cx-1,cy-3,3,6,lk.hair);R(cx+2,cy-3,2,6,lk.skin);                                 // cabeça: cabelo atrás, rosto na frente
  if(lk.female)R(cx-3,cy-2,2,4,lk.hair);
}
function drawVehicle(v){
  // Local axes after rotate(face): +X = frente (direção do movimento), +Y = lado
  const L=v.w||36, W=v.h||20; // L=comprimento, W=largura
  {const k=SUN.len;ctx.fillStyle=SUN.fs;ctx.beginPath();ctx.ellipse(Math.round(v.x+SUN.dx*k*L*.3),Math.round(v.y+3+SUN.dy*k*W*.35),Math.max(L,W)*.46*(1+.15*k),Math.min(L,W)*.38,v.face||0,0,6.283);ctx.fill();}
  ctx.save();
  ctx.translate(v.x,v.y);
  ctx.rotate(v.face||0);

  const VK=vehKind(v);
  if(VK!=='car'){drawOpenVeh(VK,v,L,W);}else{
  // --- Corpo principal ---
  R(-L/2,-W/2,L,W,v.col);
  // Brilho no teto
  R(-L/2+3,-W/2+1,L-6,2,'rgba(255,255,255,.12)');

  // --- Capô / frente (mais estreito visualmente) ---
  R(L/2-9,-W/2+2,8,W-4,v.col);
  R(L/2-8,-W/2+3,6,W-6,'rgba(0,0,0,.12)');

  // --- Para-choque dianteiro ---
  R(L/2-2,-W/2+3,3,W-6,'#2a2a2a');
  R(L/2-1,-W/2+4,2,W-8,'#3a3a3a');

  // --- Faróis (FRENTE = +X) — dois brancos/amarelos ---
  R(L/2-3,-W/2+3,3,4,'#f0e8a0');
  R(L/2-3,W/2-7,3,4,'#f0e8a0');
  R(L/2-2,-W/2+4,2,2,'#fff8d0');
  R(L/2-2,W/2-6,2,2,'#fff8d0');

  // --- Para-brisa (vidro mais perto da frente) ---
  R(2,-W/2+3,8,W-6,'#6a90a8');
  R(3,-W/2+4,6,2,'rgba(255,255,255,.25)');
  // Divisor do para-brisa
  R(5,-W/2+3,1,W-6,'rgba(0,0,0,.2)');

  // --- Teto / cabine ---
  R(-6,-W/2+2,10,W-4,'rgba(0,0,0,.1)');
  // Janela lateral (vidro mais escuro)
  R(-4,-W/2+3,6,W-6,'#4a7088');
  R(-3,-W/2+4,4,2,'rgba(255,255,255,.15)');

  // --- Traseira / porta-malas ---
  R(-L/2,-W/2+2,7,W-4,'rgba(0,0,0,.15)');
  // Para-choque traseiro
  R(-L/2,-W/2+3,3,W-6,'#2a2a2a');
  // Lanternas traseiras (TRASEIRA = -X) — duas vermelhas
  R(-L/2+1,-W/2+3,3,4,'#c02828');
  R(-L/2+1,W/2-7,3,4,'#c02828');
  R(-L/2+2,-W/2+4,2,2,'#ff5050');
  R(-L/2+2,W/2-6,2,2,'#ff5050');

  // --- Rodas (4 cantos) ---
  const rw=4,rh=5;
  R(-L/2+4,-W/2-2,rw,rh,'#111');
  R(L/2-8,-W/2-2,rw,rh,'#111');
  R(-L/2+4,W/2-3,rw,rh,'#111');
  R(L/2-8,W/2-3,rw,rh,'#111');
  // Aro
  R(-L/2+5,-W/2-1,2,3,'#444');
  R(L/2-7,-W/2-1,2,3,'#444');
  R(-L/2+5,W/2-2,2,3,'#444');
  R(L/2-7,W/2-2,2,3,'#444');

  }
  // Loot ainda no carro
  if(!v.looted){
    R(-2,-3,5,6,'#d9892b');
    R(-1,-2,3,2,'#e8a84a');
  }
  if(VK!=='car'&&!v.destroyed){const lk=vehDriverLook(v);if(lk)drawRider(VK,lk,L,W);}
  // Indicador discreto se ocupado (borda no teto, não parece luz)
  if(v.driverId){
    R(-3,-W/2,6,1,'#80ffa0');
  }
  // Carro destruído / fumegando
  if(v.destroyed){
    R(-L/2+2,-W/2+2,L-4,W-4,'rgba(0,0,0,.45)');
    R(-4,-2,8,4,'#333');
  } else if(v.dying){
    R(-2,-W/2-2,4,2,'#ff6020');
  }
  ctx.restore();
  // Barra de vida do carro (ao dirigir ou se já sofreu dano)
  if(!v.destroyed && (v.showHp>0 || (v.hp!==undefined && v.hp<(v.maxHp||100)) || v.dying)){
    const maxH=v.maxHp||100;
    const hp=Math.max(0,v.hp===undefined?maxH:v.hp);
    const bw=22, ratio=clamp(hp/maxH,0,1);
    R(v.x-bw/2,v.y-18,bw,3,'#220000');
    R(v.x-bw/2,v.y-18,Math.max(1,bw*ratio),3, ratio>0.5?'#40c060':ratio>0.25?'#e0a020':'#e04040');
    if(v.dying){
      ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
      ctx.fillStyle='#ff8040';
      ctx.fillText(Math.ceil(v.explodeT||0)+'s', v.x, v.y-22);
    }
  }
}
/* helicóptero militar caído (visto de cima): nariz para a esquerda, cauda para a direita.
   A caixa de colisão continua a mesma do avião antigo (70 x 32); pás e destroços ficam só de enfeite. */
function drawPlane(p){
  const x=p.x,y=p.y;
  shadow(x,y+10,30,14);
  // patins (um deles torto)
  R(x-24,y-14,34,2,'#25272b');R(x-24,y+12,34,2,'#25272b');
  R(x-15,y-14,2,28,'#25272b');R(x+3,y-14,2,28,'#25272b');
  R(x-27,y-12,3,2,'#25272b');R(x-27,y+10,3,2,'#25272b');
  // cabine
  R(x-26,y-10,34,20,'#4e5a3e');R(x-25,y-9,32,18,'#5f6c4a');
  R(x-30,y-6,4,12,'#4e5a3e');R(x-29,y-5,3,10,'#5f6c4a');
  R(x-25,y-9,32,2,'rgba(255,255,255,.12)');
  // para-brisa quebrado
  R(x-29,y-6,11,12,'#2c3a44');R(x-28,y-5,9,10,'#6aa4bc');R(x-28,y-5,9,3,'#8cc2d6');
  R(x-26,y-5,1,6,'#2c3a44');R(x-24,y-1,5,1,'#2c3a44');R(x-23,y-3,1,5,'#2c3a44');R(x-21,y+1,1,4,'#2c3a44');
  R(x-28,y+2,3,3,'#33444e');
  // porta aberta (caída ao lado)
  R(x-16,y+10,14,5,'#4e5a3e');R(x-15,y+11,12,3,'#6aa4bc');
  // marcas e listras
  R(x-14,y-1,9,2,'#d6d2bc');R(x-12,y+3,5,2,'#b89a3a');
  // motor / caixa de transmissão
  R(x-7,y-9,17,18,'#3b4430');R(x-6,y-8,15,16,'#46503a');
  R(x-4,y-6,2,12,'#2a3024');R(x,y-6,2,12,'#2a3024');R(x+4,y-6,2,12,'#2a3024');
  R(x+1,y-9,9,6,'#1c1c1a');R(x+2,y-8,7,4,'#2a2622');          // queimado
  // cauda
  R(x+9,y-4,22,8,'#4e5a3e');R(x+10,y-3,20,6,'#5f6c4a');
  R(x+9,y-4,22,1,'rgba(255,255,255,.12)');
  R(x+24,y-3,3,6,'#b89a3a');
  R(x+30,y-3,5,6,'#4e5a3e');R(x+31,y-9,4,18,'#46503a');R(x+31,y-9,4,2,'#c24a3a');
  R(x+35,y-6,1,12,'#25272b');R(x+34,y-1,3,2,'#25272b');       // rotor traseiro
  // rotor principal: cubo + pás (uma inteira, uma torta, uma quebrada)
  R(x-3,y-3,7,7,'#1c1e20');R(x-1,y-1,3,3,'#55595e');
  R(x,y-29,3,26,'#2a2d31');R(x,y-29,3,2,'#c24a3a');                                  // pá inteira para cima
  for(let k=0;k<20;k++)R(x+2+k*.9|0,y+2+k*.5|0,3,2,'#2a2d31');                       // pá torta para baixo e direita
  R(x+22,y+14,2,2,'#c24a3a');
  for(let k=0;k<10;k++)R(x-3-k,y+3+k*.6|0,2,2,'#2a2d31');                            // pá curta quebrada
  R(x-26,y+13,9,2,'#2a2d31');R(x-17,y+15,4,2,'#2a2d31');                            // pedaço da pá caído
  // destroços
  R(x-36,y-14,3,2,'#5f6c4a');R(x+38,y+9,4,3,'#46503a');R(x-20,y+19,3,2,'#25272b');R(x+18,y-18,3,2,'#25272b');R(x+36,y-16,2,2,'#c9a33a');
  // fogo baixo e fumaça subindo do motor
  if(Math.sin(T*9)>-.2){R(x+3,y-10,3,3,'#e8842a');R(x+4,y-11,2,2,'#ffd84a');}
  if(Math.sin(T*7+1.3)>.1){R(x+7,y-9,2,2,'#e8842a');}
  const sa=ctx.globalAlpha;
  for(let k=0;k<4;k++){
    const ph=((T*.6+k*.25)%1);
    ctx.globalAlpha=.85*(1-ph);
    R(x+5+Math.sin(T*2+k)*3+ph*6,y-12-ph*26,5+ph*5|0,5+ph*5|0,'#3a3a3c');
  }
  ctx.globalAlpha=sa;
  if(weather==='snow')R(x-26,y-10,34,3,'#e8f4f8');
}
/* ============ O OBSERVADOR (só na Floresta) ============
   Uma figura alta e sem rosto, parada em algum ponto da floresta à noite. O jogador a encontra ao andar (ela nunca surge do nada na frente dele).
   Não anda: teleporta, e só quando ninguém está olhando ou depois de ser observada por um bom tempo.
   Não ataca, não pode ser atacado e os zumbis o ignoram. Se o jogador tenta chegar perto, ele some.
   Cada jogador tem o seu próprio (não é sincronizado no multiplayer). Aparece de forma rara. */
const OBS={on:false,vis:false,x:0,y:0,alpha:1,life:0,view:0,seenTot:0,look:12,dist:0,glitch:0,cd:480,_t:0,drone:null};
function obsStopDrone(){
  const d=OBS.drone;OBS.drone=null;if(!d||!AC)return;
  try{const t=AC.currentTime;d.g.gain.cancelScheduledValues(t);d.g.gain.setValueAtTime(Math.max(.0001,d.g.gain.value),t);d.g.gain.linearRampToValueAtTime(.0001,t+1.2);
    for(const o of d.os)o.stop(t+1.3);}catch(e){}
}
function obsStartDrone(){
  if(!AC||OBS.drone)return;
  const vol=volFor('amb');if(vol<=0)return;
  try{
    const t=AC.currentTime,g=AC.createGain(),lp=AC.createBiquadFilter();
    lp.type='lowpass';lp.frequency.value=420;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.09*vol,t+3);
    const os=[];
    for(const [hz,v] of [[49,1],[51.3,.8],[98.5,.25]]){const o=AC.createOscillator(),og=AC.createGain();o.type='sine';o.frequency.value=hz;og.gain.value=v;o.connect(og);og.connect(lp);o.start(t);os.push(o);}
    const hi=AC.createOscillator(),hg=AC.createGain();hi.type='sine';hi.frequency.value=3900;hg.gain.value=.012;hi.connect(hg);hg.connect(g);hi.start(t);os.push(hi); // zumbido agudo, quase inaudível
    lp.connect(g);g.connect(AOUT);
    OBS.drone={g,os};
  }catch(e){}
}
function obsStatic(big){
  if(!AC||!nbuf)return;const vol=volFor('sfx');if(vol<=0)return;
  try{const t=AC.currentTime;
    gunNoise(t,big?.22:.14,'bandpass',2400,.5,.05*vol);
    gunNoise(t,big?.2:.12,'highpass',5200,.7,.025*vol);
    gunTone(t,.18,'sine',70,42,.07*vol);
  }catch(e){}
}
function obsSpotOk(x,y){return !(x<60||y<60||x>WW-60||y>WH-60||solidPoint(x,y,10)||bldAt(x,y)||pointInLake(x,y));}
/* ponto à vista (dentro da tela) a uma distância entre lo e hi do jogador */
function obsPickSpot(lo,hi){
  const hw=W/(2*Z)-16,hh=H/(2*Z)-26;
  for(let k=0;k<60;k++){
    const a=Math.random()*6.283,d=lo+Math.random()*(hi-lo);
    const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d*.85;
    if(Math.abs(x-P.x)>hw||Math.abs(y-P.y)>hh)continue;
    if(!obsSpotOk(x,y)||Math.hypot(x-P.x,y-P.y)<lo)continue;
    return {x:Math.round(x),y:Math.round(y)};
  }
  return null;
}
/* ponto FORA da tela, de preferência na direção em que o jogador anda: ele é encontrado, não aparece do nada */
function obsPickAhead(){
  const hw=W/(2*Z)+28,hh=H/(2*Z)+34,base=P.moving?P.face:Math.random()*6.283;
  for(let k=0;k<80;k++){
    const a=base+(Math.random()-.5)*(P.moving?1.5:6.283),d=260+Math.random()*150;
    const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
    if(Math.abs(x-P.x)<hw&&Math.abs(y-P.y)<hh)continue;       // tem que estar fora da tela
    if(!obsSpotOk(x,y))continue;
    return {x:Math.round(x),y:Math.round(y)};
  }
  return null;
}
function obsOnScreen(){return Math.abs(OBS.x-P.x)<W/(2*Z)&&Math.abs(OBS.y-P.y)<H/(2*Z)+8;}
function obsVanish(){
  if(!OBS.on)return;
  const vis=OBS.vis;
  OBS.on=false;OBS.vis=false;OBS.cd=900+Math.random()*700;
  if(vis){OBS.glitch=.4;obsStatic(true);}
  obsStopDrone();
}
function observerReset(){OBS.on=false;OBS.vis=false;OBS.alpha=1;OBS.glitch=0;OBS.cd=480+Math.random()*320;obsStopDrone();}
function updateObserver(dt){
  if(OBS._t>T+.5)observerReset();OBS._t=T;
  if(OBS.glitch>0)OBS.glitch=Math.max(0,OBS.glitch-dt);
  if(!P||P.dead||state!=='play'){if(OBS.on){OBS.on=false;OBS.vis=false;obsStopDrone();}return;}
  if(!OBS.on){
    OBS.cd-=dt;
    if(OBS.cd>0)return;
    if(!P.inside&&!P.inVehicle&&Math.random()<.3){
      const sp=obsPickAhead();
      if(sp){OBS.on=true;OBS.vis=false;OBS.x=sp.x;OBS.y=sp.y;OBS.alpha=1;OBS.life=150+Math.random()*110;OBS.view=0;OBS.seenTot=0;OBS.look=10+Math.random()*6;return;}
    }
    OBS.cd=60+Math.random()*60;return;
  }
  OBS.life-=dt;
  OBS.dist=Math.hypot(OBS.x-P.x,OBS.y-P.y);
  const onS=!P.inside&&obsOnScreen();
  if(OBS.dist<98&&onS){obsVanish();return;}                     // chegou perto: some
  if(P.inside||P.inVehicle){ if(onS)obsVanish(); else OBS.on=false; return; }
  if(onS){
    if(!OBS.vis){OBS.vis=true;OBS.view=0;obsStartDrone();}      // acabou de ser avistado
    OBS.view+=dt;OBS.seenTot+=dt;
    if(OBS.view>=OBS.look){                                       // olhou tempo demais: teleporta para um pouco mais perto
      const lo=Math.max(106,OBS.dist-28),sp=obsPickSpot(lo,Math.max(lo+16,OBS.dist+6));
      if(sp){OBS.x=sp.x;OBS.y=sp.y;OBS.glitch=.3;obsStatic(false);}
      OBS.view=0;OBS.look=10+Math.random()*8;
    }
    if(OBS.seenTot>55){obsVanish();return;}
  }else{
    if(OBS.vis){OBS.vis=false;obsStopDrone();}                  // saiu da tela: fica parado lá
    if(OBS.life<=0){OBS.on=false;OBS.cd=900+Math.random()*700;return;}   // ficou para trás: sai de cena sem ninguém ver
    if(OBS.dist>520){const sp=obsPickAhead();if(sp){OBS.x=sp.x;OBS.y=sp.y;}} // o jogador se afastou: ele reaparece à frente, fora da tela
  }
}


/* ============ DORMIR (camas, camas de casal e barraca) ============
   Só à noite (dark>=.5). Em dupla, a noite só passa quando TODOS os jogadores vivos estão deitados (o Host decide e avisa o convidado).
   Ao amanhecer: vida e energia recuperam, fome e sede caem um pouco e o clima abre. Não dá para dormir sangrando, com fome/sede demais ou com zumbi por perto. */
const SLC={t:0,b:1,l:2,r:3},SLI=['t','b','l','r'],SLEEP_BED={bed:1,bed2:2,bunk:1};
const SLP={fade:0,total:1,asleep:1};
function nearTent(x,y,r){for(const t of tents)if(Math.hypot(t.x-x,t.y-y)<r)return true;return false;}
function tentSpot(){
  if(P.inside||bldAt(P.x,P.y))return null;
  for(const m of [22,14]){
    for(const d of [40,52,64]){
      for(const da of [0,.6,-.6,1.2,-1.2,1.9,-1.9,3.14]){
        const a=(P.face||0)+da,x=Math.round(P.x+Math.cos(a)*d),y=Math.round(P.y+Math.sin(a)*d);
        if(x<40||y<40||x>WW-40||y>WH-40)continue;
        if(solidPoint(x,y,m)||pointInLake(x,y+12))continue;
        if(selectedMap==='city'&&onCityRoad(x,y,24))continue;
        if(tents.some(t=>Math.hypot(t.x-x,t.y-y)<56))continue;
        return {x,y};
      }
    }
  }
  return null;
}
function tentSlots(t){return [{x:t.x-5,y:t.y-2,s:'t',hx:0,hy:-4,tent:1},{x:t.x+5,y:t.y-2,s:'t',hx:0,hy:-4,tent:1}];}
function bedSlots(f){
  const n=SLEEP_BED[f.k],out=[],horiz=(f.s==='t'||f.s==='b');
  for(let i=0;i<n;i++){
    const fr=n===1?.5:(i+.5)/n;let x,y,hx=0,hy=0;
    if(horiz){x=f.x+f.w*fr;y=f.y+f.h/2;hy=f.s==='t'?-(f.h/2-4):(f.h/2-4);}
    else{y=f.y+f.h*fr;x=f.x+f.w/2;hx=f.s==='l'?-(f.w/2-4):(f.w/2-4);}
    out.push({x:Math.round(x),y:Math.round(y),s:f.s,hx:Math.round(hx),hy:Math.round(hy)});
  }
  return out;
}
function slotTaken(sl){
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.sl&&rp.alive!==false&&Math.hypot(rp.x-sl.x,rp.y-sl.y)<7)return true;}
  return false;
}
function findSleepSpot(){
  if(!P||P.dead||P.inVehicle)return null;
  let best=null,bd=1e9;
  const b=P.inside;
  if(b&&b.furn)for(const f of b.furn){
    if(!SLEEP_BED[f.k])continue;
    const dx=Math.max(f.x-P.x,0,P.x-f.x-f.w),dy=Math.max(f.y-P.y,0,P.y-f.y-f.h),d=Math.hypot(dx,dy);
    if(d<22&&d<bd){bd=d;best={ref:f,slots:bedSlots(f)};}
  }
  for(const t of tents){const d=Math.hypot(t.x-P.x,t.y-P.y);if(d<40&&d<bd){bd=d;best={ref:t,slots:tentSlots(t),tent:true};}}
  if(!best)return null;
  const free=best.slots.filter(sl=>!slotTaken(sl));
  if(!free.length){best.full=true;return best;}
  free.sort((a,c)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(c.x-P.x,c.y-P.y));
  best.slot=free[0];
  return best;
}
function sleepBlock(){
  if(dark<.5)return 'Você só consegue dormir à noite';
  if(P.bleed)return 'Estanque o sangramento antes de dormir';
  if(P.food<15)return 'Fome demais para dormir';
  if(P.water<15)return 'Sede demais para dormir';
  for(const z of zombies)if(!z.dead&&Math.hypot(z.x-P.x,z.y-P.y)<150)return 'Há zumbis por perto';
  if(GH.on)return 'Algo não está certo aqui...';
  return null;
}
function trySleep(sp){
  if(sp.full){toast('Esta cama já está ocupada');return;}
  const why=sleepBlock();
  if(why){toast(why);beep(150,.1,'square',.04);return;}
  const sl=sp.slot;
  if(P.fish)cancelFishing();
  P.sleeping={s:sl.s,hx:sl.hx,hy:sl.hy,tent:!!sp.tent,ref:sp.ref,x:sl.x,y:sl.y,t:0};
  P.x=sl.x;P.y=sl.y;P.moving=false;P.sprint=false;atkHeld=false;sprintHeld=false;
  beep(300,.15,'sine',.03,-60);
}
function wakeSpotOk(x,y){
  const b=P.inside;
  if(b){
    if(x<b.x+8||x>b.x+b.w-8||y<b.y+8||y>b.y+b.h-8)return false;
    for(const f of b.furn)if(x>f.x-4&&x<f.x+f.w+4&&y>f.y-4&&y<f.y+f.h+4)return false;
    for(const w of b.walls)if(x>w.x-4&&x<w.x+w.w+4&&y>w.y-4&&y<w.y+w.h+4)return false;
    return true;
  }
  return !solidPoint(x,y,10);
}
function wakeUp(quiet){
  const sl=P&&P.sleeping;if(!sl)return;
  P.sleeping=null;
  let c=[];
  if(sl.tent){const t=sl.ref,sx=sl.x<t.x?-1:1;c=[[t.x+sx*10,t.y+22],[t.x+sx*10,t.y+32],[t.x+sx*32,t.y+8],[t.x-sx*10,t.y+24]];}
  else{
    const f=sl.ref,o=9,m={t:[sl.x,f.y+f.h+o],b:[sl.x,f.y-o],l:[f.x+f.w+o,sl.y],r:[f.x-o,sl.y]}[sl.s];
    c=[m,[f.x+f.w+o,f.y+f.h/2],[f.x-o,f.y+f.h/2],[f.x+f.w/2,f.y+f.h+o],[f.x+f.w/2,f.y-o]];
  }
  for(const q of c)if(wakeSpotOk(q[0],q[1])){P.x=q[0];P.y=q[1];break;}
  if(!quiet)beep(400,.08,'sine',.03,60);
}
function sleepTick(dt){
  P.moving=false;P.sprint=false;
  survivalTick(dt);
  if(P.dead)return;
  P.stam=Math.min(P._scap||100,P.stam+30*dt);
  if(joy.active&&Math.hypot(joy.x,joy.y)>.45)wakeUp(false);
}
function sleepUpdate(dt){
  if(!P||P.dead||!P.sleeping){SLP.fade=Math.max(0,SLP.fade-dt*1.5);return;}
  const sl=P.sleeping;sl.t+=dt;SLP.fade=Math.min(1,sl.t/1.4);
  if(dark<.45){wakeUp(true);toast('Amanheceu');return;}
  let others=0,asleep=0,ready=true;
  if(MP.active&&MP.conn&&MP.conn.open&&!(MP.isHost&&MP.guestAway)){
    const now=performance.now();
    for(const id in remotePlayers){
      const rp=remotePlayers[id];if(!rp||rp.alive===false)continue;
      others++;if(rp.sl){asleep++;if(now-(rp.slT||0)<1300)ready=false;}
    }
  }
  SLP.total=others+1;SLP.asleep=asleep+1;
  if(sl.t<1.5)return;
  if(others===0){sleepDo();return;}
  if(MP.isHost&&asleep===others&&ready)sleepDo();   // todos deitados: o Host passa a noite
}
function sleepDo(){
  const hr=START_HOUR+T/DAY_SECONDS*24,h24=hr%24;
  let target=Math.floor(hr/24)*24+6;if(h24>=6)target+=24;
  const nT=(target-START_HOUR)/24*DAY_SECONDS;
  weather='none';setRain(false);weatherTimer=rnd(120,240);
  const who=[P];for(const id in remotePlayers){const r=remotePlayers[id];if(r&&r.alive!==false)who.push(r);}
  zombies=zombies.filter(z=>z.dead||who.some(k=>Math.hypot(k.x-z.x,k.y-z.y)<380));   // os que estavam longe sumiram durante a noite
  if(MP.active&&MP.isHost)sendEvt('sleepSkip',{T:nT});
  sleepSkipApply(nT);
  if(MP.active&&MP.isHost&&MP.conn&&MP.conn.open){try{MP.conn.send(packSnapshot());}catch(e){}}
}
function sleepSkipApply(nT){
  const oldDay=day;
  if(nT>T){rgAccT+=nT-T;rgAccR+=nT-T;}   // a noite dormida também conta para a regeneração do mapa
  T=nT;
  const hr=START_HOUR+T/DAY_SECONDS*24,nd=Math.floor(hr/24)+1;
  day=nd;update._lastDay=nd;dark=darkness(hr%24);
  if(nd>oldDay)dayAdvanced(nd-oldDay);
  P.hp=Math.min(100,P.hp+22);P.food=Math.max(8,P.food-10);P.water=Math.max(8,P.water-14);
  P.stam=100;P.exhausted=false;P.sick=0;P.temp=(P.temp||0)*.35;
  wakeUp(true);SLP.fade=1;
  toast('Você dormiu bem. Amanheceu!');
  beep(520,.12,'sine',.04,80);setTimeout(()=>beep(700,.14,'sine',.04),120);
}
function drawSleeper(x,y,sl,look){
  const hx=Math.round(x+sl.hx),hy=Math.round(y+sl.hy);
  R(hx-3,hy-3,6,6,look.skin);R(hx-3,hy-3,6,2,look.hair);R(hx-2,hy+1,4,1,'rgba(30,20,20,.45)');
  if(sl.s==='t')R(hx-4,hy+3,8,3,look.shirt);else if(sl.s==='b')R(hx-4,hy-6,8,3,look.shirt);
  else if(sl.s==='l')R(hx+3,hy-4,3,8,look.shirt);else R(hx-6,hy-4,3,8,look.shirt);
  ctx.save();ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
  for(let i=0;i<3;i++){const ph=(T*.7+i*.33)%1;ctx.globalAlpha=Math.sin(ph*3.14)*.9;ctx.fillStyle='#e8e0cc';ctx.fillText('z',hx+6+ph*7,hy-5-ph*14);}
  ctx.restore();
}
function drawTent(t){
  const x=Math.round(t.x),y=Math.round(t.y);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y+3,26,6,0,0,6.283);ctx.fill();
  for(let r=0;r<22;r++){
    const half=3+Math.round(r*.95),edge=r%7===6;
    R(x-half,y-24+r,half,1,edge?'#4a6a3c':'#6d8f56');R(x,y-24+r,half,1,edge?'#33502c':'#4d7040');
  }
  R(x-1,y-26,2,3,'#a9c48a');
  for(let r=8;r<22;r++){const dh=Math.round(1+(r-8)*.9);R(x-dh,y-24+r,dh*2,1,'#14181a');}          // entrada
  R(x-8,y-9,6,6,'#8a3a3a');R(x-8,y-9,6,2,'#d6d2c4');R(x+2,y-9,6,6,'#3a5a8a');R(x+2,y-9,6,2,'#d6d2c4');  // dois sacos de dormir
  R(x-25,y-1,2,3,'#5a3a24');R(x+23,y-1,2,3,'#5a3a24');
  if(P.sleeping&&P.sleeping.ref===t)drawSleeper(P.x,P.y,P.sleeping,myLook());
  for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.sl&&rp.sl.tent&&rp.alive!==false&&Math.hypot(rp.x-t.x,rp.y-t.y)<40)drawSleeper(rp.x,rp.y,rp.sl,remoteLook(rp));}
}
function sleepFx(){
  if(!P||!(SLP.fade>.01))return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='rgba(2,3,14,'+(.95*SLP.fade).toFixed(3)+')';ctx.fillRect(0,0,W,H);
  if(P.sleeping&&SLP.fade>.55){
    ctx.globalAlpha=Math.min(1,(SLP.fade-.55)*2.5);ctx.textAlign='center';
    ctx.fillStyle='#E8E0CC';ctx.font='bold 20px "Courier New",monospace';ctx.fillText('Z z z',W/2,H/2-6+Math.sin(T*2)*3);
    ctx.fillStyle='#8DA568';ctx.font='bold 10px "Courier New",monospace';
    ctx.fillText(SLP.total>1?'Dormindo... '+SLP.asleep+'/'+SLP.total+(SLP.asleep<SLP.total?'  aguardando o parceiro':''):'Dormindo...',W/2,H/2+18);
    ctx.fillStyle='rgba(232,224,204,.65)';ctx.font='8px "Courier New",monospace';ctx.fillText('Use LEVANTAR para acordar',W/2,H/2+34);
  }
  ctx.restore();
}
/* ============ ESPÍRITO (inspirado em Sadako) ============
   Só em algumas casas (sorteio fixo pela semente do mundo: os dois jogadores têm as mesmas casas assombradas).
   Ao pisar no cômodo assombrado: escuridão rápida, ruído e a aparição à frente (sem nada pular na tela), -25 de vida.
   Quem ficar no cômodo por tempo demais é pego (o tempo nunca é mostrado nem sugerido). Sair do cômodo a faz sumir.
   Cada cômodo assombra uma vez só e há um intervalo longo entre aparições. Cada jogador vive isso no seu próprio jogo. */
const GH={on:false,b:null,r:null,key:'',x:0,y:0,t:0,dark:0,kill:0,cd:150,_t:0,statT:2,hbT:1,wet:[]};
const GH_STALK=5, GH_COOLDOWN=240;
function ghHash(b,k){const v=Math.sin((worldSeed||1)*12.9898+b.x*78.233+b.y*37.719+k*11.13)*43758.5453;return v-Math.floor(v);}
function hauntOf(b){
  if(b._h!==undefined)return b._h;
  b._h=null;
  const ty=b.type;
  if(!(ty==='house'||ty==='cabin'||ty==='apartment')||!b.rooms||b.rooms.length<3)return null;
  if(ghHash(b,1)>=(ty==='cabin'?.10:.15))return null;
  const dx=b.doorX+(b.door||20)/2,dy=b.y+b.h-WT-4;
  const c=[];
  b.rooms.forEach((r,i)=>{
    const entry=dx>=r.x-3&&dx<=r.x+r.w+3&&dy>=r.y-3&&dy<=r.y+r.h+3;
    if(!entry&&r.w*r.h>=1500)c.push(i);
  });
  if(!c.length)return null;
  const i=c[Math.floor(ghHash(b,2)*c.length)%c.length];
  b._h={i,room:b.rooms[i],key:(b.x|0)+','+(b.y|0)+','+i};
  return b._h;
}
function ghSfx(kind){
  if(!AC||!nbuf)return;const vol=volFor('sfx');if(vol<=0)return;
  try{const t=AC.currentTime;
    if(kind==='scare'){
      gunNoise(t,.5,'bandpass',1800,.6,.08*vol);
      gunNoise(t,.35,'highpass',5000,.7,.05*vol);
      gunTone(t,.9,'sawtooth',740,1180,.05*vol);gunTone(t,.9,'sawtooth',784,1240,.045*vol);
      gunTone(t,.7,'sine',58,30,.14*vol);
    }else if(kind==='kill'){
      gunNoise(t,.7,'bandpass',2600,.5,.11*vol);
      gunTone(t,.7,'sawtooth',1000,260,.08*vol);gunTone(t,.7,'square',930,200,.04*vol);
      gunTone(t,.8,'sine',50,26,.16*vol);
    }else if(kind==='gone'){obsStatic(true);}
  }catch(e){}
}
function ghReset(){GH.on=false;GH.b=null;GH.kill=0;GH.dark=0;GH.cd=150;}
function ghInRoom(r,x,y,m){return x>=r.x-m&&x<=r.x+r.w+m&&y>=r.y-m&&y<=r.y+r.h+m;}
function ghPlace(r){
  const base=P.moving?P.face:(P.face||0);
  for(const da of [0,.7,-.7,1.4,-1.4,2.1,-2.1,3.14]){
    for(const d of [52,44,64,36]){
      const a=base+da,x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d*.8;
      if(ghInRoom(r,x,y,-10))return {x:Math.round(x),y:Math.round(y)};
    }
  }
  return {x:Math.round(r.x+r.w/2),y:Math.round(r.y+r.h/2)};
}
function updateGhost(dt){
  if(GH._t>T+.5)ghReset();GH._t=T;
  if(!P||P.dead){if(GH.on){GH.on=false;GH.kill=0;GH.dark=0;}return;}
  if(state!=='play')return;
  if(GH.dark>0)GH.dark=Math.max(0,GH.dark-dt);
  if(!GH.on){
    GH.cd-=dt;
    if(GH.cd>0||!P.inside||P.inVehicle)return;
    const h=hauntOf(P.inside);if(!h)return;
    P.hd=P.hd||[];if(P.hd.includes(h.key))return;
    if(!ghInRoom(h.room,P.x,P.y,-8))return;
    // aparição
    P.hd.push(h.key);GH.cd=GH_COOLDOWN;
    const sp=ghPlace(h.room);
    GH.on=true;GH.b=P.inside;GH.r=h.room;GH.key=h.key;GH.x=sp.x;GH.y=sp.y;GH.t=0;GH.kill=0;GH.dark=.55;GH.statT=1.1;GH.hbT=.6;
    P.hp=Math.max(1,P.hp-25);flash=.7;shake=7;
    ghSfx('scare');
    return;
  }
  // em cena
  if(GH.kill>0){
    GH.kill+=dt;
    if(GH.kill>=.5){GH.on=false;GH.kill=0;P._ghostKill=true;die();}
    return;
  }
  if(P.inside!==GH.b||P.inVehicle||!ghInRoom(GH.r,P.x,P.y,2)){ // saiu do cômodo: ela some
    GH.on=false;GH.dark=0;ghSfx('gone');return;
  }
  GH.t+=dt;
  GH.statT-=dt;if(GH.statT<=0){GH.statT=.9+Math.random()*1.8;obsStatic(false);}
  GH.hbT-=dt;if(GH.hbT<=0){GH.hbT=.85;heartbeat();}
  if(GH.t>=GH_STALK){                              // ela avança de uma vez
    GH.kill=.001;GH.x=P.x;GH.y=P.y;flash=1;shake=10;ghSfx('kill');
  }
}
function drawGhost(){if(GH.on)drawGhostAt(GH.x,GH.y,GH.kill>0);}
function drawGhostAt(gx,gy,kill){
  const sc=kill?2.2:1.25;
  let x=gx+Math.sin(T*1.7)*.8,y=gy;
  const jit=Math.random()<.05?(Math.random()<.5?-2:2):0;
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));ctx.scale(sc,sc);
  ctx.globalAlpha=kill?1:(Math.sin(T*37)>.93?.5:.93);
  // poça d'água (ela vem do poço)
  ctx.fillStyle='rgba(30,55,80,.55)';ctx.beginPath();ctx.ellipse(0,1,9,3,0,0,6.283);ctx.fill();
  const W_='#ecebea',W2='#c9c8cc',SK='#d6d3cc',HR='#09090b',HR2='#1b1b20';
  R(-3,-4,2,4,SK);R(1,-4,2,4,SK);                               // pés pálidos
  R(-4+jit,-22,8,6,W_);R(-5+jit,-17,10,8,W_);R(-6,-10,12,7,W_);R(-7,-4,14,2,W2);  // vestido branco
  R(-2,-20,1,14,W2);R(2,-18,1,12,W2);R(-5,-9,1,6,W2);R(4,-8,1,5,W2);           // dobras
  R(-8,-22,2,16,SK);R(6,-22,2,16,SK);R(-9,-7,3,3,SK);R(6,-7,3,3,SK);          // braços longos caídos
  R(-9,-4,1,2,HR);R(-7,-4,1,2,HR);R(6,-4,1,2,HR);R(8,-4,1,2,HR);               // dedos
  R(-5+jit,-31,10,5,HR);R(-6+jit,-27,12,15,HR);R(-5,-13,10,3,HR);              // cabelo cobrindo o rosto
  R(-3,-29,1,16,HR2);R(1,-28,1,15,HR2);R(4,-26,1,12,HR2);R(-5,-25,1,11,HR2);
  R(-1+jit,-24,3,3,'#f6f3e6');R(0+jit,-23,1,1,'#050505');                       // um olho entre os fios
  ctx.restore();
}
function ghostFx(){
  if(!GH.on)return;
  if(GH.dark>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,GH.dark*3.2).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.22,W/2,H/2,Math.max(W,H)*.62);
  g.addColorStop(0,'rgba(10,20,30,0)');g.addColorStop(1,'rgba(0,0,8,.55)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(60,90,130,.05)';ctx.fillRect(0,0,W,H);
  const st=GH.t<.7?1-GH.t/.7:0;
  const n=GH.kill>0?14:(st>0?Math.round(10*st):(Math.random()<.04?4:0));
  for(let i=0;i<n;i++){ctx.fillStyle=Math.random()<.5?'rgba(255,255,255,.16)':'rgba(0,0,0,.35)';ctx.fillRect(0,Math.random()*H,W,1+Math.random()*3);}
  if(GH.kill>0){ctx.fillStyle='rgba(255,255,255,'+Math.max(0,.9-GH.kill*1.6).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
}
function drawObserver(o){
  const x=Math.round(o.x),y=Math.round(o.y);
  let a=o.alpha;
  if(o.glitch>0)a*=Math.random()<.5?.35:1;
  else if(Math.sin(T*31+o.x)>.985)a*=.45;                        // tremida rara
  const sa=ctx.globalAlpha;ctx.globalAlpha=a;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y+1,6,2.5,0,0,6.283);ctx.fill();
  const tw=Math.sin(T*23)>.96?2:0,K='#0b0b0d',K2='#15151a';
  R(x-2,y-13,2,13,K);R(x+1,y-13,2,13,K);                           // pernas
  R(x-3,y-1,3,1,K);R(x+1,y-1,3,1,K);
  R(x-4+tw,y-26,8,14,K2);R(x-3+tw,y-25,6,12,K);                    // terno
  R(x-1+tw,y-26,2,6,'#d4d4d0');R(x+tw,y-24,1,9,'#5a0f12');         // camisa e gravata
  R(x-6+tw,y-25,2,19,K);R(x+4+tw,y-25,2,19,K);                     // braços longos
  R(x-6+tw,y-6,2,3,'#cfcfca');R(x+4+tw,y-6,2,3,'#cfcfca');         // mãos pálidas
  R(x-3+tw*2,y-34,6,9,'#ecece6');R(x+1+tw*2,y-34,2,9,'#cfcfca');   // cabeça sem rosto
  R(x-3+tw*2,y-34,6,1,'#f8f8f4');
  ctx.globalAlpha=sa;
}
function lakeShorePath(l, scale, c, sx, ox, oy){
  // Contorno orgânico único (não empilha círculos). Mesmo formato da colisão (lakeWobble).
  // c/sx/ox/oy: contexto e escala/offset opcionais (minimapa).
  c=c||ctx; sx=sx||1; ox=ox||0; oy=oy||0;
  const N=72, cx=l.cx, cy=l.cy, R0=l.r*(scale||1);
  c.beginPath();
  for(let i=0;i<=N;i++){
    const ang=i/N*6.283;
    const wobble=lakeWobble(l,ang);
    const px=(cx+Math.cos(ang)*R0*wobble)*sx+ox;
    const py=(cy+Math.sin(ang)*R0*wobble*0.92)*sx+oy; // levemente oval
    if(i===0) c.moveTo(px,py); else c.lineTo(px,py);
  }
  c.closePath();
}
function drawFountain(l){
  const cx=Math.round(l.cx),cy=Math.round(l.cy),r=l.r;
  const E=(rx,ry,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,6.283);ctx.fill();};
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(cx+2,cy+3,r*1.38,r*1.3*.92,0,0,6.283);ctx.fill();
  E(r*1.32,r*1.32*.92,'#8a8c90');           // calçada de pedra
  E(r*1.22,r*1.22*.92,'#6b6e74');
  E(r*1.1,r*1.1*.92,'#b4b6ba');             // borda do tanque
  E(r*.98,r*.98*.92,'#2a88b0');             // água
  E(r*.8,r*.8*.92,'#4ab0d0');
  ctx.strokeStyle='rgba(200,240,255,.35)';ctx.lineWidth=1;
  for(let k=0;k<2;k++){ctx.beginPath();ctx.ellipse(cx,cy,r*(.5+.2*k)+Math.sin(T*2+k)*1.5,r*(.5+.2*k)*.92,0,0,6.283);ctx.stroke();}
  for(let i=0;i<8;i++){const a=i*.785;R(cx+Math.cos(a)*r*1.16-1,cy+Math.sin(a)*r*1.16*.92-1,3,2,'#9a9ca0');}  // tijolos da borda
  R(cx-5,cy-3,10,6,'#8e9096');R(cx-3,cy-9,6,8,'#a8aaae');R(cx-2,cy-12,4,4,'#c4c6ca');  // pedestal em camadas
  for(let j=0;j<5;j++){                                                                // jatos de água
    const t=(T*1.6+j*.2)%1,a=(j-2)*.45;
    const px=cx+Math.sin(a)*t*16,py=cy-12-Math.sin(t*3.14)*13+t*t*6;
    R(Math.round(px),Math.round(py),2,2,'#d8f2ff');
  }
  R(cx-1,cy-18,2,6,'#bfe8ff');
}
function drawLake(l){
  if(l.fountain){drawFountain(l);return;}
  const frozen=!!l.frozen || selectedMap==='snow';
  const cx=l.cx, cy=l.cy, R0=l.r;
  // 1) Areia / lama da margem (anel externo)
  ctx.fillStyle=frozen?'#b8c8d4':(selectedMap==='forest'?'#6a7a48':(selectedMap==='desert'?'#d8c48e':'#7a6a4a'));
  lakeShorePath(l, 1.12);
  ctx.fill();
  // 2) Água principal com gradiente radial
  lakeShorePath(l, 1.0);
  const g=ctx.createRadialGradient(cx-R0*0.15,cy-R0*0.2,R0*0.1,cx,cy,R0*1.05);
  if(frozen){
    g.addColorStop(0,'#9ec8e0');g.addColorStop(0.45,'#6aa0c0');g.addColorStop(1,'#3a6a88');
  } else {
    g.addColorStop(0,'#4ab0d0');g.addColorStop(0.35,'#2a88b0');g.addColorStop(0.7,'#1a6088');g.addColorStop(1,'#0e3a58');
  }
  ctx.fillStyle=g;ctx.fill();
  // 3) Faixa de água rasa perto da margem
  ctx.strokeStyle=frozen?'rgba(220,240,255,.35)':'rgba(120,200,220,.28)';
  ctx.lineWidth=Math.max(4,R0*0.06);
  lakeShorePath(l, 0.97);ctx.stroke();
  // 4) Ondulações suaves (linhas, não círculos concêntricos)
  ctx.strokeStyle=frozen?'rgba(255,255,255,.2)':'rgba(180,230,255,.18)';
  ctx.lineWidth=1.5;
  if(frozen)drawIceCracks(l);
  else for(let k=0;k<3;k++){
    const yy=cy-R0*0.35+k*R0*0.28+Math.sin(T*1.2+k)*3;
    ctx.beginPath();
    for(let x=cx-R0*0.7;x<=cx+R0*0.7;x+=6){
      const dx=(x-cx)/R0;
      if(dx*dx>0.55) continue;
      const wave=Math.sin(x*0.08+T*2.5+k)*4 + Math.sin(x*0.03-T)*2;
      if(x===cx-R0*0.7) ctx.moveTo(x,yy+wave); else ctx.lineTo(x,yy+wave);
    }
    ctx.stroke();
  }
  // 5) Reflexo de luz
  ctx.fillStyle='rgba(255,255,255,'+(0.08+0.05*Math.sin(T*1.5)).toFixed(2)+')';
  ctx.beginPath();
  ctx.ellipse(cx-R0*0.2, cy-R0*0.25, R0*0.35, R0*0.12, -0.4, 0, 6.283);
  ctx.fill();
  lakeGlints(l);
  // 6) Ilhas
  if(l.islands)for(const isl of l.islands){
    ctx.fillStyle=frozen?'#d8e4ee':'#4a6a38';
    ctx.beginPath();ctx.ellipse(isl.x,isl.y,isl.r*1.1,isl.r*0.85,0.2,0,6.283);ctx.fill();
    if(!frozen){
      ctx.fillStyle='#5a8a48';ctx.beginPath();ctx.ellipse(isl.x-1,isl.y-1,isl.r*0.7,isl.r*0.55,0,0,6.283);ctx.fill();
      R(isl.x-1,isl.y-isl.r-3,2,5,'#5a3d22');R(isl.x-4,isl.y-isl.r-7,8,4,'#2a6a2a');
    } else {
      ctx.fillStyle='#eef4f8';ctx.beginPath();ctx.ellipse(isl.x,isl.y-1,isl.r*0.5,isl.r*0.35,0,0,6.283);ctx.fill();
    }
  }
  // 7a) Oásis: juncos na borda
  if(!frozen && selectedMap==='desert'){
    for(let i=0;i<14;i++){
      const ang=(i/14)*6.283+(cx%7)*0.1, rr=R0*(0.98+0.05*Math.sin(i*2.3));
      const px=cx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr*0.92;
      ctx.fillStyle='#5a8a3a';R(px-1,py-6,2,6);R(px+1,py-5,2,5);
    }
  }
  // 7) Vegetação na beira (juncos / pedras) — só floresta
  if(!frozen && selectedMap==='forest'){
    const N=18;
    for(let i=0;i<N;i++){
      const ang=(i/N)*6.283 + (cx%7)*0.1;
      const rr=R0*(0.95+0.06*Math.sin(i*2.7));
      const px=cx+Math.cos(ang)*rr, py=cy+Math.sin(ang)*rr*0.92;
      if(i%3===0){
        ctx.fillStyle='#3a6a30';R(px-1,py-5,2,6);R(px-3,py-6,3,2);
      } else if(i%3===1){
        ctx.fillStyle='#6a6a68';ctx.beginPath();ctx.arc(px,py,2.2,0,6.283);ctx.fill();
      }
    }
    // Vitórias-régias esparsas
    if(l.pads)for(const pad of l.pads){
      if(Math.hypot(pad.x-cx,pad.y-cy)>R0*0.85) continue;
      ctx.fillStyle='#2a6a3a';ctx.beginPath();ctx.ellipse(pad.x,pad.y,pad.r*1.4,pad.r*1.0,0,0,6.283);ctx.fill();
      ctx.fillStyle='#e8a0b8';ctx.beginPath();ctx.arc(pad.x+1,pad.y,1.2,0,6.283);ctx.fill();
    }
  }
  // 8) Gelo rachado (neve)
  if(frozen&&l.frozen&&!l.fountain)drawIcePatch(l);
  if(frozen){
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;
    for(let i=0;i<5;i++){
      const a=i*1.2+(cx%5);
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*R0*0.2, cy+Math.sin(a)*R0*0.2);
      ctx.lineTo(cx+Math.cos(a)*R0*0.75, cy+Math.sin(a)*R0*0.7);
      ctx.stroke();
    }
  }
}
function drawItem(it,near){
  const x=Math.round(it.x),y=Math.round(it.y),b=Math.round(Math.sin(T*3+it.x));
  shadow(x,y,4,2);
  const _ic=ITEMS[it.t]&&ITEMS[it.t].e?pxCanvas(ITEMS[it.t].e):null;
  if(_ic){ctx.imageSmoothingEnabled=false;ctx.drawImage(_ic,x-(_ic.width>>1),y-_ic.height+1+b);}
  else switch(it.t){
    case'food':R(x-3,y-6+b,6,6,'#c9772b');R(x-3,y-6+b,6,2,'#e8e8e8');break;
    case'fish':R(x-5,y-4+b,10,5,'#40a0e0');R(x+2,y-3+b,2,3,'#206090');break;
    case'cookedfish':R(x-5,y-4+b,10,5,'#c07840');R(x+2,y-3+b,2,3,'#804020');R(x-3,y-5+b,2,1,'#ffe0a0');break;
    case'meat':R(x-4,y-5+b,8,6,'#a04040');R(x-3,y-6+b,6,2,'#c06060');break;
    case'cookedmeat':R(x-4,y-5+b,8,6,'#8a4a28');R(x-3,y-6+b,6,2,'#c07040');R(x-2,y-4+b,2,1,'#ffe0a0');break;
    case'wood':R(x-5,y-3+b,10,4,'#8a5a2a');R(x-3,y-5+b,6,2,'#a07040');break;
    case'stone':R(x-4,y-5+b,8,7,'#9a9aa0');R(x-2,y-7+b,4,3,'#c0c0c8');break;
    case'water':R(x-2,y-8+b,4,2,'#dddddd');R(x-3,y-6+b,6,7,'#4aa3e8');break;
    case'cloth':R(x-5,y-5+b,10,6,'#b8b090');R(x-3,y-5+b,2,6,'#8a8468');R(x+2,y-3+b,2,1,'#8a8468');R(x-5,y+1+b,2,1,'#b8b090');R(x+1,y+1+b,2,1,'#b8b090');break;
    case'bandage':R(x-4,y-5+b,8,5,'#f2f2f2');R(x-1,y-5+b,2,5,'#dd3333');break;
    case'medkit':R(x-5,y-7+b,10,7,'#f2f2f2');R(x-1,y-6+b,2,5,'#dd2222');break;
    case'ammo':R(x-4,y-5+b,8,5,'#c9a33a');break;
    case'pistol':R(x-5,y-5+b,9,3,'#8a8a8a');break;
    case'smg':R(x-5,y-4+b,10,3,'#4a4a4a');R(x+1,y-6+b,4,2,'#333');R(x-6,y-2+b,3,5,'#4a4a4a');break;
    case'shotgun':R(x-6,y-3+b,12,3,'#4a2a1a');R(x-1,y-2+b,5,2,'#333');R(x-6,y-1+b,3,3,'#4a2a1a');break;
    case'rifle':R(x-7,y-3+b,14,2,'#3a2a1a');R(x-3,y-5+b,4,3,'#444');R(x+5,y-3+b,3,2,'#666');break;
    case'bat':for(let i=0;i<9;i++)R(x-5+i,y-3+b-(i>>2),2,2,'#b07a40');break;
    case'axe':R(x-5,y-4+b,9,2,'#7a5430');R(x+1,y-8+b,4,5,'#9ab0c0');break;
    case'pickaxe':R(x-5,y-3+b,9,2,'#6a4a30');R(x-4,y-7+b,8,3,'#a8b8c4');break;
    case'hoe':for(let i=0;i<10;i++)R(x-5+i,y-3+b-(i>>2),1,1,'#8a6a3a');R(x+3,y-7+b,4,3,'#c0c8d4');break;
    case'katana':R(x-5,y-3+b,2,2,'#2a2a30');for(let i=0;i<10;i++)R(x-3+i,y-3+b-(i>7?1:0),1,1,i>7?'#f0f0f8':'#c8d0dc');break;
    case'spear':for(let i=0;i<11;i++)R(x-5+i,y-3+b,1,1,'#8a6a3a');R(x+6,y-4+b,3,3,'#c0c8d4');break;
    case'fishingrod':for(let i=0;i<11;i++)R(x-5+i,y-2+b-(i>>2),1,1,'#8a6a3a');R(x-3,y-1+b,3,2,'#c0c0c8');R(x+5,y-5+b,1,3,'#e8e8e8');break;
    case'bow':R(x-4,y-7+b,2,10,'#8a5a2a');R(x-3,y-7+b,6,2,'#c0a070');R(x-3,y+1+b,6,2,'#c0a070');break;
    case'arrows':R(x-1,y-8+b,2,10,'#a08050');R(x-2,y-9+b,4,2,'#c0c0c8');break;
    default:R(x-3,y-3+b,6,6,'#888');break;
  }
  if(near){
    ctx.font='bold 7px "Courier New",monospace';ctx.textAlign='center';
    const nm=ITEMS[it.t]?ITEMS[it.t].n:'Item';
    ctx.fillStyle='#ffe27a';ctx.fillText(nm,x,y-13);
  }
}
/* ---- desenho dos interiores: o chão, os móveis e as paredes são pintados uma vez numa imagem pequena (barato no celular) ---- */
function floorDraw(c,r,ox,oy){
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-ox),Math.round(y-oy),w,h);};
  const f=r.fl,sd=r.sd;
  if(f==='wood'){
    R(r.x,r.y,r.w,r.h,'#6a4e34');
    for(let row=0,y=r.y;y<r.y+r.h;y+=6,row++){
      R(r.x,y,r.w,1,'#573f29');
      for(let x=r.x+((row*17+sd)%23);x<r.x+r.w;x+=23)R(x,y,1,Math.min(6,r.y+r.h-y),'#573f29');
    }
  }else if(f==='tile'||f==='tile2'){
    const a=f==='tile'?'#a6acb2':'#cdd5db',b=f==='tile'?'#9aa1a8':'#bfc9d0';
    for(let y=r.y;y<r.y+r.h;y+=8)for(let x=r.x;x<r.x+r.w;x+=8)R(x,y,Math.min(8,r.x+r.w-x),Math.min(8,r.y+r.h-y),(((x-r.x)>>3)+((y-r.y)>>3))&1?a:b);
  }else if(f==='carpet'||f==='carpet2'){
    R(r.x,r.y,r.w,r.h,f==='carpet'?'#4a5468':'#5a3a44');
    for(let i=0;i<r.w*r.h/40;i++){const x=r.x+((i*53+sd)%r.w),y=r.y+((i*31+sd*7)%r.h);R(x,y,1,1,f==='carpet'?'#414b5f':'#4e3039');}
  }else if(f==='straw'){
    R(r.x,r.y,r.w,r.h,'#9a8548');
    for(let i=0;i<r.w*r.h/18;i++){const x=r.x+((i*47+sd)%r.w),y=r.y+((i*29+sd*3)%r.h);R(x,y,3,1,i%2?'#b09a58':'#86733c');}
  }else{ // concreto
    R(r.x,r.y,r.w,r.h,f==='conc2'?'#4c4c52':'#66666a');
    for(let i=0;i<r.w*r.h/90;i++){const x=r.x+((i*61+sd)%r.w),y=r.y+((i*37+sd*5)%r.h);R(x,y,2,2,f==='conc2'?'#43434a':'#5d5d62');}
  }
}
function furnDraw(c,f,ox,oy){
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-ox),Math.round(y-oy),w,h);};
  const x=f.x,y=f.y,w=f.w,h=f.h,sd=f.sd,long=w>=h;
  const back=(col,th)=>{if(f.s==='t')R(x,y,w,th,col);else if(f.s==='b')R(x,y+h-th,w,th,col);else if(f.s==='l')R(x,y,th,h,col);else R(x+w-th,y,th,h,col);};
  R(x+1,y+h,w,2,'rgba(0,0,0,.30)');
  const cols=['#3a5a8a','#8a3a3a','#3a7a5a','#7a5a8a','#8a6a2a'];
  switch(f.k){
    case 'couch':R(x,y,w,h,'#6e3636');R(x+1,y+1,w-2,h-2,'#93504c');back('#5a2a2a',3);if(long)R(x+w/2,y+3,1,h-4,'#6e3636');else R(x+3,y+h/2,w-4,1,'#6e3636');break;
    case 'tv':R(x,y,w,h,'#1c2026');R(x+1,y+1,w-2,h-3,'#33506b');R(x+2,y+2,3,1,'#7aa0c0');break;
    case 'table':R(x,y,w,h,'#5e4026');R(x+1,y+1,w-2,h-2,'#8c6a42');R(x+3,y+2,4,2,'#ddd5c4');if(w>10&&h>8)R(x+w-8,y+h-5,4,2,'#ddd5c4');break;
    case 'bed':R(x,y,w,h,'#4e3220');R(x+1,y+1,w-2,h-2,'#d6d2c4');{const bc=cols[sd%cols.length];
      if(f.s==='t'){R(x+1,y+8,w-2,h-9,bc);R(x+2,y+2,w-4,5,'#f4f0e6');}
      else if(f.s==='b'){R(x+1,y+1,w-2,h-9,bc);R(x+2,y+h-7,w-4,5,'#f4f0e6');}
      else if(f.s==='l'){R(x+8,y+1,w-9,h-2,bc);R(x+2,y+2,5,h-4,'#f4f0e6');}
      else{R(x+1,y+1,w-9,h-2,bc);R(x+w-7,y+2,5,h-4,'#f4f0e6');}}break;
    case 'bed2':R(x,y,w,h,'#4e3220');R(x+1,y+1,w-2,h-2,'#d6d2c4');{const bc=cols[sd%cols.length],hw=(w-6)>>1,hh=(h-6)>>1;
      if(f.s==='t'){R(x+1,y+8,w-2,h-9,bc);R(x+2,y+2,hw,5,'#f4f0e6');R(x+w-2-hw,y+2,hw,5,'#f4f0e6');R(x+w/2,y+8,1,h-9,'rgba(0,0,0,.18)');}
      else if(f.s==='b'){R(x+1,y+1,w-2,h-9,bc);R(x+2,y+h-7,hw,5,'#f4f0e6');R(x+w-2-hw,y+h-7,hw,5,'#f4f0e6');R(x+w/2,y+1,1,h-9,'rgba(0,0,0,.18)');}
      else if(f.s==='l'){R(x+8,y+1,w-9,h-2,bc);R(x+2,y+2,5,hh,'#f4f0e6');R(x+2,y+h-2-hh,5,hh,'#f4f0e6');R(x+8,y+h/2,w-9,1,'rgba(0,0,0,.18)');}
      else{R(x+1,y+1,w-9,h-2,bc);R(x+w-7,y+2,5,hh,'#f4f0e6');R(x+w-7,y+h-2-hh,5,hh,'#f4f0e6');R(x+1,y+h/2,w-9,1,'rgba(0,0,0,.18)');}}break;
    case 'wardrobe':R(x,y,w,h,'#5a3e26');R(x+1,y+1,w-2,h-2,'#7a583a');if(long){R(x+w/2,y+1,1,h-2,'#4a321e');R(x+w/2-2,y+h/2,1,2,'#d8b860');R(x+w/2+2,y+h/2,1,2,'#d8b860');}else{R(x+1,y+h/2,w-2,1,'#4a321e');}break;
    case 'nightstand':R(x,y,w,h,'#5a3e26');R(x+1,y+1,w-2,h-2,'#80603c');R(x+w/2-1,y+h/2-1,2,2,'#f0d070');break;
    case 'shelf':case 'aisle':{R(x,y,w,h,'#4e3622');R(x+1,y+1,w-2,h-2,'#6e4e30');
      const sc=['#c04a3a','#d8b040','#4a8ac0','#5aa05a','#d8d0c0'];
      if(long){for(let i=0;i<w-3;i+=3)R(x+2+i,y+2,2,Math.min(3,h-4),sc[(i/3+sd)%5|0]);}
      else{for(let i=0;i<h-3;i+=3)R(x+2,y+2+i,Math.min(3,w-4),2,sc[(i/3+sd)%5|0]);}break;}
    case 'counter':R(x,y,w,h,'#5a5f66');R(x+1,y+1,w-2,h-2,'#8c929a');back('#6c7279',2);if(long)R(x+w-8,y+2,5,4,'#2a2e34');else R(x+2,y+h-8,4,5,'#2a2e34');break;
    case 'fridge':R(x,y,w,h,'#aab2ba');R(x+1,y+1,w-2,h-2,'#e6eaee');R(x+w-3,y+2,1,4,'#6a7076');R(x+1,y+h/2,w-2,1,'#aab2ba');break;
    case 'stove':R(x,y,w,h,'#2a2e34');R(x+1,y+1,w-2,h-2,'#454a52');R(x+2,y+2,3,3,'#1a1c20');R(x+w-5,y+2,3,3,'#1a1c20');R(x+2,y+h-5,3,3,'#1a1c20');R(x+w-5,y+h-5,3,3,'#1a1c20');break;
    case 'desk':R(x,y,w,h,'#5a4228');R(x+1,y+1,w-2,h-2,'#7e6040');R(x+3,y+2,6,4,'#1c2026');R(x+4,y+3,4,2,'#4a80a0');R(x+w-8,y+h-5,5,3,'#e8e4d8');break;
    case 'locker':R(x,y,w,h,'#3c5068');R(x+1,y+1,w-2,h-2,'#5a7690');if(long){for(let i=4;i<w-2;i+=5){R(x+i,y+1,1,h-2,'#3c5068');}}else{for(let i=4;i<h-2;i+=5)R(x+1,y+i,w-2,1,'#3c5068');}break;
    case 'crate':R(x,y,w,h,'#6e5228');R(x+1,y+1,w-2,h-2,'#a07c40');R(x+1,y+h/2,w-2,1,'#6e5228');R(x+w/2,y+1,1,h-2,'#6e5228');break;
    case 'barrel':R(x,y+1,w,h-1,'#3e3a30');R(x+1,y,w-2,h,'#5e5848');R(x+1,y+3,w-2,1,'#34302a');R(x+1,y+h-4,w-2,1,'#34302a');break;
    case 'bench':R(x,y,w,h,'#4e3a26');R(x+1,y+1,w-2,h-2,'#7a6448');break;
    case 'medbed':R(x,y,w,h,'#8a929a');R(x+1,y+1,w-2,h-2,'#e8ecef');if(f.s==='t')R(x+1,y+7,w-2,h-8,'#6a9ac0');else if(f.s==='b')R(x+1,y+1,w-2,h-8,'#6a9ac0');else if(f.s==='l')R(x+7,y+1,w-8,h-2,'#6a9ac0');else R(x+1,y+1,w-8,h-2,'#6a9ac0');break;
    case 'medcab':R(x,y,w,h,'#9aa2aa');R(x+1,y+1,w-2,h-2,'#eef1f3');{const cx=x+w/2,cy=y+h/2;R(cx-1,cy-3,2,6,'#d83a3a');R(cx-3,cy-1,6,2,'#d83a3a');}break;
    case 'bunk':R(x,y,w,h,'#3e4636');R(x+1,y+1,w-2,h-2,'#66765a');if(f.s==='t')R(x+2,y+2,w-4,4,'#c8c4b0');else if(f.s==='b')R(x+2,y+h-6,w-4,4,'#c8c4b0');else if(f.s==='l')R(x+2,y+2,4,h-4,'#c8c4b0');else R(x+w-6,y+2,4,h-4,'#c8c4b0');break;
    case 'rack':R(x,y,w,h,'#2e3238');R(x+1,y+1,w-2,h-2,'#4a4f58');if(long){for(let i=3;i<w-4;i+=6)R(x+i,y+2,4,1,'#1a1c20');}else{for(let i=3;i<h-4;i+=6)R(x+2,y+i,1,4,'#1a1c20');}break;
    case 'workbench':R(x,y,w,h,'#4e402c');R(x+1,y+1,w-2,h-2,'#76644a');R(x+3,y+3,7,2,'#b0b8c0');R(x+w-9,y+h-5,5,3,'#a04a3a');break;
    case 'hay':R(x,y,w,h,'#a8903e');R(x+1,y+1,w-2,h-2,'#d0b45c');for(let i=2;i<w-2;i+=3)R(x+i,y+2,1,h-4,'#b89c48');break;
    case 'toilet':R(x,y,w,h,'#b8c0c6');R(x+1,y+1,w-2,h-2,'#f0f3f5');R(x+2,y+h-6,w-4,4,'#d6dce0');R(x+3,y+h-5,w-6,2,'#9ab0c0');break;
    case 'sink':R(x,y,w,h,'#9aa2aa');R(x+1,y+1,w-2,h-2,'#eef1f3');R(x+3,y+2,w-6,h-5,'#9ec4dc');R(x+w/2-1,y+1,2,2,'#6a7076');break;
    case 'ksink':R(x,y,w,h,'#5a5f66');R(x+1,y+1,w-2,h-2,'#8c929a');back('#6c7279',2);{const bx=x+Math.round(w*.5)-5,by=y+1;if(w>=h){R(bx,by+2,10,h-5,'#6a7a88');R(bx+1,by+3,8,h-7,'#9ec4dc');R(bx+4,by+1,2,2,'#c8ced4');}else{R(x+2,y+Math.round(h*.5)-5,w-5,10,'#6a7a88');R(x+3,y+Math.round(h*.5)-4,w-7,8,'#9ec4dc');R(x+1,y+Math.round(h*.5)-1,2,2,'#c8ced4');}}break;
    case 'tub':R(x,y,w,h,'#9aa2aa');R(x+1,y+1,w-2,h-2,'#f2f5f7');R(x+3,y+3,w-6,h-6,'#8ec0de');R(x+4,y+4,w-10,1,'#b8dcee');break;
    case 'bookcase':R(x,y,w,h,'#3e2a18');R(x+1,y+1,w-2,h-2,'#5e4228');{const bc=['#b04a3a','#3a6aa0','#c8a038','#4a8a52','#7a4a8a'];
      if(long){for(let i=0;i<w-3;i+=2)R(x+2+i,y+1,1,h-2,bc[(i/2+sd)%5|0]);}else{for(let i=0;i<h-3;i+=2)R(x+1,y+2+i,w-2,1,bc[(i/2+sd)%5|0]);}}break;
    case 'dresser':R(x,y,w,h,'#4e3622');R(x+1,y+1,w-2,h-2,'#7a583a');if(long){R(x+w/3,y+1,1,h-2,'#4e3622');R(x+2*w/3,y+1,1,h-2,'#4e3622');R(x+w/6,y+h/2,2,1,'#f0d070');R(x+w/2,y+h/2,2,1,'#f0d070');R(x+5*w/6-1,y+h/2,2,1,'#f0d070');}break;
    case 'lamp':R(x+1,y+h-3,w-2,3,'#3a3028');R(x,y,w,h-2,'#e8d890');R(x+1,y+1,w-2,h-4,'#fff4b8');break;
    case 'plant':R(x+1,y+h-4,w-2,4,'#7a4a30');R(x,y,w,h-3,'#2f7a38');R(x+2,y+1,w-4,h-6,'#4aa050');break;
    case 'pallet':R(x,y,w,h,'#5e4626');R(x+1,y+1,w-2,h-2,'#9a7a46');for(let i=4;i<w-1;i+=5)R(x+i,y+1,1,h-2,'#6e5430');R(x+3,y+3,8,7,'#b48c50');R(x+4,y+4,6,5,'#c89c5c');break;
    case 'meet':R(x,y,w,h,'#3e281a');R(x+1,y+1,w-2,h-2,'#6a4630');R(x+3,y+3,w-6,1,'#80583c');break;
    default:R(x,y,w,h,'#888');
  }
}
function drawBldStatic(b){
  const cv=document.createElement('canvas');cv.width=b.w;cv.height=b.h;
  const c=cv.getContext('2d'),R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x-b.x),Math.round(y-b.y),w,h);};
  R(b.x,b.y,b.w,b.h,'#3a2a1c');
  for(const r of b.rooms)floorDraw(c,r,b.x,b.y);
  for(const f of b.furn.slice().sort((p,q)=>p.y-q.y))furnDraw(c,f,b.x,b.y);
  for(const w of b.walls){
    R(w.x,w.y,w.w,w.h,'#3a2a1c');
    if(w.w>=w.h)R(w.x,w.y,w.w,1,'#5e4830');else R(w.x,w.y,1,w.h,'#5e4830');
  }
  for(const g of b.gaps){ // batente e folha da porta (aberta, encostada na parede)
    if(g.v){R(g.r.x,g.r.y-1,IWT,2,'#7a5e3a');R(g.r.x,g.r.y+GAPW-1,IWT,2,'#7a5e3a');}
    else{R(g.r.x-1,g.r.y,2,IWT,'#7a5e3a');R(g.r.x+GAPW-1,g.r.y,2,IWT,'#7a5e3a');}
  }
  R(b.doorX,b.y+b.h-WT,b.door,WT,'#3a2a1c');
  b._fc=cv;
}
/* o jogador só enxerga o cômodo em que está (no multiplayer, também o cômodo do parceiro que estiver no mesmo prédio) */
function roomsAt(b,x,y,out){
  let hit=false;
  for(const r of b.rooms)if(x>=r.x-3&&x<=r.x+r.w+3&&y>=r.y-3&&y<=r.y+r.h+3){if(!out.includes(r))out.push(r);hit=true;}
  if(!hit){ // na porta de entrada ou em cima de uma parede: o cômodo mais próximo
    let best=null,bd=1e9;
    for(const r of b.rooms){const dx=Math.max(r.x-x,0,x-r.x-r.w),dy=Math.max(r.y-y,0,y-r.y-r.h),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=r;}}
    if(best&&bd<=16&&!out.includes(best))out.push(best);
  }
}
function visRooms(b){
  const v=[];roomsAt(b,P.x,P.y-2,v);
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp||rp.alive===false||rp.inVehicle)continue;
    if(rp.x<b.x||rp.x>b.x+b.w||rp.y<b.y||rp.y>b.y+b.h)continue;
    roomsAt(b,rp.x,rp.y-2,v);
  }
  return v;
}
function seeIn(b,x,y){
  const v=b._vis;if(!v)return true;
  for(const r of v)if(x>=r.x-3&&x<=r.x+r.w+3&&y>=r.y-3&&y<=r.y+r.h+3)return true;
  return false;
}
function drawInterior(b){
  if(!b._fc)drawBldStatic(b);
  b._vis=visRooms(b);
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  // o prédio inteiro fica escuro; só os cômodos visíveis (com suas paredes) são desenhados
  R(b.x,b.y,b.w,b.h,'#040604');
  // cômodos fora de vista: só uma silhueta apagada e semi-transparente (sem itens nem criaturas), para o jogador se situar na planta
  ctx.globalAlpha=.25;ctx.drawImage(b._fc,b.x,b.y);ctx.globalAlpha=1;
  ctx.save();ctx.beginPath();
  for(const r of b._vis){
    const l=r.x<=b.x+WT+1?WT:IWT,t=r.y<=b.y+WT+1?WT:IWT,rr=r.x+r.w>=b.x+b.w-WT-1?WT:IWT,bb=r.y+r.h>=b.y+b.h-WT-1?WT:IWT;
    ctx.rect(r.x-l,r.y-t,r.w+l+rr,r.h+t+bb);
  }
  ctx.clip();
  ctx.drawImage(b._fc,b.x,b.y);
  ctx.restore();ctx.imageSmoothingEnabled=sm;
  drawDoors(b);
  const near=nearestItem();
  for(const it of items)if(it.x>=b.x&&it.x<=b.x+b.w&&it.y>=b.y&&it.y<=b.y+b.h&&seeIn(b,it.x,it.y))drawItem(it,it===near);
}
/* item dentro da planta de uma casa: de fora (a pé ou de carro) ele nunca aparece, só quando o jogador está dentro e no cômodo certo */
function itemIndoor(it){
  if(it._in!==undefined)return it._in;
  let r=false;
  for(const b of blds)if(it.x>=b.x&&it.x<=b.x+b.w&&it.y>=b.y&&it.y<=b.y+b.h){r=true;break;}
  Object.defineProperty(it,'_in',{value:r,writable:true,enumerable:false,configurable:true});
  return r;
}
