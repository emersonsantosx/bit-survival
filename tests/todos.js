/* Roda todos os testes de tests/ e resume o resultado.
   Uso: node tests/todos.js [caminho/index.html]. Sai com codigo 1 se algum teste falhar.
   - Roda varios testes ao mesmo tempo (cada um abre o proprio navegador e nao divide nada com os outros): padrao = numero de nucleos, no maximo 4.
     Mudar: TESTES_PARALELO=1 node tests/todos.js (1 = um por vez, como antes).
   - Testes que MEDEM TEMPO (ms por quadro, etc.) rodam sozinhos no final, para a carga dos outros nao atrapalhar a medida.
   - Se um teste falhar na rodada paralela, ele roda de novo sozinho antes de ser dado como falha (descarta falha causada so por carga). */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const dir = __dirname;
const extra = process.argv[2] ? [process.argv[2]] : [];
const nucleos = (os.availableParallelism ? os.availableParallelism() : os.cpus().length) || 1;
const N = Math.max(1, parseInt(process.env.TESTES_PARALELO, 10) || Math.min(4, nucleos));
const SOZINHOS = /^teste-(desempenho|multiplayer-sala)/;   // medem tempo / dependem de ritmo
const lista = fs.readdirSync(dir).filter(f => /^teste-.*\.js$/.test(f)).sort();

function rodar(f) {
  return new Promise(resolve => {
    const t0 = Date.now();
    // semente fixa: mundo sorteado igual em toda execucao
    const p = spawn(process.execPath, ['--require', path.join(dir, 'semente.js'), path.join(dir, f), ...extra]);
    let out = '', err = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('close', code => resolve({ f, ok: code === 0, out, err, s: (Date.now() - t0) / 1000 }));
  });
}
function mostrar(r, marca) {
  console.log((r.ok ? 'OK    ' : 'FALHOU ') + r.f + '  (' + r.s.toFixed(1) + 's)' + (marca || ''));
  if (!r.ok) console.log(r.out.split('\n').filter(l => /FAIL|FALHOU|rror/.test(l)).join('\n') + (r.err ? '\n' + r.err.split('\n').slice(0, 6).join('\n') : ''));
}
async function pool(fs_, n, aoTerminar) {
  const fila = fs_.slice(), res = [];
  await Promise.all(Array.from({ length: Math.min(n, fila.length) }, async () => {
    while (fila.length) { const r = await rodar(fila.shift()); res.push(r); aoTerminar(r); }
  }));
  return res;
}
(async () => {
  const t0 = Date.now();
  const paralelos = lista.filter(f => !SOZINHOS.test(f)), sozinhos = lista.filter(f => SOZINHOS.test(f));
  console.log(lista.length + ' testes, ' + N + ' ao mesmo tempo (' + sozinhos.length + ' rodam sozinhos no final)\n');
  const falhos = [];
  const r1 = await pool(paralelos, N, r => { if (r.ok) mostrar(r); else console.log('FALHOU ' + r.f + '  (' + r.s.toFixed(1) + 's)  -> vai rodar de novo sozinho'); });
  for (const r of r1) if (!r.ok) falhos.push(r.f);
  for (const f of sozinhos) { const r = await rodar(f); mostrar(r); if (!r.ok) falhos.push(f); }
  // segunda chance, sozinhos e um por vez: so conta como falha se falhar de novo
  const reprovados = [];
  for (const f of [...new Set(falhos)].sort()) {
    const r = await rodar(f);
    mostrar(r, '  [segunda tentativa]');
    if (!r.ok) reprovados.push(f);
  }
  const total = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(reprovados.length ? '\n' + reprovados.length + ' teste(s) falharam: ' + reprovados.join(', ') + '  (' + total + 's)' : '\nTodos os ' + lista.length + ' testes passaram  (' + total + 's)');
  process.exit(reprovados.length ? 1 : 0);
})();
