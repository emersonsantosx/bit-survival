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
    floaters.length = 0; say('Inventário cheio'); const fl = floaters.find(f => f.say); o.say = fl && fl.txt; o.longa = fl && fl.t; o.toastCalado = tel.textContent === ''; say('Pegou: Pistola (+12 munição)'); o.umPorVez = floaters.filter(f => f.say).length; o.longaMais = floaters.find(f => f.say).t; o.curto = floaters.find(f => f.say).txt;
    const L = m => sayLines(m).map(l => l.t); o.tit = sayLines('Pegou: Madeira'); o.arv = sayLines('Árvore derrubada! +3 Madeira'); o.ped = sayLines('Pedra quebrada! +2 Pedra'); o.col = sayLines('Colheu: 3 Milho e 2 sementes'); o.mun = sayLines('+12 munição'); o.cores = ['Madeira', 'Pedra', 'Munição', 'Maçã'].map(itemColor); o.semItem = sayLines('Inventário cheio').every(l => !l.i); o.l1 = L('Pegou: Madeira'); o.l2 = L('Pegou: Pistola (+12 munição)'); o.l3 = L('Sede saciada · inventário cheio'); o.l4 = L('Você já tem Pistola: deixe pro parceiro e coma depois de assar tudo isso aqui');
    const FT = CanvasRenderingContext2D.prototype.fillText; let desenhou = 0;
    CanvasRenderingContext2D.prototype.fillText = function (t) { if (/Pistola|munição/.test(t)) desenhou++; return FT.apply(this, arguments); };
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
  ok(r.l1.join('|') === 'Madeira|+1' && r.curto === 'Pistola +12 munição' && r.l2.join('|') === 'Pistola|+12 munição', 'avisos de pegar ficam curtos (' + r.l1 + ' / ' + r.curto + ')');
  ok([r.l1, r.l2, r.l3, r.l4].every(l => l.length >= 1 && l.length <= 3 && l.every(x => x.length <= 16 || !x.includes(' '))), 'texto vira bloco de ate 3 linhas curtas (' + JSON.stringify([r.l2, r.l3]) + ')');
  const T_ = a => a.map(l => l.t + (l.b ? '*' : '')).join('|');
  ok(T_(r.tit) === 'Madeira*|+1' && T_(r.arv) === 'Madeira*|+3' && T_(r.ped) === 'Pedra*|+2' && T_(r.col) === 'Milho*|+3|+2 sementes' && T_(r.mun) === 'Munição*|+12', 'ganho de item: nome em negrito e a quantidade embaixo (' + T_(r.arv) + ', ' + T_(r.col) + ')');
  ok(r.cores.every(c => /^rgb\(/.test(c)) && new Set(r.cores).size === 4 && r.semItem, 'o negrito do item tem a cor do item (' + r.cores.join(' ') + ') e textos comuns nao');
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
