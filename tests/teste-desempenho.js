/* Desempenho: conta as operacoes de desenho por quadro (a medida que pesa no celular, independente da velocidade do computador de teste)
   e confere que os caches (chao em blocos, cercas, piso dos predios, sombras da lanterna) continuam em uso e sao refeitos no mundo novo.
   Uso: node tests/teste-desempenho.js [caminho/index.html]. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; const o = {};
    const ops = () => {   // total de chamadas de desenho num quadro
      const P2 = Object.getPrototypeOf(cv.getContext('2d')), saved = {}; let n = 0;
      for (const m of ['fillRect', 'drawImage', 'fill', 'stroke', 'clip', 'setTransform', 'translate', 'rotate', 'scale', 'arc', 'ellipse']) { const f = P2[m]; saved[m] = f; P2[m] = function (...a) { n++; return f.apply(this, a); }; }
      try { render(); } finally { for (const m in saved) P2[m] = saved[m]; }
      return n;
    };
    const cena = (mapa, hr) => {
      localStorage.clear(); selectedMap = mapa; weather = 'none'; CFG.quality = 0; CFG.autoperf = false; newGame(); showScreen(null); state = 'play';
      T = ((hr - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 30; i++) update(.03);
      if (hr > 20) { P.torch = true; P.flashOn = true; } for (let i = 0; i < 8; i++) { P.x += 2.4; render(); }
    };
    cena('forest', 12); o.florestaDia = ops(); o.blocos = groundChunkCount();
    cena('forest', 23); o.florestaNoite = ops();
    cena('city', 12); o.cidadeDia = ops();
    cena('city', 23); o.cidadeNoite = ops();
    cena('snow', 23); o.neveNoite = ops();
    cena('desert', 23); o.desertoNoite = ops();
    cena('forest', 12); zombies.length = 0;
    for (let i = 0; i < 60; i++) { const z = spawnZ(P.x - 180 + (i % 10) * 36, P.y - 70 + Math.floor(i / 10) * 40, i % 2); if (z) { z.x = P.x - 180 + (i % 10) * 36; z.y = P.y - 70 + Math.floor(i / 10) * 40; zombies.push(z); } }
    for (let i = 0; i < 8; i++) render(); o.horda = ops(); o.hordaSprites = zombieSpriteCount();
    window.zCacheOff = true; o.hordaSemCache = ops(); window.zCacheOff = false;
    localStorage.clear(); selectedMap = 'city'; newGame(); o.blocosAposMundoNovo = groundChunkCount();
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.blocos > 0 && r.blocos < 30, 'o chao usa blocos prontos (' + r.blocos + ' em memoria, no maximo 30)');
  ok(r.blocosAposMundoNovo === 0, 'um mundo novo refaz os blocos do chao (gramados e mapa mudam)');
  ok(r.florestaDia < 700, 'floresta de dia: ' + r.florestaDia + ' operacoes por quadro (limite 700)');
  ok(r.florestaNoite < 1200, 'floresta de noite com lanterna: ' + r.florestaNoite + ' operacoes (limite 1200)');
  ok(r.cidadeDia < 800, 'cidade de dia: ' + r.cidadeDia + ' operacoes (limite 800)');
  ok(r.cidadeNoite < 1400, 'cidade de noite: ' + r.cidadeNoite + ' operacoes (limite 1400)');
  ok(r.neveNoite < 1400 && r.desertoNoite < 1400, 'neve e deserto de noite: ' + r.neveNoite + ' e ' + r.desertoNoite + ' operacoes');
  ok(r.horda < 1500, 'horda de 60 zumbis: ' + r.horda + ' operacoes (limite 1500)');
  ok(r.hordaSemCache > r.horda * 2, 'o cache dos zumbis corta as operacoes (' + r.hordaSemCache + ' sem cache contra ' + r.horda + ')');
  ok(r.hordaSprites > 0 && r.hordaSprites < 80, 'poucos sprites de zumbi em memoria (' + r.hordaSprites + ')');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
