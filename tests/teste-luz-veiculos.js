/* Luz dos veiculos: o sol fica a noroeste, o veiculo gira e a luz NAO gira junto.
   Antes o brilho do teto era desenhado sempre no lado -Y do veiculo e girava com ele (carro virado para oeste: brilho no lado sul),
   e o destroco do deserto era desenhado de lado, com sombra elipse fixa em vez da sombra do sol.
   Confere, para os 4 veiculos (quadriciclo, moto de neve, buggy, carro) virados para leste, sul, oeste e norte:
   - o canto noroeste do corpo e mais claro que o canto sudeste (borda de luz e de sombra do corpo);
   - no carro, o brilho do teto cai do lado noroeste (a faixa do lado sudeste fica mais escura);
   - vehLightEdges soma zero e acende as bordas voltadas para noroeste;
   - o destroco projeta a sombra do sol (cai para o oeste de manha e para o leste de tarde) e tem borda norte/oeste clara e sul/leste escura.
   Uso: node tests/teste-luz-veiculos.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
    const human0 = window.human; window.human = function () { };   // sem o jogador em cima do veiculo
    const lum = (sx, sy) => { const d = ctx.getImageData(sx, sy, 1, 1).data; return (d[0] + d[1] + d[2]) / 3; };
    const dev = (wx, wy) => [Math.floor(Z * (wx - camX)), Math.floor(Z * (wy - camY))];   // mundo -> pixel da tela
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; };
    const o = { corpo: [], teto: [], erros: [] };
    const faces = [['leste', 0], ['sul', Math.PI / 2], ['oeste', Math.PI], ['norte', Math.PI * 1.5]];
    for (const m of ['forest', 'snow', 'desert', 'city']) {
      localStorage.clear(); selectedMap = m; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
      P.dead = false; P.hp = 100; P.inVehicle = null; P.inside = null; zombies.length = 0; animals.length = 0;
      const v = vehicles[0]; vehicles.length = 0; vehicles.push(v);
      v.spd = 0; v.driverId = null; v.passId = null; v.destroyed = false; v.dying = false; v.looted = true;
      const far = q => Math.hypot(q.x - v.x, q.y - v.y) > 170;
      trees = trees.filter(far); rocks = rocks.filter(far); decorations = decorations.filter(far); items = items.filter(far); campfires = campfires.filter(far); tents = tents.filter(far);
      const K = vehKind(v), L = v.w, W = v.h, box = vehBodyBox(K, L, W).b;
      hora(12);
      for (const [nome, f] of faces) {
        v.face = f; P.x = v.x; P.y = v.y; render();
        const c = Math.cos(f), s = Math.sin(f);
        const world = (lx, ly) => [v.x + lx * c - ly * s, v.y + lx * s + ly * c];
        // cantos do corpo, 0,5 px para dentro: o mais a noroeste e o mais a sudeste
        const cantos = [[box[0] + .5, box[1] + .5], [box[0] + box[2] - .5, box[1] + .5], [box[0] + box[2] - .5, box[1] + box[3] - .5], [box[0] + .5, box[1] + box[3] - .5]].map(p => world(p[0], p[1]));
        cantos.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
        const nw = lum(...dev(...cantos[0])), se = lum(...dev(...cantos[3]));
        o.corpo.push({ m, K, nome, nw, se });
        if (K === 'car') {   // brilho do teto: faixa de 2 px junto a uma das laterais, no meio do corpo (x=-8: entre as rodas, fora dos vidros e da traseira)
          const a = world(-8, -W / 2 + 1.5), z = world(-8, W / 2 - 1.5);
          const [pa, pz] = (a[0] + a[1]) <= (z[0] + z[1]) ? [a, z] : [z, a];   // pa: lateral mais a noroeste
          o.teto.push({ nome, nw: lum(...dev(...pa)), se: lum(...dev(...pz)) });
        }
      }
    }
    // funcao pura: as bordas voltadas para noroeste recebem luz e as voltadas para sudeste, sombra
    o.somaZero = true; o.leste = vehLightEdges(0); o.oeste = vehLightEdges(Math.PI); o.sul = vehLightEdges(Math.PI / 2); o.norte = vehLightEdges(Math.PI * 1.5);
    for (let k = 0; k < 16; k++) { const e = vehLightEdges(k * Math.PI / 8); if (Math.abs(e[0] + e[1]) > 1e-9 || Math.abs(e[2] + e[3]) > 1e-9) o.somaZero = false; }
    // destroco do deserto: a sombra segue o sol (troca de lado entre manha e tarde) e a luz do sprite vem de noroeste
    selectedMap = 'desert'; weather = 'none'; newGame(); showScreen(null); state = 'play'; weatherTimer = 99999;
    const px = (x, y) => lum(x * 2 + 1, y * 2 + 1);
    const desenha = h => {
      hora(h); for (let i = 0; i < 12; i++) { update(.03); render(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#d8b060'; ctx.fillRect(0, 0, W, H); ctx.setTransform(2, 0, 0, 2, 0, 0);
      drawAmbProp({ type: 'wreck', x: 80, y: 60, seed: .2 }); drawAmbProp({ type: 'wreck', x: 80, y: 120, seed: .8 });
      return [60, 120].map(y => ({ oeste: px(60, y), leste: px(100, y), norte: px(79, y - 6), sul: px(79, y + 5), bOeste: px(67, y + 1), bLeste: px(92, y + 1) }));
    };
    o.manha = desenha(8.5); o.tarde = desenha(16.5);
    window.human = human0;
    return o;
  });
  for (const c of r.corpo) ok(c.nw - c.se >= 20, `${c.m} (${c.K}) virado para ${c.nome}: canto noroeste mais claro que o sudeste (${c.nw.toFixed(0)} contra ${c.se.toFixed(0)})`);
  for (const t of r.teto) ok(t.nw - t.se >= 8, `carro virado para ${t.nome}: o brilho do teto fica do lado noroeste (${t.nw.toFixed(0)} contra ${t.se.toFixed(0)})`);
  ok(r.somaZero, 'bordas opostas recebem luz oposta em qualquer direcao');
  ok(r.leste[0] > 0 && r.leste[1] < 0 && r.leste[2] < 0 && r.leste[3] > 0, 'virado para leste: lateral norte e traseira recebem luz, lateral sul e frente ficam na sombra');
  ok(r.oeste[0] < 0 && r.oeste[1] > 0 && r.oeste[2] > 0 && r.oeste[3] < 0, 'virado para oeste: a luz continua vindo de noroeste (lateral sul do corpo e a frente acesas)');
  ok(r.sul[0] < 0 && r.sul[1] > 0 && r.sul[2] < 0 && r.sul[3] > 0, 'virado para sul: lado +Y e traseira acesos');
  ok(r.norte[0] > 0 && r.norte[1] < 0 && r.norte[2] > 0 && r.norte[3] < 0, 'virado para norte: lado -Y e frente acesos');
  r.manha.forEach((d, i) => ok(d.leste - d.oeste >= 10, `destroco ${i + 1} de manha: a sombra cai para o oeste (chao do oeste ${d.oeste.toFixed(0)}, do leste ${d.leste.toFixed(0)})`));
  r.tarde.forEach((d, i) => ok(d.oeste - d.leste >= 10, `destroco ${i + 1} de tarde: a sombra cai para o leste (chao do oeste ${d.oeste.toFixed(0)}, do leste ${d.leste.toFixed(0)})`));
  r.manha.concat(r.tarde).forEach((d, i) => {
    ok(d.norte - d.sul >= 25, `destroco ${i % 2 + 1} (${i < 2 ? 'manha' : 'tarde'}): borda norte mais clara que a sul (${d.norte.toFixed(0)} contra ${d.sul.toFixed(0)})`);
    ok(d.bOeste - d.bLeste >= 25, `destroco ${i % 2 + 1} (${i < 2 ? 'manha' : 'tarde'}): borda oeste mais clara que a leste (${d.bOeste.toFixed(0)} contra ${d.bLeste.toFixed(0)})`);
  });
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
