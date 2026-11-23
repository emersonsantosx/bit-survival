/* Luz dos itens (itens no chao e armas na mao).
   Antes: a arma na mao girava com a mira e o brilho pintado no icone girava junto (a luz mudava de lado conforme o jogador mirava); os icones do inventario
   foram desenhados com a luz cada um de um jeito (o machado tinha o brilho a leste), e eram usados assim no chao; a katana tinha a borda clara embaixo/direita
   (o sul e o leste iluminados, o contrario do resto do jogo); o item no chao tinha uma elipse fixa de sombra.
   Regra: a arma gira, a luz nao: noroeste claro, sudeste escuro, em qualquer mira; item no chao com a luz do jogo e sombra que segue o sol.
   Confere:
   - cada arma na mao (12 armas x 4 miras): a metade noroeste do desenho e mais clara que a sudeste, em todas as miras;
   - a luz da arma e a mesma (nao muda de lado) quando a mira gira 180 graus;
   - itens no chao (machado, picareta, katana, taco, pistola, kit, garrafa, tecido...): lado noroeste mais claro que o sudeste;
   - katana: a borda de cima da lamina e mais clara que a de baixo (horizontal) e a do noroeste mais clara que a do sudeste (diagonal);
   - sombra do item no chao cai para o oeste de manha e para o leste de tarde;
   - as armas funcionam com zoom fracionado e sem erros de JS.
   Uso: node tests/teste-luz-itens.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; window.human = function () { };
    const o = { erros: [], armas: [], chao: [], sombra: [], katana: {} };
    localStorage.clear(); selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
    P.dead = false; P.hp = 100; P.inVehicle = null; P.inside = null; zombies.length = 0; animals.length = 0;
    const BG = [128, 128, 128], K = [8, 10, 28];
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; };
    const fundo = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.setTransform(Z, 0, 0, Z, 0, 0); };
    const dia = h => { hora(h); for (let i = 0; i < 6; i++) { weather = 'none'; weatherTimer = 99999; update(.03); render(); } fundo(); };
    // classifica o pixel: fundo, sombra do sol (fica na reta entre o fundo e a cor da sombra) ou desenho
    const ehDesenho = p => {
      const v = [p[0] - BG[0], p[1] - BG[1], p[2] - BG[2]], w = [K[0] - BG[0], K[1] - BG[1], K[2] - BG[2]], ww = w[0] * w[0] + w[1] * w[1] + w[2] * w[2];
      const t = (v[0] * w[0] + v[1] * w[1] + v[2] * w[2]) / ww, res = Math.hypot(v[0] - t * w[0], v[1] - t * w[1], v[2] - t * w[2]);
      return !(res < 5 && t > -.03 && t < .7);
    };
    // quanto a luz do jogo muda cada pixel do desenho: o mesmo desenho e feito duas vezes, com e sem a luz por cima (pxLight/pxCanvasLit trocadas por versoes vazias).
    // Devolve a diferenca entre o ganho de luz do lado noroeste e o do sudeste (u = dx + dy a partir do centro do desenho): positivo = noroeste mais claro.
    // Medir so as cores do icone nao serve: o desenho muda de cor ao longo da arma (cabo, lamina) e isso se mistura com a posicao.
    const snap = (cx, cy, r) => { const x0 = Math.floor((cx - r) * Z), y0 = Math.floor((cy - r) * Z), w = Math.floor(2 * r * Z), h = Math.floor(2 * r * Z); return { x0, y0, w, h, d: ctx.getImageData(x0, y0, w, h).data }; };
    const luz = (desenha, cx, cy, r) => {
      const pL = window.pxLight, pC = window.pxCanvasLit;
      fundo(); desenha(); const A = snap(cx, cy, r);
      window.pxLight = function () { }; window.pxCanvasLit = n => pxCanvas(n);
      try { fundo(); desenha(); } finally { var B = snap(cx, cy, r); window.pxLight = pL; window.pxCanvasLit = pC; }
      const pts = []; let mx = 0, my = 0;
      for (let j = 0; j < A.h; j++) for (let i = 0; i < A.w; i++) {
        const q = (j * A.w + i) * 4, pa = [A.d[q], A.d[q + 1], A.d[q + 2]], pb = [B.d[q], B.d[q + 1], B.d[q + 2]];
        if (!ehDesenho(pb)) continue;
        const x = (A.x0 + i + .5) / Z, y = (A.y0 + j + .5) / Z; pts.push([x, y, (pa[0] + pa[1] + pa[2] - pb[0] - pb[1] - pb[2]) / 3]); mx += x; my += y;
      }
      mx /= pts.length || 1; my /= pts.length || 1;
      // inclinacao do ganho de luz em funcao de u (cov/var): negativa = o ganho cai do noroeste para o sudeste. dif = -inclinacao (positivo = noroeste mais claro).
      // su = espalhamento de u: uma peca fina deitada na diagonal noroeste-sudoeste (nordeste-sudoeste) quase nao tem gradiente para medir.
      let cu = 0, vu = 0, mg = 0; for (const p of pts) mg += p[2]; mg /= pts.length || 1;
      for (const [x, y, g] of pts) { const u = x - mx + y - my; cu += u * (g - mg); vu += u * u; }
      return { n: pts.length, dif: vu ? -cu / vu : 0, su: Math.sqrt(vu / (pts.length || 1)) };
    };
    // desenho de teste: um quadrado de cor uniforme. Como todos os pixels tem a mesma cor, qualquer diferenca de claridade entre o lado noroeste e o sudeste vem so da luz
    // do jogo (e nao do desenho pintado no icone), em qualquer mira.
    PXG.__teste = Array.from({ length: 16 }, () => 'h'.repeat(16)); delete PXCV.__teste; if (typeof PXLIT !== 'undefined') delete PXLIT.__teste;
    HELD.__teste = { ic: '__teste', ax: 8, ay: 8, s: 1 }; ITEMS.__teste = { n: 'teste', e: '__teste' };
    // armas de verdade: todas aparecem desenhadas na mao
    const armas = ['pistol', 'smg', 'shotgun', 'rifle', 'bow', 'bat', 'axe', 'pickaxe', 'katana', 'spear', 'fishingrod', 'hoe'];
    dia(12);
    for (const w of armas) {
      const rr = { w, n: 0 };
      for (const a of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) { fundo(); try { drawHeld(w, 140, 100, a, meleeLeft(w, a)); } catch (e) { o.erros.push(w + ': ' + e.message); } rr.n = Math.max(rr.n, snapN(140, 100, 28)); }
      o.armas.push(rr);
    }
    function snapN(cx, cy, r) { const x0 = Math.floor((cx - r) * Z), y0 = Math.floor((cy - r) * Z), w = Math.floor(2 * r * Z), h = Math.floor(2 * r * Z), d = ctx.getImageData(x0, y0, w, h).data; let n = 0; for (let k = 0; k < w * h; k++) if (ehDesenho([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]])) n++; return n; }
    // a luz nao gira com a mira: quadrado de teste na mao em varias miras, e de frente e espelhado
    o.maoTeste = [];
    for (const [a, esq] of [[0, false], [.7, false], [Math.PI / 2, false], [2.4, false], [Math.PI, false], [4.7, false], [.7, true], [2.4, true]]) {
      let l = { dif: 0, n: 0 }; try { l = luz(() => drawHeld('__teste', 140, 100, a, esq), 140, 100, 28); } catch (e) { o.erros.push('mao teste: ' + e.message); }
      o.maoTeste.push({ a, esq, dif: l.dif, n: l.n });
    }
    const Z0 = Z; try { Z = 2.37; o.zoomFrac = luz(() => drawHeld('__teste', 140, 100, .6, false), 140, 100, 28); } catch (e) { o.erros.push('zoom: ' + e.message); } Z = Z0;
    // item no chao com o mesmo desenho de teste, e os itens de verdade aparecendo
    dia(12);
    try { o.chaoTeste = luz(() => drawItem({ t: '__teste', x: 140, y: 100 }, false), 140, 94, 14); } catch (e) { o.erros.push('chao teste: ' + e.message); }
    o.chao = [];
    for (const t of ['axe', 'pickaxe', 'katana', 'bat', 'pistol', 'rifle', 'medkit', 'water', 'cloth', 'bandage', 'food', 'hoe']) {
      if (!ITEMS[t]) continue; fundo();
      try { drawItem({ t, x: 140, y: 100 }, false); } catch (e) { o.erros.push(t + ': ' + e.message); }
      o.chao.push({ t, n: snapN(140, 96, 12) });
    }
    // sombra do item no chao: centro dos pixels da cor do fundo escurecido pelo sol
    const centro = (cx, cy, r) => {
      const a = +(/,([\d.]+)\)$/.exec(SUN.fs) || [0, 0])[1], alvo = BG.map((v, i) => v * (1 - a) + K[i] * a);
      const x0 = Math.floor((cx - r) * Z), y0 = Math.floor((cy - r) * Z), w = Math.floor(2 * r * Z), h = Math.floor(2 * r * Z), d = ctx.getImageData(x0, y0, w, h).data; let sx = 0, n = 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = (j * w + i) * 4; if (Math.abs(d[q] - alvo[0]) < 3 && Math.abs(d[q + 1] - alvo[1]) < 3 && Math.abs(d[q + 2] - alvo[2]) < 3) { sx += x0 + i; n++; } }
      return { n, dx: n ? (sx / n) / Z - cx : 0 };
    };
    for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
      dia(h); try { drawItem({ t: 'rifle', x: 140, y: 100 }, false); } catch (e) { o.erros.push('sombra: ' + e.message); }
      o.sombra.push([k, centro(140, 100, 14)]);
    }
    // katana: arte do icone
    const px = (cv, x, y) => { const d = cv.getContext('2d').getImageData(x, y, 1, 1).data; return (d[0] + d[1] + d[2]) / 3; };
    const kh = pxCanvas('katana_h'), kd = pxCanvas('katana');
    o.katana = { cima: px(kh, 15, 3), baixo: px(kh, 15, 4), noroeste: px(kd, 9, 3), sudeste: px(kd, 10, 3) };
    return o;
  });
  for (const a of r.armas) ok(a.n > 8, `${a.w}: desenhada na mao (${a.n} pixels)`);
  const MIN = .6, md = r.maoTeste.map(m => m.dif);
  for (const m of r.maoTeste) ok(m.n > 100 && m.dif >= MIN, `mira ${m.a.toFixed(1)}${m.esq ? ' (espelhada)' : ''}: o lado noroeste ganha mais luz que o sudeste (inclinacao ${m.dif.toFixed(2)})`);
  ok(Math.max(...md) - Math.min(...md) < 1.2, `a luz da arma na mao nao muda de forca ao girar a mira (${md.map(v => v.toFixed(2)).join(', ')})`);
  ok(r.zoomFrac.n > 100 && r.zoomFrac.dif >= MIN, `arma na mao com zoom fracionado: luz noroeste preservada (${r.zoomFrac.n} pixels, inclinacao ${r.zoomFrac.dif.toFixed(2)})`);
  ok(r.chaoTeste.n > 100 && r.chaoTeste.dif >= MIN, `item no chao: o lado noroeste ganha mais luz que o sudeste (inclinacao ${r.chaoTeste.dif.toFixed(2)})`);
  for (const c of r.chao) ok(c.n > 8, `${c.t}: item desenhado no chao (${c.n} pixels)`);
  ok(r.katana.cima > r.katana.baixo + 20, `katana (horizontal): borda de cima mais clara que a de baixo (${r.katana.cima.toFixed(0)} contra ${r.katana.baixo.toFixed(0)})`);
  ok(r.katana.noroeste > r.katana.sudeste + 20, `katana (diagonal): borda noroeste mais clara que a sudeste (${r.katana.noroeste.toFixed(0)} contra ${r.katana.sudeste.toFixed(0)})`);
  const [m, t] = [r.sombra[0][1], r.sombra[1][1]];
  ok(m.n > 20 && t.n > 20, `sombra do item no chao: existe de manha e de tarde (${m.n} e ${t.n} pixels)`);
  ok(m.dx < -.2, `item no chao de manha: sombra para o oeste (${m.dx.toFixed(1)} px)`);
  ok(t.dx > .2, `item no chao de tarde: sombra para o leste (${t.dx.toFixed(1)} px)`);
  ok(r.erros.length === 0 && errs.length === 0, 'sem erros de JS ' + r.erros.concat(errs).join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
