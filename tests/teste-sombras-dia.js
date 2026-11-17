/* Sombras que seguem a forma (arvores, pessoas, veiculos) em qualquer hora, inclusive de noite. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    zombies.length = 0; weatherTimer = 99999; P.dead = false; P.hp = 100;
    const hora = h => { T = ((h - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 12; i++) { update(.03); render(); } };
    const DI = CanvasRenderingContext2D.prototype.drawImage; let sil = 0;
    CanvasRenderingContext2D.prototype.drawImage = function (im) { if (im && im.__sil) sil++; return DI.apply(this, arguments); };
    const marca = () => { for (const k in TSP) if (TSP[k].sh) TSP[k].sh.__sil = 1; };
    const mede = () => { render(); marca(); sil = 0; render(); return sil; };
    hora(12); o.fMeio = SUN.f; const treeS = treeSprite(0, 0, false); treeShadow(100, 100, treeS); o.silCache = !!treeS.sh;
    o.silMeio = mede();
    hora(9); o.fManha = SUN.f; o.axManha = SUN.ax; hora(16.5); o.axTarde = SUN.ax;
    hora(19.4); o.fPoente = SUN.f;
    hora(23); o.fNoite = SUN.f; o.silNoite = mede();
    hora(3); o.fMadrugada = SUN.f;
    // sombras de pessoa e de veiculo desenham sem erro e escurecem so um pouco (um caminho unico, sem escurecer em dobro)
    hora(15); let n = 0; const f0 = ctx.fill; ctx.fill = function () { n++; return f0.apply(this, arguments); }; ctx.beginPath(); shadowBody(50, 50, 17, 4.2); shadowCar({ x: 60, y: 60, face: .5 }, 36, 20); ctx.fill = f0; o.fills = n;
    CanvasRenderingContext2D.prototype.drawImage = DI;
    return o;
  });
  ok(r.fMeio > .9, 'meio-dia: sombras seguem a forma (f=' + r.fMeio.toFixed(2) + ')');
  ok(r.silCache, 'a silhueta da arvore e criada uma vez e guardada');
  ok(r.silMeio > 0, 'de dia as arvores desenham a silhueta (' + r.silMeio + ')');
  ok(r.axManha * r.axTarde < 0, 'a sombra troca de lado entre manha e tarde (' + r.axManha.toFixed(2) + ' / ' + r.axTarde.toFixed(2) + ')');
  ok(r.fPoente === 1, 'ao poente a sombra continua seguindo a forma (f=' + r.fPoente.toFixed(2) + ')');
  ok(r.fNoite === 1 && r.fMadrugada === 1 && r.silNoite > 0, 'de noite as sombras tambem seguem a forma (f=' + r.fNoite + ', silhuetas ' + r.silNoite + ')');
  ok(r.fills <= 4, 'pessoa e carro usam poucos desenhos (' + r.fills + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
