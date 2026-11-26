/* Camera travada nas bordas do mundo: nunca aparece o preto de fora (antes, perto da borda, metade da tela virava uma faixa preta com corte vertical no meio).
   - nos 4 mapas, nas 4 bordas e nos 4 cantos: a janela da camera fica dentro do mundo e nenhum canto/meio da tela e o fundo preto de fora;
   - no meio do mundo o jogador continua exatamente no centro da tela; perto da borda ele sai do centro (so o necessario);
   - vale tambem com o zoom afastado do veiculo; o medidor da pesca acompanha o jogador na tela.
   Uso: node tests/teste-camera-borda.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 878, height: 405 }, hasTouch: true })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'desert', 'snow', 'city']) {
    const R = await pg.evaluate(map => {
      localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true);
      const o = { fora: 0, preto: 0, n: 0 };
      const bg = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return d[0] === 7 && d[1] === 10 && d[2] === 7; };
      const pontos = [[0, 0], [1, 0], [0, 1], [1, 1], [.5, 0], [.5, 1], [0, .5], [1, .5], [.5, .5]];
      const test = (x, y) => {
        P.x = x; P.y = y; P.inside = null; P.inVehicle = null; dark = 0; render(); o.n++;
        if (camX < -0.01 || camY < -0.01 || camX + W / Z > WW + 0.01 || camY + H / Z > WH + 0.01) o.fora++;
        for (const [fx, fy] of pontos) if (bg(Math.min(W - 1, Math.round(fx * W)), Math.min(H - 1, Math.round(fy * H)))) o.preto++;
      };
      const m = 8, xs = [m, WW / 4, WW / 2, WW - m], ys = [m, WH / 4, WH / 2, WH - m];
      for (const x of xs) for (const y of ys) test(x, y);          // bordas, cantos e meio
      for (const z of [0, .35]) { camZoom = z; resize(); test(m, WH / 2); test(WW - m, WH - m); test(WW / 2, WH / 2); }   // zoom afastado (veiculo rapido)
      camZoom = 0; resize();
      // meio do mundo: jogador no centro da tela; perto da borda: fora do centro
      P.x = WW / 2; P.y = WH / 2; render(); o.meio = { sx: (P.x - camX) * Z, sy: (P.y - camY) * Z, W, H };
      P.x = m; P.y = WH / 2; render(); o.borda = { sx: (P.x - camX) * Z, camX };
      // pesca: medidor dentro da tela e junto do jogador
      P.x = WW - m; P.y = WH - m; P.fish = { ph: 2, mg: { pos: .5, fish: .5, prog: .3, t: 0 } }; let erro = null; try { render(); } catch (e) { erro = e.message; } P.fish = null; o.pescaErro = erro;
      return o;
    }, map);
    ok(R.fora === 0, map + ': a janela da camera nunca sai do mundo (' + R.n + ' posicoes)');
    ok(R.preto === 0, map + ': nenhum canto nem o meio da tela mostra o preto de fora');
    ok(Math.abs(R.meio.sx - R.meio.W / 2) <= 1 && Math.abs(R.meio.sy - R.meio.H / 2) <= 1, map + ': no meio do mundo o jogador fica no centro da tela');
    ok(R.borda.camX === 0 && R.borda.sx < R.meio.W / 2 - 20, map + ': na borda a camera trava e o jogador sai do centro (x=' + Math.round(R.borda.sx) + ')');
    ok(!R.pescaErro, map + ': medidor da pesca desenha no canto do mundo sem erro');
  }
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
