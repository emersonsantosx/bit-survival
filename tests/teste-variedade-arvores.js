/* Variedade de arvores: cada mapa tem varias especies alem das originais, sorteadas pela posicao (igual nos dois jogadores), sem mexer no gerador do mundo.
   Uso: node tests/teste-variedade-arvores.js [index.html] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); const o = { esp: {}, vazios: 0, frutaAlt: 0, igual: true, trocadas: {} };
    for (const map of ['forest', 'snow', 'desert', 'city']) {
      selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
      const set = new Set(); let alt = 0;
      for (const t of trees) {
        const a = treeAlt(t, t.k | 0); set.add((t.k | 0) + ':' + a); if (a) alt++;
        if (a && window.fruitOf(t)) o.frutaAlt++;
        const s = treeSprite(t.k | 0, Math.floor((t.seed || 0) * 4) & 3, false, a);
        if (!s || !s.top || s.top < 4) o.vazios++;
      }
      o.esp[map] = set.size; o.trocadas[map] = +(alt / trees.length).toFixed(2);
      // o sorteio e so da posicao: mesmo resultado em outra chamada
      for (const t of trees.slice(0, 50)) { const a1 = treeAlt(t, t.k | 0); delete t._a; if (treeAlt(t, t.k | 0) !== a1) o.igual = false; }
      // desenha sem erro
      state = 'play'; for (let i = 0; i < 5; i++) { update(.03); render(); }
    }
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.esp.forest >= 9 && r.esp.snow >= 6 && r.esp.desert >= 6 && r.esp.city >= 6, 'cada mapa tem varias especies na pratica (' + JSON.stringify(r.esp) + ')');
  ok(Object.values(r.trocadas).every(x => x > .3 && x < .6), 'cerca de 45% das arvores trocam de especie (' + JSON.stringify(r.trocadas) + ')');
  ok(r.vazios === 0, 'todo sprite tem copa desenhada');
  ok(r.frutaAlt === 0, 'arvore que da fruto nunca troca de especie');
  ok(r.igual, 'o sorteio depende so da posicao (igual para os dois jogadores)');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
