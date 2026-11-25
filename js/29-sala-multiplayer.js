/* ============ SALA DO MULTIPLAYER (lobby) ============
   Depois de criar ou entrar numa sala, todos caem nesta tela: lista dos ate 4 jogadores, codigo da sala, PRONTO para os convidados
   e INICIAR PARTIDA so para o host (libera quando ha ao menos 1 convidado e todos estao prontos). A rede esta em js/12 (host* / guestRoomMsg). */
const LOB_COL={host:'#ff8080',g1:'#80ffa0',g2:'#80c8ff',g3:'#ffd870'};
function lobbyShow(){
  MP.lobbyOn=true;
  showScreen('mplobby');
  lobbyRender();
}
function lobbyRender(){
  const box=$('lobPlayers');if(!box||!MP.lobbyOn)return;
  const list=(MP.players&&MP.players.length)?MP.players:(MP.isHost?mpPlayersList():[]);
  const me=myNetId();
  const code=(MP.roomCode||'').replace(/^MINISURV-/,'');
  const lc=$('lobCode');if(lc)lc.textContent=code||'------';
  const hc=$('hostCode');if(hc&&MP.isHost)hc.textContent=code||'------';
  const t=$('lobTitle');if(t)t.textContent=MP.isHost?'SUA SALA':'SALA DE '+((list.find(p=>p.host)||{}).name||'HOST').toUpperCase();
  const inf=$('lobInfo');if(inf)inf.textContent=(MP.isHost?mpWorldInfo():(MP.lobbyInfo||''))+'  |  '+list.length+'/'+MP_MAX+' jogadores';
  box.innerHTML='';
  for(let i=0;i<MP_MAX;i++){
    const p=list[i],el=document.createElement('div');
    if(!p){el.className='lob-slot empty';el.textContent='Aguardando jogador...';box.appendChild(el);continue;}
    el.className='lob-slot'+(p.id===me?' me':'')+((p.ready||p.host)?' rdy':'');
    const dot=document.createElement('span');dot.className='dot';dot.style.background=LOB_COL[p.id]||'#aaa';el.appendChild(dot);
    const nm=document.createElement('span');nm.className='nm';nm.textContent=p.name+(p.id===me?' (você)':'');el.appendChild(nm);
    const tag=document.createElement('span');
    if(p.host){tag.className='tag host';tag.textContent='HOST';}
    else if(p.ready){tag.className='tag ok';tag.textContent='PRONTO';}
    else {tag.className='tag wait';tag.textContent='AGUARDA';}
    el.appendChild(tag);
    if(MP.isHost&&!p.host){
      const k=document.createElement('button');k.className='kick';k.textContent='X';k.setAttribute('aria-label','Remover '+p.name);
      k.addEventListener('click',e=>{e.stopPropagation();aud();hostKick(p.id);});
      el.appendChild(k);
    }
    box.appendChild(el);
  }
  const meP=list.find(p=>p.id===me)||{};
  const bR=$('btnLobReady'),bS=$('btnLobStart');
  if(bR){bR.classList.toggle('hide',!!MP.isHost);bR.textContent=meP.ready?'CANCELAR PRONTO':'PRONTO';bR.disabled=!!MP._starting;}
  if(bS){
    bS.classList.toggle('hide',!MP.isHost);
    const guests=list.filter(p=>!p.host),rdy=guests.filter(p=>p.ready).length;
    bS.disabled=!hostCanStart();
    bS.textContent=guests.length?'INICIAR ('+rdy+'/'+guests.length+')':'INICIAR PARTIDA';
  }
  const st=$('lobStatus');
  if(st&&!MP._lobErr){
    const guests=list.filter(p=>!p.host),rdy=guests.filter(p=>p.ready).length;
    let msg;
    if(MP._starting)msg='Iniciando a partida...';
    else if(MP.isHost)msg=!guests.length?'Compartilhe o código e espere os amigos entrarem':(rdy===guests.length?'Todos prontos! Toque em INICIAR':'Esperando todos ficarem prontos ('+rdy+'/'+guests.length+')');
    else msg=meP.ready?'Você está pronto. Aguardando o host iniciar...':'Toque em PRONTO quando quiser começar';
    st.textContent=msg;st.classList.remove('err');
  }
}
function lobbyLeave(){
  const wasHost=MP.isHost;
  try{
    if(wasHost){ mpSend({type:'kick',why:'closed'}); }
    else if(MP.conn&&MP.conn.open){ MP.conn.send({type:'leave'}); }
  }catch(e){}
  const peer=MP.peer;
  setTimeout(()=>{try{if(peer)peer.destroy();}catch(e){}},wasHost?250:120);   // tempo de a mensagem sair antes de fechar
  MP.peer=null;MP.conn=null;MP.active=false;MP.connected=false;MP.isHost=false;MP.roomCode='';
  mpResetReconnect();
  // sair da sala (fechar como host ou sair como convidado) volta ao menu MULTIPLAYER (criar sala / entrar em sala / voltar), nunca direto
  // para o formulario de uma das duas; os formularios sao reiniciados ao abrir (btnMPHost / btnMPJoin)
  if(wasHost){const w=$('hostCodeWrap');if(w)w.classList.add('hide');setStatus('hostStatus','');lockHostWorlds(false);}
  else setStatus('joinStatus','');
  MP.lobbyOn=false;
  showScreen('mpscreen');
}
on('btnLobLeave','click',()=>{aud();lobbyLeave();});
on('btnLobReady','click',()=>{
  aud();
  if(MP.isHost||MP.gameStarted)return;
  const me=(MP.players||[]).find(p=>p.id===myNetId());
  const want=!(me&&me.ready);
  mpSend({type:'ready',r:want?1:0});
  if(me){me.ready=want;lobbyRender();}   // responde na hora; o host confirma em seguida
});
on('btnLobStart','click',()=>{aud();hostStartMatch();});
on('btnLobCopy','click',e=>{
  e.preventDefault();e.stopPropagation();aud();
  const code=(MP.roomCode||'').replace(/^MINISURV-/,'');
  copyRoomCode(code,$('btnLobCopy'),m=>{const s=$('lobStatus');if(s){s.textContent=m;s.classList.remove('err');}});
});
