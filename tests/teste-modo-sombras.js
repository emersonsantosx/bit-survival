// Modo de sombras (CONFIGURACOES > DESEMPENHO): 0 desligadas, 1 simples (elipses), 2 avancadas (silhueta). Padrao 2.
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
let falhas = 0;
const ok = (c, m) => { console.log(c ? 'OK  ' : 'FAIL', m); if (!c) falhas++; };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => {
    const o = {};
    localStorage.clear();
    o.padrao = shadowMode();
    o.botoes = [...document.querySelectorAll('#cfg_shadows button')].map(b => b.dataset.v).join(',');
    window.requestAnimationFrame = () => 0;
    selectedMap = 'forest'; weather = 'none'; CFG.quality = 0; CFG.autoperf = false; newGame(); showScreen(null); state = 'play';
    T = ((12 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; zombies.length = 0; for (let i = 0; i < 30; i++) update(.03);
    // arvore e jogador bem na frente da camera
    const sh = {};
    const medir = (modo) => {   // pixels escurecidos pela sombra, medindo a diferenca entre o quadro com e sem o sol
      CFG.shadows = modo; for (let i = 0; i < 3; i++) render();
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) | 0; return h;
    };
    const P2 = Object.getPrototypeOf(cv.getContext('2d')), fe = P2.ellipse; let ne = 0; P2.ellipse = function (...a) { ne++; return fe.apply(this, a); };
    o.elip = {}; for (const m of [0, 1, 2]) { CFG.shadows = m; for (let i = 0; i < 2; i++) render(); ne = 0; render(); o.elip[m] = ne; }
    P2.ellipse = fe;
    sh[0] = medir(0); sh[1] = medir(1); sh[2] = medir(2);
    o.diferentes = sh[0] !== sh[1] && sh[1] !== sh[2] && sh[0] !== sh[2];
    // contagem de sombras de silhueta usadas por modo
    let chamadas = 0; const f = window.sunShadow;
    for (const m of [0, 1, 2]) {
      CFG.shadows = m;
      let ret = f(trees[0].x, trees[0].y, 'tree', trees[0]);
      o['ret' + m] = ret;
    }
    CFG.shadows = 7; o.invalido = shadowMode();
    // noite com lanterna: so o modo avancado corta o feixe com a silhueta dos objetos
    T = ((23 - START_HOUR + 24) % 24) / 24 * DAY_SECONDS; for (let i = 0; i < 10; i++) update(.03);
    P.torch = true; P.flashOn = true;
    let best = null; for (const t of trees) { const d = Math.hypot(t.x - P.x, t.y - P.y); if (!best || d < best.d) best = { t, d }; }
    if (best) { P.x = best.t.x - 45; P.y = best.t.y; P.face = 0; }
    for (const m of [0, 1, 2]) { CFG.shadows = m; for (let i = 0; i < 4; i++) render(); o['feixeOcc' + m] = !!(lightBeams().some(b => b.occ && b.occ.length)); }
    // configuracao: clicar no botao troca o modo e salva
    CFG.shadows = 2; document.querySelector('#cfg_shadows button[data-v="1"]').click(); o.clique = CFG.shadows; o.salvo = JSON.parse(localStorage.getItem('minisurv_cfg')).shadows;
    return o;
  });
  ok(r.padrao === 2, 'padrao: sombras avancadas');
  ok(r.botoes === '0,1,2', 'tres botoes em DESEMPENHO (desligadas, simples, avancadas)');
  ok(r.diferentes, 'os tres modos desenham imagens diferentes');
  ok(r.elip[1] > r.elip[0] && r.elip[1] > r.elip[2], 'o modo simples e o unico que desenha as sombras em elipse (elipses por quadro: ' + [r.elip[0], r.elip[1], r.elip[2]] + ')');
  ok(r.ret0 === true && r.ret1 === false && r.ret2 === true, 'sunShadow: desligado resolve sem desenhar, simples devolve falso (elipse), avancado desenha a silhueta (' + [r.ret0, r.ret1, r.ret2] + ')');
  ok(r.invalido === 2, 'valor invalido cai no modo avancado');
  ok(!r.feixeOcc0 && !r.feixeOcc1 && r.feixeOcc2, 'feixe da lanterna so recorta a silhueta dos objetos no modo avancado (' + [r.feixeOcc0, r.feixeOcc1, r.feixeOcc2] + ')');
  ok(r.clique === 1 && r.salvo === 1, 'o botao troca e salva o modo');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join('|'));
  await b.close();
  if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); } else console.log('Todos os testes passaram');
})();
