/* Modo desktop: detecta computador x celular, WASD/Shift/mouse, mira, dirigir, sem tela cheia nem trava de paisagem no computador, tela de controles.
   Uso: node tests/teste-modo-desktop.js [index.html] [captura.png] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shot = process.argv[3];
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const errs = [];
  const novo = async (opt) => { const ctx = await b.newContext(opt); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.addInitScript(() => { window.__fs = 0; window.__lock = 0; try { Element.prototype.requestFullscreen = function () { window.__fs++; return Promise.resolve(); }; if (screen.orientation) screen.orientation.lock = () => { window.__lock++; return Promise.resolve(); }; } catch (e) { } }); await pg.goto('file://' + file); await pg.waitForTimeout(300); return pg; };
  const comeca = (pg) => pg.evaluate(() => { window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = 'forest'; weather = 'none'; pendingSlot = 1; startGame(); state = 'play'; zombies.length = 0; animals.length = 0; weatherTimer = 99999; P.dead = false; P.hp = 100; P.inside = null; P.inVehicle = null; P.stam = 100; items.length = 0; $('hud').classList.remove('hide'); update(.02); render(); return { kbm: KBM, fs: window.__fs, lock: window.__lock }; });
  const passos = (pg, n) => pg.evaluate(n => { for (let i = 0; i < n; i++) { update(.05); render(); } return { x: P.x, y: P.y, face: P.face, sprint: P.sprint, atk: atkHeld }; }, n);

  // ===== computador =====
  const pg = await novo({ viewport: { width: 1280, height: 720 } });
  const ini = await comeca(pg);
  ok(ini.kbm === true, 'computador: modo teclado e mouse detectado');
  ok(ini.fs === 0 && ini.lock === 0, 'computador: nao pede tela cheia nem trava de paisagem ao iniciar (' + ini.fs + '/' + ini.lock + ')');
  ok(await pg.evaluate(() => document.body.classList.contains('kbm') && getComputedStyle($('atk')).display === 'none' && getComputedStyle($('run')).display === 'none'), 'computador: botoes de toque escondidos');
  ok(await pg.evaluate(() => getComputedStyle($('rotate')).display === 'none'), 'computador: sem aviso de girar a tela');
  // andar com WASD
  let a = await passos(pg, 1); const x0 = a.x, y0 = a.y;
  await pg.keyboard.down('KeyD'); a = await passos(pg, 10); await pg.keyboard.up('KeyD');
  ok(a.x > x0 + 5, 'D anda para a direita (' + (a.x - x0).toFixed(1) + ')');
  const x1 = a.x, y1 = a.y;
  await pg.keyboard.down('KeyW'); a = await passos(pg, 10); await pg.keyboard.up('KeyW');
  ok(a.y < y1 - 5, 'W anda para cima');
  const x2 = a.x, y2 = a.y;
  await pg.keyboard.down('ArrowDown'); await pg.keyboard.down('ArrowLeft'); a = await passos(pg, 10); await pg.keyboard.up('ArrowDown'); await pg.keyboard.up('ArrowLeft');
  const dx = x2 - a.x, dy = a.y - y2; ok(dx > 3 && dy > 3 && Math.abs(dx - dy) < Math.max(dx, dy) * .35, 'diagonal (setas) anda igual nos dois eixos, sem ficar mais rapido');
  // parado nao anda
  const pa = await passos(pg, 1); const pb = await passos(pg, 10); ok(Math.abs(pb.x - pa.x) < .01 && Math.abs(pb.y - pa.y) < .01, 'sem tecla, o personagem fica parado');
  // correr
  { const base = await passos(pg, 1); await pg.keyboard.down('KeyD'); const w = await passos(pg, 10); await pg.keyboard.up('KeyD'); const walk = w.x - base.x;
    await pg.keyboard.down('Shift'); await pg.keyboard.down('KeyA'); const s = await passos(pg, 10); await pg.keyboard.up('KeyA'); await pg.keyboard.up('Shift'); const run = w.x - s.x;
    ok(run > walk * 1.3, 'Shift corre mais (' + walk.toFixed(1) + ' -> ' + run.toFixed(1) + ')'); ok((await passos(pg, 1)).sprint === false, 'soltou o Shift, parou de correr'); }
  // mira no mouse: personagem olha para o cursor mesmo parado e andando de lado
  { const alvo = await pg.evaluate(() => { const r = cv.getBoundingClientRect(); const sx = (P.x - camX) * Z * (r.width / W) + r.left, sy = (P.y - 6 - camY) * Z * (r.height / H) + r.top; return { x: sx, y: sy }; });
    await pg.mouse.move(alvo.x + 100, alvo.y); let f = await passos(pg, 2); ok(Math.abs(Math.cos(f.face) - 1) < .08 && Math.abs(Math.sin(f.face)) < .08, 'mouse a direita: olha para a direita');
    await pg.mouse.move(alvo.x, alvo.y - 100); f = await passos(pg, 2); ok(Math.abs(f.face + Math.PI / 2) < .1, 'mouse em cima: olha para cima');
    await pg.keyboard.down('KeyD'); f = await passos(pg, 6); await pg.keyboard.up('KeyD'); ok(Math.abs(f.face + Math.PI / 2) < .15, 'anda para a direita olhando para o mouse (anda de lado)'); }
  // clique esquerdo ataca, soltar para; direito pega item
  { await pg.mouse.move(640, 300); await pg.mouse.down(); ok((await passos(pg, 1)).atk === true, 'clique esquerdo segurado: ataque continuo'); await pg.mouse.up(); ok((await passos(pg, 1)).atk === false, 'soltou o clique: para de atacar'); }
  { await pg.evaluate(() => { items.length = 0; P.inv.length = 0; items.push({ t: 'water', x: P.x + 4, y: P.y }); update(.02); }); await pg.mouse.click(640, 300, { button: 'right' }); ok(await pg.evaluate(() => P.inv.some(s => s.t === 'water')), 'clique direito pega o item do chao'); }
  // E pega tambem, roda do mouse troca de arma
  { await pg.evaluate(() => { items.length = 0; P.inv.length = 0; items.push({ t: 'food', x: P.x + 4, y: P.y }); update(.02); }); await pg.keyboard.press('KeyE'); ok(await pg.evaluate(() => P.inv.some(s => s.t === 'food')), 'E pega o item'); }
  { await pg.evaluate(() => { P.weapons = P.weapons || []; window.__w0 = P.weapon; window.__cw = 0; const o = window.cycleWeapon; window.cycleWeapon = function () { window.__cw++; return o.apply(this, arguments); }; }); await pg.mouse.wheel(0, 100); await pg.waitForTimeout(50); ok(await pg.evaluate(() => window.__cw >= 1), 'roda do mouse troca de arma'); }
  // dirigir com WASD
  { const r = await pg.evaluate(() => { const v = vehicles[0]; v.destroyed = false; v.dying = false; v.hp = v.maxHp; v.spd = 0; P.x = v.x; P.y = v.y; P.inVehicle = v; return true; });
    await pg.keyboard.down('KeyW'); const s1 = await pg.evaluate(() => { for (let i = 0; i < 20; i++) { update(.05); } return vehicles.find(v => v === P.inVehicle).spd; }); await pg.keyboard.up('KeyW');
    ok(s1 > 5, 'W acelera o veiculo (' + s1.toFixed(1) + ')');
    await pg.keyboard.down('KeyD'); const f0 = await pg.evaluate(() => P.inVehicle.face); await pg.keyboard.down('KeyW'); const f1 = await pg.evaluate(() => { for (let i = 0; i < 20; i++) update(.05); return P.inVehicle.face; }); await pg.keyboard.up('KeyD'); await pg.keyboard.up('KeyW');
    ok(Math.abs(f1 - f0) > .05, 'A e D viram o veiculo');
    await pg.keyboard.press('KeyE'); ok(await pg.evaluate(() => !P.inVehicle), 'E sai do veiculo'); }
  // tela de controles
  { await pg.keyboard.press('KeyH'); await pg.waitForTimeout(50); ok(await pg.evaluate(() => !$('keysscr').classList.contains('hide') && state === 'pause'), 'H abre a tela de controles (jogo pausa)');
    if (shot) await pg.screenshot({ path: shot.replace('.png', '_controles.png') });
    await pg.keyboard.press('Escape'); ok(await pg.evaluate(() => $('keysscr').classList.contains('hide') && state === 'pause'), 'Esc fecha so a tela de controles (continua pausado)');
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(500); ok(await pg.evaluate(() => state === 'play' || state === 'pause'), 'Esc de novo continua o fluxo normal da pausa'); }
  // alt-tab pausa
  { await pg.evaluate(() => { state = 'play'; window.dispatchEvent(new Event('blur')); }); ok(await pg.evaluate(() => state === 'pause'), 'perder o foco da janela pausa o jogo'); await pg.evaluate(() => { $('keysscr').classList.add('hide'); state = 'play'; $('pausescr').classList.add('hide'); }); }
  // dicas das teclas
  ok(await pg.evaluate(() => $('bpack').dataset.key === 'I' && $('bpause').dataset.key === 'Esc' && document.querySelector('#inv .slot').dataset.key === '1'), 'botoes mostram a tecla (I, Esc, 1...)');
  if (shot) { await pg.evaluate(() => { updateHud(true); buildInv(); }); await pg.screenshot({ path: shot }); }
  // trocar para toque no meio do jogo
  { await pg.evaluate(() => { const c = $('game'); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 5, clientX: 100, clientY: 100 })); }); ok(await pg.evaluate(() => KBM === false && !document.body.classList.contains('kbm') && getComputedStyle($('atk')).display !== 'none'), 'tocar na tela troca para o modo toque (botoes voltam)');
    await pg.keyboard.press('KeyD'); ok(await pg.evaluate(() => KBM === true), 'apertar tecla volta para o modo teclado'); }
  await pg.context().close();

  // ===== celular =====
  const pm = await novo({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G990E) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' });
  const mi = await comeca(pm);
  ok(mi.kbm === false, 'celular: modo toque detectado');
  ok(await pm.evaluate(() => getComputedStyle($('atk')).display !== 'none' && getComputedStyle($('run')).display !== 'none' && !document.body.classList.contains('kbm')), 'celular: botoes de toque continuam aparecendo');
  ok(await pm.evaluate(() => $('bpack').dataset.key === undefined), 'celular: sem dicas de teclas');
  await pm.context().close();
  ok(errs.length === 0, 'sem erros de pagina ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
