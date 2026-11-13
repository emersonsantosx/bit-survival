/* Dirigindo: o carro bate em cerca baixa, cerca de casa, portao e parede FECHADOS (antes a cerca baixa deixava o carro atravessar). Portao aberto deixa passar.
   Uso: node tests/teste-carro-cerca.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); zombies = []; animals = [];
    trees.length = 0; rocks.length = 0; items.length = 0; vehicles.length = 0; blds.length = 0; rebuildSolidGrid(); state = 'play';
    const o = {}; let row = 60;
    const dirige = (fx, fy, frames, dy = 8) => {   // carro 60 px a esquerda da cerca vertical na celula (fx,fy), acelerando para a direita
      const v = { id: 1, x: fx * 16 - 60, y: fy * 16 + dy, w: 36, h: 20, col: '#c33', looted: true, spd: 0, face: 0, hp: 100, maxHp: 100 };
      vehicles.length = 0; vehicles.push(v); P.inVehicle = v; P.x = v.x; P.y = v.y; touchGas = 1; touchSteer = 0;
      for (let i = 0; i < frames; i++) update(.05);
      touchGas = 0; const r = { x: v.x, hp: v.hp, wall: fx * 16, spd: v.spd, bl: !!bldAt(v.x,v.y), z: zombies.length }; P.inVehicle = null; vehicles.length = 0; return r;
    };
    const base = () => { const f = fenceList().slice(); for (const x of f) dropFence(x); };
    window.dropFence = (x) => fenceRemote({ x: x.x, y: x.y, d: x.d, g: -1, o: 0 });
    for (const [nome, g] of [['baixa', 0], ['reforcada', 1], ['parede', 2]]) {
      const fx = 60 + (row++ % 20) * 8, fy = 60 + (row % 10) * 8;
      for (let k = -2; k <= 2; k++) fenceRemote({ x: fx, y: fy + k, d: 'v', g, o: 0 });
      const d = dirige(fx, fy, 80); o[nome] = d.x < d.wall && d.hp < 100;   // parou antes da cerca e tomou dano da batida
      o[nome + "X"] = Math.round(d.x - d.wall); o[nome + "D"] = [d.hp, d.spd, d.bl];
    }
    // dois portoes lado a lado (vao de 2 celulas, cabe o carro): fechados barram, abertos deixam passar
    { const fx = 120, fy = 100; for (let k = -3; k <= 3; k++) fenceRemote({ x: fx, y: fy + k, d: 'v', g: 0, o: 0 });
      for (const k of [0, 1]) fenceRemote({ x: fx, y: fy + k, d: 'v', g: 3, o: 0 });
      let d = dirige(fx, fy, 80, 16); o.portaoFechado = d.x < d.wall;
      for (const k of [0, 1]) fenceRemote({ x: fx, y: fy + k, d: 'v', g: 3, o: 1 });
      d = dirige(fx, fy, 80, 16); o.portaoAbertoPassa = d.x > d.wall; }
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.baixa, 'cerca baixa barra o carro (' + r.baixaX + ')');
  ok(r.reforcada, 'cerca reforcada barra o carro (' + r.reforcadaX + ')');
  ok(r.parede, 'parede barra o carro (' + r.paredeX + ')');
  ok(r.portaoFechado, 'portao fechado barra o carro');
  ok(r.portaoAbertoPassa, 'portao aberto deixa o carro passar');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
