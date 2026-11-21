/* Clima aleatorio: cada rodada tem chance, duracao e intensidade proprias; o tipo respeita o mapa; a intensidade muda a densidade
   de gotas e flocos; vai no save e no snapshot do multiplayer. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = { mapas: {} };
    for (const m of ['forest', 'city', 'desert', 'snow']) {
      selectedMap = m; const N = 20000; let ruim = 0, tipos = new Set(), dmin = 1e9, dmax = 0, ks = [], kClaro = true, durs = new Set(), somaD = 0, somaD2 = 0;
      for (let i = 0; i < N; i++) { const x = weatherRoll(Math.random); tipos.add(x.w); if (x.w !== 'none') { ruim++; ks.push(x.k); } else if (x.k !== 1) kClaro = false; dmin = Math.min(dmin, x.dur); dmax = Math.max(dmax, x.dur); durs.add(Math.round(x.dur)); somaD += x.dur; somaD2 += x.dur * x.dur; }
      const md = somaD / N;
      o.mapas[m] = { ruim: ruim / N, tipos: [...tipos].sort().join(','), dmin, dmax, kmin: Math.min(...ks), kmax: Math.max(...ks), kClaro, durs: durs.size, desvio: Math.sqrt(somaD2 / N - md * md) };
    }
    // intensidade muda a densidade de gotas
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; newGame(); showScreen(null); state = 'play'; zombies.length = 0; P.dead = false; P.hp = 100;
    const dens = k => { weather = 'rain'; weatherK = k; weatherTimer = 99999; weatherParticles.length = 0; weatherAcc = 0; let s = 0; for (let i = 0; i < 240; i++) { update(1 / 60); if (i > 120) s += weatherParticles.length; } return s / 119; };
    o.fraca = dens(.5); o.forte = dens(1.5);
    // newGame volta a intensidade normal
    weatherK = 1.4; newGame(); o.kNovo = weatherK;
    // save guarda a intensidade
    showScreen(null); state = 'play'; weatherK = 1.3; saveGame(); const raw = Object.keys(localStorage).filter(k => /^minisurv_save_/.test(k)).map(k => JSON.parse(localStorage[k]).wk); o.wkSave = raw[0];
    return o;
  });
  for (const m in r.mapas) {
    const x = r.mapas[m], tipoOk = m === 'desert' ? x.tipos === 'none,sand' : m === 'snow' ? x.tipos === 'none,snow' : x.tipos === 'none,rain';
    ok(tipoOk, m + ': so os climas do mapa (' + x.tipos + ')');
    const alvo = { forest: .35, city: .35, desert: .3, snow: .55 }[m];
    ok(Math.abs(x.ruim - alvo) < .06, m + ': chance media de tempo ruim parecida com a de antes (' + (x.ruim * 100).toFixed(0) + '% contra ' + alvo * 100 + '%)');
    ok(x.dmin >= 40 && x.dmax <= 300 && x.desvio > 40 && x.durs > 150, m + ': duracoes bem espalhadas (' + x.dmin.toFixed(0) + ' a ' + x.dmax.toFixed(0) + ' s, desvio ' + x.desvio.toFixed(0) + ', ' + x.durs + ' valores)');
    ok(x.kmin >= .5 && x.kmax <= 1.5 && x.kmax - x.kmin > .9 && x.kClaro, m + ': intensidade de ' + x.kmin.toFixed(2) + ' a ' + x.kmax.toFixed(2) + ' so no tempo ruim');
  }
  ok(r.forte > r.fraca * 1.8, 'chuva forte tem bem mais gotas que garoa (' + r.fraca.toFixed(0) + ' contra ' + r.forte.toFixed(0) + ')');
  ok(r.kNovo === 1, 'jogo novo volta a intensidade normal');
  ok(r.wkSave === 1.3, 'o save guarda a intensidade do clima (' + r.wkSave + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
