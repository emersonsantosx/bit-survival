/* Luz das estruturas (poco, bau, tora, barraca, chafariz, espantalho, estufa, cerca, parede, piso e telhado).
   Antes: poco e bau eram desenhados de frente (uma parede de pedra e um bau com pes), a barraca era um triangulo de frente, e as sombras eram
   elipses fixas (poco, bau, tora, barraca, chafariz) ou nem existiam (cerca baixa, parede so com 1 px fixo, telhado). A luz embutida tambem estava
   invertida no oeste do piso e do telhado.
   Regra: vista de cima (no maximo uma frente curta), luz a noroeste (borda norte/oeste clara, sul/leste escura) e sombra projetada sempre
   dinamica, seguindo o sol (de manha cai para o oeste, de tarde para o leste), sem escurecer em dobro onde pecas vizinhas se encostam.
   Confere:
   - sombra de poco, bau, tora, barraca, chafariz, espantalho e estufa: o centro da sombra fica a oeste de manha e a leste de tarde;
   - luz embutida: poco (aro NW mais claro que SE), bau (borda norte da tampa mais clara que a leste), barraca (aba de tras mais clara que a da frente);
   - cerca baixa e parede: sombra do lado oposto ao sol; telhado: idem; fila de pecas: o escuro das emendas e igual ao do resto (um caminho so);
   - sem erros de JS.
   Uso: node tests/teste-luz-estruturas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const human0 = window.human; window.human = function () { };
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; };
    const o = { sombra: [], luz: {}, erros: [] };
    localStorage.clear(); selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
    P.dead = false; P.hp = 100; P.inVehicle = null; P.inside = null; zombies.length = 0; animals.length = 0;
    const BG = [216, 176, 96];
    const px = (x, y) => { const d = ctx.getImageData(Math.floor(x * Z) + 1, Math.floor(y * Z) + 1, 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = (x, y) => { const d = px(x, y); return (d[0] + d[1] + d[2]) / 3; };
    const fundo = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.setTransform(Z, 0, 0, Z, 0, 0); };
    const dia = h => { hora(h); for (let i = 0; i < 6; i++) { weather = 'none'; weatherTimer = 99999; update(.03); render(); } ctx.setTransform(Z, 0, 0, Z, 0, 0); fundo(); };
    // centro (em x) dos pixels que tem exatamente a cor do fundo escurecido pela sombra do sol, numa janela em volta do sprite; n = quantidade
    const centro = (cx, cy, rw, rh, mult = 1) => {
      const a = +(/,([\d.]+)\)$/.exec(SUN.fs) || [0, 0])[1] * mult, k = [8, 10, 28], alvo = BG.map((v, i) => v * (1 - a) + k[i] * a);
      const x0 = Math.floor((cx - rw) * Z), y0 = Math.floor((cy - rh) * Z), w = Math.floor(2 * rw * Z), h = Math.floor(2 * rh * Z);
      const d = ctx.getImageData(x0, y0, w, h).data; let sx = 0, n = 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = (j * w + i) * 4; if (Math.abs(d[q] - alvo[0]) < 3 && Math.abs(d[q + 1] - alvo[1]) < 3 && Math.abs(d[q + 2] - alvo[2]) < 3) { sx += x0 + i; n++; } }
      return { n, dx: n ? (sx / n) / Z - cx : 0, a };
    };
    const objetos = {
      'poco': [() => drawWell({ x: 100, y: 80, t: 0 }), 100, 70],
      'bau': [() => drawStash({ x: 100, y: 80, o: 0, s: [] }), 100, 75],
      'tora deitada': [() => drawLog({ x: 100, y: 80, a: 'h' }), 100, 80],
      'tora em pe': [() => drawLog({ x: 100, y: 80, a: 'v' }), 100, 80],
      'barraca': [() => drawTent({ x: 100, y: 80 }), 100, 70],
      'estufa': [() => drawGreenhouseFrame({ x: 90, y: 70 }), 90 + 24, 70 + 24]
    };
    if (typeof drawScarecrow === 'function') objetos['espantalho'] = [() => drawScarecrow({ sx: 100, sy: 90 }), 100, 75];
    for (const [nome, [fn, cx, cy]] of Object.entries(objetos)) {
      const rr = { nome };
      for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
        dia(h);
        try { fn(); } catch (e) { o.erros.push(nome + ': ' + e.message); }
        rr[k] = centro(cx, cy, 45, 45, nome === 'estufa' ? .55 : 1);   // a sombra da estufa e mais fraca (vidro)
      }
      o.sombra.push(rr);
    }
    // chafariz: a sombra do pedestal cai sobre a agua do tanque (nao sobre o fundo liso): agua a oeste x a leste do pedestal
    o.chafariz = {};
    for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
      dia(h); drawFountain({ cx: 100, cy: 80, r: 14 });
      const m = (x, y) => { let t = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) t += lum(x + i, y + j); return t / 9; };
      o.chafariz[k] = { oeste: m(89, 83), leste: m(111, 83) };
    }
    // luz embutida (meio-dia: sombra curta, bem separada do sprite)
    dia(12);
    drawWell({ x: 100, y: 80, t: 0 });   // anel: elipse centrada em (100,78), 8.6 x 5.2
    o.luz.poco = { nw: lum(100 - 6.1, 78 - 3.7), se: lum(100 + 6.1, 78 + 3.7) };
    fundo(); drawStash({ x: 100, y: 80, o: 0, s: [] });   // tampa 14x9 em (93,71)
    o.luz.bau = { norte: lum(100 + 1, 71), leste: lum(93 + 13, 75) };
    fundo(); drawTent({ x: 100, y: 80 });
    o.luz.barraca = { tras: lum(100 - 14, 80 - 19), frente: lum(100 - 14, 80 - 5) };
    // cerca baixa, parede e telhado no mundo de verdade: o chao dos dois lados, em pedacos de varios pixels (o capim varia um pouco)
    const X0 = Math.round(P.x / 16) * 16, Y0 = Math.round(P.y / 16) * 16, bx = X0 / 16, by = Y0 / 16;
    const far = q => Math.abs(q.x - X0) > 330 || Math.abs(q.y - Y0) > 480;
    trees = trees.filter(far); rocks = rocks.filter(far); decorations = decorations.filter(far); items = items.filter(far); campfires = campfires.filter(far); tents = tents.filter(far);
    blds = blds.filter(q => q.x > X0 + 400 || q.x + q.w < X0 - 400 || q.y > Y0 + 520 || q.y + q.h < Y0 - 520);
    for (let i = 0; i < 6; i++) fenceRemote({ x: bx, y: by + 20 + i, d: 'v', g: 0 });          // cerca baixa vertical
    for (let i = 0; i < 6; i++) fenceRemote({ x: bx + 8, y: by + 20 + i, d: 'v', g: 2 });      // parede vertical (8 de manha, 14 px de altura)
    for (let i = 0; i < 3; i++) fenceRemote({ x: bx + 16 + i, y: by + 20, d: 'h', g: 2 });     // o telhado precisa de uma parede para se apoiar
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cellRemote({ k: 'r', x: bx + 16 + i, y: by + 20 + j, on: 1 });   // telhado 3x2
    const faixa = (cx, cy, hw, hh) => { let s = 0, n = 0; for (let i = -hw; i <= hw; i++) for (let j = -hh; j <= hh; j++) { s += lum(cx + i, cy + j); n++; } return s / n; };
    const mundo = (wx, wy) => [wx - camX, wy - camY];
    const quadro = (h, wx, wy) => {   // quadro do jogo com o jogador (camera) em (wx,wy), na hora h
      hora(h); P.x = wx; P.y = wy;
      for (let i = 0; i < 12; i++) { weather = 'none'; weatherTimer = 99999; update(.03); render(); }
      P.x = wx; P.y = wy; render(); ctx.setTransform(Z, 0, 0, Z, 0, 0);
    };
    const mede = h => {
      quadro(h, X0 + 64, Y0 + 20 * 16 + 40);
      const baixa = mundo(bx * 16 + 1, (by + 23) * 16), parede = mundo((bx + 8) * 16, (by + 23) * 16);
      // cerca baixa (poste de 7 px: sombra curta): chao a 3 px de cada lado; parede (14 px): 6 px de cada lado; telhado: 4 px alem de cada borda,
      // na altura do meio da base do telhado (o telhado e desenhado 14 px acima)
      const res = {
        baixa: { oeste: faixa(baixa[0] - 4, baixa[1], 1, 6), leste: faixa(baixa[0] + 4, baixa[1], 1, 6) },
        parede: { oeste: faixa(parede[0] - 7, parede[1], 2, 6), leste: faixa(parede[0] + 7, parede[1], 2, 6) }
      };
      quadro(h, (bx + 17.5) * 16, (by + 21) * 16 + 30);   // o telhado esta mais longe: a camera vai ate ele
      const t2 = mundo((bx + 17.5) * 16, (by + 21) * 16);
      res.telhado = { oeste: faixa(t2[0] - 29, t2[1], 1, 6), leste: faixa(t2[0] + 29, t2[1], 1, 6) };
      return res;
    };
    o.manha = mede(8.5); o.tarde = mede(16.5);
    // emendas: o escuro onde duas pecas vizinhas se encostam e o mesmo do resto da sombra (um caminho so). Parede h de 6 celulas, ao meio-dia
    for (let i = 0; i < 6; i++) fenceRemote({ x: bx + 24 + i, y: by + 20, d: 'h', g: 2 });
    quadro(12, (bx + 27) * 16, (by + 20) * 16 + 40);
    const sob = (wx, wy) => { const [sx, sy] = mundo(wx, wy); return lum(sx, sy); };
    const yy = (by + 20) * 16 + 4;   // abaixo da parede (sombra cai para sul)
    const emenda = sob((bx + 26) * 16, yy), meio = sob((bx + 26) * 16 + 8, yy), fora = sob((bx + 26) * 16 + 8, yy + 24);
    o.emenda = { emenda, meio, fora };
    window.human = human0;
    return o;
  });
  for (const s of r.sombra) {
    ok(s.manha.n > 20 && s.tarde.n > 20, `${s.nome}: tem sombra de sol de manha e de tarde (${s.manha.n} e ${s.tarde.n} pixels)`);
    ok(s.manha.dx < -.5, `${s.nome} de manha: a sombra cai para o oeste (deslocamento ${s.manha.dx.toFixed(1)} px)`);
    ok(s.tarde.dx > .5, `${s.nome} de tarde: a sombra cai para o leste (deslocamento ${s.tarde.dx.toFixed(1)} px)`);
  }
  ok(r.chafariz.manha.leste - r.chafariz.manha.oeste >= 6, `chafariz de manha: sombra do pedestal no lado oeste da agua (oeste ${r.chafariz.manha.oeste.toFixed(0)}, leste ${r.chafariz.manha.leste.toFixed(0)})`);
  ok(r.chafariz.tarde.oeste - r.chafariz.tarde.leste >= 6, `chafariz de tarde: sombra do pedestal no lado leste da agua (oeste ${r.chafariz.tarde.oeste.toFixed(0)}, leste ${r.chafariz.tarde.leste.toFixed(0)})`);
  ok(r.luz.poco.nw - r.luz.poco.se >= 15, `poco: aro mais claro a noroeste que a sudeste (${r.luz.poco.nw.toFixed(0)} contra ${r.luz.poco.se.toFixed(0)})`);
  ok(r.luz.bau.norte - r.luz.bau.leste >= 15, `bau: borda norte da tampa mais clara que a leste (${r.luz.bau.norte.toFixed(0)} contra ${r.luz.bau.leste.toFixed(0)})`);
  ok(r.luz.barraca.tras - r.luz.barraca.frente >= 25, `barraca: aba de tras (virada para o sol) mais clara que a da frente (${r.luz.barraca.tras.toFixed(0)} contra ${r.luz.barraca.frente.toFixed(0)})`);
  for (const k of ['baixa', 'parede', 'telhado']) {
    const nome = { baixa: 'cerca baixa', parede: 'parede', telhado: 'telhado' }[k];
    ok(r.manha[k].leste - r.manha[k].oeste >= 6, `${nome} de manha: chao do oeste mais escuro (oeste ${r.manha[k].oeste.toFixed(0)}, leste ${r.manha[k].leste.toFixed(0)})`);
    ok(r.tarde[k].oeste - r.tarde[k].leste >= 6, `${nome} de tarde: chao do leste mais escuro (oeste ${r.tarde[k].oeste.toFixed(0)}, leste ${r.tarde[k].leste.toFixed(0)})`);
  }
  ok(Math.abs(r.emenda.emenda - r.emenda.meio) <= 4, `fila de paredes: a emenda nao escurece em dobro (${r.emenda.emenda.toFixed(0)} contra ${r.emenda.meio.toFixed(0)} no meio da peca)`);
  ok(r.emenda.meio < r.emenda.fora - 6, `fila de paredes: o chao junto da parede esta na sombra (${r.emenda.meio.toFixed(0)} contra ${r.emenda.fora.toFixed(0)} longe)`);
  ok(r.erros.length === 0 && errs.length === 0, 'sem erros de JS ' + r.erros.concat(errs).join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
