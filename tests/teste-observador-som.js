/* O zumbido do Observador (Slender) nunca fica preso: some ao entrar numa casa, ao ficar sem observador em cena e ao voltar ao menu.
   Uso: node tests/teste-observador-som.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];aud();
  const o={ac:!!AC};
  const spawn=()=>{OBS.on=true;OBS.vis=true;OBS.x=P.x+60;OBS.y=P.y;OBS.life=100;OBS.view=0;OBS.seenTot=0;OBS.look=12;obsStartDrone();return !!OBS.drone;};
  state='play';
  o.started=spawn();
  // 1) entra numa casa com o observador a vista
  P.inside=blds[0];updateObserver(.1);o.afterInside=OBS.drone===null&&!OBS.on;P.inside=null;
  // 2) zumbido sobrando sem observador em cena
  OBS.on=false;obsStartDrone();updateObserver(.1);o.afterOrphan=OBS.drone===null;
  // 3) pausa/menu: estado diferente de play
  spawn();state='menu';updateObserver(.1);o.afterMenuState=OBS.drone===null;state='play';
  // 4) botao de voltar ao menu
  spawn();quitToMenu();o.afterQuit=OBS.drone===null&&!OBS.on&&!OBS.vis;
  return o;});
console.log(JSON.stringify(r));
ok(r.ac&&r.started,'o zumbido toca quando o observador e avistado');
ok(r.afterInside,'entrar numa casa para o zumbido');
ok(r.afterOrphan,'zumbido sem observador em cena e desligado');
ok(r.afterMenuState,'estado fora do jogo desliga o zumbido');
ok(r.afterQuit,'voltar ao menu desliga o zumbido');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
