/* Laco rosa no cabelo da garota branca de cabelo preto (skin 5): aparece atras do cabelo nos mapas sem neve e some sob o gorro no mapa da neve.
   As outras skins (inclusive a loira) nao ganham laco. Uso: node tests/teste-laco.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:640,height:300}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{
  window.requestAnimationFrame=()=>0;const o={};
  const pink=(cv)=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===0xee&&d[i+1]===0x86&&d[i+2]===0xb4&&d[i+3]>0)n++;return n;};
  const mk=()=>{const cv=document.createElement('canvas');cv.width=40;cv.height=40;return cv;};
  // quais skins tem laco
  o.withBow=SKINS.map((s,i)=>s.bow?i:-1).filter(i=>i>=0);
  o.girl={hair:SKINS[4].hair,female:SKINS[4].f,skin:SKINS[4].skin};
  // desenho do menu (de frente): so a skin 4 mostra rosa
  const cv=mk();drawSkinPreview(cv,4);o.previewPink=pink(cv);
  const cv2=mk();drawSkinPreview(cv2,6);o.blondePink=pink(cv2);
  // em jogo: floresta mostra, neve esconde (gorro), nas 4 direcoes
  const faces=[Math.PI/2,0,Math.PI,-Math.PI/2];
  const game=(m)=>{localStorage.clear();selectedMap=m;pendingSlot=1;showScreen(null);newGame();SKIN_SEL=4;const res=[];
    for(const f of faces){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#8aa070';ctx.fillRect(0,0,W,H);ctx.setTransform(6,0,0,6,0,0);human(30,30,f,myLook());ctx.setTransform(1,0,0,1,0,0);
      const d=ctx.getImageData(0,0,300,300).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===0xee&&d[i+1]===0x86&&d[i+2]===0xb4)n++;res.push(n);}return res;};
  o.forest=game('forest');o.city=game('city');o.snow=game('snow');
  return o;});
console.log(JSON.stringify(r));
ok(r.withBow.length===1&&r.withBow[0]===4&&r.girl.female&&r.girl.hair==='#0c0a09','so a garota branca de cabelo preto (skin 5) tem laco');
ok(r.previewPink>0&&r.blondePink===0,'no menu a skin 5 mostra o laco rosa e a loira nao');
ok(r.forest.every(n=>n>0)&&r.city.every(n=>n>0),'floresta e cidade: laco aparece de frente, dos lados e de costas');
ok(r.snow.every(n=>n===0),'mapa da neve: nenhum rosa (o gorro cobre o laco)');
ok(errs.length===0,'sem erros de JS ('+errs.join(' | ')+')');
await b.close();console.log(bad?'\n'+bad+' falha(s)':'\nTodos os testes passaram');process.exit(bad?1:0);})();
