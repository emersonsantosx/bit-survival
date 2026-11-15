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
    const pts = { esq: [438, 341], dir: [462, 341], baixo: [450, 341] };
    const med = (hr, obst) => { cena(hr, null); const a = {}; for (const k in pts) a[k] = lum(...pts[k]);
      cena(hr, obst); const c = {}; for (const k in pts) c[k] = a[k] - lum(...pts[k]); return c; };   // escurecimento causado pelo objeto
    o.manha = med(7, 'arvore'); o.meio = med(12, 'arvore'); o.tarde = med(17, 'arvore');
    const lin = (hr, obst) => { cena(hr, null); const sx = SUN.sx, sy = SUN.sy, p = [450 + sx * 14, 330 + sy * 14], q = [450 - sx * 14, 330 - sy * 14];
      const a = lum(...p), a2 = lum(...q); cena(hr, obst); return { sombra: a - lum(...p), oposto: a2 - lum(...q) }; };   // ao longo da direcao da sombra e do lado contrario
    o.posteManha = lin(7, 'poste'); o.posteTarde = lin(17, 'poste');
    cena(7, 'arvore'); o.bid7 = SUN.bid; cena(17, 'arvore'); o.bid17 = SUN.bid;
    o.sx7 = (cena(7, null), SUN.sx); o.sx17 = (cena(17, null), SUN.sx); o.sx12 = (cena(12, null), SUN.sx);
    o.len12 = (cena(12, null), SUN.len); o.len17 = (cena(17, null), SUN.len);
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.sx7 < -.5 && r.sx17 > .5 && Math.abs(r.sx12) < .2, 'a direcao da sombra gira: manha para a esquerda (' + r.sx7.toFixed(2) + '), meio-dia ~0 (' + r.sx12.toFixed(2) + '), tarde para a direita (' + r.sx17.toFixed(2) + ')');
  ok(r.len17 > r.len12 * 1.5, 'a sombra e mais longa no fim da tarde que ao meio-dia (' + r.len17.toFixed(2) + ' vs ' + r.len12.toFixed(2) + ')');
  ok(r.manha.esq > 12 && r.manha.esq > r.manha.dir * 2, 'arvore de manha: sombra cai para a esquerda (' + Math.round(r.manha.esq) + ' vs ' + Math.round(r.manha.dir) + ')');
  ok(r.tarde.dir > 12 && r.tarde.dir > r.tarde.esq * 2, 'arvore a tarde: sombra cai para a direita (' + Math.round(r.tarde.dir) + ' vs ' + Math.round(r.tarde.esq) + ')');
  ok(r.meio.baixo + r.meio.esq > 3 && r.meio.dir < 3, 'arvore ao meio-dia: sombra curta, quase embaixo da copa (' + Math.round(r.meio.baixo) + ' / ' + Math.round(r.meio.esq) + ')');
  ok(r.posteManha.sombra > 1.5 && r.posteTarde.sombra > 1.5 && r.posteManha.oposto < 1 && r.posteTarde.oposto < 1, 'poste projeta um traco so no lado oposto ao sol (' + Math.round(r.posteManha.sombra) + ' / ' + Math.round(r.posteTarde.sombra) + ')');
  ok(r.bid7 !== r.bid17, 'o desenho pronto das sombras e refeito quando o angulo muda');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
