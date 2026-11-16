/* Neve nas cercas e manchas de neve no chao (mapas sem neve). */
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
    T = ((13 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; zombies.length = 0; for (let i = 0; i < 10; i++) update(.03);
    weatherTimer = 99999; WX.wet = 0; WX.snow = 0; P.dead = false; P.hp = 100;
    const cnt = f => { const rec = []; const R0 = R; R = (x, y, w, h, c) => { if (c === '#e8f4f8') rec.push(h); return R0(x, y, w, h, c); }; try { f(); } finally { R = R0; } return rec.length; };
    const fence = { x: 10, y: 10, d: 'h', g: 0 }, wall = { x: 12, y: 10, d: 'h', g: 2 };
    WX.snow = 0; o.cercaSeca = cnt(() => { drawFence(fence); drawFence(wall); });
    WX.snow = 1; o.cercaNeve = cnt(() => { drawFence(fence); drawFence(wall); });
    WX.snow = 0; o.semPatch = (() => { for (let i = 0; i < 3; i++) render(); return wxSnowPatches().length; })();
    weather = 'snow'; for (let i = 0; i < 40; i++) update(2); for (let i = 0; i < 3; i++) render();
    o.patch = wxSnowPatches().length;
    o.foraLago = wxSnowPatches().every(p => !pointInLake(p.x, p.y)); o.foraPredio = wxSnowPatches().every(p => !bldAt(p.x, p.y));
    weather = 'none'; for (let i = 0; i < 200; i++) update(2); for (let i = 0; i < 3; i++) render(); o.derrete = wxSnowPatches().length;
    selectedMap = 'snow'; WX.snow = 1; for (let i = 0; i < 3; i++) render(); o.mapaNeve = wxSnowPatches().length; selectedMap = 'forest';
    return o;
  });
  ok(r.cercaSeca === 0 && r.cercaNeve >= 5, 'cercas e paredes ganham capa de neve (' + r.cercaSeca + ' seco, ' + r.cercaNeve + ' com neve)');
  ok(r.semPatch === 0, 'sem neve nao ha manchas no chao');
  ok(r.patch > 0, 'nevando surgem manchas no chao: ' + r.patch);
  ok(r.foraLago && r.foraPredio, 'manchas nunca em lago ou predio');
  ok(r.derrete === 0, 'as manchas somem quando a neve derrete');
  ok(r.mapaNeve === 0, 'no mapa da neve nao desenha manchas (chao ja branco)');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
