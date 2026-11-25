/* Tocar num balao de mensagem do multiplayer abre o chat; tocar fora do balao (area vazia do topo) nao abre.
   Uso: node tests/teste-balao-abre-chat.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 878, height: 405 }, hasTouch: true })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  await pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true); MP.active = true; });
  await pg.waitForTimeout(3600);
  await pg.evaluate(() => pushChatBubble('Amada', 'Oi, tudo bem?', false, false)); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { const e = document.querySelector('#chat-msgs .chat-bubble').getBoundingClientRect(), c = document.getElementById('chat-msgs').getBoundingClientRect(); return { bx: e.left + e.width / 2, by: e.top + e.height / 2, vx: c.left + 8, vy: c.bottom - 4 }; });
  // toque na area vazia do invólucro (abaixo do balao): nao abre
  const aberto = () => pg.evaluate(() => !!chatOpen);
  await pg.touchscreen.tap(r.vx, r.vy + 30); await pg.waitForTimeout(150);
  ok(!(await aberto()), 'tocar fora do balao nao abre o chat');
  await pg.touchscreen.tap(r.bx, r.by); await pg.waitForTimeout(250);
  ok(await aberto(), 'tocar no balao abre o chat');
  ok(await pg.evaluate(() => document.getElementById('chat-panel').classList.contains('open')), 'o painel do chat aparece');
  ok(errs.length === 0, 'sem erros de JS');
  await b.close(); if (bad) { console.log(bad + ' falhou'); process.exit(1); } console.log('Todos os testes passaram');
})();
