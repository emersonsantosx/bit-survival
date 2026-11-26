/* Balao rapido das mensagens do multiplayer: o texto aparece como foi escrito (minusculas continuam minusculas); o resto da HUD segue em caixa alta.
   Uso: node tests/teste-balao-caixa.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(400);
  const r = await pg.evaluate(async () => {
    pushChatBubble('Ana', 'oi, TUDO bem? ação já', false, false);
    const el = document.querySelector('.chat-bubble'), cs = getComputedStyle(el);
    await document.fonts.load('20px BitHUDChat'); await document.fonts.load('20px BitHUD'); await document.fonts.ready;
    /* desenho da letra como grade de pixels da fonte: letra grande (1 pixel da fonte = 10 px) e leitura so no centro de cada casa,
       para a comparacao nao depender de como cada navegador suaviza as bordas */
    const img = (fam, ch) => { const c = document.createElement('canvas'); c.width = 100; c.height = 140; const g = c.getContext('2d', { willReadFrequently: true });
      g.font = '100px ' + fam; g.fillText(ch, 10, 110); const d = g.getImageData(0, 0, 100, 140).data; let s = '';
      for (let y = 5; y < 140; y += 10) for (let x = 15; x < 100; x += 10) s += d[(y * 100 + x) * 4 + 3] > 127 ? '#' : '.';
      return Math.round(g.measureText(ch).width) + ':' + s; };
    const letras = 'abcdefghijklmnopqrstuvwxyzáàâãéêèíîóôõúüç';
    return { texto: el.textContent, font: cs.fontFamily, tt: cs.textTransform,
      iguais: [...letras].filter(ch => img('BitHUDChat', ch) === img('BitHUDChat', ch.toUpperCase())).join(''),
      maiusc: [...'AMQZÇÃ09?!'].filter(ch => img('BitHUDChat', ch) !== img('BitHUD', ch)).join(''),
      desenha: img('BitHUD', 'A').indexOf('#') > 0,
      hud: img('BitHUD', 'a') === img('BitHUD', 'A') };
  });
  ok(r.texto === 'Ana: oi, TUDO bem? ação já' && r.tt === 'none', 'o balao guarda o texto original');
  ok(r.font.indexOf('BitHUDChat') >= 0, 'o balao usa a fonte com minusculas');
  ok(!r.iguais, 'toda minuscula tem desenho diferente da maiuscula ' + r.iguais);
  ok(r.desenha && !r.maiusc, 'maiusculas, numeros e pontuacao iguais aos da HUD ' + r.maiusc);
  ok(r.hud, 'o resto da HUD continua em caixa alta');
  ok(!errs.length, 'sem erros de JS ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
