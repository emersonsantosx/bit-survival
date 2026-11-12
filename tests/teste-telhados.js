/* Telhados das casas dos mapas: nada de "farelo" fora do contorno.
   Antes: manchas de musgo/ardosia, palha e sombras redondas passavam alguns pixels do retangulo do telhado e apareciam soltas em volta da casa;
   no deserto os cantos chanfrados eram pintados de volta pelos equipamentos. Agora o corpo do telhado e recortado no retangulo e so as vigas
   (pontas de 3 px nas laterais, desertico) podem passar. Roda todos os tipos de predio dos 4 mapas.
   Uso: node tests/teste-telhados.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage();
  pg.on('pageerror', e => { console.log('ERRO', e.message); bad++; });
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const m of ['forest', 'snow', 'desert', 'city']) {
    for (const snow of [0, 1]) {
      const r = await pg.evaluate(([m, snow]) => {
        localStorage.clear(); selectedMap = m; newGame();
        const M = 12, seen = {}, errs = []; let n = 0;
        for (const bl of blds) {
          bldRoofBuild(bl, snow); const L = bl._look, k = bl.type + '|' + L.shape + '|' + L.tex; if (seen[k]) continue; seen[k] = 1; n++;
          const cv = bl._rc, w = bl.w + 6, h = bl.h - 7, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let up = 0, side = 0, corner = 0;
          for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
            if (!d[(y * cv.width + x) * 4 + 3]) continue;
            const X = x - M, Y = y - M;
            if (Y < 0 || Y >= h) up++;
            else if (X < 0 || X >= w) { if (!(m === 'desert' && (X >= -3 && X < w + 3))) side++; }
          }
          if (m === 'desert' && (L.shape === 'flat' || L.shape === 'flatStep' || L.shape === 'dome')) {
            for (const [X, Y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) if (d[((Y + M) * cv.width + X + M) * 4 + 3]) corner++;
          }
          if (up || side || corner) errs.push(k + ' (cima/baixo ' + up + ', lados ' + side + ', cantos ' + corner + ')');
        }
        return { n, errs };
      }, [m, snow]);
      ok(r.n > 0 && !r.errs.length, m + (snow ? ' com neve' : '') + ': ' + r.n + ' tipos de telhado sem pixels soltos' + (r.errs.length ? ' | ' + r.errs.join('; ') : ''));
    }
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
