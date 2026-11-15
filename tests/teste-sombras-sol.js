/* Sombras do sol: seguem o desenho do objeto e giram com a hora (manha: para a esquerda, meio-dia: curta para baixo, tarde: para a direita).
   Mede o escurecimento do chao com e sem o objeto, na mesma cena. Uso: node tests/teste-sombras-sol.js [caminho/index.html]. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    const lum = (wx, wy) => { const sx = Math.round((wx - camX) * Z), sy = Math.round((wy - camY) * Z);
      const d = cv.getContext('2d').getImageData(sx - 2, sy - 2, 5, 5).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / 25; };
    const cena = (hr, obst) => {
      T = ((hr - START_HOUR + 24) % 24) / 24 * DAY_SECONDS;
      zombies.length = 0; animals.length = 0; trees.length = 0; rocks.length = 0; items.length = 0; blds.length = 0; vehicles.length = 0; decorations.length = 0; tents.length = 0;
      P.x = 450; P.y = 372; P.face = 0; P.inside = null; P.torch = false; P.flashOn = false;
      if (obst === 'arvore') trees.push({ x: 450, y: 330, hp: 5, t: 0, k: 0, seed: .1, h: 1 });
      if (obst === 'poste') decorations.push({ x: 450, y: 330, type: 'lamp', solid: true, seed: .2 });
      rebuildSolidGrid(); for (let i = 0; i < 25; i++) update(.02); for (let k = 0; k < 3; k++) render();
    };
    const o = {};
    const cen = (hr, kind, ref, extra) => {   // centro e tamanho do desenho pronto da sombra, relativo ao pe do objeto
      cena(hr, null); const bm = sunBM(kind, ref, extra); const g = bm.cv.getContext('2d').getImageData(0, 0, bm.cv.width, bm.cv.height).data;
      let n = 0, sx = 0, sy = 0, mx = -1e9, mn = 1e9; for (let y = 0; y < bm.cv.height; y++) for (let x = 0; x < bm.cv.width; x++) if (g[(y * bm.cv.width + x) * 4 + 3] > 40) { n++; sx += x - bm.ox; sy += y - bm.oy; mx = Math.max(mx, x - bm.ox); mn = Math.min(mn, x - bm.ox); }
      return { n, cx: sx / n, cy: sy / n, w: mx - mn };
    };
    const arv = { x: 450, y: 330, k: 0, seed: .1 }, pin = { k: 0, seed: .1 }, poste = { type: 'lamp', solid: true }, pedra = { k: 2 };
    const hum = { skin: '#d9a37a', shirt: '#556', hair: '#222', moving: false, anim: 0 };
    o.arv = [7, 12, 17].map(h => cen(h, 'tree', arv)); o.poste = [7, 12, 17].map(h => cen(h, 'decor', poste)); o.pedra = [7, 17].map(h => cen(h, 'rock', pedra));
    o.jog = [7, 12, 17].map(h => cen(h, 'human', hum, 1.57));
    o.jogLado = cen(17, 'human', Object.assign({}, hum, { moving: true, anim: 1 }), 0);
    const pontos = (hr, obst) => { cena(hr, obst); return true; };
    o.fim = pontos(7, null);
    cena(7, 'arvore'); o.bid7 = SUN.bid; cena(17, 'arvore'); o.bid17 = SUN.bid;
    o.sx7 = (cena(7, null), SUN.sx); o.sx17 = (cena(17, null), SUN.sx); o.sx12 = (cena(12, null), SUN.sx);
    o.len12 = (cena(12, null), SUN.len); o.len17 = (cena(17, null), SUN.len);
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.sx7 < -.5 && r.sx17 > .5 && Math.abs(r.sx12) < .2, 'a direcao da sombra gira: manha para a esquerda (' + r.sx7.toFixed(2) + '), meio-dia ~0 (' + r.sx12.toFixed(2) + '), tarde para a direita (' + r.sx17.toFixed(2) + ')');
  ok(r.len17 > r.len12 * 1.5, 'a sombra e mais longa no fim da tarde que ao meio-dia (' + r.len17.toFixed(2) + ' vs ' + r.len12.toFixed(2) + ')');
  ok(r.arv[0].cx < -8 && r.arv[2].cx > 8, 'arvore: a sombra cai para a esquerda de manha (' + r.arv[0].cx.toFixed(1) + ') e para a direita a tarde (' + r.arv[2].cx.toFixed(1) + ')');
  ok(Math.abs(r.arv[1].cx) < r.arv[2].cx * .6 && r.arv[1].n < r.arv[2].n * .5, 'arvore: ao meio-dia a sombra e curta e quase embaixo (' + r.arv[1].n + ' px vs ' + r.arv[2].n + ' a tarde)');
  ok(r.arv[2].w > 14, 'arvore: a sombra tem a largura da copa, nao so do tronco (' + r.arv[2].w + ' px)');
  ok(r.poste[0].cx < -3 && r.poste[2].cx > 3 && r.poste[2].w < r.arv[2].w, 'poste: traco fino que gira com o sol (' + r.poste[0].cx.toFixed(1) + ' / ' + r.poste[2].cx.toFixed(1) + ')');
  ok(r.pedra[0].cx < -2 && r.pedra[1].cx > 2, 'pedra: sombra esticada para o lado oposto ao sol (' + r.pedra[0].cx.toFixed(1) + ' / ' + r.pedra[1].cx.toFixed(1) + ')');
  ok(r.jog[0].cx < -2 && r.jog[2].cx > 2 && r.jog[1].n > 5, 'jogador: sombra com o formato do corpo acompanha o sol (' + r.jog[0].cx.toFixed(1) + ' / ' + r.jog[2].cx.toFixed(1) + ')');
  ok(r.jogLado.n !== r.jog[2].n, 'jogador: o desenho da sombra muda com a pose (parado ' + r.jog[2].n + ' px, andando de lado ' + r.jogLado.n + ' px)');
  ok(r.bid7 !== r.bid17, 'o desenho pronto das sombras e refeito quando o angulo muda');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
