/* Conquistas e objetivos por mapa: cada mapa tem os seus 4 objetivos, o progresso conta so no mapa em que foi feito, a conquista dispara ao bater a meta,
   as de varios mapas (Mochileiro, Dominador, Mestre dos Biomas) se resolvem sozinhas, salva e a tela mostra os grupos.
   Uso: node tests/teste-conquistas-mapas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  await pg.evaluate(() => { localStorage.clear(); });
  await pg.reload(); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.setTimeout = (f) => f();   // toast/chime na hora
    const o = {}; const per = {};
    for (const m of ACH_MAPS) per[m] = ACH.filter(a => a[5] === m).length;
    o.per = per;
    selectedMap = 'snow';
    achStat('kill', 39); o.s39 = !!ACHD.u.s_kill; o.cD = ACHD.s['kill@desert'] || 0;
    achStat('kill', 1); o.s40 = !!ACHD.u.s_kill; o.c60 = !!ACHD.u.c_kill; o.d40 = !!ACHD.u.d_kill;
    selectedMap = 'desert'; achStat('kill', 40); o.d40b = !!ACHD.u.d_kill; o.sNow = ACHD.s['kill@snow'];
    o.total = ACHD.s.kill;
    // dia por mapa e Mochileiro
    for (const m of ['forest', 'snow', 'desert']) { selectedMap = m; achSet('maxDay', 3); }
    o.b3 = !!ACHD.u.biomes; selectedMap = 'city'; achSet('maxDay', 3); o.b4 = !!ACHD.u.biomes;
    // todos os objetivos de um mapa => Dominador
    selectedMap = 'forest'; achSet('maxDay', 7); achStat('fish', 10); achStat('get_wood', 100); o.d0 = !!ACHD.u.mapdone1; achStat('killAnimal', 10);
    o.forestAll = ACH.filter(a => a[5] === 'forest').every(a => ACHD.u[a[0]]); o.d1 = !!ACHD.u.mapdone1; o.m4 = !!ACHD.u.mapdone4;
    // salva
    const saved = JSON.parse(localStorage.minisurv_ach); o.savedU = !!saved.u.f_day7 && saved.s['kill@snow'] === 40;
    return o;
  });
  ok(Object.values(r.per).every(n => n === 4) && Object.keys(r.per).length === 4, 'cada um dos 4 mapas tem 4 objetivos ' + JSON.stringify(r.per));
  ok(!r.s39 && r.s40 && r.cD === 0, 'objetivo da Neve dispara ao bater a meta (39 nao, 40 sim) e nao conta nos outros mapas');
  ok(!r.c60 && !r.d40 && r.d40b && r.sNow === 40 && r.total === 80, 'o progresso fica separado por mapa e o total geral soma tudo (' + r.total + ')');
  ok(!r.b3 && r.b4, 'Mochileiro so com dia 3 nos 4 mapas');
  ok(!r.d0 && r.forestAll && r.d1 && !r.m4, 'concluir os 4 objetivos da Floresta libera Dominador (e ainda nao o Mestre dos Biomas)');
  ok(r.savedU, 'conquistas e progresso por mapa ficam salvos');
  await pg.reload(); await pg.waitForTimeout(300);
  await pg.evaluate(() => { selectedMap = 'desert'; });
  await pg.click('#btnAch');
  const ui = await pg.evaluate(() => ({ heads: [...document.querySelectorAll('#achList .ach-h span')].map(e => e.textContent), rows: document.querySelectorAll('#achList .ach-row').length, sum: document.getElementById('achSum').textContent, firstMap: document.querySelectorAll('#achList .ach-h span')[1].textContent }));
  ok(ui.heads.length === 5 && ui.heads[0] === 'GERAIS' && ui.rows === ACHLEN(ui), 'tela mostra GERAIS + 4 mapas (' + ui.heads.join(' | ') + ')');
  ok(ui.firstMap === 'OBJETIVOS: DESERTO', 'o mapa atual aparece primeiro depois das gerais');
  ok(/\d+ \/ 39 DESBLOQUEADAS/.test(ui.sum), 'contador total (' + ui.sum + ')');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  function ACHLEN(u) { return u.rows; }
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
