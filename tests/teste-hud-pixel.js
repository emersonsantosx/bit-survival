/* HUD pixel art: a nova aparencia (css/hud-pixel.css) nao mexe em funcao nem em tamanho.
   - todos os elementos da HUD continuam existindo com os mesmos IDs e as mesmas medidas (so o visual mudou);
   - fonte BitHUD e sprites carregam; o pixel da HUD (--hu e --tu) cai num numero inteiro de pixels fisicos;
   - todo botao usa moldura em sprite (sem arredondado, sem fundo preto translucido); texto usa a fonte pixel;
   - estados: pressionado, selecionado (ouro) e indisponivel trocam de sprite; o toque continua chegando na logica (atacar segura/solta);
   - nenhum controle se sobrepoe a outro.
   Uso: node tests/teste-hud-pixel.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(400);
  await pg.evaluate(() => {
    localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame();
    P.pack = true; P.torch = true; P.tool = 'hoe';
    for (const [t, n] of [['bandage', 3], ['wood', 19], ['water', 20]]) addItem(t, n);
    document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true); toast('Clima limpo');
    const w = document.getElementById('wpn'); w.classList.add('chg'); w.style.animation = 'none'; w.style.opacity = 1;
  });
  await pg.waitForTimeout(400);

  /* 1) elementos e medidas (ui = 1 neste tamanho de tela) */
  const med = await pg.evaluate(() => {
    const o = {}; for (const id of ['atk', 'pick', 'run', 'swap', 'tools', 'hoe', 'bpack', 'bpause', 'bcraft', 'bflash', 'inv', 'toast', 'wpn', 'twn', 'stat']) {
      const e = document.getElementById(id); if (!e) { o[id] = null; continue; } const r = e.getBoundingClientRect(); o[id] = [Math.round(r.width), Math.round(r.height)];
    } return o;
  });
  for (const id in med) ok(med[id] !== null, 'existe #' + id);
  ok(med.atk[0] === 88 && med.atk[1] === 88, 'atacar continua 88x88');
  ok(med.pick[0] === 64 && med.run[0] === 64 && med.hoe[0] === 64, 'interagir, correr e arar continuam 64x64');
  ok(med.swap[0] === 58, 'trocar arma continua 58x58');
  ok(med.bpause[0] === 36 && med.bpause[1] === 32, 'pausa continua 36x32');
  const slot = await pg.evaluate(() => { const r = document.querySelector('#inv .slot').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  ok(slot[0] === 36 && slot[1] === 33, 'slot do inventario continua 36x33');

  /* 2) fonte, sprites e pixel inteiro */
  const rec = await pg.evaluate(async () => {
    await document.fonts.ready;
    const cs = getComputedStyle(document.documentElement), dpr = window.devicePixelRatio || 1;
    const hu = parseFloat(cs.getPropertyValue('--hu')), tu = parseFloat(cs.getPropertyValue('--tu'));
    return { font: document.fonts.check('10px BitHUD'), hu, tu, huFis: hu * dpr, tuFis: tu * dpr, sprite: cs.getPropertyValue('--hs-wood-2u').indexOf('data:image/png') > 0, ponta: cs.getPropertyValue('--hs-ponta').indexOf('data:image/png') > 0 };
  });
  ok(rec.font, 'fonte BitHUD carregada');
  ok(rec.sprite && rec.ponta, 'sprites das molduras carregados');
  ok(Math.abs(rec.huFis - Math.round(rec.huFis)) < 1e-6 && rec.huFis >= 1, 'pixel da moldura (--hu) = numero inteiro de pixels fisicos (' + rec.huFis + ')');
  ok(Math.abs(rec.tuFis - Math.round(rec.tuFis)) < 1e-6 && rec.tuFis >= 1, 'pixel do texto (--tu) = numero inteiro de pixels fisicos (' + rec.tuFis + ')');

  /* 3) todo controle usa moldura em sprite, sem canto redondo nem fundo escuro translucido */
  const est = await pg.evaluate(() => {
    const sels = ['#atk', '#pick', '#run', '#swap', '#tools', '#hoe', '#bpack', '#bpause', '#bcraft', '#bflash', '#inv .slot', '#toast', '#wpn', '#twn'];
    const r = {}; for (const s of sels) { const e = document.querySelector(s); const c = getComputedStyle(e); r[s] = { img: c.borderImageSource.indexOf('data:image/png') > 0, rad: c.borderTopLeftRadius, bg: c.backgroundColor }; } return r;
  });
  for (const s in est) ok(est[s].img && /^0px$/.test(est[s].rad) && /rgba\(0, 0, 0, 0\)|transparent/.test(est[s].bg), 'moldura em sprite, sem arredondado e sem fundo preto: ' + s);
  const fam = await pg.evaluate(() => ['#toast', '#wpn', '#inv .slot .count', '#bpack b'].map(s => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily.indexOf('BitHUD') >= 0 : true; }));
  ok(fam.every(Boolean), 'textos da HUD usam a fonte pixel');

  /* 4) estados: pressionado, selecionado, indisponivel */
  const sp = await pg.evaluate(() => {
    const src = e => getComputedStyle(e).borderImageSource;
    const sl = document.querySelector('#inv .slot'); const normal = src(sl); sl.classList.add('held'); const held = src(sl); sl.classList.remove('held');
    const a = document.getElementById('atk'); const antes = src(a); a.classList.add('on'); const press = src(a); a.classList.remove('on');
    const p = document.getElementById('pick'); const pn = src(p); p.classList.add('hot'); const ph = src(p); p.classList.remove('hot');
    const f = document.getElementById('bflash'); const fn = src(f); f.classList.add('on'); const fo = src(f); f.classList.remove('on');
    const px = document.getElementById('pickx'); px.innerHTML = '<button class="btn no" aria-label="x"></button><button class="btn" aria-label="y"></button>';
    const no = src(px.children[0]), yes = src(px.children[1]);
    return { held: held !== normal, press: press !== antes, hot: ph !== pn, flash: fo !== fn, no: no !== yes };
  });
  ok(sp.held, 'item selecionado: moldura ouro'); ok(sp.press, 'pressionado: sprite afundado'); ok(sp.hot, 'interagir com alvo ao alcance: moldura ouro');
  ok(sp.flash, 'lanterna ligada: moldura ouro'); ok(sp.no, 'item que nao da para pegar: moldura cinza');

  /* 5) o toque continua chegando na logica (atacar segura e solta) */
  const a = await pg.evaluate(() => { const r = document.getElementById('atk').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] }); await pg.waitForTimeout(120);
  ok(await pg.evaluate(() => document.getElementById('atk').classList.contains('on') && atkHeld === true), 'tocar em atacar liga atkHeld e a classe .on');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pg.waitForTimeout(120);
  ok(await pg.evaluate(() => !document.getElementById('atk').classList.contains('on') && atkHeld === false), 'soltar desliga atkHeld e a classe .on');

  /* 6) sem sobreposicao entre controles (a moldura quadrada deixa visivel o que o botao redondo escondia) */
  const ov = await pg.evaluate(() => {
    const vis = []; for (const id of ['atk', 'pick', 'run', 'swap', 'tools', 'hoe', 'bpack', 'bpause', 'bcraft', 'bflash']) { const e = document.getElementById(id); if (!e || e.classList.contains('hide')) continue; const b = e.getBoundingClientRect(); if (b.width) vis.push([id, b]); }
    document.querySelectorAll('#inv .slot').forEach((e, i) => vis.push(['slot' + i, e.getBoundingClientRect()]));
    const c = []; for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const A = vis[i][1], B = vis[j][1]; if (A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1) c.push(vis[i][0] + 'x' + vis[j][0]); } return c;
  });
  ok(ov.length === 0, 'sem sobreposicao entre controles' + (ov.length ? ': ' + ov : ''));
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
