/* ============ CONSTANTES ============ */
let WW=3400, WH=3400, WSC=1, WAREA=1;     // tamanho do mundo: definido por mapa em setWorldSize() antes da geração
const WORLD_S={forest:2.5,snow:2.5,desert:2.5,city:2};   // fator por lado (2 = 4x a área original)
function setWorldSize(){
  WSC=(typeof window!=='undefined'&&window.__S)||WORLD_S[selectedMap]||1;
  WW=WH=Math.round(3400*WSC/50)*50;WAREA=(WW/3400)*(WH/3400);
}
const DAY_SECONDS=480, START_HOUR=9, UPD=700;
const MAX_SLOTS=6, PACK_SLOTS=12;   // sem mochila: 6 itens diferentes; com mochila: 12
function invCap(){return P&&P.pack?PACK_SLOTS:MAX_SLOTS;}

/* ============ ÍCONES PIXEL ART (substituem os emojis do sistema) ============ */
const PXPAL={R:'#d33',r:'#8a2020',O:'#d9892b',Y:'#ffd84a',B:'#3a9be0',b:'#8fd0ff',G:'#6fcf6f',g:'#3e7a2e',
  W:'#f0ead8',S:'#c0c8d4',s:'#6a7280',N:'#8a5a2a',n:'#c8924e',P:'#e8a0a0',K:'#222831',M:'#8DA568',A:'#C79A54',f:'#e8b890',F:'#b98860',C:'#b8b090',c:'#8a8468',k:'#5a3a24',d:'#6a7f4a'};
const PXG={
  heart:['.RR...RR.','RWRR.RRRR','RRRRRRRRR','RRRRRRRRR','.RRRRRRR.','..RRRRR..','...RRR...','....R....'],
  drumstick:['..OOO....','.OWOOO...','OOOOOOO..','OOOOOOO..','.OOOOO...','..OOOW...','....WWW..','.....WWW.'],
  drop:['....B....','....B....','...BBB...','..BBBBB..','.BBWBBBB.','.BWBBBBB.','.BBBBBBB.','..BBBBB..','...BBB...'],
  bolt:['.....YYY.','....YYY..','...YYY...','..YYYYYY.','...YYYY..','....YY...','...YY....','..YY.....','.Y.......'],
  thermo:['...WWW...','...WRW...','...WRW...','...WRW...','...WRW...','..WWRWW..','..WRRRW..','..WRRRW..','...WWW...'],
  pause:['.WWW.WWW.','.WWW.WWW.','.WWW.WWW.','.WWW.WWW.','.WWW.WWW.','.WWW.WWW.','.WWW.WWW.'],
  hammer:['.SSSSSSS.','.SSSSSSS.','.SSSSSSS.','...NN....','...NN....','...NN....','...NN....','...NN....'],
  chat:['.WWWWWWWWW.','WWWWWWWWWWW','WWKWWKWWKWW','WWWWWWWWWWW','.WWWWWWWWW.','..WWW......','...WW......','....W......'],
  close:['WW...WW','.WW.WW.','..WWW..','..WWW..','.WW.WW.','WW...WW'],
  arrowup:['...Y...','..YYY..','.YYYYY.','YYYYYYY','..YYY..','..YYY..','..YYY..'],
  can:['.SSSSSSS.','.OOOOOOO.','.OWWWWWO.','.OWOOOWO.','.OWWWWWO.','.OOOOOOO.','.SSSSSSS.'],
  bottle:['...SSS...','...SSS...','..BBBBB..','.BBBBBBB.','.BWBBBBB.','.BWBBBBB.','.BBBBBBB.','.BBBBBBB.','..BBBBB..'],
  fish:['....BBB....','.SSSSSSS.S.','SSKSSSSSSSS','.SSSSSSS.S.','....SSS....'],
  cookedfish:['....NNN....','.OOOOOOO.O.','OOKOOOOOOOO','.OOOOOOO.O.','....OOO....'],
  meat:['..rrrrr...', '.rRRRRRWr.', 'rRRPPRRRWr', 'rRRPRRPRRr', 'rRRRRPPRRr', '.rRRRRRRr.', '..rrrrrr..'],
  cookedmeat:['..kkkkk...', '.kNNNNNnk.', 'kNNnnNNNnk', 'kNNnNNnNNk', 'kNNNNnnNNk', '.kNNkNNNk.', '..kkkkkk..'],
  wood:['..NNNNN..','.NnnnnnN.','NnNNNNNnN','NnNnnnNnN','NnNNNNNnN','.NnnnnnN.','..NNNNN..'],
  stone:['..sSSSs..','.sSSSSSs.','sSSSWSSSs','sSSSSSSSs','.sSSSSSs.','..sssss..'],
  bandage:['.nnnnnnn.','nnnWWWnnn','nnnWWWnnn','.nnnnnnn.'],
  cloth:['.CCCCCCC..','CCcCCCCCC.','CCcCCCcCC.','CCCCCCcCCC','cCCCCCCCC.','CCCCcCCC..','.CC.CC.C..'],
  medkit:['...sss...','WWWWWWWWW','WWWWRWWWW','WWWRRRWWW','WWWWRWWWW','WWWWWWWWW','sssssssss'],
  fists:['.kkkkkkkkkkk.','kffkffkffkffk','kffkffkffkffk','kfFkfFkfFkfFk','kffffffffffFk','kFFFFFFFFFFFk','kkkkkkkkfffFk','kfffffkkfffFk','.kfffffffffk.','..kfffffffk..','..kkkkkkkkk..','..kBBBBBBBk..','..kbbbbbbbk..','..kkkkkkkkk..'],
  bow:['...NNNW..','..NN..W..','.NN...W..','.N....W..','NN....W..','N.SSSSSYY','NN....W..','.N....W..','.NN...W..','..NN..W..','...NNNW..'],
  pistol:['SSSSSSSSSSS.','ssssssssssss','sssssssssss.','..NNsss.....','..NN........','..NN........','..NNN.......'],
  smg:['..SSSSSSSSSSSS','NNssssssssssss','NNsssssssssss.','...NNs..KK....','...NN...KK....','...NN...KK....','........KK....','........KK....'],
  shotgun:['......SSSSSSSSSS','......ssssssssss','NNNNNNKssssssss.','NNNNnnnKsnnnn...','.NNNN...........'],
  rifle:['..........KKKK....','..SSSSSSSSSSSSSSSS','NNssssssssssssssss','NNNNsKKss.........','.NNN..KK..........'],
  ammo:['AA.AA.AA','YY.YY.YY','YY.YY.YY','YY.YY.YY','YY.YY.YY','ss.ss.ss'],
  fire:['.....O.....','....OOO....','...OOYOO...','..OOYYYOO..','..OYYWYYO..','...OYYYO...','.NNNNNNNNN.','NN.......NN'],
  rain:['..SSS....','.SSSSS...','SSSSSSSS.','.........','.B..B..B.','..B..B...','.B..B..B.'],
  snow:['....b....','.b..b..b.','..b.b.b..','...bbb...','bbbbbbbbb','...bbb...','..b.b.b..','.b..b..b.','....b....'],
  wind:['.AAAAAA..','......AA.','.AAAAA.A.','.......A.','AAAAAAAA.','......AA.','..AAAAA..'],
  wifioff:['..WWWWWWW..','.WW.....WW.','W...WWW...W','..WW...WW..','.W..WWW..W.','....W.W....','.....W.....'],
  check:['......G','.....GG','G...GG.','GG.GG..','.GGG...','..G....'],
  trophy:['YYYYYYYYY','YAYYYYYAY','YAYYYYYAY','.YAYYYAY.','..YYYYY..','...AYA...','....Y....','...AAA...','..YYYYY..'],
  lock:['..sSSSs..','.sS...Ss.','.S.....S.','sSSSSSSSs','sSSSKSSSs','sSSSKSSSs','sSSSSSSSs','sSSSSSSSs']
};
/* ícones desenhados com linhas (armas brancas e flechas) */
function pxLines(w,h,ops){
  const g=[];for(let y=0;y<h;y++)g.push(new Array(w).fill('.'));
  const set=(x,y,c)=>{if(x>=0&&y>=0&&x<w&&y<h)g[y][x]=c;};
  for(const o of ops){
    if(o[0]==='r'){for(let y=o[2];y<o[2]+o[4];y++)for(let x=o[1];x<o[1]+o[3];x++)set(x,y,o[5]);}
    else{let[,x0,y0,x1,y1,c,t]=o;const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
      for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/(n||1)),y=Math.round(y0+(y1-y0)*i/(n||1));set(x,y,c);if(t){set(x+1,y,c);}}}
  }
  return g.map(r=>r.join(''));
}
PXG.bat=pxLines(11,11,[['l',1,10,9,2,'n',1],['l',8,3,10,1,'n',1],['l',0,10,2,8,'K',0]]);
PXG.axe=['......sSS..','..ssNNsSSS.','..sSNNSSSWS','..sSNNSSSWS','..ssNNSSSWS','....NNSSSWS','....NNsSSS.','....NN.sS..','....NN.....','....NN.....','....NN.....'];
PXG.pickaxe=['..SSSSSSS..','.SWWWWWSSS.','SSS.NN..SSS','SS..NN...SS','S...NN....S','....NN.....','....NN.....','....NN.....','....NN.....','....NN.....','....NN.....'];
PXG.hoe=pxLines(11,11,[['l',1,10,8,3,'N',1],['r',6,1,5,3,'S'],['r',6,1,5,1,'W'],['r',6,4,2,1,'s']]);
PXG.potato=['..kNNk...','.kNnnNNk.','kNnnNnNNk','kNNnNNnNk','.kNNnNNk.','..kkNkk..'];
PXG.bakedpotato=['..kAAk...','.kAWWAAk.','kAWWAWAAk','kAAWAAWAk','.kAAWAAk.','..kkAkk..'];
PXG.melon=['..kggggk..','.kgGGgGgk.','kgGgGGgGgk','kgGGgGGgGk','kgGgGGgGgk','kgGGgGGgGk','.kgGgGgGk.','..kkgggk..'];
PXG.greenhouse=['..kSSSSSSk..','.kSbbSbbSSk.','kSbbSbbSbbSk','kSSSSSSSSSSk','kNbbNbbNbbNk','kNbbNbbNbbNk','kNNNNNNNNNNk'];
PXG.seed=['........','..NNNN..','.NNnnNN.','.NYYYYN.','.NYGYYN.','.NYYGYN.','..NNNN..','........'];
PXG.katana=pxLines(11,11,[['l',5,6,10,1,'S',1],['l',5,5,10,1,'W',0],['l',3,6,6,9,'Y',0],['l',2,8,4,7,'N',0],['r',0,9,2,1,'Y']]);
PXG.spear=pxLines(11,11,[['l',0,10,4,6,'N',1],['r',4,5,2,1,'R'],['r',4,3,2,1,'W'],['r',5,4,2,1,'S'],['r',6,5,2,1,'s'],['r',5,2,2,1,'W'],['r',6,3,2,1,'S'],['r',7,4,2,1,'s'],['r',6,1,2,1,'W'],['r',7,2,2,1,'S'],['r',8,3,2,1,'s'],['r',8,1,2,1,'S'],['r',9,0,2,1,'S']]);
PXG.arrows=pxLines(11,11,[['l',1,9,9,1,'n',0],['l',8,0,10,2,'S',1],['r',9,0,2,3,'S'],['l',0,10,2,8,'W',1],['l',0,8,2,6,'W',0]]);
PXG.rod=pxLines(11,11,[['l',0,10,8,3,'N',0],['r',3,9,2,2,'s'],['r',9,2,1,1,'W']]);
function pxRot(g){const h=g.length,w=g[0].length,o=[];for(let x=0;x<w;x++){let r='';for(let y=h-1;y>=0;y--)r+=g[y][x];o.push(r);}return o;}
/* ícones dos controles na tela */
PXG.c_atk=['.......W.......', '.......W.......', '.....WWWWW.....', '...WW..W..WW...', '...W...W...W...', '..W.........W..', '..W....R....W..', 'WWWWW.RRR.WWWWW', '..W....R....W..', '..W.........W..', '...W...W...W...', '...WW..W..WW...', '.....WWWWW.....', '.......W.......', '.......W.......'];
PXG.c_run=['....WWWW....','....WBBW....','....WBBW....','.Y..WBBW....','....WBBBW...','YY..WBBBBWW.','....WBBBBBBW','.Y..WWWWWWWW'];
PXG.c_eat=['...OOOO.....','..OOOOOO....','.OOOOOOOO...','.OOOOOOOOO..','.OOOOOOOOO..','.OOOOOOOO...','..OOOOOO....','...OOOWW....','....WWWW....','.....WWWW...','......WWWW..','.......WW...'];
PXG.corn=['..kYYk..','.kYYYYk.','.kYkYYk.','.kYYYYk.','.kYkYYk.','gkYYYYkg','GgkYYkgG','.GggggG.','..GggG..','...gg...'];
PXG.cookedcorn=['..kAAk..','.kAANAk.','.kANAAk.','.kAAANk.','.kANAAk.','gkAAAAkg','GgkAAkgG','.GggggG.','..GggG..','...gg...'];
PXG.c_chest=['..kkkkkkk..','.kNNNNNNNk.','kNNNNNNNNNk','kYYYYYYYYYk','kkkkYYYkkkk','kNNNNYNNNNk','kNNNNNNNNNk','.kkkkkkkkk.'];
PXG.turban=['...cccc...','..WWWWWW..','.WWcWWcWW.','.WcWWWWcW.','RRRRRRRRRR','.WWWWWWWW.','..WcWWcW..','...WWWW...'];
PXG.c_hand=['..kkkkkkkk..', '.kffffffffk.', 'kffffffffFFk', 'kffffffffFFk', 'kffkffkffFk.', 'kffkffkffFk.', '.kfkffkffk..', '..kkkkkkk...', '..SSSSSSS...', '.SSWSSSsS...', '..ssssss....'];
PXG.c_swap=pxLines(11,10,[['l',1,2,9,2,'W',0],['l',7,0,9,2,'W',0],['l',7,4,9,2,'W',0],['l',1,7,9,7,'W',0],['l',3,5,1,7,'W',0],['l',3,9,1,7,'W',0]]);
PXG.c_flame=['....R....','....RR...','...RRR...','..RRORR..','.RRROORR.','.RROYORR.','.RROYYOR.','..ROYYO..','...OOO...'];
PXG.c_bed=['NN.........','NN.........','NNWWWBBBBB.','NNWWWBBBBB.','NNNNNNNNNNN','NN.......NN','NN.......NN'];
PXG.tent=['.....Y.....','....MMd....','...MMMdd...','..MMMKKdd..','.MMMKKKKdd.','MMMMKKKKddd','MMMMKKKKddd','kkkkkkkkkkk'];
PXG.c_door=['.NNNNNN.','.NnnnnN.','.NnnnnN.','.NnnnnN.','.NnnYnN.','.NnnnnN.','.NnnnnN.','NNNNNNNN'];
PXG.c_exit=['.NNNNNN......','.NnnnnN...Y..','.NnnnnN....Y.','.NnnnnNYYYYYY','.NnYnnN....Y.','.NnnnnN...Y..','.NnnnnN......','NNNNNNNN.....'];
PXG.lock=['..kkkk..','.kAAAAk.','.kA..Ak.','.kA..Ak.','kkkkkkkk','kAAAAAAk','kAAkkAAk','kAAkkAAk','kAAAAAAk','kkkkkkkk'];
PXG.backpack=['....kkkk....','...kA..Ak...','..kkkkkkkk..','.kMMMMMMMMk.','kMMMMMMMMMMk','kMMMMMMMMMMk','kMMddddddMMk','kkkkkkkkkkkk','kMMkAAAAkMMk','kMMkAYYAkMMk','kMMkAAAAkMMk','kMMMkkkkMMMk','.kMMMMMMMMk.','..kkkkkkkk..'];
PXG.arrowright=pxRot(PXG.arrowup);PXG.arrowdown=pxRot(pxRot(PXG.arrowup));PXG.arrowleft=pxRot(pxRot(pxRot(PXG.arrowup)));
const PXURL={};
let PXWEATHER='';
function pxData(name){
  if(PXURL[name])return PXURL[name];
  const g=PXG[name];if(!g)return null;
  const w=Math.max(...g.map(r=>r.length)),h=g.length;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  for(let y=0;y<h;y++)for(let x=0;x<g[y].length;x++){const ch=g[y][x];if(ch!=='.'&&PXPAL[ch]){c.fillStyle=PXPAL[ch];c.fillRect(x,y,1,1);}}
  return PXURL[name]={url:cv.toDataURL(),w,h};
}
const PXCV={};
/* canvas do icone (para desenhar no mundo: itens no chao e armas nas maos) */
function pxCanvas(name){
  if(PXCV[name])return PXCV[name];
  const g=PXG[name];if(!g)return null;
  const w=Math.max(...g.map(r=>r.length)),h=g.length;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  for(let y=0;y<h;y++)for(let x=0;x<g[y].length;x++){const ch=g[y][x];if(ch!=='.'&&PXPAL[ch]){c.fillStyle=PXPAL[ch];c.fillRect(x,y,1,1);}}
  return PXCV[name]=cv;
}
/* html de uma imagem pixel; s = tamanho em px de CSS de cada pixel do ícone */
function pxIcon(name,s){
  const d=pxData(name);if(!d)return '';
  s=s||2;
  return '<img class="pxi" alt="" draggable="false" src="'+d.url+'" style="width:'+(d.w*s)+'px;height:'+(d.h*s)+'px">';
}
/* escolhe o maior multiplo inteiro que cabe em maxW x maxH (px de CSS) */
function pxFit(name,maxW,maxH){
  const d=pxData(name);if(!d)return '';
  const s=Math.max(1,Math.floor(Math.min(maxW/d.w,(maxH||maxW)/d.h)*2)/2);
  return pxIcon(name,s);
}
function hydratePx(root){
  (root||document).querySelectorAll('[data-px]').forEach(el=>{el.innerHTML=pxIcon(el.dataset.px,+el.dataset.s||2);});
}

try{hydratePx();}catch(e){}
const ITEMS={
  food:{n:'Feijão enlatado',e:'can'},
  water:{n:'Garrafa de água',e:'bottle'},
  fish:{n:'Peixe fresco',e:'fish'},
  cookedfish:{n:'Peixe assado',e:'cookedfish'},
  meat:{n:'Carne crua',e:'meat'},
  cookedmeat:{n:'Carne assada',e:'cookedmeat'},
  corn:{n:'Milho',e:'corn'},
  turban:{n:'Turbante do Deserto',e:'turban'},
  cookedcorn:{n:'Milho assado',e:'cookedcorn'},
  wood:{n:'Madeira',e:'wood'},
  stone:{n:'Pedra',e:'stone'},
  bandage:{n:'Bandagem',e:'bandage'},
  cloth:{n:'Tecido',e:'cloth'},
  backpack:{n:'Mochila',e:'backpack'},
  medkit:{n:'Kit médico',e:'medkit'},
  ammo:{n:'Munição',e:'ammo'},
  pistol:{n:'Pistola',e:'pistol'},
  smg:{n:'SMG',e:'smg'},
  shotgun:{n:'Shotgun',e:'shotgun'},
  rifle:{n:'Rifle',e:'rifle'},
  bat:{n:'Taco de beisebol',e:'bat'},
  axe:{n:'Machado',e:'axe'},
  pickaxe:{n:'Picareta',e:'pickaxe'},
  katana:{n:'Katana',e:'katana'},
  hoe:{n:'Enxada',e:'hoe'},
  seed_corn:{n:'Sementes de milho',e:'seed'},
  potato:{n:'Batata',e:'potato'},bakedpotato:{n:'Batata assada',e:'bakedpotato'},melon:{n:'Melancia',e:'melon'},
  seed_potato:{n:'Sementes de batata',e:'seed'},seed_melon:{n:'Sementes de melancia',e:'seed'},
  spear:{n:'Lança',e:'spear'},
  bow:{n:'Arco',e:'bow'},
  arrows:{n:'Flechas',e:'arrows'},
  fishingrod:{n:'Vara de Pesca',e:'rod'}
};

/* ===== Peixes: espécies, ícones e dificuldade do minigame ===== */
const FISH_TPL={
  oval:['...3333......','..11111111.3.','.14111111133.','.12222221113.','..2222222133.','...33.....3..'],
  slim:['....33........','.11111111111.3','.141111111133.','.12222222222.3','..222222222.3.'],
  long:['..............','.1111111111111.','14111111111113.','.2222222222222.','..22222222222..'],
  cat :['....3.........','.1111111111.3.','K4111111111133','.K2222222222.3','..2222222222..']
};
function fishGrid(tpl,m,sp){
  const g=FISH_TPL[tpl].map(r=>r.split('').map(ch=>ch==='1'?m[0]:ch==='2'?m[1]:ch==='3'?m[2]:ch==='4'?'K':ch).join(''));
  for(const q of (sp||[])){const r=g[q[1]];if(r&&r[q[0]]&&r[q[0]]!=='.')g[q[1]]=r.slice(0,q[0])+q[2]+r.slice(q[0]+1);}
  return g;
}
const FISH={
  lambari:{n:'Lambari',tpl:'slim',m:['b','W','S'],kg:[.1,.3],food:16,diff:1,spd:.5,jit:.35,yield:1,rare:0},
  tilapia:{n:'Tilápia',tpl:'oval',m:['S','W','s'],kg:[.6,1.8],food:24,diff:2,spd:.58,jit:.4,yield:1,rare:0},
  truta:{n:'Truta',tpl:'slim',m:['d','f','A'],sp:[[4,1,'R'],[7,1,'R'],[10,1,'R'],[5,2,'R'],[9,2,'R']],kg:[.5,2.2],food:26,diff:3,spd:.72,jit:.5,yield:1,rare:1},
  carpa:{n:'Carpa',tpl:'oval',m:['O','Y','r'],kg:[1.5,5],food:30,diff:3,spd:.66,jit:.45,yield:2,rare:1},
  bagre:{n:'Bagre',tpl:'cat',m:['c','C','s'],kg:[2,7],food:32,diff:4,spd:.82,jit:.55,yield:2,rare:2},
  perca:{n:'Perca',tpl:'oval',m:['G','Y','O'],sp:[[4,1,'g'],[4,2,'g'],[6,1,'g'],[6,2,'g'],[8,1,'g'],[8,2,'g']],kg:[.4,1.5],food:22,diff:2,spd:.6,jit:.42,yield:1,rare:0},
  salmao:{n:'Salmão',tpl:'long',m:['P','W','R'],kg:[2,6],food:32,diff:4,spd:.86,jit:.55,yield:2,rare:2},
  esturjao:{n:'Esturjão',tpl:'long',m:['s','S','K'],sp:[[3,1,'W'],[5,1,'W'],[7,1,'W'],[9,1,'W'],[11,1,'W']],kg:[8,22],food:40,diff:5,spd:.98,jit:.65,yield:3,rare:3},
  koi:{n:'Carpa Koi',tpl:'oval',m:['W','W','O'],sp:[[4,1,'R'],[8,2,'R'],[3,3,'R'],[6,3,'O']],kg:[1,4],food:28,diff:3,spd:.68,jit:.5,yield:2,rare:2},
  dourado:{n:'Peixinho Dourado',tpl:'oval',m:['O','Y','Y'],kg:[.05,.2],food:12,diff:1,spd:.48,jit:.35,yield:1,rare:0}
};
const FISH_POOL={
  forest:{lambari:30,tilapia:28,truta:18,carpa:14,bagre:7},
  snow:{perca:32,truta:28,salmao:22,esturjao:5},
  desert:{tilapia:40,lambari:25,carpa:20,bagre:12},
  city:{dourado:50,koi:30,carpa:12,lambari:8}
};
for(const k in FISH){const f=FISH[k];PXG['fish_'+k]=fishGrid(f.tpl,f.m,f.sp);ITEMS['f_'+k]={n:f.n,e:'fish_'+k,fish:k};}
function isFishItem(t){return t==='fish'||!!(ITEMS[t]&&ITEMS[t].fish);}
function firstFishItem(){for(const sl of P.inv)if(isFishItem(sl.t))return sl.t;return null;}
function fishWeights(){
  const base=FISH_POOL[selectedMap]||FISH_POOL.forest;
  const hod=(START_HOUR+T/DAY_SECONDS*24)%24,night=hod>=20||hod<5.5,rain=weather==='rain';
  const w={};
  for(const k in base)w[k]=base[k]*(FISH[k].rare>=2&&(night||rain)?1.6:1)*(FISH[k].rare===3&&night?1.5:1);
  return w;
}

const WEAPONS={
  fists:{n:'Mãos',dmg:1,range:18,cd:.5,kb:40,melee:true,chopRate:0.4,wood:[2,2]},
  bat:{n:'Taco',dmg:2.5,range:24,cd:.5,kb:105,melee:true,chopRate:0.7,wood:[2,3],stun:.8,arc:1.2},
  axe:{n:'Machado',dmg:5.5,range:26,cd:.85,kb:120,melee:true,chopRate:2,wood:[4,6],arc:2.0},
  pickaxe:{n:'Picareta',dmg:3.5,range:20,cd:.6,kb:100,melee:true,chopRate:0.85,wood:[3,3],mines:true,pierce:true,arc:1.0},
  hoe:{n:'Enxada',dmg:2,range:22,cd:.55,kb:35,melee:true,chopRate:.3,wood:[1,1],arc:1.2},
  katana:{n:'Katana',dmg:8,range:30,cd:.38,kb:80,melee:true,chopRate:1.2,wood:[3,4],arc:1.6,combo:true},
  spear:{n:'Lança',dmg:4.5,range:40,cd:.7,kb:30,melee:true,chopRate:0.85,wood:[3,3],pierce:true,arc:.3},
  bow:{n:'Arco',dmg:8,range:175,cd:.85,kb:70,firearm:true,bow:true,spread:.04,pierce:true},
  pistol:{n:'Pistola',dmg:4,range:190,cd:.4,kb:60,firearm:true,fireRate:1},
  smg:{n:'SMG',dmg:2.5,range:130,cd:.11,kb:40,firearm:true,auto:true,spread:.06},
  shotgun:{n:'Shotgun',dmg:6,range:110,cd:.85,kb:180,firearm:true,pellets:5,spread:.35},
  rifle:{n:'Rifle',dmg:15,range:290,cd:1.2,kb:260,firearm:true,spread:.01,heavy:true},
  fishingrod:{n:'Vara de Pesca',dmg:.5,range:20,cd:.5,kb:15,melee:true,chopRate:.2,rod:true}
};
const RECIPES=[
  {out:'pickaxe',  need:{wood:2,stone:2}, label:'Picareta',        desc:'Única que quebra pedras (5 golpes). Fura armadura leve (dano 3.5)' },
  {out:'axe',      need:{wood:3,stone:4}, label:'Machado',         desc:'Melhor para cortar árvores: 2 golpes, 4 a 6 madeiras. Arco acerta vários, lento (dano 5.5)' },
  {out:'hoe',      need:{wood:3,stone:2}, label:'Enxada',          desc:'Ara a terra para plantar (fraca como arma, dano 2)' },
  {out:'seed_corn',need:{corn:1},         label:'Sementes de milho (x3)', desc:'Transforma 1 milho em 3 sementes para plantar', qty:3 },
  {out:'seed_potato',need:{potato:1},     label:'Sementes de batata (x3)', desc:'Transforma 1 batata em 3 sementes (floresta e cidade)', qty:3 },
  {out:'seed_melon',need:{melon:1},        label:'Sementes de melancia (x3)', desc:'Transforma 1 melancia em 3 sementes (só vingam no deserto)', qty:3 },
  {out:'greenhouse',need:{wood:8,cloth:4},  label:'Estufa',          desc:'Canteiro coberto 3x3: dá para plantar até na neve e cresce mais rápido. Monte ao ar livre' },
  {out:'spear',    need:{wood:4,stone:3}, label:'Lança',           desc:'Perfura em linha e ignora armadura (alcance 40)' },
  {out:'bat',      need:{wood:3},         label:'Taco',            desc:'Atordoa o zumbi, mas fraca contra blindados (dano 2.5)' },
  {out:'bow',      need:{wood:4,stone:1}, label:'Arco',            desc:'Silencioso, usa flechas (dano 8)' },
  {out:'arrows',   need:{wood:2,stone:1}, label:'Flechas (x6)',    desc:'Munição do arco' },
  {out:'fishingrod',need:{wood:3,stone:1}, label:'Vara de Pesca',   desc:'Lance a isca no lago e pesque (só mapas com lago)', lake:true },
  {out:'bandage',  need:{cloth:3},    label:'Bandagem',        desc:'Estanca sangramento e cura um pouco' },
  {out:'backpack', need:{cloth:6,wood:3}, label:'Mochila',        desc:'Carrega 12 itens diferentes em vez de 6', once:true },
  {out:'tent', need:{cloth:8,wood:5}, label:'Barraca', desc:'Dorme 2 pessoas (só à noite). Monte ao ar livre' },
  {out:'campfire', need:{wood:5,stone:3}, label:'Fogueira',        desc:'Cozinha peixe e ilumina à noite' }
];
const LOOT={
  house:{food:12,water:28,bandage:18,stone:8,wood:6,bat:4,ammo:3,axe:2,medkit:2,arrows:3,backpack:2,katana:.5},
  shop:{food:16,water:35,bandage:12,medkit:4,bat:3,axe:2,arrows:4,backpack:2},
  mil:{pistol:10,smg:8,shotgun:6,rifle:5,ammo:30,medkit:12,bandage:12,food:4,water:7,stone:4,backpack:3},
  car:{food:8,water:18,ammo:15,bandage:12,medkit:4,pistol:3},
  apartment:{food:9,water:20,bandage:14,ammo:6,bat:3,medkit:3,stone:4,arrows:3,backpack:2,katana:.4},
  office:{food:8,water:22,bandage:10,ammo:5,bat:2,medkit:2,backpack:2},
  garage:{ammo:22,food:5,water:12,bandage:8,pistol:4,bat:3,axe:3,arrows:4,backpack:1},
  clinic:{medkit:28,bandage:30,food:5,water:14,ammo:3},
  gas:{food:9,water:28,ammo:12,bandage:10,bat:3,medkit:3},
  warehouse:{food:7,water:14,ammo:14,bandage:8,axe:6,bat:4,stone:10,medkit:3,arrows:5,backpack:2}
};
/* Mapas com lago (Floresta e Neve): só neles existe vara de pesca */
function mapHasLake(){return selectedMap==='forest'||selectedMap==='snow'||selectedMap==='desert'||selectedMap==='city';} // desert = oásis
/* Clima coerente com o mapa: deserto (tempestade de areia), neve (nevasca), floresta/cidade (chuva) */
function pickWeather(rf){
  const r=rf();
  if(selectedMap==='desert') return r<.7?'none':'sand';
  if(selectedMap==='snow') return r<.45?'none':'snow';
  return r<.65?'none':'rain';
}
function lakeLoot(t){return mapHasLake()?Object.assign({fishingrod:1.5},t):t;}
/* fora dos prédios só existem pedra e taco; todo o resto (comida, água, armas, curativos) fica dentro das casas */
const OUT_LOOT={stone:6,bat:.25};

const ZTYPES=[
  {name:'Comum',    hp:8,  spd:34, dmg:9,  r:5, color:'#7a9a5a'},
  {name:'Rápido',   hp:5,  spd:64, dmg:7,  r:5, color:'#a0b070'},
  {name:'Brute',    hp:30, spd:22, dmg:24, r:7, color:'#8a5a4a'},
  {name:'Chefe',    hp:46, spd:36, dmg:28, r:8, color:'#556b2f'},
  {name:'Spitter',  hp:11,  spd:30, dmg:13, r:6, color:'#7ac070', ranged:true, range:190},
  {name:'Crawler',  hp:6,  spd:50, dmg:12, r:5, color:'#6a8060', crawler:true},
  {name:'Screamer', hp:12,  spd:40, dmg:9,  r:6, color:'#c0a0a0', screams:true},
  // Novos
  {name:'Inchado',  hp:22, spd:18, dmg:18, r:7, color:'#5a8a4a', bloater:true},   // tank tóxico
  {name:'Berserker',hp:9,  spd:72, dmg:14, r:5, color:'#c05040', berserk:true},   // muito rápido
  {name:'Yeti',     hp:34, spd:46, dmg:26, r:8, color:'#dfe8f0', yeti:true}        // só aparece na nevasca do mapa de Neve
];
/* ============ DIFICULDADE CRESCENTE ============
   Curva suave que sobe a cada dia e se estabiliza (nada de salto de dificuldade).
   Cada mapa tem um perfil: o clima de neve e deserto já cansa o jogador, então os zumbis ali crescem um pouco mais devagar;
   a cidade tem muitos prédios, então começa com bem menos zumbis espalhados. */
const MAPDIFF={
  forest:{init:.50, base:95,  max:150, hp:1,   dmg:1},
  desert:{init:.47, base:90,  max:140, hp:.95, dmg:.95},
  snow:  {init:.44, base:85,  max:130, hp:.95, dmg:.95},
  city:  {init:.22, base:100, max:160, hp:1,   dmg:1}
};
/* zumbis especiais liberados por dia: [tipo, dia, peso, nome no aviso] */
const ZUNLOCK=[[5,2,3,'Rastejantes'],[4,2,3,'Cuspidores'],[2,3,3,'Brutamontes'],[6,4,2,'Gritadores'],[7,5,2,'Inchados'],[8,6,2,'Furiosos'],[3,8,.8,'Chefes']];
function dangerName(d){return d<=2?'BAIXO':d<=4?'MÉDIO':d<=7?'ALTO':d<=11?'MUITO ALTO':'EXTREMO';}
function dayDiff(){
  const d=Math.max(1, day|0);
  const lv=d-1;
  const night=dark>0.55?1:0;
  const mp=MAPDIFF[selectedMap]||MAPDIFF.forest;
  const sat=k=>1-Math.exp(-lv/k);
  return {
    d,
    hp:(1+0.9*sat(9))*mp.hp,
    spd:1+0.12*sat(8),
    dmg:(1+0.6*sat(10))*mp.dmg,
    // intervalo entre spawns (menor = mais horda)
    interval: Math.max(1.5, (night?2.0:3.2) - lv*0.07),
    // teto de zumbis vivos
    cap: Math.min(mp.max, Math.round(mp.base*(0.55+0.06*lv)*(1+dark*0.2))) + (MP.active?14:0),
    // quantos nascem por tick de spawn
    batch: Math.min(4, 1+Math.floor(lv/4)+night),
    // chance de especial sobe com o dia
    special: clamp(0.08+lv*0.04, 0.08, 0.50)
  };
}
function pickZombieKind(){
  const dd=dayDiff();
  if(Math.random()<dd.special){
    const pool=ZUNLOCK.filter(u=>dd.d>=u[1]);
    if(pool.length){
      let tot=0;for(const u of pool)tot+=u[2];
      let r=Math.random()*tot;
      for(const u of pool){r-=u[2];if(r<=0)return u[0];}
      return pool[pool.length-1][0];
    }
  }
  return Math.random()<0.58?0:1;
}

const DECOR_BY_MAP={
  forest:['bush','bush2','flower_r','flower_b','flower_y','mushroom','fern','log','stump','tallgrass','berry','rock_moss'],
  desert:['cactus_sm','cactus_bg','cactus_tall','skull','tumbleweed','rock_sm','bone','dune','drybush','sandrock','yucca'],
  snow:['ice','snowman','pine_sm','icicle','frozen_bush','snowpile','crystal','frozen_log','ski','flag'],
  city:['trash','bench','lamp','sign','papers','crate','hydrant','cone','dumpster','graffiti','barrier','mailbox','bike']
};

