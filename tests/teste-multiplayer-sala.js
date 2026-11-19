/* Sala do multiplayer: ate 4 jogadores, lobby com PRONTO, so o host inicia, sala cheia, repasse entre convidados, queda e volta por vaga.
   Usa conexoes falsas (sem PeerJS). Uso: node tests/teste-multiplayer-sala.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(300);

  const R = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear();
    const o = {};
    const mk = () => ({ open: true, sent: [], h: {}, send(m) { this.sent.push(JSON.parse(JSON.stringify(m))); }, close() { this.open = false; if (this.h.close) this.h.close(); }, on(e, f) { this.h[e] = f; } });
    const types = c => c.sent.map(m => m.type);
    const last = (c, t) => { for (let i = c.sent.length - 1; i >= 0; i--) if (c.sent[i].type === t) return c.sent[i]; return null; };
    const join = (name, prev) => { const c = mk(); hostAcceptConn(c); c.h.data({ type: 'hello', name: name, prev: prev || null }); return c; };
    window.loadPeerJS = function () {};
    mpSlot = 0; mpHostStart();
    o.hostOn = MP.active && MP.isHost; o.code = MP.roomCode;
    document.getElementById('btnHostCreate').click();
    o.lobbyVisible = !document.getElementById('mplobby').classList.contains('hide');
    o.noStart0 = hostCanStart();

    const A = join('Ana'), B = join('Bia'), C = join('Caio');
    o.ids = [A, B, C].map(c => (last(c, 'welcome') || {}).id).join(',');
    o.players = mpPlayersList().length;
    o.slotsDom = document.querySelectorAll('#mplobby .lob-slot').length;
    const D = join('Davi');   // 5o jogador: sala cheia
    o.full = (last(D, 'full') || {}).why;
    o.playersAfterFull = mpPlayersList().length;
    const dup = join('Ana'); o.dupGone = (last(dup, 'full') || {}).why === 'cheia';
    // pronto
    o.startBlocked = !hostCanStart();
    A.h.data({ type: 'ready', r: 1 }); B.h.data({ type: 'ready', r: 1 });
    o.partial = !hostCanStart();
    o.startBtnDisabled = document.getElementById('btnLobStart').disabled;
    C.h.data({ type: 'ready', r: 1 });
    o.allReady = hostCanStart();
    o.startBtnEnabled = !document.getElementById('btnLobStart').disabled;
    C.h.data({ type: 'ready', r: 0 }); o.unready = !hostCanStart();
    C.h.data({ type: 'ready', r: 1 });
    const lb = last(A, 'lobby'); o.lobbyList = lb ? lb.players.map(p => p.id + ':' + (p.ready ? 1 : 0)).join(',') : '';
    // convidado nao inicia: so o host (hello/ready nao iniciam nada)
    A.h.data({ type: 'start' }); o.guestCantStart = !MP.gameStarted;
    window.__c = { A, B, C };
    return o;
  });
  ok(R.hostOn && /^MINISURV-[A-Z0-9]{6}$/.test(R.code), 'host cria sala com codigo de 6 caracteres (' + R.code + ')');
  ok(R.lobbyVisible, 'CRIAR SALA abre a tela da sala (lobby)');
  ok(R.noStart0 === false, 'sem convidados nao da para iniciar');
  ok(R.ids === 'g1,g2,g3', 'convidados ocupam as vagas g1,g2,g3 (' + R.ids + ')');
  ok(R.players === 4 && R.slotsDom === 4, 'sala com 4 jogadores e 4 vagas na tela');
  ok(R.full === 'cheia' && R.playersAfterFull === 4, '5o jogador recebe "sala cheia" e nao entra');
  ok(R.startBlocked && R.partial && R.startBtnDisabled, 'INICIAR bloqueado enquanto falta alguem ficar pronto');
  ok(R.allReady && R.startBtnEnabled, 'todos prontos libera o INICIAR');
  ok(R.unready, 'cancelar o pronto bloqueia de novo');
  ok(R.lobbyList === 'host:1,g1:1,g2:1,g3:0' || R.lobbyList === 'host:1,g1:1,g2:1,g3:1' || /^host:1,g1:1,g2:1/.test(R.lobbyList), 'lista da sala chega aos convidados (' + R.lobbyList + ')');
  ok(R.guestCantStart, 'convidado nao consegue iniciar a partida');

  const S = await pg.evaluate(async () => {
    const { A, B, C } = window.__c; const o = {};
    const last = (c, t) => { for (let i = c.sent.length - 1; i >= 0; i--) if (c.sent[i].type === t) return c.sent[i]; return null; };
    hostStartMatch(); await new Promise(r => setTimeout(r, 400));
    o.started = MP.gameStarted && state === 'play';
    o.msgs = [A, B, C].map(c => !!last(c, 'worldInit') && !!last(c, 'start')).join(',');
    o.idx = [A, B, C].map(c => last(c, 'start').idx).join(',');
    o.seedSame = [A, B, C].every(c => last(c, 'worldInit').seed === MP.seed);
    o.connected = MP.connected;
    o.lobbyOff = !MP.lobbyOn;
    // novo jogador depois de iniciar: recusado
    const E = { open: true, sent: [], h: {}, send(m) { this.sent.push(m); }, close() { this.open = false; }, on(e, f) { this.h[e] = f; } };
    hostAcceptConn(E); E.h.data({ type: 'hello', name: 'Zeca' });
    o.late = (last(E, 'full') || {}).why;
    // reenvio: A manda posicao (com id falso), B e C recebem, A nao
    [A, B, C].forEach(c => c.sent.length = 0);
    A.h.data({ type: 'player', id: 'host', name: 'Ana', x: 120, y: 130, alive: true, face: 0 });
    o.relayB = !!last(B, 'player') && last(B, 'player').id === 'g1';
    o.relayC = !!last(C, 'player');
    o.noEcho = !last(A, 'player');
    o.hostSees = !!remotePlayers.g1 && remotePlayers.g1.isHost === false && remotePlayers.g1.name === 'Ana';
    // chat reenviado
    A.h.data({ type: 'chat', name: 'Ana', text: 'oi gente', id: 'host', t: 1 });
    o.chatB = !!last(B, 'chat') && last(B, 'chat').id === 'g1';
    o.chatNoEcho = !last(A, 'chat');
    // evento comum e reenviado; dano em zumbi so o host resolve
    B.h.data({ type: 'evt', kind: 'treeDmg', data: { x: 1, y: 1, dmg: 0 } });
    o.evtA = !!last(A, 'evt') && !!last(C, 'evt');
    [A, B, C].forEach(c => c.sent.length = 0);
    B.h.data({ type: 'evt', kind: 'zombieDmg', data: { id: 99, dmg: 1 } });
    o.zNoRelay = !last(A, 'evt') && !last(C, 'evt');
    // ping responde so a quem perguntou
    [A, B, C].forEach(c => c.sent.length = 0);
    C.h.data({ type: 'ping', t: performance.now() });
    o.pong = !!last(C, 'pong') && !last(A, 'pong') && !last(B, 'pong');
    // host fala com todos
    [A, B, C].forEach(c => c.sent.length = 0);
    sendEvt('campfireAdded', { x: 5, y: 5 });
    o.hostAll = [A, B, C].every(c => !!last(c, 'evt'));
    // morte: A morre, os outros seguem; so acaba quando todos morrerem
    A.h.data({ type: 'player', id: 'g1', name: 'Ana', x: 120, y: 130, alive: true });
    B.h.data({ type: 'player', id: 'g2', name: 'Bia', x: 150, y: 130, alive: true });
    C.h.data({ type: 'player', id: 'g3', name: 'Caio', x: 180, y: 130, alive: true });
    A.h.data({ type: 'playerDied', id: 'g1' });
    P.dead = true; P.hp = 0;
    B.h.data({ type: 'playerDied', id: 'g2' });
    o.notOver = !MP.gameOver && isOtherPlayerAlive();
    C.h.data({ type: 'playerDied', id: 'g3' });
    o.over = !isOtherPlayerAlive();
    P.dead = false; P.hp = 100; MP.gameOver = false;
    remotePlayers.g1.alive = remotePlayers.g2.alive = remotePlayers.g3.alive = true;
    // queda de B em partida: some do mundo, vaga reservada, A e C seguem
    B.close();
    o.bGone = !remotePlayers.g2 && !!remotePlayers.g1 && !!remotePlayers.g3;
    o.bAway = MP.roster.g2.away === true && MP.connected === true;
    // um estranho nao toma a vaga; Bia volta pelo nome e retoma
    const X = { open: true, sent: [], h: {}, send(m) { this.sent.push(m); }, close() { this.open = false; }, on(e, f) { this.h[e] = f; } };
    hostAcceptConn(X); X.h.data({ type: 'hello', name: 'Intruso' });
    o.stranger = (last(X, 'full') || {}).why;
    const B2 = { open: true, sent: [], h: {}, send(m) { this.sent.push(m); }, close() { this.open = false; if (this.h.close) this.h.close(); }, on(e, f) { this.h[e] = f; } };
    hostAcceptConn(B2); B2.h.data({ type: 'hello', name: 'Bia', prev: null });
    o.rejoinId = (last(B2, 'welcome') || {}).id;
    o.rejoinResume = !!last(B2, 'worldInit') && (last(B2, 'start') || {}).resume === true;
    o.rejoinBack = MP.roster.g2.away === false;
    // todos caem: host segue sozinho (convidado offline) e a volta funciona
    A.close(); C.close(); B2.close();
    o.alone = MP.connected === false && MP.guestAway === true;
    return o;
  });
  ok(S.started, 'host inicia a partida com todos prontos');
  ok(S.msgs === 'true,true,true' && S.seedSame, 'os 3 convidados recebem o mesmo mundo e o sinal de inicio');
  ok(S.idx === '1,2,3', 'cada convidado recebe a sua vaga de nascimento (' + S.idx + ')');
  ok(S.connected && S.lobbyOff, 'em partida o host fica conectado e a sala some');
  ok(S.late === 'iniciada', 'quem chega depois do inicio recebe "partida ja comecou"');
  ok(S.relayB && S.relayC && S.noEcho, 'posicao de um convidado chega aos outros (id vem da vaga, sem eco)');
  ok(S.hostSees, 'host enxerga o convidado com nome e sem marca de host');
  ok(S.chatB && S.chatNoEcho, 'chat de um convidado chega aos outros');
  ok(S.evtA, 'evento do mundo de um convidado chega aos outros');
  ok(S.zNoRelay, 'dano em zumbi nao e repassado (so o host resolve)');
  ok(S.pong, 'resposta de ping vai so para quem perguntou');
  ok(S.hostAll, 'evento do host chega a todos os convidados');
  ok(S.notOver && S.over, 'fim de jogo so quando TODOS morrem');
  ok(S.bGone && S.bAway, 'queda de um convidado tira so ele do mundo e reserva a vaga');
  ok(S.stranger === 'iniciada', 'estranho nao toma a vaga de quem caiu');
  ok(S.rejoinId === 'g2' && S.rejoinResume && S.rejoinBack, 'quem caiu volta pela mesma vaga e retoma a partida');
  ok(S.alone, 'se todos os convidados caem o host segue sozinho');

  /* lado do convidado: vaga, lista, sala cheia, expulsao */
  const g = await b.newPage({ viewport: { width: 900, height: 600 } });
  g.on('pageerror', e => errs.push(e.message));
  await g.goto('file://' + file); await g.waitForTimeout(300);
  const G = await g.evaluate(() => {
    window.requestAnimationFrame = () => 0; const o = {};
    const sent = []; MP.active = true; MP.isHost = false; MP.playerName = 'Ana';
    MP.conn = { open: true, send: m => sent.push(m) }; MP.connected = true;
    handleNetData({ type: 'welcome', id: 'g2', idx: 2, ig: 0 }, false);
    o.id = myNetId(); o.lobby = !document.getElementById('mplobby').classList.contains('hide');
    handleNetData({ type: 'lobby', players: [{ id: 'host', name: 'Hugo', ready: true, host: true }, { id: 'g1', name: 'Bia', ready: true }, { id: 'g2', name: 'Ana', ready: false }], info: 'Mundo novo: Neve', ig: 0 }, false);
    o.rows = document.querySelectorAll('#mplobby .lob-slot').length; o.empty = document.querySelectorAll('#mplobby .lob-slot.empty').length;
    o.readyVisible = !document.getElementById('btnLobReady').classList.contains('hide');
    o.startHidden = document.getElementById('btnLobStart').classList.contains('hide');
    o.noKick = document.querySelectorAll('#mplobby .kick').length === 0;
    document.getElementById('btnLobReady').click();
    o.readySent = sent.some(m => m.type === 'ready' && m.r === 1);
    o.title = document.getElementById('lobTitle').textContent;
    // em partida: quem saiu some
    remotePlayers = { g1: { id: 'g1', name: 'Bia', alive: true, x: 1, y: 1 }, g3: { id: 'g3', name: 'Caio', alive: true, x: 2, y: 2 } };
    handleNetData({ type: 'lobby', players: [{ id: 'host', name: 'Hugo', ready: true, host: true }, { id: 'g1', name: 'Bia' }, { id: 'g3', name: 'Caio', away: true }], ig: 1 }, false);
    o.pruned = !!remotePlayers.g1 && !remotePlayers.g3;
    // expulsao e sala cheia levam de volta a tela de entrar
    handleNetData({ type: 'kick', why: 'kick' }, false);
    o.kickBack = !document.getElementById('mpjoinscreen').classList.contains('hide') && /removido/.test(document.getElementById('joinStatus').textContent);
    MP.active = true; MP.isHost = false; showScreen('mpjoinscreen');
    handleNetData({ type: 'full', why: 'cheia' }, false);
    o.fullMsg = /cheia/.test(document.getElementById('joinStatus').textContent) && MP.active === false;
    // a sala descarta lixo
    MP.active = true; handleNetData({ type: 'lobby', players: 'x' }, false); handleNetData({ type: 'welcome', id: 'host', idx: 0 }, false);
    o.safe = myNetId() !== 'host';
    return o;
  });
  ok(G.id === 'g2' && G.lobby, 'convidado recebe a vaga e ve a sala');
  ok(G.rows === 4 && G.empty === 1, 'sala mostra 4 vagas (3 ocupadas, 1 livre)');
  ok(G.readyVisible && G.startHidden && G.noKick, 'convidado ve PRONTO, nao ve INICIAR nem expulsar');
  ok(G.readySent, 'PRONTO envia o aviso ao host');
  ok(/HUGO/.test(G.title), 'titulo mostra o nome do host (' + G.title + ')');
  ok(G.pruned, 'em partida, quem saiu some do mundo dos outros convidados');
  ok(G.kickBack && G.fullMsg, 'expulso ou sala cheia volta a tela de entrar com aviso');
  ok(G.safe, 'mensagens invalidas da sala sao ignoradas');

  ok(errs.length === 0, 'sem erros de JS (' + errs.join(' | ') + ')');
  await b.close(); console.log(bad ? '\n' + bad + ' falha(s)' : '\nTodos os testes passaram'); process.exit(bad ? 1 : 0);
})();
