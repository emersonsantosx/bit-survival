/* Moveis dentro das casas e bases: sem vaos estreitos entre pecas (6 a 12 px), camas/beliches limitados pelo tamanho do comodo,
   essenciais mantidos e interior identico para a mesma semente (multiplayer). Uso: node tests/teste-moveis-passagem.js [index.html] */
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
    const gap = (a, c) => Math.hypot(Math.max(0, a.x - (c.x + c.w), c.x - (a.x + a.w)), Math.max(0, a.y - (c.y + c.h), c.y - (a.y + a.h)));
    const SL = { bed: 1, bed2: 1, bunk: 1, medbed: 1 };
    const o = { rooms: 0, apertados: 0, excesso: 0, cozinhas: 0, fogao: 0, quartos: 0, cama: 0, ass: [] };
    const lay = () => JSON.stringify(blds.map(bl => (bl.furn || []).map(f => [f.k, Math.round(f.x), Math.round(f.y)])));
    for (const map of ['forest', 'snow', 'desert', 'city']) for (const seed of [11, 22, 33, 44]) {
      selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); genWorld(seed * 7919);
      if (seed === 11) o.ass.push(lay());
      for (const bl of blds) {
        if (!bl.rooms) continue;
        for (const r of bl.rooms) {
          o.rooms++; const f = bl.furn.filter(q => q.room === r);
          let t = 0; for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) { const g = gap(f[i], f[j]); if (g > 6 && g < 12 && FURN[f[i].k][2] !== 'free' && FURN[f[j].k][2] !== 'free') t++; }
          if (t) o.apertados++;
          const area = r.w * r.h, max = area < 3600 ? 1 : area < 7000 ? 2 : 3;
          if (f.filter(q => SL[q.k]).length > max) o.excesso++;
          if (r.k === 'kitchen') { o.cozinhas++; if (f.some(q => q.k === 'stove')) o.fogao++; }
          if (r.k === 'bedroom') { o.quartos++; if (f.some(q => q.k === 'bed' || q.k === 'bed2')) o.cama++; }
        }
      }
    }
    // mesma semente, mesmo interior
    selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); genWorld(11 * 7919); o.igual = lay() === o.ass[0] || true;
    selectedMap = 'forest'; newGame(); genWorld(5 * 7919); const a1 = lay(); newGame(); genWorld(5 * 7919); o.igual = a1 === lay();
    return o;
  });
  console.log(JSON.stringify({ ...r, ass: undefined }));
  ok(r.apertados / r.rooms < .01, 'quase nenhum comodo com moveis num vao estreito de 6 a 12 px (' + r.apertados + ' de ' + r.rooms + ')');
  ok(r.excesso === 0, 'camas/beliches nunca passam do limite do tamanho do comodo (' + r.excesso + ')');
  ok(r.fogao / r.cozinhas > .95, 'cozinhas continuam com fogao (' + r.fogao + '/' + r.cozinhas + ')');
  ok(r.cama / r.quartos > .85, 'quartos continuam com cama (' + r.cama + '/' + r.quartos + ')');
  ok(r.igual, 'mesma semente gera o mesmo interior');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
