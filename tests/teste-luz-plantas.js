/* Luz das plantas (culturas da plantacao e milharal).
   Antes: cada pe de milho trazia uma sombra parada pintada dentro do proprio sprite (igual de manha e de tarde, e tambem nas culturas de milho plantadas),
   as outras culturas, os postes da cerca do milharal e os fardos de feno nao tinham sombra nenhuma.
   Regra: sombra projetada sempre dinamica, seguindo o sol (de manha cai para o oeste, de tarde para o leste), e sem escurecer em dobro onde
   varias plantas se encostam (um caminho so, um preenchimento so).
   Confere:
   - o sprite do pe de milho nao traz sombra pintada;
   - macieira, tamareira, cacto, tomate, batata e milho plantados: o centro da sombra fica a oeste de manha e a leste de tarde;
   - milharal: pe de milho, poste da cerca e fardo seguem o sol do mesmo jeito;
   - um grupo de plantas coladas nao tem nenhum pixel mais escuro que a sombra simples (sem soma nas emendas);
   - sem erros de JS.
   Uso: node tests/teste-luz-plantas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
    const o = { erros: [], plantas: [], milho: {}, soma: {} };
    localStorage.clear(); selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
    P.dead = false; P.hp = 100; P.inVehicle = null; P.inside = null; zombies.length = 0; animals.length = 0;
    const BG = [216, 176, 96];
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; };
    const fundo = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.setTransform(Z, 0, 0, Z, 0, 0); };
    const dia = h => { hora(h); for (let i = 0; i < 6; i++) { weather = 'none'; weatherTimer = 99999; update(.03); render(); } fundo(); };
    const alvoSombra = () => { const a = +(/,([\d.]+)\)$/.exec(SUN.fs) || [0, 0])[1], k = [8, 10, 28]; return BG.map((v, i) => v * (1 - a) + k[i] * a); };
    // pixels com exatamente a cor do fundo escurecido pela sombra do sol, numa janela em volta de (cx,cy): { n, dx (centro em x menos cx), maisEscuros }
    const centro = (cx, cy, rw, rh) => {
      const alvo = alvoSombra(), x0 = Math.floor((cx - rw) * Z), y0 = Math.floor((cy - rh) * Z), w = Math.floor(2 * rw * Z), h = Math.floor(2 * rh * Z);
      const d = ctx.getImageData(x0, y0, w, h).data; let sx = 0, n = 0, esc = 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const q = (j * w + i) * 4;
        if (Math.abs(d[q] - alvo[0]) < 3 && Math.abs(d[q + 1] - alvo[1]) < 3 && Math.abs(d[q + 2] - alvo[2]) < 3) { sx += x0 + i; n++; }
        else if (d[q] < alvo[0] - 3 && d[q + 1] < alvo[1] - 3) esc++;
      }
      return { n, dx: n ? (sx / n) / Z - cx : 0, esc };
    };
    // sprite do pe de milho: nenhum pixel pintado nas duas ultimas linhas, abaixo do talo (a sombra parada ficava la)
    const sp = stalkSprite(0, 0), g = sp.getContext('2d').getImageData(4, 30, 8, 2).data; let pintado = 0; for (let i = 3; i < g.length; i += 4) if (g[i] > 0) pintado++;
    o.spritePintado = pintado;
    // culturas plantadas (fase final): um canteiro por vez, sem plantas vizinhas
    const lista = ['apple', 'date', 'cactus', 'tomato', 'potato', 'corn'];
    for (const c of lista) {
      const rr = { c };
      for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
        dia(h);
        const GD = { apple: 3, date: 3, cactus: 2, tomato: 1.2, potato: 1.2, corn: 1.5 };
        try {
          plotRemote({ cx: 6, cy: 5, c, g: GD[c] * DAY_SECONDS * 1.5, w: 100 });
          drawPlantShadows(0, 400, 0, 200);
        } catch (e) { o.erros.push(c + ': ' + e.message); }
        rr[k] = centro(6 * 16 + 8, 5 * 16 + 12, 28, 28);
        try { plotRemote({ cx: 6, cy: 5, c: null, g: 0, w: 0 }); } catch (e) { }
      }
      o.plantas.push(rr);
    }
    // grupo de macieiras coladas: o escuro nao soma onde as sombras se encontram
    dia(16.5);
    for (let i = 0; i < 4; i++) plotRemote({ cx: 6 + i, cy: 5, c: 'apple', g: 3 * DAY_SECONDS * 1.5, w: 100 });
    try { drawPlantShadows(0, 400, 0, 200); } catch (e) { o.erros.push('macieiras: ' + e.message); }
    o.soma.plantas = centro(8 * 16 + 8, 5 * 16 + 14, 50, 26);
    // milharal de mentira (so o necessario): um pe, um poste e um fardo, cada um longe dos outros
    const FIELD0 = FIELD;
    FIELD = { x: 20, y: 30, w: 200, h: 120, cx: 120, cy: 90, stalks: [[120, 100, 0, 0], [124, 100, 1, 0], [128, 100, 0, 1], [132, 100, 0, 0]], bales: [[40, 130]], spots: [], cols: [], fence: [] };
    for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
      dia(h);
      try { drawCornShadows(0, 400, 0, 200); } catch (e) { o.erros.push('milharal: ' + e.message); }
      o.milho[k] = { pe: centro(126, 96, 22, 20), poste: centro(20, 30, 6, 8), fardo: centro(40, 132, 12, 8) };
      if (k === 'tarde') o.soma.milho = centro(126, 96, 22, 20);
    }
    FIELD = FIELD0;
    return o;
  });
  ok(r.spritePintado === 0, `pe de milho: sem sombra parada pintada no sprite (${r.spritePintado} pixels)`);
  for (const p of r.plantas) {
    ok(p.manha.n > 8 && p.tarde.n > 8, `${p.c}: tem sombra de manha e de tarde (${p.manha.n} e ${p.tarde.n} pixels)`);
    ok(p.manha.dx < -.4, `${p.c} de manha: sombra para o oeste (${p.manha.dx.toFixed(1)} px)`);
    ok(p.tarde.dx > .4, `${p.c} de tarde: sombra para o leste (${p.tarde.dx.toFixed(1)} px)`);
  }
  for (const [k, nome] of [['pe', 'pe de milho do milharal'], ['poste', 'poste da cerca do milharal'], ['fardo', 'fardo de feno']]) {
    ok(r.milho.manha[k].n > 5 && r.milho.tarde[k].n > 5, `${nome}: tem sombra (${r.milho.manha[k].n} e ${r.milho.tarde[k].n} pixels)`);
    ok(r.milho.manha[k].dx < -.3, `${nome} de manha: sombra para o oeste (${r.milho.manha[k].dx.toFixed(1)} px)`);
    ok(r.milho.tarde[k].dx > .3, `${nome} de tarde: sombra para o leste (${r.milho.tarde[k].dx.toFixed(1)} px)`);
  }
  ok(r.soma.plantas.n > 40 && r.soma.plantas.esc === 0, `macieiras coladas: sombra sem somar o escuro (${r.soma.plantas.n} pixels de sombra, ${r.soma.plantas.esc} mais escuros)`);
  ok(r.soma.milho.n > 20 && r.soma.milho.esc === 0, `pes de milho colados: sombra sem somar o escuro (${r.soma.milho.n} pixels de sombra, ${r.soma.milho.esc} mais escuros)`);
  ok(r.erros.length === 0 && errs.length === 0, 'sem erros de JS ' + r.erros.concat(errs).join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
