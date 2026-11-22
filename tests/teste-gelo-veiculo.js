/* Gelo do lago (mapa de Neve) com veiculo: o veiculo pesa e quebra o gelo, parado ou andando devagar, como quebra com o jogador a pe.
   Antes o iceTick saia direto se o jogador estava num veiculo, entao dirigir ou deixar o veiculo no gelo nunca quebrava nada.
   Confere: veiculo parado com o jogador dentro rachando (estala) e quebrando mais rapido que a pe, abrindo dois buracos e zerando a velocidade;
   veiculo vazio parado tambem (jogo solo); em velocidade passando rapido nao quebra; fora do gelo nao acumula tensao; guest do multiplayer nao conta veiculo parado.
   Uso: node tests/teste-gelo-veiculo.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 700, height: 420 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); selectedMap = 'snow'; pendingSlot = 1; showScreen(null); newGame();
    zombies.length = 0; animals.length = 0; weather = 'none';
    const l = lakes.find(q => q.frozen && !q.fountain); const q = iceOf(l);
    const reset = () => { l.holes = []; if (l._st) l._st.clear(); };
    const sec = (fn, max) => { let t = 0; while (t < max) { fn(); iceTick(1 / 30); t += 1 / 30; if (l.holes && l.holes.length) return t; } return -1; };
    const o = {};
    const v = vehicles[0] || (vehicles[0] = { x: 0, y: 0, face: 0, w: 36, h: 20, spd: 0, hp: 100 });
    // a pe parado no meio do gelo
    reset(); P.inVehicle = null; P.x = q.x; P.y = q.y; P.moving = false; P.sprint = false; P.dead = false;
    o.pe = sec(() => { P.x = q.x; P.y = q.y; }, 40);
    // dentro do veiculo parado
    reset(); v.x = q.x; v.y = q.y; v.spd = 0; v.face = 0; v.dying = false; v.destroyed = false; v.driverId = null; v.passId = null; P.inVehicle = v; P.x = v.x; P.y = v.y;
    let rach = 0; o.dentro = sec(() => { P.x = v.x; P.y = v.y; v.spd = 0; if (l._st) for (const c of l._st.values()) rach = Math.max(rach, c.a); }, 40);
    o.rachou = rach; o.buracos = (l.holes || []).length; o.velDepois = v.spd;
    o.buracosDistintos = l.holes && l.holes.length === 2 ? Math.hypot(l.holes[0].x - l.holes[1].x, l.holes[0].y - l.holes[1].y) : 0;
    // veiculo vazio parado (jogo solo)
    reset(); P.inVehicle = null; P.x = q.x + 300; P.y = q.y + 300; v.x = q.x; v.y = q.y; v.spd = 0;
    o.vazio = sec(() => { v.spd = 0; }, 40);
    // em velocidade, passando: cruza o remendo sem parar
    reset(); P.inVehicle = v; v.y = q.y; v.spd = 110; let x = q.x - q.rx; let t = 0;
    while (x < q.x + q.rx) { v.x = x; P.x = v.x; P.y = v.y; iceTick(1 / 30); x += 110 / 30; t += 1 / 30; }
    o.passando = (l.holes || []).length;
    // fora do gelo
    reset(); v.x = q.x + q.rx * 3; v.y = q.y + q.ry * 3; P.x = v.x; P.y = v.y; v.spd = 0;
    for (let i = 0; i < 300; i++) iceTick(1 / 30); o.fora = l._st ? l._st.size : 0; o.foraHoles = (l.holes || []).length;
    // guest no multiplayer: veiculo parado sem ninguem nao conta
    reset(); P.inVehicle = null; P.x = q.x + 300; P.y = q.y + 300; v.x = q.x; v.y = q.y; v.spd = 0; const act = MP.active, host = MP.isHost; MP.active = true; MP.isHost = false;
    o.guest = sec(() => { v.spd = 0; }, 20); MP.active = act; MP.isHost = host;
    // ocupado por outro jogador: quem dirige conta, o resto nao
    reset(); v.driverId = 'outro'; o.ocupado = sec(() => { v.spd = 0; }, 20); v.driverId = null;
    return o;
  });
  ok(r.pe > 5 && r.pe < 14, 'a pe parado no gelo quebra em ~11 s (' + r.pe.toFixed(1) + ' s)');
  ok(r.dentro > 0 && r.dentro < r.pe, 'veiculo parado com o jogador dentro quebra o gelo, e mais rapido que a pe (' + r.dentro.toFixed(1) + ' s)');
  ok(r.rachou >= 2, 'o gelo racha (estalos e aviso) antes de quebrar sob o veiculo');
  ok(r.buracos === 2 && r.buracosDistintos > 8, 'abre dois buracos (frente e traseira), separados ' + r.buracosDistintos.toFixed(1) + ' px');
  ok(r.velDepois === 0, 'o veiculo perde a velocidade quando o gelo quebra');
  ok(r.vazio > 0 && r.vazio < r.pe, 'veiculo vazio parado no gelo tambem quebra (' + r.vazio.toFixed(1) + ' s)');
  ok(r.passando === 0, 'veiculo atravessando o gelo em velocidade nao quebra');
  ok(r.fora === 0 && r.foraHoles === 0, 'veiculo fora do gelo nao acumula tensao');
  ok(r.guest === -1, 'guest no multiplayer nao conta veiculo parado sem ninguem (quem manda no mundo e o anfitriao)');
  ok(r.ocupado === -1, 'veiculo ocupado por outro jogador nao e contado por quem nao dirige');
  ok(!errs.length, 'sem erros de script ' + errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
