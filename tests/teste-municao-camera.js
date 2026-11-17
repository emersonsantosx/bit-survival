/* Caixa de municao e armas de fogo dao 20 de municao; a camera se afasta (ate 30%) com a velocidade do carro e volta ao normal. Uso: node tests/teste-municao-camera.js [index.html] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    zombies.length = 0; weatherTimer = 99999; P.dead = false; P.hp = 100; P.inside = null; items.length = 0;
    const o = {};
    // municao
    P.ammo = 0; items.push({ t: 'ammo', x: P.x + 3, y: P.y }); update(.02); updateHud(true); pickup(); o.municao = P.ammo;
    P.ammo = 0; items.push({ t: 'ammo', x: P.x + 3, y: P.y }); pickup(); o.municao2 = P.ammo;
    // armas de fogo: nova e repetida dao 20 de municao
    P.firearms = {}; P.ammo = 0; items.push({ t: 'smg', x: P.x + 3, y: P.y }); pickup(); o.armaNova = P.ammo;
    P.ammo = 0; items.push({ t: 'smg', x: P.x + 3, y: P.y }); pickup(); o.armaRep = P.ammo;
    // camera (o carro fica parado no lugar, so a velocidade e simulada: assim nenhuma batida tira o jogador do carro)
    vehicles.length = 0;
    const X0 = P.x, Y0 = P.y; const veh = { kind: 'car', x: P.x, y: P.y, face: 0, spd: 0, hp: 100, maxHp: 100, driverId: null };
    vehicles.push(veh); P.inVehicle = veh; veh.driverId = myNetId();
    const top = vehSpec(veh).top; const roda = (spd, s) => { for (let i = 0; i < s * 30; i++) { veh.x = X0; veh.y = Y0; veh.hp = 100; veh.spd = spd; P.x = X0; P.y = Y0; update(1 / 30); render(); } };
    o.Z0 = Z0; roda(0, 3); o.parado = Z;
    roda(top * .07, 3); o.lento = Z;                   // abaixo de 10% da velocidade maxima nao mexe
    roda(top, 1); o.abrindo = Z; roda(top, 4); o.rapido = Z; o.visao = W / Z; o.visao0 = W / Z0;
    roda(0, 1.5); o.fechando = Z; roda(0, 5); o.voltou = Z;
    roda(top, 4); o.aindaNoCarro = !!P.inVehicle; o.zAntes = Z; P.inVehicle = null; update(.03); o.saiu1 = Z; for (let i = 0; i < 200; i++) { update(1 / 30); render(); } o.saiu2 = Z;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.municao === 20 && r.municao2 === 20, 'cada caixa de municao dá 20 (' + r.municao + ', ' + r.municao2 + ')');
  ok(r.armaNova === 20 && r.armaRep === 20, 'pegar arma de fogo (nova ou repetida) da 20 de municao (' + r.armaNova + ', ' + r.armaRep + ')');
  ok(Math.abs(r.parado - r.Z0) < 1e-6 && Math.abs(r.lento - r.Z0) < 1e-6, 'parado ou devagar a camera fica normal');
  ok(r.abrindo < r.Z0 && r.abrindo > r.rapido, 'ao acelerar a camera abre aos poucos (' + r.abrindo.toFixed(2) + ' > ' + r.rapido.toFixed(2) + ')');
  ok(r.rapido < r.Z0 * .74 && r.rapido > r.Z0 * .66, 'em velocidade maxima se afasta ate cerca de 30% (' + (1 - r.rapido / r.Z0).toFixed(2) + ')');
  ok(r.visao > r.visao0 * 1.35, 'a area visivel aumenta (' + r.visao0.toFixed(0) + ' -> ' + r.visao.toFixed(0) + ')');
  ok(r.fechando > r.rapido && r.fechando < r.Z0 && Math.abs(r.voltou - r.Z0) < 1e-3, 'ao desacelerar volta suave ao normal');
  ok(r.saiu1 < r.Z0 && Math.abs(r.saiu2 - r.Z0) < 1e-3, 'ao sair do carro a camera tambem volta ao normal');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
