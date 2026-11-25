/* A linha da vara de pesca sai da ponta da vara: sentado no tronco o corpo desce 3 px (o.sit em human()) e a linha desce junto;
   olhando para a esquerda a vara e espelhada (meleeLeft), entao a ponta fica do lado esquerdo e na altura da mao.
   Uso: node tests/teste-linha-vara.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); state = 'play';
    const pts = []; const mt = ctx.moveTo; ctx.moveTo = function (x, y) { pts.push([x, y]); return mt.apply(this, arguments); };
    const tip = (face, sit) => { pts.length = 0; drawFishLine(100, 100, face, 100 + Math.cos(face) * 30, 100 + Math.sin(face) * 30, 5, false, sit); return pts[0]; };
    const o = {};
    for (const [n, f] of [['dir', 0], ['esq', Math.PI], ['baixo', Math.PI / 2], ['cima', -Math.PI / 2]]) { const a = tip(f, false), s = tip(f, true); o[n] = { a, s }; }
    ctx.moveTo = mt; return o;
  });
  for (const n of ['dir', 'esq', 'baixo', 'cima']) ok(Math.abs(r[n].s[1] - r[n].a[1] - 3) < 1e-6 && r[n].s[0] === r[n].a[0], 'sentado a linha desce 3 px sem sair do lugar na horizontal (' + n + ')');
  ok(r.esq.a[0] < 100 - 8 && r.dir.a[0] > 100 + 8, 'a ponta fica do lado para onde o personagem olha');
  ok(Math.abs(r.esq.a[1] - (100 - 6)) <= 2 && Math.abs(r.dir.a[1] - (100 - 6)) <= 2, 'olhando de lado a ponta fica na altura da mao (nao 2 px acima, como era a esquerda)');
  ok(errs.length === 0, 'sem erros de JS');
  await b.close(); if (bad) { console.log(bad + ' falhou'); process.exit(1); } console.log('Todos os testes passaram');
})();
