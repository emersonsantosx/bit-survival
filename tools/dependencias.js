/* Relatorio de dependencias entre os arquivos js/ do Bit Survival (so le o codigo, nao muda nada).
   Uso: node tools/dependencias.js   (gera docs/dependencias.md)
   Resolve cada nome pelo analisador do TypeScript, entao variaveis locais que repetem o nome de uma global nao contam como uso dela. */
const fs = require('fs'), path = require('path');
let ts;
try { ts = require('typescript'); }
catch (e) { try { ts = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'typescript')); } catch (e2) { console.error('Precisa do pacote typescript (npm install).'); process.exit(1); } }

const raiz = path.join(__dirname, '..');
const arquivos = fs.readdirSync(path.join(raiz, 'js')).filter(f => f.endsWith('.js')).sort().map(f => path.join(raiz, 'js', f));
const prog = ts.createProgram(arquivos, { allowJs: true, checkJs: false, noEmit: true, target: ts.ScriptTarget.ES2020, types: [], lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'] });
const chk = prog.getTypeChecker();
const nome = f => path.basename(f.fileName).replace(/\.js$/, '');
const jsFiles = prog.getSourceFiles().filter(f => arquivos.includes(path.resolve(f.fileName)));

// 1) globais: declaracoes no nivel de cima de cada arquivo
const def = new Map();   // nome -> {arq, tipo, linha}
for (const sf of jsFiles) {
  for (const st of sf.statements) {
    const linha = sf.getLineAndCharacterOfPosition(st.getStart()).line + 1;
    if (ts.isFunctionDeclaration(st) && st.name) def.set(st.name.text, { arq: nome(sf), tipo: 'funcao', linha });
    else if (ts.isClassDeclaration(st) && st.name) def.set(st.name.text, { arq: nome(sf), tipo: 'classe', linha });
    else if (ts.isVariableStatement(st)) {
      const k = (st.declarationList.flags & ts.NodeFlags.Const) ? 'const' : (st.declarationList.flags & ts.NodeFlags.Let) ? 'let' : 'var';
      const add = (n) => { if (ts.isIdentifier(n)) def.set(n.text, { arq: nome(sf), tipo: k, linha }); else if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) n.elements.forEach(e => { if (!ts.isOmittedExpression(e)) add(e.name); }); };
      st.declarationList.declarations.forEach(d => add(d.name));
    }
  }
}

// 2) usos: para cada identificador, descobre se ele aponta para uma global de outro arquivo
const usos = new Map();   // nome -> Map(arquivo -> contagem)
for (const sf of jsFiles) {
  const eu = nome(sf);
  (function visita(n) {
    if (ts.isIdentifier(n) && def.has(n.text)) {
      const p = n.parent;
      const ehProp = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isMethodDeclaration(p) && p.name === n) || (ts.isShorthandPropertyAssignment(p) && false);
      if (!ehProp) {
        const sym = chk.getSymbolAtLocation(n);
        const d = sym && sym.declarations && sym.declarations[0];
        const global = d ? (d.getSourceFile() && arquivos.includes(path.resolve(d.getSourceFile().fileName)) && isTopo(d)) : true;
        if (global) {
          if (!usos.has(n.text)) usos.set(n.text, new Map());
          const m = usos.get(n.text); m.set(eu, (m.get(eu) || 0) + 1);
        }
      }
    }
    ts.forEachChild(n, visita);
  })(sf);
}
function isTopo(d) {   // a declaracao esta no nivel de cima do arquivo?
  let n = d;
  while (n && !ts.isSourceFile(n)) {
    if (ts.isFunctionLike(n) && n !== d) return false;
    if (ts.isBlock(n) || ts.isCatchClause(n) || ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n)) return false;
    n = n.parent;
  }
  return true;
}

// 3) resumo
const porArq = {}; const matriz = {};
for (const sf of jsFiles) { porArq[nome(sf)] = { defs: 0, usadas: 0, soAqui: 0, mortas: 0 }; matriz[nome(sf)] = {}; }
const hubs = [], mortas = [], soAqui = [];
for (const [n, d] of def) {
  const u = usos.get(n) || new Map();
  const usadoFora = [...u.keys()].filter(a => a !== d.arq);
  const totalUsos = [...u.values()].reduce((a, b) => a + b, 0);
  const a = porArq[d.arq]; a.defs++;
  if (usadoFora.length) { a.usadas++; for (const o of usadoFora) matriz[o][d.arq] = (matriz[o][d.arq] || 0) + u.get(o); }
  const usoDentro = u.get(d.arq) || 0;
  if (!usadoFora.length && usoDentro > 1) { a.soAqui++; soAqui.push({ n, ...d }); }
  if (totalUsos <= 1 && !usadoFora.length) { a.mortas++; mortas.push({ n, ...d, usos: totalUsos }); }
  if (usadoFora.length >= 4) hubs.push({ n, ...d, arqs: usadoFora.length, usos: totalUsos });
}
hubs.sort((a, b) => b.arqs - a.arqs || b.usos - a.usos);
const ordem = Object.keys(porArq);
let md = '# Dependencias entre os arquivos js/\n\nGerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.\n\n';
md += '## Resumo por arquivo\n\n"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).\n\n';
md += '| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |\n|---|---:|---:|---:|---:|---:|---:|\n';
for (const o of ordem) {
  const dep = Object.keys(matriz[o]).filter(x => x !== o).length;
  const usadoPor = ordem.filter(x => x !== o && matriz[x][o]).length;
  const a = porArq[o];
  md += `| ${o} | ${a.defs} | ${a.usadas} | ${a.soAqui} | ${a.mortas} | ${dep} | ${usadoPor} |\n`;
}
md += '\n## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)\n\n| de \\ para | ' + ordem.map(o => o.slice(0, 2)).join(' | ') + ' |\n|---|' + ordem.map(() => '---:').join('|') + '|\n';
for (const o of ordem) md += `| ${o} | ` + ordem.map(c => (c === o ? '.' : (matriz[o][c] || ''))).join(' | ') + ' |\n';
md += '\n(colunas = os dois primeiros digitos do nome do arquivo)\n\n';
md += '## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)\n\n| Nome | Tipo | Definida em | Usada em N arquivos | Usos |\n|---|---|---|---:|---:|\n';
for (const h of hubs.slice(0, 60)) md += `| ${h.n} | ${h.tipo} | ${h.arq}:${h.linha} | ${h.arqs} | ${h.usos} |\n`;
md += `\n(${hubs.length} no total, mostrando ate 60)\n\n`;
md += '## Candidatas a esconder (so usadas dentro do proprio arquivo)\n\n';
const g = {}; for (const s of soAqui) (g[s.arq] = g[s.arq] || []).push(s.n);
for (const o of ordem) if (g[o]) md += `- **${o}** (${g[o].length}): ${g[o].slice(0, 25).join(', ')}${g[o].length > 25 ? ', ...' : ''}\n`;
md += '\n## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)\n\n';
const htmlTxt = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const m2 = mortas.filter(s => !new RegExp('\\b' + s.n + '\\b').test(htmlTxt));
for (const s of m2.slice(0, 80)) md += `- \`${s.n}\` (${s.tipo}, ${s.arq}:${s.linha})\n`;
if (m2.length > 80) md += `- ... e mais ${m2.length - 80}\n`;
fs.mkdirSync(path.join(raiz, 'docs'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'docs', 'dependencias.md'), md);
console.log('globais:', def.size, '| hubs(>=4 arquivos):', hubs.length, '| so internas:', soAqui.length, '| possivelmente mortas:', m2.length);
console.log('docs/dependencias.md gerado');
