/* Clima gradual: chega aos poucos, fica e vai passando (gotas, flocos, areia, poças, efeitos no jogo), com o ponto atual no save e no
   multiplayer; e a floresta sem ilhota no lago (nos outros mapas as ilhas continuam). Uso: node tests/teste-clima-gradual.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const [mapa, tipo] of [['forest', 'rain'], ['city', 'rain'], ['snow', 'snow'], ['desert', 'sand']]) {
    const r = await pg.evaluate(([mapa, tipo]) => {
      const o = {}, R0 = weatherRoll;
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = mapa; startGame(); zombies.length = 0; state = 'play';
      weather = 'none'; weatherTimer = .01; WX.wet = 0; WX.snow = 0; weatherParticles.length = 0;
      weatherRoll = () => ({ w: tipo, dur: 200, k: 1 });
      const anda = s => { for (let i = 0; i < s * 10; i++) { P.hp = 100; P.dead = false; zombies.length = 0; update(.1); } };
      const foto = () => ({ f: +wxAmt().toFixed(2), n: weatherParticles.length });
      anda(.1); weatherRoll = () => ({ w: 'none', dur: 200, k: 1 }); o.inicio = foto(); o.aviso = $('toast').textContent;
      anda(3); o.a3 = foto(); anda(27); o.a30 = foto(); anda(40); o.a70 = foto();
      // save e multiplayer no meio do caminho
      weatherTimer = 25; anda(.1); o.fim25 = foto(); saveGame(); const raw = Object.keys(localStorage).filter(k => /^minisurv_save_/.test(k)).map(k => JSON.parse(localStorage[k]))[0]; o.save = raw.wf;
      wxF = 1; restoreWorldState(raw); o.carrega = wxF;
      weather = tipo; weatherTimer = 25; wxF = .5; anda(20); o.fim5 = foto(); anda(6); o.limpo = weather === 'none' && wxAmt() === 0; o.avisoFim = $('toast').textContent;
      // ilhas: o desenho do lago nao muda com ou sem elas
      const l = lakes.find(q => !q.fountain);
      if (l) { l.islands = [{ x: l.cx + 7, y: l.cy + 11, r: 18 }]; const e = ctx.ellipse; let n = 0; ctx.ellipse = function (x, y, ...q) { if (Math.abs(x - l.cx - 7) < 3 && Math.abs(y - l.cy - 11) < 3) n++; return e.call(this, x, y, ...q); }; drawLake(l); ctx.ellipse = e; o.ilha = mapa === 'forest' ? n === 0 : n > 0; } else o.ilha = mapa !== 'forest' && mapa !== 'snow';
      weatherRoll = R0;
      return o;
    }, [mapa, tipo]);
    ok(r.inicio.f < .05 && r.a3.f < .1 && r.a30.f > .4 && r.a30.f < .6 && r.a70.f === 1, mapa + ': chega aos poucos (' + [r.inicio.f, r.a3.f, r.a30.f, r.a70.f].join(' > ') + ')');
    ok(r.a3.n < r.a30.n && r.a30.n < r.a70.n, mapa + ': gotas, flocos ou areia aumentam junto (' + [r.a3.n, r.a30.n, r.a70.n].join(' > ') + ')');
    ok(r.fim25.f <= .5 && r.fim5.f <= .12 && r.limpo && /Clima limpo/.test(r.avisoFim), mapa + ': vai passando antes de limpar (' + r.fim25.f + ' > ' + r.fim5.f + ')');
    ok(r.save > 0 && r.save <= .5 && r.carrega === r.save, mapa + ': o save guarda o ponto do clima (' + r.save + ')');
    ok(r.ilha, mapa + (mapa === 'forest' ? ': lago sem ilhota' : ': ilhas do lago mantidas'));
  }
  const m = await pg.evaluate(() => { MP.active = true; MP.isHost = false; weather = 'none'; applySnapshot({ weather: 'rain', weatherTimer: 150, wk: 1, wf: .2 }); const a = wxF; applySnapshot({ weather: 'rain', weatherTimer: 140, wk: 1, wf: .35 }); return [a, wxF]; });
  ok(m[0] === .2 && m[1] === .35, 'convidado segue o ponto do clima do host (' + m.join(' > ') + ')');
  ok(!errs.length, 'sem erros ' + errs.join(' | '));
  await b.close(); process.exit(bad ? 1 : 0);
})();
