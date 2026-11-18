/* Variedade de decoracao (pela semente de cada uma), dano visivel nas pedras e marcas de pneu/esqui dos veiculos.
   Uso: node tests/teste-decoracao-rastros-pedras.js [index.html] [galeria.png] */
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
    window.requestAnimationFrame = () => 0; localStorage.clear(); const o = { dec: {}, erroDec: 0, mundoIgual: true };
    const sig = (fn) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#445'; ctx.fillRect(0, 0, 200, 200); fn(); const d = ctx.getImageData(40, 40, 120, 120).data; let h = 7; for (let i = 0; i < d.length; i += 4) h = (Math.imul(h, 31) + d[i] * 3 + d[i + 1] * 5 + d[i + 2]) | 0; return h; };
    const tipos = { forest: ['bush', 'flower_r', 'mushroom', 'berry', 'tallgrass', 'fern'], desert: ['cactus_sm', 'cactus_bg', 'cactus_tall', 'yucca', 'drybush'], snow: ['frozen_bush', 'snowpile', 'ice', 'crystal'], city: ['trash', 'cone', 'hydrant', 'crate'] };
    for (const map of Object.keys(tipos)) {
      selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919); o.dec[map] = {};
      for (const t of tipos[map]) {
        const set = new Set();
        for (let i = 0; i < 24; i++) { const d = { x: 100, y: 110, type: t, seed: (i + .37) / 24, solid: false }; try { set.add(sig(() => drawDecoration(d))); } catch (e) { o.erroDec++; } }
        o.dec[map][t] = set.size;
      }
    }
    // mesma semente = mesmo desenho (os dois jogadores veem igual)
    { const d = { x: 100, y: 110, type: 'bush', seed: .63, solid: false }; o.igual = sig(() => drawDecoration(d)) === sig(() => drawDecoration(d)); }
    // pedras: cada golpe muda o desenho
    selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
    { const hs = new Set(); for (const hp of [5, 4, 3, 2, 1]) { const rk = { x: 100, y: 110, hp, k: 0, seed: .3 }; hs.add(sig(() => drawRock(rk))); } o.pedraEstados = hs.size; }
    { const rk = { x: 100, y: 110, hp: 5, k: 0, seed: .3, _hit: T }; const a = sig(() => drawRock(rk)); T += .05; const c = sig(() => drawRock(rk)); T += .5; const e = sig(() => drawRock(rk)); o.tremeu = a !== c; o.parou = e === sig(() => drawRock({ x: 100, y: 110, hp: 5, k: 0, seed: .3 })); }
    // rastros: veiculo andando na neve deixa marcas; parado nao; no mapa da floresta nao
    selectedMap = 'snow'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919); weather = 'none';
    zombies.length = 0; const v = vehicles[0]; v.destroyed = false; v.dying = false; tracks.length = 0;
    P.inVehicle = null; P.x = v.x + 200; P.y = v.y;
    v.spd = 60; for (let i = 0; i < 40; i++) { v.x += 3; updateLM(.05); } o.marcas = tracks.length;
    v.spd = 0; const n0 = tracks.length; for (let i = 0; i < 10; i++) { v.x += 0; updateLM(.05); } o.parado = tracks.length === n0;
    for (let i = 0; i < 400; i++) updateLM(1); o.somem = tracks.length === 0;
    v.spd = 60; for (let i = 0; i < 20; i++) { v.x += 3; updateLM(.05); } o.desenha = true; try { drawTracks(0, WW, 0, WH); drawPrints(0, WW, 0, WH); } catch (e) { o.desenha = false; }
    selectedMap = 'forest'; updateLM(.05); o.florestaVazia = tracks.length === 0;
    return o;
  });
  for (const m of Object.keys(r.dec)) for (const t of Object.keys(r.dec[m])) ok(r.dec[m][t] >= 3, m + ' ' + t + ' tem ' + r.dec[m][t] + ' aparencias');
  ok(r.erroDec === 0, 'nenhuma decoracao deu erro ao desenhar'); ok(r.igual, 'mesma semente, mesmo desenho');
  ok(r.pedraEstados === 5, 'pedra muda a cada golpe (' + r.pedraEstados + ' estados)'); ok(r.tremeu && r.parou, 'pedra treme ao levar golpe e para depois');
  ok(r.marcas >= 5, 'veiculo andando deixa marcas (' + r.marcas + ')'); ok(r.parado, 'parado nao deixa marcas'); ok(r.somem, 'marcas somem com o tempo'); ok(r.desenha, 'desenha marcas e pegadas sem erro'); ok(r.florestaVazia, 'floresta nao guarda marcas');
  if (shot) {
    await pg.evaluate(() => {
      const maps = ['forest', 'desert', 'snow', 'city'], lista = { forest: ['bush', 'flower_r', 'flower_y', 'mushroom', 'berry', 'tallgrass', 'fern', 'stump'], desert: ['cactus_sm', 'cactus_bg', 'cactus_tall', 'yucca', 'drybush', 'sandrock', 'tumbleweed', 'bone'], snow: ['frozen_bush', 'snowpile', 'ice', 'crystal', 'icicle', 'frozen_log', 'snowman', 'pine_sm'], city: ['trash', 'crate', 'cone', 'hydrant', 'papers', 'bench', 'barrier', 'mailbox'] };
      window.__gal = (mi) => { const m = maps[mi]; selectedMap = m; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.fillStyle = { forest: '#4a6a3a', desert: '#d8c08a', snow: '#cdd8e4', city: '#5a5e64' }[m]; ctx.fillRect(0, 0, 500, 300);
        lista[m].forEach((t, j) => { for (let i = 0; i < 6; i++) drawDecoration({ x: 28 + i * 40, y: 30 + j * 32, type: t, seed: (i + .2) / 6 + (j % 2) * .07, solid: false }); }); };
    });
    for (let mi = 0; mi < 4; mi++) { await pg.evaluate(mi => window.__gal(mi), mi); await pg.screenshot({ path: shot.replace('.png', '_' + mi + '.png') }); }
  }
  ok(errs.length === 0, 'sem erros de pagina ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
