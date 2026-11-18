/* Lareira: casas e cabanas com chamine no telhado ganham lareira por dentro (acesa na neve; nos outros mapas de noite ou com chuva): aquece, assa, ilumina, solta fumaca.
   Uso: node tests/teste-lareira.js [index.html] [captura.png] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shot = process.argv[3];
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); const o = { map: {}, errado: 0, semChamine: 0, nParede: 0, conect: true };
    for (const map of ['forest', 'snow', 'city', 'desert']) {
      selectedMap = map; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
      let com = 0, lareira = 0, perdeu = 0, tot = 0;
      for (const bl of blds) {
        if (bl.type !== 'house' && bl.type !== 'cabin') continue; tot++;
        const L = bl._look || (bl._look = bldLook(bl)), temCh = L.ext.some(e => e === 'chimney' || e === 'chimneyStone');
        const fp = bl.furn.filter(f => f.k === 'fireplace');
        if (temCh && !L._noChim) { com++; if (fp.length === 1 && bl._hearth === fp[0]) lareira++; else o.errado++; }
        else { if (fp.length) o.semChamine++; if (temCh) perdeu++; }
        if (fp.length && !(fp[0].room && (fp[0].x === fp[0].room.x || fp[0].y === fp[0].room.y || fp[0].x + fp[0].w === fp[0].room.x + fp[0].room.w || fp[0].y + fp[0].h === fp[0].room.y + fp[0].room.h))) o.nParede++;
      }
      o.map[map] = { tot, com, lareira, perdeu };
    }
    return o;
  });
  console.log(JSON.stringify(r.map));
  ok(r.errado === 0, 'toda casa com chamine tem exatamente uma lareira'); ok(r.semChamine === 0, 'sem chamine, sem lareira'); ok(r.nParede === 0, 'lareira encostada na parede');
  ok(r.map.snow.lareira > 0 && r.map.forest.lareira > 0, 'neve e floresta tem casas com lareira'); ok(r.map.desert.lareira === 0, 'deserto sem lareira');
  // efeitos dentro de casa (mapa da neve)
  const e = await pg.evaluate(() => {
    selectedMap = 'snow'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
    const bl = blds.find(x => x._hearth); const f = bl._hearth; const o = {};
    P.inside = bl; P.x = f.x + f.w / 2; P.y = f.y + f.h + 8; P.inVehicle = null; P.hold = null; dark = 0;
    o.acesaNeve = hearthOn(bl); o.perto = !!hearthNear(P.x, P.y, 80); o.fogao = !!(nearestStove() && nearestStove().stove);
    const quente = envTemp(); P.x = bl.x + 12; P.y = bl.y + 12; const longe = hearthNear(P.x, P.y, 80); o.longe = !longe;
    P.x = f.x + f.w / 2; P.y = f.y + f.h + 8; o.quente = quente;
    P.inside = null; o.fora = !hearthNear(P.x, P.y, 80);
    // floresta: apagada de dia, acesa de noite
    selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
    const bf = blds.find(x => x._hearth); dark = 0; weather = 'none'; o.diaApagada = !hearthOn(bf); dark = .8; o.noiteAcesa = hearthOn(bf); dark = 0; weather = 'rain'; o.chuvaAcesa = hearthOn(bf); weather = 'none';
    // quebrar a lareira: apaga
    bf.furn.splice(bf.furn.indexOf(bf._hearth), 1); dark = .8; o.quebrada = !hearthOn(bf);
    return o;
  });
  ok(e.acesaNeve && e.perto, 'neve: lareira acesa e perto do jogador'); ok(e.fogao, 'lareira acesa serve para assar'); ok(e.longe && e.fora, 'longe ou fora de casa nao conta');
  ok(e.diaApagada && e.noiteAcesa && e.chuvaAcesa, 'floresta: apagada de dia, acesa de noite e na chuva'); ok(e.quebrada, 'lareira quebrada some');
  // aquece: comparar temperatura alvo perto e longe da lareira no mapa da neve
  const t = await pg.evaluate(() => {
    selectedMap = 'snow'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
    const bl = blds.find(x => x._hearth), f = bl._hearth; P.inVehicle = null;
    P.inside = null; P.x = bl.x - 80; P.y = bl.y - 80; const fora = envTemp();
    P.inside = bl; P.x = f.x + f.w / 2; P.y = f.y + f.h + 6; const perto = envTemp();
    return { fora, perto };
  });
  ok(t.perto > t.fora, 'perto da lareira esta mais quente (' + t.fora.toFixed(1) + ' -> ' + t.perto.toFixed(1) + ')');
  if (shot) {
    await pg.evaluate(() => {
      selectedMap = 'snow'; pendingSlot = 1; showScreen(null); newGame(); genWorld(31 * 7919);
      const bl = blds.find(x => x._hearth), f = bl._hearth; P.inside = bl; P.x = f.x + f.w / 2; P.y = f.y + f.h + 14; P.inVehicle = null;
      dark = .8; camX = P.x - W / 2 / Z; camY = P.y - H / 2 / Z; $('hud').classList.remove('hide');
    });
    await pg.evaluate(() => { for (let i = 0; i < 3; i++) { try { update(.05); } catch (e) { } } window.requestAnimationFrame = () => 0; try { draw(); } catch (e) { window.__e = e.message; } });
    await pg.screenshot({ path: shot });
  }
  ok(errs.length === 0, 'sem erros de pagina ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
