/* Rastro de sangue: quem esta sangrando deixa gotinhas no chao (andando e parado), elas somem com o tempo (a chuva lava mais rapido),
   nao pingam no carro nem na agua, dentro de predio ficam por cima do piso, sao limitadas em quantidade e nao mexem no save.
   Multiplayer: o sangramento vai no pacote do jogador (bl:1) e o aliado aparece sangrando, com gotas e aviso, na tela dos outros.
   Uso: node tests/teste-sangue-rastro.js [index.html] [captura.png] */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const shot = process.argv[3];
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
    // anda 6 s, em linha reta, ainda sem sangrar
    const anda = (seg, dx, dy) => { for (let i = 0; i < seg * 10; i++) { P.x += dx; P.y += dy; P.moving = true; P.hp = 100; survivalTick(.1); } };
    P.inVehicle = null; P.inside = null; P.sleeping = null; P.x = 400; P.y = 400; P.bleed = false;
    anda(6, 3, 0); o.semSangrar = bloodList().length;
    // andando sangrando
    P.bleed = true; bloodReset(); anda(6, 3, 0); o.andando = bloodList().length;
    o.pertoDoCaminho = bloodList().every(d => d.x > 395 && d.x < P.x + 4 && Math.abs(d.y - (P.y + 2)) < 4);
    // parado
    bloodReset(); P.moving = false; for (let i = 0; i < 80; i++) { P.hp = 100; survivalTick(.1); } o.parado = bloodList().length;
    o.paradoJunto = bloodList().every(d => Math.abs(d.x - P.x) < 5);
    // no carro e na agua nao pinga
    bloodReset(); P.inVehicle = { x: P.x, y: P.y }; for (let i = 0; i < 40; i++) { P.hp = 100; survivalTick(.1); } o.carro = bloodList().length; P.inVehicle = null;
    bloodReset(); P.sleeping = { }; for (let i = 0; i < 40; i++) { P.hp = 100; survivalTick(.1); } o.cama = bloodList().length; P.sleeping = null;
    // teleporte (renascer, porta) nao risca o caminho entre os dois pontos
    bloodReset(); P.moving = true; P.hp = 100; survivalTick(.1); P.x += 600; P.hp = 100; survivalTick(.1); o.teleporte = bloodList().length;
    // limite de gotas
    bloodReset(); P.moving = false; for (let i = 0; i < 4000; i++) { P.hp = 100; survivalTick(.1); } o.limite = bloodList().length;
    // somem com o tempo: seco (cerca de 26 s) e chuva lava mais rapido
    bloodReset(); anda(4, 3, 0); const n0 = bloodList().length; bloodAge(10, 1); o.apos10 = bloodList().length; bloodAge(25, 1); o.apos30 = bloodList().length;
    bloodReset(); anda(4, 3, 0); bloodAge(10, 3.2); o.chuva10 = bloodList().length; o.n0 = n0;
    // dentro de predio fica marcado para ser desenhado por cima do piso
    bloodReset(); const bl = blds[0]; P.inside = bl; P.x = bl.x + bl.w / 2; P.y = bl.y + bl.h / 2; P.moving = false; for (let i = 0; i < 20; i++) { P.hp = 100; survivalTick(.1); }
    o.dentro = bloodList().length > 0 && bloodList().every(d => d.in === true); P.inside = null;
    bloodReset(); P.x = 400; P.y = 400; for (let i = 0; i < 20; i++) { P.hp = 100; survivalTick(.1); } o.fora = bloodList().length > 0 && bloodList().every(d => d.in === false);
    // desenha sem erro e sem deixar a transparencia ligada
    bloodReset(); anda(5, 3, 0); render(); o.alfaOk = ctx.globalAlpha === 1;
    // o save nao guarda as gotas
    o.saveSemGota = !JSON.stringify(Object.keys(localStorage)).includes('blood') && !/blood|gota/i.test(String(saveGame).slice(0, 4000));
    // multiplayer: o pacote leva o sangramento e o aliado deixa gotas e aviso na tela de quem o ve
    P.x = 400; P.y = 400; P.dead = false; P.bleed = true; o.pacoteSangra = packMyPlayer().bl === 1;
    P.bleed = false; o.pacoteLimpo = packMyPlayer().bl === undefined;
    P.bleed = true; P.dead = true; o.pacoteMorto = packMyPlayer().bl === undefined; P.dead = false; P.bleed = false;
    const pk = (bl, x, extra) => Object.assign({ type: 'player', id: 'guest', name: 'Ana', x: x, y: 410, alive: true, moving: true, hp: 70, bl: bl }, extra || {});
    handleNetData(pk(1, 430), false); const rp = remotePlayers.guest; o.recebeu = !!(rp && rp.bl === true);
    handleNetData(pk(undefined, 430), false); o.limpou = remotePlayers.guest.bl === false;
    handleNetData(pk(1, 430), false); handleNetData(pk(7, 430), false); o.bl7 = remotePlayers.guest.bl === false;   // so o valor 1 vale
    handleNetData(pk(1, 430, { alive: false }), false); o.mortoSemBl = remotePlayers.guest.bl === false;
    // aliado andando sangrando: trilha dele (nao a minha)
    handleNetData(pk(1, 430), false); bloodReset(); const al = remotePlayers.guest; al.x = 430; al.y = 410;
    for (let i = 0; i < 60; i++) { al.x += 3; bloodDripRemote(al, .1); } o.aliado = bloodList().length;
    o.aliadoNoCaminho = bloodList().every(d => d.x > 425 && d.x < al.x + 4 && Math.abs(d.y - (al.y + 2)) < 4);
    // aliado longe, no carro ou sem sangrar nao deixa gotas
    bloodReset(); al.x = 5000; al.y = 5000; for (let i = 0; i < 60; i++) { al.x += 3; bloodDripRemote(al, .1); } o.aliadoLonge = bloodList().length;
    bloodReset(); al.x = 430; al.y = 410; al.inVehicle = true; for (let i = 0; i < 60; i++) { al.x += 3; bloodDripRemote(al, .1); } o.aliadoCarro = bloodList().length; al.inVehicle = false;
    bloodReset(); al.bl = false; for (let i = 0; i < 60; i++) { al.x += 3; bloodDripRemote(al, .1); } o.aliadoSemBl = bloodList().length; al.bl = true;
    // desenha o aviso ao lado da barra de vida do aliado, sem erro e sem deixar transparencia ligada
    P.x = 430; P.y = 410; al.x = 440; al.y = 410; al.tx = 440; al.ty = 410; render(); drawBleedMark(al); o.avisoOk = ctx.globalAlpha === 1;
    delete remotePlayers.guest;
    // novo mundo limpa
    bloodReset(); anda(3, 3, 0); genWorld(5 * 7919); o.reset = bloodList().length;
    return o;
  });
  console.log(JSON.stringify(r));
  ok(r.semSangrar === 0, 'sem sangramento nao deixa gotas (nem sem chamar bloodDrip)');
  ok(r.andando >= 8 && r.andando <= 25, 'andando 6 s sangrando deixa uma trilha de gotas (' + r.andando + ')');
  ok(r.pertoDoCaminho, 'as gotas ficam no caminho, nos pes do jogador');
  ok(r.parado >= 3 && r.parado <= 8 && r.paradoJunto, 'parado pinga devagar, sempre no mesmo lugar (' + r.parado + ')');
  ok(r.carro === 0, 'dentro do carro nao pinga');
  ok(r.cama === 0, 'dormindo nao pinga');
  ok(r.teleporte <= 1, 'teletransporte nao risca o caminho todo');
  ok(r.limite === 160, 'a lista tem teto de 160 gotas (' + r.limite + ')');
  ok(r.apos10 > 0 && r.apos30 === 0, 'as gotas somem sozinhas em ate ~35 s (' + r.apos10 + ' -> ' + r.apos30 + ')');
  ok(r.chuva10 === 0 && r.n0 > 0, 'a chuva lava as gotas bem mais rapido');
  ok(r.dentro && r.fora, 'gota de dentro de predio e desenhada por cima do piso; a de fora fica embaixo dos veiculos');
  ok(r.alfaOk, 'desenhar as gotas nao deixa a transparencia ligada');
  ok(r.reset === 0, 'mundo novo limpa as gotas');
  ok(r.pacoteSangra && r.pacoteLimpo && r.pacoteMorto, 'o pacote do jogador leva bl:1 so quando esta vivo e sangrando');
  ok(r.recebeu && r.limpou && r.bl7 && r.mortoSemBl, 'quem recebe marca o aliado como sangrando so com bl:1 e vivo; a bandagem (sem bl) limpa na hora');
  ok(r.aliado >= 8 && r.aliadoNoCaminho, 'aliado sangrando andando deixa trilha na tela de quem o ve (' + r.aliado + ')');
  ok(r.aliadoLonge === 0 && r.aliadoCarro === 0 && r.aliadoSemBl === 0, 'aliado longe, no carro ou sem sangrar nao deixa gotas');
  ok(r.avisoOk, 'o aviso ao lado da barra de vida do aliado desenha sem erro');
  if (shot) {
    await pg.evaluate(() => { selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); P.x = 600; P.y = 600; P.bleed = true; P.hp = 90; bloodReset();
      for (let i = 0; i < 80; i++) { P.x += 2.4; P.y += Math.sin(i / 8) * 1.2; P.moving = true; P.hp = 90; survivalTick(.1); }
      handleNetData({ type: 'player', id: 'guest', name: 'Ana', x: P.x + 70, y: P.y - 30, alive: true, moving: true, hp: 55, bl: 1, face: 1.6 }, false);
      const al = remotePlayers.guest; al.x = al.tx; al.y = al.ty; for (let i = 0; i < 40; i++) { al.y += 1.5; al.ty = al.y; bloodDripRemote(al, .1); } update(.05); render(); });
    await pg.screenshot({ path: shot });
  }
  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ').slice(0, 120) + ')');
  await b.close(); process.exit(bad ? 1 : 0);
})();
