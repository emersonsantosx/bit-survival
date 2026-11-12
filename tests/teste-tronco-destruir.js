/* Tronco construido pode ser destruido a golpes (devolve as 4 madeiras); o gerado com o mundo nao; quem esta sentado levanta; vai para o outro jogador
   (evento logDel e snapshot completo). Uso: node tests/teste-tronco-destruir.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); zombies = []; animals = [];
    trees.length = 0; rocks.length = 0; blds.length = 0; lakes.length = 0; items.length = 0; campfires.length = 0; rebuildSolidGrid(); state = 'play'; P.inside = null;
    const o = {}; const sent = []; MP.active = true; MP.connected = true; MP.gameStarted = true; MP.conn = { open: true, send(m) { sent.push(m); } };
    P.x = 1600; P.y = 1600; P.face = Math.PI / 2; P.inv = [{ t: 'wood', n: 4 }]; P.weapon = 'axe'; P.tool = 'log'; P.meleeWeapons = ['axe'];
    fenceBuild(false); o.built = logList().filter(l => !l.g).length;
    const L = logList().find(l => !l.g); o.wood0 = countInv('wood');
    // bate de frente (tronco logo abaixo do personagem)
    P.x = L.x; P.y = L.y - 22; P.face = Math.PI / 2; P.tool = null;
    let golpes = 0; for (let i = 0; i < 12 && logList().includes(L); i++) { P.cd = 0; P.face = Math.PI / 2; attack(); golpes++; }
    o.sumiu = !logList().includes(L); o.golpes = golpes; o.wood1 = countInv('wood'); o.solido = querySolidNear(L.x, L.y - 3, 6).length === 0;
    o.evt = sent.some(m => JSON.stringify(m).includes('logDel'));
    // tronco gerado com o mundo nao sai
    logList().push({ x: 1700, y: 1700, a: 'h', g: 1 }); const G = logList().find(l => l.g); P.x = G.x; P.y = G.y - 22; for (let i = 0; i < 12; i++) { P.cd = 0; P.face = Math.PI / 2; attack(); } o.gerado = logList().includes(G);
    // sentado: levanta
    fenceBuild(false); P.inv = [{ t: 'wood', n: 4 }]; P.tool = 'log'; P.x = 1500; P.y = 1500; P.face = Math.PI / 2; fenceBuild(false);
    const L2 = logList().find(l => !l.g); P.tool = null; P.x = L2.x - 10; P.y = L2.y - 10; logSit(L2); o.sentou = !!P.sitting;
    L2.hp = .1; P.cd = 0; P.x = L2.x; P.y = L2.y - 22; P.face = Math.PI / 2; if (!P.sitting) P.sitting = { L: L2, sx: L2.x, sy: L2.y - 5, i: 0 }; logRemove(L2); o.levantou = !P.sitting;
    // remoto: logDel apaga; snapshot completo tira o que o anfitriao nao tem
    logRemote('logAdd', { x: 1800, y: 1800, a: 0 }); o.add = logList().some(l => l.x === 1800);
    logRemote('logDel', { x: 1800, y: 1800, a: 0 }); o.del = !logList().some(l => l.x === 1800);
    logRemote('logAdd', { x: 1900, y: 1900, a: 0 }); logSnapshot([], 1); o.mantem = logList().some(l => l.x === 1900); logSnapshot([], 2); o.reconcilia = !logList().some(l => l.x === 1900);
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.built === 1, 'tronco construido com 4 madeiras');
  ok(r.sumiu && r.golpes > 1 && r.golpes <= 12, 'tronco some a golpes (' + r.golpes + ' golpes)');
  ok(r.wood1 - 0 === 4 && r.wood0 === 0, 'devolve as 4 madeiras (' + r.wood1 + ')');
  ok(r.solido, 'tronco destruido nao bloqueia mais a passagem');
  ok(r.evt, 'avisa o outro jogador (logDel)');
  ok(r.gerado, 'tronco gerado com o mundo nao e destruido');
  ok(r.levantou, 'quem estava sentado levanta');
  ok(r.add && r.del, 'evento logAdd/logDel do outro jogador');
  ok(r.mantem && r.reconcilia, 'snapshot completo remove o tronco que o anfitriao nao tem (sem remover na atualizacao parcial)');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
