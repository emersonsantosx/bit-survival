/* Chuva na cidade: asfalto e cimento nao formam poca (so a terra dos gramados); a rua fica molhada, com agua na sarjeta, respingos e reflexo das
   luzes, e tudo some quando seca. Confere tambem que os lagos nao desenham mais vitorias-regias.
   Uso: node tests/teste-chuva-cidade.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
    const start = map => { localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = map; pendingSlot = 1; weather = 'none'; showScreen(null); newGame(); state = 'play'; zombies.length = 0; };
    start('city');
    // pocas: varre o mapa inteiro
    weather = 'rain'; WX.wet = 1;
    let n = 0, fora = 0; const seen = new Set();
    for (let y = 0; y < WH; y += 300) for (let x = 0; x < WW; x += 600) {
      drawPuddles(x, y, x + 600, y + 300);
      for (const p of wxPuddles()) {
        if (p.curb || seen.has(p)) continue; seen.add(p); n++;
        for (const q of [[0, 0], [-p.rx, 0], [p.rx, 0], [0, -p.ry], [0, p.ry]]) if (!inCityGarden(p.x + q[0], p.y + q[1]) || onCityRoad(p.x + q[0], p.y + q[1], 8) || onCityPath(p.x + q[0], p.y + q[1])) { fora++; break; }
      }
    }
    o.pocas = n; o.fora = fora;
    // rua: conta o que e desenhado num cruzamento com e sem chuva
    const q = cityInter[Math.floor(cityInter.length / 2)];
    const draw = () => { const R0 = R; let k = 0; R = (...a) => { k++; return R0(...a); }; try { drawPuddles(q.x - 200, q.y - 100, q.x + 260, q.y + 160); } finally { R = R0; } return { k, refl: wxPuddles().filter(p => p.curb).length }; };
    o.molhado = draw(); weather = 'none'; WX.wet = 0; o.seco = draw();
    // bueiros e reflexo ficam no asfalto, fora dos cruzamentos
    weather = 'rain'; WX.wet = 1; draw();
    o.reflOk = wxPuddles().filter(p => p.curb).every(p => onCityRoad(p.x, p.y, 0) && !cityInter.some(c => p.x > c.x && p.x < c.x + c.w && p.y > c.y && p.y < c.y + c.h));
    // lagos sem vitoria-regia: desenhar com e sem pads da o mesmo resultado
    start('forest'); weather = 'none';
    const l = lakes.find(k => !k.fountain && k.pads.length); const E0 = ctx.ellipse; const T0 = T;
    const count = pads => { const keep = l.pads; l.pads = pads; let k = 0; ctx.ellipse = function () { k++; return E0.apply(this, arguments); }; T = T0; try { drawLake(l); } finally { ctx.ellipse = E0; l.pads = keep; } return k; };
    o.comPads = count([{ x: l.cx, y: l.cy, r: 3 }]); o.semPads = count([]);
    return o;
  });
  ok(r.pocas > 0, 'ha pocas nos gramados da cidade (' + r.pocas + ')');
  ok(r.fora === 0, 'nenhuma poca em asfalto, calcada, cimento ou caminho de pedra (' + r.fora + ' fora)');
  ok(r.molhado.k > r.seco.k + 20, 'na chuva a rua ganha agua na sarjeta e respingos (' + r.seco.k + ' seco, ' + r.molhado.k + ' molhado)');
  ok(r.molhado.refl > 0 && r.seco.refl === 0 && r.reflOk, 'reflexo das luzes na sarjeta so com a rua molhada (' + r.molhado.refl + ')');
  ok(r.comPads === r.semPads, 'os lagos nao desenham vitorias-regias');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
