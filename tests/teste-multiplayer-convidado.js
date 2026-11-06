/* Convidado do multiplayer: o que ele conquistou fica guardado no aparelho dele, por mundo (mapa + semente). Ao voltar ao mesmo mundo, volta com
   mochila, armas, vida e lanterna, perto do host. Outro mundo comeca do zero; morrer apaga; o host nunca grava ficha de convidado.
   Uso: node tests/teste-multiplayer-convidado.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const ctxB=await b.newContext({viewport:{width:900,height:600}});   // o mesmo aparelho: o localStorage e compartilhado entre as paginas
const errs=[];
const join=async(seed,map,fn)=>{const pg=await ctxB.newPage();pg.on('pageerror',e=>errs.push(e.message));await pg.goto('file://'+file);await pg.waitForTimeout(250);
  const r=await pg.evaluate(({seed,map,fn})=>{
    window.requestAnimationFrame=()=>0;MP.active=true;MP.isHost=false;
    handleNetData({type:'worldInit',seed:seed,map:map,sp:[1700,1700]},false);handleNetData({type:'start',map:map},false);
    const o=new Function('return ('+fn+')')()();return o;},{seed,map,fn});
  await pg.close();return r;};

/* 1) primeira vez: kit inicial; ganha coisas e salva */
const a=await join(777001,'forest',`()=>{const o={inv0:P.inv.map(s=>s.t).join(',')};
  P.inv.push({t:'food',n:3});P.inv.push({t:'wood',n:12});P.hp=55;P.food=40;P.torch=true;P.flashOn=false;P.weapon='fists';
  state='play';o.saved=guestSave();o.key=guestKey();o.slots=[1,2,3,4].filter(n=>localStorage.getItem(slotKey(n))).length;return o;}`);
ok(a.saved&&a.slots===0,'convidado salva a ficha dele (sem ocupar slot de mundo)');

/* 2) volta ao mesmo mundo: tudo de volta, perto do host */
const c=await join(777001,'forest',`()=>({wood:(P.inv.find(s=>s.t==='wood')||{}).n,canned:(P.inv.find(s=>s.t==='food')||{}).n,hp:Math.round(P.hp),food:Math.round(P.food),torch:P.torch===true,near:Math.hypot(P.x-1740,P.y-1740)<120,dead:!!P.dead})`);
ok(c.wood===12&&c.canned===3&&c.hp===55&&c.food===40&&c.torch,'mesmo mundo: volta com mochila, vida, fome e lanterna ('+JSON.stringify(c)+')');
ok(c.near&&!c.dead,'e nasce perto do host, nao onde parou');

/* 3) outro mundo (outra semente ou outro mapa): comeca do zero */
const d=await join(777002,'forest',`()=>({inv:P.inv.map(s=>s.t).join(','),hp:P.hp})`);
const e=await join(777001,'snow',`()=>({inv:P.inv.map(s=>s.t).join(','),hp:P.hp})`);
ok(d.inv===a.inv0&&d.hp===100&&e.inv===a.inv0&&e.hp===100,'outro mundo comeca com o kit inicial');

/* 4) morrer apaga a ficha daquele mundo */
const f=await join(777001,'forest',`()=>{state='play';die();return {gone:!localStorage.getItem(guestKey())};}`);
const g=await join(777001,'forest',`()=>({inv:P.inv.map(s=>s.t).join(',')})`);
ok(f.gone&&g.inv===a.inv0,'morrer apaga a ficha: renasce do zero');

/* 5) o host nunca grava ficha de convidado, e o solo nao e afetado */
const pg=await ctxB.newPage();pg.on('pageerror',x=>errs.push(x.message));await pg.goto('file://'+file);await pg.waitForTimeout(250);
const h=await pg.evaluate(()=>{window.requestAnimationFrame=()=>0;localStorage.clear();mpSlot=0;window.loadPeerJS=function(){};mpHostStart();hostBuildWorld();enterMultiplayerGame(true);
  const o={host:guestSave()};MP.active=false;MP.isHost=false;state='menu';o.solo=guestSave();o.keys=Object.keys(localStorage).filter(k=>k.indexOf('minisurv_guest_')===0).length;return o;});
ok(h.host===false&&h.solo===false&&h.keys===0,'host e jogo solo nao gravam ficha de convidado');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
