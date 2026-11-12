/* Katana: icone 14x14 (lamina curva, habaki, tsuba, cabo) e sprite na mao na horizontal usam so cores da paleta, tem lamina de fio unico com ponta,
   e o desenho na mao/no chao/no inventario nao da erro nas 4 direcoes. Uso: node tests/teste-katana.js [caminho/index.html] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); zombies = []; animals = []; items.length = 0; state = 'play';
    const o = {};
    for (const n of ['katana', 'katana_h']) { const g = PXG[n]; o[n] = { h: g.length, w: Math.max(...g.map(r => r.length)), bad: g.join('').split('').filter(c => c !== '.' && !PXPAL[c]).length, px: g.join('').replace(/\./g, '').length }; }
    o.cores = ['Y', 'S', 'W', 'K'].every(c => PXG.katana.join('').includes(c));   // habaki dourado, aco, fio claro, cabo/tsuba escuros
    P.meleeWeapons = ['katana']; P.melee = 'katana'; P.weapon = 'katana'; items.push({ t: 'katana', x: P.x + 40, y: P.y + 20 });
    let erro = null; try { for (const f of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { P.face = f; update(.05); render(); if (window.attack) { attack(); update(.05); render(); } } } catch (e) { erro = e.message; }
    o.erro = erro; o.heldIc = HELD.katana.ic; o.icon = pxIcon('katana', 2).length > 50;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.katana.h === 14 && r.katana.w === 14, 'icone da katana 14x14');
  ok(r.katana.bad === 0 && r.katana_h.bad === 0, 'so cores da paleta');
  ok(r.cores, 'tem habaki dourado, lamina de aco, fio claro e cabo escuro');
  ok(r.katana_h.w >= 20 && r.katana_h.h <= 9, 'sprite na mao e comprido e fino (' + r.katana_h.w + 'x' + r.katana_h.h + ')');
  ok(r.heldIc === 'katana_h' && r.icon, 'na mao usa o sprite horizontal; inventario usa o icone');
  ok(!r.erro, 'desenha nas 4 direcoes sem erro ' + (r.erro || ''));
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
