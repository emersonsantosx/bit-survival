/* Missoes (js/15): 3 missoes por partida, uma de cada grupo (MS_GROUPS).
   Confere: a lista vem so da semente (os dois jogadores veem a mesma, sem rede), cada missao tem alvo valido, o progresso soma e para no alvo,
   evento de fora da lista nao soma, missao concluida nao soma mais, a proxima missao do mesmo espaco aparece depois, e continuar um jogo salvo nao quebra a lista.
   Observacao (comportamento atual, nao regra): as missoes NAO entram no save; ao continuar, a lista e sorteada de novo e o progresso volta a zero.
   Uso: node tests/teste-missoes.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
const MAPS = ['forest', 'snow', 'desert', 'city'];
(async () => {
  const b = await chromium.launch(); let falhas = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHOU ') + m); if (!c) falhas++; };
  for (const map of MAPS) {
    const pg = await (await b.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
    await pg.goto('file://' + file); await pg.waitForFunction(() => typeof newGame === 'function' && typeof track === 'function' && document.readyState === 'complete');
    const r = await pg.evaluate((m) => {
      const o = {};
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = m; pendingSlot = 1; showScreen(null); newGame();
      o.estrutura = !!MS && MS.slots.length === 3 && MS.slots.every(s => s.k === 0 && s.prog === 0 && s.done === false);
      // cada missao: evento do grupo certo, alvo inteiro positivo, texto com o alvo
      o.defsOk = true; o.defsRuins = [];
      for (let i = 0; i < 3; i++) for (let k = 0; k < 9; k++) {
        const d = msDef(i, k);
        if (!(MS_GROUPS[i].includes(d.ev) && Number.isInteger(d.target) && d.target > 0 && d.text.includes(String(d.target)))) { o.defsOk = false; o.defsRuins.push(i + ',' + k); }
      }
      // mesma semente = mesma lista, mesmo que o Math.random mude no meio (nada de sorteio na lista)
      const lista = () => [0, 1, 2].flatMap(i => [0, 1, 2, 3, 4].map(k => JSON.stringify(msDef(i, k))));
      const a = lista(); for (let i = 0; i < 50; i++) Math.random(); const b2 = lista();
      const seed = MS.seed; const guarda = MS; MS = { seed, slots: [{ k: 0, prog: 0, done: false }, { k: 0, prog: 0, done: false }, { k: 0, prog: 0, done: false }] }; const c = lista(); MS = guarda;
      o.mesmaLista = a.join() === b2.join() && a.join() === c.join();
      // progresso soma e para no alvo
      const d0 = msDef(0, 0), d1 = msDef(1, 0), d2 = msDef(2, 0);
      track(d0.ev, d0.target - 1); o.meio = { prog: MS.slots[0].prog, done: MS.slots[0].done, alvo: d0.target };
      track(d0.ev, 1); o.fim = { prog: MS.slots[0].prog, done: MS.slots[0].done };
      track(d0.ev, 5); o.depois = { prog: MS.slots[0].prog, k: MS.slots[0].k };
      o.concl1 = ACHD.s.missionDone | 0;
      msAdd(0, 0, 5); o.concl2 = ACHD.s.missionDone | 0;   // chamada direta: missao ja concluida nao pode concluir de novo (nem contar conquista em dobro)
      track(d1.ev, 9999); o.excesso = { prog: MS.slots[1].prog, alvo: d1.target, done: MS.slots[1].done }; o.concl3 = ACHD.s.missionDone | 0;
      // evento que nao esta entre as tres missoes ativas
      const ativos = [d0.ev, d1.ev, d2.ev], fora = Object.keys(MS_DEF).find(e => !ativos.includes(e) && !MS_DEF[e].local);
      const antes = JSON.stringify(MS.slots); track(fora, 3); o.foraDaLista = JSON.stringify(MS.slots) === antes; o.foraEv = fora;
      // continuar um jogo salvo: a lista continua valida
      MS.slots[2].prog = 0; saveGame(); state = 'menu'; continueGame(1);
      o.aposContinuar = state === 'play' && !!MS && MS.slots.length === 3 && MS.slots.every(s => Number.isInteger(s.k) && s.prog >= 0);
      return o;
    }, map);
    ok(r.estrutura, map + ': comeca com 3 missoes zeradas');
    ok(r.defsOk, map + ': todas as missoes (3 espacos, 9 niveis) tem evento do grupo, alvo valido e texto com o alvo' + (r.defsRuins.length ? ' (ruins: ' + r.defsRuins.join(' ') + ')' : ''));
    ok(r.mesmaLista, map + ': a lista depende so da semente (igual nos dois jogadores)');
    ok(r.meio.prog === r.meio.alvo - 1 && !r.meio.done, map + ': progresso soma sem concluir antes do alvo');
    ok(r.fim.prog === r.meio.alvo && r.fim.done, map + ': conclui ao chegar no alvo');
    ok(r.depois.prog === r.meio.alvo && r.depois.k === 0, map + ': missao concluida nao soma mais');
    ok(r.concl1 === 1 && r.concl2 === 1 && r.concl3 === 2, map + ': cada missao concluida conta uma vez so nas conquistas (' + r.concl1 + ', ' + r.concl2 + ', ' + r.concl3 + ')');
    ok(r.excesso.prog === r.excesso.alvo && r.excesso.done, map + ': progresso para no alvo mesmo com excesso');
    ok(r.foraDaLista, map + ': evento fora das missoes ativas (' + r.foraEv + ') nao muda nada');
    ok(r.aposContinuar, map + ': continuar um jogo salvo deixa a lista de missoes valida');
    if (map === 'forest') {
      // a proxima missao do mesmo espaco entra 3,5 s depois de concluir
      const p = await pg.evaluate(() => { newGame(); const d = msDef(0, 0); track(d.ev, d.target); return { logo: MS.slots[0].k }; });
      await pg.waitForTimeout(3800);
      const q = await pg.evaluate(() => ({ k: MS.slots[0].k, prog: MS.slots[0].prog, done: MS.slots[0].done }));
      ok(p.logo === 0 && q.k === 1 && q.prog === 0 && q.done === false, map + ': apos 3,5 s a proxima missao do espaco entra zerada (nivel ' + q.k + ')');
    }
    ok(errs.length === 0, map + ': sem erros de JS' + (errs.length ? ' -> ' + errs[0] : ''));
    await pg.context().close();
  }
  await b.close();
  console.log(falhas ? '\n' + falhas + ' falha(s)' : '\nTodos os testes passaram');
  process.exit(falhas ? 1 : 0);
})();
