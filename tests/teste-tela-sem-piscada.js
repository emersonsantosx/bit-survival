/* A tela do jogo nao pode usar o modo de baixa latencia (desynchronized): nele o celular podia mostrar o quadro pela metade
   (casas sem telhado e noite sem escuro), piscando. Uso: node tests/teste-tela-sem-piscada.js [caminho/index.html]. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(400);
  const a = await pg.evaluate(() => ctx.getContextAttributes());
  ok(!a.desynchronized, 'tela do jogo sem desynchronized');
  ok(a.alpha === false, 'tela continua opaca');
  ok(errs.length === 0, 'sem erros de JS' + (errs[0] ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
