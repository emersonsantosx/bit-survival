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
    const L = m => sayLines(m).map(l => l.t); o.tit = sayLines('Pegou: Madeira'); o.arv = sayLines('Árvore derrubada! +3 Madeira'); o.ped = sayLines('Pedra quebrada! +2 Pedra'); o.col = sayLines('Colheu: 3 Milho e 2 sementes'); o.mun = sayLines('+12 munição'); o.fru = sayLines('Colheu: 3 Maçã · 1 no chão (inventário cheio)'); o.cac = sayLines('Caçou: Carne crua'); o.pla = sayLines('Plantou: Milho'); o.todos = Object.keys(ITEMS).every(k => /^rgb\(/.test(itemColor(ITEMS[k].n))); o.peixes = Object.keys(FISH).every(k => /^rgb\(/.test(itemColor(FISH[k].n))); o.cores = ['Madeira', 'Pedra', 'Munição', 'Maçã'].map(itemColor); o.semItem = sayLines('Inventário cheio').every(l => !l.i); o.l1 = L('Pegou: Madeira'); o.l2 = L('Pegou: Pistola (+12 munição)'); o.l3 = L('Sede saciada · inventário cheio'); o.l4 = L('Você já tem Pistola: deixe pro parceiro e coma depois de assar tudo isso aqui');
    const FT = CanvasRenderingContext2D.prototype.fillText; let desenhou = 0;
    CanvasRenderingContext2D.prototype.fillText = function (t) { if (/Pistola|munição/.test(t)) desenhou++; return FT.apply(this, arguments); };
    for (let i = 0; i < 6; i++) { update(1 / 60); render(); }
    o.desenhou = desenhou;
    // neon: contorno escuro + brilho (shadowBlur) na cor do aviso + miolo claro, e o brilho e desligado no fim (nao vaza para o resto do quadro)
    { const ST = CanvasRenderingContext2D.prototype.strokeText; let strokes = 0, blurMax = 0; const cores = new Set(), miolo = [];
      CanvasRenderingContext2D.prototype.strokeText = function (t) { if (/Pistola|munição/.test(t)) strokes++; return ST.apply(this, arguments); };
      CanvasRenderingContext2D.prototype.fillText = function (t) { if (/Pistola|munição/.test(t)) { blurMax = Math.max(blurMax, this.shadowBlur); if (this.shadowBlur) cores.add(this.shadowColor); else miolo.push(this.fillStyle); } return FT.apply(this, arguments); };
      floaters.length = 0; say('Pegou: Pistola (+12 munição)'); render();
      CanvasRenderingContext2D.prototype.strokeText = ST; CanvasRenderingContext2D.prototype.fillText = FT;
      o.neon = { strokes, blurMax, brilhos: cores.size, miolo: miolo.length, sobra: ctx.shadowBlur }; }
    // some sozinho
    for (let i = 0; i < 200; i++) update(1 / 60); o.sumiu = !floaters.some(f => f.say); say('Comeu'); say('Pegou: Sementes de milho', 1); o.junto = floaters.find(f => f.say).lines.map(l => l.t).join('|');
    // 2) aviso do jogo continua no toast
    toast('Chuva: fogueiras apagam e stamina cai mais'); o.toastTexto = tel.textContent;
    // 4) katana: 3 golpes seguidos sem texto COMBO, dano do 3o maior
    CanvasRenderingContext2D.prototype.fillText = FT;
    floaters.length = 0; const w = WEAPONS.katana; P._cmb = 0; P._cmbT = 0; const d = [meleeDmg(w), meleeDmg(w), meleeDmg(w)];
    o.dano = d; o.combo = floaters.some(f => /COMBO/i.test(f.txt));
    // 6) dentro de casa o aviso nao some perto da parede (antes era cortado no limite do predio)
    floaters.length = 0; const bl = blds.find(q => q.w > 60 && q.h > 60) || blds[0]; P.inside = bl; P.x = bl.x + 6; P.y = bl.y + bl.h / 2;
    for (let i = 0; i < 3; i++) { update(1 / 60); render(); } P.inside = bl;
    const reg = () => { const x0 = Math.floor((bl.x - 22 - camX) * Z), x1 = Math.ceil((bl.x - 2 - camX) * Z), y0 = Math.floor((P.y - 32 - camY) * Z), y1 = Math.ceil((P.y - 16 - camY) * Z); return ctx.getImageData(Math.max(0, x0), Math.max(0, y0), Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data; };
    render(); const sem = reg(); say('Inventário cheio'); render(); const com = reg();
    let dif = 0; for (let i = 0; i < com.length; i += 4) if (Math.abs(com[i] - sem[i]) + Math.abs(com[i + 1] - sem[i + 1]) + Math.abs(com[i + 2] - sem[i + 2]) > 60) dif++;
    o.foraDoPredio = dif; let fp = null; { const FT2 = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t) { if (t === 'Inventário cheio') fp = parseInt(this.font.match(/(\d+)px/)[1]); return FT2.apply(this, arguments); }; render(); CanvasRenderingContext2D.prototype.fillText = FT2; } o.fontePx = fp;
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
  ok([r.l1, r.l2, r.l3, r.l4].every(l => l.length >= 1 && l.length <= 3 && l.every(x => x.length <= 18 || !x.includes(' '))), 'texto vira bloco de ate 3 linhas curtas (' + JSON.stringify([r.l2, r.l3]) + ')');
  const T_ = a => a.map(l => l.t + (l.b ? '*' : '')).join('|');
  ok(T_(r.tit) === 'Madeira*|+1' && T_(r.arv) === 'Madeira*|+3' && T_(r.ped) === 'Pedra*|+2' && T_(r.col) === 'Milho*|+3|+2 sementes' && T_(r.mun) === 'Munição*|+12', 'ganho de item: nome em negrito e a quantidade embaixo (' + T_(r.arv) + ', ' + T_(r.col) + ')');
  ok(r.cores.every(c => /^rgb\(/.test(c)) && new Set(r.cores).size === 4 && r.semItem, 'o negrito do item tem a cor do item (' + r.cores.join(' ') + ') e textos comuns nao');
  ok(r.todos && r.peixes, 'todo item e todo peixe tem cor propria');
  ok(T_(r.fru) === 'Maçã*|+3|1 no chão (inventário cheio)' && T_(r.cac) === 'Carne crua*|Caçou' && T_(r.pla) === 'Milho*|Plantou', 'colheita, caca e plantio: item em negrito colorido');
  ok(r.junto === 'Comeu|Sementes de milho|+1', 'semente ganha ao comer entra junto com o aviso de comer (' + r.junto + ')');
  ok(r.foraDoPredio > 10, 'dentro de casa o aviso aparece inteiro, tambem na parte preta fora do predio (' + r.foraDoPredio + ' pixels fora do predio)');
  ok(r.neon.strokes >= 2 && r.neon.blurMax >= 6 && r.neon.brilhos >= 1 && r.neon.miolo >= 2, 'avisos do jogador em neon: contorno escuro, brilho colorido e miolo claro (' + JSON.stringify(r.neon) + ')');
  ok(r.neon.sobra === 0, 'o brilho do neon nao vaza para o resto do desenho');
  ok(r.fontePx <= 7, 'fonte dos avisos do jogador menor (' + r.fontePx + ' px)');
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
