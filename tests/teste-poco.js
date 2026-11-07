/* Poco: gerado com o mundo (cidade so em quintal cercado), fabricado no crafting, agua (beber/garrafa), regras por mapa (deserto: poucos goles e
   so perto de oasis; neve: congela e quebra o gelo), horta umida perto dele, save, convidado (evento + snapshot) e arvores que nao nascem em cima.
   Uso: node tests/teste-poco.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const nw=(m)=>pg.evaluate((m)=>{localStorage.clear();selectedMap=m;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';P.inside=null;return true;},m);

/* 1) geracao: mesma semente = mesmos pocos; cidade so em quintal cercado */
for(const m of ['forest','snow','desert','city']){
  await nw(m);
  const g=await pg.evaluate(()=>{const a=wellList().map(w=>w.x+','+w.y).join('|'),n=wellList().length,seed=worldSeed;
    const inYard=wellList().filter(w=>typeof cityYards!=='undefined'&&cityYards.some(q=>w.x>q.x&&w.x<q.x+q.w&&w.y>q.y&&w.y<q.y+q.h)).length;
    const okSolid=wellList().every(w=>!pointInLake(w.x,w.y)&&!bldAt(w.x,w.y));
    genWorld(seed);const b2=wellList().map(w=>w.x+','+w.y).join('|');
    return {n,same:a===b2,inYard,okSolid};});
  const want={forest:2,snow:1,desert:1,city:2}[m];
  ok(g.n===want&&g.same&&g.okSolid,m+': '+g.n+' poco(s) gerado(s) (esperado '+want+'), iguais para a mesma semente');
  if(m==='city')ok(g.inYard===g.n,'cidade: todos os pocos estao dentro de quintais cercados ('+g.inYard+'/'+g.n+'), nenhum em praca');
}

/* 2) craft e agua na floresta */
await nw('forest');
const c=await pg.evaluate(()=>{
  trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;items.length=0;chestList.length=0;rebuildSolidGrid();
  P.x=1600;P.y=1600;P.face=0;P.inv=[{t:'stone',n:8},{t:'wood',n:4}];
  const n0=wellList().length,r=RECIPES.find(q=>q.out==='well');craft(r);
  const o={rec:!!r,n:wellList().length-n0,left:P.inv.length,built:wellList().filter(w=>!w.g).length};
  const w=wellNearby();o.near=!!w;
  P.water=40;wellUse(w);o.drink=P.water;
  P.water=100;P.inv=[];wellUse(w);o.bottle=countInv('water');
  const t=pickTarget();o.target=t&&t.k;
  return o;});
ok(c.rec&&c.n===1&&c.left===0&&c.built===1,'fabricar poco gasta 8 pedras e 4 madeiras e monta 1 poco');
ok(c.near&&c.drink===54&&c.bottle===1,'ÁGUA: bebe quando tem sede (+14) e enche garrafa quando saciado');
ok(c.target==='well','o poco vira alvo de interacao perto dele');

/* 3) quem nao tem material nao monta; poco bloqueia a passagem */
const d=await pg.evaluate(()=>{const n0=wellList().length;P.inv=[{t:'stone',n:3}];craft(RECIPES.find(q=>q.out==='well'));
  const w=wellList()[wellList().length-1];return {n:wellList().length-n0,solid:querySolidNear(w.x,w.y-3,6).length>0};});
ok(d.n===0,'sem material nao monta');ok(d.solid,'poco e solido (bloqueia a passagem)');

/* 4) save e carregar: so o fabricado e salvo, os gerados voltam pela semente */
const s=await pg.evaluate(()=>{const n=wellList().length,built=wellPack().length;saveGame();const sv=readSave0(1);const gen=wellList().filter(w=>w.g).length;
  const wl=sv.wl.length;continueGame(1);return {n,built,wl,after:wellList().length,gen:wellList().filter(w=>w.g).length,afterBuilt:wellList().filter(w=>!w.g).length};});
ok(s.built===1&&s.wl===1,'o save guarda so o poco do jogador');
ok(s.after===s.n&&s.afterBuilt===1,'continuar o jogo devolve os pocos gerados e o do jogador ('+s.after+')');

/* 5) horta umida perto do poco */
const h=await pg.evaluate(()=>{const w=wellList().find(q=>!q.g);const cx=Math.round(w.x/16)+1,cy=Math.round(w.y/16)+2;
  plotsLoad([[cx,cy,null,0,0]]);const p=plotList()[0];const wet0=p.nw;
  const far={cx:cx+30,cy:cy+30};plotsLoad([[far.cx,far.cy,null,0,0]]);return {near:wet0,far:plotList()[0].nw};});
ok(h.near===true&&h.far===false,'canteiro perto do poco fica umido, longe nao');

/* 6) deserto: poucos goles, volta devagar; pode fabricar em qualquer lugar (nao so perto de oasis) */
await nw('desert');
const dz=await pg.evaluate(()=>{
  trees.length=0;rocks.length=0;blds.length=0;rebuildSolidGrid();
  let fx=null,fy=null;for(let k=0;k<800&&fx===null;k++){const x=400+Math.random()*(WW-800),y=400+Math.random()*(WH-800);if(!lakes.some(q=>Math.hypot(x-q.cx,y-q.cy)<q.r+600)&&!solidPoint(x,y,30)&&!pointInLake(x,y)){fx=x;fy=y;}}
  const o={foundFar:fx!==null};P.x=fx;P.y=fy;P.face=0;P.inv=[{t:'stone',n:8},{t:'wood',n:4}];
  const n0=wellList().length;craft(RECIPES.find(q=>q.out==='well'));o.farBuilt=wellList().length-n0;
  const w=wellList().find(q=>!q.g);
  if(w){P.inv=[];P.water=100;let got=0;for(let i=0;i<6;i++){const b=countInv('water');wellUse(w);if(countInv('water')>b)got++;}o.sips=got;
    T+=95;const b2=countInv('water');wellUse(w);o.refill=countInv('water')>b2;}
  return o;});
ok(dz.foundFar&&dz.farBuilt===1,'deserto: monta o poco mesmo longe de qualquer oasis');
ok(dz.sips===3&&dz.refill,'deserto: poco rende 3 goles e se enche de novo devagar ('+dz.sips+')');

/* 7) neve: congela de noite/nevando, o primeiro uso quebra o gelo */
await nw('snow');
const sn=await pg.evaluate(()=>{
  const w=wellList()[0];P.x=w.x;P.y=w.y+26;dark=0;weather='none';
  const o={day:wellFrozen(w)};dark=.8;o.night=wellFrozen(w);P.water=50;wellUse(w);o.broke=P.water===50&&!wellFrozen(w);
  wellUse(w);o.drank=P.water>50;T+=200;o.refrozen=wellFrozen(w);dark=0;weather='snow';o.snowing=wellFrozen(w);
  return o;});
ok(!sn.day&&sn.night&&sn.broke&&sn.drank&&sn.refrozen&&sn.snowing,'neve: congela de noite e nevando, o uso quebra o gelo e depois da agua ('+JSON.stringify(sn)+')');

/* 8) multiplayer: evento e snapshot criam o poco no convidado; arvores nao renascem em cima */
const mpr=await pg.evaluate(()=>{
  const w0=wellList().length;wellRemote('wellAdd',{x:3000,y:3000});wellRemote('wellAdd',{x:3000,y:3000});const a=wellList().length-w0;
  wellSnapshot([[3500,3500],[3000,3000]]);const bb=wellList().length-w0;
  return {a,bb,ev:NET_OK_EVT.has('wellAdd'),spot:window.builtNear(3003,3000,26),far:window.builtNear(3300,3300,26)};});
ok(mpr.a===1&&mpr.bb===2&&mpr.ev,'convidado recebe o poco por evento e por snapshot, sem duplicar');
ok(mpr.spot&&!mpr.far,'arvore e pedra nao renascem em cima do poco');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
