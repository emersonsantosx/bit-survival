/* Configuracoes completas: controles (joystick, sensibilidade, interface), jogo (brilho da noite, tremor de tela, FPS) e RESTAURAR.
   Tudo salva, volta ao reabrir o jogo, valores invalidos sao corrigidos e cada opcao tem efeito de verdade.
   Uso: node tests/teste-configuracoes.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  await pg.evaluate(() => { localStorage.clear(); });
  await pg.reload(); await pg.waitForTimeout(300);
  const base = await pg.evaluate(() => ({ JR, UIS, joyS: CFG.joyS }));
  await pg.click('#btnConfig');
  const vis = (id) => pg.evaluate((id) => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none' && !e.closest('.hide'); }, id);
  const h0 = { hub: await vis('cfgHub'), audio: await vis('cfgPane_audio'), reset: await vis('btnReset'), title: await pg.evaluate(() => document.getElementById('cfgTitle').textContent) };
  ok(h0.hub && !h0.audio && !h0.reset && h0.title === 'CONFIGURAÇÕES', 'ao abrir, aparece o menu com um botao por secao (sem os controles soltos)');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.cfg-hubbtn')].map(b => b.dataset.cfgsec).join()) === 'audio,perf,ui,ctl,game', '5 secoes: audio, desempenho, interface, controles, jogo');
  await pg.click('[data-cfgsec="audio"]');
  const h1 = { hub: await vis('cfgHub'), audio: await vis('cfgPane_audio'), ctl: await vis('cfgPane_ctl'), reset: await vis('btnReset'), title: await pg.evaluate(() => document.getElementById('cfgTitle').textContent), sl: await vis('cfg_music') };
  ok(!h1.hub && h1.audio && !h1.ctl && h1.reset && h1.title === 'ÁUDIO' && h1.sl, 'escolher a secao mostra so ela (titulo ÁUDIO, controles de audio, sem o menu)');
  await pg.click('#btnBackCfg');
  ok(await vis('cfgHub') && !(await vis('cfgPane_audio')) && !(await vis('btnReset')), 'VOLTAR dentro da secao leva ao menu de secoes');
  await pg.click('[data-cfgsec="ctl"]');
  const slide = (id, v) => pg.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input')); }, [id, v]);
  await slide('cfg_joyS', 140); await slide('cfg_sens', 60); await slide('cfg_ui', 120);
  await pg.click('#btnBackCfg'); await pg.click('[data-cfgsec="game"]');
  await pg.click('#cfg_night button[data-v="0"]'); await pg.click('#cfg_shake'); await pg.click('#cfg_showFps');
  const a = await pg.evaluate(() => ({ JR, UIS, cfg: JSON.parse(localStorage.minisurv_cfg), lab: document.getElementById('v_joyS').textContent, fpsVis: !document.getElementById('fpsHud').classList.contains('hide') }));
  ok(a.cfg.joyS === 1.4 && a.cfg.sens === .6 && a.cfg.ui === 1.2 && a.cfg.night === 0 && a.cfg.shake === false && a.cfg.showFps === true, 'opcoes novas ficam salvas');
  ok(a.JR > base.JR * 1.3, 'joystick maior de verdade (raio ' + base.JR + ' -> ' + a.JR + ')');
  ok(a.UIS > base.UIS * 1.15, 'interface maior de verdade (escala ' + base.UIS + ' -> ' + a.UIS + ')');
  ok(a.lab === '140%', 'rotulo do valor acompanha o controle');
  // efeitos no jogo
  await pg.click('#btnBackCfg'); await pg.click('#btnBackCfg');   // da secao ao menu de secoes, e deste ao menu principal
  const eff = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; selectedMap = 'forest'; newGame(); showScreen(null); state = 'play';
    const o = {}; joy.id = 1; joy.ox = joy.oy = 100;
    const mv = (d) => { const dx = d, f = Math.min(1, dx / JR * CFG.sens); return f; };
    o.sensLow = mv(JR * .8); CFG.sens = 1.5; o.sensHigh = mv(JR * .8);
    CFG.sens = .6; return o;
  });
  ok(eff.sensLow < eff.sensHigh && eff.sensHigh === 1, 'sensibilidade muda o quanto o joystick responde (' + eff.sensLow.toFixed(2) + ' vs ' + eff.sensHigh + ')');
  const fps = await pg.evaluate(async () => { FPSH.t0 = 0; for (let i = 0; i < 40; i++) fpsTick(i * 16.7 + 1000); return { txt: document.getElementById('fpsHud').textContent, vis: !document.getElementById('fpsHud').classList.contains('hide') }; });
  ok(/^\d+ FPS$/.test(fps.txt) && fps.vis, 'contador de FPS aparece com o jogo rodando (' + fps.txt + ')');
  const shk = await pg.evaluate(() => {
    const snap = () => { shake = 6; render(); return cv.toDataURL(); };
    CFG.shake = false; const a1 = snap(), a2 = snap();
    CFG.shake = true; const b1 = snap(), b2 = snap();
    CFG.shake = false; return { off: a1 === a2, on: b1 !== b2 };
  });
  ok(shk.off && shk.on, 'tremor de tela: desligado a imagem fica parada, ligado ela balanca');
  // reabre o jogo: tudo volta
  await pg.reload(); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => ({ joyS: CFG.joyS, ui: CFG.ui, night: CFG.night, shake: CFG.shake, fps: CFG.showFps, v: document.getElementById('cfg_joyS').value, seg: document.querySelector('#cfg_night button.sel').dataset.v, tg: document.getElementById('cfg_shake').classList.contains('on') }));
  ok(r.joyS === 1.4 && r.ui === 1.2 && r.night === 0 && r.shake === false && r.fps === true && r.v === '140' && r.seg === '0' && !r.tg, 'ao reabrir o jogo as opcoes voltam e a tela mostra o que esta salvo');
  // valores invalidos
  await pg.evaluate(() => { localStorage.minisurv_cfg = JSON.stringify({ joyS: 99, sens: -3, ui: 'abc', night: 7, shake: 'x', cfgv: 3 }); });
  await pg.reload(); await pg.waitForTimeout(300);
  const inv = await pg.evaluate(() => ({ joyS: CFG.joyS, sens: CFG.sens, ui: CFG.ui, night: CFG.night, shake: CFG.shake }));
  ok(inv.joyS === 1.5 && inv.sens === .5 && inv.ui === 1 && inv.night === 1 && inv.shake === true, 'valores invalidos salvos sao corrigidos (' + JSON.stringify(inv) + ')');
  // restaurar: um botao por secao, so mexe na secao aberta
  await pg.click('#btnConfig'); ok(await vis('cfgHub') && !(await vis('btnReset')), 'reabrir a tela de configuracoes comeca no menu de secoes, sem RESTAURAR la');
  await slide('cfg_music', 10); await slide('cfg_ui', 130); await slide('cfg_joyS', 80); await slide('cfg_sfx', 20);
  await pg.evaluate(() => { document.getElementById('cfg_showFps').click(); document.getElementById('cfg_minimap').click(); });
  const cfgNow = () => pg.evaluate(() => JSON.parse(localStorage.minisurv_cfg));
  const c0 = await cfgNow();
  ok(c0.music === .1 && c0.ui === 1.3 && c0.showFps === true && c0.minimap === false, 'preparo: valores alterados em varias secoes');
  await pg.click('[data-cfgsec="audio"]'); ok(await vis('btnReset'), 'dentro da secao aparece o RESTAURAR dela');
  await pg.click('#btnReset');
  const c1 = await cfgNow(), a1 = await pg.evaluate(() => ({ mv: document.getElementById('cfg_music').value, sv: document.getElementById('cfg_sfx').value, lab: document.getElementById('v_music').textContent }));
  ok(c1.music === .5 && c1.sfx === 1 && c1.master === .8 && c1.amb === .6 && c1.rain === .7 && c1.step === .8, 'RESTAURAR do AUDIO volta os 6 volumes (inclusive a musica)');
  ok(a1.mv === '50' && a1.sv === '100' && a1.lab === '50%', 'e a tela de audio mostra os valores restaurados');
  ok(c1.ui === 1.3 && c1.joyS === .8 && c1.showFps === true && c1.minimap === false, 'sem mexer nas outras secoes (controles, jogo, interface continuam como estavam)');
  await pg.click('#btnBackCfg'); await pg.click('[data-cfgsec="ctl"]'); await pg.click('#btnReset');
  const c2 = await cfgNow(), a2 = await pg.evaluate(() => ({ u: document.getElementById('cfg_ui').value, j: document.getElementById('cfg_joyS').value, UIS }));
  ok(c2.ui === 1 && c2.joyS === 1 && c2.sens === 1 && c2.showFps === true && a2.u === '100' && a2.j === '100' && a2.UIS === 1, 'RESTAURAR dos CONTROLES volta joystick, sensibilidade e interface (e refaz o layout)');
  await pg.click('#btnBackCfg'); await pg.click('[data-cfgsec="game"]'); await pg.click('#btnReset');
  const c3 = await cfgNow(), a3 = await pg.evaluate(() => ({ fps: document.getElementById('cfg_showFps').classList.contains('on'), sh: document.getElementById('cfg_shake').classList.contains('on'), seg: document.querySelector('#cfg_night button.sel').dataset.v }));
  ok(c3.showFps === false && c3.shake === true && c3.night === 1 && !a3.fps && a3.sh && a3.seg === '1' && c3.minimap === false, 'RESTAURAR do JOGO volta noite, tremor e FPS (interface segue intacta)');
  await pg.click('#btnBackCfg'); await pg.click('[data-cfgsec="ui"]'); await pg.click('#btnReset');
  ok((await cfgNow()).minimap === true && await pg.evaluate(() => !document.body.classList.contains('nomap')), 'RESTAURAR da INTERFACE religa o minimapa na tela');
  await pg.evaluate(() => { CFG.quality = 2; CFG.fps = 30; CFG.autoperf = false; saveCfg(); });
  await pg.click('#btnBackCfg'); await pg.click('[data-cfgsec="perf"]'); await pg.click('#btnReset');
  const c5 = await cfgNow(); ok(c5.quality === 0 && c5.fps === 60 && c5.autoperf === true, 'RESTAURAR do DESEMPENHO volta qualidade, FPS e ajuste automatico');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
