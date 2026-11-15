/* Sombras da lanterna e dos farois: arvore, pedra e parede cortam o feixe. Atras do obstaculo fica escuro; a frente dele e o que esta em volta continuam
   iluminados. Medido nos pixels da tela, de noite, com e sem o obstaculo (mesma cena, mesmo sorteio).
   Uso: node tests/teste-sombras-luz.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
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
    T = ((23 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS;
    const o = {};
    // parede de verdade: um predio do mundo gerado; a luz parte de 30 px fora dele, virada para a parede
    { const bl = blds.find(q => q.w > 60 && q.h > 60); const ox = bl.x - 30, oy = bl.y + bl.h / 2;
      const v = beamVis(ox, oy, 0, 170, .5, 26); o.parede = !!v; o.paredeMin = v ? Math.min(...v.pts.filter((_, i) => i % 2 === 0).map(x => x - ox)) : null; }
    const lum = (wx, wy) => {   // brilho medio (3x3) do pixel da tela onde esta o ponto do mundo
      const sx = Math.round((wx - camX) * Z), sy = Math.round((wy - camY) * Z);
      const d = cv.getContext('2d').getImageData(sx - 1, sy - 1, 3, 3).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / 9;
    };
    const cena = (obst) => {
      zombies.length = 0; animals.length = 0; trees.length = 0; rocks.length = 0; items.length = 0; blds.length = 0; vehicles.length = 0; decorations.length = 0; tents.length = 0;
      P.x = 600; P.y = 600; P.face = 0; P.inside = null; P.inVehicle = null; P.torch = true; P.flashOn = true;
      if (obst === 'tree') trees.push({ x: 650, y: 600, hp: 5, t: 0, type: 0, seed: 1, h: 1 });
      if (obst === 'carro') vehicles.push({ id: 9, x: 650, y: 600, w: 36, h: 20, col: '#c33', looted: true, spd: 0, face: 0, hp: 100, maxHp: 100 });
      if (obst === 'poste') decorations.push({ x: 650, y: 600, type: 'lamp', solid: true, seed: .2 });
      if (obst === 'barraca') tents.push({ x: 650, y: 600 });
      if (obst === 'rock') rocks.push({ x: 650, y: 600, hp: 5, t: 0, type: 0, seed: 1, s: 1 });
      rebuildSolidGrid(); for (let i = 0; i < 25; i++) update(.1);
      if (obst === 'zumbi') { const z = spawnZ(650, 600, 0); z.x = 650; z.y = 600; z.hp = z.hp || 10; zombies.push(z); }
      if (obst === 'lobo') animals.push({ x: 650, y: 600, k: 'wolf', face: 0, hp: 10, max: 10 });
      for (let k = 0; k < 3; k++) render();
    };
    // 1) lanterna: ponto atras do obstaculo (a 85 do jogador, na mesma linha), ponto ao lado do obstaculo, ponto na frente dele
    const pts = { atras: [676, 601], lado: [655, 585], frente: [632, 600] };
    cena(null); o.livre = { atras: lum(...pts.atras), lado: lum(...pts.lado), frente: lum(...pts.frente) };
    cena('tree'); o.arvore = { atras: lum(...pts.atras), lado: lum(...pts.lado), frente: lum(...pts.frente), vis: !!lightBeams()[0].occ };
    cena('rock'); o.pedra = { atras: lum(...pts.atras), vis: !!lightBeams()[0].occ };
    cena('carro'); o.carro = lum(...pts.atras); cena('poste'); o.poste = lum(...pts.atras); o.posteLado = lum(655, 585); cena('barraca'); o.barraca = lum(...pts.atras); cena('zumbi'); o.zumbi = lum(...pts.atras); o.zumbiLado = lum(655, 574); cena(null); o.loboLivre = lum(666, 601); cena('lobo'); o.lobo = lum(666, 601);
    cena(null); o.semVis = !lightBeams()[0].vis && !lightBeams()[0].occ;
    // 3) farol do carro com uma arvore na frente
    const cenaCarro = (arv) => {
      cena(null); if (arv) { trees.push({ x: 650, y: 600, hp: 5, t: 0, type: 0, seed: 1, h: 1 }); rebuildSolidGrid(); }
      const v = { id: 1, x: 600, y: 600, w: 36, h: 20, col: '#c33', looted: true, spd: 0, face: 0, hp: 100, maxHp: 100 };
      vehicles.push(v); P.inVehicle = v; P.torch = false; P.flashOn = false;
      for (let i = 0; i < 5; i++) update(.05); for (let k = 0; k < 3; k++) render();
    };
    cenaCarro(false); o.carroLivre = lum(672, 600); o.carroVisLivre = !vehicles[0]._vis && !vehicles[0]._occ;
    cenaCarro(true); o.carroArvore = lum(672, 600); o.carroFrente = lum(628, 600); o.carroVis = !!vehicles[0]._occ;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.arvore.vis && r.semVis, 'lanterna: o poligono de sombra so e usado quando algo atrapalha (' + r.semVis + ')');
  ok(r.arvore.atras < r.livre.atras * .55, 'lanterna: atras da arvore fica escuro (' + Math.round(r.arvore.atras) + ' vs ' + Math.round(r.livre.atras) + ' sem arvore)');
  ok(r.arvore.lado > r.livre.lado * .8, 'lanterna: ao lado da arvore continua iluminado (' + Math.round(r.arvore.lado) + ' vs ' + Math.round(r.livre.lado) + ')');
  ok(r.arvore.frente > r.livre.frente * .85, 'lanterna: a frente da arvore continua iluminada (' + Math.round(r.arvore.frente) + ' vs ' + Math.round(r.livre.frente) + ')');
  ok(r.pedra.vis && r.pedra.atras < r.livre.atras * .55, 'lanterna: pedra tambem faz sombra (' + Math.round(r.pedra.atras) + ')');
  ok(r.carro < r.livre.atras * .55, 'lanterna: carro faz sombra (' + Math.round(r.carro) + ')');
  ok(r.poste < r.livre.atras * .9 && r.posteLado > r.livre.lado * .8, 'lanterna: poste faz sombra fina, o lado segue claro (' + Math.round(r.poste) + ')');
  ok(r.barraca < r.livre.atras * .55, 'lanterna: barraca faz sombra (' + Math.round(r.barraca) + ')');
  ok(r.zumbi < r.livre.atras * .7 && r.zumbiLado > 0, 'lanterna: o corpo de um zumbi faz sombra (' + Math.round(r.zumbi) + ' vs ' + Math.round(r.livre.atras) + ')');
  ok(r.lobo < r.loboLivre * .7, 'lanterna: animal tambem faz sombra (' + Math.round(r.lobo) + ')');
  ok(r.parede && r.paredeMin < 60, 'parede corta o feixe: a luz nao atravessa o predio (alcance ' + Math.round(r.paredeMin) + ' de 170)');
  ok(r.carroVisLivre && r.carroVis, 'farol: sombra so quando ha obstaculo');
  ok(r.carroArvore < r.carroLivre * .6, 'farol: atras da arvore fica escuro (' + Math.round(r.carroArvore) + ' vs ' + Math.round(r.carroLivre) + ' sem arvore)');
  ok(r.carroFrente > 0, 'farol: a frente da arvore segue iluminada (' + Math.round(r.carroFrente) + ')');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
