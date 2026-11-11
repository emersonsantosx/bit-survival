/* Deixa os testes DETERMINISTICOS. O jogo sorteia o mundo com Math.random, e alguns testes dependiam de sorte (um mundo sem espaco livre,
   uma arvore na borda...) e falhavam de vez em quando no GitHub sem nada ter quebrado. Este arquivo e carregado antes de cada teste
   (node --require) e troca o Math.random de TODA pagina aberta pelo Playwright por um gerador com semente fixa: mesmo teste, mesmo mundo, mesmo resultado.
   Semente diferente (para procurar bug que depende de mundo): TESTE_SEMENTE=777 node tests/todos.js
   Rodar um teste so, igual ao GitHub: node -r ./tests/semente.js tests/teste-xxx.js */
const SEED = (parseInt(process.env.TESTE_SEMENTE, 10) || 20260101) >>> 0;
const SCRIPT = '(()=>{let s=' + SEED + ';Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};})();';
let pw; try { pw = require('playwright'); } catch (e) { pw = null; }
if (pw && pw.chromium && !pw.chromium.__semente) {
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.__semente = true;
  pw.chromium.launch = async function (...a) {
    const br = await launch(...a);
    const nc = br.newContext.bind(br);
    br.newContext = async function (...b) { const c = await nc(...b); await c.addInitScript(SCRIPT); return c; };
    br.newPage = async function (o) { const c = await br.newContext(o); return c.newPage(); };
    return br;
  };
}
