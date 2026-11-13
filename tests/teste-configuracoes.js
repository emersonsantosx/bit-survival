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
  ok(h0.hub && !h0.audio && h0.reset && h0.title === 'CONFIGURAÇÕES', 'ao abrir, aparece o menu com um botao por secao (sem os controles soltos)');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.cfg-hubbtn')].map(b => b.dataset.cfgsec).join()) === 'audio,perf,ui,ctl,game', '5 secoes: audio, desempenho, interface, controles, jogo');
  await pg.click('[data-cfgsec="audio"]');
  const h1 = { hub: await vis('cfgHub'), audio: await vis('cfgPane_audio'), ctl: await vis('cfgPane_ctl'), reset: await vis('btnReset'), title: await pg.evaluate(() => document.getElementById('cfgTitle').textContent), sl: await vis('cfg_music') };
  ok(!h1.hub && h1.audio && !h1.ctl && !h1.reset && h1.title === 'ÁUDIO' && h1.sl, 'escolher a secao mostra so ela (titulo ÁUDIO, controles de audio, sem o menu)');
  await pg.click('#btnBackCfg');
  ok(await vis('cfgHub') && !(await vis('cfgPane_audio')) && await vis('btnReset'), 'VOLTAR dentro da secao leva ao menu de secoes');
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
  // restaurar
  await pg.click('#btnConfig'); ok(await vis('cfgHub'), 'reabrir a tela de configuracoes sempre comeca no menu de secoes'); await slide('cfg_music', 10); await slide('cfg_ui', 130); await pg.evaluate(() => document.getElementById('cfg_showFps').click());
  await pg.click('#btnReset');
  const z = await pg.evaluate(() => ({ c: JSON.parse(localStorage.minisurv_cfg), mv: document.getElementById('cfg_music').value, uv: document.getElementById('cfg_ui').value, fps: document.getElementById('cfg_showFps').classList.contains('on'), sh: document.getElementById('cfg_shake').classList.contains('on') }));
  ok(z.c.music === .5 && z.c.ui === 1 && z.c.joyS === 1 && z.c.sens === 1 && z.c.night === 1 && z.c.shake === true && z.c.showFps === false, 'RESTAURAR volta tudo ao padrao, inclusive a musica');
  ok(z.mv === '50' && z.uv === '100' && !z.fps && z.sh, 'RESTAURAR atualiza os controles da tela');
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
