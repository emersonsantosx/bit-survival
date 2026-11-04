/* Junção das paredes: confere no desenho (retangulos pintados por drawFence) que nao sobra vazio entre pecas
   da mesma reta, nos cantos e nos T, e que nenhuma peca pinta fora do seu trecho.
   Uso: node tests/teste-parede-juncao.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
const r=await pg.evaluate(()=>{localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
 const o={};
 // pinta tudo num mapa de pixels (sem sombra) em vez de na tela
 const realR=window.R;let grid;
 window.R=(x,y,w,h,c)=>{if(/^rgba/.test(c))return;x=Math.round(x);y=Math.round(y);for(let i=0;i<w;i++)for(let j=0;j<h;j++)grid.set(x+i+','+(y+j),c);};
 const draw=(pieces)=>{grid=new Map();fenceLoad([]);for(const p of pieces)fenceRemote({x:p[0],y:p[1],d:p[2],g:p[3]||2,o:p[4]||0});for(const f of fenceList().slice().sort((a,b)=>fenceDepth(a)-fenceDepth(b)))drawFence(f);return grid;};
 const has=(x,y)=>grid.has(x+','+y);
 // a coluna nao pode pintar por cima da face da parede horizontal: a regiao da reta fica igual a da reta sozinha
 const sameAs=(base,xa,xb,ya,yb)=>{const ref=new Map(draw(base));return (pieces)=>{const g=draw(pieces);for(let x=xa;x<=xb;x++)for(let y=ya;y<=yb;y++)if(g.get(x+','+y)!==ref.get(x+','+y))return [x,y];return null;};};
 // area de pixels que precisam estar cheios: de (xa..xb) em cada linha de ya..yb
 const full=(xa,xb,ya,yb)=>{for(let x=xa;x<=xb;x++)for(let y=ya;y<=yb;y++)if(!has(x,y))return [x,y];return null;};
 const U=16,k=50;   // quadrado de teste (50,50)
 const X=k*U,Y=k*U;
 // 1. reta horizontal de 4 pecas: corpo continuo de X-3 ate X+4*U+3, da face (Y-11) ate o chao (Y-1)
 draw([[k,k,'h'],[k+1,k,'h'],[k+2,k,'h'],[k+3,k,'h']]);o.hLine=full(X-3,X+4*U+2,Y-14,Y-1);
 // 2. reta vertical de 4 pecas: coluna de X-3 a X+2, do topo (Y-14) ao fim (Y+4*U-1)
 draw([[k,k,'v'],[k,k+1,'v'],[k,k+2,'v'],[k,k+3,'v']]);o.vLine=full(X-3,X+2,Y-14,Y+4*U-1);
 // 3. cantos: a face horizontal cobre a coluna toda no ponto de encontro e a coluna segue colada
 draw([[k,k,'h'],[k+1,k,'h'],[k,k,'v'],[k,k+1,'v']]);o.cornerDR=[full(X-3,X+2,Y-14,Y-1),full(X-3,X+2,Y,Y+2*U-1),full(X-3,X+2*U+2,Y-14,Y-1)];   // ┌
 draw([[k-2,k,'h'],[k-1,k,'h'],[k,k-2,'v'],[k,k-1,'v']]);o.cornerUL=[full(X-3,X+2,Y-14,Y-1),full(X-3,X+2,Y-2*U-14,Y-15),full(X-2*U-3,X+2,Y-14,Y-1)];   // ┘
 draw([[k,k,'h'],[k-1,k,'h'],[k,k,'v'],[k,k+1,'v']]);o.cornerDL=[full(X-3,X+2,Y,Y+2*U-1),full(X-U-3,X+2,Y-14,Y-1)];   // ┐
 draw([[k,k+2,'h'],[k+1,k+2,'h'],[k,k,'v'],[k,k+1,'v']]);o.cornerBR=[full(X-3,X+2,Y-14,Y+2*U-1),full(X-3,X+2*U+2,Y+2*U-14,Y+2*U-1)];   // └
 // 4. T com a perna descendo do meio de uma reta: a reta fica inteira e a coluna comeca logo abaixo dela
 draw([[k,k,'h'],[k+1,k,'h'],[k+2,k,'h'],[k+1,k,'v'],[k+1,k+1,'v']]);o.tTop=[full(X-3,X+3*U+2,Y-14,Y-1),full(X+U-3,X+U+2,Y,Y+2*U-1)];
 //    e a coluna nao cresce acima da reta (nao fura a face)
 o.tNoPole=!has(X+U,Y-15)&&!has(X+U-3,Y-15);
 // 5. T virado: coluna vinda de cima encontra uma reta
 draw([[k,k+2,'h'],[k+1,k+2,'h'],[k+2,k+2,'h'],[k+1,k,'v'],[k+1,k+1,'v']]);o.tBottom=[full(X+U-3,X+U+2,Y-14,Y+2*U-1),full(X-3,X+3*U+2,Y+2*U-14,Y+2*U-1)];
 // 6. extremidades soltas continuam com a folga de 3 px, sem pintar alem disso
 draw([[k,k,'h']]);o.endsFree=has(X-3,Y-5)&&has(X+U+2,Y-5)&&!has(X-4,Y-5)&&!has(X+U+3,Y-5);
 // 7. duas pecas lado a lado: nenhum pixel pintado fora do corpo (sem sobra de 1 px)
 draw([[k,k,'h'],[k+1,k,'h']]);o.noSpill=!has(X+2*U+3,Y-5)&&!has(X-4,Y-5);
 // 8. porta no meio de uma reta nao abre buraco no topo (verga continua)
 draw([[k,k,'h'],[k+1,k,'h',3],[k+2,k,'h']]);o.doorLine=full(X-3,X+3*U+2,Y-14,Y-11);
 draw([[k,k,'h'],[k+1,k,'h',3,1],[k+2,k,'h']]);o.doorOpen=full(X-3,X+3*U+2,Y-14,Y-12);
 // 9. cores: a face da reta fica igual com ou sem a parede que chega nela
 const lineT=[[k,k,'h'],[k+1,k,'h'],[k+2,k,'h']];
 o.colT=sameAs(lineT,X-3,X+3*U+2,Y-14,Y-1)(lineT.concat([[k+1,k,'v'],[k+1,k+1,'v']]));
 o.colTup=sameAs(lineT,X-3,X+3*U+2,Y-14,Y-1)(lineT.concat([[k+1,k-2,'v'],[k+1,k-1,'v']]));
 o.colX=sameAs(lineT,X-3,X+3*U+2,Y-14,Y-1)(lineT.concat([[k+1,k-1,'v'],[k+1,k,'v']]));
 const two=[[k,k,'h'],[k+1,k,'h']];
 o.colL=sameAs(two,X-3,X+2*U+2,Y-14,Y-1)(two.concat([[k,k,'v'],[k,k+1,'v']]));
 o.colR=sameAs(two,X-3,X+2*U+2,Y-14,Y-1)(two.concat([[k+2,k-2,'v'],[k+2,k-1,'v']]));
 window.R=realR;
 return o;});
console.log(JSON.stringify(r));
ok(!r.hLine,'reta horizontal sem vazio entre as pecas '+JSON.stringify(r.hLine));
ok(!r.vLine,'reta vertical sem vazio entre as pecas '+JSON.stringify(r.vLine));
ok(r.cornerDR.every(v=>!v),'canto superior esquerdo fechado '+JSON.stringify(r.cornerDR));
ok(r.cornerUL.every(v=>!v),'canto inferior direito fechado '+JSON.stringify(r.cornerUL));
ok(r.cornerDL.every(v=>!v),'canto superior direito fechado '+JSON.stringify(r.cornerDL));
ok(r.cornerBR.every(v=>!v),'canto inferior esquerdo fechado '+JSON.stringify(r.cornerBR));
ok(r.tTop.every(v=>!v)&&r.tNoPole,'T: reta inteira e coluna colada embaixo, sem poste na frente da face '+JSON.stringify(r.tTop));
ok(r.tBottom.every(v=>!v),'T virado fechado '+JSON.stringify(r.tBottom));
ok(!r.colT&&!r.colTup&&!r.colX,'T e cruz: a face da reta nao leva coluna por cima '+JSON.stringify([r.colT,r.colTup,r.colX]));
ok(!r.colL&&!r.colR,'canto: a face chega ate a ponta da coluna '+JSON.stringify([r.colL,r.colR]));
ok(r.endsFree,'ponta solta avanca 3 px e nao mais');ok(r.noSpill,'sem sobra de 1 px na ponta');
ok(!r.doorLine&&!r.doorOpen,'porta no meio da reta mantem o topo continuo '+JSON.stringify([r.doorLine,r.doorOpen]));
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
