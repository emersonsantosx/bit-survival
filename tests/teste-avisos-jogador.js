/* Avisos sobre o jogador aparecem num balaozinho em cima do personagem (say), avisos do jogo continuam no topo (toast);
   a katana e reta (ícone, na mao) e o 3o golpe seguido nao mostra mais o texto COMBO (o dano extra continua). */
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
    localStorage.clear(); window.requestAnimationFrame = () => 0; selectedMap = 'forest'; weather = 'none'; newGame(); showScreen(null); state = 'play';
    zombies.length = 0; weatherTimer = 99999; P.dead = false; P.hp = 100;
    const tel = document.getElementById('toast'); tel.textContent = ''; tel.classList.remove('show');
    // 1) aviso do jogador: balao, sem toast
    say('Inventário cheio'); o.say = P._say && P._say.txt; o.toastCalado = tel.textContent === '';
    const FT = CanvasRenderingContext2D.prototype.fillText; let desenhou = 0;
    CanvasRenderingContext2D.prototype.fillText = function (t) { if (t === 'Inventário cheio') desenhou++; return FT.apply(this, arguments); };
    for (let i = 0; i < 6; i++) { update(1 / 60); render(); }
    o.desenhou = desenhou;
    // some sozinho
    for (let i = 0; i < 160; i++) update(1 / 60); o.sumiu = !P._say;
    // 2) aviso do jogo continua no toast
    toast('Chuva: fogueiras apagam e stamina cai mais'); o.toastTexto = tel.textContent;
    // 3) o save nao leva o balao (campo _say) e a mochila cheia usa say
    say('Você está sangrando!'); o.saveSemSay = !JSON.stringify(P, (k, v) => k[0] === '_' ? undefined : v).includes('sangrando');
    // 4) katana: 3 golpes seguidos sem texto COMBO, dano do 3o maior
    CanvasRenderingContext2D.prototype.fillText = FT;
    floaters.length = 0; const w = WEAPONS.katana; P._cmb = 0; P._cmbT = 0; const d = [meleeDmg(w), meleeDmg(w), meleeDmg(w)];
    o.dano = d; o.combo = floaters.some(f => /COMBO/i.test(f.txt));
    // 5) sprites retos
    const K = PXG.katana, H = PXG.katana_h;
    const lam = K.slice(0, 7).map(l => { const m = [...l].map((c, i) => 'SW'.includes(c) ? i : -1).filter(i => i >= 0); return m[0]; });
    o.lamDiag = lam.every((c, i) => i === 0 || c === lam[i - 1] - 1 || i === 1 && c === lam[0] - 1);
    o.lamTodas = K.slice(1, 7).map(l => [...l].filter(c => 'SW'.includes(c)).length);
    const colsH = l => { const m = [...l].map((c, i) => 'SW'.includes(c) ? i : -1).filter(i => i >= 0); return [m[0], m[m.length - 1]]; };
    o.hLinhas = H.map((l, i) => /[SW]/.test(l) ? i : -1).filter(i => i >= 0);
    return o;
  });
  ok(r.say === 'Inventário cheio' && r.toastCalado, 'aviso do jogador vira balao e nao usa o toast do topo');
  ok(r.desenhou >= 1, 'o balao e desenhado em cima do personagem (' + r.desenhou + ' vezes)');
  ok(r.sumiu, 'o balao some sozinho');
  ok(/Chuva/.test(r.toastTexto), 'aviso do jogo (clima) continua no topo');
  ok(r.saveSemSay, 'o balao nao entra no save');
  ok(r.combo === false && r.dano[2] > r.dano[0] * 1.5, 'sem texto COMBO e o 3o golpe segue com dano extra (' + r.dano.join(', ') + ')');
  ok(r.lamDiag && r.lamTodas.every(n => n === 2), 'katana do icone: lamina reta em diagonal (2 pixels por linha, sem dobra)');
  ok(r.hLinhas.length === 2 && r.hLinhas[1] === r.hLinhas[0] + 1, 'katana na mao: lamina reta em 2 linhas (' + r.hLinhas.join(',') + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
