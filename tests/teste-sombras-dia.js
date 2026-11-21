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
    const marca = () => { for (const k in TSP) { if (TSP[k].sh) TSP[k].sh.__sil = 1; if (TSP[k].shs) TSP[k].shs.cv.__sil = 1; } };   // a silhueta esticada fica em cache (shs) e e ela que vai para a tela
    const mede = () => { render(); marca(); sil = 0; render(); return sil; };
    hora(12); o.fMeio = SUN.f; const treeS = treeSprite(0, 0, false); treeShadow(100, 100, treeS); o.silCache = !!treeS.sh;
    o.silMeio = mede();
    hora(9); o.fManha = SUN.f; o.axManha = SUN.ax; hora(16.5); o.axTarde = SUN.ax;
    hora(19.4); o.fPoente = SUN.f;
    hora(23); o.fNoite = SUN.f; o.silNoite = mede();
    hora(3); o.fMadrugada = SUN.f;
    // arco do sol: gira sempre na mesma velocidade, nunca vira ponto ao meio-dia e a troca sol para lua e invisivel
    const amostra = h => { weather = 'none'; hora(h); const v = Math.hypot(SUN.ax, SUN.by); return { v, a: SUN.a, ang: Math.atan2(SUN.by, SUN.ax) }; };
    const dia = []; for (let h = 6; h <= 19; h += .5) dia.push(Object.assign({ h }, amostra(h)));
    o.noon = amostra(12); o.manha = amostra(7); o.tarde = amostra(18);
    o.poenteA = amostra(19.45).a; o.nasceA = amostra(5.55).a; o.noiteA = amostra(23).a; o.noonA = amostra(12).a;
    let salto = 0, aMaxSalto = 0; for (let i = 1; i < dia.length; i++) { salto = Math.max(salto, Math.abs(dia[i].ang - dia[i - 1].ang)); aMaxSalto = Math.max(aMaxSalto, Math.abs(dia[i].a - dia[i - 1].a)); }
    o.salto = salto; o.aSalto = aMaxSalto;
    let dxFlip = 0; { let prev = null; for (let h = 19; h <= 20; h += .02) { hora(h); const cur = [SUN.dx, SUN.a]; if (prev) { const dd = Math.abs(cur[0] - prev[0]); if (dd > .05) dxFlip = Math.max(dxFlip, Math.min(cur[1], prev[1])); } prev = cur; } }   // maior alfa visivel num instante em que a direcao mudou de uma vez
    o.flipAlfa = dxFlip;
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
  ok(r.noon.v > .25 * r.manha.v, 'ao meio-dia a sombra nao vira ponto (' + r.noon.v.toFixed(2) + ' contra ' + r.manha.v.toFixed(2) + ' de manha)');
  ok(Math.abs(r.manha.v - r.tarde.v) / r.manha.v < .15, 'manha e tarde simetricas (' + r.manha.v.toFixed(2) + ' / ' + r.tarde.v.toFixed(2) + ')');
  ok(r.salto < .5, 'a direcao da sombra anda sem saltos durante o dia (maior passo de 30 min: ' + (r.salto * 57.3).toFixed(0) + ' graus)');
  ok(r.poenteA < .02 && r.nasceA < .02 && r.noonA > .25, 'a sombra some no horizonte e fica forte ao meio-dia (poente ' + r.poenteA.toFixed(3) + ', nascer ' + r.nasceA.toFixed(3) + ', meio-dia ' + r.noonA.toFixed(2) + ')');
  ok(r.flipAlfa < .02, 'a troca de lado entre sol e lua acontece com a sombra invisivel (alfa ' + r.flipAlfa.toFixed(3) + ')');
  ok(r.fills <= 4, 'pessoa e carro usam poucos desenhos (' + r.fills + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
