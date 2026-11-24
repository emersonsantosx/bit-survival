/* Arsenal de armas (botao de trocar arma): mesmo visual do inventario e do crafting, so aparencia.
   - painel e opcoes quadrados (sem arredondado, sem brilho), borda grossa, sombra dura embaixo, fonte pixel;
   - a arma equipada fica em verde-musgo; a dica de fora do painel nao aparece (so a de dentro);
   - tocar numa arma ainda equipa e fecha o arsenal; sem erros de JS.
   Uso: node tests/teste-arsenal-visual.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(400);
  await pg.evaluate(() => {
    localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame();
    P.meleeWeapons = ['bat', 'axe', 'katana']; P.firearms = { pistol: {}, rifle: {} }; P.weapon = 'katana';
    document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true); openWeaponWheel();
  });
  await pg.waitForTimeout(300);
  const v = await pg.evaluate(() => {
    const cs = (s, e) => getComputedStyle(e || document.querySelector(s)), px = x => parseFloat(x);
    const ring = document.getElementById('weapon-wheel-ring'), opt = document.querySelector('.weapon-option:not(.selected)'), sel = document.querySelector('.weapon-option.selected');
    const rc = cs(0, ring), oc = cs(0, opt), sc = cs(0, sel);
    const hints = [...document.querySelectorAll('#weapon-wheel-hint')].map(h => getComputedStyle(h).display);
    return {
      n: document.querySelectorAll('.weapon-option').length, selKey: sel && sel.dataset.weapon,
      ringRad: rc.borderTopLeftRadius, ringBw: px(rc.borderTopWidth), ringShadow: rc.boxShadow, ringBg: rc.backgroundColor,
      optRad: oc.borderTopLeftRadius, optBw: px(oc.borderTopWidth), optShadow: oc.boxShadow, optFont: oc.fontFamily, optBg: oc.backgroundColor,
      selBorder: sc.borderTopColor, selBg: sc.backgroundColor, title: getComputedStyle(document.getElementById('weapon-wheel-title')).fontFamily,
      hints, visibleHints: hints.filter(d => d !== 'none').length, panelVar: getComputedStyle(document.getElementById('weapon-wheel')).getPropertyValue('--c-panel').trim()
    };
  });
  ok(v.n === 6, 'arsenal lista as 6 armas (' + v.n + ')');
  ok(v.ringRad === '0px' && v.optRad === '0px', 'painel e opcoes quadrados (sem canto arredondado)');
  ok(v.ringBw >= 3 && v.optBw >= 3, 'borda grossa (3 px de arte) igual a do inventario');
  ok(/rgb\(12, 14, 18\) 0px 3px 0px 0px|0px 3px 0px/.test(v.ringShadow) && /0px 3px 0px/.test(v.optShadow), 'sombra dura embaixo (sem brilho nem desfoque)');
  ok(v.optFont.indexOf('Press Start 2P') >= 0 && v.title.indexOf('Press Start 2P') >= 0, 'textos na fonte pixel');
  ok(v.panelVar === '#1f242c' && v.optBg === 'rgb(31, 36, 44)', 'fundo das opcoes = painel do inventario (#1f242c)');
  ok(v.selKey === 'katana' && v.selBg === 'rgb(35, 43, 34)' && v.selBorder === 'rgb(141, 165, 104)', 'arma equipada em verde-musgo (mesmo estado .sel do inventario)');
  ok(v.visibleHints === 1, 'so uma dica visivel (a de dentro do painel)');
  /* continua funcionando: tocar equipa e fecha */
  const r = await pg.evaluate(() => { const e = document.querySelector('.weapon-option[data-weapon="pistol"]').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 }; });
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); await pg.waitForTimeout(80);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => P.weapon === 'pistol'), 'toque curto equipa a arma');
  ok(await pg.evaluate(() => document.getElementById('weapon-wheel').classList.contains('hide')), 'o arsenal fecha ao equipar');
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
