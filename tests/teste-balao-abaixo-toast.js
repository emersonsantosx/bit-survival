/* Os baloes de mensagem do multiplayer (#chat-msgs) descem para baixo do aviso (#toast) enquanto ele aparece e voltam ao lugar quando ele some;
   com aviso e mensagem juntos, a mensagem ja entra embaixo. Uso: node tests/teste-balao-abaixo-toast.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  for (const [w, h] of [[878, 405], [568, 320]]) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
    await pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true); });
    await pg.waitForTimeout(3600);   // espera sumir o aviso inicial do jogo
    const box = () => pg.evaluate(() => { const c = document.getElementById('chat-msgs').getBoundingClientRect(), t = document.getElementById('toast').getBoundingClientRect(); return { chatTop: Math.round(c.top), toastBottom: Math.round(t.bottom), tshow: document.getElementById('toast').classList.contains('show') }; });
    await pg.evaluate(() => pushChatBubble('Amada', 'Oi, tudo bem?', false, false)); await pg.waitForTimeout(300);
    const base = await box();
    await pg.evaluate(() => toast('Chuva: fogueiras apagam e stamina cai mais')); await pg.waitForTimeout(450);
    const com = await box();
    ok(com.tshow && com.chatTop >= com.toastBottom + 2, w + 'x' + h + ': com o aviso na tela o balao fica abaixo dele (' + base.chatTop + ' -> ' + com.chatTop + ', aviso termina em ' + com.toastBottom + ')');
    await pg.evaluate(() => pushChatBubble('Voce', 'Ja vou', true, false)); await pg.waitForTimeout(300);
    ok((await box()).chatTop === com.chatTop, w + 'x' + h + ': mensagem nova durante o aviso ja entra embaixo');
    await pg.waitForTimeout(3300);
    const fim = await box();
    ok(!fim.tshow && fim.chatTop === base.chatTop, w + 'x' + h + ': quando o aviso some o balao volta ao lugar (' + fim.chatTop + ')');
    ok(errs.length === 0, w + 'x' + h + ': sem erros de JS');
  }
  await b.close(); if (bad) { console.log(bad + ' falhou'); process.exit(1); } console.log('Todos os testes passaram');
})();
