/* Copa translucida atras do jogador: a troca de 100% para 50% de opacidade e suave (cerca de 0,15 s) e nao um salto de um quadro,
   que no deserto (arvore seca escura sobre areia clara) parecia um clarao ao andar. Confere, em todos os mapas: o primeiro quadro atras da copa
   ainda esta quase opaco, depois de ~0,3 s chega a 50%, ao sair volta a 100% suavemente, e uma arvore que ficou muito tempo fora da tela comeca no valor certo.
   Uso: node tests/teste-arvore-transparencia.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 480, height: 270 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  for (const map of ['forest', 'desert', 'snow', 'city']) {
    const r = await pg.evaluate(async (map) => {
      window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = map; pendingSlot = 1; showScreen(null); newGame();
      zombies.length = 0; animals.length = 0; weather = 'none'; P.inside = false; P.dead = false;
      const t = trees.find(q => !bldAt(q.x, q.y) && !bldAt(q.x, q.y + 30));
      if (!t) return { none: true };
      const s = treeSprite(t.k | 0, Math.floor((t.seed || 0) * 4) & 3, false, treeAlt(t, t.k | 0));
      const wait = ms => new Promise(r => setTimeout(r, ms)), a = () => t._fa;
      const out = {};
      P.x = t.x + 60; P.y = t.y - 40; render(); out.livre = a();           // longe: opaca
      P.x = t.x; P.y = t.y - Math.min(10, s.top / 2); render(); out.primeiro = a(); // entrou atras da copa
      await wait(350); render(); out.depois = a();                      // ~0,35 s depois
      P.x = t.x + 60; P.y = t.y - 40; render(); out.saindo = a();      // saiu: nao salta de volta
      await wait(350); render(); out.fim = a();
      t._fn -= 5000; P.x = t.x; P.y = t.y - Math.min(10, s.top / 2); render(); out.retorno = a();   // sumiu da tela por muito tempo: ja comeca no valor certo
      return out;
    }, map);
    if (r.none) { console.log('SKIP', map, '(sem arvore livre)'); continue; }
    ok(r.livre === 1, map + ': longe da copa fica opaca (' + r.livre + ')');
    ok(r.primeiro > .9 && r.primeiro <= 1, map + ': primeiro quadro atras da copa ainda quase opaco, sem salto (' + r.primeiro.toFixed(3) + ')');
    ok(Math.abs(r.depois - .5) < .001, map + ': depois de ~0,35 s chega a 50% (' + r.depois.toFixed(3) + ')');
    ok(r.saindo < .6, map + ': ao sair a volta tambem e gradual (' + r.saindo.toFixed(3) + ')');
    ok(r.fim === 1, map + ': depois de ~0,35 s volta a 100% (' + r.fim + ')');
    ok(r.retorno === .5, map + ': arvore fora da tela por muito tempo comeca ja no valor certo (' + r.retorno + ')');
  }
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
