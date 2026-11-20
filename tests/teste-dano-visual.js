/* Dano visual nos objetos quebraveis: estagios pela vida que sobrou (a arma decide o estagio), marcas desenhadas em arvore, cerca, parede,
   tronco, objetos do mapa e moveis, e o aviso de dano chegando aos outros jogadores. */
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
    weatherTimer = 99999; zombies.length = 0; animals.length = 0; P.dead = false; P.hp = 100;
    // 1) estagios
    o.s = [dmgStage(5, 5), dmgStage(4, 5), dmgStage(3, 5), dmgStage(2, 5), dmgStage(1, 5), dmgStage(0, 5), dmgStage(undefined, 4)];
    // 2) a arma decide o estagio: machado (2 por golpe) deixa a arvore bem marcada logo no 1o golpe; maos (.4) mal marcam
    o.machado = dmgStage(4 - WEAPONS.axe.chopRate, 4); o.maos = dmgStage(4 - WEAPONS.fists.chopRate, 4); o.pica = dmgStage(5 - 1, 5);
    // 3) cada objeto desenha marcas diferentes do intacto
    const cv = document.getElementById('game') || document.querySelector('canvas');
    const snap = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) | 0; return s; };
    const base = P.x, by = P.y; const diffs = {};
    const test = (nome, setup, draw) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#336'; ctx.fillRect(0, 0, cv.width, cv.height);
      const A = setup(false); draw(A); const s0 = snap();
      ctx.fillStyle = '#336'; ctx.fillRect(0, 0, cv.width, cv.height);
      const B = setup(true); draw(B); const s1 = snap();
      diffs[nome] = s0 !== s1;
    };
    test('arvore', hurt => ({ x: 120, y: 160, hp: hurt ? 1 : undefined }), t => { const st = dmgStage(t.hp, 4); if (st) treeDmgFx(t, st); });
    test('cerca', hurt => ({ x: 7, y: 10, d: 'h', g: 0, hp: hurt ? 1 : undefined }), f => { if (f.hp !== undefined) fenceDmgFx(f); });
    test('parede', hurt => ({ x: 7, y: 10, d: 'h', g: 2, hp: hurt ? 1.5 : undefined }), f => { if (f.hp !== undefined) fenceDmgFx(f); });
    test('tronco', hurt => ({ x: 100, y: 100, a: 'h', hp: hurt ? 1 : undefined }), L => { if (L.hp !== undefined) logDmgFx(L); });
    for (const tp of ['bench', 'crate', 'barrier', 'snowman', 'sign', 'trash', 'cone', 'stump', 'mailbox', 'log'])
      test(tp, hurt => ({ x: 100, y: 100, type: tp, hp: hurt ? 0.5 : undefined }), d => { if (d.hp !== undefined) decorDmgFx(d); });
    for (const k of ['couch', 'fridge', 'toilet', 'hay', 'table'])
      test('movel-' + k, hurt => ({ k, x: 100, y: 100, w: 20, h: 12, hp: hurt ? 0.5 : undefined }), f => { if (f.hp !== undefined) furnDmgFx(f); });
    o.diffs = diffs;
    // 4) estagios sempre crescem: mais dano, mais pixels marcados
    const px = st => { ctx.fillStyle = '#336'; ctx.fillRect(0, 0, 300, 300); dmgFx('wood', 100, 100, 18, 10, st, 100, 100); const d = ctx.getImageData(95, 95, 30, 30).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] !== 0x33 || d[i + 1] !== 0x33 || d[i + 2] !== 0x66) n++; return n; };
    o.marcas = [1, 2, 3, 4].map(px);
    // 5) multiplayer: aviso de dano acha o objeto e so deixa a vida descer
    decorations.push({ x: 333, y: 444, type: 'crate', seed: .5 });
    structDmgRemote({ k: 'd:333,444,crate', hp: 1 }); const d0 = decorations.find(d => d.x === 333 && d.y === 444);
    o.hpRemoto = d0.hp; structDmgRemote({ k: 'd:333,444,crate', hp: 2.5 }); o.hpNaoSobe = d0.hp;
    o.find = structFind('d:333,444,crate') === d0 && structFind('d:1,1,xx') === null && structFind(5) === null;
    o.evtOk = NET_OK_EVT.has('structDmg');
    // 6) arvore ferida desenha dentro do render sem erro
    let t = trees[0]; t.hp = 1; const before = t.hp; for (let i = 0; i < 3; i++) render(); o.render = before === 1;
    return o;
  });
  ok(JSON.stringify(r.s) === '[0,1,2,3,4,4,0]', 'estagios 0 a 4 pela vida que sobrou (' + r.s.join(',') + ')');
  ok(r.machado >= 3 && r.maos <= 1 && r.pica === 1, 'o dano da arma define o estagio: machado ' + r.machado + ', maos ' + r.maos + ', picareta na pedra ' + r.pica);
  for (const k in r.diffs) ok(r.diffs[k], 'marcas de dano aparecem em: ' + k);
  ok(r.marcas[0] < r.marcas[3] && r.marcas.every((v, i, a) => !i || v >= a[i - 1]), 'quanto maior o estagio, mais marcas (' + r.marcas.join(',') + ')');
  ok(r.hpRemoto === 1 && r.hpNaoSobe === 1, 'aviso de dano dos outros jogadores aplica a vida e nao a "conserta"');
  ok(r.find && r.evtOk, 'structFind acha o objeto e o evento structDmg e aceito pela rede');
  ok(r.render, 'render com arvore ferida sem erro');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
