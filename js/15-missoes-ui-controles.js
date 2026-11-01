/* ============ MISSOES (por partida, somadas entre os 2 jogadores) E CONQUISTAS (salvas no aparelho) ============ */
const MS_GROUPS=[['kill','killAnimal'],['get_wood','get_stone','get_cloth','fish'],['craft','dayAdv','campfire','cook','use_bandage']];
const MS_DEF={
  kill:{t:[5,8,12,16],txt:n=>'Elimine '+n+' zumbis'},
  killAnimal:{t:[2,3,4,5],txt:n=>'Cace '+n+' animais'},
  get_wood:{t:[6,10,14,18],txt:n=>'Colete '+n+' madeiras'},
  get_stone:{t:[4,6,9,12],txt:n=>'Colete '+n+' pedras'},
  get_cloth:{t:[3,5,7,9],txt:n=>'Colete '+n+' tecidos'},
  fish:{t:[2,3,4,5],txt:n=>'Pesque '+n+' peixes',ok:()=>mapHasLake()},
  craft:{t:[2,3,4,5],txt:n=>'Fabrique '+n+' itens'},
  dayAdv:{t:[1,1,2,2],txt:n=>'Sobreviva mais '+n+(n>1?' dias':' dia'),local:true},
  campfire:{t:[1,1,2,2],txt:n=>'Acenda '+n+(n>1?' fogueiras':' fogueira')},
  cook:{t:[2,3,4,5],txt:n=>'Cozinhe '+n+' alimentos'},
  use_bandage:{t:[1,2,2,3],txt:n=>'Use '+n+(n>1?' bandagens':' bandagem')}
};
function msRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
let MS=null;
/* Mesma semente nos dois aparelhos = mesma lista de missoes, sem precisar enviar a lista pela rede */
function msDef(i,k){
  const types=MS_GROUPS[i].filter(e=>!MS_DEF[e].ok||MS_DEF[e].ok());
  const r=msRng((MS.seed*31+i*977)>>>0)();
  const ev=types[(Math.floor(r*types.length)+k)%types.length],d=MS_DEF[ev];
  const tier=Math.min(k,3);
  let target=d.t[tier];if(k>3)target+=Math.ceil((k-3)*d.t[3]*.25);
  return {ev,target,text:d.txt(target)};
}
function missionsInit(){
  const seed=(MP.active&&Number.isFinite(MP.seed))?(MP.seed|0):((Math.random()*2147483647)|0);
  MS={seed:seed,slots:[{k:0,prog:0,done:false},{k:0,prog:0,done:false},{k:0,prog:0,done:false}]};
  achSet('maxDay',day||1);
  msRender();
}
function msRender(flashI){
  const el=document.getElementById('missions');if(!el)return;
  if(!MS){el.innerHTML='';return;}
  let h='';
  for(let i=0;i<3;i++){
    const s=MS.slots[i],d=msDef(i,s.k);
    h+='<div class="ms-row'+(s.done?' done':'')+(flashI===i?' flash':'')+'">'+(s.done?pxIcon('check',1):'')+'<span>'+d.text+'</span><b>'+s.prog+'/'+d.target+'</b></div>';
  }
  el.innerHTML=h;
  if(flashI!=null)setTimeout(()=>{const r=el.querySelectorAll('.ms-row')[flashI];if(r)r.classList.remove('flash');},350);
}
function msAdd(i,k,n){
  if(!MS)return;
  const s=MS.slots[i];if(!s||s.k!==k||s.done)return;
  const d=msDef(i,k);
  s.prog=Math.min(d.target,s.prog+n);
  if(s.prog>=d.target){
    s.done=true;
    toast('Missão concluída: '+d.text);
    achChime(true);
    achStat('missionDone',1);
    if(MP.active&&MP.connected)achStat('mpMission',1);
    setTimeout(()=>{if(MS&&MS.slots[i].k===k){MS.slots[i]={k:k+1,prog:0,done:false};msRender();}},3500);
  }
  msRender(i);
}
/* registra um acontecimento: soma nas missoes ativas (e avisa o parceiro) e nas estatisticas das conquistas */
function track(ev,n){
  n=n||1;
  try{achStat(ev,n);}catch(e){}
  if(!MS)return;
  for(let i=0;i<3;i++){
    const s=MS.slots[i];if(s.done)continue;
    const d=msDef(i,s.k);if(d.ev!==ev)continue;
    msAdd(i,s.k,n);
    if(MP.active&&MP.connected&&!MS_DEF[ev].local)sendEvt('mission',{i:i,k:s.k,n:n});
  }
}
function dayToast(){
  const nw=ZUNLOCK.filter(u=>u[1]===day).map(u=>u[3]);
  return 'Dia '+day+': perigo '+dangerName(day)+(nw.length?'. Novo: '+nw.join(' e '):'');
}
function dayAdvanced(n){track('dayAdv',n);achSet('maxDay',day);}

/* ---- Conquistas ---- */
const ACH=[
  ['first_blood','Primeiro Sangue','Elimine um zumbi','kill',1],
  ['hunter50','Caçador de Zumbis','Elimine 50 zumbis','kill',50],
  ['hunter250','Exterminador','Elimine 250 zumbis','kill',250],
  ['boss','Queda do Chefe','Derrote um zumbi Chefe','boss',1],
  ['day3','Sobrevivente','Chegue ao dia 3','maxDay',3],
  ['day7','Veterano','Chegue ao dia 7','maxDay',7],
  ['day15','Lenda','Chegue ao dia 15','maxDay',15],
  ['fish5','Pescador','Pesque 5 peixes','fish',5],
  ['fish25','Mestre da Pesca','Pesque 25 peixes','fish',25],
  ['hunt5','Caçador','Cace 5 animais','killAnimal',5],
  ['wood50','Lenhador','Colete 50 madeiras','get_wood',50],
  ['fire','Fogo Aceso','Acenda uma fogueira','campfire',1],
  ['cook10','Chef de Sobrevivência','Cozinhe 10 alimentos','cook',10],
  ['aid5','Primeiros Socorros','Fabrique 5 bandagens','craft_bandage',5],
  ['craft20','Artesão','Fabrique 20 itens','craft',20],
  ['mission5','Cumpridor','Complete 5 missões','missionDone',5],
  ['mission25','Incansável','Complete 25 missões','missionDone',25],
  ['temple','Saqueador de Tumbas','Abra o baú do Templo Enterrado','temple',1],
  ['expedition','Expedicionário','Abra o baú da Expedição perdida','expedition',1],
  ['duo','Dupla Perfeita','Complete 3 missões no multiplayer','mpMission',3]
];
let ACHD={u:{},s:{}};
try{const raw=localStorage.getItem('minisurv_ach');if(raw){const o=JSON.parse(raw);if(o&&typeof o==='object'){ACHD.u=o.u&&typeof o.u==='object'?o.u:{};ACHD.s=o.s&&typeof o.s==='object'?o.s:{};}}}catch(e){}
function achSave(){try{localStorage.setItem('minisurv_ach',JSON.stringify(ACHD));}catch(e){}}
function achChime(small){
  try{
    aud();
    const f=small?[392,523]:[392,494,587];
    f.forEach((hz,i)=>setTimeout(()=>beep(hz,.22,'sine',.07),i*110));
  }catch(e){}
}
function achCheck(stat){
  for(const a of ACH){
    if(a[3]!==stat||ACHD.u[a[0]])continue;
    if((ACHD.s[stat]||0)>=a[4]){
      ACHD.u[a[0]]=1;achSave();
      setTimeout(()=>{toast('Conquista: '+a[1]);achChime(false);},400);
    }
  }
}
function achStat(stat,n){
  ACHD.s[stat]=(ACHD.s[stat]||0)+(n||1);
  achSave();achCheck(stat);
}
function achSet(stat,v){
  if(!(v>(ACHD.s[stat]||0)))return;
  ACHD.s[stat]=v;achSave();achCheck(stat);
}
/* ---- Estatisticas de todas as partidas (guardadas junto das conquistas) ---- */
let _statAcc=0,_statPx=null,_statPy=null,_statSaveT=0;
function statTick(dt){
  if(!P||P.dead)return;
  ACHD.s.playSec=(ACHD.s.playSec||0)+dt;
  if(_statPx!==null){const d=Math.hypot(P.x-_statPx,P.y-_statPy);if(d<60)ACHD.s.dist=(ACHD.s.dist||0)+d;}  // ignora teleportes (respawn, carregar save)
  _statPx=P.x;_statPy=P.y;
  _statSaveT+=dt;if(_statSaveT>15){_statSaveT=0;achSave();}
}
function statBump(k){ACHD.s[k]=(ACHD.s[k]||0)+1;achSave();_statPx=null;}
function fmtDur(sec){sec=Math.floor(sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h>0?h+'h '+m+'min':m+'min '+(sec%60)+'s';}
function renderStats(){
  const el=document.getElementById('achStats');if(!el)return;
  const s=ACHD.s,best=Math.max(+(LSget()||0),0);
  const rows=[
    [s.games||0,'Partidas'],[s.deaths||0,'Mortes'],[fmtDur(s.playSec||0),'Tempo jogado'],
    [fmtDur(best),'Maior sobrevivência'],['Dia '+(s.maxDay||0),'Maior dia'],[Math.round((s.dist||0)/50)+' m','Distância a pé'],
    [s.kill||0,'Zumbis mortos'],[s.killAnimal||0,'Animais caçados'],[s.fish||0,'Peixes pescados'],
    [s.get_wood||0,'Madeira coletada'],[s.cook||0,'Alimentos cozidos'],[s.craft||0,'Itens fabricados']
  ];
  el.innerHTML=rows.map(r=>'<div><b>'+r[0]+'</b><span>'+r[1]+'</span></div>').join('');
}
function renderAch(){
  try{renderStats();}catch(e){}
  const list=document.getElementById('achList'),sum=document.getElementById('achSum');if(!list)return;
  let got=0,h='';
  for(const a of ACH){
    const on=!!ACHD.u[a[0]];if(on)got++;
    const cur=Math.min(a[4],ACHD.s[a[3]]||0),pct=Math.round(cur/a[4]*100);
    h+='<div class="ach-row'+(on?' on':'')+'"><div class="ic">'+pxIcon(on?'trophy':'lock',2)+'</div><div class="tx"><div class="nm">'+a[1]+'</div><div class="ds">'+a[2]+'</div>'+
       (on?'<div class="cnt">CONCLUÍDA</div>':'<div class="bar"><i style="width:'+pct+'%"></i></div><div class="cnt">'+cur+'/'+a[4]+'</div>')+'</div></div>';
  }
  list.innerHTML=h;
  if(sum)sum.textContent=got+' / '+ACH.length+' DESBLOQUEADAS';
}

/* ============ UI ============ */
function showScreen(id){
  if(id==='menu') try{refreshContinue();}catch(e){}
  const ids=['menu','invscr','mapscreen','slotscreen','skinscreen','achscreen','mpscreen','mphostscreen','mpjoinscreen','configscreen','craftscr','pausescr','deadscr'];
  for(const s of ids){const e=$(s);if(e)e.classList.add('hide');}
  if(id){const e=$(id);if(e)e.classList.remove('hide');}
  try{
    const wantMusic=['menu','mapscreen','slotscreen','skinscreen','achscreen','mpscreen','mphostscreen','mpjoinscreen'].includes(id)||(id==='configscreen'&&state!=='pause');
    if(wantMusic)musicStart();else musicStop();
  }catch(e){}
}
document.querySelectorAll('.map-opt[data-map]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.map-opt[data-map]').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMap=btn.getAttribute('data-map')||'forest';
  });
});
document.querySelectorAll('.map-opt[data-mp-map]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.map-opt[data-mp-map]').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    mpSelectedMap=btn.getAttribute('data-mp-map')||'forest';
  });
});
function bindSlider(id,key,labelId){
  const el=$(id),lab=$(labelId);if(!el||!lab)return;
  el.value=Math.round(CFG[key]*100);lab.textContent=el.value+'%';
  el.addEventListener('input',()=>{
    CFG[key]=+el.value/100;lab.textContent=el.value+'%';saveCfg();aud();try{musicUpdateVol();}catch(e){}
  });
}
function bindToggle(id,key){
  const el=$(id);if(!el)return;
  el.classList.toggle('on',!!CFG[key]);
  el.addEventListener('click',()=>{
    CFG[key]=!CFG[key];el.classList.toggle('on',CFG[key]);saveCfg();
    if(key==='hud'||key==='minimap') applyHudClasses();
  });
}
bindSlider('cfg_master','master','v_master');
bindSlider('cfg_sfx','sfx','v_sfx');
bindSlider('cfg_amb','amb','v_amb');
bindSlider('cfg_rain','rain','v_rain');
bindSlider('cfg_step','step','v_step');
bindSlider('cfg_music','music','v_music');
bindToggle('cfg_hud','hud');
bindToggle('cfg_minimap','minimap');
bindToggle('cfg_autoperf','autoperf');
function bindSeg(id,key){
  const el=$(id);if(!el)return;
  const paint=()=>el.querySelectorAll('button').forEach(b=>b.classList.toggle('sel',+b.dataset.v===+CFG[key]));
  paint();
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    CFG[key]=+b.dataset.v;CFG.autolvl=0;AUTO.warm=3;AUTO.slowT=0;AUTO.fastT=0;saveCfg();paint();resize();
  }));
  el._paint=paint;
}
bindSeg('cfg_quality','quality');
bindSeg('cfg_fps','fps');
// Reaplica canvas ao mudar perf
['cfg_autoperf'].forEach(id=>{
  const el=$(id); if(!el) return;
  el.addEventListener('click',()=>{ CFG.autolvl=0;AUTO.warm=3;AUTO.slowT=0;AUTO.fastT=0;saveCfg();resize(); });
});

on('btnReset','click',()=>{
  CFG.master=0.8;CFG.sfx=1.0;CFG.amb=0.6;CFG.rain=0.7;CFG.step=0.8;
  CFG.hud=true;CFG.minimap=true;CFG.dmgflash=true;CFG.screenflash=true;CFG.fullscreen=true;CFG.tracers=true;
  CFG.quality=0;CFG.fps=60;CFG.autoperf=true;CFG.autolvl=0;
  saveCfg();
  const vals={cfg_master:80,cfg_sfx:100,cfg_amb:60,cfg_rain:70,cfg_step:80};
  for(const id in vals){const e=$(id);if(e)e.value=vals[id];const lab=$('v_'+id.split('_')[1]);if(lab)lab.textContent=vals[id]+'%';}
  document.querySelectorAll('.cfg-toggle').forEach(t=>{
    t.classList.add('on');
  });
  ['cfg_quality','cfg_fps'].forEach(id=>{const e=$(id);if(e&&e._paint)e._paint();});
  applyHudClasses();
  resize();
  toast('Configurações restauradas');
});

/* ===== Tela de slots (4 saves): JOGAR escolhe onde criar o novo jogo, CONTINUAR escolhe qual save abrir ===== */
let slotMode='new', slotAsk=null;
function slotDateStr(at){
  if(!at) return '';
  try{const d=new Date(at);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}catch(e){return '';}
}
function renderSlots(){
  const g=$('slotGrid'); if(!g) return;
  g.innerHTML='';
  let any=false;
  for(let n=1;n<=SAVE_SLOTS;n++){
    const d=readSave0(n); if(d) any=true;
    const w=document.createElement('div'); w.className='sv-slot'+(d?'':' empty');
    const b=document.createElement('button'); b.className='sv-main'; b.type='button';
    if(d){
      const cv=document.createElement('canvas'); cv.width=16; cv.height=26; b.appendChild(cv);
      try{drawSkinPreview(cv,SKIN_SEL);}catch(e){}
    }
    const tx=document.createElement('span'); tx.className='sv-txt';
    const add=(t,c,tag)=>{const e=document.createElement(tag||'i');if(c)e.className=c;e.textContent=t;tx.appendChild(e);};
    add('SLOT '+n,'','b');
    if(d){
      add(MAP_NAMES[d.map]);
      add('DIA '+d.day+' · '+(d.kills|0)+' ABATES');
      add(slotDateStr(d.at),'dim');
      if(slotMode==='new') add('SUBSTITUIR','tag');
    } else {
      add(slotMode==='new'?'VAZIO':'SEM SAVE','dim');
      if(slotMode==='new') add('NOVO JOGO','tag');
    }
    b.appendChild(tx);
    if(slotMode==='load'&&!d) b.disabled=true;
    b.addEventListener('click',()=>{aud();pickSlot(n);});
    w.appendChild(b);
    const del=document.createElement('button'); del.className='sv-del'+(d?'':' off'); del.type='button'; del.textContent='APAGAR';
    if(d) del.addEventListener('click',e=>{e.stopPropagation();aud();askSlot('del',n);});
    w.appendChild(del);
    g.appendChild(w);
  }
  const t=$('slotTitle'),h=$('slotHint');
  if(t) t.textContent=slotMode==='new'?'NOVO JOGO':'CONTINUAR';
  if(h) h.textContent=slotMode==='new'?'Escolha um slot. Um slot ocupado pode ser substituído.':(any?'Escolha qual save abrir.':'Você ainda não tem nenhum jogo salvo.');
}
function openSlots(mode){slotMode=mode;closeSlotAsk();renderSlots();showScreen('slotscreen');}
function pickSlot(n){
  const d=readSave0(n);
  if(slotMode==='load'){ if(d)loadingRun(()=>continueGame(n),'CARREGANDO O JOGO...'); else renderSlots(); return; }
  if(d) askSlot('replace',n); else goMapForSlot(n);
}
function goMapForSlot(n){
  pendingSlot=n;
  const d=readSave0(n),w=$('saveWarn');
  if(w){w.textContent=d?'SLOT '+n+': o save atual será substituído ao iniciar.':'SLOT '+n+': novo jogo.';w.classList.remove('hide');}
  showScreen('mapscreen');
}
function askSlot(kind,n){
  const d=readSave0(n); slotAsk={kind:kind,n:n};
  const t=$('slotConfirmTxt'),c=$('slotConfirm'),y=$('slotYes');
  if(t)t.textContent=kind==='del'
    ?'Apagar o SLOT '+n+(d?' ('+MAP_NAMES[d.map]+', dia '+d.day+')':'')+'? Isso não pode ser desfeito.'
    :'Substituir o SLOT '+n+(d?' ('+MAP_NAMES[d.map]+', dia '+d.day+')':'')+'? O progresso dele será perdido quando a nova partida começar.';
  if(y)y.textContent=kind==='del'?'APAGAR':'SUBSTITUIR';
  if(c)c.classList.remove('hide');
}
function closeSlotAsk(){slotAsk=null;const c=$('slotConfirm');if(c)c.classList.add('hide');}
on('slotYes','click',()=>{
  aud();const a=slotAsk; closeSlotAsk(); if(!a)return;
  if(a.kind==='del'){ clearSave(a.n); renderSlots(); } else goMapForSlot(a.n);
});
on('slotNo','click',()=>{aud();closeSlotAsk();});
on('btnBackSlot','click',()=>{aud();closeSlotAsk();showScreen('menu');});
on('btnPlay','click',()=>{aud();openSlots('new');});
on('btnContinue','click',()=>{aud();openSlots('load');});
window.addEventListener('pagehide',()=>{saveGame();});
on('btnMulti','click',()=>{aud();showScreen('mpscreen');});
on('btnSkins','click',()=>{aud();showScreen('skinscreen');});
on('btnBackSkins','click',()=>showScreen('menu'));
document.querySelectorAll('.map-opt[data-skin]').forEach(btn=>{
  const i=+btn.getAttribute('data-skin');
  const cv=btn.querySelector('canvas');if(cv)drawSkinPreview(cv,i);
  btn.classList.toggle('selected',i===SKIN_SEL);
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.map-opt[data-skin]').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    SKIN_SEL=i;
    try{localStorage.setItem('minisurv_skin',String(i));}catch(e){}
  });
});
on('btnAch','click',()=>{aud();renderAch();showScreen('achscreen');});
on('btnBackAch','click',()=>showScreen('menu'));
on('btnConfig','click',()=>{aud();showScreen('configscreen');});
on('btnBackMap','click',()=>openSlots('new'));
on('btnStart','click',()=>loadingRun(()=>startGame(),'GERANDO O MUNDO...'));

on('btnMPBack','click',()=>showScreen('menu'));
on('btnMPHost','click',()=>{aud();showScreen('mphostscreen');const w=$('hostCodeWrap');if(w)w.classList.add('hide');setStatus('hostStatus','');});
on('btnMPJoin','click',()=>{aud();showScreen('mpjoinscreen');setStatus('joinStatus','');const i=$('joinCode');if(i)i.value='';});

on('btnHostCreate','click',()=>{aud();mpHostStart();});
on('btnCopyCode','click',async e=>{
  e.preventDefault();e.stopPropagation();
  aud();
  const codeEl=$('hostCode');
  const code=(codeEl&&codeEl.textContent||'').trim().toUpperCase();
  if(!code || code==='------' || code.length<4){
    setStatus('hostStatus','Crie a sala primeiro para copiar o código',true);
    return;
  }
  const btn=$('btnCopyCode');
  const ok=()=>{
    if(btn){btn.textContent='COPIADO!';setTimeout(()=>{if(btn)btn.textContent='COPIAR CÓDIGO';},1800);}
    setStatus('hostStatus','Código '+code+' copiado!');
    toast('Código copiado: '+code);
  };
  const fail=()=>{
    // Fallback: select text so user can copy manually
    try{
      const range=document.createRange();range.selectNodeContents(codeEl);
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
    }catch(_){}
    if(btn){btn.textContent='SELECIONE E COPIE';setTimeout(()=>{if(btn)btn.textContent='COPIAR CÓDIGO';},2500);}
    setStatus('hostStatus','Selecione o código e copie (Ctrl+C / pressione e segure)');
  };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(code);
      ok();
    } else {
      // Older Android WebView fallback
      const ta=document.createElement('textarea');
      ta.value=code;ta.style.position='fixed';ta.style.left='-9999px';
      document.body.appendChild(ta);ta.select();
      const done=document.execCommand('copy');
      document.body.removeChild(ta);
      if(done) ok(); else fail();
    }
  }catch(err){ fail(); }
});
on('btnHostBack','click',()=>{
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null;MP.conn=null;MP.active=false;MP.connected=false;MP.isHost=false;
  showScreen('mpscreen');
});

on('btnJoinConnect','click',()=>{
  aud();
  const inp=$('joinCode');if(!inp)return;
  const code=inp.value.trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){setStatus('joinStatus','Código inválido (6 caracteres)',true);return;}
  mpJoinStart(code);
});
on('btnJoinBack','click',()=>{
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null;MP.conn=null;MP.active=false;MP.connected=false;MP.isHost=false;
  showScreen('mpscreen');
});
on('joinCode','input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
on('joinCode','keydown',e=>{if(e.key==='Enter')$('btnJoinConnect').click();});
on('hostName','input',e=>{e.target.value=e.target.value.slice(0,12);});
on('joinName','input',e=>{e.target.value=e.target.value.slice(0,12);});

on('btnBackCfg','click',()=>{if(state==='pause')showScreen('pausescr');else showScreen('menu');});
on('pauseCfg','click',e=>{
  if(performance.now()<pauseReadyAt){e.preventDefault();e.stopPropagation();return;}
  showScreen('configscreen');
});
on('deadMenu','click',()=>{ quitToMenu(); });
on('craftclose','click',closeCraft);
/* ============ TELA DO INVENTÁRIO ============ */
let invSel=0;
const IDESC={
  hoe:'Enxada. Equipe e use ARAR para preparar um canteiro. Também serve como arma fraca.',potato:'Batata crua. Recupera 8 de fome, melhor assar na fogueira.',bakedpotato:'Batata assada. Recupera 28 de fome e 2 de vida.',melon:'Melancia. Recupera 10 de fome e 22 de sede.',seed_potato:'Sementes de batata. Vingam na floresta e na cidade (e em qualquer lugar numa estufa).',seed_melon:'Sementes de melancia. Só vingam no deserto (ou numa estufa).',seed_corn:'Sementes de milho. Plante em um canteiro arado e regue de vez em quando.',
  food:'Feijão enlatado. Recupera 35 de fome.',water:'Garrafa de água. Recupera 40 de sede.',fish:'Peixe cru. Recupera 30 de fome, melhor assar na fogueira.',
  cookedfish:'Peixe assado. Recupera 55 de fome e 5 de vida.',meat:'Carne crua. Recupera 25 de fome, melhor assar na fogueira.',cookedmeat:'Carne assada. Recupera 60 de fome e 8 de vida.',turban:'Turbante do templo. Vestido, reduz o calor do deserto em cerca de um terço.',corn:'Milho do milharal. Recupera 14 de fome. Segure na mão perto da fogueira para assar.',cookedcorn:'Milho assado. Recupera 32 de fome e 3 de vida.',
  wood:'Material de crafting. Abra o crafting para usar.',stone:'Material de crafting. Abra o crafting para usar.',cloth:'Tecido. Usado para fabricar bandagem e mochila.',
  bandage:'Estanca sangramento e recupera 10 de vida.',medkit:'Kit médico. Recupera 50 de vida e estanca sangramento.'
};
function invIsOpen(){const e=$('invscr');return !!e&&!e.classList.contains('hide');}
function updatePackBadge(){
  if(!P)return;
  const n=P.inv.length,cap=invCap(),b=$('bpackn'),bt=$('bpack');
  if(b)b.textContent=n+'/'+cap;
  if(bt){bt.classList.toggle('full',n>=cap);bt.classList.toggle('nopack',!P.pack);bt.classList.toggle('nobp',!P.pack);}   // o ícone da mochila só existe depois de ter uma mochila
}
function openInv(){
  if(state!=='play'||!P||P.dead)return;
  state='craft';craftReadyAt=performance.now()+300;
  const e=$('invscr');if(e)e.classList.remove('hide');
  if(!P.inv[invSel])invSel=P.inv.length?0:-1;
  refreshInvScr();
}
/* arrastar para reorganizar: soltar em outro item troca os dois; soltar em espaço vazio manda para o fim da lista */
let invDragEnd=0;
function invDragStart(e,from,btn){
  if(e.button>0)return;
  const sx=e.clientX,sy=e.clientY,id=e.pointerId;let ghost=null,over=null;
  const slotAt=(x,y)=>{const t=document.elementFromPoint(x,y);const b=t&&t.closest?t.closest('.islot'):null;return b&&!b.classList.contains('lock')?b:null;};
  const mv=ev=>{
    if(ev.pointerId!==id)return;
    if(!ghost){
      if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;
      ghost=btn.cloneNode(true);ghost.style.cssText='position:fixed;z-index:99999;pointer-events:none;opacity:.85;width:'+btn.offsetWidth+'px;height:'+btn.offsetHeight+'px;transform:scale(1.1)';
      document.body.appendChild(ghost);btn.style.opacity='.35';
    }
    ghost.style.left=(ev.clientX-btn.offsetWidth/2)+'px';ghost.style.top=(ev.clientY-btn.offsetHeight/2)+'px';
    const o=slotAt(ev.clientX,ev.clientY);
    if(o!==over){if(over)over.style.outline='';over=o;if(over&&over!==btn)over.style.outline='2px solid #ffd84a';}
    ev.preventDefault();
  };
  const up=ev=>{
    if(ev.pointerId!==id)return;
    window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
    if(over)over.style.outline='';
    if(!ghost)return;
    ghost.remove();invDragEnd=performance.now()+250;
    const o=ev.type==='pointercancel'?null:slotAt(ev.clientX,ev.clientY);
    if(o&&P&&P.inv[from]){
      const to=+o.dataset.i;
      if(to!==from){
        const it=P.inv[from];
        if(to<P.inv.length){P.inv[from]=P.inv[to];P.inv[to]=it;invSel=to;}
        else{P.inv.splice(from,1);P.inv.push(it);invSel=P.inv.length-1;}
        aud();uiTap();try{buildInv();}catch(err){}
      }
    }
    refreshInvScr();
  };
  window.addEventListener('pointermove',mv,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
}
function refreshInvScr(){
  if(!P)return;
  const cap=invCap(),n=P.inv.length;
  const capEl=$('invcap');if(capEl)capEl.textContent=n+'/'+cap;
  const tag=$('invtag');if(tag){tag.textContent=P.pack?'MOCHILA EQUIPADA':'SEM MOCHILA';tag.classList.toggle('no',!P.pack);}
  if(invSel>=n)invSel=n-1;
  const g=$('invgrid');if(!g)return;g.innerHTML='';
  for(let i=0;i<PACK_SLOTS;i++){
    const b=document.createElement('button');b.className='islot';
    if(i<MAX_SLOTS){b.classList.add('qb');}
    const locked=i>=cap;
    if(locked){b.classList.add('lock');b.innerHTML=pxIcon('lock',2);b.disabled=true;}
    else{
      const sl=P.inv[i];
      if(i<MAX_SLOTS)b.insertAdjacentHTML('beforeend','<span class="snum">'+(i+1)+'</span>');
      if(sl){
        b.insertAdjacentHTML('beforeend',pxFit(ITEMS[sl.t].e,32,28));
        if(sl.n>1)b.insertAdjacentHTML('beforeend','<span class="scnt">'+sl.n+'</span>');
        b.setAttribute('aria-label',ITEMS[sl.t].n);
      }
      if(i===invSel)b.classList.add('sel');
      if(sl&&P.hold&&sl.t===P.hold)b.classList.add('held');
      b.dataset.i=i;
      b.addEventListener('click',()=>{if(performance.now()<invDragEnd)return;aud();uiTap();invSel=sl?i:invSel;refreshInvScr();});
      if(sl)b.addEventListener('pointerdown',e=>invDragStart(e,i,b));
    }
    g.appendChild(b);
  }
  // arma e munição
  const eq=$('inveq');
  if(eq){
    const wk=P.weapon,w=WEAPONS[wk];
    const ammo=w&&w.bow?(P.arrows||0):(w&&w.firearm?P.ammo:null);
    const gear=(P.turban?'<span>VESTE</span><b>Turbante</b>':'');
    eq.innerHTML=gear+'<span>ARMA</span>'+(w?pxFit(WEAPON_ICON[wk]||wk,22,18):'')+'<b>'+(w?w.n:'Mãos')+'</b>'+(ammo!==null?'<span>'+(w&&w.bow?'FLECHAS':'MUNIÇÃO')+'</span><b>'+ammo+'</b>':'');
  }
  // detalhes
  const d=$('invdet');if(!d)return;
  const sl=P.inv[invSel];
  if(!sl){
    d.innerHTML='<div class="empty">'+(n?'Toque em um item para ver os detalhes.':'Nada por aqui ainda.')+'</div>'+
      (P.pack?'':'<div class="ds">Ache uma mochila nas casas ou fabrique uma (6 tecidos e 3 madeiras) para carregar 12 itens.</div>');
    return;
  }
  const it=ITEMS[sl.t];
  const usable=isFishItem(sl.t)||['food','water','cookedfish','meat','cookedmeat','corn','cookedcorn','potato','bakedpotato','melon','bandage','medkit'].includes(sl.t);
  d.innerHTML='<div class="ico">'+pxFit(it.e,48,44)+'</div><div class="nm">'+it.n.toUpperCase()+'</div><div class="qt">x'+sl.n+'</div><div class="ds">'+(IDESC[sl.t]||(FISH[it.fish]?'Peixe cru. Recupera '+FISH[it.fish].food+' de fome, melhor assar na fogueira (rende '+FISH[it.fish].yield+' '+(FISH[it.fish].yield>1?'porções':'porção')+').':''))+'</div>'+
    '<div class="ibtns"><button class="ibtn use" id="ibUse"'+(usable?'':' disabled')+'>'+(EATABLE(sl.t)?(P.hold===sl.t?'GUARDAR':'SEGURAR'):'USAR')+'</button><button class="ibtn" id="ibDrop">SOLTAR</button>'+(sl.n>1?'<button class="ibtn" id="ibAll">TUDO</button>':'')+'</div>';
  const ok=()=>performance.now()>=craftReadyAt;
  const bu=$('ibUse'),bd=$('ibDrop'),ba=$('ibAll');
  if(bu)bu.onclick=()=>{if(!ok())return;aud();const _sl=P.inv[invSel],_seg=!!(_sl&&EATABLE(_sl.t)&&P.hold!==_sl.t);useItem(invSel);if(_seg&&P.hold===_sl.t)closeCraft();}; // SEGURAR fecha a mochila; GUARDAR e USAR mantêm aberta
  if(bd)bd.onclick=()=>{if(!ok())return;aud();discardItem(invSel);};
  if(ba)ba.onclick=()=>{if(!ok())return;aud();const k=invSel,c=P.inv[k]?P.inv[k].n:0;for(let q=0;q<c&&q<40;q++)discardItem(k);};
}
on('bpack','click',e=>{e.preventDefault();aud();uiTap();openInv();});
on('invclose','click',()=>{uiTap();closeCraft();});


/* ============ CONTROLES ============ */
cv.addEventListener('pointerdown',e=>{
  aud();
  tryFullscreenFromGesture(); // MP: fullscreen só após gesto real do jogador
  if(state!=='play'||!P||P.inVehicle)return;
  e.preventDefault();
  const p=toCanvasXY(e);
  {const hit=MP.active?pingBadgeHit(p):null;if(hit){sendPing(hit);return;}}   // toque no botão do item: marca e NÃO inicia o joystick
  if(joy.id===null&&e.clientX<(dispW||W)*.58){
    joy.id=e.pointerId;joy.ox=joy.px=p.x;joy.oy=joy.py=p.y;joy.x=joy.y=0;joy.active=true;
    try{cv.setPointerCapture(e.pointerId);}catch(err){}
  }
});
cv.addEventListener('pointermove',e=>{
  if(e.pointerId!==joy.id)return;
  const p=toCanvasXY(e);
  const dx=p.x-joy.ox,dy=p.y-joy.oy,d=Math.hypot(dx,dy),m=Math.min(d,JR);
  joy.px=joy.ox+(d?dx/d*m:0);joy.py=joy.oy+(d?dy/d*m:0);
  const f=Math.min(1,d/JR);
  joy.x=d?dx/d*f:0;joy.y=d?dy/d*f:0;
});
function joyEnd(e){if(e.pointerId===joy.id){joy.id=null;joy.active=false;joy.x=joy.y=0;}}
cv.addEventListener('pointerup',joyEnd);
cv.addEventListener('pointercancel',joyEnd);

function holdBtn(id,down,up){
  const b=$(id);if(!b)return;
  b.addEventListener('pointerdown',e=>{e.preventDefault();aud();tryFullscreenFromGesture();b.classList.add('on');down();});
  const end=()=>{b.classList.remove('on');if(up)up();};
  b.addEventListener('pointerup',end);
  b.addEventListener('pointercancel',end);
  b.addEventListener('pointerleave',end);
}
holdBtn('atk',()=>{atkHeld=true;attack();},()=>{atkHeld=false;});
holdBtn('run',()=>{sprintHeld=true;},()=>{sprintHeld=false;});
holdBtn('pick',()=>pickup());
const swapBtn=$('swap');
let swapPressTimer=null,swapPressActive=false,swapLongTriggered=false,swapPressPointer=null;
function cancelSwapPress(){
  if(swapPressTimer!==null){clearTimeout(swapPressTimer);swapPressTimer=null;}
  swapPressActive=false;swapLongTriggered=false;swapPressPointer=null;
  if(swapBtn)swapBtn.classList.remove('on');
}
function endSwapPress(e){
  if(!swapPressActive||(swapPressPointer!==null&&e?.pointerId!==undefined&&e.pointerId!==swapPressPointer))return;
  if(swapPressTimer!==null){clearTimeout(swapPressTimer);swapPressTimer=null;}
  const wasLong=swapLongTriggered;
  cancelSwapPress();
  if(!wasLong&&state==='play'&&P&&!P.inVehicle)cycleWeapon();
}
if(swapBtn){
  swapBtn.addEventListener('pointerdown',e=>{
    if(state!=='play'||!P||P.inVehicle)return;
    e.preventDefault();e.stopPropagation();aud();
    if(swapPressActive)return;
    swapPressActive=true;swapLongTriggered=false;swapPressPointer=e.pointerId;swapBtn.classList.add('on');
    swapPressTimer=setTimeout(()=>{
      if(!swapPressActive||swapPressPointer!==e.pointerId)return;
      swapPressTimer=null;swapLongTriggered=true;openWeaponWheel();
    },420);
  });
  swapBtn.addEventListener('pointercancel',()=>cancelSwapPress());
}
document.addEventListener('pointerup',endSwapPress);
document.addEventListener('pointercancel',()=>{if(swapPressActive)cancelSwapPress();});
const weaponWheelRoot=$('weapon-wheel');
if(weaponWheelRoot){
  // Ignore the finger-up that opened the wheel (prevents instant close)
  weaponWheelRoot.addEventListener('pointerup',e=>{
    if(e.target!==weaponWheelRoot) return;
    if(performance.now()-weaponWheelOpenedAt<450) return;
    closeWeaponWheel();
  });
  weaponWheelRoot.addEventListener('click',e=>{
    if(e.target!==weaponWheelRoot) return;
    if(performance.now()-weaponWheelOpenedAt<450) return;
    closeWeaponWheel();
  });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&weaponWheelOpen)closeWeaponWheel();});
const craftTabs=$('craft-tabs');if(craftTabs)craftTabs.addEventListener('click',e=>{const b=e.target.closest('[data-craft-filter]');if(!b)return;craftFilter=b.dataset.craftFilter;refreshCraft();});

function vehBtn(id,downVal,upVal){
  const b=$(id);if(!b)return;
  const dn=e=>{e.preventDefault();aud();b.classList.add('on');downVal();};
  const up=e=>{e.preventDefault();b.classList.remove('on');upVal();};
  b.addEventListener('pointerdown',dn);
  b.addEventListener('pointerup',up);
  b.addEventListener('pointercancel',up);
  b.addEventListener('pointerleave',up);
}
vehBtn('v-up',()=>touchGas=1,()=>touchGas=0);
vehBtn('v-down',()=>touchGas=-1,()=>touchGas=0);
vehBtn('v-left',()=>touchSteer=-1,()=>touchSteer=0);
vehBtn('v-right',()=>touchSteer=1,()=>touchSteer=0);
vehBtn('v-exit',()=>exitVehicle(),()=>{});

window.addEventListener('keyup',e=>{if(e.code==='Space')reelKey=false;});
window.addEventListener('keydown',e=>{
  // Chat open: only handle Enter/Escape for chat, don't steal game keys
  if(chatOpen){
    if(e.code==='Escape'){ e.preventDefault(); closeChat(); return; }
    if(e.code==='Enter'){ e.preventDefault(); sendChatMessage(); return; }
    return;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code))e.preventDefault();
  if(e.code==='KeyM'){ if(bigOpen)bigMapClose(); else bigMapOpen(); return; }
  if(bigOpen){ if(e.code==='Escape')bigMapClose(); return; }
  if((e.code==='KeyC'||e.code==='KeyI')&&state==='craft'){closeCraft();return;}
  if(e.code==='Escape'){
    if(weaponWheelOpen){closeWeaponWheel();return;}
    if(state==='craft'){closeCraft();return;}
    if(state==='play'){pause();return;}
    if(state==='pause'){resume();return;}
  }
  if(state!=='play')return;
  if(e.code==='Space'){reelKey=true;attack();}
  if(e.code==='KeyE')pickup();
  if(e.code==='KeyQ')cycleWeapon();
  if(e.code==='KeyC')openCraft();
  if(e.code==='KeyI')openInv();
  if(e.code==='KeyR'){if(P.inv.length>0)discardItem(P.inv.length-1);else toast('Inventário vazio');}
  if(e.code>='Digit1'&&e.code<='Digit6')useItem(+e.code.slice(5)-1);
  if(e.code==='KeyT'&&MP.active){ e.preventDefault(); openChat(); }
});
on('bchat','pointerup',e=>{e.preventDefault();e.stopPropagation();aud(); if(chatOpen) closeChat(); else openChat();});
on('bchat','pointerdown',e=>{e.preventDefault();e.stopPropagation();});
on('chat-send','click',e=>{e.preventDefault();sendChatMessage();});
on('chat-close','click',e=>{e.preventDefault();closeChat();});
on('chat-input','input',updateChatCount);
{
  const vv=window.visualViewport;
  if(vv){ vv.addEventListener('resize',fitChatPanel); vv.addEventListener('scroll',fitChatPanel); }
  window.addEventListener('resize',fitChatPanel);
  window.addEventListener('orientationchange',()=>setTimeout(fitChatPanel,200));
}
on('chat-input','keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); sendChatMessage(); }
  if(e.key==='Escape'){ e.preventDefault(); closeChat(); }
});
window.addEventListener('contextmenu',e=>e.preventDefault());

function isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}
function updatePauseFSButton(){
  const btn=$('pauseFS');
  if(!btn) return;
  btn.textContent = (isFullscreen() || userWantsFS) ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA';
}
let pauseReadyAt=0; // ignore button presses for a short time after opening pause (mobile touch bleed)
function pause(){
  if(state!=='play')return;
  closeWeaponWheel();
  closeChat();
  state='pause';atkHeld=false;sprintHeld=false;joy.id=null;joy.active=false;joy.x=joy.y=0;
  saveGame();
  pauseReadyAt=performance.now()+450; // prevent the same touch from hitting CONTINUAR
  updatePauseFSButton();
  const e=$('pausescr');if(e)e.classList.remove('hide');
}
function resume(){
  if(state!=='pause')return;
  if(performance.now()<pauseReadyAt) return; // still ignoring accidental tap
  const e=$('pausescr');if(e)e.classList.add('hide');state='play';
}
function exitFullscreen(){
  userWantsFS=false; // stop any auto re-entry
  try{
    if(document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if(document.msExitFullscreen) document.msExitFullscreen();
    // Keep landscape lock during match; unlock only when leaving to menu
  }catch(e){}
}
function quitToMenu(){
  saveGame();
  closeWeaponWheel();
  closeChat();
  setChatButtonVisible(false);
  const cm=$('chat-msgs'); if(cm) cm.innerHTML=''; resetChatHistory();
  // E1: clear vehicle state + restore on-foot HUD before leaving
  if(P){ P.inVehicle=null; }
  restoreWalkHUD();
  if(matchMedia('(pointer:coarse)').matches && CFG.fullscreen){
    userWantsFS=true; // celular: o jogo inteiro fica em paisagem, inclusive o menu
  }else{
    userWantsFS=false;
    try{
      if(document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if(document.msExitFullscreen) document.msExitFullscreen();
      if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    }catch(e){}
  }
  showScreen('menu');$('hud').classList.add('hide');state='menu';
  setAmbient(0);setRain(false);document.body.classList.remove('nohud','nomap');
  if(MP.peer){try{MP.peer.destroy();}catch(e){}}
  MP.peer=null;MP.conn=null;MP.active=false;MP.connected=false;MP.isHost=false;MP.roomCode='';MP.myId=null;MP.syncT=0;
  mpResetReconnect();
  remotePlayers={};nextZombieNetId=1;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b100b';ctx.fillRect(0,0,W,H);
}
/* tela de carregamento: mostra o aviso, dá tempo de pintar e só então gera o mundo (a geração trava a tela por um instante) */
function loadingRun(fn,msg){
  const el=$('loading');
  if(!el){fn();return;}
  $('loadMsg').textContent=msg||'GERANDO O MUNDO...';
  el.classList.remove('hide');
  requestAnimationFrame(()=>setTimeout(()=>{
    try{fn();}catch(e){console.error('[loading]',e);}
    finally{el.classList.add('hide');}
  },60));
}
function startGame(){
  aud();bigMapClose();WP=null;
  closeChat();
  setChatButtonVisible(false);
  const cm=$('chat-msgs'); if(cm) cm.innerHTML=''; resetChatHistory();
  // E4: respect "Tela cheia ao jogar" config
  if(CFG.fullscreen){
    userWantsFS=true;
    requestFullscreenLandscape(true);
  } else {
    userWantsFS=false;
  }
  showScreen(null);
  $('hud').classList.remove('hide');
  restoreWalkHUD();
  newGame();
}
on('again','click',()=>{
  if(MP.active){quitToMenu();return;}
  showScreen(null);const d=$('deadscr');if(d)d.classList.add('hide');
  loadingRun(()=>startGame(),'GERANDO O MUNDO...');
});
on('btnRespawn','click',()=>{
  aud();
  respawnPlayer();
});
on('resume','click',e=>{e.preventDefault();e.stopPropagation();resume();});
on('pauseFS','click',e=>{
  e.preventDefault();e.stopPropagation();
  if(performance.now()<pauseReadyAt) return;
  aud();
  if(isFullscreen() || userWantsFS){
    // Explicitly leave fullscreen — will NOT auto-return
    exitFullscreen();
  } else {
    userWantsFS=true;
    requestFullscreenLandscape(true);
  }
  setTimeout(updatePauseFSButton, 200);
  setTimeout(updatePauseFSButton, 600);
});
on('quitmenu','click',e=>{
  e.preventDefault();e.stopPropagation();
  if(performance.now()<pauseReadyAt) return;
  quitToMenu();
});
// Use pointerup so the finger is already lifted when the pause menu appears (avoids accidental CONTINUAR)
on('bpause','pointerup',e=>{e.preventDefault();e.stopPropagation();aud();pause();});
on('bpause','pointerdown',e=>{e.preventDefault();e.stopPropagation();});
on('mm','pointerdown',e=>{e.preventDefault();e.stopPropagation();});
on('mm','pointerup',e=>{e.preventDefault();e.stopPropagation();aud();bigMapOpen();});
on('bigmap','pointerup',e=>{e.preventDefault();e.stopPropagation();const id=e.target&&e.target.id,cl=e.target&&e.target.classList;if(id==='bigmap'||id==='bmx'||(cl&&cl.contains('bmbox')))bigMapClose();});
on('bmzin','click',e=>{e.stopPropagation();bmZoomAt(1.6);});
on('bmzout','click',e=>{e.stopPropagation();bmZoomAt(1/1.6);});
on('bmctr','click',e=>{e.stopPropagation();if(P){bigV.cx=P.x;bigV.cy=P.y;bmGeom();bigMapDraw();}});
on('bcraft','pointerdown',e=>{e.preventDefault();aud();openCraft();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'&&!MP.active)pause();});
{
  try{migrateSaves();refreshContinue();}catch(e){}
  const b=LSget();
  try{
    const savedName=localStorage.getItem('minisurv_name');
    if(savedName){
      const hn=$('hostName');if(hn)hn.value=savedName.slice(0,12);
      const jn=$('joinName');if(jn)jn.value=savedName.slice(0,12);
    }
  }catch(e){}
}

/* ============ FRAME LOOP ============ */
let last=0;
let lastFrameTs=0, rafPrev=0;
/* Ajuste automático: acompanha o custo de cada quadro e só baixa a qualidade se o aparelho ficar devagar de forma contínua */
const AUTO={work:0,intv:0,disp:33,warm:3,slowT:0,fastT:0};
function perfMonitor(workMs,intervalMs){
  if(!CFG.autoperf) return;
  if(AUTO.warm>0){AUTO.warm-=intervalMs/1000;AUTO.work=workMs;AUTO.intv=intervalMs;return;}
  if(intervalMs>160) return; // engasgo isolado (GC, troca de app): ignora
  AUTO.work+=(workMs-AUTO.work)*.06; AUTO.intv+=(intervalMs-AUTO.intv)*.06;
  const fps=+CFG.fps||0, expect=Math.max(fps>0?1000/fps:0, AUTO.disp);
  const slow=AUTO.work>expect*.8 || AUTO.intv>expect*1.35;
  const fast=AUTO.work<expect*.35 && AUTO.intv<expect*1.15;
  const sec=intervalMs/1000;
  AUTO.slowT=slow?AUTO.slowT+sec:Math.max(0,AUTO.slowT-sec*2);
  AUTO.fastT=fast?AUTO.fastT+sec:0;
  if(AUTO.slowT>4 && perfTotal()<2){
    CFG.autolvl=(CFG.autolvl|0)+1;AUTO.slowT=0;AUTO.fastT=0;AUTO.warm=3;saveCfg();resize();
    toast('Desempenho ajustado automaticamente');
  } else if(AUTO.fastT>60 && (CFG.autolvl|0)>0){
    CFG.autolvl=(CFG.autolvl|0)-1;AUTO.slowT=0;AUTO.fastT=0;AUTO.warm=3;saveCfg();resize();
  }
}
function frame(ts){
  requestAnimationFrame(frame);
  // Aba/app em segundo plano: não gasta CPU
  if(document.hidden){ last=ts; lastFrameTs=ts; return; }
  // Menu / telas de UI: zero update/render do mundo
  const inGame=state==='play'||state==='craft'||state==='pause'||state==='dead';
  if(!inGame || !P){ last=ts; lastFrameTs=ts; return; }
  // Limite de FPS escolhido nas configurações (30, 60 ou máximo = taxa da tela)
  if(rafPrev){const d=ts-rafPrev; if(d>5&&d<60&&d<AUTO.disp) AUTO.disp=d;} // estima o intervalo da tela
  rafPrev=ts;
  const minMs=1000/perf().targetFps;
  if(lastFrameTs && (ts-lastFrameTs)<minMs*0.9) return;
  const dt=Math.min(.05,((ts-last)/1000)||0.016);
  const intervalMs=lastFrameTs?(ts-lastFrameTs):1000/60;
  const t0=performance.now();
  last=ts;
  lastFrameTs=ts;
  // E5: MP continua simulando em pause/craft/dead
  if(MP.active&&MP.reconnecting){ /* pausado até reconectar */ }
  else if(state==='play' || (MP.active && !MP.gameOver && (state==='craft' || state==='dead' || state==='pause'))) update(dt);
  render();
  if(state==='play'&&!MP.active&&P&&!P.dead){ saveT+=dt; if(saveT>=SAVE_EVERY){ saveT=0; saveGame(); } }
  if(state==='play') perfMonitor(performance.now()-t0,intervalMs); else AUTO.warm=Math.max(AUTO.warm,1.5);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    try{ if(AC && AC.state==='running') AC.suspend(); }catch(e){}
  } else {
    try{ if(AC && AC.state==='suspended') AC.resume(); }catch(e){}
    last=performance.now(); lastFrameTs=0;
    try{ hostCheckRoomAlive(); }catch(e){}
    // Voltou de segundo plano: dá 4s de folga pro canal reagir; se a conexão já morreu, reconecta na hora
    if(MP.active&&MP.gameStarted&&!MP.reconnecting){ MP.lastRecv=performance.now(); if(!MP.conn||!MP.conn.open) mpConnectionLost(); }
  }
});
requestAnimationFrame(frame);
