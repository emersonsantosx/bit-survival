/* Teste automatico de saves do Bit Survival.
   Uso: node tests/teste-saves.js [caminho/index.html]
   Para cada mapa: novo jogo, move o jogador, salva, recarrega a pagina,
   confere o botao CONTINUAR, continua e compara o estado. Sai com codigo 1 se algo falhar. */
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const MAPS = ['forest', 'snow', 'desert', 'city'];
(async () => {
  const b = await chromium.launch();
  let falhas = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHOU ') + m); if (!c) falhas++; };
  for (const map of MAPS) {
    const pg = await (await b.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
    await pg.goto('file://' + file); await pg.waitForTimeout(400);
    const antes = await pg.evaluate((m) => {
      localStorage.clear(); selectedMap = m; pendingSlot = 1; showScreen(null); newGame();
      P.x += 40; P.y += 25; P.hp = 77; T = 123;
      saveGame();
      return { x: Math.round(P.x), y: Math.round(P.y), trees: trees.length, seed: worldSeed, ws: WW };
    }, map);
    await pg.reload(); await pg.waitForTimeout(400);
    const menu = await pg.evaluate(() => { refreshContinue(); return document.getElementById('menu').classList.contains('hasSave'); });
    ok(menu, map + ': botao CONTINUAR aparece apos recarregar');
    const depois = await pg.evaluate(() => {
      continueGame(1);
      return { state, x: Math.round(P.x), y: Math.round(P.y), hp: Math.round(P.hp), trees: trees.length, seed: worldSeed, ws: WW };
    });
    ok(depois.state === 'play', map + ': jogo volta ao estado play');
    ok(depois.x === antes.x && depois.y === antes.y, map + ': posicao identica');
    ok(depois.seed === antes.seed && depois.ws === antes.ws && depois.trees === antes.trees, map + ': mundo identico (seed, tamanho, arvores)');
    ok(depois.hp === 77, map + ': vida preservada');
    ok(errs.length === 0, map + ': sem erros de console' + (errs.length ? ' -> ' + errs[0] : ''));
    await pg.context().close();
  }
  await b.close();
  console.log(falhas ? '\n' + falhas + ' falha(s)' : '\nTodos os testes passaram');
  process.exit(falhas ? 1 : 0);
})();
