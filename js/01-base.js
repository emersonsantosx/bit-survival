/* ============ HELPERS ============ */
const $=id=>document.getElementById(id);
const on=(id,ev,fn)=>{const e=$(id);if(e)e.addEventListener(ev,fn);};
const clamp=(v,a,b)=>isFinite(v)?(v<a?a:v>b?b:v):a;
/* Seeded RNG for deterministic multiplayer world generation */
let _rng = Math.random;
function setRng(seed){
  if(seed==null){ _rng = Math.random; return; }
  let s = Math.floor(Math.abs(seed)) % 2147483647;
  if(s <= 0) s += 2147483646;
  _rng = function(){
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rnd=(a,b)=>a+_rng()*(b-a);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(_rng()*a.length)];
const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
function wpick(t){let s=0;for(const k in t)s+=t[k];let r=_rng()*s;for(const k in t){r-=t[k];if(r<=0)return k;}return Object.keys(t)[0];}
function LSget(){try{return localStorage.getItem('minisurv_best');}catch(e){return null;}}
function LSset(v){try{localStorage.setItem('minisurv_best',String(v));}catch(e){}}
const pad=n=>(n<10?'0':'')+n;
const fmt=s=>Math.floor(s/60)+':'+pad(Math.floor(s%60));

/* ============ CANVAS + PERFORMANCE ============ */
const cv=$('game'), ctx=cv.getContext('2d',{alpha:false,desynchronized:true});
const lightC=document.createElement('canvas'), lctx=lightC.getContext('2d');
// Sprites de luz pré-desenhados (1x): um "buraco" suave na escuridão e um brilho quente de fogo
function makeLightSprite(stops){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const g=c.getContext('2d'), gr=g.createRadialGradient(64,64,10,64,64,64);
  for(const s of stops) gr.addColorStop(s[0],s[1]);
  g.fillStyle=gr; g.fillRect(0,0,128,128);
  return c;
}
const lightSprite=makeLightSprite([[0,'rgba(0,0,0,1)'],[.35,'rgba(0,0,0,.9)'],[.6,'rgba(0,0,0,.55)'],[.82,'rgba(0,0,0,.2)'],[1,'rgba(0,0,0,0)']]);
const lampSprite=makeLightSprite([[0,'rgba(255,228,150,.5)'],[.5,'rgba(255,214,120,.2)'],[1,'rgba(255,200,100,0)']]);
const fireSprite=makeLightSprite([[0,'rgba(255,170,60,.65)'],[.5,'rgba(255,110,30,.25)'],[1,'rgba(255,80,20,0)']]);
const mmC=$('mm'), mm=mmC.getContext('2d');
const mmStatic=document.createElement('canvas'); mmStatic.width=76; mmStatic.height=76;
const mms=mmStatic.getContext('2d');

const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')
  || ((navigator.maxTouchPoints||0)>1 && Math.min(screen.width||0,screen.height||0)<900);

let W=0,H=0,dispW=0,dispH=0,Z=2,camX=0,camY=0;
let JR=48,JK=22; // raio do joystick e do botão em px de canvas (resize() ajusta à escala)
let mmDrawT=0;

/* Qualidade: 0 = Alta, 1 = Equilibrada, 2 = Economia.
   O jogo começa sempre na qualidade escolhida (padrão: Alta, 60 FPS). Com o "ajuste automático" ligado,
   ele só reduz os efeitos sozinho se o aparelho não conseguir manter a taxa de quadros. */
const PERF_TIERS=[
  {weatherCap:160,weatherSpawn:.55,partsCap:180,fireRate:18,smokeRate:6, lightScale:2,hudInterval:.1, mmEvery:1},
  {weatherCap:120,weatherSpawn:.45,partsCap:140,fireRate:14,smokeRate:5, lightScale:2,hudInterval:.1, mmEvery:1},
  {weatherCap:85, weatherSpawn:.33,partsCap:100,fireRate:10,smokeRate:3.5,lightScale:4,hudInterval:.15,mmEvery:2}
];
function perfTotal(){ return Math.min(2,(CFG.quality|0)+(CFG.autoperf?(CFG.autolvl|0):0)); }
function perf(){
  const total=perfTotal(), t=PERF_TIERS[Math.min(2,total)];
  const fps=+CFG.fps||0; // 0 = máximo (taxa da tela)
  return {
    targetFps: fps>0?fps:240,
    maxCanvas: IS_MOBILE?1080:1600,
    weatherCap:t.weatherCap, weatherSpawn:t.weatherSpawn, partsCap:t.partsCap,
    fireRate:t.fireRate, smokeRate:t.smokeRate, lightScale:t.lightScale,
    hudInterval:t.hudInterval, mmEvery:t.mmEvery
  };
}
function resize(){
  dispW=window.innerWidth||800; dispH=window.innerHeight||360;
  // Zoom escolhido pelo tamanho REAL da tela. Reduzir resolução divide canvas e zoom pelo mesmo
  // número inteiro (d), então o campo de visão em unidades de mundo NÃO muda.
  const zDisp=Math.max(2,Math.floor(Math.min(dispW,dispH)/150));
  const maxSide=perf().maxCanvas, big=Math.max(dispW,dispH);
  let d=1;
  while(big/d>maxSide && d<zDisp){ d++; while(zDisp%d!==0 && d<zDisp) d++; }
  W=Math.max(160,Math.floor(dispW/d));
  H=Math.max(120,Math.floor(dispH/d));
  Z=zDisp/d;
  JR=Math.round(48*W/dispW); JK=Math.round(22*W/dispW);
  if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  // Luz full-res só se não estiver em modo simples
  // Buffer de luz: tamanho cheio no modo completo, 1/4 no modo simples (barato, suavizado ao ampliar)
  const lsc=perf().lightScale, lw=Math.ceil(W/lsc), lh=Math.ceil(H/lsc);
  if(lightC.width!==lw||lightC.height!==lh){ lightC.width=lw; lightC.height=lh; }
  ctx.imageSmoothingEnabled=false;
  if(lctx) lctx.imageSmoothingEnabled=false;
}
function toCanvasXY(e){
  const r=cv.getBoundingClientRect();
  const rw=r.width||dispW||1, rh=r.height||dispH||1;
  return {x:(e.clientX-r.left)*(W/rw), y:(e.clientY-r.top)*(H/rh)};
}
window.addEventListener('resize',resize);

/* ============ CONFIG ============ */
const CFG={master:0.8,sfx:1.0,amb:0.6,rain:0.7,step:0.8,music:0.5,hud:true,minimap:true,dmgflash:true,screenflash:true,fullscreen:true,tracers:true,
  quality:0, fps:60, autoperf:true, autolvl:0};
try{const raw=localStorage.getItem('minisurv_cfg');if(raw)Object.assign(CFG,JSON.parse(raw));}catch(e){}
if(CFG.minimap===undefined) CFG.minimap=true;
// Versão 3 das configurações: o "modo economia" antigo ligava sozinho no celular (30 FPS, poucos efeitos).
// Agora todo mundo começa em Alta, 60 FPS e ajuste automático; as opções antigas deixam de existir.
if(!CFG.cfgv||CFG.cfgv<3){
  CFG.quality=0;CFG.fps=60;CFG.autoperf=true;CFG.autolvl=0;CFG.cfgv=3;
  delete CFG.economy;delete CFG.simplelight;delete CFG.lowres;
  try{localStorage.setItem('minisurv_cfg',JSON.stringify(CFG));}catch(e){}
}
if(![0,1,2].includes(CFG.quality)) CFG.quality=0;
if(![0,30,60].includes(CFG.fps)) CFG.fps=60;
delete CFG.lowres;
CFG.autolvl=Math.max(0,Math.min(2,CFG.autolvl|0));
// Estas opções não aparecem mais nas configurações: ficam sempre ligadas, mesmo que uma versão antiga tenha salvo desligado
CFG.fullscreen=CFG.tracers=CFG.dmgflash=CFG.screenflash=true;
function saveCfg(){try{localStorage.setItem('minisurv_cfg',JSON.stringify(CFG));}catch(e){}}
function applyHudClasses(){
  document.body.classList.toggle('nohud', !CFG.hud);
  document.body.classList.toggle('nomap', !CFG.minimap);
}
applyHudClasses();
resize();

