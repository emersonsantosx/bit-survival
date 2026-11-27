/* Acabamento de chuva e neve: pocas que se formam e secam, reflexo da lanterna nas pocas, neve que acumula nos objetos e derrete. */
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
    T = ((15 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; zombies.length = 0; for (let i = 0; i < 30; i++) update(.03);
    const tick = (s, dt = .5) => { for (let i = 0; i < s / dt; i++) update(dt); };
    weatherTimer = 99999; weather = 'none'; WX.wet = 0; WX.snow = 0;
    // --- chuva: forma, aparece nas posicoes certas e seca
    o.wet0 = WX.wet; weather = 'rain'; wxF = 1; tick(10); o.wet10 = WX.wet; tick(60); o.wet70 = WX.wet;
    for (let i = 0; i < 3; i++) render(); o.vis = wxPuddles().length;
    const snap = wxPuddles().map(p => [Math.round(p.x), Math.round(p.y)].join()).join('|');
    for (let i = 0; i < 3; i++) render(); o.mesmaPosicao = snap === wxPuddles().map(p => [Math.round(p.x), Math.round(p.y)].join()).join('|');
    o.dentroDoMundo = wxPuddles().every(p => p.x > 0 && p.y > 0 && p.x < WW && p.y < WH);
    o.foraDeLago = wxPuddles().every(p => !pointInLake(p.x, p.y));
    o.foraDePredio = wxPuddles().every(p => !bldAt(p.x, p.y));
    weather = 'none'; tick(200); o.wetSeca = WX.wet; for (let i = 0; i < 3; i++) render(); o.visSeca = wxPuddles().length;
    // --- reflexo da lanterna: o brilho no centro da poca sobe quando o chao esta molhado
    weather = 'rain'; tick(80); T = ((23 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 4; i++) update(.03);
    P.dead = false; P.hp = 100; P.sleeping = null; P.inVehicle = null; state = 'play'; P.torch = true; P.flashOn = true; for (let i = 0; i < 3; i++) render();
    const cand = [];   // junta pocas de varios pontos do mapa (a camera demora a chegar, entao renderiza varias vezes em cada)
    for (const [fx, fy] of [[.5, .5], [.3, .3], [.7, .3], [.3, .7], [.7, .7], [.5, .2], [.5, .8]]) {
      P.x = WW * fx; P.y = WH * fy; P.inside = null; for (let i = 0; i < 25; i++) render();
      for (const p of wxPuddles()) if (cand.length < 14) cand.push({ x: p.x, y: p.y });
    }
    o.lumMolhado = 0; o.lumSeco = 0; o.glowMolhado = 0; o.glowSeco = 0;
    const DI = CanvasRenderingContext2D.prototype.drawImage; let nDraw = 0;
    CanvasRenderingContext2D.prototype.drawImage = function () { nDraw++; return DI.apply(this, arguments); };
    try {
      for (const q of cand) {   // tenta as pocas ate achar uma com o feixe livre; o reflexo e um brilho extra desenhado so quando molhado
        P.x = q.x - 70; P.y = q.y - 4; P.face = 0; P.inside = null;
        for (let i = 0; i < 12; i++) render();
        const w = WX.wet; nDraw = 0; render(); const dm = nDraw; WX.wet = 0; nDraw = 0; render(); const ds = nDraw; WX.wet = w;
        if (dm - ds > o.glowMolhado - o.glowSeco) { o.glowMolhado = dm; o.glowSeco = ds; }
        if (dm > ds) break;
      }
    } finally { CanvasRenderingContext2D.prototype.drawImage = DI; }
    // --- neve: acumula aos poucos, derrete devagar
    weather = 'none'; tick(400); T = ((13 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS;
    o.snow0 = snowAcc(); weather = 'snow'; tick(10); o.snow10 = snowAcc(); tick(30); o.snow40 = snowAcc(); tick(60); o.snow100 = snowAcc();
    const alt = k => { WX.snow = k; const rec = []; const R0 = R; R = (x, y, w, h) => rec.push(h); try { snowCap(0, 10, 12, 4); } finally { R = R0; } return Math.max(0, ...rec); };
    o.altBaixa = alt(.2); o.altMedia = alt(.6); o.altCheia = alt(1);
    WX.snow = 1; weather = 'none'; tick(30); o.derrete = WX.snow; tick(200); o.derreteTudo = WX.snow;
    o.sprites = (() => { WX.snow = .3; const a = snowOn(); WX.snow = .7; const c = snowOn(); return [a, c]; })();
    selectedMap = 'snow'; WX.snow = 0; o.mapaNeve = snowAcc(); selectedMap = 'forest';
    return o;
  });
  ok(r.wet0 === 0 && r.wet10 > 0 && r.wet10 < .4 && r.wet70 === 1, 'a chuva molha o chao aos poucos (' + [r.wet0, r.wet10.toFixed(2), r.wet70] + ')');
  ok(r.vis > 0 && r.vis < 40, 'pocas visiveis na tela: ' + r.vis);
  ok(r.mesmaPosicao, 'as pocas ficam sempre nos mesmos lugares');
  ok(r.dentroDoMundo && r.foraDeLago && r.foraDePredio, 'nenhuma poca fora do mundo, dentro de lago ou de predio');
  ok(r.wetSeca === 0 && r.visSeca === 0, 'sem chuva as pocas secam e somem');
  ok(r.glowMolhado > r.glowSeco, 'a luz da lanterna reflete na poca (brilhos desenhados: ' + r.glowSeco + ' seco, ' + r.glowMolhado + ' molhado)');
  ok(r.snow0 === 0 && r.snow10 > 0 && r.snow10 < .3 && r.snow40 > .4 && r.snow40 < .8 && r.snow100 === 1, 'a neve acumula aos poucos (' + [r.snow10.toFixed(2), r.snow40.toFixed(2), r.snow100] + ')');
  ok(r.altBaixa < r.altMedia && r.altMedia < r.altCheia, 'a capa de neve cresce com o acumulado (' + [r.altBaixa, r.altMedia, r.altCheia] + ' px)');
  ok(r.derrete > 0 && r.derrete < 1 && r.derreteTudo === 0, 'a neve derrete devagar depois que para de nevar');
  ok(r.sprites[0] === false && r.sprites[1] === true, 'copas e telhados trocam para a versao com neve ao passar de 50%');
  ok(r.mapaNeve === 1, 'no mapa da neve tudo ja vem coberto');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join('|'));
  await b.close();
  if (bad) { console.log(bad + ' falha(s)'); process.exit(1); } else console.log('Todos os testes passaram');
})();
