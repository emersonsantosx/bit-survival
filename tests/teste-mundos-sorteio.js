/* Auditoria do sorteio do mundo: (1) a MESMA semente gera exatamente o mesmo mundo mesmo se Math.random for outro (arvores, pedras, predios, itens,
   estradas, lagos, zumbis, animais...), senao anfitriao e convidado do multiplayer (e o carregar save) teriam mundos diferentes;
   (2) varias sementes por mapa geram mundos validos: tem arvores, predios e itens, e o jogador nasce fora de predio, de solido, do lago e longe de zumbi.
   Uso: node tests/teste-mundos-sorteio.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
      window.requestAnimationFrame = () => 0; const orig = Math.random;
      const H = (v) => { const s = JSON.stringify(v, (k, x) => typeof x === 'number' ? Math.round(x * 100) / 100 : (typeof x === 'function' || k[0] === '_' || k === 'img' || k === 'cv' ? undefined : x)); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
      const fake = (n) => { let st = n * 7919; Math.random = () => { st = (st * 16807) % 2147483647; return st / 2147483647; }; };
      const fps = [];
      for (const n of [1, 2, 3]) {
        fake(n); localStorage.clear(); selectedMap = map; genWorld(424242);
        fps.push(['trees', 'rocks', 'blds', 'walls', 'items', 'roads', 'towns', 'lakes', 'vehicles', 'campfires', 'tents', 'decorations', 'animals', 'zombies', 'decals', 'chestList', 'cityGardens', 'cityYards', 'cityPaths', 'cityDecor', 'lampList'].map(k => { try { return k + ':' + H(eval(k)); } catch (e) { return k + ':x'; } }));
      }
      const diff = fps[0].filter((v, i) => fps.some(f => f[i] !== v)).map(v => v.split(':')[0]);
      const invalid = [];
      for (let s = 1; s <= 6; s++) {
        fake(s * 31); localStorage.clear(); selectedMap = map; newGame(); showScreen(null);
        const why = [];
        if (!trees.length) why.push('sem arvores'); if (!blds.length) why.push('sem predios'); if (!items.length) why.push('sem itens');
        if (blds.some(q => q.x < P.x && P.x < q.x + q.w && q.y < P.y && P.y < q.y + q.h)) why.push('spawn dentro de predio');
        if (solidPoint(P.x, P.y, 6)) why.push('spawn em solido');
        if (lakes.some(l => Math.hypot(P.x - l.x, P.y - l.y) < (l.r || l.rx || 40) * .9)) why.push('spawn no lago');
        if (zombies.some(z => Math.hypot(z.x - P.x, z.y - P.y) < 120)) why.push('zumbi colado no spawn');
        if (why.length) invalid.push(s + ':' + why.join(','));
      }
      Math.random = orig; return { diff, invalid };
    }, map);
    ok(!r.diff.length, map + ': mesma semente, mesmo mundo com outro Math.random' + (r.diff.length ? ' | diferem: ' + r.diff.join(',') : ''));
    ok(!r.invalid.length, map + ': 6 sementes geram mundo valido e spawn seguro' + (r.invalid.length ? ' | ' + r.invalid.join('; ') : ''));
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
