/* Arvores e pedras nao renascem em cima das construcoes do jogador (parede, cerca, piso, telhado, cama, canteiro, estufa, bau)
   nem dentro de uma cabana fechada. Longe da base continuam renascendo normalmente.
   Uso: node tests/teste-arvore-construcao.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];
  trees.length=0;rocks.length=0;blds.length=0;items.length=0;lakes.length=0;rebuildSolidGrid();P.x=300;P.y=300;P.inside=null;
  if(!RG_BT)regrowInit();
  const free=(x,y)=>rgSpotOk(x,y,true)&&rgSpotOk(x,y,false);
  // area livre de 12x12 casas (192 px) bem longe do jogador
  let bx=0,by=0;
  for(let k=0;k<4000&&!bx;k++){const x=Math.floor((600+Math.random()*(WW-900))/16),y=Math.floor((600+Math.random()*(WH-900))/16);let all=true;for(let i=0;i<=12&&all;i+=2)for(let j=0;j<=12&&all;j+=2)if(!free((x+i)*16+8,(y+j)*16+8))all=false;if(all){bx=x;by=y;}}
  const o={found:!!bx};if(!bx)return o;
  const at=(i,j)=>free((bx+i)*16+8,(by+j)*16+8);
  o.control=at(2,2)&&at(10,10)&&at(6,6);
  // cabana fechada 4x4 em (bx..bx+4, by..by+4): so paredes, sem piso e sem telhado
  const W=[];for(let i=0;i<4;i++){W.push([bx+i,by,0,2]);W.push([bx+i,by+4,0,2]);}for(let j=0;j<4;j++){W.push([bx,by+j,1,2]);W.push([bx+4,by+j,1,2]);}
  W.push([bx+8,by+11,0,2]);fenceLoad(W);   // mais uma parede solta para o telhado ter onde se apoiar
  o.insideWalls=!at(2,2);              // dentro do recinto fechado
  o.onWall=!at(0,2);                   // em cima da parede
  o.nearWall=!at(-1,2);                // colado na parede por fora
  o.farOutside=at(12,6);              // longe: continua livre
  // piso e telhado soltos
  cellLoad({f:[[bx+8,by+8]],r:[[bx+8,by+11]],b:[]});
  o.onFloor=!at(8,8);o.roofSet=roofList().length;o.onRoof=o.roofSet>0&&!at(8,11);
  // canteiro
  plotsLoad([[bx+11,by+2,null,0,0]]);o.plotCount=plotList().length;
  o.onPlot=o.plotCount?!at(11,2):true;
  // bau
  stashLoad([[(bx+11)*16+8,(by+11)*16+8,[]]]);o.onStash=!at(11,11);
  // o sorteio de verdade nunca coloca arvore dentro da base: 400 tentativas
  const base=trees.length+rocks.length;let bad=0;
  const inBase=(a)=>a.x>=(bx-2)*16&&a.x<=(bx+7)*16&&a.y>=(by-2)*16&&a.y<=(by+7)*16;
  for(let k=0;k<400;k++){regrowOne(true);regrowOne(false);}
  o.grew=trees.length+rocks.length-base;o.inBase=trees.concat(rocks).filter(inBase).length;
  return o;});
console.log(JSON.stringify(r));
ok(r.found&&r.control,'controle: sem construcao o ponto e livre para renascer');
ok(r.insideWalls,'nao nasce nada dentro de uma cabana fechada (mesmo sem piso e telhado)');
ok(r.onWall&&r.nearWall,'nao nasce em cima nem colado na parede');
ok(r.farOutside,'longe da construcao continua renascendo');
ok(r.onFloor&&r.onRoof,'nao nasce em cima de piso nem de telhado');
ok(r.onPlot&&r.onStash,'nao nasce em cima de canteiro nem de bau');
ok(r.inBase===0,'400 sorteios de renascimento: nenhuma arvore ou pedra na area da base ('+r.inBase+', total novos '+r.grew+')');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
