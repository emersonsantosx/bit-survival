/* Veiculo na agua (js/35), nos 4 mapas: parado na agua desenha a agua por cima e marolas, andando faz rastro e respingos,
   em terra firme (e no gelo inteiro) nao muda nada, e nada disso entra no save.
   Uso: node tests/teste-veiculo-agua.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 700, height: 420 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'snow', 'desert', 'city']) {
    const r = await pg.evaluate(map => {
      window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame();
      zombies.length = 0; animals.length = 0; weather = 'none';
      let x, y;
      if (map === 'city') { x = WW / 2; for (let k = 0; k < 200 && onPier(x, orlaShore(x) + 40); k++) x += 40; y = orlaShore(x) + 40; }
      else { const l = lakes.find(q => !q.fountain); if (l.frozen) { const q = iceOf(l); x = q.x; y = q.y; addIceHole(l, x, y, false); l.holes[0].r = 40; } else { x = l.cx; y = l.cy; if (l.islands) l.islands.length = 0; } }
      const v = vehicles[0]; Object.assign(v, { x, y, face: 0, spd: 0, dying: false, destroyed: false });
      const o = { prof: lakeDepth(x, y) };
      T = 10; let s = vehWaterState(v); o.agua = !!s && s.max > .02;
      for (let i = 0; i < 20; i++) { T += 1 / 30; v.x += 2; s = vehWaterState(v); }
      o.rastro = s ? s.w.wake.length : 0; o.gotas = s ? s.w.drops.length : 0;
      camX = v.x - W / (2 * Z); camY = v.y - H / (2 * Z); ctx.setTransform(Z, 0, 0, Z, -camX * Z, -camY * Z); drawVehicle(v);
      for (let i = 0; i < 60; i++) { T += 1 / 30; s = vehWaterState(v); }
      o.some = s ? s.w.wake.length + s.w.drops.length : -1;
      saveGame(); o.save = JSON.stringify(localStorage).includes('_water');
      let dry = null; for (let px = 100; px < WW && !dry; px += 90) for (let py = 100; py < WH && !dry; py += 90) { v.x = px; v.y = py; v._water = null; if (!vehWaterState(v)) dry = 1; }
      o.seco = !!dry;
      return o;
    }, map);
    ok(r.prof > .02 && r.agua, map + ': veiculo na agua e reconhecido (profundidade ' + r.prof.toFixed(2) + ')');
    ok(r.rastro > 0 && r.gotas > 0, map + ': andando faz rastro (' + r.rastro + ') e respingos (' + r.gotas + ')');
    ok(r.some === 0, map + ': parado, rastro e respingos somem');
    ok(!r.save, map + ': nada da agua vai para o save');
    ok(r.seco, map + ': em terra firme nao ha efeito');
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
