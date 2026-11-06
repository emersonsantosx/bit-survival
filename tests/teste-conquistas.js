/* Tela de CONQUISTAS: abre na lista de conquistas (estatisticas em outra aba, nao mais empurrando a lista para baixo).
   Uso: node tests/teste-conquistas.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
await pg.click('#btnAch');
const vis=()=>pg.evaluate(()=>{const v=id=>{const e=document.getElementById(id);return getComputedStyle(e).display!=='none';};
  const l=document.getElementById('achList').getBoundingClientRect();return {list:v('achList'),stats:v('achStats'),sum:v('achSum'),top:l.top,rows:document.querySelectorAll('#achList .ach-row').length,stRows:document.querySelectorAll('#achStats div').length};});
let r=await vis();
ok(r.list&&!r.stats&&r.sum&&r.rows>=20,'abre na aba CONQUISTAS, com a lista ('+r.rows+') e sem as estatisticas');
ok(r.top<150,'a lista comeca no alto da tela (y='+Math.round(r.top)+'), nao empurrada pelas estatisticas');
await pg.click('#achTabStats');r=await vis();
ok(!r.list&&r.stats&&r.stRows===12,'aba ESTATISTICAS mostra os 12 numeros');
await pg.click('#achTabList');r=await vis();
ok(r.list&&!r.stats,'voltar para a aba CONQUISTAS');
await pg.click('#achTabStats');await pg.click('#btnBackAch');await pg.click('#btnAch');r=await vis();
ok(r.list&&!r.stats,'ao reabrir a tela, sempre comeca na lista');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
