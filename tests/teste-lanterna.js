/* Lanterna: aparece como loot nos 4 mapas (mais nas bases militares), pegar libera o botao pequeno, liga e desliga, o feixe ilumina
   a frente de noite, vale no save e o zumbi no feixe enxerga de mais longe.
   Uso: node tests/teste-lanterna.js [caminho/index.html]. Sai com codigo 1 se algo falhar. */
const path = require('path');
const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{console.log(c?'OK  ':'FAIL',m);if(!c)bad++;};
const pg=await (await b.newContext({viewport:{width:900,height:600}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+file);await pg.waitForTimeout(300);
for(const map of ['forest','city','desert','snow']){
  const o=await pg.evaluate((map)=>{localStorage.clear();selectedMap=map;pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;
    const inB=it=>blds.find(q=>it.x>q.x&&it.x<q.x+q.w&&it.y>q.y&&it.y<q.y+q.h);
    let mil=0,milB=new Set(),other=0;for(const it of items)if(it.t==='flashlight'){const q=inB(it);if(q&&q.type==='mil'){mil++;milB.add(q);}else other++;}
    return {mil,milBlds:blds.filter(q=>q.type==='mil').length,milWith:milB.size,other,total:items.filter(i=>i.t==='flashlight').length};},map);
  console.log(map,JSON.stringify(o));
  ok(o.total>=1,map+': lanternas aparecem no mapa ('+o.total+')');
  if(o.milBlds>0)ok(o.milWith>=Math.ceil(o.milBlds*.4),map+': bases militares guardam lanterna ('+o.milWith+' de '+o.milBlds+')');
}
const r=await pg.evaluate(()=>{
  localStorage.clear();selectedMap='forest';pendingSlot=1;showScreen(null);newGame();window.requestAnimationFrame=()=>0;zombies=[];animals=[];items.length=0;vehicles.length=0;trees.length=0;rocks.length=0;decorations.length=0;rebuildSolidGrid();
  const o={};P.inside=null;P.dead=false;P.inVehicle=null;P.inv=[];
  document.getElementById('hud').classList.remove('hide');   // o HUD precisa estar visivel para medir o botao de verdade
  const btn=document.getElementById('bflash');o.btnHidden0=btn.classList.contains('hide');o.cssHidden0=getComputedStyle(btn).display==='none'&&btn.getBoundingClientRect().width===0;
  items.push({t:'flashlight',x:P.x,y:P.y});P.face=0;pickup();
  o.have=P.torch===true;o.noSlot=!P.inv.some(s=>s.t==='flashlight');for(let i=0;i<3;i++)update(.05);o.btnShown=!btn.classList.contains('hide');o.cssShown=getComputedStyle(btn).display!=='none'&&btn.getBoundingClientRect().width>0;o.on0=btn.classList.contains('on');
  items.push({t:'flashlight',x:P.x,y:P.y});pickup();o.dup=items.some(i=>i.t==='flashlight');   // segunda lanterna fica no chao
  state='play';toggleFlash();o.on1=P.flashOn&&btn.classList.contains('on')&&btn.getAttribute('aria-pressed')==='true';
  toggleFlash();o.off=!P.flashOn&&!btn.classList.contains('on');
  // pequeno e fica abaixo de pausa e fabricar
  const rb=btn.getBoundingClientRect(),rp=document.getElementById('bpause').getBoundingClientRect();o.below=rb.top>=rp.bottom-1;o.small=rb.width<=40&&rb.height<=36;
  // feixe: de noite a frente (na direcao do rosto) fica mais clara que as costas
  weather='clear';T=DAY_SECONDS*.9;P.flashOn=true;for(let i=0;i<80;i++){T=DAY_SECONDS*.9;update(.05);}
  const cv=document.getElementById('game');
  // procura um trecho aberto (sem parede, predio, agua ou obstaculo em volta) para o resultado nao depender do mundo sorteado
  {let found=false;for(let i=0;i<4000&&!found;i++){const x=300+((i*97)%2600),y=300+((i*61)%2600);let clear=true;
    for(let dx=-100;dx<=130&&clear;dx+=15)for(let dy=-100;dy<=100;dy+=15){if(solidPoint(x+dx,y+dy,6)||(typeof inWater==='function'&&inWater(x+dx,y+dy))||blds.some(q=>x+dx>q.x-20&&x+dx<q.x+q.w+20&&y+dy>q.y-20&&y+dy<q.y+q.h+20)){clear=false;break;}}
    if(clear){P.x=x;P.y=y;found=true;}}
   if(!found){P.x=1700;P.y=1700;}}
  P.face=0;camX=P.x-W/Z/2;camY=P.y-H/Z/2;
  const lum=(wx,wy)=>{const sx=Math.round((wx-camX)*Z),sy=Math.round((wy-camY)*Z);const d=cv.getContext('2d').getImageData(sx-2,sy-2,5,5).data;let t=0;for(let i=0;i<d.length;i+=4)t+=d[i]+d[i+1]+d[i+2];return t/(d.length/4*3);};
  for(let i=0;i<3;i++){update(.05);render();}
  o.front=lum(P.x+70,P.y-6);o.back=lum(P.x-70,P.y-6);o.side=lum(P.x+10,P.y+70);
  P.flashOn=false;render();o.frontOff=lum(P.x+70,P.y-6);o.backOff=lum(P.x-70,P.y-6);o.sideOff=lum(P.x+10,P.y+70);   // o terreno muda de mundo para mundo: compara cada ponto ligado x desligado
  // save e carregar
  const ps=JSON.parse(JSON.stringify(P,(k,v)=>(k==='inside'||k==='inVehicle'||k==='fish'||k==='sleeping'||k[0]==='_')?undefined:v));o.saved=ps.torch===true;
  // aliado com lanterna acesa nao quebra o desenho
  P.flashOn=true;remotePlayers.zz={id:'zz',x:P.x+120,y:P.y+30,face:Math.PI,alive:true,lt:1};render();delete remotePlayers.zz;o.remoteOk=true;
  // morreu: botao some
  P.dead=true;for(let i=0;i<3;i++)update(.05);o.deadHide=btn.classList.contains('hide');P.dead=false;
  return o;});
console.log(JSON.stringify(r));
ok(r.cssHidden0,'o botao da lanterna nao aparece na tela antes de pegar a lanterna (display de verdade, nao so a classe)');
ok(r.cssShown,'depois de pegar a lanterna o botao aparece na tela');
ok(r.btnHidden0&&r.have&&r.noSlot&&r.btnShown&&!r.on0,'sem lanterna o botao some; ao pegar ele aparece desligado e sem ocupar espaco da mochila');
ok(r.dup,'a segunda lanterna fica no chao (so se carrega uma)');
ok(r.on1&&r.off,'o botao liga e desliga');
ok(r.below&&r.small,'botao pequeno, abaixo de pausa e fabricar');
ok(r.front-r.frontOff>12&&r.front-r.frontOff>(r.back-r.backOff)+12&&r.front-r.frontOff>(r.side-r.sideOff)+12,'de noite o feixe ilumina a frente e nao as costas nem o lado (ganho '+[r.front-r.frontOff,r.back-r.backOff,r.side-r.sideOff].map(v=>Math.round(v))+')');
ok(r.saved,'o save guarda a lanterna');ok(r.remoteOk,'lanterna do aliado e desenhada sem erro');ok(r.deadHide,'morto: o botao some');
ok(errs.length===0,'sem erros '+errs[0]);
await b.close();process.exit(bad?1:0);})();
