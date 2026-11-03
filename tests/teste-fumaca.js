/* Fumaca geral: roda o jogo em todos os mapas, em varias horas do dia e com todos os climas, e confere se nao ha erros nem janelas de aviso.
   Uso: node tests/teste-fumaca.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;
for(const m of ['forest','snow','desert','city']){
  const pg=await (await b.newContext({viewport:{width:760,height:460}})).newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{errs.push('dialog:'+d.message());d.dismiss();});
  await pg.goto('file://'+file);await pg.waitForTimeout(300);
  await pg.evaluate((m)=>{localStorage.clear();selectedMap=m;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;aud();
    for(let h=0;h<24;h+=1.5){T=((h-START_HOUR+24)%24)/24*DAY_SECONDS;for(const w of ['none','rain','snow','sand']){weather=w;weatherTimer=9999;
      for(let i=0;i<12;i++){P.hp=100;P.x+=7;P.y+=3;if(P.x>WW-100)P.x=100;if(P.y>WH-100)P.y=100;update(.1);render();}}}
  },m);
  console.log(m,errs.length?errs[0]:'ok');bad+=errs.length;await pg.context().close();
}
await b.close();process.exit(bad?1:0);})();
