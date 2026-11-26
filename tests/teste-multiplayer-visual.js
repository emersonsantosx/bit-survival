/* Visual das telas do multiplayer (sala), do painel de chat e do botao de chat: so aparencia, mesma linguagem do inventario e do crafting.
   - sala: slots quadrados, borda de 3 px, sombra dura, fonte pixel; voce em ambar, pronto em musgo, etiquetas preenchidas; INICIAR bloqueado em cinza;
   - chat: painel plano com borda quadrada, mensagens e campo sem canto arredondado, ENVIAR em musgo com sombra dura;
   - menu MULTIPLAYER em coluna estreita; tudo continua funcionando (abrir, enviar, fechar) e sem erros de JS.
   Uso: node tests/teste-multiplayer-visual.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 878, height: 405 }, hasTouch: true })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(400);
  /* ---- sala ---- */
  await pg.evaluate(() => {
    MP.isHost = true; MP.roomCode = 'MINISURV-K7QX2M';
    MP.players = [{ id: 'host', name: 'Emerson', host: true }, { id: 'g1', name: 'Noiva', ready: true }, { id: 'g2', name: 'Fulano', ready: false }];
    window.myNetId = () => 'host'; lobbyShow();
  });
  await pg.waitForTimeout(200);
  const s = await pg.evaluate(() => {
    const cs = e => getComputedStyle(e), q = x => document.querySelector(x), px = v => parseFloat(v);
    const me = q('.lob-slot.me'), rdy = q('.lob-slot.rdy:not(.me)'), wait = [...document.querySelectorAll('.lob-slot')].find(e => !e.classList.contains('rdy') && !e.classList.contains('empty'));
    const emp = q('.lob-slot.empty'), start = document.getElementById('btnLobStart'), kick = q('.lob-slot .kick');
    return {
      rad: cs(me).borderTopLeftRadius, bw: px(cs(me).borderTopWidth), shadow: cs(me).boxShadow, font: cs(me).fontFamily, bg: cs(me).backgroundColor,
      meB: cs(me).borderTopColor, rdyB: cs(rdy).borderTopColor, rdyBg: cs(rdy).backgroundColor, waitBg: cs(wait).backgroundColor, empStyle: cs(emp).borderTopStyle,
      host: cs(q('.tag.host')).backgroundColor, ok: cs(q('.tag.ok')).backgroundColor, wait: cs(q('.tag.wait')).color,
      kickRad: cs(kick).borderTopLeftRadius, kickB: cs(kick).borderTopColor,
      startDis: start.disabled, startBg: cs(start).backgroundColor, startShadow: cs(start).boxShadow, startColor: cs(start).color,
      menuW: (() => { showScreen('mpscreen'); const w = document.querySelector('#mpscreen .card').getBoundingClientRect().width; showScreen('mplobby'); return w; })()
    };
  });
  ok(s.rad === '0px' && s.bw >= 3, 'slots da sala quadrados com borda de 3 px');
  ok(/0px 3px 0px/.test(s.shadow) && s.font.indexOf('Press Start 2P') >= 0, 'sombra dura embaixo e fonte pixel');
  ok(s.meB === 'rgb(199, 154, 84)', 'o seu slot em ambar');
  ok(s.rdyB === 'rgb(141, 165, 104)' && s.rdyBg === 'rgb(32, 39, 29)', 'jogador pronto em verde-musgo (mesmo estado do crafting)');
  ok(s.waitBg === 'rgb(31, 36, 44)' && s.empStyle === 'dashed', 'aguardando no painel padrao; vaga vazia tracejada');
  ok(s.host === 'rgb(199, 154, 84)' && s.ok === 'rgb(141, 165, 104)', 'etiquetas HOST e PRONTO preenchidas');
  ok(s.kickRad === '0px' && s.kickB === 'rgb(192, 99, 74)', 'botao de remover quadrado e vermelho');
  ok(s.startDis && s.startBg === 'rgb(23, 26, 32)' && s.startShadow === 'none' && s.startColor === 'rgb(107, 104, 88)', 'INICIAR bloqueado em cinza, sem sombra');
  ok(s.menuW <= 450, 'menu MULTIPLAYER em coluna estreita (' + Math.round(s.menuW) + ' px)');
  /* ---- chat ---- */
  await pg.evaluate(() => { localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true); MP.active = true; setChatButtonVisible(true); });
  await pg.evaluate(() => { pushChatBubble('Noiva', 'Oi!', false, false); pushChatBubble('Eu', 'Ola', true, false); pushChatBubble('', 'Fulano entrou', false, true); openChat(); });
  await pg.waitForTimeout(250);
  const c = await pg.evaluate(() => {
    const cs = e => getComputedStyle(e), q = x => document.querySelector(x), px = v => parseFloat(v);
    const p = q('#chat-panel'), m = q('.cm:not(.me):not(.sys)'), me = q('.cm.me'), inp = q('#chat-input'), snd = q('#chat-send');
    return {
      open: p.classList.contains('open'), panelBg: cs(p).backgroundColor, panelBw: px(cs(p).borderLeftWidth), head: cs(q('.chat-head .ct')).fontFamily,
      mRad: cs(m).borderTopLeftRadius, mBg: cs(m).backgroundColor, mShadow: cs(m).boxShadow, name: cs(m.querySelector('.cn')).fontFamily, meBg: cs(me).backgroundColor, meB: cs(me).borderTopColor,
      inpRad: cs(inp).borderTopLeftRadius, inpBw: px(cs(inp).borderTopWidth), inpFont: px(cs(inp).fontSize),
      sndBg: cs(snd).backgroundColor, sndShadow: cs(snd).boxShadow, sndFont: cs(snd).fontFamily, closeRad: cs(q('#chat-close')).borderTopLeftRadius, sys: cs(q('.cm.sys')).backgroundColor
    };
  });
  ok(c.open && c.panelBg === 'rgb(23, 26, 32)' && c.panelBw >= 3, 'painel do chat plano com borda quadrada de 3 px');
  ok(c.head.indexOf('Press Start 2P') >= 0 && c.name.indexOf('Press Start 2P') >= 0, 'titulo e nomes na fonte pixel');
  ok(c.mRad === '0px' && c.mBg === 'rgb(31, 36, 44)' && /0px 2px 0px/.test(c.mShadow), 'mensagens no painel padrao, quadradas, sombra dura');
  ok(c.meBg === 'rgb(32, 39, 29)' && c.meB === 'rgb(141, 165, 104)', 'suas mensagens em verde-musgo');
  ok(c.inpRad === '0px' && c.inpBw >= 3 && c.inpFont >= 16, 'campo de texto quadrado, borda de 3 px e fonte >= 16 px (sem zoom no celular)');
  ok(c.sndBg === 'rgb(141, 165, 104)' && /0px 3px 0px/.test(c.sndShadow) && c.sndFont.indexOf('Press Start 2P') >= 0 && c.closeRad === '0px', 'ENVIAR em musgo com sombra dura; fechar quadrado');
  ok(c.sys === 'rgba(0, 0, 0, 0)', 'aviso do sistema sem caixa');
  /* ---- continua funcionando: enviar e fechar ---- */
  await pg.evaluate(() => { const i = document.getElementById('chat-input'); i.value = 'teste'; updateChatCount(); });
  ok(await pg.evaluate(() => document.getElementById('chat-count').textContent === '5/60'), 'contador de caracteres segue funcionando');
  await pg.evaluate(() => closeChat());
  ok(await pg.evaluate(() => !document.getElementById('chat-panel').classList.contains('open') && !chatOpen), 'fechar o chat funciona');
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
