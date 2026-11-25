/* Sair da sala do multiplayer (host fecha a sala ou convidado sai) volta ao menu MULTIPLAYER (criar sala / entrar em sala / voltar),
   e o host aguenta varias remocoes + reentradas com o mesmo codigo sem perder vaga nem ficar com estado velho.
   Usa conexoes falsas (sem PeerJS). Uso: node tests/teste-multiplayer-sair-sala.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const R = await pg.evaluate(async () => {
    window.requestAnimationFrame = () => 0; localStorage.clear(); window.loadPeerJS = function () {};
    const mk = () => ({ open: true, sent: [], h: {}, send(m) { this.sent.push(JSON.parse(JSON.stringify(m))); }, close() { this.open = false; if (this.h.close) this.h.close(); }, on(e, f) { this.h[e] = f; } });
    const last = (c, t) => { for (let i = c.sent.length - 1; i >= 0; i--) if (c.sent[i].type === t) return c.sent[i]; return null; };
    const join = n => { const c = mk(); hostAcceptConn(c); c.h.data({ type: 'hello', name: n, prev: null }); return c; };
    const tela = () => [...document.querySelectorAll('.screen')].filter(s => !s.classList.contains('hide')).map(s => s.id).join(',');
    const o = { reentradas: [] };
    mpSlot = 0; mpHostStart(); document.getElementById('btnHostCreate').click();
    for (let i = 0; i < 8; i++) { const c = join('Ana'); const w = last(c, 'welcome'); o.reentradas.push(w ? w.id : (last(c, 'full') || {}).why); if (w) { hostKick(w.id); await new Promise(r => setTimeout(r, 330)); } }
    o.rosterVazio = Object.keys(MP.roster).length === 0;
    // host fecha a sala
    o.lobbyAntes = tela();
    lobbyLeave();
    o.hostTela = tela(); o.hostLobbyOn = MP.lobbyOn; o.hostAtivo = MP.active;
    // convidado: leva o chute, depois entra de novo e sai
    MP.active = true; MP.isHost = false; MP.lobbyOn = true; showScreen('mplobby');
    handleNetData({ type: 'kick', why: 'kick' }, false);
    o.chuteTela = tela(); o.chuteMsg = document.getElementById('joinStatus').textContent; o.chuteLobbyOn = MP.lobbyOn;
    MP.active = true; MP.isHost = false; MP.lobbyOn = true; showScreen('mplobby');
    lobbyLeave();
    o.convTela = tela(); o.convLobbyOn = MP.lobbyOn;
    return o;
  });
  ok(R.reentradas.every(x => x === 'g1'), 'o mesmo jogador entra de novo 8 vezes depois de ser removido, sempre na vaga g1 (' + R.reentradas.join(',') + ')');
  ok(R.rosterVazio, 'depois da ultima remocao a lista de jogadores esta vazia');
  ok(R.lobbyAntes === 'mplobby', 'o host estava na sala');
  ok(R.hostTela === 'mpscreen', 'host fecha a sala e cai no menu MULTIPLAYER (criar / entrar / voltar), nao no formulario (' + R.hostTela + ')');
  ok(R.hostLobbyOn === false && R.hostAtivo === false, 'sala fechada limpa o estado da sala');
  ok(R.chuteTela === 'mpjoinscreen' && /removido/.test(R.chuteMsg) && R.chuteLobbyOn === false, 'convidado removido volta a tela de entrar com o aviso (e sem estado de sala)');
  ok(R.convTela === 'mpscreen' && R.convLobbyOn === false, 'convidado que sai da sala cai no menu MULTIPLAYER (' + R.convTela + ')');
  ok(errs.length === 0, 'sem erros de JS: ' + errs.join(' | '));
  await b.close(); if (bad) { console.log(bad + ' falhou'); process.exit(1); } console.log('Todos os testes passaram');
})();
