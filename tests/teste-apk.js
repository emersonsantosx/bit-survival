/* App Android (tools/preparar-apk.js + android/app.js), simulado no navegador com um cordova.js falso:
   o link do jogo nao muda; no app somem a tela "gire o celular" e o botao de tela cheia, VOLTAR fecha o que esta aberto / pausa / pede
   confirmacao para sair, minimizar pausa o solo e guarda o progresso, e camera e teclado afastam a HUD e o campo de texto.
   Uso: node tests/teste-apk.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const www = fs.mkdtempSync(path.join(os.tmpdir(), 'bit-apk-'));
  /* pacotes falsos no formato dos de verdade (@fontsource/press-start-2p e peerjs), para nao precisar de internet */
  const nm = fs.mkdtempSync(path.join(os.tmpdir(), 'bit-pacotes-'));
  const criar = (f, t) => { fs.mkdirSync(path.dirname(path.join(nm, f)), { recursive: true }); fs.writeFileSync(path.join(nm, f), t); };
  criar('@fontsource/press-start-2p/400.css', "@font-face{font-family:'Press Start 2P';src:url(./files/press-start-2p-latin-400-normal.woff2) format('woff2'),url(./files/press-start-2p-latin-400-normal.woff) format('woff')}");
  criar('@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'x'); criar('@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff', 'x');
  criar('peerjs/dist/peerjs.min.js', 'window.Peer=function(){};');
  execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'preparar-apk.js'), www, nm]);
  const app = f => fs.readFileSync(path.join(www, f), 'utf8');
  ok(!/<(link|script)\b[^>]*(href|src)="https?:/.test(app('index.html')), 'o app nao carrega nada da internet ao abrir');
  ok(/url\('vendor\/press-start-2p-latin-400-normal\.woff2'\)/.test(app('css/fonte-telas.css')) && fs.existsSync(path.join(www, 'css/vendor/press-start-2p-latin-400-normal.woff2')), 'a fonte das telas vai dentro do app');
  const cfg = fs.readFileSync(path.join(__dirname, '..', 'config.xml'), 'utf8');
  ok(/<name>Bit Survival<\/name>/.test(cfg) && cfg.includes('version="' + require('../package.json').version + '"'), 'nome "Bit Survival" e mesma versao no config.xml e no package.json');
  const url = fs.readFileSync(path.join(__dirname, '..', 'js', '12-crafting-multiplayer.js'), 'utf8').match(/peerjs@([\d.]+)\//)[1];
  ok(fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'build.yml'), 'utf8').includes('peerjs@' + url), 'o app usa a mesma versao do PeerJS que o link (' + url + ')');
  fs.writeFileSync(path.join(www, 'cordova.js'), `window.__saiu=0;window.__plug=[];window.cordova={exec:(ok,er,s,a)=>{window.__plug.push(s+'.'+a);window.__tela=ok;}};
    navigator.app={exitApp:()=>window.__saiu++};window.addEventListener('load',()=>setTimeout(()=>document.dispatchEvent(new Event('deviceready')),0));`);
  ok(!/cordova\.js|apk\.js/.test(fs.readFileSync(file, 'utf8')), 'o link do jogo nao carrega nada do app');
  const b = await chromium.launch();
  const ctxOpt = { viewport: { width: 800, height: 360 }, hasTouch: true, isMobile: true };
  const pg = await (await b.newContext(ctxOpt)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.join(www, 'index.html')); await pg.waitForTimeout(500);
  const voltar = () => pg.evaluate(() => document.dispatchEvent(new Event('backbutton')));
  const vis = id => pg.evaluate(id => !document.getElementById(id).classList.contains('hide'), id);
  const css = (q, p) => pg.evaluate(([q, p]) => getComputedStyle(document.querySelector(q))[p], [q, p]);
  ok((await pg.evaluate(() => window.__plug.join())) === 'BitApp.observar', 'o jogo pede ao Android os dados da camera e do teclado');
  ok(await pg.evaluate(() => typeof Peer === 'function' && !document.querySelector('script[src^="http"]')), 'o PeerJS ja esta carregado, sem internet');
  await pg.context().setOffline(true);
  for (const [tela, id, fn] of [['mphostscreen', 'hostStatus', 'mpHostStart()'], ['mpjoinscreen', 'joinStatus', "mpJoinStart('ABCDEF')"]]) {
    await pg.evaluate(([t, f]) => { showScreen(t); eval(f); }, [tela, fn]);
    ok(await pg.evaluate(id => /Sem internet/.test(document.getElementById(id).textContent) && !MP.active, id), 'sem internet, ' + tela + ' avisa na hora');
  }
  await pg.context().setOffline(false); await pg.evaluate(() => showScreen('menu'));
  await pg.setViewportSize({ width: 360, height: 800 });
  ok((await css('#rotate', 'display')) === 'none' && (await css('#pauseFS', 'display')) === 'none', 'sem a tela "gire o celular" e sem o botao de tela cheia');
  await pg.setViewportSize({ width: 800, height: 360 });
  /* ---- voltar nos menus ---- */
  for (const t of ['mapscreen', 'slotscreen', 'skinscreen', 'achscreen', 'mpscreen', 'mphostscreen', 'mpjoinscreen', 'configscreen']) {
    await pg.evaluate(t => showScreen(t), t); await voltar();
    const destino = t === 'mapscreen' ? 'slotscreen' : t === 'mphostscreen' || t === 'mpjoinscreen' ? 'mpscreen' : 'menu';
    ok(await vis(destino) && !(await vis(t)), 'voltar em ' + t + ' vai para ' + destino);
  }
  await pg.evaluate(() => { showScreen('configscreen'); cfgOpen('audio'); }); await voltar();
  ok(await vis('configscreen') && await vis('cfgHub'), 'voltar numa secao das configuracoes volta ao menu de secoes');
  await pg.evaluate(() => showScreen('menu')); await voltar();
  ok((await pg.evaluate(() => window.__saiu)) === 0 && await pg.evaluate(() => /fechar/.test(document.getElementById('apkAviso').textContent)), 'no menu, um voltar so avisa');
  await voltar(); ok((await pg.evaluate(() => window.__saiu)) === 1, 'dois voltar seguidos no menu fecham o app');
  /* ---- voltar na partida ---- */
  await pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; startGame(); zombies.length = 0; });
  const st = () => pg.evaluate(() => state);
  await voltar(); ok(await st() === 'pause' && await vis('pausescr'), 'voltar na partida pausa');
  await pg.waitForTimeout(500); await voltar(); ok(await st() === 'play' && !(await vis('pausescr')), 'voltar na pausa continua');
  await voltar(); await pg.waitForTimeout(500); await pg.evaluate(() => document.getElementById('pauseCfg').click());
  ok(await vis('configscreen'), 'configuracoes abrem pela pausa');
  await voltar(); ok(await st() === 'pause' && await vis('pausescr') && !(await vis('configscreen')), 'voltar nas configuracoes da pausa volta para a pausa');
  await pg.waitForTimeout(500); await voltar();
  await pg.evaluate(() => openCraft()); await voltar(); ok(await st() === 'play' && !(await vis('craftscr')), 'voltar fecha a fabricacao');
  await pg.evaluate(() => openInv()); await voltar(); ok(await st() === 'play' && !(await vis('invscr')), 'voltar fecha o inventario');
  await pg.evaluate(() => bigMapOpen()); await voltar(); ok(await st() === 'play' && !(await vis('bigmap')), 'voltar fecha o mapa grande');
  await pg.evaluate(() => { MP.active = true; setChatButtonVisible(true); openChat(); }); await voltar();
  ok(!(await pg.evaluate(() => chatOpen)) && await st() === 'play', 'voltar fecha o chat');
  /* ---- camera e teclado ---- */
  await pg.evaluate(() => window.__tela({ esq: 34, dir: 0, teclado: 0, altura: 360 }));
  const hud = await pg.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(); return { slot: r('#inv .slot').left, jogo: r('#game').left, larg: r('#game').width, msgs: r('#chat-msgs').left }; });
  ok(hud.slot >= 34 && hud.jogo === 0 && hud.larg === 800, 'camera: a HUD se afasta (' + Math.round(hud.slot) + ' px) e o jogo continua na tela toda');
  await pg.evaluate(() => { openChat(); window.__tela({ esq: 34, dir: 0, teclado: 190, altura: 360 }); }); await pg.waitForTimeout(250);
  const campo = await pg.evaluate(() => document.getElementById('chat-input').getBoundingClientRect().bottom);
  ok(campo <= 170, 'teclado: o campo do chat fica acima dele (' + Math.round(campo) + ' de 170)');
  await pg.evaluate(() => window.__tela({ esq: 34, dir: 0, teclado: 0, altura: 360 }));
  ok((await pg.evaluate(() => document.getElementById('chat-panel').getBoundingClientRect().height)) === 360, 'teclado fechado: o chat volta a altura toda');
  await pg.evaluate(() => { closeChat(); MP.active = false; setChatButtonVisible(false); });
  await pg.evaluate(() => { quitToMenu(); showScreen('mpjoinscreen'); document.getElementById('joinCode').focus(); window.__tela({ esq: 0, dir: 0, teclado: 200, altura: 360 }); }); await pg.waitForTimeout(300);
  const cod = await pg.evaluate(() => document.getElementById('joinCode').getBoundingClientRect().bottom);
  ok(cod <= 160, 'teclado nos menus: o campo do codigo sobe (' + Math.round(cod) + ' de 160)');
  await pg.evaluate(() => { document.activeElement.blur(); window.__tela({ esq: 0, dir: 0, teclado: 0, altura: 360 }); });
  ok((await css('#mpjoinscreen', 'transform')) === 'none', 'teclado fechado: a tela volta ao lugar');
  /* ---- minimizar ---- */
  await pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; startGame(); zombies.length = 0; P.x += 7; });
  await pg.evaluate(() => document.dispatchEvent(new Event('pause')));
  ok(await st() === 'pause' && await pg.evaluate(() => Object.keys(localStorage).some(k => (localStorage.getItem(k) || '').length > 500)), 'minimizar pausa o solo e guarda o progresso');
  await pg.evaluate(() => document.dispatchEvent(new Event('resume'))); ok(await st() === 'pause', 'ao voltar, o jogo espera em pausa');
  await pg.evaluate(() => { document.getElementById('pausescr').classList.add('hide'); state = 'play'; MP.active = true; MP.isHost = false; document.dispatchEvent(new Event('pause')); });
  ok(await st() === 'play', 'no multiplayer a partida continua');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); fs.rmSync(www, { recursive: true, force: true }); fs.rmSync(nm, { recursive: true, force: true }); process.exit(bad ? 1 : 0);
})();
