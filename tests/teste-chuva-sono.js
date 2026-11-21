/* O clima nao depende do sono: dormir nao apaga a chuva (nem faz chover); a noite pulada conta no relogio do clima,
   sorteando as mesmas rodadas de sempre. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {}, R0 = Math.random;
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    zombies.length = 0; P.dead = false; P.hp = 100; dark = 0;
    const dormir = () => { const t0 = T; sleepDo(); return T - t0; };
    const montaBase = () => { T = (21 - START_HOUR) * DAY_SECONDS / 24; };   // 21h: sleepDo pula 9 horas ate as 6h
    // 1) chovendo, sem rodada de sorteio no meio da noite: continua chovendo e o relogio do clima anda
    weather = 'rain'; setRain(true); weatherTimer = 10000; montaBase(); let skip = dormir();
    o.chuva1 = weather; o.skip1 = skip; o.timer1 = weatherTimer; o.sleepAcabou = true;
    // 2) sem chuva: dormir nao faz chover
    weather = 'none'; setRain(false); weatherTimer = 10000; montaBase(); dormir(); o.seco = weather;
    // 3) o timer vence durante a noite: sorteia de novo (sorteio baixo = limpo, alto = chuva), sem olhar para o sono
    weather = 'rain'; setRain(true); weatherTimer = 5; montaBase(); Math.random = () => .1; dormir(); o.limpou = weather;
    weather = 'none'; weatherTimer = 5; montaBase(); Math.random = () => .9; dormir(); o.choveu = weather; Math.random = R0;
    // 4) varias rodadas pulam sem quebrar (timer sempre positivo)
    weather = 'rain'; weatherTimer = 1; montaBase(); dormir(); o.timer4 = weatherTimer;
    return o;
  });
  ok(r.chuva1 === 'rain' && r.sleepAcabou, 'chovendo ao dormir: continua chovendo ao acordar');
  ok(Math.abs(r.timer1 - (10000 - r.skip1)) < 0.5 && r.skip1 > 100, 'o relogio do clima andou a noite dormida (' + r.skip1.toFixed(0) + ' s)');
  ok(r.seco === 'none', 'sem chuva ao dormir: nao passa a chover');
  ok(r.limpou === 'none' && r.choveu === 'rain', 'se o timer vence na noite o clima e sorteado de novo (limpou ' + r.limpou + ', choveu ' + r.choveu + ')');
  ok(r.timer4 > 0, 'timer do clima segue positivo depois de varias rodadas (' + r.timer4.toFixed(0) + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
