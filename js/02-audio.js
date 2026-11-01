/* ============ ÁUDIO ============ */
let AC=null,muted=false,nbuf=null,AOUT=null;
/* entrada suave: 4 ms de subida evita o estalo de um som que começa no volume cheio de uma vez */
function gAtk(param,v,t){param.setValueAtTime(.0001,t);param.linearRampToValueAtTime(Math.max(.0002,v),t+.004);}
let ambientSrc=null,ambientGain=null,rainNoise=null;
let heartbeatT=0;
function aud(){
  try{
    if(!AC){
      AC=new (window.AudioContext||window.webkitAudioContext)();
      /* limitador geral: vários sons ao mesmo tempo somavam acima do máximo e estalavam (clipping) */
      const lim=AC.createDynamicsCompressor();
      lim.threshold.value=-14;lim.knee.value=10;lim.ratio.value=12;lim.attack.value=.002;lim.release.value=.18;
      const mg=AC.createGain();mg.gain.value=.9;
      lim.connect(mg);mg.connect(AC.destination);AOUT=lim;
      const n=Math.floor(AC.sampleRate*0.3);
      nbuf=AC.createBuffer(1,n,AC.sampleRate);
      const d=nbuf.getChannelData(0);
      for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    }
    if(AC.state==='suspended')AC.resume();
  }catch(e){}
}
function volFor(cat){
  if(muted)return 0;
  let v=CFG.master;
  if(cat==='sfx')v*=CFG.sfx;
  else if(cat==='amb')v*=CFG.amb;
  else if(cat==='rain')v*=CFG.rain;
  else if(cat==='step')v*=CFG.step;
  else if(cat==='music')v*=CFG.music;
  return clamp(v,0,1);
}
function beep(f,d,type,v,slide,cat){
  if(!AC)return;
  const vol=volFor(cat||'sfx');if(vol<=0)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'square';
    o.frequency.setValueAtTime(f,AC.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),AC.currentTime+d);
    gAtk(g.gain,(v||.05)*vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);
    o.connect(g);g.connect(AOUT);o.start();o.stop(AC.currentTime+d);
  }catch(e){}
}
/* Som de toque da interface: grave, curto e suave */
function uiTap(){
  aud();
  beep(150,.09,'sine',.16,-55,'sfx');
  beep(75,.07,'triangle',.08,-20,'sfx');
}
document.addEventListener('click',e=>{
  const t=e.target&&e.target.closest?e.target.closest('.menu-btn,.go,.back,.map-opt,.cfg-seg button,.cfg-toggle,.craft-tab'):null;
  if(t)uiTap();
},true);
function boom(d,v,low,cat){
  if(!AC||!nbuf)return;
  const vol=volFor(cat||'sfx');if(vol<=0)return;
  try{
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
    s.buffer=nbuf;s.loop=true;f.type='lowpass';f.frequency.value=low||800;
    gAtk(g.gain,v*vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);
    s.connect(f);f.connect(g);g.connect(AOUT);s.start();s.stop(AC.currentTime+d);
  }catch(e){}
}
function footstep(inWater,surf,sprint){
  if(!AC||!nbuf)return;
  const vol=volFor('step')*(sprint?1.3:1);if(vol<=0)return;
  try{
    const t=AC.currentTime,r=Math.random();
    if(inWater){ // chapinhar na água (lago, mar raso)
      gunNoise(t,.2,'lowpass',720,.8,.05*vol);gunNoise(t+.03,.12,'bandpass',1500+r*600,.8,.02*vol);return;
    }
    if(surf==='ice'){ // gelo firme: toque seco e agudo
      gunNoise(t,.04,'highpass',3500,.8,.03*vol);gunNoise(t+.01,.06,'bandpass',2600+r*500,1.6,.025*vol);return;
    }
    if(surf==='snow'){ // neve: crocante, dois estalos abafados
      gunNoise(t,.05,'highpass',2400,.7,.03*vol*(.8+r*.4));
      gunNoise(t+.035,.09,'bandpass',1500+r*400,.9,.028*vol);
      gunNoise(t,.1,'lowpass',500,.7,.02*vol);return;
    }
    if(surf==='sand'){ // areia: chiado macio e curto
      gunNoise(t,.15,'bandpass',1000+r*300,.5,.026*vol);
      gunNoise(t,.12,'lowpass',380,.7,.02*vol);return;
    }
    if(surf==='pave'){ // calçada e asfalto: toque seco
      gunNoise(t,.04,'bandpass',1700+r*500,2,.03*vol);
      gunTone(t,.07,'sine',130+r*20,75,.04*vol);return;
    }
    if(surf==='wood'){ // madeira oca (casas e píer)
      gunTone(t,.09,'sine',150+r*25,85,.05*vol);
      gunNoise(t,.06,'bandpass',520,1.2,.025*vol);return;
    }
    if(surf==='tile'){ // azulejo: clique duro e agudo
      gunNoise(t,.03,'bandpass',2600+r*400,2.5,.03*vol);
      gunTone(t,.05,'triangle',280+r*30,170,.03*vol);return;
    }
    if(surf==='carpet'){ // carpete: batida abafada
      gunNoise(t,.07,'lowpass',280,.7,.04*vol);return;
    }
    if(surf==='conc'){ // concreto: seco e um pouco de eco
      gunNoise(t,.05,'bandpass',1300+r*300,1.6,.03*vol);
      gunTone(t,.08,'sine',110+r*20,65,.04*vol);return;
    }
    if(surf==='straw'){ // palha
      gunNoise(t,.1,'bandpass',2000+r*500,.7,.026*vol);gunNoise(t,.08,'lowpass',400,.7,.015*vol);return;
    }
    // grama e terra da floresta: folhas e gravetos
    gunNoise(t,.09,'bandpass',1100+r*500,.6,.022*vol);
    gunNoise(t,.07,'lowpass',260,.8,.024*vol);
    if(r<.25)gunNoise(t+.04,.02,'highpass',4200,.8,.014*vol);   // graveto estalando
  }catch(e){}
}
/* superfície sob os pés: cada piso e cada mapa soam diferente */
function stepSurf(){
  if(P.inside){
    const b=P.inside;
    if(b.rooms)for(const r of b.rooms)if(P.x>=r.x&&P.x<=r.x+r.w&&P.y>=r.y&&P.y<=r.y+r.h){
      const f=r.fl||'wood';
      if(f==='tile'||f==='tile2')return 'tile';
      if(f==='carpet'||f==='carpet2')return 'carpet';
      if(f==='conc'||f==='conc2')return 'conc';
      if(f==='straw')return 'straw';
      return 'wood';
    }
    return 'wood';
  }
  if(selectedMap==='city'&&ORLA){
    if(onPier(P.x,P.y))return 'wood';
    if(onSand(P.x,P.y))return 'sand';
  }
  if(selectedMap==='snow'){for(const l of lakes)if(l.frozen&&!l.fountain&&Math.abs(P.x-l.cx)<l.r*1.1&&Math.abs(P.y-l.cy)<l.r*1.1&&iceSolid(l,P.x,P.y))return 'ice';return 'snow';}
  if(selectedMap==='desert')return 'sand';
  if(selectedMap==='city')return 'pave';
  return 'grass';
}
/* Sons de armas de fogo: cada arma tem a sua assinatura.
   pistola = estalo seco | SMG = estalinhos rápidos | shotgun = estrondo grave + bombeada | rifle = tiro forte com eco + ferrolho */
function gunNoise(t0,dur,type,freq,q,v){
  const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
  s.buffer=nbuf;s.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q||.7;
  gAtk(g.gain,v,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(AOUT);s.start(t0);s.stop(t0+dur+.02);
}
function gunTone(t0,dur,type,f0,f1,v){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  gAtk(g.gain,v,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  o.connect(g);g.connect(AOUT);o.start(t0);o.stop(t0+dur+.02);
}
function gunshot(kind,far){
  if(!AC||!nbuf)return;
  let vol=volFor('sfx');if(vol<=0)return;
  if(far)vol*=.55;
  if(kind===true)kind='rifle';else if(!kind)kind='pistol';
  try{
    const t=AC.currentTime;
    if(kind==='smg'){
      gunNoise(t,.05,'highpass',1800,.6,.2*vol);
      gunNoise(t,.07,'bandpass',900,.8,.14*vol);
      gunTone(t,.06,'triangle',380,140,.12*vol);
    }else if(kind==='shotgun'){
      gunNoise(t,.05,'highpass',1500,.6,.3*vol);
      gunNoise(t,.5,'lowpass',950,.7,.55*vol);
      gunNoise(t+.03,.7,'lowpass',380,.7,.3*vol);
      gunTone(t,.28,'sine',130,38,.4*vol);
      // bombeada da shotgun (corrediça: toc-toc metálico)
      gunTone(t+.42,.05,'square',520,260,.06*vol);
      gunNoise(t+.42,.04,'bandpass',2200,3,.07*vol);
      gunTone(t+.55,.06,'square',640,320,.06*vol);
      gunNoise(t+.55,.04,'bandpass',2600,3,.07*vol);
    }else if(kind==='rifle'){
      gunNoise(t,.04,'highpass',2500,.6,.34*vol);
      gunNoise(t,.22,'bandpass',1400,.7,.4*vol);
      gunTone(t,.35,'sine',95,30,.5*vol);
      // eco distante
      gunNoise(t+.13,.7,'lowpass',420,.6,.18*vol);
      gunNoise(t+.28,.6,'lowpass',300,.6,.1*vol);
      // ferrolho
      gunTone(t+.55,.05,'square',420,200,.06*vol);
      gunNoise(t+.55,.04,'bandpass',1800,3,.07*vol);
      gunTone(t+.68,.06,'square',560,300,.06*vol);
    }else{ // pistola
      gunNoise(t,.045,'highpass',2000,.6,.3*vol);
      gunNoise(t,.12,'bandpass',1100,.9,.26*vol);
      gunTone(t,.1,'triangle',260,90,.2*vol);
      gunNoise(t+.05,.22,'lowpass',600,.7,.08*vol);
    }
  }catch(e){}
}
function chopWood(){
  if(!AC)return;
  const vol=volFor('sfx');if(vol<=0)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='triangle';o.frequency.setValueAtTime(320,AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(120,AC.currentTime+.12);
    gAtk(g.gain,.12*vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.16);
    o.connect(g);g.connect(AOUT);o.start();o.stop(AC.currentTime+.18);
    const o2=AC.createOscillator(),g2=AC.createGain();
    o2.type='square';o2.frequency.setValueAtTime(900,AC.currentTime);
    gAtk(g2.gain,.06*vol,AC.currentTime);
    g2.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.03);
    o2.connect(g2);g2.connect(AOUT);o2.start();o2.stop(AC.currentTime+.04);
  }catch(e){}
}
function chopStone(){
  if(!AC)return;
  const vol=volFor('sfx');if(vol<=0)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='square';o.frequency.setValueAtTime(1200,AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(400,AC.currentTime+.06);
    gAtk(g.gain,.1*vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.14);
    o.connect(g);g.connect(AOUT);o.start();o.stop(AC.currentTime+.16);
    const o2=AC.createOscillator(),g2=AC.createGain();
    o2.type='triangle';o2.frequency.setValueAtTime(2400,AC.currentTime);
    gAtk(g2.gain,.08*vol,AC.currentTime);
    g2.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.04);
    o2.connect(g2);g2.connect(AOUT);o2.start();o2.stop(AC.currentTime+.05);
  }catch(e){}
}
function hitConfirm(){
  // Feedback de acerto — clique metálico curto
  beep(880,.04,'square',.04, -200);
  beep(420,.06,'triangle',.035);
}
function bowRelease(){ /* arco é silencioso: sem som de disparo */ }
function cookSizzle(){
  boom(.25,.06,1200,'sfx');
  beep(200,.15,'sawtooth',.02);
}
function animalGrowl(aggro){
  if(aggro) beep(90,.2,'sawtooth',.06,40);
  else beep(220,.12,'triangle',.03,-40);
}
function hitFlesh(){
  if(!AC||!nbuf)return;
  const vol=volFor('sfx');if(vol<=0)return;
  try{
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
    s.buffer=nbuf;s.loop=true;f.type='lowpass';f.frequency.value=600;
    gAtk(g.gain,.2*vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.12);
    s.connect(f);f.connect(g);g.connect(AOUT);
    s.start();s.stop(AC.currentTime+.14);
  }catch(e){}
}
/* ===== Vozes de zumbis e animais =====
   voice(): sintetizador simples (tom + vibrato + tremolo + ruido filtrado) com volume e posicao (esq/dir) */
const VOICE_BOOST=4; // celular quase nao reproduz graves: vozes mais fortes + harmonicos
function voice(o){
  if(!AC||!nbuf)return;
  const vol=volFor('sfx')*(o.gain==null?1:o.gain)*VOICE_BOOST;if(vol<=0.002)return;
  const reps=o.rep||1;
  for(let k=0;k<reps;k++){
    try{
      const t0=AC.currentTime+(o.delay||0)+k*(o.gap||.2),dur=o.dur;
      const out=AC.createGain();
      out.gain.setValueAtTime(.0001,t0);
      out.gain.exponentialRampToValueAtTime(Math.max(.0003,o.v*vol),t0+(o.atk||.02));
      out.gain.exponentialRampToValueAtTime(.0001,t0+dur);
      let dest=AOUT;
      if(AC.createStereoPanner&&o.pan){const pn=AC.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,o.pan));pn.connect(AOUT);dest=pn;}
      out.connect(dest);
      let bus=out;
      if(o.am){
        const ag=AC.createGain();ag.gain.value=1-o.am/2;
        const lf=AC.createOscillator(),lg=AC.createGain();lf.frequency.value=o.amHz||10;lg.gain.value=o.am/2;
        lf.connect(lg);lg.connect(ag.gain);ag.connect(out);lf.start(t0);lf.stop(t0+dur+.02);bus=ag;
      }
      if(o.f0){
        const os=AC.createOscillator(),fl=AC.createBiquadFilter();
        os.type=o.type||'sawtooth';fl.type='lowpass';fl.frequency.value=o.lp||800;
        os.frequency.setValueAtTime(o.f0,t0);
        if(o.fm)os.frequency.exponentialRampToValueAtTime(o.fm,t0+dur*.45);
        os.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1||o.f0),t0+dur);
        if(o.vib){
          const vl=AC.createOscillator(),vg=AC.createGain();vl.frequency.value=o.vibHz||6;vg.gain.value=o.f0*o.vib;
          vl.connect(vg);vg.connect(os.frequency);vl.start(t0);vl.stop(t0+dur+.02);
        }
        os.connect(fl);fl.connect(bus);os.start(t0);os.stop(t0+dur+.02);
        // harmonicos (2x e 3x): fazem o grave aparecer em alto-falantes pequenos
        if(o.f0<400){
          for(const [mult,lvl] of [[2,.55],[3,.3]]){
            const h=AC.createOscillator(),hg=AC.createGain(),hf=AC.createBiquadFilter();
            h.type='sawtooth';hf.type='lowpass';hf.frequency.value=Math.max(1200,(o.lp||800)*2.2);
            h.frequency.setValueAtTime(o.f0*mult,t0);
            if(o.fm)h.frequency.exponentialRampToValueAtTime(o.fm*mult,t0+dur*.45);
            h.frequency.exponentialRampToValueAtTime(Math.max(40,(o.f1||o.f0)*mult),t0+dur);
            hg.gain.value=lvl;h.connect(hf);hf.connect(hg);hg.connect(bus);h.start(t0);h.stop(t0+dur+.02);
          }
        }
      }
      if(o.nf){
        const ns=AC.createBufferSource(),nfl=AC.createBiquadFilter(),ng=AC.createGain();
        ns.buffer=nbuf;ns.loop=true;nfl.type=o.nt||'lowpass';nfl.frequency.value=o.nf;nfl.Q.value=o.nq||.8;ng.gain.value=o.nv==null?.3:o.nv;
        ns.connect(nfl);nfl.connect(ng);ng.connect(bus);ns.start(t0);ns.stop(t0+dur+.02);
      }
    }catch(e){}
  }
}
/* zumbis: cada tipo tem a sua voz base; idle/ataque/morte variam em cima dela */
const ZVB=[
  {f0:115,f1:78,dur:.95,type:'sawtooth',lp:600,vib:.03,vibHz:6,am:.45,amHz:8,nf:450,nt:'lowpass',nv:.22,v:.05},   // Comum: gemido
  {f0:175,f1:120,dur:.55,type:'sawtooth',lp:900,vib:.05,vibHz:9,am:.6,amHz:14,nf:1100,nt:'bandpass',nv:.35,v:.045}, // Rapido: rouco
  {f0:62,f1:44,dur:1.2,type:'sawtooth',lp:320,vib:.02,vibHz:4,am:.35,amHz:5,nf:260,nt:'lowpass',nv:.4,v:.09},      // Brute: rugido grave
  {f0:55,f1:38,dur:1.5,type:'square',lp:380,vib:.03,vibHz:5,am:.5,amHz:6,nf:300,nt:'lowpass',nv:.5,v:.11},          // Chefe: rugido profundo
  {f0:95,f1:70,dur:.8,type:'sawtooth',lp:500,am:.8,amHz:22,nf:700,nt:'bandpass',nv:.5,v:.05},                      // Spitter: gargarejo
  {dur:.7,am:.9,amHz:12,nf:1600,nt:'bandpass',nq:1.2,nv:.7,v:.05},                                                 // Crawler: arranhado
  {f0:380,f1:620,dur:1,type:'sawtooth',lp:1400,vib:.06,vibHz:6,nf:1200,nt:'bandpass',nv:.15,v:.05},                // Screamer: lamento
  {f0:78,f1:52,dur:1,type:'sawtooth',lp:380,am:.7,amHz:7,nf:380,nt:'lowpass',nv:.5,v:.07},                         // Inchado: gorgolejo
  {f0:210,f1:150,dur:.5,type:'sawtooth',lp:1100,am:.7,amHz:26,nf:1000,nt:'bandpass',nv:.3,v:.05},                   // Berserker: rosnado
  {f0:70,f1:46,dur:1.3,type:'sawtooth',lp:420,vib:.04,vibHz:5,am:.5,amHz:9,nf:320,nt:'lowpass',nv:.45,v:.1}             // Yeti: rugido gelado
];
function creatureGain(x,y,range){
  if(!P)return null;
  const d=Math.hypot(x-P.x,y-P.y);if(d>range)return null;
  let g=.25+.75*Math.pow(1-d/range,.9);
  const ins=P.inside;
  if(ins){const inB=x>ins.x&&x<ins.x+ins.w&&y>ins.y&&y<ins.y+ins.h;if(!inB)g*=.4;}
  return {gain:g,pan:Math.max(-.9,Math.min(.9,(x-P.x)/180))};
}
function zombieVoice(z,act){
  const sp=creatureGain(z.x,z.y,380);if(!sp||sp.gain<.05)return;
  const b=ZVB[z.kind|0]||ZVB[0],o=Object.assign({},b,{gain:sp.gain,pan:sp.pan});
  if(act==='attack'){if(o.f0){o.f0*=1.35;o.f1*=1.1;}o.dur*=.5;o.v*=1.5;}
  else if(act==='hurt'){if(o.f0){o.f0*=1.3;o.f1=o.f0*.75;}o.dur*=.45;o.v*=1.15;}
  else if(act==='death'){if(o.f1)o.f1*=.45;o.dur*=1.3;o.v*=1.2;}
  else if(act==='alert'){if(o.f0)o.f0*=1.15;o.dur*=.85;}
  voice(o);
}
/* animais: alert (rosna ao perceber), attack, hurt, idle (som de ambiente), death */
const AVB={
  wolf:{alert:{f0:105,f1:85,dur:.8,type:'sawtooth',lp:520,vib:.04,vibHz:7,am:.6,amHz:17,nf:700,nt:'lowpass',nv:.3,v:.07},
        attack:{f0:230,f1:110,dur:.28,type:'sawtooth',lp:900,nf:1200,nt:'bandpass',nv:.5,v:.09},
        hurt:{f0:560,f1:300,dur:.22,type:'triangle',lp:1800,v:.05},
        idle:{f0:280,fm:470,f1:380,dur:2.2,type:'sine',lp:1400,vib:.02,vibHz:5,atk:.4,v:.035,far:420}},
  dog:{alert:{f0:320,f1:190,dur:.13,type:'sawtooth',lp:1400,nf:900,nt:'bandpass',nv:.4,v:.07,rep:2,gap:.2},
       attack:{f0:300,f1:170,dur:.14,type:'sawtooth',lp:1400,nf:900,nt:'bandpass',nv:.4,v:.08},
       hurt:{f0:620,f1:360,dur:.2,type:'triangle',lp:1800,v:.045}},
  boar:{alert:{f0:90,f1:62,dur:.38,type:'sawtooth',lp:420,am:.5,amHz:14,nf:500,nt:'lowpass',nv:.4,v:.08,rep:2,gap:.32},
        attack:{f0:150,f1:80,dur:.3,type:'sawtooth',lp:700,nf:900,nt:'bandpass',nv:.4,v:.1},
        hurt:{f0:420,f1:210,dur:.3,type:'sawtooth',lp:1600,vib:.05,vibHz:14,v:.06}},
  scorpion:{alert:{nf:3500,nt:'highpass',nv:.5,dur:.35,v:.04},
        attack:{nf:2200,nt:'bandpass',nq:1.5,nv:.6,dur:.04,v:.05,rep:3,gap:.06},
        hurt:{nf:3000,nt:'highpass',nv:.5,dur:.2,v:.04}},
  rat:{alert:{f0:1500,f1:1000,dur:.09,type:'triangle',lp:2500,v:.025,rep:2,gap:.12},
       attack:{f0:1500,f1:1000,dur:.09,type:'triangle',lp:2500,v:.03},
       hurt:{f0:1700,f1:900,dur:.1,type:'triangle',lp:2500,v:.03}},
  crow:{idle:{f0:620,f1:400,dur:.22,type:'sawtooth',lp:1800,am:.4,amHz:30,nf:1500,nt:'bandpass',nv:.2,v:.04,rep:2,gap:.3,far:300},
        hurt:{f0:700,f1:380,dur:.25,type:'sawtooth',lp:1900,am:.4,amHz:30,v:.05}},
  vulture:{idle:{f0:520,f1:380,dur:.6,type:'sawtooth',lp:1500,nf:1400,nt:'bandpass',nv:.5,v:.035,far:300},
        hurt:{f0:520,f1:300,dur:.4,type:'sawtooth',lp:1500,nf:1400,nt:'bandpass',nv:.5,v:.045}},
  deer:{alert:{nf:800,nt:'lowpass',nv:.5,dur:.3,v:.04},
        hurt:{f0:340,f1:210,dur:.4,type:'triangle',lp:1200,vib:.06,vibHz:10,v:.045},
        idle:{nf:700,nt:'lowpass',nv:.4,dur:.25,v:.025,far:200}},
  rabbit:{alert:{f0:90,f1:50,dur:.1,type:'sine',lp:400,v:.06},
        hurt:{f0:900,f1:600,dur:.15,type:'triangle',lp:2200,v:.03}},
  camel:{idle:{f0:100,f1:70,dur:.8,type:'sawtooth',lp:450,am:.4,amHz:8,nf:400,nt:'lowpass',nv:.25,v:.05,far:260},
        hurt:{f0:100,f1:65,dur:.7,type:'sawtooth',lp:450,am:.4,amHz:8,nf:400,nt:'lowpass',nv:.3,v:.07}}
};
function animalVoice(a,act){
  const tbl=AVB[a.k];if(!tbl)return;
  let b=tbl[act];
  if(!b&&act==='death')b=tbl.hurt;
  if(!b&&act==='attack')b=tbl.alert||tbl.hurt;
  if(!b)return;
  const sp=creatureGain(a.x,a.y,b.far||320);if(!sp||sp.gain<.05)return;
  const o=Object.assign({},b,{gain:sp.gain,pan:sp.pan});
  if(act==='death'){if(o.f1)o.f1*=.5;o.dur*=1.4;}
  voice(o);
}
/* vozes ambiente: roda em todos os aparelhos (no multiplayer o convidado tambem escuta) */
function updateCreatureVoices(dt){
  if(!AC||!P||P.dead||!nbuf)return;
  let n=0;
  for(const z of zombies){
    if(z.dead)continue;
    if(Math.abs(z.x-P.x)>380||Math.abs(z.y-P.y)>380)continue;
    z._vt=(z._vt==null?rnd(.5,4):z._vt)-dt;
    if(z._vt<=0){
      const chasing=z.lock>0||z.moving;
      z._vt=chasing?rnd(3.5,7):rnd(8,16);
      if(n<2){zombieVoice(z,'idle');n++;}
    }
  }
  for(const a of animals){
    if(a.dead)continue;
    const tbl=AVB[a.k];if(!tbl)continue;
    const d=Math.hypot(a.x-P.x,a.y-P.y);
    const chasing=ANIMAL_AGGRO[a.k]&&d<160;
    if(d>480)continue;
    a._vt=(a._vt==null?rnd(2,10):a._vt)-dt;
    if(a._vt<=0){
      if(chasing&&tbl.alert){a._vt=rnd(4,8);if(n<2){animalVoice(a,'alert');n++;}}
      else if(tbl.idle){a._vt=a.k==='wolf'?rnd(25,45):rnd(14,28);if(n<2){animalVoice(a,'idle');n++;}}
      else a._vt=rnd(10,20);
    }
  }
}

/* ===== Musica de menu: violao dedilhado (corda beliscada sintetizada), lenta e baixinha ===== */
let musicWanted=false,musicOn=false,musicGain=null,musicTimer=0,musicNext=0,musicStepN=0,musicVerb=null;
const MUSIC_BASE=.2,MUSIC_STEP=.9;
const MUSIC_CACHE={};
function ksBuf(freq,dur){
  const key=freq.toFixed(1)+'_'+dur;if(MUSIC_CACHE[key])return MUSIC_CACHE[key];
  const sr=AC.sampleRate,n=Math.floor(sr*dur),L=Math.max(2,Math.round(sr/freq));
  const buf=AC.createBuffer(1,n,sr),d=buf.getChannelData(0),ring=new Float32Array(L);
  for(let i=0;i<L;i++)ring[i]=Math.random()*2-1;
  for(let k=0;k<2;k++)for(let i=0;i<L;i++)ring[i]=(ring[i]+ring[(i+1)%L])*.5;
  let p=0,mx=0;
  for(let i=0;i<n;i++){const a=ring[p],b=ring[(p+1)%L];ring[p]=(a+b)*.5*.9968;d[i]=a;if(Math.abs(a)>mx)mx=Math.abs(a);p=(p+1)%L;}
  const sc=mx>0?.9/mx:1;for(let i=0;i<n;i++)d[i]*=sc;
  const fo=Math.min(n,Math.floor(sr*.008));for(let i=0;i<fo;i++)d[n-1-i]*=i/fo;
  return MUSIC_CACHE[key]=buf;
}
/* acordes (grave, quinta, fundamental, terca, aguda) em Am, F, C, G */
const MUSIC_CHORDS=[
  [110,164.81,220,261.63,329.63],
  [87.31,130.81,174.61,220,261.63],
  [130.81,196,261.63,329.63,392],
  [98,146.83,196,246.94,293.66]
];
const MUSIC_PATTERN=[0,2,3,1,4,3,2,-1];
const MUSIC_MELODY=[[329.63,392,440],[261.63,329.63,349.23],[392,329.63,293.66],[293.66,246.94,329.63]];
function musicPluck(t,freq,vel,dur){
  const src=AC.createBufferSource(),g=AC.createGain(),lp=AC.createBiquadFilter();
  src.buffer=ksBuf(freq,dur);g.gain.value=vel;lp.type='lowpass';lp.frequency.value=2400;
  src.connect(lp);lp.connect(g);g.connect(musicGain);src.start(t);
}
function musicSchedule(){
  if(!musicOn||!AC||!musicGain)return;
  while(musicNext<AC.currentTime+1.5){
    const bar=Math.floor(musicStepN/8),step=musicStepN%8,ch=MUSIC_CHORDS[bar%4];
    const idx=MUSIC_PATTERN[step];
    const t=musicNext+(Math.random()-.5)*.05;
    if(idx>=0&&Math.random()>.18)musicPluck(t,ch[idx],(.5+Math.random()*.35)*(idx===0?1.1:1),2.6);
    // melodia esparsa, ecoando no fim de alguns compassos
    if(step===4&&(bar%2===1||Math.random()<.35)){
      const m=MUSIC_MELODY[bar%4];musicPluck(t+.45,m[(Math.random()*m.length)|0],.75,3.4);
    }
    musicNext+=MUSIC_STEP;musicStepN++;
  }
}
function musicUpdateVol(){
  if(AC&&musicGain)musicGain.gain.setTargetAtTime(volFor('music')*MUSIC_BASE,AC.currentTime,.15);
}
function musicStart(){
  musicWanted=true;
  if(musicOn||!AC)return;
  try{
    musicGain=AC.createGain();musicGain.gain.value=0;
    if(!musicVerb){
      const len=Math.floor(AC.sampleRate*2.2),ir=AC.createBuffer(2,len,AC.sampleRate);
      for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
      musicVerb=AC.createConvolver();musicVerb.buffer=ir;
    }
    const wet=AC.createGain();wet.gain.value=.55;
    musicGain.connect(AOUT);musicGain.connect(musicVerb);musicVerb.connect(wet);wet.connect(AOUT);
    musicOn=true;musicNext=AC.currentTime+.4;musicStepN=0;
    musicGain.gain.setTargetAtTime(volFor('music')*MUSIC_BASE,AC.currentTime,1.2);
    musicSchedule();musicTimer=setInterval(musicSchedule,400);
  }catch(e){musicOn=false;}
}
function musicStop(){
  musicWanted=false;
  if(!musicOn)return;
  musicOn=false;clearInterval(musicTimer);
  try{
    const g=musicGain;g.gain.setTargetAtTime(0,AC.currentTime,.25);
    setTimeout(()=>{try{g.disconnect();}catch(e){}},1500);
  }catch(e){}
  musicGain=null;
}
document.addEventListener('pointerdown',()=>{aud();if(musicWanted&&!musicOn&&!document.hidden)musicStart();},true);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){const w=musicWanted;musicStop();musicWanted=w;}
  else if(musicWanted){aud();musicStart();}
});
function heartbeat(){
  if(!AC)return;
  const vol=volFor('sfx');if(vol<=0)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';o.frequency.value=55;
    g.gain.setValueAtTime(.0001,AC.currentTime);
    g.gain.linearRampToValueAtTime(.14*vol,AC.currentTime+.02);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.22);
    o.connect(g);g.connect(AOUT);o.start();o.stop(AC.currentTime+.25);
    const o2=AC.createOscillator(),g2=AC.createGain();
    o2.type='sine';o2.frequency.value=50;
    g2.gain.setValueAtTime(.0001,AC.currentTime+.16);
    g2.gain.linearRampToValueAtTime(.1*vol,AC.currentTime+.18);
    g2.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.4);
    o2.connect(g2);g2.connect(AOUT);o2.start();o2.stop(AC.currentTime+.42);
  }catch(e){}
}
function startAmbient(){
  if(!AC||ambientSrc)return;
  try{
    const n=Math.floor(AC.sampleRate*3);
    const b=AC.createBuffer(1,n,AC.sampleRate);
    const d=b.getChannelData(0);
    let last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;d[i]=last*3.5;}
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
    s.buffer=b;s.loop=true;
    f.type='lowpass';f.frequency.value=350;f.Q.value=0.5;
    g.gain.value=0;
    s.connect(f);f.connect(g);g.connect(AOUT);
    s.start();
    ambientSrc=s;ambientGain=g;
  }catch(e){}
}
function setAmbient(target){
  if(!ambientGain||!AC)return;
  try{
    const final=target*volFor('amb')*0.35;
    ambientGain.gain.linearRampToValueAtTime(final,AC.currentTime+1.2);
  }catch(e){}
}
/* ===== Chuva =====
   Camadas: corpo (ruído rosa) + chiado agudo + rajadas lentas (LFO) + gotas esparsas com pan estéreo + trovão distante.
   O som SEMPRE segue o clima atual (antes só ligava quando o clima mudava: chuva já ativa no início/convidado ficava muda).
   Abafa dentro de prédios (gotas viram batidas no telhado) e no carro. */
const rainSt={on:false,muff:0,vol:-1,thunderT:20,dropAcc:0};
function startRain(){
  if(!AC||rainNoise)return;
  try{
    const sr=AC.sampleRate,n=Math.floor(sr*5),xf=Math.floor(sr*.4);
    const buf=AC.createBuffer(2,n,sr);
    for(let ch=0;ch<2;ch++){
      const d=buf.getChannelData(ch);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for(let i=0;i<n;i++){
        const w=Math.random()*2-1;
        b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;
        b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926;
      }
      for(let i=0;i<xf;i++){const k=i/xf;d[i]=d[i]*k+d[n-xf+i]*(1-k);}   // emenda sem estalo no loop
    }
    const loopEnd=(n-xf)/sr;
    const master=AC.createGain();master.gain.value=0;
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;
    lp.connect(master);master.connect(AOUT);
    // corpo da chuva
    const s1=AC.createBufferSource();s1.buffer=buf;s1.loop=true;s1.loopEnd=loopEnd;
    const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=170;
    const g1=AC.createGain();g1.gain.value=.85;
    s1.connect(hp);hp.connect(g1);g1.connect(lp);
    // chiado agudo
    const s2=AC.createBufferSource();s2.buffer=buf;s2.loop=true;s2.loopEnd=loopEnd;
    const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=4200;bp.Q.value=.6;
    const g2=AC.createGain();g2.gain.value=.3;
    s2.connect(bp);bp.connect(g2);g2.connect(lp);
    // rajadas lentas
    const lfo=AC.createOscillator(),lg=AC.createGain();
    lfo.type='sine';lfo.frequency.value=.12;lg.gain.value=.14;
    lfo.connect(lg);lg.connect(g1.gain);
    s1.start(0,0);s2.start(0,Math.random()*3);lfo.start();
    rainNoise={master:master,lp:lp,src:s1};
  }catch(e){}
}
function setRainMode(on,muff){   // muff: 0 ao ar livre (inclui veiculos abertos) · 1 no carro fechado · 2 dentro de prédio
  if(!AC)return;
  if(on&&!rainNoise)startRain();
  if(!rainNoise){rainSt.on=false;return;}
  const vol=volFor('rain');
  const g=on?.2*vol*(muff===2?.5:(muff===1?.55:1)):0;
  const f=muff===2?650:(muff===1?1500:7000);
  const t=AC.currentTime;
  try{
    rainNoise.master.gain.cancelScheduledValues(t);rainNoise.master.gain.setTargetAtTime(g,t,.45);
    rainNoise.lp.frequency.cancelScheduledValues(t);rainNoise.lp.frequency.setTargetAtTime(f,t,.3);
  }catch(e){}
  rainSt.on=on;rainSt.muff=muff;rainSt.vol=vol;
}
function setRain(on){ setRainMode(on,rainSt.muff); }
function rainDrop(){
  const vol=volFor('rain');if(vol<=0||!nbuf)return;
  try{
    const t=AC.currentTime,m=rainSt.muff;
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
    s.buffer=nbuf;s.loop=true;f.type='bandpass';f.Q.value=1.2;
    f.frequency.value=m===2?rnd(350,900):(m===1?rnd(1200,3500):rnd(2200,7000));
    const dur=m===2?.05:.025;
    gAtk(g.gain,rnd(.012,.04)*vol*(m===2?1.4:(m===1?.8:1)),t);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);
    if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=rnd(-.8,.8);g.connect(p);p.connect(AOUT);}
    else g.connect(AOUT);
    s.start(t,rnd(0,.2),dur+.01);
  }catch(e){}
}
function rainThunder(){
  const vol=volFor('rain');if(vol<=0||!nbuf)return;
  try{
    const t=AC.currentTime+rnd(0,.3),dur=rnd(2.2,3.6),m=rainSt.muff;
    for(let k=0;k<2;k++){
      const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
      s.buffer=nbuf;s.loop=true;f.type='lowpass';f.frequency.value=k?110:170;
      const t0=t+k*rnd(.35,.8);
      g.gain.setValueAtTime(.0001,t0);
      g.gain.linearRampToValueAtTime((k?.1:.16)*vol*(m===2?.7:1),t0+.25);
      g.gain.exponentialRampToValueAtTime(.0001,t0+dur*(k?1.2:1));
      s.connect(f);f.connect(g);g.connect(AOUT);
      s.start(t0);s.stop(t0+dur*1.25+.1);
    }
  }catch(e){}
}
/* Chamada todo frame de jogo: liga/desliga conforme o clima e o abrigo, e agenda gotas e trovão */
function syncRainAudio(dt){
  if(!AC||!P)return;
  const want=weather==='rain'&&state!=='menu';
  const muff=P.inside?2:(P.inVehicle&&vehKind(P.inVehicle)==='car'?1:0);   // so o carro fechado (cidade) abafa; moto de neve, quadriciclo e buggy sao abertos
  const vol=volFor('rain');
  if(want!==rainSt.on||muff!==rainSt.muff||vol!==rainSt.vol) setRainMode(want,muff);
  if(!rainSt.on||!rainNoise)return;
  const d=Math.min(dt,.1);
  rainSt.dropAcc+=d*(rainSt.muff===2?5:11);          // gotas por segundo
  while(rainSt.dropAcc>=1){rainSt.dropAcc-=1;rainDrop();}
  rainSt.thunderT-=d;
  if(rainSt.thunderT<=0){rainSt.thunderT=rnd(28,75);rainThunder();}
}
function buildSound(){
  if(!AC)return;
  const vol=volFor('sfx');if(vol<=0)return;
  try{
    for(let i=0;i<3;i++){
      const o=AC.createOscillator(),g=AC.createGain();
      o.type='triangle';
      const t=AC.currentTime+i*.08;
      o.frequency.setValueAtTime(200+i*80,t);
      o.frequency.exponentialRampToValueAtTime(400+i*100,t+.06);
      gAtk(g.gain,.08*vol,t);
      g.gain.exponentialRampToValueAtTime(.0001,t+.1);
      o.connect(g);g.connect(AOUT);
      o.start(t);o.stop(t+.12);
    }
  }catch(e){}
}

