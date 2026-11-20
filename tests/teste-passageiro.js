/* Passageiro nos veiculos: cada veiculo leva ate 2 jogadores (motorista e passageiro).
   O 1o que entra dirige; o 2o vai de passageiro; o 3o e recusado. Se o motorista sai, o passageiro assume o volante.
   Cobre: vagas, saida de um e do outro, rede (evento, pacote do aliado, aliado que cai), desempate quando os dois entram juntos,
   passageiro nao dirige e acompanha o veiculo, explosao mata quem esta dentro, e o desenho nos 4 mapas (carro, quadriciclo, moto de neve, buggy).
   Uso: node tests/teste-passageiro.js [index.html] [pasta-para-capturas] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shotDir = process.argv[3];
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('dialog', d => { errs.push('dialog:' + d.message()); d.dismiss(); });
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); const o = {};
    selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); weather = 'none'; weatherTimer = 99999;
    const sent = []; window.sendEvt = (k, d) => { sent.push([k, d]); };
    const car = () => vehicles.find(v => !v.destroyed);
    const fresh = () => { const v = car(); v.driverId = null; v.passId = null; v.spd = 0; v.hp = v.maxHp = 100; v.looted = true; P.inVehicle = null; P.dead = false; P.hp = 100;
      P.x = v.x - 20; P.y = v.y; for (const id in remotePlayers) delete remotePlayers[id]; sent.length = 0; return v; };
    const remote = (id, extra) => { handleNetData(Object.assign({ type: 'player', id: id, name: id === 'guest' ? 'Ana' : 'Beto', x: 0, y: 0, alive: true, hp: 100, skin: id === 'guest' ? 1 : 2, vehicleLooted: true }, extra || {}), false); return remotePlayers[id]; };
    const setMP = (host) => { MP.active = true; MP.connected = true; MP.isHost = host; MP.netId = host ? undefined : 'guest'; };
    const noMP = () => { MP.active = false; MP.connected = false; MP.isHost = false; };

    // ---- solo: continua igual (motorista sozinho) ----
    noMP(); let v = fresh(); o.soloLivre = vehFreeSeat(v) === 'd';
    pickup(); // perto do veiculo: entra
    o.soloEntrou = P.inVehicle === v && v.driverId === myNetId() && !v.passId && !imPassenger();
    exitVehicle(); o.soloSaiu = !P.inVehicle && !v.driverId;

    // ---- multiplayer: o aliado ja e motorista, eu entro de passageiro ----
    setMP(true); v = fresh();
    remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: v.face || 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    o.motoristaRemoto = v.driverId === 'guest' && remotePlayers.guest.vehicleId === v.id;
    o.livreParaMim = vehFreeSeat(v) === 'p';
    P.x = v.x - 18; P.y = v.y; pickup();
    o.passageiro = P.inVehicle === v && v.passId === 'host' && v.driverId === 'guest' && imPassenger();
    o.eventoSeatP = sent.some(e => e[0] === 'vehicleEnter' && e[1].seat === 'p' && e[1].who === 'host' && e[1].driver === 'guest');
    o.hudSoSair = $('veh-hud').classList.contains('pax') && !$('veh-hud').classList.contains('hide');
    // lotado (visto por um terceiro): motorista e passageiro la dentro, eu chego e nao entro
    { const w = fresh(); remote('guest', { x: w.x, y: w.y, inVehicle: true, vehicleId: w.id, vehicleX: w.x, vehicleY: w.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
      remote('g2', { x: w.x, y: w.y, inVehicle: true, vs: w.id, vp: 1 });
      o.lotado = vehFreeSeat(w) === null && w.passId === 'g2'; P.x = w.x - 18; P.y = w.y; pickup(); o.lotado = o.lotado && !P.inVehicle && w.passId === 'g2' && w.driverId === 'guest';
      v = fresh(); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 }); P.x = v.x - 18; P.y = v.y; pickup(); }
    // o passageiro nao dirige: acelerar nao muda nada; a posicao segue o veiculo que o motorista remoto move
    touchGas = 1; v.spd = 0; updateP(.1); o.naoDirige = v.spd === 0; touchGas = 0;
    vehSetTarget(v, v.x + 30, v.y, v.face || 0); updateVehicles(.05);
    for (let i = 0; i < 30; i++) update(.05);
    o.segueVeiculo = Math.abs(P.x - v.x) < .5 && Math.abs(P.y - v.y) < .5 && v.x > v._nx - 3;
    // pacote do passageiro: so diz em qual veiculo esta
    const pk = packMyPlayer(); o.pacotePass = pk.vp === 1 && pk.vs === v.id && pk.vehicleX === undefined && pk.inVehicle === true;
    // o motorista (aliado) sai: eu assumo o volante
    handleNetData({ type: 'evt', kind: 'vehicleExit', data: { id: v.id, who: 'guest' } }, false);
    o.assumiu = v.driverId === 'host' && !v.passId && !imPassenger() && P.inVehicle === v;
    o.hudDirigir = !$('veh-hud').classList.contains('pax');
    const pk2 = packMyPlayer(); o.pacoteMotorista = pk2.vehicleId === v.id && pk2.vp === undefined;
    // agora o aliado volta como passageiro (pelo pacote dele) e eu saio: ele assume
    remote('guest', { x: v.x, y: v.y, inVehicle: true, vs: v.id, vp: 1 });
    o.aliadoPassageiro = v.passId === 'guest' && v.driverId === 'host';
    v.spd = 40; sent.length = 0; exitVehicle();
    o.euSai = !P.inVehicle && v.driverId === 'guest' && !v.passId && v.spd === 0;
    o.eventoSaida = sent.some(e => e[0] === 'vehicleExit' && e[1].who === 'host' && e[1].id === v.id);

    // ---- passageiro sai: o motorista continua e o veiculo nao para ----
    v = fresh(); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup(); v.spd = 0; const spdIn = 0; v.spd = 8; exitVehicle();
    o.passSai = !P.inVehicle && v.driverId === 'guest' && !v.passId && v.spd === 8;

    // ---- aliado cai / sai sem evento: o pacote dele sem veiculo libera a vaga e promove ----
    v = fresh(); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup();
    remote('guest', { x: v.x + 50, y: v.y, inVehicle: false });
    o.pacoteSemVeiculo = v.driverId === 'host' && !v.passId && !imPassenger();
    v = fresh(); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup(); vehSeatLeave(v, 'guest');   // desconexao
    o.desconexao = v.driverId === 'host' && !v.passId;

    // ---- desempate: os dois entram juntos como motorista (o host fica, o outro vira passageiro) ----
    v = fresh(); setMP(true); P.x = v.x - 18; P.y = v.y; pickup();   // eu (host) sou motorista
    handleNetData({ type: 'evt', kind: 'vehicleEnter', data: { id: v.id, driver: 'guest', who: 'guest', seat: 'd' } }, false);
    o.hostFica = v.driverId === 'host' && imPassenger() === false && P.inVehicle === v;
    v = fresh(); setMP(false); P.x = v.x - 18; P.y = v.y; pickup();   // eu (guest) sou motorista, o host chega junto
    handleNetData({ type: 'evt', kind: 'vehicleEnter', data: { id: v.id, driver: 'host', who: 'host', seat: 'd' } }, false);
    o.guestVira = v.driverId === 'host' && v.passId === 'guest' && imPassenger() && $('veh-hud').classList.contains('pax');
    o.guestAvisou = sent.some(e => e[0] === 'vehicleEnter' && e[1].seat === 'p' && e[1].who === 'guest');
    // os dois pegam o lugar de passageiro juntos: o host fica, o guest desce
    v = fresh(); setMP(false); remote('host', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup();
    handleNetData({ type: 'evt', kind: 'vehicleEnter', data: { id: v.id, driver: 'host', who: 'host', seat: 'p' } }, false);
    o.passDesempate = !P.inVehicle && v.passId === 'host';

    // ---- veiculo em movimento: ninguem entra de passageiro com ele andando ----
    setMP(true); v = fresh(); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 60, vehicleHp: 100, vehicleMaxHp: 100 });
    v.spd = 60; P.x = v.x - 18; P.y = v.y; pickup(); o.emMovimento = !P.inVehicle && !v.passId;

    // ---- dano: o passageiro avisa o dono do veiculo em vez de aplicar direto ----
    v = fresh(); setMP(true); remote('guest', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup(); const hp0 = v.hp; sent.length = 0; zombieHurt(20, 0);
    o.danoAviso = sent.some(e => e[0] === 'vehDmg' && e[1].id === v.id) && v.hp === hp0;
    v.driverId = 'host'; v.passId = null; const hp1 = v.hp; zombieHurt(20, 0); o.danoMotorista = v.hp < hp1;   // motorista aplica direto

    // ---- explosao: quem esta dentro (passageiro) morre ----
    v = fresh(); setMP(false); remote('host', { x: v.x, y: v.y, inVehicle: true, vehicleId: v.id, vehicleX: v.x, vehicleY: v.y, vehicleFace: 0, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
    P.x = v.x - 18; P.y = v.y; pickup(); o.pAntes = imPassenger();
    handleNetData({ type: 'evt', kind: 'vehicleExploded', data: { id: v.id, x: v.x, y: v.y } }, false);
    o.explodiu = v.destroyed && !v.driverId && !v.passId && P.dead === true;
    noMP(); P.dead = false; P.hp = 100; state = 'play';

    // ---- visual: nos 4 mapas, com os dois ocupantes ----
    o.desenho = {};
    for (const mp of ['forest', 'snow', 'desert', 'city']) {
      selectedMap = mp; pendingSlot = 1; showScreen(null); newGame(); weather = 'none'; weatherTimer = 99999; window.sendEvt = (k, d) => { sent.push([k, d]); };
      setMP(true); const w = car(); w.looted = true; w.spd = 0; w.hp = w.maxHp = 100;
      for (const id in remotePlayers) delete remotePlayers[id];
      remote('guest', { x: w.x, y: w.y, inVehicle: true, vehicleId: w.id, vehicleX: w.x, vehicleY: w.y, vehicleFace: -0.4, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 });
      P.x = w.x - 18; P.y = w.y; w.face = -0.4; pickup(); P.x = w.x; P.y = w.y;
      for (let i = 0; i < 6; i++) update(.05);
      let erro = '';
      try { render(); } catch (e) { erro = String(e && e.message); }
      o.desenho[mp] = { erro: erro, passageiro: imPassenger(), alfa: ctx.globalAlpha === 1, k: vehKind(w) };
      window['_v_' + mp] = { x: w.x, y: w.y };
      noMP(); P.inVehicle = null;
    }
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.soloLivre && r.soloEntrou && r.soloSaiu, 'sozinho nada muda: entra como motorista e sai normal');
  ok(r.motoristaRemoto && r.livreParaMim, 'aliado dirigindo: o veiculo ainda tem a vaga de passageiro');
  ok(r.passageiro && r.eventoSeatP, 'o segundo que entra vira passageiro e avisa os outros (vehicleEnter seat p)');
  ok(r.hudSoSair, 'passageiro ve so o botao de sair (sem acelerar nem virar)');
  ok(r.lotado, 'com motorista e passageiro o veiculo esta lotado (maximo 2)');
  ok(r.naoDirige && r.segueVeiculo, 'passageiro nao dirige e acompanha o veiculo do motorista');
  ok(r.pacotePass && r.pacoteMotorista, 'pacote: passageiro manda so vs/vp; motorista manda o veiculo');
  ok(r.assumiu && r.hudDirigir, 'motorista (aliado) sai: o passageiro assume o volante e ganha os controles');
  ok(r.aliadoPassageiro && r.euSai && r.eventoSaida, 'eu sou o motorista e saio: o aliado passageiro assume e o evento leva quem saiu');
  ok(r.passSai, 'passageiro sai: o motorista continua e o veiculo nao para');
  ok(r.pacoteSemVeiculo && r.desconexao, 'aliado que cai ou sai sem evento libera a vaga e o passageiro assume');
  ok(r.hostFica && r.guestVira && r.guestAvisou, 'dois entram juntos como motorista: o host fica e o outro vira passageiro');
  ok(r.passDesempate, 'dois pegam o lugar de passageiro juntos: so um fica');
  ok(r.emMovimento, 'com o veiculo andando ninguem entra de passageiro');
  ok(r.danoAviso && r.danoMotorista, 'dano de zumbi: passageiro avisa o dono do veiculo, motorista aplica direto');
  ok(r.pAntes && r.explodiu, 'explosao do veiculo mata quem ainda esta dentro, passageiro inclusive');
  for (const mp of ['forest', 'snow', 'desert', 'city']) { const d = r.desenho[mp]; ok(d && d.erro === '' && d.passageiro && d.alfa, 'desenha motorista e passageiro no mapa ' + mp + ' (' + d.k + ')' + (d.erro ? ' ' + d.erro : '')); }
  if (shotDir) {
    const fs = require('fs'); fs.mkdirSync(shotDir, { recursive: true });
    for (const mp of ['forest', 'snow', 'desert', 'city']) {
      await pg.evaluate((m) => {
        selectedMap = m; pendingSlot = 1; showScreen(null); newGame(); weather = 'none'; weatherTimer = 99999; window.sendEvt = () => {};
        MP.active = true; MP.connected = true; MP.isHost = true;
        const w = vehicles.find(v => !v.destroyed); w.looted = true; w.face = -0.5; w.spd = 0;
        for (const id in remotePlayers) delete remotePlayers[id];
        handleNetData({ type: 'player', id: 'guest', name: 'Ana', x: w.x, y: w.y, alive: true, hp: 100, skin: 1, vehicleLooted: true, inVehicle: true, vehicleId: w.id, vehicleX: w.x, vehicleY: w.y, vehicleFace: -0.5, vehicleSpd: 0, vehicleHp: 100, vehicleMaxHp: 100 }, false);
        P.x = w.x - 18; P.y = w.y; pickup(); for (let i = 0; i < 6; i++) update(.05); render();
      }, mp);
      await pg.screenshot({ path: path.join(shotDir, 'passageiro-' + mp + '.png') });
    }
  }
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ').slice(0, 160) + ')');
  await b.close(); process.exit(bad ? 1 : 0);
})();
