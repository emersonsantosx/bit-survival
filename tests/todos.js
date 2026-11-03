/* Roda todos os testes de tests/ em sequencia e resume o resultado.
   Uso: node tests/todos.js [caminho/index.html]. Sai com codigo 1 se algum teste falhar. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const extra = process.argv[2] ? [process.argv[2]] : [];
const lista = fs.readdirSync(dir).filter(f => /^teste-.*\.js$/.test(f)).sort();
const falhas = [];
for (const f of lista) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(dir, f), ...extra], { encoding: 'utf8' });
  const ok = r.status === 0;
  console.log((ok ? 'OK    ' : 'FALHOU ') + f + '  (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
  if (!ok) { falhas.push(f); console.log((r.stdout || '').split('\n').filter(l => /FAIL|FALHOU|rror/.test(l)).join('\n') + (r.stderr ? '\n' + r.stderr.split('\n').slice(0, 6).join('\n') : '')); }
}
console.log(falhas.length ? '\n' + falhas.length + ' teste(s) falharam: ' + falhas.join(', ') : '\nTodos os ' + lista.length + ' testes passaram');
process.exit(falhas.length ? 1 : 0);
