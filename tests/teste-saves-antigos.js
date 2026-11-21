/* Saves antigos: o que acontece quando o jogador atualiza o jogo e abre um save feito por uma versao anterior.
   Regras que o jogo segue (js/10) e que este teste protege:
   - save de OUTRA versao nao e carregado nem apagado (o jogador pode recuperar com a versao certa);
   - save da versao atual, mas feito antes de campos novos existirem (plantacao, poco, bau, cerca...), carrega com o padrao;
   - jogador com poucos campos recebe os valores padrao; nomes antigos de item (sword) viram os novos (katana);
   - o save do slot unico (antes dos 4 slots) vai para o primeiro slot livre, uma vez so;
   - se o carregamento falhar no meio, o jogo NAO pode apagar o save (continueGame chama clearSave no catch: aqui isso e conferido).
   Uso: node tests/teste-saves-antigos.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
const MAPS = ['forest', 'snow', 'desert', 'city'];
/* campos do save que o carregamento trata como opcionais (nem todo save antigo os tem) */
const OPCIONAIS = ['tn', 'rn', 'tents', 'chests', 'rl', 'ice', 'plots', 'fr', 'gh', 'br', 'fn', 'pf', 'doors', 'bx', 'wl', 'lg', 'decals', 'inVeh', 'sk', 'weather', 'weatherTimer', 'spawnTimer', 'day', 'kills'];
(async () => {
  const b = await chromium.launch(); let falhas = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHOU ') + m); if (!c) falhas++; };
  for (const map of MAPS) {
    const pg = await (await b.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
    pg.on('console', m => { if (m.type() === 'error' && /\[(continueGame|save|newGame)\]/.test(m.text())) errs.push(m.text()); });
    await pg.goto('file://' + file); await pg.waitForFunction(() => typeof newGame === 'function' && typeof continueGame === 'function' && document.readyState === 'complete');
    await pg.evaluate((m) => {
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = m; pendingSlot = 1; showScreen(null); newGame(); saveGame();
      window.__base = localStorage.getItem('minisurv_save_1');
      /* tenta carregar o slot 1 com a alteracao fn(save); devolve o que sobrou */
      window.__tenta = (fn, slot) => {
        slot = slot || 1; const d = JSON.parse(window.__base); fn(d);
        localStorage.setItem('minisurv_save_' + slot, typeof d === 'string' ? d : JSON.stringify(d));
        state = 'menu'; P = null; curSlot = 0;
        continueGame(slot);
        return { state, guardado: !!localStorage.getItem('minisurv_save_' + slot), hp: P && P.hp, food: P && P.food, inv: P && P.inv, weapon: P && P.weapon, itens: items.map(i => i.t), dia: day };
      };
    }, map);

    // 1) tudo que e opcional ausente de uma vez: carrega
    let r = await pg.evaluate((op) => window.__tenta(d => { for (const k of op) delete d[k]; }), OPCIONAIS);
    ok(r.state === 'play' && r.guardado, map + ': save sem nenhum campo opcional carrega (' + r.state + ')');
    ok(r.dia === 1, map + ': dia ausente vira dia 1');

    // 2) jogador minimo: so vida e posicao
    r = await pg.evaluate(() => window.__tenta(d => { d.P = { x: d.P.x, y: d.P.y, hp: 80 }; }));
    ok(r.state === 'play' && r.hp === 80 && r.food === 85 && Array.isArray(r.inv), map + ': jogador com poucos campos recebe fome, sede e mochila padrao');

    // 3) nomes antigos: sword vira katana; item que nao existe mais some
    r = await pg.evaluate(() => {
      const o = window.__tenta(d => {
        window.__k0 = d.items.filter(a => a[0] === 'katana').length;   // o mapa pode ja ter katanas no chao: conta antes para comparar
        d.P.inv = [{ t: 'sword', n: 1 }, { t: 'item_que_nao_existe', n: 2 }]; d.P.weapon = 'sword'; d.P.meleeWeapons = ['sword']; d.P.melee = 'sword';
        d.items.push(['sword', d.P.x + 30, d.P.y + 30], ['item_que_nao_existe', d.P.x + 40, d.P.y + 40]);
      });
      o.k0 = window.__k0; return o;
    });
    ok(r.state === 'play' && r.inv.some(s => s.t === 'katana') && !r.inv.some(s => s.t === 'sword' || s.t === 'item_que_nao_existe'), map + ': mochila: sword vira katana e item inexistente some');
    ok(r.weapon === 'katana', map + ': arma equipada sword vira katana');
    ok(r.itens.filter(t => t === 'katana').length === r.k0 + 1 && !r.itens.includes('sword') && !r.itens.includes('item_que_nao_existe'), map + ': item no chao: sword vira katana (' + r.k0 + ' antes, ' + r.itens.filter(t => t === 'katana').length + ' depois) e item inexistente some');

    // 4) versao diferente: nao carrega e NAO apaga
    for (const v of [4, 6]) {
      r = await pg.evaluate((v) => { const o = window.__tenta(d => { d.v = v; }); o.continuar = (refreshContinue(), document.getElementById('menu').classList.contains('hasSave')); return o; }, v);
      ok(r.state !== 'play' && r.guardado, map + ': save da versao ' + v + ' nao carrega e continua guardado');
      ok(r.continuar === false, map + ': save da versao ' + v + ' nao liga o botao CONTINUAR');
    }

    // 5) campo obrigatorio ausente: nao carrega e NAO apaga
    r = await pg.evaluate(() => window.__tenta(d => { delete d.trees; }));
    ok(r.state !== 'play' && r.guardado, map + ': save sem a lista de arvores nao carrega e continua guardado');

    // 6) JSON quebrado: nao derruba o jogo
    r = await pg.evaluate(() => { localStorage.setItem('minisurv_save_1', '{quebrado'); state = 'menu'; continueGame(1); return { state }; });
    ok(r.state !== 'play', map + ': save com JSON quebrado nao carrega e nao trava');

    // 7) save do slot unico (formato anterior aos 4 slots) vai para o primeiro slot livre, uma vez so
    r = await pg.evaluate(() => {
      for (let n = 1; n <= 4; n++) localStorage.removeItem('minisurv_save_' + n);
      localStorage.setItem('minisurv_save', window.__base); migrateSaves(); migrateSaves();
      const a = { s1: localStorage.getItem('minisurv_save_1') === window.__base, legado: localStorage.getItem('minisurv_save'), s2: localStorage.getItem('minisurv_save_2') };
      localStorage.setItem('minisurv_save', window.__base); migrateSaves();   // com o slot 1 ocupado: vai para o 2
      a.s2depois = localStorage.getItem('minisurv_save_2') === window.__base; a.legado2 = localStorage.getItem('minisurv_save');
      state = 'menu'; continueGame(2); a.state = state;
      return a;
    });
    ok(r.s1 && r.legado === null && r.s2 === null, map + ': save do slot unico vai para o slot 1 e a chave antiga some');
    ok(r.s2depois && r.legado2 === null, map + ': com o slot 1 ocupado, o save antigo vai para o slot 2');
    ok(r.state === 'play', map + ': save migrado para o slot 2 carrega');

    // 8) um campo opcional por vez (so na floresta, para nao demorar)
    if (map === 'forest') {
      const ruins = [];
      for (const k of OPCIONAIS) {
        const o = await pg.evaluate((k) => window.__tenta(d => { delete d[k]; }), k);
        if (!(o.state === 'play' && o.guardado)) ruins.push(k);
      }
      ok(ruins.length === 0, map + ': cada campo opcional ausente, um por vez, ainda carrega' + (ruins.length ? ' (falham: ' + ruins.join(', ') + ')' : ''));
    }
    ok(errs.length === 0, map + ': sem erros de JS nem falha de carregamento' + (errs.length ? ' -> ' + errs[0] : ''));
    await pg.context().close();
  }
  await b.close();
  console.log(falhas ? '\n' + falhas + ' falha(s)' : '\nTodos os testes passaram');
  process.exit(falhas ? 1 : 0);
})();
