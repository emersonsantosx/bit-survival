/* Entrar em sala: aviso melhor quando nao da para entrar + reentrada rapida.
   - cada erro diz o que houve e o que fazer; erro vira painel vermelho; erro de codigo marca o campo; o botao fica bloqueado so enquanto conecta;
   - o codigo da ultima sala em que entrou vem preenchido (e some se o host encerrar a sala); sem alert do navegador.
   Usa conexoes falsas (sem PeerJS). Uso: node tests/teste-multiplayer-entrada.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await b.newPage({ viewport: { width: 878, height: 405 } }); const errs = [], dlg = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('dialog', d => { dlg.push(d.message()); d.dismiss(); });
  await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const R = await pg.evaluate(() => {
    window.requestAnimationFrame = () => 0; localStorage.clear();
    const $ = id => document.getElementById(id), o = {};
    const abrir = () => { showScreen('mpscreen'); $('btnMPJoin').click(); };
    // 1. primeira vez: sem codigo guardado
    abrir(); o.vazio = $('joinCode').value === '' && $('joinHint').textContent === '';
    // 2. codigo invalido: aviso claro, campo vermelho, botao liberado
    $('joinCode').value = 'AB'; $('btnJoinConnect').click();
    o.inv = { msg: $('joinStatus').textContent, err: $('joinStatus').classList.contains('err'), bad: $('joinCode').classList.contains('bad'), dis: $('btnJoinConnect').disabled };
    $('joinCode').value = 'ABC'; $('joinCode').dispatchEvent(new Event('input', { bubbles: true })); o.badSai = !$('joinCode').classList.contains('bad');
    // 3. conectando: botao bloqueado; erro libera
    setStatus('joinStatus', 'Conectando à sala...'); o.busy = { dis: $('btnJoinConnect').disabled, txt: $('btnJoinConnect').textContent };
    setStatus('joinStatus', joinErrMsg('peer-unavailable'), true, true); o.free = { dis: $('btnJoinConnect').disabled, txt: $('btnJoinConnect').textContent, bad: $('joinCode').classList.contains('bad') };
    o.msgs = ['peer-unavailable', 'network', 'socket-closed', 'webrtc', 'xyz'].map(joinErrMsg);
    // 4. entrou numa sala: guarda o codigo; ENTRAR EM SALA ja vem preenchido
    MP.roomCode = 'MINISURV-K7QX2M'; MP.isHost = false; MP.active = true; state = 'menu';
    guestRoomMsg({ type: 'welcome', id: 'g1' });
    o.salvo = localStorage.getItem('minisurv_last_room');
    MP.lobbyOn = false; MP.active = false; showScreen('mpscreen'); abrir();
    o.pre = { v: $('joinCode').value, hint: $('joinHint').textContent, bad: $('joinCode').classList.contains('bad') };
    $('joinCode').value = 'ZZZ'; $('joinCode').dispatchEvent(new Event('input', { bubbles: true })); o.hintSome = $('joinHint').textContent === '';
    // 5. sala cheia / removido: codigo continua guardado; host encerra: some
    MP.active = true; MP.lobbyOn = true; showScreen('mplobby'); handleNetData({ type: 'kick', why: 'kick' }, false); o.aposKick = localStorage.getItem('minisurv_last_room');
    MP.active = true; MP.lobbyOn = true; showScreen('mplobby'); handleNetData({ type: 'full', why: 'cheia' }, false); o.cheia = $('joinStatus').textContent; o.aposCheia = localStorage.getItem('minisurv_last_room');
    MP.active = true; MP.lobbyOn = true; showScreen('mplobby'); handleNetData({ type: 'kick', why: 'closed' }, false); o.aposFechar = localStorage.getItem('minisurv_last_room');
    abrir(); o.depois = $('joinCode').value;
    // 6. falha ao carregar o PeerJS: aviso na tela, sem alert
    window.loadPeerJS = cb => cb(new Error('peerjs')); $('joinCode').value = 'ABC123'; $('btnJoinConnect').click();
    o.p2p = { msg: $('joinStatus').textContent, dis: $('btnJoinConnect').disabled };
    const e = $('joinStatus'), cs = getComputedStyle(e);
    o.painel = { bw: parseFloat(cs.borderTopWidth), bc: cs.borderTopColor, shadow: cs.boxShadow, disp: cs.display };
    return o;
  });
  ok(R.vazio, 'primeira vez: campo do codigo vazio e sem dica');
  ok(/6 letras e números/.test(R.inv.msg) && R.inv.err && R.inv.bad && !R.inv.dis, 'codigo invalido: diz o formato certo, marca o campo e libera o botao');
  ok(R.badSai, 'digitar de novo tira a marca vermelha do campo');
  ok(R.busy.dis && R.busy.txt === 'CONECTANDO...', 'enquanto conecta o botao fica bloqueado (CONECTANDO...)');
  ok(!R.free.dis && R.free.txt === 'CONECTAR' && R.free.bad, 'erro libera o botao e marca o campo quando o problema e o codigo');
  ok(/não encontrada.*host/.test(R.msgs[0]) && /internet/.test(R.msgs[1]) && /internet/.test(R.msgs[2]) && /Wi-Fi/.test(R.msgs[3]) && /xyz/.test(R.msgs[4]), 'cada erro de rede diz o que houve e o que fazer');
  ok(R.salvo === 'K7QX2M', 'entrar numa sala guarda o codigo (sem o prefixo)');
  ok(R.pre.v === 'K7QX2M' && /última sala/.test(R.pre.hint) && !R.pre.bad, 'ENTRAR EM SALA ja vem com o codigo da ultima sala e a dica');
  ok(R.hintSome, 'a dica some quando o codigo e trocado');
  ok(R.aposKick === 'K7QX2M' && R.aposCheia === 'K7QX2M', 'removido pelo host ou sala cheia: o codigo continua guardado');
  ok(/cheia/.test(R.cheia) && /vaga/.test(R.cheia), 'sala cheia diz o que fazer');
  ok(R.aposFechar === null && R.depois === '', 'host encerrou a sala: o codigo some e o campo volta vazio');
  ok(/P2P/.test(R.p2p.msg) && /internet/.test(R.p2p.msg) && !R.p2p.dis, 'falha ao carregar o P2P avisa na tela e libera o botao');
  ok(R.painel.bw >= 3 && R.painel.bc === 'rgb(192, 99, 74)' && /0px 3px 0px/.test(R.painel.shadow) && R.painel.disp === 'flex', 'o erro aparece em painel (borda vermelha de 3 px, sombra dura)');
  ok(dlg.length === 0, 'nenhum alert do navegador');
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
