/* Copa de arvore x telhado: a arvore na frente da casa (ou ao lado dela) aparece por cima do telhado, sem a ponta cortada;
   a arvore atras da casa continua coberta e o telhado ainda cobre o que esta dentro. Confere em todos os mapas pintando a mesma cena
   com e sem a arvore e contando os pixels do telhado que mudam.
   Uso: node tests/teste-arvore-telhado.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 780, height: 360 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'desert', 'snow', 'city']) {
    const r = await pg.evaluate((map) => {
      window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame();
      zombies.length = 0; animals.length = 0; weather = 'none'; P.dead = false;
      const h = blds.filter(q => q.w >= 60 && q.h >= 50 && q.x > 500 && q.y > 500 && q.x < WW - 600 && q.y < WH - 500)[0];
      if (!h) return { none: true };
      blds = [h]; trees = []; decorations = []; rocks = []; items = []; vehicles = [];
      P.x = h.x + h.w + 90; P.y = h.y + h.h / 2; P.inside = false; h.roofA = 1;
      const roofDiff = (t) => {   // quantos pixels dentro do telhado mudam quando a arvore e colocada
        const shot = () => { render();
          const cv = ctx.canvas, ox = camX, oy = camY, z = cv.width / (W / Z);
          const X = Math.ceil((h.x - 3 - ox) * z) + 2, Y = Math.ceil((h.y - 6 - oy) * z) + 2, ww = Math.floor((h.w + 6) * z) - 4, hh = Math.floor((h.h - 7) * z) - 4;
          return cv.getContext('2d').getImageData(Math.max(0, X), Math.max(0, Y), ww, hh).data; };
        trees = []; const a = shot(); trees = [t]; const c = shot(); trees = [];
        let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) > 24) n++;
        return n;
      };
      const mk = (x, y) => ({ x: Math.round(x), y: Math.round(y), k: map === 'snow' ? 2 : map === 'desert' ? 6 : 1, hp: 4, seed: .3 });
      return {
        frente: roofDiff(mk(h.x + h.w / 2, h.y + h.h + 20)),
        lado: roofDiff(mk(h.x + h.w + 6, h.y + h.h - 8)),
        atras: roofDiff(mk(h.x + h.w / 2, h.y - 4)),
      };
    }, map);
    if (r.none) { console.log('SKIP', map, '(sem casa livre)'); continue; }
    ok(r.frente > 100, map + ': copa da arvore na frente aparece sobre o telhado (' + r.frente + ' px)');
    ok(r.lado > 50, map + ': copa da arvore ao lado nao e cortada (' + r.lado + ' px)');
    ok(r.atras === 0, map + ': arvore atras da casa continua coberta pelo telhado (' + r.atras + ' px)');
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
