/* Desempenho com muitas arvores: pointSolid (tiros, cuspe) usa a grade e da o mesmo resultado da varredura completa;
   chave de arvore em cache; sombras em cache com orcamento por quadro; quadro denso dentro de um limite folgado. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    weatherTimer = 99999; zombies.length = 0; P.dead = false; P.hp = 100; o.arvores = trees.length;
    // 1) pointSolid: mesmo resultado da varredura de todas as arvores, e bem mais rapido
    const brute = (px, py) => { for (const t of trees) { const dx = px - t.x, dy = py - t.y; if (dx > -4 && dx < 4 && dy > -4 && dy < 4 && dx * dx + dy * dy < 12) return true; } return false; };
    let diff = 0, hits = 0; const pts = [];
    for (let i = 0; i < 400; i++) { const t = trees[(i * 13) % trees.length]; pts.push([t.x + (i % 7) - 3, t.y + (i % 5) - 2]); }
    for (let i = 0; i < 600; i++) pts.push([500 + Math.random() * 7000, 500 + Math.random() * 7000]);
    const saveV = vehicles.slice(); vehicles.length = 0; wallGrid();
    for (const [x, y] of pts) { const a = pointSolid(x, y), c = brute(x, y); if (a) hits++; if (c && !a) diff++; }
    vehicles.push(...saveV);
    o.diff = diff; o.hits = hits;
    const t0 = performance.now(); for (let i = 0; i < 5000; i++) pointSolid(1000 + (i * 37) % 6000, 1000 + (i * 91) % 6000); o.msPorChamada = (performance.now() - t0) / 5000;
    // 2) derrubar uma arvore atualiza a grade (nao fica "fantasma")
    const t = trees[10], tx = t.x, ty = t.y; o.antes = pointSolid(tx, ty); trees.splice(10, 1); rebuildSolidGrid(); o.depois = brute(tx, ty) ? 'ainda' : pointSolid(tx, ty);
    // 3) chave em cache acompanha a posicao
    const q = { x: 5, y: 6 }; o.k1 = objKey(q); q.x = 9; o.k2 = objKey(q);
    // 4) quadro denso: maximo folgado (so pega regressao grande, como voltar a varrer tudo)
    let best = null; for (let i = 0; i < 300; i++) { const x = 400 + Math.random() * 7600, y = 400 + Math.random() * 7600; const d = trees.filter(a => Math.hypot(a.x - x, a.y - y) < 170).length; if (!best || d > best.d) best = { x, y, d }; }
    P.x = best.x; P.y = best.y; for (let i = 0; i < 20; i++) { update(1 / 60); render(); }
    const ms = []; for (let i = 0; i < 60; i++) { update(1 / 60); const a = performance.now(); render(); ms.push(performance.now() - a); } ms.sort((a, b) => a - b);
    o.denso = best.d; o.medianaMs = ms[30];
    // 5) orcamento de sombras por quadro
    o.orc = typeof SH_BUD === 'number' && SH_BUD <= 6;
    return o;
  });
  ok(r.arvores > 1000, 'mapa com muitas arvores (' + r.arvores + ')');
  ok(r.diff === 0, 'pointSolid acha tudo que a varredura completa acha (' + r.diff + ' diferencas, ' + r.hits + ' acertos)');
  ok(r.msPorChamada < 0.01, 'pointSolid rapido (' + r.msPorChamada.toFixed(4) + ' ms por chamada)');
  ok(r.antes === true && r.depois === false, 'arvore derrubada some da grade');
  ok(r.k1 === '5,6' && r.k2 === '9,6', 'chave em cache acompanha a posicao');
  ok(r.medianaMs < 40, 'quadro em floresta densa (' + r.denso + ' arvores perto): mediana ' + r.medianaMs.toFixed(1) + ' ms');
  ok(r.orc, 'orcamento de sombras por quadro');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
