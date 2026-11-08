/* Item no chao perto de carro destruido: o botao pega o item (a carcaca nao disputa com ele). Carro inteiro continua valendo o mais perto.
   Uso: node tests/teste-item-carro.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;trees.length=0;rocks.length=0;if(window.logList)logList().length=0;decorations.length=0;vehicles.length=0;campfires.length=0;chestList.length=0;blds.length=0;walls.length=0;tents.length=0;rebuildSolidGrid();P.inside=null;P.dead=false;   // mundo sorteado: tira o que pode competir com o carro (bau, portas, camas)
 const o={};const cx=900,cy=900;
 const mkCar=(extra)=>{vehicles.length=0;vehicles.push(Object.assign({id:1,x:cx,y:cy,w:36,h:20,col:'#c33',looted:true,spd:0,face:0,hp:100,maxHp:100},extra||{}));};
 const setup=(side)=>{   // jogador encostado no carro e o item um pouco alem, do lado 'side' (0 direita, 1 baixo, 2 esquerda, 3 cima)
  items.length=0;const dx=[1,0,-1,0][side],dy=[0,1,0,-1][side],hx=side%2===0?18:10;
  P.x=cx+dx*(hx+P.r+1);P.y=cy+dy*(hx+P.r+1);P.face=Math.atan2(dy,dx);items.push({t:'wood',x:P.x+dx*19,y:P.y+dy*19});P.inVehicle=null;};
 // 1. carro destruido: o alvo e o item, nos 4 lados e nos dois jeitos de destruir
 for(const [nome,extra] of [['destroyed',{destroyed:true,hp:0}],['dying',{dying:true,hp:0}]]){
  const res=[];for(let s=0;s<4;s++){mkCar(extra);setup(s);const t=pickTarget();res.push(t&&t.k);}
  o[nome]=res.join(',');
 }
 // 2. apertar o botao de verdade pega o item (e nao mostra 'Veiculo destruido')
 mkCar({destroyed:true,hp:0,looted:false});setup(0);const w0=countInv('wood');pickup();o.picked=countInv('wood')-w0;o.itemsLeft=items.length;
 // 3. sem item por perto, a carcaca continua sendo alvo (avisa que esta destruida)
 mkCar({destroyed:true,hp:0,looted:true});setup(0);items.length=0;o.noItem=(pickTarget()||{}).k;
 // 4. carro inteiro: continua valendo o mais perto (encostado no carro, item a 19 px: o carro)
 mkCar();setup(0);o.intact=(pickTarget()||{}).k;
 // 5. item longe do carro e perto do jogador: item
 mkCar({destroyed:true,hp:0});setup(0);P.x+=60;items[0].x=P.x+10;o.farItem=(pickTarget()||{}).k;
 return o;});
console.log(JSON.stringify(r));
ok(r.destroyed==='item,item,item,item','carro destruido: o botao mira o item nos 4 lados ('+r.destroyed+')');
ok(r.dying==='item,item,item,item','carro explodindo: o botao mira o item nos 4 lados ('+r.dying+')');
ok(r.picked===1&&r.itemsLeft===0,'apertar o botao pega o item perto da carcaca');
ok(r.noItem==='veh','sem item, a carcaca continua sendo alvo');
ok(r.intact==='veh','carro inteiro: vale o mais perto como antes');
ok(r.farItem==='item','item perto do jogador e longe do carro: item');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
