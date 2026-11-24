/* Sangue de zumbi: poca em pixel art com varias formas no chao (sorteada so pela posicao) e nuvem recortada pela agua em lagos/oasis.
   So aparencia: o save continua guardando [x, y, vida] e a lista continua limitada a 24 manchas.
   Uso: node tests/teste-sangue-zumbis.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 640, height: 360 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear(); selectedMap = 'desert'; pendingSlot = 1; showScreen(null); newGame(); state = 'play'; zombies.length = 0; animals.length = 0;
    const lk = lakes.find(l => !l.fountain) || lakes[0];
    // formas: varias formas diferentes e a mesma posicao sempre a mesma forma
    const vistas = new Set(); for (let i = 0; i < 60; i++) { const s = bloodDecalShape({ x: 100 + i * 13.7, y: 50 + i * 7.3 }); vistas.add(s.f + '/' + s.fx + '/' + s.fy); }
    o.variantes = vistas.size; const s1 = bloodDecalShape({ x: 321.4, y: 88.8 }), s2 = bloodDecalShape({ x: 321.4, y: 88.8 }); o.estavel = JSON.stringify(s1) === JSON.stringify(s2);
    // desenho: grava o que foi pintado (retangulos) e confere
    const rects = []; const fill = ctx.fillRect.bind(ctx); ctx.fillRect = (x, y, w, h) => { rects.push([x, y, w, h, ctx.globalAlpha]); };
    // chao longe da agua
    let gx = lk.cx + lk.r * 2.6, gy = lk.cy; const dg = { x: gx, y: gy, l: 45 }; rects.length = 0; drawBloodDecal(dg);
    o.chaoDesenha = rects.length > 3 && dg.w === false && rects.every(q => q[4] > 0);
    // seca com o tempo: cor muda de fresca para seca
    const cores = []; const sf = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
    ctx.fillRect = (x, y, w, h) => { cores.push(ctx.fillStyle); };
    drawBloodDecal({ x: gx, y: gy, l: 44 }); const fresca = cores.slice(); cores.length = 0; drawBloodDecal({ x: gx, y: gy, l: 14 }); o.seca = JSON.stringify(fresca) !== JSON.stringify(cores);
    // agua: nuvem, so dentro do lago, e some mais cedo que a poca
    const dw = { x: lk.cx, y: lk.cy, l: 40 }; rects.length = 0; ctx.fillRect = (x, y, w, h) => { rects.push([x, y, w, h, ctx.globalAlpha]); }; drawBloodDecal(dw);
    o.aguaClass = dw.w === true; o.aguaDesenha = rects.length > 10;
    let fora = 0; for (const [x, y, w, h] of rects) for (let k = 0; k < w; k++) if (!pointInLake(x + k + .5, y + .5)) fora++; o.foraDaAgua = fora;
    rects.length = 0; drawBloodDecal({ x: lk.cx, y: lk.cy, l: 12 }); o.aguaSome = rects.length === 0;
    rects.length = 0; drawBloodDecal({ x: gx, y: gy, l: 12 }); o.pocaAindaVisivel = rects.length > 0;
    ctx.fillRect = fill;
    // jogo: matar zumbi cria mancha, limite de 24 e save no mesmo formato
    decals.length = 0; for (let i = 0; i < 30; i++) { decals.push({ x: i, y: i, l: DECAL_LIFE }); if (decals.length > 24) decals.shift(); } o.limite = decals.length === 24;
    const copia = decals.map(d => [d.x, d.y, d.l]); o.formatoSave = copia.every(a => a.length === 3);
    return o;
  });
  ok(r.variantes >= 12, 'muitas variacoes de poca (formas e espelhamentos): ' + r.variantes);
  ok(r.estavel, 'a mesma posicao sempre da a mesma poca (igual em todas as telas)');
  ok(r.chaoDesenha, 'no chao desenha a poca');
  ok(r.seca, 'a cor muda de fresca para seca com o tempo');
  ok(r.aguaClass && r.aguaDesenha, 'mancha dentro do lago vira nuvem na agua');
  ok(r.foraDaAgua === 0, 'a nuvem nao passa do contorno da agua (' + r.foraDaAgua + ' pixels fora)');
  ok(r.aguaSome && r.pocaAindaVisivel, 'a nuvem some antes da poca do chao');
  ok(r.limite && r.formatoSave, 'limite de 24 manchas e formato do save [x, y, vida] mantidos');
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
