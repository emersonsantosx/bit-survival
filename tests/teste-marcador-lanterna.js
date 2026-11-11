/* Multiplayer: (1) o marcador de item so aparece para item no chao de fora ou quando o jogador esta DENTRO do comodo do item;
   (2) lanterna nao ilumina com o dono dormindo (nem no proprio jogo, nem no do aliado); (3) o feixe de um aliado que esta dentro de uma
   casa nao aparece para quem esta fora (a luz atravessava o telhado e entregava a posicao).
   Uso: node tests/teste-marcador-lanterna.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); zombies = []; animals = []; items.length = 0;
    MP.active = true; MP.connected = true; MP.conn = { open: true, send() {} }; state = 'play'; const o = {};
    const bl = blds.find(q => q.w > 60 && q.h > 60); o.bld = !!bl;
    const ix = bl.x + bl.w / 2, iy = bl.y + bl.h / 2;
    items.push({ t: 'wood', x: ix, y: iy });
    // de fora, encostado na parede (item a menos de 34 px)
    P.inside = null; P.x = bl.x - 6; P.y = iy; o.outsideNear = Math.hypot(ix - P.x, iy - P.y);
    P.x = ix - 20; P.y = iy; const pOut = { x: bl.x - 4, y: iy };   // posicao externa
    P.x = pOut.x; P.y = pOut.y; items[0].x = bl.x + 10; items[0].y = iy;   // item 14 px dentro da parede, jogador 4 px fora
    o.fora = !!pingCandidate();
    P.x = bl.x + 20; P.y = iy; P.inside = bl; o.dentro = !!pingCandidate();
    P.inside = null; items.length = 0; items.push({ t: 'wood', x: bl.x - 12, y: iy }); P.x = bl.x - 20; P.y = iy; o.itemFora = !!pingCandidate();   // item no chao de fora continua marcavel
    // lanterna
    items.length = 0; P.torch = true; P.flashOn = true; weather = 'clear'; T = DAY_SECONDS * .9; for (let i = 0; i < 30; i++) { T = DAY_SECONDS * .9; update(.05); }
    P.x = bl.x - 40; P.y = bl.y - 40; P.inside = null; camX = P.x - W / Z / 2; camY = P.y - H / Z / 2;
    const beams = (rp) => { remotePlayers.zz = Object.assign({ id: 'zz', face: 0, alive: true, lt: 1 }, rp); render(); const n = lightBeams().length; delete remotePlayers.zz; return n; };
    P.flashOn = false;
    o.remoteFora = beams({ x: P.x + 60, y: P.y });                                  // aliado fora: aparece (1)
    o.remoteDentroVisto = beams({ x: bl.x + bl.w / 2, y: bl.y + bl.h / 2 });          // aliado dentro, eu fora: nao aparece (0)
    o.remoteDormindo = beams({ x: P.x + 60, y: P.y, sl: [0, 0, 0, 1] });             // aliado dormindo: nao aparece (0)
    P.flashOn = true; render(); o.meuLigado = lightBeams().length;     // minha lanterna ligada: 1
    P.sleeping = { s: 0, hx: P.x, hy: P.y, tent: true, t: 0 }; render(); o.meuDormindo = lightBeams().length; // dormindo: 0
    o.pacote = packMyPlayer().lt; P.sleeping = null; o.pacoteAcordado = packMyPlayer().lt;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.bld, 'achou uma casa para testar');
  ok(!r.fora, 'de fora, perto da parede, o marcador de item NAO aparece');
  ok(r.dentro, 'dentro do comodo o marcador aparece');
  ok(r.itemFora, 'item no chao de fora continua podendo ser marcado');
  ok(r.remoteFora === 1, 'feixe de aliado ao ar livre aparece');
  ok(r.remoteDentroVisto === 0, 'feixe de aliado dentro da casa NAO aparece para quem esta fora');
  ok(r.remoteDormindo === 0, 'aliado dormindo nao ilumina');
  ok(r.meuLigado === 1 && r.meuDormindo === 0, 'minha lanterna apaga enquanto durmo');
  ok(r.pacote === 0 && r.pacoteAcordado === 1, 'dormindo, o jogo nao avisa o aliado que a lanterna esta ligada');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
