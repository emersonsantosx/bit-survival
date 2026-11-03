/* Teste automatico da prioridade do botao de interacao (pickTarget): porta colada vence cama e porta mais longe,
   fecha a porta mais perto, e a cama vence quando longe da porta. Cada verificacao roda com o predio limpo (sem
   itens nem moveis sorteados), para o resultado nao depender do mundo gerado.
   Uso: node tests/teste-pick.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const { chromium } = require('playwright');
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;aud();zombies=[];items.length=0;   // sem itens do mundo por perto: um item sorteado ao lado da porta vencia na prioridade e deixava o teste instavel

 const o={};const clean=()=>{items.length=0;};const bk=Object.keys(SLEEP_BED)[0];
 const b=blds.find(b=>b.gaps.length>=2&&b.gaps.some(g=>g.v));const g=b.doors.find(d=>d.di>0&&d.v);const g2=b.doors.find(d=>d.di>0&&d!==g);
 b.furn.length=0;   // so a cama do teste: moveis sorteados do predio (outra cama, bau) tambem disputam a prioridade
 // cama colada na porta interna (lado direito), jogador colado na porta olhando para ela
 const cx=g.r.x+g.r.w/2,cy=g.r.y+g.r.h/2;
 b.furn.push({x:g.r.x+g.r.w+1,y:cy-10,w:14,h:22,k:bk,s:'t',loot:false,sd:1,room:b.rooms[0]});
 clean();g.open=0;P.x=g.r.x-P.r-0.5;P.y=cy;P.face=0;update(.05);clean();
 P.x=g.r.x-P.r-0.5;P.y=cy;P.face=0;clean();o.glued=pickTarget().k;
 P.x=g.r.x+g.r.w+5;P.y=cy;P.face=Math.PI;clean();o.bedSide=pickTarget().k;  // do lado da cama olhando para a porta (colado nela e na cama)
 // duas portas: aberta mais longe, fechada colada
 g.open=0;if(g2){g2.open=1;}
 P.x=g.r.x-P.r-0.5;P.y=cy;P.face=0;clean();o.twoDoors=pickTarget().dr===g;
 // aberta ao lado: fechar a mais perto
 g.open=1;P.x=g.r.x-12;P.y=cy;P.face=0;clean();const t=pickTarget();o.dbg=[t&&t.k,t&&t.d,t&&t.s,doorCands().map(q=>[q.dr.di,q.ed])];o.closeNear=t&&t.k==='door'&&t.dr===g;
 // longe da porta e perto da cama: cama
 g.open=0;P.x=g.r.x+g.r.w+8;P.y=cy+6;P.face=Math.PI/2;clean();const t2=pickTarget();o.bedFar=t2&&t2.k;
 return o;});
console.log(JSON.stringify(r));
ok(r.glued==='door','colado na porta, mesmo com cama junto: porta');ok(r.twoDoors,'porta colada vence a aberta mais longe');ok(r.closeNear,'fecha a porta mais perto');
ok(r.bedFar==='bed'||r.bedFar==='door','longe da porta, perto da cama: '+r.bedFar);ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
