/* Marcador do multiplayer: o ponto marcado no mapa chega aos outros jogadores (so o simbolo, sem linha, nome ou distancia), aparece no mapa
   grande e no minimapa na cor de quem marcou (as mesmas do lobby), some quando ele desmarca; marcador de item e nomes do chat usam as mesmas cores.
   Uso: node tests/teste-marcador-multiplayer.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; startGame(); zombies.length = 0;
    MP.active = true; MP.connected = true; MP.gameStarted = true; MP.isHost = false; MP.netId = 'g1'; MP.playerName = 'Bia';
    // envio
    WP = { x: P.x + 400, y: P.y + 200, label: 'PONTO', follow: null }; o.envia = JSON.stringify(packMyPlayer().wp) === JSON.stringify([Math.round(WP.x), Math.round(WP.y)]);
    WP.follow = 'host'; o.seguir = packMyPlayer().wp === undefined; WP = null; o.sem = packMyPlayer().wp === undefined;
    // recebimento
    const pkt = (id, name, wp) => handleNetData({ type: 'player', id, name, x: P.x + 60, y: P.y, alive: true, face: 0, wp }, false);
    const wp = [Math.round(P.x - 500), Math.round(P.y - 300)];
    pkt('host', 'Ana', wp); pkt('g2', 'Caio', [1e9, 5]);
    o.recebe = JSON.stringify(remotePlayers.host.wp) === JSON.stringify(wp); o.invalido = remotePlayers.g2.wp === null;
    // desenho: cores e textos
    const marks = []; const om = mmMark; mmMark = (x, y, c) => { marks.push([x, y, c]); om(x, y, c); }; mmMarkers(); mmMark = om;
    o.mini = marks.length === 1 && marks[0][0] === wp[0] && marks[0][2] === LOB_COL.host;
    const dia = [], txt = []; let dash = 0; const od = bmDiamond; bmDiamond = (g, x, y, u, c) => { dia.push(c); od(g, x, y, u, c); };
    const cp = CanvasRenderingContext2D.prototype, ft = cp.fillText, sd = cp.setLineDash;
    cp.fillText = function (s, ...a) { txt.push(String(s)); return ft.call(this, s, ...a); }; cp.setLineDash = function (a) { if (a.length) dash++; return sd.call(this, a); };
    bigMapOpen();
    o.grande = dia.join() === LOB_COL.host; o.semLinha = dash === 0; o.semTexto = !txt.includes('PONTO') && !/◆/.test($('bmleg').innerHTML);
    // o proprio marcador: minha cor, com linha, nome e distancia
    dia.length = 0; WP = { x: P.x + 400, y: P.y, label: 'PONTO', follow: null }; bigMapDraw();
    o.meu = dia.includes(LOB_COL.g1) && dash > 0 && txt.includes('PONTO') && /◆ PONTO \d+m/.test($('bmleg').textContent);
    bmDiamond = od; cp.fillText = ft; cp.setLineDash = sd; bigMapClose();
    pkt('host', 'Ana', undefined); o.some = remotePlayers.host.wp === null;
    // marcador de item: cor e nome de quem marcou (nao o primeiro da lista)
    let said = ''; const ot = toast; toast = s => { said = s; };
    handleEvt('ping', { id: 'g2', t: 'wood', x: 100, y: 100 }); o.item = pingCol(pings[pings.length - 1]) === LOB_COL.g2 && /^CAIO marcou/.test(said);
    handleEvt('ping', { id: 'host', t: 'wood', x: 120, y: 100 }); o.doisItens = pings.length === 2; toast = ot;
    // chat
    receiveChat({ id: 'g2', name: 'Caio', text: 'oi' });
    const n = [...document.querySelectorAll('.chat-bubble .cn')].pop(), h = [...document.querySelectorAll('.cm .cn')].pop();
    const rgb = c => { const d = document.createElement('i'); d.style.color = c; return d.style.color; };
    o.chat = n.style.color === rgb(LOB_COL.g2) && h.style.color === rgb(LOB_COL.g2);
    return o;
  });
  const nomes = { envia: 'o ponto marcado vai no pacote do jogador', seguir: 'seguir um aliado nao e enviado', sem: 'sem ponto, nada e enviado', recebe: 'o ponto do outro jogador chega', invalido: 'ponto fora do mundo e ignorado', mini: 'minimapa mostra o simbolo na cor de quem marcou', grande: 'mapa grande mostra o simbolo na cor de quem marcou', semLinha: 'ponto dos outros sem linha', semTexto: 'ponto dos outros sem nome nem distancia', meu: 'o meu ponto: minha cor, linha, nome e distancia', some: 'desmarcar apaga para os outros', item: 'marcador de item com cor e nome de quem marcou', doisItens: 'um marcador de item por jogador', chat: 'nome no chat na cor do jogador' };
  for (const k in nomes) ok(r[k], nomes[k]);
  ok(!errs.length, 'sem erros ' + errs.join(' | '));
  await b.close(); process.exit(bad ? 1 : 0);
})();
