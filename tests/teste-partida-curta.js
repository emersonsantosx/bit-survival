/* Partida curta: uma sessao continua de 7 minutos de jogo (mais de um dia inteiro: o dia 2 comeca aos 5 min) em cada mapa, SEM teleporte
   (o teste-fumaca teleporta e muda a hora; aqui o jogo corre sozinho): o jogador anda, corre, ataca, o dia vira, zumbis e animais nascem e se mexem,
   o salvamento automatico roda a cada 20 s e, no fim, o jogo salvo volta com o mesmo dia.
   So repoe vida, fome e sede quando ficam perigosamente baixas, para a partida nao acabar no meio: tudo o mais e o jogo de verdade.
   Confere: sem erro de JS, numeros sempre finitos (nada de NaN), jogador dentro do mundo, zumbis e animais com posicao valida, dia avancou, fome e sede cairam,
   zumbis nasceram, e o save carregado bate com o jogo. Uso: node tests/teste-partida-curta.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
const MAPS = ['forest', 'snow', 'desert', 'city'];
(async () => {
  const b = await chromium.launch(); let falhas = 0;
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHOU ') + m); if (!c) falhas++; };
  for (const map of MAPS) {
    const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
    pg.on('console', m => { if (m.type() === 'error' && /\[(continueGame|save|newGame)\]/.test(m.text())) errs.push(m.text()); });
    await pg.goto('file://' + file); await pg.waitForFunction(() => typeof newGame === 'function' && document.readyState === 'complete');
    const r = await pg.evaluate((m) => {
      localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = m; pendingSlot = 1; showScreen(null); newGame(); aud();
      const DT = 0.1, PASSOS = 4200, o = { ruins: [], maxZ: 0, maxA: 0, andouZ: 0, andouA: 0, parou: null };
      const fin = v => Number.isFinite(v);
      let ang = 0, z0 = [], a0 = [];
      for (let i = 0; i < PASSOS; i++) {
        if (i === 0) { z0 = zombies.map(z => [z, z.x, z.y]); a0 = animals.map(a => [a, a.x, a.y]); }   // os zumbis e animais do inicio: andam durante a partida?
        if (i === 1200) { o.andouZ = z0.filter(([z, x, y]) => Math.hypot(z.x - x, z.y - y) > 1).length; o.andouA = a0.filter(([a, x, y]) => Math.hypot(a.x - x, a.y - y) > 1).length; }
        if (i % 40 === 0) ang = Math.random() * 6.2832;   // muda de direcao a cada 4 s
        joy.active = true; joy.x = Math.cos(ang); joy.y = Math.sin(ang);
        sprintHeld = (i % 300) < 100; atkHeld = (i % 70) < 20;
        if (P.hp < 35) P.hp = 100; if (P.food < 20) P.food = 60; if (P.water < 20) P.water = 60;
        update(DT); if (i % 10 === 0) render();
        if (i % 200 === 199) saveGame();   // o laco do jogo salva a cada 20 s (js/15); aqui o update e chamado direto
        if (zombies.length > o.maxZ) o.maxZ = zombies.length; if (animals.length > o.maxA) o.maxA = animals.length;
        if (i % 100 === 0) {
          const ruim = [];
          for (const k of ['x', 'y', 'hp', 'food', 'water', 'stam']) if (!fin(P[k])) ruim.push('P.' + k);
          if (!fin(T) || !fin(day)) ruim.push('T/day');
          if (P.x < 0 || P.y < 0 || P.x > WW || P.y > WH) ruim.push('jogador fora do mundo (' + Math.round(P.x) + ',' + Math.round(P.y) + ')');
          if (P.food < 0 || P.food > 100 || P.water < 0 || P.water > 100 || P.hp > 100) ruim.push('fome/sede/vida fora de 0-100');
          if (zombies.some(z => !fin(z.x) || !fin(z.y) || !fin(z.hp))) ruim.push('zumbi com numero invalido');
          if (animals.some(a => !fin(a.x) || !fin(a.y))) ruim.push('animal com numero invalido');
          if (zombies.length > 600) ruim.push('zumbis demais (' + zombies.length + ')');
          if (ruim.length) o.ruins.push('t=' + Math.round(T) + ': ' + ruim.join('; '));
        }
        if (state !== 'play' || P.dead) { o.parou = 'estado ' + state + (P.dead ? ' (jogador morto)' : '') + ' em t=' + Math.round(T); break; }
      }
      o.T = Math.round(T); o.day = day; o.food = Math.round(P.food); o.water = Math.round(P.water); o.kills = kills; o.hp = Math.round(P.hp);
      // o save feito pelo laco acompanhou a partida e volta igual
      saveGame();
      const s = JSON.parse(localStorage.getItem('minisurv_save_1')); o.saveT = s.T; o.saveDay = s.day;
      state = 'menu'; continueGame(1);
      o.voltou = state === 'play'; o.diaVoltou = day;
      for (let i = 0; i < 100; i++) { update(DT); render(); }   // e o jogo continua rodando depois de carregar
      o.seguiu = state === 'play' && fin(P.x) && fin(P.hp);
      return o;
    }, map);
    ok(r.parou === null, map + ': partida de 7 minutos sem parar no meio' + (r.parou ? ' -> ' + r.parou : ''));
    ok(r.day >= 2, map + ': o dia virou (dia ' + r.day + ' em t=' + r.T + ' s)');
    ok(r.ruins.length === 0, map + ': numeros sempre validos, jogador dentro do mundo' + (r.ruins.length ? ' -> ' + r.ruins[0] : ''));
    ok(r.maxZ > 0 && r.andouZ > 0, map + ': zumbis se mexem (' + r.andouZ + ' dos ' + r.maxZ + ' andaram mais de 1 px nos primeiros 2 min)');
    ok(r.maxA > 0 && r.andouA > 0, map + ': animais se mexem (' + r.andouA + ' dos ' + r.maxA + ' andaram mais de 1 px nos primeiros 2 min)');
    ok(r.food < 85 && r.water < 85, map + ': fome e sede cairam com o tempo (comida ' + r.food + ', agua ' + r.water + ')');
    ok(r.saveT > 100 && r.saveDay === r.day, map + ': salvamento da partida acompanhou o jogo (T do save ' + r.saveT + ', dia ' + r.saveDay + ')');
    ok(r.voltou && r.diaVoltou === r.saveDay && r.seguiu, map + ': o save carrega no mesmo dia e o jogo segue rodando');
    ok(errs.length === 0, map + ': sem erros de JS' + (errs.length ? ' -> ' + errs[0] : ''));
    await pg.context().close();
  }
  await b.close();
  console.log(falhas ? '\n' + falhas + ' falha(s)' : '\nTodos os testes passaram');
  process.exit(falhas ? 1 : 0);
})();
