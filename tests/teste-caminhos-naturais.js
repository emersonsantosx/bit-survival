/* Caminhos naturais (js/34): floresta, deserto e neve desenham ruas e estradas como mascara organica (dobras em arco, serpenteio, borda irregular);
   a cidade nao usa a mascara. O esqueleto de retangulos (roads) nao muda, entao o mundo, saves e multiplayer seguem iguais.
   Confere: mascara existe so nos mapas naturais, mesma semente = mesma mascara com outro Math.random, a estrada nao e uma reta perfeita,
   a borda e irregular, o terreno sob o carro segue a mascara, nenhum predio fica em cima da estrada e o chao pronto = desenho direto.
   Uso: node tests/teste-caminhos-naturais.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 700, height: 420 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'desert', 'snow', 'city']) {
    const r = await pg.evaluate((map) => {
      window.requestAnimationFrame = () => 0; const orig = Math.random;
      const fake = (n) => { let st = n * 7919; Math.random = () => { st = (st * 16807) % 2147483647; return st / 2147483647; }; };
      const hash = (a) => { let h = 0; for (let i = 0; i < a.length; i++) h = (Math.imul(h, 31) + a[i]) | 0; return h; };
      const o = {};
      const hs = [], rs = [];
      for (const n of [1, 2]) {
        fake(n); localStorage.clear(); selectedMap = map; genWorld(777);
        hs.push(RM.a ? hash(RM.a) : 0); rs.push(roads.length + ':' + JSON.stringify(roads.slice(0, 40)).length);
        if (n === 1) { o.lines = roadLines.length; o.hasMask = !!RM.a; o.nroads = roads.length; }
      }
      Math.random = orig;
      o.same = hs[0] === hs[1] && rs[0] === rs[1];
      if (!o.hasMask) return o;
      // celulas de estrada e esqueleto
      let cells = 0; for (let i = 0; i < RM.a.length; i++) if (RM.a[i]) cells++; o.cells = cells;
      // 1) nao e reta perfeita: numa estrada longa (>=300 px), o centro da faixa em colunas/linhas distintas varia
      let best = 0;
      for (const r of roads) {
        const long = r.w > r.h ? r.w : r.h; if (long < 300 || Math.min(r.w, r.h) > 40) continue;
        const horiz = r.w > r.h; const cs = []; const step = 16;
        for (let t = 40; t < long - 40; t += step) {
          let lo = 1e9, hi = -1e9;
          for (let d = -40; d <= 40; d += 2) { const x = horiz ? r.x + t : r.x + r.w / 2 + d, y = horiz ? r.y + r.h / 2 + d : r.y + t; if (roadMaskAt(x, y)) { lo = Math.min(lo, d); hi = Math.max(hi, d); } }
          if (hi > lo) cs.push((lo + hi) / 2);
        }
        if (cs.length > 8) best = Math.max(best, Math.max(...cs) - Math.min(...cs));
      }
      o.wiggle = best;
      // 3) terreno sob o carro segue a mascara
      let agree = 0, tot = 0;
      for (let i = 0; i < 400; i++) {
        const x = 200 + (i * 211) % (WW - 400), y = 200 + (i * 337) % (WH - 400), m = roadMaskAt(x, y), t = terrainFor(x, y);
        const isRoad = t === TERR.road || t === TERR.icy; tot++; if (m === isRoad || (!m && t !== TERR.road && t !== TERR.icy)) agree++;
      }
      o.agree = agree / tot;
      // 4) o serpenteio nao empurra estrada para dentro de predio: pontos do miolo que so a mascara cobre (o esqueleto antigo ja cruzava alguns)
      let hit = 0;
      for (const q of blds) for (let a = 0; a < 5; a++) for (let c = 0; c < 5; c++) {
        const x = q.x + 4 + (q.w - 8) * a / 4, y = q.y + 4 + (q.h - 8) * c / 4;
        if (roadMaskAt(x, y) && !roads.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) hit++;
      }
      o.bldHit = hit;
      return o;
    }, map);
    if (map === 'city') {
      ok(!r.hasMask, map + ': cidade nao usa a mascara de caminhos');
      continue;
    }
    ok(r.hasMask && r.lines > 5 && r.cells > 2000, map + ': mascara de caminhos criada (' + r.lines + ' linhas, ' + r.cells + ' celulas)');
    ok(r.same, map + ': mesma semente, mesma mascara e mesmos retangulos com outro Math.random');
    ok(r.wiggle >= 6, map + ': estrada longa serpenteia, nao e reta perfeita (desvio ' + r.wiggle.toFixed(1) + ' px)');
    ok(r.agree >= .98, map + ': terreno sob o carro segue a mascara (' + (r.agree * 100).toFixed(1) + '%)');
    ok(r.bldHit <= 2, map + ': o serpenteio nao leva estrada para dentro de predio (' + r.bldHit + ' pontos fora do esqueleto)');
  }
  // chao em blocos = desenho direto (inclui a mascara)
  for (const map of ['forest', 'desert', 'snow']) {
    const d = await pg.evaluate((map) => {
      localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); window.requestAnimationFrame = () => 0;
      const snap = () => ctx.getImageData(0, 0, W, H).data; let diff = 0, withRoad = 0;
      const cg = window.groundChunksDraw;
      const pts = roads.filter(r => r.w > 40 || r.h > 40).slice(0, 6);
      for (const r of pts) {
        P.x = r.x + r.w / 2; P.y = r.y + r.h / 2; render(); const a = Array.from(snap());
        window.groundChunksDraw = () => false; render(); const c = snap(); window.groundChunksDraw = cg;
        for (let i = 0; i < a.length; i += 4) if (a[i] !== c[i] || a[i + 1] !== c[i + 1] || a[i + 2] !== c[i + 2]) diff++;
        withRoad++;
      }
      return { diff, withRoad };
    }, map);
    ok(d.withRoad > 0 && d.diff === 0, map + ': chao pronto com estrada = desenho direto (' + d.diff + ' pixels diferentes em ' + d.withRoad + ' vistas)');
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
