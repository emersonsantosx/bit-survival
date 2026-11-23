/* Luz das decoracoes do mapa (poste de luz, bandeira, placa, estatua, pilar, palmeira, guarda-sol, quiosque, torre de salva-vidas, barco, bau, barraca velha...).
   Antes: as decoracoes altas tinham uma elipse parada perto do pe (um poste de 26 px e uma estatua de 41 px com a mesma mancha), o barco era um casco de lado
   com sombra azul fixa, o bau de mapa e a barraca velha eram desenhados de frente (tampa, corpo e fecho; triangulo) e havia duas bandeiras no mesmo `case`
   (a segunda nunca era usada).
   Regra: vista de cima, luz a noroeste (borda norte e oeste clara, sul e leste escura) e sombra projetada que segue o sol, com o tamanho da peca.
   Confere:
   - a sombra das decoracoes altas cai para o oeste de manha e para o leste de tarde;
   - bau de mapa: tampa vista de cima, borda norte mais clara que a leste (antes a cinta leste era a parte clara);
   - barraca velha: aba de tras (virada para o sol) mais clara que a da frente;
   - a bandeira tem uma so definicao;
   - sem erros de JS.
   Uso: node tests/teste-luz-decoracoes.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
    const o = { erros: [], sombra: [], luz: {} };
    localStorage.clear(); selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
    P.dead = false; P.hp = 100; P.inVehicle = null; P.inside = null; zombies.length = 0; animals.length = 0;
    const BG = [216, 176, 96];
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; };
    const fundo = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgb(' + BG + ')'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.setTransform(Z, 0, 0, Z, 0, 0); };
    const dia = h => { hora(h); for (let i = 0; i < 6; i++) { weather = 'none'; weatherTimer = 99999; update(.03); render(); } fundo(); };
    const px = (x, y) => { const d = ctx.getImageData(Math.floor(x * Z) + 1, Math.floor(y * Z) + 1, 1, 1).data; return [d[0], d[1], d[2]]; };
    const lum = (x, y) => { const d = px(x, y); return (d[0] + d[1] + d[2]) / 3; };
    // centro (em x) dos pixels com a cor exata do fundo escurecido pela sombra do sol
    const centro = (cx, cy, rw, rh) => {
      const a = +(/,([\d.]+)\)$/.exec(SUN.fs) || [0, 0])[1], k = [8, 10, 28], alvo = BG.map((v, i) => v * (1 - a) + k[i] * a);
      const x0 = Math.floor((cx - rw) * Z), y0 = Math.floor((cy - rh) * Z), w = Math.floor(2 * rw * Z), h = Math.floor(2 * rh * Z);
      const d = ctx.getImageData(x0, y0, w, h).data; let sx = 0, n = 0, mn = 1e9;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = (j * w + i) * 4; if (Math.abs(d[q] - alvo[0]) < 3 && Math.abs(d[q + 1] - alvo[1]) < 3 && Math.abs(d[q + 2] - alvo[2]) < 3) { sx += x0 + i; n++; if (x0 + i < mn) mn = x0 + i; } }
      return { n, dx: n ? (sx / n) / Z - cx : 0, alc: n ? cx - mn / Z : 0 };
    };
    const X = 140, Y = 100;
    // alcance minimo (px, de manha) da sombra das pecas altas: o tamanho da sombra acompanha a altura da peca
    const ALC = { lamp: 10, flag: 10, sign: 8, statue: 16, pillar: 14, palmorla: 30, umbrella: 28, kiosk: 24, lifeguard: 18 };
    const tipos = [['lamp', {}], ['flag', {}], ['sign', {}], ['statue', {}], ['pillar', { seed: .6 }], ['mailbox', {}], ['snowman', {}], ['cactus_tall', {}], ['palmorla', {}], ['umbrella', {}],
      ['kiosk', {}], ['lifeguard', {}], ['boat', {}], ['chest', {}], ['chest', { open: true, kind: 'gold' }], ['oldtent', {}], ['dumpster', {}]];
    for (const [type, extra] of tipos) {
      const rr = { nome: type + (extra.open ? ' aberto' : ''), min: ALC[type] || 0 };
      for (const [k, h] of [['manha', 8.5], ['tarde', 16.5]]) {
        dia(h);
        try { drawDecoration0(Object.assign({ type, x: X, y: Y, seed: .3, kind: 'wood', open: false, main: false }, extra)); } catch (e) { o.erros.push(type + ': ' + e.message); }
        rr[k] = centro(X, Y - 10, 70, 45);
      }
      o.sombra.push(rr);
    }
    // luz embutida (meio-dia): bau fechado (tampa 14x9 em (X-7, Y-9)) e barraca velha
    dia(12);
    drawDecoration0({ type: 'chest', x: X, y: Y, seed: .3, kind: 'wood', open: false });
    o.luz.bau = { norte: lum(X - 1, Y - 9), leste: lum(X - 7 + 13, Y - 5) };
    fundo(); drawDecoration0({ type: 'oldtent', x: X, y: Y, seed: .3 });
    o.luz.barraca = { tras: lum(X - 8, Y - 12), frente: lum(X - 8, Y - 3) };
    o.bandeiras = (drawDecoration0.toString().match(/case\s*'flag'/g) || []).length;
    return o;
  });
  for (const s of r.sombra) {
    ok(s.manha.n > 15 && s.tarde.n > 15, `${s.nome}: tem sombra de manha e de tarde (${s.manha.n} e ${s.tarde.n} pixels)`);
    ok(s.manha.dx < -.5, `${s.nome} de manha: sombra para o oeste (${s.manha.dx.toFixed(1)} px)`);
    ok(s.tarde.dx > .5, `${s.nome} de tarde: sombra para o leste (${s.tarde.dx.toFixed(1)} px)`);
    if (s.min) ok(s.manha.alc >= s.min, `${s.nome}: sombra do tamanho da peca (alcance de manha ${s.manha.alc.toFixed(0)} px, minimo ${s.min})`);
  }
  ok(r.luz.bau.norte - r.luz.bau.leste >= 40, `bau de mapa: borda norte da tampa mais clara que a leste (${r.luz.bau.norte.toFixed(0)} contra ${r.luz.bau.leste.toFixed(0)})`);
  ok(r.luz.barraca.tras - r.luz.barraca.frente >= 30, `barraca velha: aba de tras mais clara que a da frente (${r.luz.barraca.tras.toFixed(0)} contra ${r.luz.barraca.frente.toFixed(0)})`);
  ok(r.bandeiras === 1, `bandeira: uma so definicao em drawDecoration0 (${r.bandeiras})`);
  ok(r.erros.length === 0 && errs.length === 0, 'sem erros de JS ' + r.erros.concat(errs).join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
