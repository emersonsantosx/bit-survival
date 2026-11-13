/* Vaga-lumes: pontinhos amarelos suaves que piscam devagar, vagam em curvas e entram/saem com fade.
   Confere: so aparecem na floresta, de noite e sem chuva; nunca nascem dentro de casa; brilho sobe e desce (nao fica sempre aceso nem sempre apagado);
   nascem apagados (sem clarao de surgimento); somem quando amanhece; o desenho nao gera erro. Cosmetico: nao mexe no mundo.
   Uso: node tests/teste-vagalumes.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage();
  pg.on('pageerror', e => { console.log('ERRO', e.message); bad++; });
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const noite = (m) => pg.evaluate((m) => {
    localStorage.clear(); selectedMap = m; newGame(); showScreen(null); state = 'play'; weather = 'none'; window.requestAnimationFrame = () => 0;
    T = ((23 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; P.inside = null;
    const first = []; update(.1); for (const f of FF) if (f.on) first.push(f.k);
    for (let i = 0; i < 80; i++) update(.1);
    const on = FF.filter(f => f.on);
    const lv = on.map(f => ffLevel(f) * f.k);
    let dentro = 0; for (const f of on) if (bldAt(f.x, f.y)) dentro++;
    // brilho varia com o tempo para um mesmo vaga-lume
    const f0 = on[0] || FF[0], amostras = []; for (let i = 0; i < 60; i++) { update(.1); amostras.push(ffLevel(f0)); }
    for (let k = 0; k < 2; k++) render();
    return { n: on.length, first: Math.max(0, ...first), max: Math.max(...lv), dentro, vari: Math.max(...amostras) - Math.min(...amostras), dark };
  }, m);
  const f = await noite('forest');
  ok(f.n >= 20, 'floresta de noite: ' + f.n + ' vaga-lumes no ar');
  ok(f.first <= .25, 'nascem apagados e acendem aos poucos (brilho de entrada ' + f.first.toFixed(2) + ')');
  ok(f.max > .5 && f.max <= 1, 'chegam a acender forte (' + f.max.toFixed(2) + ')');
  ok(f.vari > .5, 'o brilho de cada um sobe e desce (variacao ' + f.vari.toFixed(2) + ')');
  ok(f.dentro === 0, 'nenhum vaga-lume dentro de casa');
  for (const m of ['snow', 'desert', 'city']) { const o = await noite(m); ok(o.n === 0, m + ': sem vaga-lumes (' + o.n + ')'); }
  const dia = await pg.evaluate(() => {
    localStorage.clear(); selectedMap = 'forest'; newGame(); showScreen(null); state = 'play'; weather = 'none'; window.requestAnimationFrame = () => 0;
    T = ((23 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 30; i++) update(.1);
    const antes = FF.filter(f => f.on).length;
    T = ((12 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 150; i++) update(.1);
    weather = 'rain'; return { antes, depois: FF.filter(f => f.on).length };
  });
  ok(dia.antes > 0 && dia.depois === 0, 'ao amanhecer os vaga-lumes se apagam e somem (' + dia.antes + ' -> ' + dia.depois + ')');
  await b.close(); process.exit(bad ? 1 : 0);
})();
