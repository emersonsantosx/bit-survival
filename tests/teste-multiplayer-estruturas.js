/* Multiplayer: o mundo do convidado fica IGUAL ao do anfitriao (arvores, pedras, cercas, pisos, telhados, camas, baus, fogueiras, canteiros, portas).
   Antes: (1) eventos do mundo eram descartados com o jogo em pausa/mapa; (2) so se SOMAVA coisa no convidado (o que ele tinha a mais ou perdeu
   a mais ficava diferente para sempre; arvore derrubada so la, bau com conteudo velho...). Agora o snapshot completo (3 s) corrige nos dois sentidos,
   sem desfazer o que o proprio convidado acabou de fazer (janela de 2,2 s).
   Dois navegadores (anfitriao e convidado) ligados por uma ponte de mensagens de mentira.
   Uso: node tests/teste-multiplayer-estruturas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const mk = async () => { const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); pg.on('pageerror', e => { console.log('ERRO', e.message); bad++; }); await pg.goto('file://' + file); await pg.waitForTimeout(300); return pg; };
  const H = await mk(), G = await mk();
  const conn = `{open:true,send:m=>window.__out.push(JSON.stringify(m))}`;
  const wi = await H.evaluate((conn) => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; window.loadPeerJS = function () {}; selectedMap = 'forest'; mpSlot = 0; mpHostStart();
    window.__out = []; MP.conn = eval('(' + conn + ')'); MP.connected = true;
    const w = hostBuildWorld(); enterMultiplayerGame(true); MP.conn = eval('(' + conn + ')'); MP.connected = true; window.__out = []; return JSON.parse(JSON.stringify(w));
  }, conn);
  let holdG = false;   // true: o que o convidado manda nao chega ao anfitriao (simula pacote em transito)
  async function pump() {
    for (let k = 0; k < 3; k++) {
      const a = await H.evaluate(() => { const o = window.__out; window.__out = []; return o; });
      const c = await G.evaluate(() => { const o = window.__out || []; window.__out = []; return o; });
      if (a.length) await G.evaluate(l => { MP.lastRecv = performance.now(); for (const s of l) handleNetData(JSON.parse(s), false); }, a);
      if (c.length && !holdG) await H.evaluate(l => { MP.lastRecv = performance.now(); for (const s of l) handleNetData(JSON.parse(s), true); }, c);
    }
  }
  async function run(sec) {
    for (let i = 0; i < sec * 5; i++) {
      await H.evaluate(() => { MP.lastRecv = performance.now(); state = 'play'; update(.2); });
      await G.evaluate(() => { MP.lastRecv = performance.now(); state = 'play'; update(.2); });
      await pump();
    }
  }
  const settle = async () => { await run(1); await H.waitForTimeout(3300); await run(1); };   // o snapshot completo sai a cada 3 s de relogio
  const fp = () => ({
    trees: trees.length + ':' + trees.map(t => t.x * 7 + t.y + (t.hp || 0)).reduce((a, b) => (a + b) % 1e9, 0),
    rocks: rocks.length + ':' + rocks.map(t => t.x * 7 + t.y + (t.hp || 0)).reduce((a, b) => (a + b) % 1e9, 0),
    stash: JSON.stringify(stashPack()), wells: JSON.stringify(wellPack()), logs: JSON.stringify(logPack()),
    fence: JSON.stringify(fencePack()), cell: JSON.stringify(cellPack()), plots: JSON.stringify(plotsPack().map(p => [p[0], p[1], p[2]])),
    gh: JSON.stringify(ghPack()), br: JSON.stringify(structPack()), tents: JSON.stringify(tents.map(t => [t.x, t.y])),
    camp: JSON.stringify(campfires.map(c => [c.x, c.y])), doors: JSON.stringify(doorsPack()), ice: JSON.stringify(icePack())
  });
  const cmp = async (label) => {
    const a = await H.evaluate(`(${fp.toString()})()`), c = await G.evaluate(`(${fp.toString()})()`);
    const d = Object.keys(a).filter(k => a[k] !== c[k]);
    ok(!d.length, label + (d.length ? ' | diferem: ' + d.map(k => k + ' H=' + String(a[k]).slice(0, 90) + ' G=' + String(c[k]).slice(0, 90)).join(' || ') : ''));
    return d;
  };
  await G.evaluate((w) => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; MP.active = true; MP.isHost = false;
    handleNetData({ type: 'worldInit', seed: w.seed, map: w.map, sv: w.sv, sp: w.sp }, false);
    handleNetData({ type: 'start', map: w.map }, false);
    window.__out = []; MP.conn = { open: true, send: m => window.__out.push(JSON.stringify(m)) }; MP.connected = true;
  }, wi);
  await G.evaluate(() => { if (!MP.gameStarted) enterMultiplayerGame(false); MP.conn = { open: true, send: m => window.__out.push(JSON.stringify(m)) }; MP.connected = true; window.__out = []; });
  await settle(); await cmp('mundo igual logo na entrada');

  // 1) evento enviado com o jogo em pausa ou no mapa nao se perde mais
  for (const st of ['pause', 'mapview', 'dead']) {
    const n = await H.evaluate((st) => { window.__out = []; state = st; sendEvt('fenceSet', { x: 3, y: 3, d: 'h', g: 0, o: 0 }); const r = window.__out.length; state = 'play'; return r; }, st);
    ok(n === 1, 'evento de estrutura sai mesmo com o jogo em "' + st + '"');
  }
  await H.evaluate(() => { window.__out = []; });

  // 2) o convidado perdeu arvores e pedras que o anfitriao ainda tem; e ficou com vida diferente
  const K = await H.evaluate(() => [trees[100].x + ',' + trees[100].y, trees[200].x + ',' + trees[200].y, rocks[7].x + ',' + rocks[7].y]);
  await G.evaluate((K) => { for (let i = 0; i < 3; i++) trees.splice(40 + i, 1); rocks.splice(5, 1); trees.find(t => t.x + ',' + t.y === K[0]).hp = 1.5; rebuildSolidGrid(); }, K);   // vida baixa so no convidado
  await H.evaluate((K) => { trees.find(t => t.x + ',' + t.y === K[1]).hp = 2.5; rocks.find(t => t.x + ',' + t.y === K[2]).hp = 3; }, K);   // vida baixa so no anfitriao
  // 3) o convidado ficou com coisas a mais / a menos / com conteudo velho
  const build = `(()=>{P.inside=null;P.inv=[{t:'wood',n:200},{t:'stone',n:50},{t:'cloth',n:30}];stashBuild({x:Math.floor(P.x/16)*16+8,y:Math.floor(P.y/16)*16+13,o:2});const s=stashList()[0];s.s=[{t:'wood',n:5},{t:'stone',n:2}];return stashList().length;})()`;
  await H.evaluate(build);
  await run(1);                                   // o convidado ja tem o bau; agora ele fica com conteudo velho e com pecas de sobra
  await H.waitForTimeout(3300); await run(1);
  await G.evaluate(() => {
    stashList()[0].s = [];                         // conteudo velho
    fenceRemote({ x: 40, y: 40, d: 'h', g: 0, o: 0 }); fenceRemote({ x: 41, y: 40, d: 'h', g: 0, o: 0 });   // cercas que so ele tem
    cellRemote({ k: 'f', x: 44, y: 44, on: 1 }); cellRemote({ k: 'r', x: 45, y: 44, on: 1 });
    stashRemote('stashAdd', { x: 300, y: 300, o: 0 });
    campfires.push({ x: 500, y: 500, t: 0, flicker: 0 });
    plotRemote({ cx: 60, cy: 60, c: null, g: 0, w: 0 });
  });
  // 4) peca que o anfitriao tem e o convidado nao: cerca, piso, fogueira, porta aberta, gelo
  await H.evaluate(() => {
    fenceRemote({ x: 50, y: 50, d: 'v', g: 0, o: 0 }); cellRemote({ k: 'f', x: 52, y: 52, on: 1 });
    campfires.push({ x: 700, y: 700, t: 0, flicker: 0 });
    const bl = blds.find(q => q.doors && q.doors.length); if (bl) setDoor(bl.doors[0], 1, true);
    window.__door = !!bl;
  });
  await settle(); await cmp('apos corrigir diferencas nos dois sentidos (arvores, cercas, pisos, bau, fogueiras, canteiro, portas)');
  const t = await G.evaluate(() => ({ c: stashList()[0] && stashList()[0].s.length }));
  ok(t.c === 2, 'bau do convidado recebeu o conteudo do anfitriao (' + t.c + ' pilhas)');
  const hpq = (K) => [trees.find(t => t.x + ',' + t.y === K[0]).hp, trees.find(t => t.x + ',' + t.y === K[1]).hp, rocks.find(t => t.x + ',' + t.y === K[2]).hp];
  const hh = await H.evaluate(hpq, K), gg = await G.evaluate(hpq, K);
  ok(JSON.stringify(hh) === JSON.stringify(gg), 'vida das arvores e pedras igual nos dois (' + hh + ' | ' + gg + ')');

  // 5) o que o convidado acabou de fazer NAO some na tela dele enquanto o anfitriao nao recebeu
  holdG = true;
  await G.evaluate(() => { fenceRemote({ x: 70, y: 70, d: 'h', g: 0, o: 0 }); sendEvt('fenceSet', { x: 70, y: 70, d: 'h', g: 0, o: 0 }); });
  await H.evaluate(() => { MP._vNext = 0; });   // snapshot completo do anfitriao chega logo, sem a cerca (ele ainda nao recebeu o evento)
  for (let i = 0; i < 4; i++) { await H.evaluate(() => { MP.lastRecv = performance.now(); update(.2); }); await pump(); }
  const keep = await G.evaluate(() => fencePack().some(f => f[0] === 70 && f[1] === 70));
  ok(keep, 'cerca que o convidado acabou de colocar continua na tela dele (sem piscar)');
  holdG = false;
  await G.evaluate(() => { window.__out = []; });
  await H.waitForTimeout(2400); await settle();
  await cmp('depois da janela, o anfitriao (que nao recebeu) prevalece e o mundo volta a ficar igual');

  // 6) so manda lista grande quando ela muda (ou no snapshot completo)
  const dl = await H.evaluate(() => {
    MP._vNext = performance.now() + 99999; const a = packSnapshot(), b2 = packSnapshot();
    fenceRemote({ x: 80, y: 80, d: 'v', g: 0, o: 0 }); const c = packSnapshot();
    MP._vNext = 0; const d = packSnapshot();
    return { fn1: b2.fn === undefined, br1: b2.br === undefined, pf1: b2.pf === undefined, fn2: Array.isArray(c.fn), fn3: Array.isArray(d.fn) && Array.isArray(d.dr) && Array.isArray(d.th) };
  });
  ok(dl.fn1 && dl.br1 && dl.pf1, 'listas paradas (cercas, estruturas, pisos) nao vao em todo snapshot');
  ok(dl.fn2, 'cerca nova vai no proximo snapshot');
  ok(dl.fn3, 'snapshot completo leva tudo (cercas, portas, vida das arvores)');
  await b.close(); process.exit(bad ? 1 : 0);
})();
