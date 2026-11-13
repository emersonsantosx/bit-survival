/* Multiplayer com mundos salvos (estilo Minecraft): o host escolhe um slot. Slot ocupado abre aquele mundo (mesma semente, arvores cortadas,
   portas, relogio, jogador e zumbis), slot vazio cria um mundo novo que fica salvo, TEMPORARIO nao salva. O convidado monta o mesmo mundo
   e nunca grava save. A rede (PeerJS) nao e usada: o teste chama as mesmas funcoes que a conexao chama.
   Uso: node tests/teste-multiplayer-mundos.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const mk=async()=>{const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+file);await pg.waitForTimeout(300);pg._errs=errs;return pg;};
const host=await mk();

/* 1) mundo solo no slot 2, com mudancas */
const base=await host.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=2;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
  const t0=trees.length;const gone=trees[5];trees.splice(5,1);rebuildSolidGrid();
  const bi=blds.findIndex(q=>q.doors&&q.doors.length);blds[bi].doors[0].open=1;
  T=777;day=3;kills=9;P.x+=33;P.y+=11;P.hp=71;zombies=zombies.slice(0,12);const nz=zombies.length;
  saveGame();
  const d=readSave0(2);
  return {t0,tn:trees.length,gone:gone.x+','+gone.y,bi,seed:worldSeed,T:d.T,x:Math.round(P.x),y:Math.round(P.y),nz,saved:!!d};});
ok(base.saved&&base.tn===base.t0-1,'mundo solo salvo no slot 2 ('+base.tn+' arvores, 1 cortada)');

/* 2) tela do host lista os slots e sugere o primeiro vazio; slot ocupado esconde a escolha de mapa; save de outra versao fica travado */
const ui=await host.evaluate(()=>{
  state='menu';MP.active=false;MP.isHost=false;mpSlot=-1;
  localStorage.setItem(slotKey(4),'{"v":1}');
  showScreen('mphostscreen');renderHostWorlds();
  const bs=[...document.querySelectorAll('#hostWorlds .map-opt')];
  const o={n:bs.length,sel:bs.findIndex(x=>x.classList.contains('selected'))+1,txt2:bs[1].textContent,bad4:bs[3].disabled,tmp:bs[4].textContent,mapShown:!document.getElementById('mpMapGrid').classList.contains('hide')};
  bs[1].click();o.afterPick=mpSlot;o.mapHidden=document.getElementById('mpMapGrid').classList.contains('hide');o.noNote=!document.getElementById('hostWorldNote');
  localStorage.removeItem(slotKey(4));
  return o;});
ok(ui.n===5&&ui.sel===1&&ui.mapShown,'tela do host: 4 slots + temporario, sugere o primeiro slot vazio com escolha de mapa');
ok(/FLORESTA/.test(ui.txt2)&&/DIA 3/.test(ui.txt2),'slot ocupado mostra mapa e dia ('+ui.txt2+')');
ok(ui.bad4,'save de outra versao fica desabilitado (nunca e sobrescrito)');
ok(/TEMPOR/.test(ui.tmp)&&ui.afterPick===2&&ui.mapHidden&&ui.noNote,'escolher slot ocupado abre o mundo dele (mapa escondido) e a tela nao mostra dica de mundo salvo/novo');

/* 3) host abre o mundo salvo */
const hs=await host.evaluate(()=>{
  window.loadPeerJS=function(){};   // sem rede
  mpHostStart();
  const o={slot:MP.slot,hasSave:!!MP.save,active:MP.active&&MP.isHost};
  const wi=hostBuildWorld();enterMultiplayerGame(true);
  o.seedSame=wi.seed===MP.save.seed;o.map=selectedMap;o.trees=trees.length;o.day=day;o.T=Math.round(T);o.hp=Math.round(P.hp);o.zs=zombies.length;
  o.px=Math.round(P.x);o.py=Math.round(P.y);o.door=blds.findIndex(q=>q.doors&&q.doors.length);o.doorOpen=blds[o.door].doors[0].open;
  o.canSave=canSave();o.worldSeed=worldSeed;o.curSlot=curSlot;o.sp=wi.sp;o.drCount=wi.sv.dr.length;o.state=state;
  T=T+50;saveGame();o.saveAdvanced=readSave0(2).T>=o.T+49;
  o.wi=JSON.parse(JSON.stringify(wi));o.snap=JSON.parse(JSON.stringify(packSnapshot()));
  return o;});
ok(hs.slot===2&&hs.hasSave&&hs.active,'mpHostStart abre o save do slot 2');
ok(hs.seedSame&&hs.map==='forest'&&hs.trees===base.tn,'mesma semente e mesmo mapa; a arvore cortada continua cortada ('+hs.trees+')');
ok(hs.day===3&&Math.abs(hs.T-777)<=2&&hs.hp===71,'relogio, dia e vida do host voltam do save (dia '+hs.day+', T '+hs.T+', hp '+hs.hp+')');
ok(hs.zs===base.nz,'zumbis do save voltam ('+hs.zs+')');
ok(Math.abs(hs.px-base.x)<=3&&Math.abs(hs.py-base.y)<=3,'host volta ao lugar onde parou');
ok(hs.doorOpen===1&&hs.drCount>=1,'porta aberta continua aberta e vai para o convidado');
ok(hs.canSave&&hs.curSlot===2&&hs.worldSeed===hs.wi.seed&&hs.state==='play','host em partida multiplayer pode salvar no slot 2');
ok(hs.saveAdvanced,'salvar durante o multiplayer atualiza o mesmo slot (continua no solo depois)');

/* 4) convidado monta o mesmo mundo e nunca salva */
const guest=await mk();
const gs=await guest.evaluate(({wi,snap})=>{
  localStorage.clear();MP.active=true;MP.isHost=false;
  handleNetData({type:'worldInit',seed:wi.seed,map:wi.map,sv:wi.sv,sp:wi.sp},false);
  const o={worldSeed:worldSeed===wi.seed,doorOpen:blds[blds.findIndex(q=>q.doors&&q.doors.length)].doors[0].open};
  handleNetData({type:'start',map:wi.map},false);
  o.state=state;o.nearHost=Math.hypot(P.x-wi.sp[0],P.y-wi.sp[1])<90;
  const t0=trees.length;applySnapshot(snap);o.trees=trees.length;o.t0=t0;o.canSave=canSave();
  saveGame();o.slots=[1,2,3,4].filter(n=>localStorage.getItem(slotKey(n))).length;
  return o;},{wi:hs.wi,snap:hs.snap});
ok(gs.worldSeed&&gs.doorOpen===1,'convidado recebe a semente e as portas abertas');
ok(gs.state==='play'&&gs.nearHost,'convidado nasce perto do host');
ok(gs.t0===gs.trees+1||gs.trees===base.tn,'depois do snapshot o convidado tem as mesmas arvores do host ('+gs.trees+')');
ok(!gs.canSave&&gs.slots===0,'convidado nao grava save');

/* 5) mundo novo no slot vazio fica salvo; temporario nao salva */
const nw=await host.evaluate(()=>{
  const o={};
  const reset=()=>{state='menu';MP.active=false;MP.isHost=false;MP.gameStarted=false;MP.save=null;MP.slot=0;};
  reset();localStorage.clear();mpSlot=3;mpSelectedMap='desert';mpHostStart();
  o.slot=MP.slot;o.noSave=MP.save===null;hostBuildWorld();enterMultiplayerGame(true);
  const d=readSave0(3);o.saved=!!d&&d.map==='desert';o.map=selectedMap;o.others=[1,2,4].filter(n=>localStorage.getItem(slotKey(n))).length;
  reset();localStorage.clear();mpSlot=0;mpSelectedMap='snow';mpHostStart();hostBuildWorld();enterMultiplayerGame(true);
  o.tmpSaved=[1,2,3,4].filter(n=>localStorage.getItem(slotKey(n))).length;o.tmpCanSave=canSave();
  return o;});
ok(nw.slot===3&&nw.noSave&&nw.saved&&nw.map==='desert'&&nw.others===0,'mundo novo no slot vazio nasce salvo (mapa escolhido, nada mais e tocado)');
ok(nw.tmpSaved===0&&!nw.tmpCanSave,'mundo temporario nao grava nada');

/* 6) o save feito no multiplayer abre no CONTINUAR (solo) */
const solo=await host.evaluate(()=>{
  state='menu';MP.active=false;MP.isHost=false;MP.gameStarted=false;MP.save=null;MP.slot=0;
  localStorage.clear();mpSlot=1;mpSelectedMap='city';mpHostStart();hostBuildWorld();enterMultiplayerGame(true);
  const seed=worldSeed,tn=trees.length;saveGame();state='menu';MP.active=false;MP.isHost=false;MP.gameStarted=false;
  continueGame(1);return {seed:worldSeed===seed,map:selectedMap,tn:trees.length===tn,play:state==='play',solo:!MP.active};});
ok(solo.seed&&solo.map==='city'&&solo.tn&&solo.play&&solo.solo,'mundo criado no multiplayer abre no CONTINUAR do solo');

ok(host._errs.length===0&&guest._errs.length===0,'sem erros de JS ('+host._errs.concat(guest._errs).join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
