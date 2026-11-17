/* Botao de pegar mostra o icone do item e, com varios itens juntos, aparecem icones extras: tocar pega aquele item. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    zombies.length = 0; weatherTimer = 99999; P.dead = false; P.hp = 100; P.inside = null; P.face = 0; items.length = 0; P.inv.length = 0;
    const px = () => $('pickx'), btns = () => [...px().querySelectorAll('button')];
    const iconPick = () => $('pick').dataset.ic;
    const ponha = l => { items.length = 0; for (const [t, dx, dy] of l) items.push({ t, x: P.x + dx, y: P.y + dy }); update(.02); update(.02); updateHud(true); };
    // 1 item: o botao mostra o icone dele, sem icones extras
    ponha([['food', 5, 0]]); o.icone1 = iconPick(); o.esperado1 = ITEMS.food.e; o.extras1 = btns().length;
    // 2 itens juntos: botao = o mais perto; 1 icone extra para o outro
    ponha([['food', 5, 0], ['water', -4, 3]]);
    o.alvo = pickTarget().it.t; o.extras2 = btns().length; o.extraNome = btns()[0] && btns()[0].getAttribute('aria-label');
    // toque no extra (evento de verdade): pega a agua, a lata de feijao fica no chao
    btns()[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    o.pegouAgua = P.inv.some(s => s.t === 'water'); o.feijaoNoChao = items.some(i => i.t === 'food'); o.naoPegouFeijao = !P.inv.some(s => s.t === 'food');
    updateHud(true); o.extrasDepois = btns().length;
    // 5 itens: no maximo 3 extras (alem do que o botao mostra)
    ponha([['food', 3, 0], ['water', 5, 2], ['meat', -5, 2], ['bandage', 6, -3], ['corn', -6, -4]]); o.extras5 = btns().length;
    // item longe nao aparece
    ponha([['food', 3, 0], ['water', 80, 0]]); o.extrasLonge = btns().length;
    // morto ou dentro de veiculo: sem icones
    ponha([['food', 3, 0], ['water', -3, 2]]); P.dead = true; updateHud(true); o.extrasMorto = btns().length; P.dead = false;
    // o botao de pegar continua funcionando: pega o mais perto
    ponha([['food', 3, 0], ['water', -9, 2]]); pickup(); o.botaoPegouPerto = P.inv.some(s => s.t === 'food') && !P.inv.some(s => s.t === 'meat');
    return o;
  });
  ok(r.icone1 === r.esperado1 && r.extras1 === 0, 'com 1 item o botao mostra o icone do item (' + r.icone1 + ') e nao ha extras');
  ok(r.alvo === 'food' && r.extras2 === 1 && /Água/i.test(r.extraNome || ''), 'com 2 itens ha 1 icone extra para o outro (' + r.extraNome + ')');
  ok(r.pegouAgua && r.feijaoNoChao && r.naoPegouFeijao, 'tocar no icone extra pega aquele item e deixa o outro no chao');
  ok(r.extrasDepois === 0, 'depois de pegar os extras somem');
  ok(r.extras5 === 3, 'no maximo 3 icones extras (' + r.extras5 + ')');
  ok(r.extrasLonge === 0, 'item longe nao ganha icone');
  ok(r.extrasMorto === 0, 'sem icones quando o jogador esta morto');
  ok(r.botaoPegouPerto, 'o botao de pegar continua pegando o item mais perto');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
