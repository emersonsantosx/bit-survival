/* Avisos sobre o jogador (inventario cheio, pegou, sem municao...) sobem da cabeca do personagem como texto simples, sem fundo (say);
   status (sangrando, frio, calor, queimadura) e avisos do jogo continuam no topo (toast);
   a katana e reta (ícone, na mao) e o 3o golpe seguido nao mostra mais o texto COMBO (o dano extra continua). */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
const fs = require('fs');
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
    floaters.length = 0; say('Inventário cheio'); const fl = floaters.find(f => f.say); o.say = fl && fl.txt; o.longa = fl && fl.t; o.toastCalado = tel.textContent === ''; say('Pegou: Pistola (+12 munição)'); o.umPorVez = floaters.filter(f => f.say).length; o.longaMais = floaters.find(f => f.say).t;
    const FT = CanvasRenderingContext2D.prototype.fillText; let desenhou = 0;
    CanvasRenderingContext2D.prototype.fillText = function (t) { if (t === 'Pegou: Pistola (+12 munição)') desenhou++; return FT.apply(this, arguments); };
    for (let i = 0; i < 6; i++) { update(1 / 60); render(); }
    o.desenhou = desenhou;
    // some sozinho
    for (let i = 0; i < 200; i++) update(1 / 60); o.sumiu = !floaters.some(f => f.say);
    // 2) aviso do jogo continua no toast
    toast('Chuva: fogueiras apagam e stamina cai mais'); o.toastTexto = tel.textContent;
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
  ok(r.say === 'Inventário cheio' && r.toastCalado, 'aviso do jogador sobe da cabeca e nao usa o toast do topo');
  ok(r.desenhou >= 1, 'o texto e desenhado (' + r.desenhou + ' vezes)');
  ok(r.umPorVez === 1 && r.longaMais > r.longa && r.longa >= 1.2 && r.longaMais <= 2.4, 'um aviso por vez; texto maior dura um pouco mais (' + r.longa.toFixed(2) + ' s e ' + r.longaMais.toFixed(2) + ' s)');
  ok(r.sumiu, 'o texto some sozinho');
  ok(/Chuva/.test(r.toastTexto), 'aviso do jogo (clima) continua no topo');
  const src = fs.readdirSync(path.join(__dirname, '..', 'js')).map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  ok(!/say\('(Você está sangrando|Você está com frio|Você está congelando|Calor forte|Insolação|Você se queimou)/.test(src), 'status (sangrando, frio, calor, queimadura) continuam no topo');
  ok(r.combo === false && r.dano[2] > r.dano[0] * 1.5, 'sem texto COMBO e o 3o golpe segue com dano extra (' + r.dano.join(', ') + ')');
  ok(r.lamDiag && r.lamTodas.every(n => n === 2), 'katana do icone: lamina reta em diagonal (2 pixels por linha, sem dobra)');
  ok(r.hLinhas.length === 2 && r.hLinhas[1] === r.hLinhas[0] + 1, 'katana na mao: lamina reta em 2 linhas (' + r.hLinhas.join(',') + ')');
  ok(errs.length === 0, 'sem erros de JS ' + errs.join(';'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
