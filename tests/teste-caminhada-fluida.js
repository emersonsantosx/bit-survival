/* Caminhada fluida do personagem (so o DESENHO muda; mira, golpe, tiro e movimento continuam instantaneos):
   - passada: pernas alternam e o corpo sobe 1 px quando elas se cruzam; correr balanca mais que andar;
   - parado: respira (1 px); com a vara de pesca na mao nao balanca (a linha sai da ponta exata);
   - giro suave: o corpo gira aos poucos pelo caminho mais curto, mas P.face (mira) muda na hora;
   - zumbis, menu de skins e o save nao mudam; aliados do multiplayer recebem a mesma animacao.
   Uso: node tests/teste-caminhada-fluida.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) bad++; };
  const pg = await (await b.newContext({ viewport: { width: 878, height: 405 }, hasTouch: true })).newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); await pg.goto('file://' + file); await pg.waitForTimeout(300);
  const R = await pg.evaluate(() => {
    localStorage.clear(); selectedMap = 'forest'; pendingSlot = 1; showScreen(null); newGame(); document.getElementById('hud').classList.remove('hide'); state = 'play'; updateHud(true);
    const o = {};
    // desenha o personagem sobre fundo liso e devolve {hash, topo} da imagem
    const foto = (extra, face, t) => {
      const T0 = T; if (t !== undefined) T = t;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#777'; ctx.fillRect(0, 0, 120, 120);
      ctx.setTransform(1, 0, 0, 1, 60, 80); human(0, 0, face, { ...myLook(), wpn: 'fists', ...extra }); ctx.restore(); T = T0;
      const d = ctx.getImageData(0, 0, 120, 120).data; let h = 0, topo = -1;
      for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) { const i = (y * 120 + x) * 4; if (d[i] !== 119 || d[i + 1] !== 119 || d[i + 2] !== 119) { h = (h * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2] + x * 13 + y) | 0; if (topo < 0) topo = y; } }
      return { h, topo };
    };
    const A = Math.PI / 2;
    const tr = ctx.getTransform();
    // 1) passada: 4 fases distintas e todas diferentes de parado; o corpo sobe quando as pernas se cruzam
    const fases = [0, A, Math.PI, -A].map(a => foto({ moving: true, anim: a }, 0, 0));
    const parado = foto({ moving: false, anim: 0 }, 0, 0);
    o.fasesDistintas = new Set(fases.map(f => f.h)).size; o.fasesIguaisParado = fases.some(f => f.h === parado.h);
    o.sobe = fases[1].topo - fases[0].topo;                      // cruzando (anim 0): corpo 1 px mais alto que com a perna levantada
    // pernas alternam: fase A e fase -A sao imagens espelhadas em termos de perna, entao diferentes
    o.alterna = fases[1].h !== fases[3].h;
    // 2) correr balanca mais: mesma fase, imagem diferente de andar
    o.corre = foto({ moving: true, anim: A, sprint: true }, 0, 0).h !== fases[1].h;
    // bracos: de lado, a fase muda a posicao do braco solto (sem arma)
    o.bracoLado = foto({ moving: true, anim: A }, 0, 0).h !== foto({ moving: true, anim: -A }, 0, 0).h;
    o.bracoFrente = foto({ moving: true, anim: A }, Math.PI / 2, 0).h !== foto({ moving: true, anim: -A }, Math.PI / 2, 0).h;
    // 3) respiracao: instantes diferentes do ciclo mudam a imagem; com a vara de pesca nao
    o.respira = foto({ moving: false }, 0, 0).h !== foto({ moving: false }, 0, .6545).h;
    o.varaSemBalanco = foto({ moving: false, wpn: 'fishingrod' }, 0, 0).h === foto({ moving: false, wpn: 'fishingrod' }, 0, .6545).h;
    // zumbi: igual em qualquer instante e nao sobe (mesma imagem com/sem respiracao/corrida)
    const zb = { zombie: true, kind: 0, zv: 0, skin: '#8a9a7a', shirt: '#5a4a3a', hair: '#222', moving: true, anim: A };
    o.zumbiIgual = foto(zb, 0, 0).h === foto(zb, 0, .6545).h && foto(zb, 0, 0).h === foto({ ...zb, sprint: true }, 0, 0).h;
    // transform do canvas volta ao que era (save/restore equilibrado com o balanco do corpo)
    const tr2 = ctx.getTransform(); o.transform = tr.a === tr2.a && tr.d === tr2.d && tr.e === tr2.e && tr.f === tr2.f;
    // 4) giro suave: face real muda na hora, o corpo alcanca aos poucos pelo caminho mais curto
    const e = { face: 0 }; lookFace(e);
    e.face = Math.PI / 2; e._vt = performance.now() - 16; const v1 = lookFace(e);
    o.giroInicio = v1 > 0 && v1 < Math.PI / 2 - .05; o.faceReal = e.face === Math.PI / 2;
    let passos = 0; while (Math.abs(e._vf - e.face) > .001 && passos < 400) { e._vt = performance.now() - 16; lookFace(e); passos++; }
    o.giroFim = Math.abs(e._vf - e.face) < .001 && passos > 3 && passos < 120; o.giroPassos = passos;
    const w = { face: -3 }; lookFace(w); w._vf = 3.0; w._vt = performance.now() - 16; w.face = -3.0; const v2 = lookFace(w);
    o.caminhoCurto = v2 > 3.0;                                   // 3.0 -> -3.0 passa por PI (0,28 rad), nao por 0 (6 rad)
    const p = { face: 1 }; lookFace(p); p._vt = performance.now() - 2000; p.face = -2; o.pausaSemAnimar = lookFace(p) === -2;   // volta de uma pausa: sem girar
    // 5) no jogo: P.face fica instantaneo; o desenho usa P._vf; o save nao grava _vf; o frame nao da erro
    P.face = 0; P.moving = true; P.walk = 1; render();
    P.face = Math.PI / 2; render();
    o.pFaceInstante = P.face === Math.PI / 2; o.pVf = typeof P._vf === 'number' && P._vf < Math.PI / 2 - .01;
    saveGame(); const raw = localStorage.getItem(slotKey(curSlot)) || ''; o.saveLimpo = raw.length > 100 && raw.indexOf('_vf') < 0;
    // 6) aliado remoto recebe a mesma animacao
    let erroRP = null;
    try {
      remotePlayers['t1'] = { id: 't1', x: P.x + 40, y: P.y, face: 0, moving: true, anim: 1, skin: 1, weapon: 'fists', hp: 100, alive: true, name: 'Amigo' };
      render(); remotePlayers['t1'].face = 2; render();
    } catch (er) { erroRP = er.message; }
    const rp = remotePlayers['t1']; o.aliado = !erroRP && rp && typeof rp._vf === 'number'; o.erroRP = erroRP; delete remotePlayers['t1'];
    // 7) menu de skins desenha sem erro
    let erroMenu = null; try { const cv = document.createElement('canvas'); cv.width = 40; cv.height = 50; for (let i = 0; i < 4; i++) drawSkinPreview(cv, i); } catch (er) { erroMenu = er.message; }
    o.menu = !erroMenu;
    return o;
  });
  ok(R.fasesDistintas === 3, 'passada: perna esquerda, cruzamento e perna direita sao 3 poses diferentes (' + R.fasesDistintas + ')');
  ok(!R.fasesIguaisParado, 'andar nunca fica igual a parado');
  ok(R.alterna, 'as pernas alternam (fase e fase oposta sao diferentes)');
  ok(R.sobe === 1, 'o corpo sobe 1 px quando as pernas se cruzam (diferenca ' + R.sobe + ')');
  ok(R.corre, 'correr balanca diferente de andar na mesma fase');
  ok(R.bracoLado && R.bracoFrente, 'o braco balanca de lado e de frente');
  ok(R.respira, 'parado: respira (imagem muda ao longo do ciclo)');
  ok(R.varaSemBalanco, 'com a vara de pesca na mao nao balanca');
  ok(R.zumbiIgual, 'zumbi desenha igual (sem balanco, respiracao nem corrida)');
  ok(R.transform, 'o desenho deixa o canvas como estava');
  ok(R.giroInicio && R.faceReal, 'giro suave: o corpo comeca a girar e a face real muda na hora');
  ok(R.giroFim, 'o corpo alcanca a direcao em poucos quadros (' + R.giroPassos + ')');
  ok(R.caminhoCurto, 'gira pelo caminho mais curto (de 3,0 para -3,0 passa por PI)');
  ok(R.pausaSemAnimar, 'voltando de uma pausa o corpo ja aparece virado, sem girar');
  ok(R.pFaceInstante && R.pVf, 'no jogo P.face (mira) e instantaneo e o desenho atrasa um pouco');
  ok(R.saveLimpo, 'o save nao grava o estado do desenho (_vf)');
  ok(R.aliado, 'aliado do multiplayer recebe o giro suave' + (R.erroRP ? ': ' + R.erroRP : ''));
  ok(R.menu, 'menu de skins desenha sem erro');
  ok(errs.length === 0, 'sem erros de JS' + (errs.length ? ': ' + errs[0] : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})();
