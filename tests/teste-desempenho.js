/* Desempenho sem perder qualidade: chao e ruas em blocos prontos, figurinhas de cerca e bichos distantes em passo maior.
   Confere que a IMAGEM e igual a do desenho direto (pixel por pixel), que mundo novo nao herda blocos do anterior e que o cache tem limite.
   Uso: node tests/teste-desempenho.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const errs = [];
  for (const map of ['forest', 'snow', 'desert', 'city']) {
    const pg = await (await b.newContext({ viewport: { width: 700, height: 420 } })).newPage();
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://' + file); await pg.waitForTimeout(300);
    const r = await pg.evaluate((map) => {
      localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); window.requestAnimationFrame = () => 0;
      const o = {}; const bb = blds[0]; P.x = bb.x - 30; P.y = bb.y + bb.h + 30;
      const snap = () => ctx.getImageData(0, 0, W, H).data;
      const same = (a, b2) => { let d = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b2[i] || a[i + 1] !== b2[i + 1] || a[i + 2] !== b2[i + 2]) d++; return d; };
      // pecas de cerca de todos os tipos para o teste das figurinhas
      const base = Math.round(P.x / 16), by = Math.round(P.y / 16), pcs = []; let n = 0;
      for (const g of [0, 1]) for (const op of [0, 1]) for (const d of [0, 1]) { pcs.push([base + n * 2, by + 3, d, g, g === 1 ? op : 0]); n++; }
      fenceLoad(pcs);
      if (window.fenceCityAdd) fenceCityAdd([[base, by + 7, 0, 0], [base + 2, by + 7, 1, 1], [base + 4, by + 7, 0, 1]]);
      // chao e ruas: bloco pronto x desenho direto, em varios pontos do mapa
      const cg = window.groundChunksDraw, cr = window.cityRoadsChunksDraw, df = window.drawFence;
      let diffG = 0, diffF = 0, frames = 0;
      for (let i = 0; i < 6; i++) {
        P.x = Math.min(WW - 200, 400 + i * 700); P.y = Math.min(WH - 200, 300 + i * 450); if (i === 5) { P.x = (base + 6) * 16; P.y = (by + 4) * 16; }
        render(); const a = Array.from(snap());
        window.groundChunksDraw = () => false; window.cityRoadsChunksDraw = (x0, y0, x1, y1) => drawCityRoads(x0, y0, x1, y1);
        window.drawFence = f => { drawFence0(f, R); fenceSnow(f); };   // desenho direto, sem figurinha
        render(); const c = snap();
        window.groundChunksDraw = cg; window.cityRoadsChunksDraw = cr; window.drawFence = df;
        diffG += same(a, c); frames++;
      }
      o.diff = diffG; o.frames = frames;
      // cache tem limite e mundo novo descarta os blocos
      for (let i = 0; i < 120; i++) { P.x = 300 + (i % 30) * 256; P.y = 300 + Math.floor(i / 30) * 600; if (P.x > WW - 100) P.x = WW - 100; if (P.y > WH - 100) P.y = WH - 100; render(); }
      o.maxBlocks = Math.max(0, ...Object.values(GC.layers).map(m => m.size));
      const before = Object.values(GC.layers).reduce((s, m) => s + m.size, 0);
      genWorld(12345); const after = Object.values(GC.layers).reduce((s, m) => s + m.size, 0);
      o.flushed = before > 0 && after === 0;
      // bichos: perto anda todo quadro; longe anda de 4 em 4 quadros com o tempo somado, e chega ao mesmo lugar
      P.x = 500; P.y = 500; P.dead = false;
      const mk = (x, y) => ({ k: 'deer', x: x, y: y, face: 0, wt: 99, tx: x + 60, ty: y, hp: 30, max: 30 });
      const nearA = mk(520, 520), farA = mk(500 + 1500, 500 + 1500);
      animals = [nearA, farA]; farA.tx = farA.x + 60; farA.ty = farA.y; nearA.tx = nearA.x + 60; nearA.ty = nearA.y;
      let moves = 0, lastX = farA.x;
      for (let i = 0; i < 32; i++) { updateAnimals(.016); if (farA.x !== lastX) { moves++; lastX = farA.x; } }
      o.farMoves = moves; o.nearMoved = nearA.x > 520.5;
      o.farProgress = farA.x - (500 + 1500);   // ~16 px/s * 32 * .016 = ~8
      return o;
    }, map);
    ok(r.diff === 0, map + ': chao, ruas e cercas em blocos/figurinhas = desenho direto (' + r.diff + ' pixels diferentes em ' + r.frames + ' quadros)');
    ok(r.maxBlocks <= 48, map + ': cache de blocos respeita o limite (' + r.maxBlocks + ')');
    ok(r.flushed, map + ': mundo novo descarta os blocos do anterior');
    ok(r.farMoves >= 6 && r.farMoves <= 9, map + ': bicho distante anda de 4 em 4 quadros (' + r.farMoves + ' passos em 32)');
    ok(r.farProgress > 5 && r.farProgress < 11, map + ': bicho distante percorre a mesma distancia (' + r.farProgress.toFixed(1) + ' px)');
    ok(r.nearMoved, map + ': bicho perto segue quadro a quadro');
    await pg.context().close();
  }
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
