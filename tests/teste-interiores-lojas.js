/* Lojas da cidade com interior do ramo (etapa 1): cada letreiro tem seus moveis, o salao continua alcancavel, o mundo fora das lojas nao muda,
   mesma semente = mesmo interior (multiplayer), moveis quebraveis, loot nos moveis certos e item de save antigo fora das paredes.
   Uso: node tests/teste-interiores-lojas.js [index.html] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext()).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear();
    const SIG = { pizza: ['pcounter', 'diner'], bar: ['barcounter', 'stool'], cafe: ['cafecounter', 'cafetable'], farma: ['pharmcounter', 'medshelf'], market: ['checkout', 'aisle'], boutique: ['clothrack', 'mannequin'] };
    const WORD = { pizza: 'PIZZA', bar: 'BAR', cafe: 'CAFE', farma: 'FARMA', market: '24H', boutique: 'LOJA' };
    const o = { temas: {}, letreiroErrado: 0, semLetreiroComTema: 0, rota: 0, passagem: 0, movelNaParede: 0, itemPerdido: 0, semFicha: [], portas: 0, outras: 0 };
    const city = s => { selectedMap = 'city'; pendingSlot = 1; showScreen(null); newGame(); genWorld(s * 7919); };
    const lay = () => JSON.stringify(blds.map(q => [q.furn.map(f => [f.k, f.x, f.y, f.s]), q.gaps.map(g => g.r)]));
    const world = () => JSON.stringify([trees.map(t => [t.x, t.y]), rocks.map(t => [t.x, t.y]), vehicles.map(v => [v.x, v.y]), items.filter(i => !i.h).map(i => [i.t, i.x, i.y]), items.length, blds.map(q => [q.x, q.y, q.w, q.h, q.type])]);
    for (const seed of [11, 22, 33, 44, 55, 66]) {
      city(seed);
      for (const q of blds) {
        if (q.type !== 'shop') { if (q.theme) o.outras++; continue; }
        const s = shopSignWord(q);
        if (!s) { if (q.theme) o.semLetreiroComTema++; continue; }
        if (!q.theme || WORD[q.theme] !== s) { o.letreiroErrado++; continue; }
        const t = o.temas[q.theme] || (o.temas[q.theme] = { n: 0, a: 0, c: 0 });
        t.n++; if (q.furn.some(f => f.k === SIG[q.theme][0])) t.a++; if (q.furn.some(f => f.k === SIG[q.theme][1])) t.c++;
        if (q.doors.length !== q.gaps.length + 1) o.portas++;
        const keys = [{ x: q.doorX + q.door / 2, y: q.y + q.h - WT - 8 }].concat(q.gaps.map(g => ({ x: g.x, y: g.y })));
        if (!intConnected(q, keys)) o.passagem++;
        // zumbi consegue ir de um comodo a qualquer outro
        for (const r1 of q.rooms) for (const r2 of q.rooms) if (r1 !== r2) { const a = [r1.x + r1.w / 2, r1.y + r1.h / 2], c = [r2.x + r2.w / 2, r2.y + r2.h / 2]; if (intBlocked(q, a[0], a[1], c[0], c[1]) && !intRoute(q, a[0], a[1], c[0], c[1])) o.rota++; }
        for (const f of q.furn) { if (q.iw.some(w => rectsHit(f, w, 0)) || f.x < q.x + WT || f.y < q.y + WT || f.x + f.w > q.x + q.w - WT || f.y + f.h > q.y + q.h - WT) o.movelNaParede++; if (!structFind('m:' + blds.indexOf(q) + ',' + Math.round(f.x) + ',' + Math.round(f.y) + ',' + f.k)) o.semFicha.push(f.k); }
        for (const it of items) if (it.h && it.x >= q.x && it.x <= q.x + q.w && it.y >= q.y && it.y <= q.y + q.h && !q.furn.some(f => f.loot && Math.abs(it.x - f.x - f.w / 2) <= 4 && Math.abs(it.y - f.y - f.h / 2) <= 3)) o.itemPerdido++;
      }
    }
    city(22); const l1 = lay(), w1 = world(); city(5); city(22); o.igual = l1 === lay();
    const f0 = window.shopsTheme; window.shopsTheme = null; city(22); o.mundoIgual = w1 === world(); window.shopsTheme = f0;
    city(22); const q = blds.find(z => z.theme && z.iw.length); const w = q.iw[0]; const it = { t: 'water', x: Math.round(w.x + w.w / 2), y: Math.round(w.y + w.h / 2) }; items.push(it); shopsFixItems();
    o.itemSaiu = !q.iw.some(z => it.x >= z.x && it.x <= z.x + z.w && it.y >= z.y && it.y <= z.y + z.h);
    // todo movel novo tem ficha de quebra propria e desenho proprio
    o.generico = ['pcounter', 'oven', 'prep', 'pboxes', 'diner', 'barcounter', 'bottles', 'stool', 'pool', 'bartable', 'jukebox', 'cafecounter', 'pastry', 'cafetable', 'pharmcounter', 'medshelf', 'medisle', 'checkout', 'freezer', 'produce', 'drinks', 'clothrack', 'mannequin', 'fitting', 'display']
      .filter(k => { const c = document.createElement('canvas'); c.width = c.height = 60; const g = c.getContext('2d'); const d = FURN[k]; furnDraw(g, { k, x: 5, y: 5, w: d[0], h: d[1], s: 't', sd: 1 }, 0, 0); const p = g.getImageData(5 + (d[0] >> 1), 5 + (d[1] >> 1), 1, 1).data; return p[0] === 136 && p[1] === 136 && p[2] === 136; });
    selectedMap = 'forest'; newGame(); genWorld(77); o.foraDaCidade = blds.filter(z => z.theme).length;
    return o;
  });
  console.log(JSON.stringify(r));
  const t = Object.entries(r.temas);
  ok(t.length === 6, 'os seis ramos aparecem na cidade');
  for (const [k, v] of t) ok(v.a / v.n > .95 && v.c / v.n > .8, k + ': balcao/peca principal em ' + v.a + '/' + v.n + ', segunda peca em ' + v.c + '/' + v.n);
  ok(!r.letreiroErrado && !r.semLetreiroComTema && !r.outras, 'interior combina com o letreiro; sem letreiro continua generico');
  ok(!r.passagem && !r.rota && !r.portas, 'porta e passagens livres, com rota para os zumbis (' + [r.passagem, r.rota, r.portas] + ')');
  ok(!r.movelNaParede && !r.semFicha.length, 'moveis dentro dos comodos e encontrados pela chave de quebra');
  ok(!r.itemPerdido, 'itens da loja ficam nos moveis (' + r.itemPerdido + ')');
  ok(r.igual, 'mesma semente gera o mesmo interior');
  ok(r.mundoIgual, 'o resto do mundo nao muda com as lojas novas');
  ok(r.itemSaiu, 'item de save antigo preso na parede sai para o lado');
  ok(!r.generico.length, 'todo movel novo tem desenho ' + r.generico.join(','));
  ok(r.foraDaCidade === 0, 'fora da cidade nada muda');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
