/* Plantacao e frutiferas nos 4 mapas: sementes nas casas (so as que vingam no mapa), macieira/frutinhas/tamareira/cacto selvagens,
   colher, rebrotar, comer devolve semente, culturas novas (tomate, cenoura e perenes), hortas abandonadas, save e multiplayer,
   e a geracao do mundo continua a mesma (so entram itens extras).
   Uso: node tests/teste-plantacao-frutiferas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const NEW=map=>pg.evaluate((map)=>{localStorage.clear();selectedMap=map;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];
  const o={map};
  const fr={};for(const t of trees){const f=fruitOf(t);if(f)fr[f]=(fr[f]||0)+1;}for(const d of decorations){const f=fruitOf(d);if(f)fr[f]=(fr[f]||0)+1;}o.fruit=fr;
  const sd={};for(const it of items)if(/^seed_/.test(it.t))sd[it.t]=(sd[it.t]||0)+1;o.seeds=sd;
  const withSeed=new Set();for(const it of items)if(/^seed_/.test(it.t)){const q=blds.find(q=>it.x>q.x&&it.x<q.x+q.w&&it.y>q.y&&it.y<q.y+q.h);if(q)withSeed.add(q);}
  o.houses=blds.length;o.withSeed=withSeed.size;o.plots=plotList().length;o.gh=ghList().length;
  o.mature=plotList().filter(p=>p.c).length;
  return o;},map);
const POOL={forest:['seed_corn','seed_potato','seed_tomato','seed_carrot','seed_apple','seed_berry'],city:['seed_corn','seed_potato','seed_tomato','seed_carrot','seed_apple','seed_berry'],
  desert:['seed_melon','seed_corn','seed_date','seed_cactus'],snow:['seed_corn','seed_potato','seed_tomato','seed_carrot','seed_apple','seed_berry']};
for(const map of ['forest','city','desert','snow']){
  const o=await NEW(map);console.log(JSON.stringify(o));
  const ks=Object.keys(o.seeds);
  ok(ks.length>0&&ks.every(k=>POOL[map].includes(k)),map+': sementes nas casas so das que vingam aqui ('+ks.join(',')+')');
  ok(o.withSeed>=Math.max(8,o.houses*.15),map+': varias casas guardam semente ('+o.withSeed+' de '+o.houses+')');
  if(map==='snow')ok(Object.keys(o.fruit).length===0,'neve: nenhuma planta selvagem');
  if(map==='forest')ok(o.fruit.apple>20&&o.fruit.berry>20,'floresta: macieiras e frutinhas ('+JSON.stringify(o.fruit)+')');
  if(map==='city')ok(o.fruit.apple>5&&!o.fruit.berry&&!o.fruit.date,'cidade: so macieiras nos parques e ruas ('+JSON.stringify(o.fruit)+')');
  if(map==='desert')ok(o.fruit.date>20&&o.fruit.pricklypear>20&&!o.fruit.apple,'deserto: tamareiras e cactos ('+JSON.stringify(o.fruit)+')');
  if(map==='forest'||map==='desert')ok(o.plots>=6,map+': tem horta abandonada ('+o.plots+' canteiros)');
}
// neve: estufa abandonada aparece em algum dos mundos sorteados
{let gh=0,seedsOk=true;for(let i=0;i<6&&!gh;i++){const o=await NEW('snow');gh=o.gh;}ok(gh>=1,'neve: estufa abandonada ao lado das cabanas');}
// -------- colher, rebrotar, comer --------
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;
  const o={};
  const t=trees.find(q=>fruitOf(q)==='apple');o.hasTree=!!t;
  P.inside=null;P.inVehicle=null;P.dead=false;P.x=t.x;P.y=t.y+14;P.face=-Math.PI/2;P.inv=[];
  o.ripe0=fruitRipe(t);const tg=pickTarget();o.kind=tg&&tg.k;o.act=tg&&tg.act;
  pickup();const apples=countInv('apple');o.apples=apples;o.ripe1=fruitRipe(t);
  o.noMore=(()=>{const g=pickTarget();return !g||g.k!=='fruit'||g.o!==t;})();
  // volta a dar fruto depois de um tempo
  fruitTick(DAY_SECONDS*1.4);o.stillWait=!fruitRipe(t);fruitTick(DAY_SECONDS*.2);o.ripe2=fruitRipe(t);
  // comer devolve semente
  const sBefore=countInv('seed_apple');o.eat=applyUse('apple');o.seedGain=seedGain;giveSeedFor();o.seedAfter=countInv('seed_apple')-sBefore;
  // frutas e verduras no inventario podem ser comidas
  o.eatable=['apple','berry','date','pricklypear','tomato','carrot'].map(k=>EATABLE(k));
  // save e carregar so guardam quem esta sem fruto
  pickup();const pk=fruitPack();o.pack=pk.length;const ref=t;fruitLoad([]);o.cleared=fruitRipe(ref);fruitLoad(JSON.parse(JSON.stringify(pk)));o.reloaded=!fruitRipe(ref);
  fruitLoad([[1,2,3],'x',null,[NaN,1,1],[t.x,t.y,-5]]);o.badLoad=true;
  fruitLoad(JSON.parse(JSON.stringify(pk)));
  // multiplayer
  fruitLoad([]);fruitRemote({x:t.x,y:t.y,r:100});o.remote=!fruitRipe(t);fruitRemote({x:'a',y:1});fruitRemote(null);o.remoteBad=true;
  // inventario cheio: fruto cai no chao
  fruitLoad([]);P.inv=[];for(const k of ['wood','stone','bandage','cloth','water','food'])addItem(k);const n0=items.length;pickup();o.dropped=items.length-n0;o.inv=P.inv.length;
  return o;});
console.log(JSON.stringify(r));
ok(r.hasTree&&r.ripe0&&r.kind==='fruit'&&r.act==='COLHER','botao de interagir oferece COLHER na macieira madura');
ok(r.apples>=2&&r.apples<=4&&!r.ripe1&&r.noMore,'colher da 2 a 4 macas e a arvore fica sem fruto ('+r.apples+')');
ok(r.stillWait&&r.ripe2,'a macieira volta a dar fruto depois de 1,5 dia');
ok(r.eat&&r.seedGain==='seed_apple'&&r.seedAfter===1,'comer maca devolve 1 semente de maca');
ok(r.eatable.every(Boolean),'todas as frutas e verduras novas podem ser comidas');
ok(r.pack===1&&r.cleared&&r.reloaded&&r.badLoad,'save guarda so o que esta sem fruto e ignora lixo');
ok(r.remote&&r.remoteBad,'multiplayer: colheita chega ao outro jogador e dados ruins sao ignorados');
ok(r.dropped>=2,'inventario cheio: o fruto cai no chao ('+r.dropped+')');
// -------- plantar frutiferas e culturas novas --------
const pl=await pg.evaluate(()=>{
  const o={};const w=map=>{localStorage.clear();selectedMap=map;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;plotsLoad([]);ghLoad([]);P.inside=null;P.dead=false;P.inv=[];};
  const free=()=>{for(let i=0;i<800;i++){const x=(60+((i*37)%120))*16+8,y=(60+((i*53)%90))*16+8;if(!soilBad(x,y)&&!soilBad(x+16,y)&&!plotList().some(p=>Math.abs(p.cx*16-x)<40&&Math.abs(p.cy*16-y)<40))return {cx:Math.floor(x/16),cy:Math.floor(y/16)};}return null;};
  const till=(f)=>{P.tool='hoe';P.x=f.cx*16+8-14;P.y=f.cy*16+8;P.face=0;hoeTill(true);return plotList().find(p=>p.cx===f.cx&&p.cy===f.cy);};
  const grow=(p,days)=>{for(let i=0;i<days*20;i++){p.w=DAY_SECONDS;plantTick(DAY_SECONDS/20);}};
  w('forest');
  for(const [seed,crop,item] of [['seed_tomato','tomato','tomato'],['seed_carrot','carrot','carrot'],['seed_apple','apple','apple'],['seed_berry','berry','berry']]){
    const f=free();const p=till(f);if(!p){o[crop]='sem terra';continue;}
    P.inv=[];addItem(seed);plotDo({act:'PLANTAR',p});const planted=p.c===crop;
    grow(p,planted?(crop==='apple'?3.2:1.7):0);
    const ripe=plotCands().some(c=>c.p===p&&c.act==='COLHER');
    P.inv=[];plotDo({act:'COLHER',p});
    o[crop]={planted,ripe,got:countInv(item),seed:countInv(seed),keeps:p.c};
    if(['apple','berry'].includes(crop)){ // perene: continua plantada e rebrota
      const g0=p.g;grow(p,1.7);o[crop].regrow=plotCands().some(c=>c.p===p&&c.act==='COLHER');o[crop].g0=g0;
    }
    plotsLoad([]);
  }
  // semente que nao vinga no mapa
  {const f=free();const p=till(f);P.inv=[];addItem('seed_date');plotDo({act:'PLANTAR',p});o.dateInForest=p.c;}
  w('desert');
  for(const [seed,crop,item] of [['seed_date','date','date'],['seed_cactus','cactus','pricklypear']]){
    const f=free();const p=till(f);if(!p){o[crop]='sem terra';continue;}
    P.inv=[];addItem(seed);plotDo({act:'PLANTAR',p});const planted=p.c===crop;grow(p,3.2);
    P.inv=[];plotDo({act:'COLHER',p});o['d_'+crop]={planted,got:countInv(item),keeps:p.c};plotsLoad([]);
  }
  {const f=free();const p=till(f);P.inv=[];addItem('seed_apple');plotDo({act:'PLANTAR',p});o.appleInDesert=p.c;}
  // neve: estufa aceita tudo
  w('snow');
  {const sp=ghSpot();o.snowSpot=!!sp;if(sp){ghBuild(sp);const g=ghList()[0];const p=(()=>{P.tool='hoe';P.x=g.x+8-14+16;P.y=g.y+24;P.face=0;hoeTill(true);return plotList()[0];})();addItem('seed_apple');plotDo({act:'PLANTAR',p});o.snowApple=p&&p.c;}}
  return o;});
console.log(JSON.stringify(pl));
for(const c of ['tomato','carrot','apple','berry']){const q=pl[c];ok(q&&q.planted&&q.ripe&&q.got>=3,'planta e colhe '+c+' ('+JSON.stringify(q)+')');}
ok(pl.tomato&&pl.tomato.seed>=1&&pl.tomato.keeps===null&&pl.carrot.keeps===null,'tomate e cenoura sao anuais e devolvem semente ao colher');
ok(pl.apple&&pl.apple.keeps==='apple'&&pl.apple.seed===0&&pl.apple.regrow&&pl.berry.keeps==='berry'&&pl.berry.regrow,'macieira e arbusto continuam plantados e rebrotam sem devolver semente');
ok(pl.dateInForest===null&&pl.appleInDesert===null,'tamara nao vinga na floresta e maca nao vinga no deserto');
for(const c of ['date','cactus']){const q=pl['d_'+c];ok(q&&q.planted&&q.got>=3&&q.keeps===c,'deserto: planta e colhe '+c+' ('+JSON.stringify(q)+')');}
ok(pl.snowSpot&&pl.snowApple==='apple','neve: macieira vinga dentro da estufa');
// -------- horta abandonada: colher da comida e sementes --------
const hz=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;
  const o={};const pls=plotList();o.n=pls.length;o.crops=[...new Set(pls.map(p=>p.c))].filter(Boolean);
  const p=pls.find(q=>q.c&&q.g>=1&&['corn','potato','tomato','carrot','melon'].includes(q.c));
  if(!p){return Object.assign(o,{none:true});}
  const cr=p.c;P.inv=[];P.inside=null;P.dead=false;P.x=p.cx*16+8;P.y=p.cy*16+8+14;P.face=-Math.PI/2;P.tool=null;
  const tg=pickTarget();o.act=tg&&tg.act;plotDo(tg);o.food=P.inv.length>0;o.seeds=P.inv.some(s=>/^seed_/.test(s.t));
  // gerador proprio: o mesmo mundo da as mesmas hortas
  const a=JSON.stringify(plotsPack());genWorld(worldSeed);const b2=JSON.stringify(plotsPack());genWorld(worldSeed);o.same=b2===JSON.stringify(plotsPack());o.cnt=plotList().length;
  // salvar e carregar mantem as hortas
  const pk=plotsPack();plotsLoad(JSON.parse(JSON.stringify(pk)));o.reload=plotList().length===pk.length;
  return o;});
console.log(JSON.stringify(hz));
ok(hz.n>=6&&hz.crops.length>=2,'floresta: horta abandonada com mais de uma cultura ('+hz.n+' canteiros, '+hz.crops+')');
ok(!hz.none&&hz.act==='COLHER'&&hz.food&&hz.seeds,'colher da horta abandonada da comida e sementes');
ok(hz.same&&hz.reload,'mesma semente do mundo gera as mesmas hortas e o save as mantem');
// -------- geracao do mundo: nada mudou alem dos itens extras --------
const gen=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
  const h=a=>a.map(o=>Math.round(o.x)+','+Math.round(o.y)).join('|');
  genWorld(4242);const A=[h(trees),h(blds),h(vehicles),h(decorations),h(animals),items.length];
  genWorld(4242);const B=[h(trees),h(blds),h(vehicles),h(decorations),h(animals),items.length];
  return JSON.stringify(A)===JSON.stringify(B);});
ok(gen,'mesma semente gera o mesmo mundo (arvores, casas, carros, itens)');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
