/* Variedade de pedras: varios tipos por mapa, sorteados pela posicao (igual nos dois jogadores), sprites guardados e icone novo.
   Uso: node tests/teste-variedade-pedras.js [index.html] [galeria.png] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shot = process.argv[3];
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); const o = { tipos: {}, vazios: 0, igual: true, cache: true, draw: true };
    for (const map of ['forest', 'snow', 'desert', 'city']) {
      selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
      const set = new Set();
      for (const r of rocks) {
        const a = rockKind(r); set.add(a);
        const s = rockSprite(r.k | 0, a, Math.floor((r.seed || 0) * 4) & 3);
        if (!s || s.top < 4 || s.half < 4) o.vazios++;
        if (rockSprite(r.k | 0, a, Math.floor((r.seed || 0) * 4) & 3) !== s) o.cache = false;
      }
      o.tipos[map] = set.size;
      for (const r of rocks.slice(0, 50)) { const a1 = rockKind(r); delete r._a; if (rockKind(r) !== a1) o.igual = false; }
      try { for (const r of rocks.slice(0, 30)) drawRock(r); } catch (e) { o.draw = false; }
    }
    return o;
  });
  for (const m of ['forest', 'snow', 'desert', 'city']) ok(r.tipos[m] >= 4, 'mapa ' + m + ' tem ' + r.tipos[m] + ' tipos de pedra');
  ok(r.vazios === 0, 'nenhum sprite vazio'); ok(r.cache, 'sprites guardados'); ok(r.igual, 'sorteio so pela posicao'); ok(r.draw, 'desenha sem erro');
  if (shot) {
    await pg.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = 844; cv.height = 390; cv.id = 'gal'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#445';
      document.body.appendChild(cv); const g = cv.getContext('2d'); const old = ctx; window.ctx = g; g.imageSmoothingEnabled = false;
      const maps = ['forest', 'snow', 'desert', 'city']; g.fillStyle = '#4a6a3a'; g.fillRect(0, 0, 844, 390);
      maps.forEach((m, i) => {
        selectedMap = m; g.fillStyle = ['#4a6a3a', '#cdd8e4', '#d8c08a', '#5a5e64'][i]; g.fillRect(0, i * 78, 844, 78);
        for (let a = 0; a < 6; a++) for (let v = 0; v < 2; v++) { const s = rockSprite(a === 5 ? 5 : 0, a, v); g.save(); g.scale(2, 2); g.drawImage(s.cv, (a * 2 + v) * 34 - 4, i * 39 + 2 - 8 + 0); g.restore(); }
      });
      window.ctx = old;
    });
    await pg.screenshot({ path: shot });
  }
  ok(errs.length === 0, 'sem erros de pagina ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
