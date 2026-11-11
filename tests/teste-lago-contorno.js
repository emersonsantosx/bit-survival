/* Contorno do lago fecha sem emenda ("ponta" no lado direito): o raio em 0 e em 2π e igual, nao ha degrau entre pontos vizinhos do contorno,
   o contorno desenhado e o da colisao sao o mesmo, e isso vale para todos os lagos dos 4 mapas.
   Uso: node tests/teste-lago-contorno.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'snow', 'desert', 'city']) {
    const r = await pg.evaluate((map) => {
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = map; pendingSlot = 1; showScreen(null); newGame();
      let n = 0, seam = 0, step = 0, hit = 0, mid = 0;
      const ls = lakes.filter(l => !l.fountain).concat([{ cx: 100, cy: 100, r: 60 }, { cx: 1234.5, cy: 987.25, r: 90 }, { cx: 3000, cy: 77, r: 40 }]);
      for (const l of ls) {
        n++; seam = Math.max(seam, Math.abs(lakeWobble(l, 0) - lakeWobble(l, 6.283185307179586)));
        let prev = lakeWobble(l, 0); for (let i = 1; i <= 360; i++) { const w = lakeWobble(l, i / 360 * 6.283185307179586); step = Math.max(step, Math.abs(w - prev)); prev = w; }
        // colisao x desenho: ponto logo dentro / logo fora da borda em 12 angulos, incluindo o do emenda
        for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283185307179586, e = l.r * lakeWobble(l, a); mid++;
          const inX = l.cx + Math.cos(a) * (e - 3), inY = l.cy + Math.sin(a) * (e - 3) * .92, outX = l.cx + Math.cos(a) * (e + 3), outY = l.cy + Math.sin(a) * (e + 3) * .92;
          if (!lakes.includes(l) || l.frozen) { hit++; continue; }   // lagos de mentira (so para o contorno) e gelo firme nao entram na colisao
          if (pointInLake(inX, inY) && !pointInLake(outX, outY)) hit++; }
      }
      return { n, seam, step, hit, mid };
    }, map);
    ok(r.seam < 1e-9, map + ': contorno fecha sem emenda (diferenca ' + r.seam.toExponential(1) + ' em ' + r.n + ' lagos)');
    ok(r.step < .06, map + ': sem degrau no contorno (maior passo a cada 1 grau: ' + r.step.toFixed(4) + ')');
    ok(r.hit === r.mid, map + ': a colisao segue exatamente o contorno desenhado (' + r.hit + '/' + r.mid + ')');
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
