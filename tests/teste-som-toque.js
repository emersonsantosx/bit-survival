/* Som de toque da interface: audivel no alto-falante do celular (energia acima de 300 Hz), sem estourar, respeitando o volume,
   e tocando uma vez em cada botao de menu/tela (os controles de acao do jogo nao tocam).
   Uso: node tests/teste-som-toque.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const m = await pg.evaluate(async () => {
    const render = async (sfx) => {
      const off = new OfflineAudioContext(1, 22050, 44100), real = AC, buf = nbuf;
      aud(); const ac = AC, nb = nbuf; AC = off; nbuf = nb; const cm = CFG.master, cs = CFG.sfx; CFG.master = 1; CFG.sfx = sfx; for (const k in _sndT) delete _sndT[k];
      const aud0 = aud; aud = () => {}; uiTap(); aud = aud0; AC = ac; CFG.master = cm; CFG.sfx = cs;
      const d = (await off.startRendering()).getChannelData(0);
      // passa-alta de 300 Hz (2 estagios): aproxima o que o alto-falante do celular entrega
      let x = d; for (let k = 0; k < 2; k++) { const y = new Float32Array(x.length), a = 1 / (1 + 2 * Math.PI * 300 / 44100); for (let i = 1; i < x.length; i++) y[i] = a * (y[i - 1] + x[i] - x[i - 1]); x = y; }
      const peak = v => v.reduce((p, s) => Math.max(p, Math.abs(s)), 0);
      return { peak: peak(d), cel: peak(x) };
    };
    return { cheio: await render(1), meio: await render(.5), mudo: await render(0) };
  });
  console.log(JSON.stringify(m));
  ok(m.cheio.cel > .2, 'audivel no celular (pico acima de 300 Hz): ' + m.cheio.cel.toFixed(3));
  ok(m.cheio.peak > .4 && m.cheio.peak < .95, 'forte e sem estourar: ' + m.cheio.peak.toFixed(3));
  ok(m.meio.peak < m.cheio.peak * .65 && m.mudo.peak === 0, 'respeita o volume de efeitos');
  await pg.evaluate(() => { window.__n = 0; const o = sndThrottle; sndThrottle = (k, ms) => { const r = o(k, ms); if (k === 'ui' && r) window.__n++; return r; }; });
  const tap = async sel => { await pg.waitForTimeout(520); await pg.evaluate(() => window.__n = 0); await pg.locator(sel).first().tap(); await pg.waitForTimeout(150); return pg.evaluate(() => window.__n); };
  const um = async sel => { const n = await tap(sel); ok(n === 1, sel + ' toca 1 vez (' + n + ')'); };
  for (const s of ['#btnConfig', '.cfg-hubbtn[data-cfgsec="perf"]', '#cfg_quality button', '#btnBackCfg']) await um(s);
  const play = () => pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; startGame(); zombies.length = 0; P.pack = P.pack || 'small'; });
  await pg.addStyleTag({ content: '#bpack{display:flex!important;visibility:visible!important;opacity:1!important}' });
  await play();
  for (const s of ['#bcraft', '.craft-tab[data-craft-filter="weapon"]', '#craftclose', '#bpack', '#invclose', '#mm', '#bmzin', '#bmx', '#bpause', '#pauseCfg', '#btnBackCfg', '#resume']) await um(s);
  for (const s of ['#atk', '#run']) { const n = await tap(s); ok(n === 0, s + ' (acao) sem toque (' + n + ')'); }
  await pg.evaluate(() => openWeaponWheel()); await um('.weapon-option');
  ok(!errs.length, 'sem erros ' + errs.join(' | '));
  await b.close(); process.exit(bad ? 1 : 0);
})();
