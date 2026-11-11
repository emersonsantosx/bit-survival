/* Escala da interface igual em qualquer celular. O CSS foi desenhado para ~411 px de altura (S21 FE). Aparelho com mais px CSS na mesma tela fisica
   (Redmi com densidade menor, por exemplo) tem que cair no MESMO layout compacto e com os mesmos tamanhos fisicos, inclusive o que e desenhado no
   canvas (marcador de item, setas de aviso, joystick), que antes ficava gigante porque o canvas e esticado d vezes.
   Uso: node tests/teste-escala-ui.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (Linux; Android 14; 24115RA8EG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const medir = async (w, h, dpr) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: UA });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://' + file); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => {
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); zombies = []; animals = [];
      document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true);
      const cls = document.documentElement.className.split(/\s+/).filter(x => /^(land|port|hle|wle)/.test(x)).sort();
      const pick = document.getElementById('pick').getBoundingClientRect();
      const css = getComputedStyle(document.documentElement).getPropertyValue('--ui').trim();
      // marcador de item: raio em px de CSS (canvas px * px de CSS por px de canvas)
      items.push({ t: 'wood', x: P.x + 8, y: P.y + 10 });
      MP.active = true; MP.connected = true; MP.conn = { open: true, send() {} };
      const errs0 = []; window.__e0 = errs0; let rad = null; const g = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r, a, b2, c) { if (r === 11 && a === 0) rad = this.getTransform().a; return g.call(this, x, y, r, a, b2, c); };
      try { update(.05); render(); } catch (e) { errs0.push(e.message); }
      CanvasRenderingContext2D.prototype.arc = g;
      return { UIS, css: +css, cls, pickW: pick.width, d: dispW / W, JRcss: JR * dispW / W, badgeCss: rad == null ? null : 11 * rad * dispW / W, dispW, dispH };
    });
    r.errs = errs; await ctx.close(); return r;
  };
  const a = await medir(891, 411, 2.625);   // S21 FE: referencia
  const c = await medir(1200, 540, 2);      // mesma tela fisica, mais px de CSS (d=3)
  const e = await medir(2400, 1080, 1);     // pior caso: densidade 1
  const f = await medir(780, 360, 2);       // celular pequeno: nao muda
  ok(a.UIS === 1 && a.css === 1, 'S21 FE (411 px): escala 1, nada muda');
  ok(f.UIS === 1, 'celular menor que a referencia: escala 1');
  ok(c.UIS > 1.25 && c.UIS < 1.4 && c.css === c.UIS, 'tela com 540 px de altura: escala ' + c.UIS);
  ok(e.UIS === 1.6, 'tela gigante em px de CSS: escala limitada a 1.6 (' + e.UIS + ')');
  ok(JSON.stringify(a.cls.filter(x => x !== 'hle420')) === JSON.stringify(c.cls.filter(x => x !== 'hle420')) && c.cls.includes('hle420') === a.cls.includes('hle420'),
    'aparelho maior cai no mesmo layout compacto do S21 (' + a.cls.join(' ') + ' | ' + c.cls.join(' ') + ')');
  ok(Math.abs(c.pickW / a.pickW - c.UIS) < .06, 'botao de interagir cresce na mesma proporcao da escala (' + a.pickW + ' -> ' + c.pickW + ')');
  ok(Math.abs(a.JRcss - 48) < 1 && Math.abs(c.JRcss - 48 * c.UIS) < 2 * c.d, 'joystick tem o mesmo tamanho fisico (' + a.JRcss + ' / ' + c.JRcss.toFixed(1) + ')');
  ok(a.badgeCss != null && c.badgeCss != null && Math.abs(a.badgeCss - 11) < .5 && Math.abs(c.badgeCss - 11 * c.UIS) < .8, 'marcador de item NAO fica gigante (' + a.badgeCss + ' / ' + (c.badgeCss && c.badgeCss.toFixed(1)) + ' px de CSS; antes ' + (11 * c.d).toFixed(0) + ')');
  ok(!a.errs.length && !c.errs.length && !e.errs.length, 'sem erros de script');
  // girar o celular: classes e escala acompanham
  const ctx = await b.newContext({ viewport: { width: 1200, height: 540 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
  const pg = await ctx.newPage(); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  await pg.setViewportSize({ width: 540, height: 1200 }); await pg.waitForTimeout(300);
  const rot = await pg.evaluate(() => document.documentElement.className);
  ok(/\bport\b/.test(rot) && !/\bland\b/.test(rot), 'ao girar para retrato a classe muda (' + rot.trim() + ')');
  await ctx.close();
  await b.close(); process.exit(bad ? 1 : 0);
})();
