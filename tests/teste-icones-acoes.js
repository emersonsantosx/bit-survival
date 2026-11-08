/* Icones das acoes: o botao de interagir mostra o icone certo para cada alvo (veiculo do mapa com seta para baixo, tronco, cama, porta
   aberta/fechada, bau, horta) e o botao de sair do veiculo usa o veiculo do mapa com seta para cima. Todo icone citado existe.
   Uso: node tests/teste-icones-acoes.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
/* 1) todo icone novo existe e tem as 13 colunas das composicoes */
const ex=await pg.evaluate(()=>{const miss=[];for(const k of ['car','atv','buggy','sled'])for(const d of ['in','out'])if(!PXG['a_'+k+'_'+d])miss.push(k+d);
  for(const n of ['a_log_sit','a_log_up','a_bed_z','a_bed_up','a_door','a_door_open','a_gate_open','a_chest_open','a_sprout','a_can','a_basket','gate','hoe','drop','c_flame','c_hand','rod'])if(!PXG[n]||!pxIcon(n,3))miss.push(n);
  const w=Object.keys(PXG).filter(n=>/^a_(car|atv|buggy|sled)_/.test(n)).every(n=>PXG[n].every(r=>r.length===13));return {miss,w};});
ok(ex.miss.length===0&&ex.w,'todos os icones das acoes existem e os veiculos tem 13 colunas'+(ex.miss.length?': '+ex.miss:''));
/* 2) o icone do botao muda com o alvo */
const t=await pg.evaluate(()=>{
  const out={};
  const ic=(btn,TG,pp)=>actionIcon(btn,TG,pp||{});
  for(const [m,k] of [['city','car'],['forest','atv'],['desert','buggy'],['snow','sled']]){selectedMap=m;out['veh_'+m]=ic('ENTRAR',{k:'veh'})==='a_'+k+'_in';}
  out.log=ic('SENTAR',{k:'log'})==='a_log_sit';out.sitting=ic('LEVANTAR',null,{sitting:{}})==='a_log_up';out.sleeping=ic('LEVANTAR',null,{sleeping:{}})==='a_bed_up';
  out.bed=ic('DORMIR',{k:'bed'})==='a_bed_z';
  out.doorOpen=ic('FECHAR',{k:'door',dr:{open:true}})==='a_door'&&ic('PORTA',{k:'door',dr:{open:false}})==='a_door_open';
  out.gate=ic('FECHAR',{k:'fgate',f:{o:1,g:1}})==='gate'&&ic('PORTÃO',{k:'fgate',f:{o:0,g:1}})==='a_gate_open';
  out.chest=ic('ABRIR',{k:'chest'})==='a_chest_open'&&ic('ABRIR',{k:'stash'})==='a_chest_open';
  out.plants=ic('PLANTAR',{k:'plot',act:'PLANTAR'})==='a_sprout'&&ic('REGAR',{k:'plot',act:'REGAR'})==='a_can'&&ic('COLHER',{k:'plot',act:'COLHER'})==='a_basket'&&ic('ARAR',{k:'plot',act:'ARAR'})==='hoe';
  out.water=ic('ÁGUA',null)==='drop'&&ic('ASSAR',null)==='c_flame'&&ic('PEGAR',null)==='c_hand'&&ic('RECOLHER',null,{fish:{}})==='rod';
  return out;});
for(const k in t)ok(t[k],'icone certo: '+k);
/* 3) no jogo de verdade: botao perto do tronco e do carro, e o botao de sair */
await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];state='play';trees.length=0;rocks.length=0;blds.length=0;lakes.length=0;items.length=0;chestList.length=0;logList().length=0;rebuildSolidGrid();});
const g=await pg.evaluate(()=>{
  logBuild({x:1600,y:1640,a:'h'});P.x=1600;P.y=1660;P.inside=null;update(.05);updateHud(true);
  const o={sit:document.getElementById('pick').dataset.ic==='a_log_sit'};
  logSit(logList()[0]);update(.05);updateHud(true);o.up=document.getElementById('pick').dataset.ic==='a_log_up'&&document.getElementById('pick').dataset.st==='LEVANTAR';
  logStand(true);P.x=1600;P.y=1700;update(.05);updateHud(true);o.hand=document.getElementById('pick').dataset.ic==='c_hand';
  const v=vehicles[0];if(v){P.inVehicle=v;v.driverId=myNetId();update(.05);updateHud(true);o.exit=document.getElementById('v-exit').dataset.ic==='a_atv_out'&&document.getElementById('v-exit').innerHTML.includes('img');}else o.exit=true;
  return o;});
ok(g.sit,'perto do tronco o botao mostra o tronco com seta para baixo');ok(g.up,'sentado mostra tronco com seta para cima (LEVANTAR)');ok(g.hand,'sem alvo volta a mao');ok(g.exit,'o botao de sair mostra o veiculo do mapa (quadriciclo na floresta)');
ok(errs.length===0,'sem erros de JS'+(errs.length?': '+errs[0]:''));
await b.close();process.exit(bad?1:0);})();
