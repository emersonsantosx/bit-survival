/* ===== Pesca: lançar isca -> espera -> fisgada (!) -> minigame da barra (estilo Stardew) ===== */
let reelKey=false,fishPop=null;
function reelHeld(){return atkHeld||reelKey;}
const rr=(a,b)=>a+Math.random()*(b-a);
function cancelFishing(msg){
  if(!P||!P.fish)return;
  P.fish=null;reelKey=false;
  if(msg)toast(msg);
}
function fishCastWait(){
  const hod=(START_HOUR+T/DAY_SECONDS*24)%24;
  let w=rr(4,9);
  if(weather==='rain')w*=.7;                                   // chuva agita os peixes
  if((hod>=5&&hod<8)||(hod>=17&&hod<20))w*=.8;                  // amanhecer e entardecer
  return w;
}
function fishPickSpecies(){
  const w=fishWeights();let sum=0;for(const k in w)sum+=w[k];
  let r=Math.random()*sum;for(const k in w){r-=w[k];if(r<=0)return k;}
  return Object.keys(w)[0];
}
function tryFish(){
  const f=P.fish;
  if(f){
    if(f.ph===0){cancelFishing('Você recolheu a linha');P.cd=.4;beep(260,.06,'triangle',.04);return true;}
    if(f.ph===1){fishStartReel();P.cd=.15;return true;}
    return true;                                               // minigame em andamento: ATACAR é o controle da barra
  }
  const fx=Math.cos(P.face),fy=Math.sin(P.face);
  let bx=null,by=null;
  for(let d=46;d>=14;d-=4){
    const x=P.x+fx*d,y=P.y+fy*d;
    if(pointInLake(x,y)){bx=x;by=y;break;}
  }
  if(bx===null&&pointInLake(P.x,P.y)){bx=P.x+fx*18;by=P.y+fy*18;}
  if(bx===null){
    for(const z of zombies){if(!z.dead&&Math.hypot(z.x-P.x,z.y-P.y)<40)return false;}
    P.cd=.5;toast(selectedMap==='city'?'Mire na fonte para lançar a isca':'Mire no lago para lançar a isca');beep(140,.06,'square',.04);
    return true;
  }
  P.fish={x:bx,y:by,t:0,wait:fishCastWait(),ph:0};
  P.cd=.5;P.swing=.18;
  toast('Isca lançada... aguarde a fisgada');
  beep(380,.08,'sine',.04,-80);
  for(let i=0;i<6;i++)parts.push({x:bx+rnd(-3,3),y:by,vx:rnd(-14,14),vy:rnd(-35,-12),t:.35,c:'#8cc8f0'});
  return true;
}
function fishStartReel(){
  const f=P.fish;if(!f)return;
  const sp=FISH[f.id]||FISH.lambari;
  f.ph=2;
  f.mg={zp:.3,zv:0,zh:clamp(.33-.028*(sp.diff-1),.22,.33),fp:.5,ft:.5,tt:.4,pr:.3,perfect:true,t:0,tick:0,in:false};
  beep(520,.08,'square',.04,120);
}
function fishEnd(ok){
  const f=P.fish;if(!f)return;
  const mg=f.mg,sp=FISH[f.id]||FISH.lambari;
  P.fish=null;reelKey=false;P.cd=.5;
  if(!ok){toast('O peixe escapou!');beep(300,.25,'triangle',.05,-160);return;}
  const kg=+(sp.kg[0]+Math.pow(Math.random(),1.6)*(sp.kg[1]-sp.kg[0])).toFixed(1)*(mg.perfect?1.15:1);
  const n=mg.perfect?2:1;
  if(!addItem('f_'+f.id,n)){toast('Inventário cheio: o peixe escapou');return;}
  track('fish',n);
  fishPop={id:f.id,kg:+kg.toFixed(1),perfect:mg.perfect,n,t:3.2};
  beep(520,.1,'sine',.05);setTimeout(()=>beep(660,.1,'sine',.05),90);setTimeout(()=>beep(880,.18,'sine',.05),190);
  for(let i=0;i<10;i++)parts.push({x:f.x+rnd(-4,4),y:f.y,vx:rnd(-30,30),vy:rnd(-60,-20),t:.45,c:'#8cc8f0'});
}
function tickFishing(dt){
  const f=P.fish;if(!f)return;
  if(P.weapon!=='fishingrod'){cancelFishing('Linha recolhida');return;}
  if(Math.hypot(f.x-P.x,f.y-P.y)>64){cancelFishing('A linha esticou demais');return;}
  if(f.ph===0){
    f.t+=dt;
    if(Math.random()<dt*2.2)parts.push({x:f.x+rnd(-4,4),y:f.y+rnd(-2,2),vx:0,vy:rnd(-10,-4),t:.3,c:'#bfe3f8'});
    if(f.t>=f.wait){                                             // fisgou!
      f.ph=1;f.bt=1.25;f.id=fishPickSpecies();
      beep(740,.07,'square',.05);setTimeout(()=>beep(990,.09,'square',.05),80);
      for(let i=0;i<7;i++)parts.push({x:f.x+rnd(-4,4),y:f.y,vx:rnd(-24,24),vy:rnd(-50,-18),t:.4,c:'#cfeaff'});
    }
  }else if(f.ph===1){
    f.bt-=dt;
    if(f.bt<=0){f.ph=0;f.t=0;f.wait=rr(2.5,5);toast('Perdeu a fisgada! Aguarde a próxima');beep(200,.12,'triangle',.04,-60);}
  }else{
    const mg=f.mg,sp=FISH[f.id]||FISH.lambari;
    mg.t+=dt;
    // barra do jogador: segurar ATACAR sobe, soltar desce (com inércia)
    mg.zv+=(reelHeld()?2.4:-2.1)*dt;mg.zv=clamp(mg.zv,-1.15,1.15);
    mg.zp+=mg.zv*dt;
    if(mg.zp<0){mg.zp=0;mg.zv=mg.zv<-.3?-mg.zv*.25:0;}
    if(mg.zp>1-mg.zh){mg.zp=1-mg.zh;mg.zv=0;}
    // peixe: escolhe um alvo, às vezes dá arrancadas
    mg.tt-=dt;
    if(mg.tt<=0){
      mg.tt=rr(.35,1.1)/(.55+sp.jit);
      mg.ft=Math.random()<sp.jit?rr(.06,.94):clamp(mg.fp+rr(-.22,.22),.05,.95);
    }
    const d=mg.ft-mg.fp,st=sp.spd*dt;
    mg.fp+=Math.abs(d)<st?d:Math.sign(d)*st;
    mg.fp=clamp(mg.fp+Math.sin(mg.t*7)*.15*dt,.03,.97);
    const inz=mg.fp>=mg.zp&&mg.fp<=mg.zp+mg.zh;
    mg.in=inz;
    mg.pr+=inz?.26*dt:-.18*dt*(1+.1*sp.diff);
    if(!inz&&mg.t>.9)mg.perfect=false;
    mg.tick-=dt;if(inz&&mg.tick<=0){mg.tick=.28;beep(300+mg.pr*300,.03,'sine',.018);}
    if(mg.pr>=1)fishEnd(true);
    else if(mg.pr<=0)fishEnd(false);
  }
}
function drawFishLine(px,py,face,fx,fy,left,bite){
  const bob=Math.sin(T*4)*0.8,dip=(left<1&&Math.sin(T*28)>0)?2:0;
  // ponta real da vara na mao (mesma geometria de drawHeld: mao, rotacao a+45 graus, escala 1.3, ponta a (8,-7) do cabo)
  const hxx=Math.round(Math.cos(face)*6),hyy=Math.round(Math.sin(face)*4)-5,rang=face+Math.PI/4,sc=HELD.fishingrod.s,vx=8*sc,vy=-7*sc;
  const tx=Math.round(px)+hxx+vx*Math.cos(rang)-vy*Math.sin(rang),ty=Math.round(py)+hyy+vx*Math.sin(rang)+vy*Math.cos(rang);
  ctx.strokeStyle='rgba(235,235,235,.75)';ctx.lineWidth=.6;
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(fx,fy-1+bob+dip);ctx.stroke();
  ctx.strokeStyle='rgba(190,230,250,.5)';ctx.lineWidth=.7;
  const rr=2+((T*6)%1)*5;
  ctx.beginPath();ctx.ellipse(fx,fy+1,rr,rr*.45,0,0,6.283);ctx.stroke();
  R(fx-1,fy-2+bob+dip,3,2,'#f2f2f2');R(fx-1,fy+bob+dip,3,2,'#e03030');
  if(bite){const up=Math.sin(T*18)>0?1:0;R(fx-1,fy-17-up,3,7,'#ffe040');R(fx-1,fy-8-up,3,3,'#ffe040');}  // ! = fisgou
}

function drawFishMini(){
  if(fishPop&&fishPop.t>0){
    const q=fishPop,a=Math.min(1,q.t*2),sp=FISH[q.id];
    ctx.save();ctx.globalAlpha=a;
    const bw=190,bh=q.perfect?58:44,bx=Math.round(W/2-bw/2),by=Math.round(H*.2);
    ctx.fillStyle='rgba(23,26,32,.9)';ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#E8E0CC';ctx.lineWidth=2;ctx.strokeRect(bx+1,by+1,bw-2,bh-2);
    const ic=pxCanvas('fish_'+q.id);ctx.imageSmoothingEnabled=false;
    if(ic)ctx.drawImage(ic,bx+10,by+8,ic.width*3,ic.height*3);
    ctx.textAlign='left';ctx.fillStyle='#8DA568';ctx.font='bold 10px "Courier New",monospace';ctx.fillText(sp.n.toUpperCase(),bx+60,by+20);
    ctx.fillStyle='#C79A54';ctx.font='bold 9px "Courier New",monospace';ctx.fillText(q.kg+' kg'+(q.n>1?'   x'+q.n:''),bx+60,by+34);
    if(q.perfect){ctx.fillStyle='#ffe040';ctx.fillText('PERFEITO! Pescaria dupla',bx+10,by+52);}
    ctx.restore();
  }
  const f=P&&P.fish;
  if(!f||f.ph!==2||!f.mg||P.dead)return;
  const mg=f.mg;
  const th=Math.round(clamp(H*.56,104,190)),tw=26;
  const x=Math.round(W/2-clamp(W*.2,110,170)-tw-14),y=Math.round(H/2-th/2-4);   // à esquerda do jogador: longe dos botões de ação
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='rgba(12,14,18,.88)';ctx.fillRect(x-8,y-22,tw+34,th+44);
  ctx.strokeStyle='#E8E0CC';ctx.lineWidth=2;ctx.strokeRect(x-7,y-21,tw+32,th+42);
  ctx.textAlign='center';ctx.fillStyle='#8DA568';ctx.font='bold 8px "Courier New",monospace';ctx.fillText('PESCA',x+(tw+18)/2,y-9);
  // trilho (água)
  ctx.fillStyle='#10324a';ctx.fillRect(x,y,tw,th);
  ctx.fillStyle='rgba(120,200,230,.12)';for(let k=0;k<th;k+=8){ctx.fillRect(x,y+((k+T*14)%th),tw,1);}
  ctx.strokeStyle='#3f4652';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,tw-1,th-1);
  // zona do jogador
  const zy=Math.round(y+th*(1-(mg.zp+mg.zh))),zh=Math.round(th*mg.zh);
  ctx.fillStyle=mg.in?'rgba(120,230,120,.9)':'rgba(90,170,90,.75)';ctx.fillRect(x+2,zy,tw-4,zh);
  ctx.fillStyle='rgba(220,255,220,.55)';ctx.fillRect(x+2,zy,tw-4,2);ctx.fillRect(x+2,zy+zh-2,tw-4,2);
  // peixe
  const ic=pxCanvas('fish_'+f.id);
  if(ic){const fy=Math.round(y+th*(1-mg.fp)),sc=2,fw=ic.width*sc,fh=ic.height*sc,sh=mg.in?0:Math.round(Math.sin(T*40));ctx.drawImage(ic,Math.round(x+tw/2-fw/2)+sh,Math.round(fy-fh/2),fw,fh);}
  // progresso
  const px=x+tw+6,pw=10;
  ctx.fillStyle='#1b1f26';ctx.fillRect(px,y,pw,th);
  const ph_=Math.round(th*clamp(mg.pr,0,1));
  ctx.fillStyle=mg.pr<.33?'#c0634a':mg.pr<.66?'#e5d34a':'#6fcf6f';ctx.fillRect(px+1,y+th-ph_,pw-2,ph_);
  ctx.strokeStyle='#3f4652';ctx.strokeRect(px+.5,y+.5,pw-1,th-1);
  if(mg.t<4){ctx.fillStyle='#E8E0CC';ctx.font='bold 7px "Courier New",monospace';ctx.fillText('SEGURE ATACAR',x+(tw+18)/2,y+th+12);}
  ctx.restore();
}
function drawFishing(){
  if(P&&P.fish&&!P.dead){const f=P.fish;drawFishLine(P.x,P.y,P.face,f.x,f.y,f.ph===0?f.wait-f.t:0,f.ph===1);}
  // Linha de pesca do outro jogador
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(!rp||rp.alive===false||rp.fx==null||!Number.isFinite(rp.x))continue;
    drawFishLine(rp.x,rp.y,rp.face||0,rp.fx,rp.fy,rp.fl||0);
  }
}
/* Sem munição: equipa a arma branca de maior dano do arsenal (ou as mãos).
   Só acontece no disparo que esvazia a arma — equipar manualmente uma arma vazia continua permitido. */
function autoSwitchMelee(){
  let best='fists',bd=-1;
  for(const k of weaponList()){
    const m=WEAPONS[k];
    if(!m||!m.melee||m.rod)continue;
    if((m.dmg||0)>bd){bd=m.dmg||0;best=k;}
  }
  P.weapon=best;updateWeaponHud();
  toast('Sem munição! Equipou: '+WEAPONS[best].n);
  beep(300,.06,'square',.045);
}
/* Espada: 3º golpe seguido (em até 1,3 s) é um combo com +60% de dano */
function meleeDmg(w){
  let d=w.dmg||8;
  if(w.combo){
    const now=performance.now();
    P._cmb=(now-(P._cmbT||0)<1300)?(P._cmb||0)+1:1;P._cmbT=now;
    if(P._cmb>=3){P._cmb=0;d*=1.6;try{addFloater(P.x,P.y-24,'COMBO','#ffb040');}catch(e){}}
  }
  return d;
}
function attack(){
  if(state!=='play'||P.cd>0||P.inVehicle)return;
  if(P.sleeping){wakeUp(false);P.cd=.4;return;}
  if(P.hold){eatStart();return;}
  const w=WEAPONS[P.weapon];
  if(!w)return;
  if(w.rod&&tryFish())return;

  // PRIORITY: always hit zombies first if any are in melee range (before trees/rocks)
  if(w.melee || w.mines || (!w.firearm && !w.melee)){
    let zNear=null,zDist=w.range+10;
    for(const z of zombies){
      if(z.dead) continue;
      const d=Math.hypot(z.x-P.x,z.y-P.y);
      if(d<zDist&&!wallBlocks(P.x,P.y,z.x,z.y)){zDist=d;zNear=z;}
    }
    if(zNear && zDist <= (w.range||18)+ (zNear.r||5) + 4){
      P.face=Math.atan2(zNear.y-P.y,zNear.x-P.x);
      P.cd=w.cd;P.swing=.18;
      const fx=Math.cos(P.face),fy=Math.sin(P.face);
      let hit=0;const md=meleeDmg(w);
      for(const z of zombies){
        if(z.dead)continue;
        const dx=z.x-P.x,dy=z.y-P.y,d=Math.hypot(dx,dy);
        if(d>w.range+z.r)continue;
        if(wallBlocks(P.x,P.y,z.x,z.y))continue;
        if(Math.abs(wrap(Math.atan2(dy,dx)-P.face))<(w.arc||1.2)){damageZ(z,md,fx*(w.kb||40),fy*(w.kb||40),false,P.weapon);hit++;}
      }
      if(!hit) damageZ(zNear,md,fx*(w.kb||40),fy*(w.kb||40),false,P.weapon);
      makeNoise(P.x,P.y,50);
      return;
    }
    // Caça animais corpo a corpo
    let aNear=null,aDist=(w.range||18)+8;
    for(const a of animals){ if(a.dead)continue; const d=Math.hypot(a.x-P.x,a.y-P.y); if(d<aDist&&!wallBlocks(P.x,P.y,a.x,a.y)){aDist=d;aNear=a;} }
    if(aNear && aDist<=(w.range||18)+6){
      P.face=Math.atan2(aNear.y-P.y,aNear.x-P.x);
      P.cd=w.cd;P.swing=.18;
      damageAnimal(aNear,w.dmg||3);
      makeNoise(P.x,P.y,40);
      return;
    }
  }

  if(w.melee){
    let hitTree=null,td=w.range+8;
    for(const t of trees){
      const d=Math.hypot(t.x-P.x,t.y-P.y);
      if(d<td){td=d;hitTree=t;}
    }
    if(hitTree){
      P.cd=w.cd;P.swing=.18;
      hitTree.hp=(hitTree.hp||4)-(w.chopRate||0.5);
      shake=3;
      chopWood();
      for(let i=0;i<5;i++)parts.push({x:hitTree.x,y:hitTree.y-10,vx:rnd(-35,35),vy:rnd(-45,0),t:.4,c:'#8a5a2a'});
      if(MP.active) sendEvt('treeDmg', { x: hitTree.x, y: hitTree.y, dmg: w.chopRate || 0.5 });
      if(hitTree.hp <= 0){
        trees.splice(trees.indexOf(hitTree), 1);
        rebuildSolidGrid();
        const n = w.wood ? rint(w.wood[0], w.wood[1]) : 2;
        for(let i = 0; i < n; i++){
          if(!addItem('wood')){
            items.push({ t: 'wood', x: hitTree.x, y: hitTree.y });
            if(MP.active) sendEvt('itemAdded', {t:'wood', x:hitTree.x, y:hitTree.y});
          }
        }
        toast('Árvore derrubada! +' + n + ' Madeira');
        beep(260, .18, 'triangle', .09, 120);
      }
      makeNoise(P.x, P.y, 60);
      return;
    }
  }

  if(!w.mines&&w.melee&&!w.rod&&(P._rockHintT||0)<performance.now()){
    for(const r of rocks){if(Math.hypot(r.x-P.x,r.y-P.y)<26){P._rockHintT=performance.now()+4000;toast('Só a picareta quebra pedras');break;}}
  }
  if(w.mines){
    let hitRock=null,td=34;
    for(const r of rocks){const d=Math.hypot(r.x-P.x,r.y-P.y);if(d<td){td=d;hitRock=r;}}
    if(hitRock){
      P.cd=w.cd;P.swing=.18;hitRock.hp-=1;shake=3;chopStone();
      for(let i=0;i<6;i++)parts.push({x:hitRock.x,y:hitRock.y-4,vx:rnd(-50,50),vy:rnd(-55,-5),t:.4,c:'#9a9a9a'});
      if(MP.active) sendEvt('rockDmg', {x:hitRock.x, y:hitRock.y, dmg:1});
      if(hitRock.hp<=0){
        rocks.splice(rocks.indexOf(hitRock),1);
        rebuildSolidGrid();
        const n=rint(2,4);
        for(let i=0;i<n;i++){
          if(!addItem('stone')){
            const sx=hitRock.x+rnd(-6,6), sy=hitRock.y+rnd(-6,6);
            items.push({t:'stone',x:sx,y:sy});
            if(MP.active) sendEvt('itemAdded', {t:'stone', x:sx, y:sy});
          }
        }
        toast('Pedra quebrada! +'+n+' Pedra');beep(320,.18,'triangle',.09,80);
      }
      makeNoise(P.x,P.y,70);return;
    }
  }

  if(w.firearm){
    if(w.bow){
      if((P.arrows||0)<=0){P.cd=.4;toast('Sem flechas');beep(140,.06,'square',.05);return;}
      P.arrows--;
    } else {
      if(P.ammo<=0){P.cd=.35;toast('Sem munição');beep(140,.06,'square',.05);return;}
      P.ammo--;
    }
    P.cd=w.cd;
    const pellets=w.pellets||1;
    const spread=w.spread||0;
    let hits=0;
    const shotTracers=[];
    for(let p=0;p<pellets;p++){
      const a=P.face+(Math.random()-.5)*spread;
      const res=castRay(P.x,P.y-5,a,w.range);
      const fx=Math.cos(a),fy=Math.sin(a);
      const tr={x1:P.x+fx*9,y1:P.y-5+fy*9,x2:res.x,y2:res.y,t:w.bow?.14:(w.heavy?.12:.07)};
      tracers.push(tr);
      shotTracers.push({x1:Math.round(tr.x1),y1:Math.round(tr.y1),x2:Math.round(tr.x2),y2:Math.round(tr.y2)});
      if(res.z){damageZ(res.z,w.dmg*(Math.random()<.15?2:1),fx*w.kb,fy*w.kb,false,P.weapon);hits++;}
      else if(res.animal){ damageAnimal(res.animal,w.dmg); hits++; }
    }
    if(hits===0){
      let best=null,bd=w.range;
      for(const z of zombies){
        if(z.dead) continue;
        const dx=z.x-P.x,dy=z.y-P.y,d=Math.hypot(dx,dy);
        if(d>bd || d<8) continue;
        const ang=Math.abs(wrap(Math.atan2(dy,dx)-P.face));
        if(ang<0.55&&!wallBlocks(P.x,P.y-5,z.x,z.y-5)){bd=d;best=z;}
      }
      if(best){
        const fx=Math.cos(P.face),fy=Math.sin(P.face);
        damageZ(best,w.dmg,fx*w.kb,fy*w.kb,false,P.weapon);
        hits++;
      } else {
        // Aim assist em animais (todas as armas de fogo)
        let bestA=null,ad=w.range;
        for(const an of animals){
          if(an.dead) continue;
          const dx=an.x-P.x,dy=an.y-P.y,d=Math.hypot(dx,dy);
          if(d>ad || d<6) continue;
          const ang=Math.abs(wrap(Math.atan2(dy,dx)-P.face));
          if(ang<0.5&&!wallBlocks(P.x,P.y-5,an.x,an.y-5)){ad=d;bestA=an;}
        }
        if(bestA){ damageAnimal(bestA,w.dmg); hits++; }
      }
    }
    P.flash=w.bow?0:.06;
    if(!w.bow)addPulse(P.x+Math.cos(P.face)*10,P.y-5+Math.sin(P.face)*10,w.heavy?70:52,.09,'w');
    // Arco quase silencioso
    makeNoise(P.x,P.y,w.bow?70:(w.heavy?700:420));
    if(w.bow){ bowRelease(); shake=Math.max(shake,1); }
    else { gunshot(P.weapon);shake=Math.max(shake,w.heavy?4:(P.weapon==='shotgun'?3:2)); }
    if(MP.active){
      sendEvt('shot', {
        x:Math.round(P.x), y:Math.round(P.y),
        face:+P.face.toFixed(2), weapon:P.weapon,
        tracers:shotTracers
      });
    }
    // Acabou a munição neste disparo: troca sozinho para a melhor arma branca
    if(w.bow?(P.arrows||0)<=0:P.ammo<=0)autoSwitchMelee();
  } else if(w.melee){
    let tgt=null,bd=w.range+8;
    for(const z of zombies){if(z.dead)continue;const d=Math.hypot(z.x-P.x,z.y-P.y);if(d<bd&&!wallBlocks(P.x,P.y,z.x,z.y)){bd=d;tgt=z;}}
    if(tgt)P.face=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    P.cd=w.cd;P.swing=.18;
    const fx=Math.cos(P.face),fy=Math.sin(P.face);
    let hit=0;const md=meleeDmg(w);
    for(const z of zombies){
      if(z.dead)continue;
      const dx=z.x-P.x,dy=z.y-P.y,d=Math.hypot(dx,dy);
      if(d>w.range+z.r)continue;
      if(wallBlocks(P.x,P.y,z.x,z.y))continue;
      if(Math.abs(wrap(Math.atan2(dy,dx)-P.face))<(w.arc||1.1)){damageZ(z,md,fx*w.kb,fy*w.kb,false,P.weapon);hit++;}
    }
    if(!hit)beep(180,.07,'triangle',.03,-60);
    makeNoise(P.x,P.y,50);
  }
}

function darkness(h){
  if(h>=7&&h<=18)return 0;
  if(h>18&&h<21)return(h-18)/3;
  if(h>=21||h<4)return 1;
  return 1-(h-4)/3;
}

/* ===== Temperatura corporal (0 = confortável; negativo = frio; positivo = calor) =====
   O ambiente puxa a temperatura do corpo para um alvo que depende do MAPA, da HORA, do CLIMA e do ABRIGO:
   neve = frio constante (pior à noite) · deserto = calor de dia / frio à noite · floresta e cidade = amenos
   (só chuva + noite incomodam). Prédios e carros isolam, fogueira esquenta, sombra e água refrescam. */
const TEMP_MAP={ snow:{base:-42,amp:16}, desert:{base:12,amp:44}, forest:{base:-4,amp:12}, city:{base:0,amp:10} };
function envTemp(){
  const m=TEMP_MAP[selectedMap]||TEMP_MAP.forest;
  const hod=(START_HOUR+T/DAY_SECONDS*24)%24;
  let tg=m.base+m.amp*Math.sin((hod-8)/24*6.2832);       // máximo ~14h, mínimo ~2h
  if(weather==='rain') tg-=14; else if(weather==='snow') tg-=8+blizzK*14; else if(weather==='sand') tg+=8;
  if(P.inVehicle&&vehKind(P.inVehicle)==='car') tg*=0.6;      // cabine do carro fechado (veiculos abertos nao isolam)
  else if(bldAt(P.x,P.y)) tg*=0.3;                           // abrigo isola do clima
  else if(nearTent(P.x,P.y,34)) tg*=0.55;                    // barraca protege um pouco
  else {
    if(tg>10){ for(const n of querySolidNear(P.x,P.y,28)){ if(n.kind==='tree'){ tg-=22; break; } } } // sombra
  }
  { const w=P.wet||0; if(w>0) tg-=w*(selectedMap==='snow'?42:(tg>0?40:18)); } // molhado: esfria aos poucos (mais na neve)
  for(const c of campfires){                                  // fogueira: esquenta no frio
    const d=Math.hypot(c.x-P.x,c.y-P.y);
    if(d<95){
      const f=1-d/95;
      // Fogueira aquece até o conforto (nunca causa insolação em clima ameno); com calor forte só piora um pouco
      if(tg<22) tg=Math.max(tg,Math.min(tg+70*f,22));
      else tg+=14*f;
    }
  }
  if(P.sprint) tg+=10;                                        // correr gera calor
  // o corpo regula pior a temperatura quando está debilitado
  if(P.food<25) tg-=(25-P.food)*.4;                           // sem comer: sente mais frio (até -10)
  if(P.water<25&&tg>0) tg+=(25-P.water)*.5;                   // desidratado: não sua, esquenta mais (até +12)
  if(P.bleed) tg-=8;                                          // perda de sangue dá calafrio
  if(P.sick>0) tg+=6;                                         // intoxicação dá febre
  if(P.turban&&tg>0) tg*=.65;                                 // turbante (marco do deserto)
  return clamp(tg,-100,100);
}
function tempTick(dt){
  if(!Number.isFinite(P.temp)) P.temp=0;
  { // água do lago/oásis: ficar dentro vai molhando e esfriando aos poucos; fora, seca devagar
    const inW=!P.inVehicle&&pointInLake(P.x,P.y), snow=selectedMap==='snow';
    const sheltered=!!((P.inVehicle&&vehKind(P.inVehicle)==='car')||bldAt(P.x,P.y)||nearTent(P.x,P.y,34));
    const rainWet=!inW&&weather==='rain'&&!sheltered;                       // chuva molha quem esta ao relento
    let nearFire=false;for(const c of campfires){if(Math.hypot(c.x-P.x,c.y-P.y)<70){nearFire=true;break;}}
    const dry=(snow?55:30)/(nearFire?3:1);                                   // perto da fogueira seca bem mais rapido
    P.wet=clamp((P.wet||0)+(inW?dt/(snow?16:26):(rainWet?dt/(snow?60:90):-dt/dry)),0,1);
    P._inW=inW;
  }
  P.temp+=(envTemp()-P.temp)*Math.min(1,dt/((P._inW&&selectedMap==='snow')?14:40));
  const T=P.temp;
  let fm=1,wm=1,spd=1,sr=1,sd=1,dmg=0,code=0;
  if(T<-28){ code=-1; fm=1.25; sr=.7; spd=.95; }
  if(T<-55){ code=-2; spd=.88; sd=1.2; dmg=.6+.9*clamp((-T-55)/25,0,1); }
  if(T>28){ code=1; wm=1.5; sr=.75; sd=1.2; }
  if(T>55){ code=2; wm=2.0; spd=.92; dmg=.6+.9*clamp((T-55)/25,0,1); }
  if(selectedMap==='desert') wm*=1.2;      // ar seco: mais sede
  if(selectedMap==='snow') fm*=1.15;       // corpo queima mais calorias
  P._fm=fm;P._wm=wm;P._tspd=spd;P._tsr=sr;P._tsd=sd;P._tdmg=dmg;
  if(Math.abs(code)>Math.abs(P._tc||0)){
    if(code===-1) toast('Você está com frio: abrigue-se ou chegue perto de uma fogueira');
    else if(code===-2) toast('Você está congelando! Procure fogo ou um abrigo');
    else if(code===1) toast('Calor forte: procure sombra, água ou abrigo');
    else if(code===2) toast('Insolação! Saia do sol e beba água');
  }
  P._tc=code;
}
/* Desgaste de sobrevivência: vale a pé e dirigindo */
function survivalTick(dt){
  tempTick(dt);
  const rest=!P.moving&&!P.sprint;                          // parado (ou sentado no carro): corpo gasta menos
  const sick=P.sick>0;
  if(sick)P.sick=Math.max(0,P.sick-dt);
  // metabolismo: correr, frio, calor, ferida e enjoo mudam o quanto o corpo consome
  const meta=(rest?.75:1)*(P.sprint?1.8:1);
  let fm=(P._fm||1)*(sick?1.3:1), wm=(P._wm||1)*(P.sprint?2/1.8:1)*(P.bleed?1.4:1)*(sick?1.8:1);
  P.food=Math.max(0,P.food-.09*dt*meta*fm);
  P.water=Math.max(0,P.water-.13*dt*(rest?.75:1)*(P.sprint?1.8:1)*wm);
  const nut=Math.min(P.food,P.water);                        // o pior entre fome e sede manda no corpo
  // energia máxima: fome, sede, ferida, enjoo e temperatura extrema diminuem o teto da barra
  let pen=28*(1-clamp(P.food/35,0,1))+32*(1-clamp(P.water/35,0,1));
  if(P.bleed)pen+=20; if(sick)pen+=20; if(P.hp<35)pen+=(35-P.hp)*.6; if(P._tc)pen+=10;
  P._scap=clamp(100-pen,30,100);
  if(P.stam>P._scap)P.stam=Math.max(P._scap,P.stam-40*dt);
  P._sreg=.6+.4*clamp(nut/50,0,1);                           // bem nutrido recupera o fôlego mais rápido
  if(P.hp<35)P._sreg*=.75;
  // sangramento, fome, sede, congelamento e enjoo tiram vida
  if(P.bleed){P.hp-=1.1*dt;if(Math.random()<dt*4)parts.push({x:P.x,y:P.y-2,vx:0,vy:10,t:.5,c:'#a01818',g:1});}
  if(P.food<=0)P.hp-=.7*dt;
  if(P.water<=0)P.hp-=1*dt;
  if(P._tdmg>0)P.hp-=P._tdmg*dt;
  if(sick)P.hp-=.25*dt;
  // regeneração: só com o corpo bem nutrido, sem ferida aberta, sem enjoo e sem temperatura extrema; parado cura mais rápido e gasta comida e água
  if(!P.bleed&&!sick&&!(P._tdmg>0)&&P.hp<100){
    const q=clamp((nut-25)/40,0,1),rate=(rest?.75:.4)*q;
    if(rate>0){P.hp=Math.min(100,P.hp+rate*dt);P.food=Math.max(0,P.food-rate*.1*dt);P.water=Math.max(0,P.water-rate*.08*dt);}
  }
  // avisos de que o corpo está falhando (uma vez por vez)
  if(nut<25&&!P._wk){P._wk=1;toast(P.water<=P.food?'Sede: sua energia está diminuindo':'Fome: sua energia está diminuindo');}
  else if(nut>40)P._wk=0;
  if(P.hp<=0&&!P.dead)die();
  if(P.hp<30&&P.hp>0){heartbeatT-=dt;if(heartbeatT<=0){heartbeatT=.9;heartbeat();}}
}
function updateP(dt){
  if(P.dead) return;
  if(GH.on&&GH.kill>0){P.moving=false;return;}
  if(P.sleeping){sleepTick(dt);return;}
  if(P.inVehicle){
    const v=P.inVehicle;
    if(P.fish)P.fish=null;
    if(v.hp===undefined){ v.hp=100; v.maxHp=100; }
    v.showHp=3; // mostra barra enquanto dirige
    // Fome, sede, sangramento e regeneração continuam correndo dentro do carro
    P.sprint=false;
    survivalTick(dt);
    if(P.dead) return;
    P.stam=Math.min(P._scap||100,P.stam+24*dt*(P._sreg||1));
    if(P.exhausted&&P.stam>Math.min(20,(P._scap||100)-8))P.exhausted=false;
    // Carro morto: não anda, só espera explosão
    if(v.dying || v.hp<=0){
      if(!v.dying) startVehicleDeath(v);
      v.spd=0;
      P.x=v.x;P.y=v.y;P.face=v.face;P.moving=false;
      return;
    }
    const VS=vehSpec(v),wf=(weather==='rain'||weather==='sand')?.92:1; // chuva/areia pioram um pouco
    const tr=vehTerr(v,terrainFor(v.x,v.y));
    const maxSpd=VS.top*tr.spd*wf, maxRev=VS.rev*tr.spd*wf;
    if(touchGas>0)v.spd=Math.min(maxSpd,v.spd+VS.acc*tr.acc*dt);
    else if(touchGas<0)v.spd=Math.max(maxRev,v.spd-40*tr.acc*dt);
    else v.spd*=Math.pow(tr.coast,dt);
    // Entrou em terreno pior em alta velocidade: o terreno freia o carro aos poucos
    if(v.spd>maxSpd) v.spd=Math.max(maxSpd,v.spd-120*dt);
    else if(v.spd<maxRev) v.spd=Math.min(maxRev,v.spd+120*dt);
    // Poeira / neve / respingos levantados fora da estrada
    if(tr.dust&&Math.abs(v.spd)>22){
      v._dustT=(v._dustT||0)-dt;
      if(v._dustT<=0){
        v._dustT=.07;
        parts.push({x:v.x-Math.cos(v.face)*14+rnd(-3,3),y:v.y-Math.sin(v.face)*14+rnd(-2,4),vx:rnd(-18,18),vy:rnd(-32,-8),t:.45,c:tr.dust});
      }
    }
    const prevSpd=v.spd;
    // Movimento em subpassos de até 2px: o carro nunca "pula" por cima de cerca ou parede fina, mesmo em alta velocidade
    const oldOverlap=vehicleOverlap(v);   // já encostado antes de mover? (aceita qualquer movimento que NÃO piore)
    const okNow=()=>{const c=vehicleOverlap(v);return oldOverlap>0?c<=oldOverlap:c===0;};
    const steerR=(touchSteer!==0&&Math.abs(v.spd)>4)?touchSteer*2.2*tr.steer*wf*(v.spd>0?1:-1):0;
    const dist=v.spd*dt,nSub=Math.max(1,Math.ceil(Math.abs(dist)/2));
    let blocked=false,scraped=false;
    for(let i=0;i<nSub;i++){
      const sx0=v.x,sy0=v.y,sf0=v.face,df=steerR*dt/nSub,st=dist/nSub;
      v.face=sf0+df;v.x=sx0+Math.cos(v.face)*st;v.y=sy0+Math.sin(v.face)*st;
      if(okNow())continue;
      if(df!==0){v.face=sf0;v.x=sx0+Math.cos(sf0)*st;v.y=sy0+Math.sin(sf0)*st;if(okNow())continue;} // girar contra a parede trava: tenta sem girar
      // raspando: desliza ao longo da superfície (só se o movimento naquele eixo for relevante)
      const mx=Math.cos(sf0)*st,my=Math.sin(sf0)*st,tot=Math.abs(st)||1;
      const tries=Math.abs(mx)>=Math.abs(my)?[[mx,0,mx],[0,my,my]]:[[0,my,my],[mx,0,mx]];
      let ok=false;
      for(const [tx,ty,cmp] of tries){
        if(Math.abs(cmp)<tot*.3)continue;
        v.face=sf0;v.x=sx0+tx;v.y=sy0+ty;
        if(okNow()){ok=true;scraped=true;break;}
      }
      if(ok)continue;
      v.x=sx0;v.y=sy0;v.face=sf0;blocked=true;break;
    }
    if(scraped&&!blocked){
      v.spd*=Math.pow(.4,dt);    // atrito ao raspar
      if(Math.abs(v.spd)>25&&Math.random()<dt*14)parts.push({x:v.x+Math.cos(v.face)*14,y:v.y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-40,-10),t:.25,c:'#ffd070'});
    }
    if(blocked){
      if(Math.abs(prevSpd)>10&&oldOverlap===0){
        let impact=Math.abs(prevSpd);
        const other=vehicleOtherAt(v,prevSpd>=0?1:-1);
        if(other){
          // batida entre veículos: vale a velocidade RELATIVA (parado = só a do carro; vindo de frente soma; na mesma direção diminui)
          const dx=Math.cos(v.face)*Math.sign(prevSpd),dy=Math.sin(v.face)*Math.sign(prevSpd);
          const ovx=Math.cos(other.face||0)*(other.spd||0),ovy=Math.sin(other.face||0)*(other.spd||0);
          impact=Math.max(0,Math.abs(prevSpd)-(ovx*dx+ovy*dy));
        }
        const dmg=Math.min(22,2+impact*0.25)*VS.armor;
        if(other&&impact>10&&!(other._vhCD>0)){
          other._vhCD=.5; // mesmo dano dos dois lados (carros iguais): o outro veículo sofre o que o seu sofre
          hitOtherVehicle(other,dmg);
        }
        v.hp-=dmg;
        v.spd=-Math.sign(prevSpd)*Math.min(26,impact*.22);   // rebote
        v._envHitCD=(v._envHitCD||0);
        if(v._envHitCD<=0){
          v._envHitCD=0.25;
          shake=Math.max(shake,3+impact/25);
          boom(0.14,0.1+impact/180,350);
          beep(70,.12,'sawtooth',.06);
          addFloater(v.x,v.y-18,'-'+Math.round(dmg),'#ff8040');
          for(let k=0;k<6;k++)parts.push({x:v.x+Math.cos(v.face)*(prevSpd>0?16:-16),y:v.y+rnd(-6,6),vx:rnd(-40,40),vy:rnd(-50,-10),t:.3,c:'#ffd070'});
        }
        if(v.hp<=0){startVehicleDeath(v);return;}
      }else v.spd=0;
    }
    // Anti-preso: se a carroceria ainda está dentro de algo, se desloca aos poucos para o lado livre
    // (testa 16 direções) mesmo sem o jogador acelerar. Garante que nunca fique travado de vez.
    {
      let ov=vehicleOverlap(v);
      for(let it=0;it<3&&ov>0;it++){
        let bx=v.x,by=v.y,bo=ov;
        for(let k=0;k<16;k++){
          const a=k*Math.PI/8, tx=v.x+Math.cos(a)*2.5, ty=v.y+Math.sin(a)*2.5;
          const sx=v.x,sy=v.y; v.x=tx;v.y=ty;
          const c=vehicleOverlap(v);
          v.x=sx;v.y=sy;
          if(c<bo){bo=c;bx=tx;by=ty;}
        }
        if(bo>=ov)break;
        v.x=bx;v.y=by;ov=bo;
      }
    }
    if(v._envHitCD>0) v._envHitCD-=dt;
    v.x=clamp(v.x,16,WW-16);v.y=clamp(v.y,16,WH-16);
    P.x=v.x;P.y=v.y;P.face=v.face;P.moving=Math.abs(v.spd)>8;
    if(Math.abs(v.spd)>15){
      makeNoise(v.x,v.y,90+Math.abs(v.spd)*0.6);
    }
    // Atropelar animais
    if(Math.abs(v.spd)>30){
      for(const an of animals){
        if(an.dead) continue;
        an._carHit=(an._carHit||0)-dt;
        if(an._carHit>0) continue;
        if(Math.hypot(an.x-v.x,an.y-v.y)<22){
          an._carHit=0.4;
          damageAnimal(an, (10+Math.min(8,Math.abs(v.spd)/9))*VS.ram);
          an.x+=Math.cos(v.face)*6; an.y+=Math.sin(v.face)*6;
          v.hp-=0.5*VS.armor;
          if(v.hp<=0){ startVehicleDeath(v); return; }
        }
      }
    }
    for(const z of zombies){
      if(z.dead) continue;
      if(Math.hypot(z.x-v.x,z.y-v.y)<22&&Math.abs(v.spd)>48){
        damageZ(z, (6+Math.min(6,Math.abs(v.spd)/20))*VS.ram, Math.cos(v.face)*90, Math.sin(v.face)*90);
        v.hp-=3*VS.armor;
        if(v.hp<=0){ startVehicleDeath(v); return; }
      }
    }
    return;
  }
  if(P.fish)tickFishing(dt);
  let mx=joy.x,my=joy.y,len=Math.hypot(mx,my);
  if(len>1){mx/=len;my/=len;len=1;}
  if(P.fish&&P.fish.ph>=1){mx=0;my=0;len=0;}                     // fisgou: o jogador fica parado na vara
  P.moving=len>.12;
  const inWater=pointInLake(P.x,P.y);
  const wantSprint=sprintHeld&&P.moving&&P.stam>0&&!P.exhausted&&!inWater;
  P.sprint=!!wantSprint;
  let sp=P.sprint?78:(inWater?24:46);
  if(!inWater&&onSand(P.x,P.y))sp*=.9;                          // areia fofa: um pouco mais devagar
  if(FIELD&&inCorn(P.x,P.y))sp*=.88; // abrir caminho entre os pés de milho
  if(P.hp<30)sp*=.85;
  // Clima com impacto: neve freia; chuva gasta mais stamina
  if(weather==='snow') sp*=0.82*(1-.1*blizzK);
  else if(weather==='rain') sp*=0.94;
  else if(weather==='sand') sp*=0.9;
  sp*=(P._tspd||1);                 // frio/calor extremos desaceleram
  if(P.moving){
    stepMove(P,mx*sp*dt,my*sp*dt,P.r);
    P.face=Math.atan2(my,mx);
    P.walk+=dt*(P.sprint?14:9);
    if(inWater&&Math.random()<.2)parts.push({x:P.x+rnd(-6,6),y:P.y+rnd(-4,4),vx:rnd(-10,10),vy:rnd(-15,-5),t:.4,c:'#4aa3e8'});
    stepT-=dt;
    if(stepT<=0){stepT=P.sprint?0.28:0.42;footstep(inWater||(selectedMap==='city'&&ORLA&&inSea(P.x,P.y)),stepSurf(),P.sprint);}
  }
  if(P.sprint){
    const stamDrain=17*(weather==='rain'?1.35:weather==='snow'?1.2:weather==='sand'?1.15:1)*(P._tsd||1);
    P.stam-=stamDrain*dt;if(P.stam<=0){P.stam=0;P.exhausted=true;}
    noiseT-=dt;
    if(noiseT<=0){makeNoise(P.x,P.y,70);noiseT=.6;}
  }else{
    // Recupera mais rápido parado (30/s) do que andando (20/s)
    const stamRegen=(P.moving?20:30)*(weather==='snow'?0.8:1)*(P._tsr||1)*(P._sreg||1);
    P.stam=Math.min(P._scap||100,P.stam+stamRegen*dt);
    if(P.exhausted&&P.stam>Math.min(20,(P._scap||100)-8))P.exhausted=false;
  }
  P.x=clamp(P.x,8,WW-8);P.y=clamp(P.y,8,WH-8);
  pushOut(P,P.r);
  iceTick(dt);
  plantTick(dt);
  // Never switch to interior camera while driving — keeps world visible & exit orientation clear
  P.inside=null;
  if(!P.inVehicle){
    for(const b of blds)if(P.x>b.x&&P.x<b.x+b.w&&P.y>b.y&&P.y<b.y+b.h){P.inside=b;break;}
  }
  survivalTick(dt);
}
function updateZ(z,dt){
  z.anim+=dt*(z.kind===1?10:6);
  z.cd=Math.max(0,z.cd-dt);z.hit=Math.max(0,z.hit-dt);z.alert=Math.max(0,z.alert-dt);z.lunge=Math.max(0,z.lunge-dt);
  if(z.vx||z.vy){
    stepMove(z,z.vx*dt,z.vy*dt,z.r);
    const f=Math.pow(.02,dt);z.vx*=f;z.vy*=f;
    if(Math.abs(z.vx)<2)z.vx=0;
    if(Math.abs(z.vy)<2)z.vy=0;
  }
  if(z.stun>0){z.stun-=dt;z.moving=false;z.cd=Math.max(z.cd,.2);return;} // atordoado pelo taco: não anda nem ataca
  // Choose nearest living player (local or remote) so both players aggro zombies
  let targetX=P.x, targetY=P.y, targetSprint=P.sprint&&P.moving, targetMoving=P.moving, targetDead=!!P.dead, targetIsLocal=true, targetInCar=!!P.inVehicle;
  let bestD=P.dead?1e9:Math.hypot(P.x-z.x,P.y-z.y);
  if(MP.active && MP.isHost){
    for(const id in remotePlayers){
      const rp=remotePlayers[id];
      if(!rp || rp.alive===false) continue;
      const dd=Math.hypot((rp.x||0)-z.x,(rp.y||0)-z.y);
      if(dd<bestD){
        bestD=dd; targetX=rp.x; targetY=rp.y;
        targetSprint=!!(rp.sprint&&rp.moving); targetMoving=!!rp.moving;
        targetDead=false; targetIsLocal=false; targetInCar=!!rp.inVehicle;
      }
    }
  }
  // No living players nearby — wander
  if(bestD>=1e9){ targetDead=true; }
  const d=bestD;
  let det=95;
  if(targetSprint)det=185;else if(!targetMoving)det=52;
  if(dark>.5)det*=.72;
  if(z.kind===1)det*=1.18;
  if(z.kind===5)det*=1.12;
  if(z.crawler)det*=.7;
  // Cuspidor enxerga e mira de longe (antes só reagia a ~50-95px, então o alcance 190 nunca era usado)
  if(z.ranged) det=Math.max(det,150);
  if(z.screams){
    z.screamT=(z.screamT||0)-dt;
    if(z.screamT<=0&&d<300&&z.lock>0){
      z.screamT=rnd(6,12);
      for(const other of zombies)if(other!==z&&!other.dead&&Math.hypot(other.x-z.x,other.y-z.y)<300){other.alert=8;other.tx=targetX;other.ty=targetY;}
      for(let i=0;i<12;i++)parts.push({x:z.x,y:z.y-14,vx:rnd(-40,40),vy:rnd(-60,-20),t:.6,c:'#fff0f0'});
    }
  }
  if(z.ranged){
    z.spitT=(z.spitT||0)-dt;
    if(z.windT>0){
      // Preparando o cuspe: para, brilha em verde e dispara na posição ATUAL do alvo (corpo, não os pés)
      z.windT-=dt;
      z.face=Math.atan2(targetY-z.y,targetX-z.x);
      if(Math.random()<dt*30)parts.push({x:z.x+Math.cos(z.face)*5,y:z.y-9,vx:rnd(-12,12),vy:rnd(-25,-8),t:.35,c:'#80e060'});
      if(z.windT<=0){
        z.spitT=rnd(1.8,3.2);
        const sy0=z.y-8,a=Math.atan2((targetY-6)-sy0,targetX-z.x);
        const spit={x:z.x,y:sy0,vx:Math.cos(a)*160,vy:Math.sin(a)*160,t:1.4};
        spits.push(spit);
        // Sync projectile to guest so both see/take spit damage
        if(MP.active && MP.isHost) sendEvt('spit', {x:spit.x,y:spit.y,vx:spit.vx,vy:spit.vy,t:spit.t});
        beep(420,.15,'sawtooth',.05,-200);
      }
    } else if(z.spitT<=0&&z.seen&&z.lock>0&&!targetDead&&d<z.range&&d>40){
      z.windT=0.4; // aviso visual antes de cuspir
    }
  }
  z.losT-=dt;
  if(z.losT<=0){z.losT=.3;z.seen=d<det*1.2?losClear(z.x,z.y-5,targetX,targetY-5):false;}
  z.lock=Math.max(0,z.lock-dt);
  if(z.seen&&d<det)z.lock=Math.max(z.lock,4);
  if(z.lock>0&&d>det*2&&!z.lastSeen){z.lastSeen={x:targetX,y:targetY};z.searchT=3.2;}
  if(z.seen)z.lastSeen={x:targetX,y:targetY};
  if(FIELD&&!targetDead&&d>26&&inCorn(targetX,targetY)){z.seen=false;z.lock=0;z.lastSeen=null;z.searchT=0;} // milharal: quem persegue perde o alvo de vista
  if(z.kind===9&&!targetDead&&d<560){ // Yeti: caçador implacável, não perde o alvo por ruído, escuridão ou linha de visão
    z.seen=true;z.lock=Math.max(z.lock,4);z.lastSeen={x:targetX,y:targetY};z.alert=0;
  }
  let mode='wander';
  if(z.lock>0&&(d<det*2||z.kind===9))mode='chase';
  else if(z.alert>0)mode='noise';
  else if(z.lastSeen&&z.searchT>0)mode='search';
  let tx,ty,sp;
  if(mode==='chase'){
    if(z.ranged){
      // Histerese: recua se d<70 (até d>90), aproxima se d>120, e fica parado atirando entre 90 e 120
      if(z._kite){ if(d>90) z._kite=false; } else if(d<70) z._kite=true;
      if(z._kite){
        const a=Math.atan2(z.y-targetY,z.x-targetX);
        tx=z.x+Math.cos(a)*100;ty=z.y+Math.sin(a)*100;sp=z.spd;
      }else if(d>120){
        tx=targetX;ty=targetY;sp=pointInLake(z.x,z.y)?z.spd*.6:z.spd;
      }else{
        tx=z.x;ty=z.y;sp=0;z.face=Math.atan2(targetY-z.y,targetX-z.x);
      }
    }else{tx=targetX;ty=targetY;sp=pointInLake(z.x,z.y)?z.spd*.6:z.spd;}
  }else if(mode==='noise'){
    tx=z.tx;ty=z.ty;sp=z.spd*.92;
    if(Math.hypot(tx-z.x,ty-z.y)<12){z.alert=0;z.lastSeen={x:z.tx,y:z.ty};z.searchT=2.4;}
  }else if(mode==='search'){
    z.searchT=Math.max(0,(z.searchT||0)-dt);tx=z.lastSeen.x;ty=z.lastSeen.y;sp=z.spd*.68;
    if(z.searchT<=0)z.lastSeen=null;
  }else{
    z.wt-=dt;
    if(z.wt<=0){
      z.wt=rnd(2,5);
      if(Math.random()<.4){z.tx=z.x;z.ty=z.y;}
      else{z.tx=clamp(z.x+rnd(-70,70),20,WW-20);z.ty=clamp(z.y+rnd(-70,70),20,WH-20);}
    }
    tx=z.tx;ty=z.ty;sp=14;
    if(Math.hypot(tx-z.x,ty-z.y)<6)sp=0;
  }
  if(z.windT>0) sp=0; // parado enquanto prepara o cuspe
  // Rota: pela porta e contornando prédios (recalcula a cada ~0,2s)
  if(mode!=='wander'&&sp>0&&!(z.ranged&&z._kite)){
    z._wt=(z._wt||0)-dt;
    if(z._wt<=0||z._wm!==mode){
      z._wt=.2;z._wm=mode;
      const nv=zNav(z,tx,ty);
      z._wtriv=nv.t;z._wx=nv.x;z._wy=nv.y;
    }
    if(!z._wtriv){tx=z._wx;ty=z._wy;}
  }
  if(dark>.58 && sp>0) sp*=1+Math.min(.22,(dark-.58)*.55);
  // Perseguindo alguem de carro: nenhum zumbi passa de 70% da velocidade maxima do carro no terreno em que ele esta
  if(sp>0&&targetInCar&&mode!=='wander'){const cap=carTopAt(targetX,targetY)*0.7;if(sp>cap)sp=cap;}
  z.moving=sp>0;
  if(sp>0){
    let a=Math.atan2(ty-z.y,tx-z.x);
    if(z._det>0){z._det-=dt;a+=z._ds*1.3;}      // desvio lateral quando travado
    z.face=a;stepMove(z,Math.cos(a)*sp*dt,Math.sin(a)*sp*dt,z.r);
  }
  pushOut(z,z.r);
  if(sp>0){
    z._sk=(z._sk||0)+dt;
    if(z._sk>=.5){
      const mv=Math.hypot(z.x-(z._sx===undefined?z.x:z._sx),z.y-(z._sy===undefined?z.y:z._sy));
      if(mv<sp*.5*.3&&Math.hypot(tx-z.x,ty-z.y)>26&&mode!=='wander'){z._det=.7;z._ds=Math.random()<.5?-1:1;}
      z._sx=z.x;z._sy=z.y;z._sk=0;
    }
  }
  if(dark>.3&&z.kind!==9){
    let nearFire=false;
    for(const c of campfires)if(Math.hypot(c.x-z.x,c.y-z.y)<70){nearFire=true;break;}
    if(nearFire){
      z.lock=0;
      let closest=null,cd=999;
      for(const c of campfires){const dd=Math.hypot(c.x-z.x,c.y-z.y);if(dd<cd){cd=dd;closest=c;}}
      if(closest&&cd<70){
        const a=Math.atan2(z.y-closest.y,z.x-closest.x);
        stepMove(z,Math.cos(a)*40*dt,Math.sin(a)*40*dt,z.r);
      }
    }
  }
  // Melee hit: only damages the local player (remote damage is handled by their own client via proximity + snapshot)
  if(!z.ranged&&targetIsLocal&&P.inVehicle&&!P.dead&&z.cd<=0){
    // Jogador dentro do carro: o zumbi bate na lataria (o carro sofre o dano, o jogador fica protegido)
    const v=P.inVehicle;vehHalf(v);
    const ex=Math.max(0,Math.abs(z.x-v.x)-v._hx),ey=Math.max(0,Math.abs(z.y-v.y)-v._hy);
    if(Math.hypot(ex,ey)<z.r+3){
      carTakeHit(v,z.dmg*0.2);
      z.cd=z.berserk||z.kind===8?0.75:1.1;z.lunge=.15;
    }
  } else if(!z.ranged&&targetIsLocal&&d<z.r*(z.kind===9?1.45:1)+P.r+(z.kind===9?12:6)&&z.cd<=0&&!P.dead&&!wallBlocks(z.x,z.y,P.x,P.y)){
    const knock=z.kind===2||z.kind===3||z.kind===7;
    hurt(z.dmg, z.kind===3?.65:z.kind===2||z.kind===7?.5:z.kind===8?.35:.25);
    zombieVoice(z,'attack');
    z.cd=z.berserk||z.kind===8?0.75:1.1;z.lunge=.15;
    if(knock){
      const a=Math.atan2(P.y-z.y,P.x-z.x);
      stepMove(P,Math.cos(a)*22,Math.sin(a)*22,P.r);
    }
  }
}
function update(dt){
  if(!P||!isFinite(dt))return;
  T+=dt;DOORF++;DOOR_DT=dt;
  statTick(dt);
  const hr=START_HOUR+T/DAY_SECONDS*24;
  dark=darkness(hr%24);
  day=Math.floor(hr/24)+1;
  syncRainAudio(dt);
  ambLife(dt);ambFx(dt);
  weatherTimer-=dt;
  if(weatherTimer<=0&&MP.active&&!MP.isHost)weatherTimer=30; // convidado: só o host sorteia (snapshot manda)
  if(weatherTimer<=0){
    weatherTimer=rnd(100,220);
    const prev=weather;
    weather=pickWeather(Math.random);
    if(prev!==weather){
      setRain(weather==='rain');
      if(weather==='rain') toast('Chuva: fogueiras apagam e stamina cai mais');
      else if(weather==='snow') toast('Neve: movimento e recuperação mais lentos');
      else if(weather==='sand') toast('Tempestade de areia: visão e velocidade reduzidas');
      else if(prev!=='none') toast('Clima limpo');
    }
  }
  if(weather!=='none'){
    const pf=perf();
    // Densidade por segundo: igual em 30, 60 ou 120 FPS
    weatherAcc=Math.min(14,weatherAcc+pf.weatherSpawn*dt*60*(1+blizzK*2));
    const wcap=pf.weatherCap*(1+(perfTotal()<2?blizzK*1.2:0));
    while(weatherAcc>=1){ weatherAcc-=1; if(weatherParticles.length>=wcap) continue;
      if(weather==='sand') weatherParticles.push({x:camX-20,y:camY+rnd(0,H/Z),vx:rnd(160,260),vy:rnd(-12,30),sz:rnd(1,2),t:rnd(.7,1.3)});
      else weatherParticles.push({
        x:camX+rnd(-50,W/Z+50+blizzK*220),y:camY-10,
        vx:weather==='rain'?rnd(-30,-10):rnd(-10,10)-blizzK*rnd(110,200),
        vy:weather==='rain'?rnd(350,500):rnd(60,120)+blizzK*70,
        sz:weather==='rain'?rnd(1,2):rnd(2,4),
        t:rnd(1,2)
      });
    }
    for(const wp of weatherParticles){wp.x+=wp.vx*dt;wp.y+=wp.vy*dt;wp.t-=dt;}
    weatherParticles=weatherParticles.filter(wp=>wp.t>0&&wp.y<camY+H/Z+20);
  } else if(weatherParticles.length){
    weatherParticles.length=0;
  }
  // chuva: respingos no chao; frio: vapor da respiracao
  if(weather==='rain'){
    const pfr=perf();splashAcc=Math.min(6,splashAcc+(pfr.weatherSpawn||.4)*dt*50);
    while(splashAcc>=1){splashAcc-=1;if(parts.length>=(pfr.partsCap||120))break;
      parts.push({x:camX+rnd(0,W/Z),y:camY+rnd(0,H/Z),vx:rnd(-14,14),vy:rnd(-42,-22),t:rnd(.14,.24),c:'rgba(170,200,230,.75)',g:1});}
  }
  vaporT-=dt;
  if(vaporT<=0&&P&&!P.dead&&P.temp<-14&&!P.inVehicle&&!bldAt(P.x,P.y)){
    vaporT=P.moving?1.3:2.2;
    const fx=Math.cos(P.face||0);
    vapor.push({x:P.x+fx*6,y:P.y-15,vx:fx*8,t:0});
  }
  for(const v of vapor){v.t+=dt;v.x+=v.vx*dt;v.y-=10*dt;}
  vapor=vapor.filter(v=>v.t<.9);
  // Chuva apaga fogueiras gradualmente
  if(weather==='rain' && campfires.length && (!MP.active||MP.isHost)){ // só o anfitrião apaga fogueiras (o convidado recebe o evento)
    for(let i=campfires.length-1;i>=0;i--){
      const c=campfires[i];
      c.wet=(c.wet||0)+dt;
      if(c.wet>18){
        // chance de apagar após ~18s sob chuva
        if(Math.random()<dt*0.15){
          for(let k=0;k<10;k++)parts.push({x:c.x,y:c.y-4,vx:rnd(-20,20),vy:rnd(-30,-5),t:.5,c:'#666'});
          campfires.splice(i,1);
          if(MP.active && MP.isHost) sendEvt('campfireRemoved',{x:c.x,y:c.y});
          toast('Fogueira apagou na chuva');
          beep(100,.2,'sine',.04);
        }
      }
    }
  }
  const nightMix=clamp((dark-.12)/.75,0,1);
  const weatherMix=weather==='rain'?.018:(weather==='snow'?.008:(weather==='sand'?.012:0));
  setAmbient(.018+nightMix*.075+weatherMix);
  updateP(dt);
  updateAnimals(dt);
  try{updateObserver(dt);}catch(e){}
  try{updateGhost(dt);}catch(e){}
  try{updateCornfield(dt);}catch(e){}
  try{updateYeti(dt);}catch(e){}
  try{updateBirds(dt);}catch(e){}
  try{updateLighting(dt);}catch(e){}
  try{updateLM(dt);}catch(e){}
  try{sleepUpdate(dt);}catch(e){}
  if(fishPop&&fishPop.t>0)fishPop.t-=dt;
  updateVehicles(dt);
  try{updateLootRespawn(dt);}catch(e){}
  try{updateRegrow(dt);}catch(e){}
  updatePings();
  P.cd=Math.max(0,P.cd-dt);P.swing=Math.max(0,P.swing-dt);P.flash=Math.max(0,P.flash-dt);
  if(atkHeld&&!P.dead&&!chatOpen&&(P.hold||!WEAPONS[P.weapon]?.rod))attack();
  eatTick(dt);
  // Chuva lava o sangue depressa; a neve e a areia vão cobrindo aos poucos
  const decayK=weather==='rain'?3.2:(weather==='snow'?1.8:(weather==='sand'?1.6:1));
  for(let k=decals.length-1;k>=0;k--){decals[k].l-=dt*decayK;if(decals[k].l<=0)decals.splice(k,1);}
  if(!MP.active||MP.isHost){
    for(const z of zombies){
      if(z.dead)continue;
      let nearAny=false;
      const dx=z.x-P.x,dy=z.y-P.y;
      if(dx*dx+dy*dy<UPD*UPD) nearAny=true;
      if(!nearAny && MP.active){
        for(const id in remotePlayers){
          const rp=remotePlayers[id];
          if(!rp) continue;
          const rdx=z.x-(rp.x||0), rdy=z.y-(rp.y||0);
          if(rdx*rdx+rdy*rdy<UPD*UPD){nearAny=true;break;}
        }
      }
      if(nearAny) updateZ(z,dt);
    }
  }
  // Spits run on BOTH sides (host spawns+syncs; guest receives via evt)
  for(const s of spits){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.t-=dt;
    if(P && !P.dead && Math.hypot(s.x-P.x,s.y-(P.y-6))<10){
      zombieHurt(8,.15);
      for(let i=0;i<10;i++)parts.push({x:s.x,y:s.y,vx:rnd(-60,60),vy:rnd(-60,20),t:.5,c:'#80e060'});
      s.t=0;
    }
    if(s.t>0&&P&&P.inVehicle&&!P.dead){ // cuspe na lataria: o carro sofre, o jogador fica protegido
      const v=P.inVehicle;vehHalf(v);
      if(Math.abs(s.x-v.x)<=v._hx+1&&Math.abs(s.y-v.y)<=v._hy+1){
        carTakeHit(v,8*0.2);
        for(let i=0;i<8;i++)parts.push({x:s.x,y:s.y,vx:rnd(-50,50),vy:rnd(-50,20),t:.45,c:'#80e060'});
        s.t=0;
      }
    }
    if(pointSolid(s.x,s.y)){
      for(let i=0;i<6;i++)parts.push({x:s.x,y:s.y,vx:rnd(-40,40),vy:rnd(-40,20),t:.4,c:'#80e060'});
      s.t=0;
    }
  }
  spits=spits.filter(s=>s.t>0);
  if(!MP.active||MP.isHost){
    const near=zombies.filter(z=>!z.dead&&Math.abs(z.x-P.x)<300&&Math.abs(z.y-P.y)<300);
    for(let i=0;i<near.length;i++){
      const a=near[i];
      const pdx=a.x-P.x,pdy=a.y-P.y,pd=Math.hypot(pdx,pdy),pm=a.r+P.r-1;
      if(pd<pm&&pd>.01){a.x=P.x+pdx/pd*pm;a.y=P.y+pdy/pd*pm;}
      for(let j=i+1;j<near.length;j++){
        const b=near[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r-1;
        if(d<m&&d>.01){const f=(m-d)/2;a.x-=dx/d*f;a.y-=dy/d*f;b.x+=dx/d*f;b.y+=dy/d*f;}
      }
    }
    if(MP.active&&MP.isHost){
      for(const id in remotePlayers){
        const rp=remotePlayers[id];
        if(!rp||rp.alive===false||!Number.isFinite(rp.x))continue;
        for(const a of zombies){
          if(a.dead)continue;
          const rx=a.x-rp.x,ry=a.y-rp.y;
          if(rx>40||rx<-40||ry>40||ry<-40)continue;
          const rd=Math.hypot(rx,ry),rm=a.r+4;
          if(rd<rm&&rd>.01){a.x=rp.x+rx/rd*rm;a.y=rp.y+ry/rd*rm;}
        }
      }
    }
    zombies=zombies.filter(z=>!z.dead);
    // Horda cresce com o dia (single e multi — só host spawna no MP)
    const dd=dayDiff();
    spawnTimer-=dt;
    if(spawnTimer<=0){
      spawnTimer=dd.interval;
      if(zombies.length<dd.cap){
        let sx=P.x, sy=P.y;
        if(MP.active && MP.isHost){
          const pts=[{x:P.x,y:P.y}];
          for(const id in remotePlayers){const rp=remotePlayers[id];if(rp&&rp.alive!==false)pts.push({x:rp.x,y:rp.y});}
          const pickP=pts[Math.floor(Math.random()*pts.length)];
          sx=pickP.x; sy=pickP.y;
        }
        const toSpawn=Math.min(dd.batch, dd.cap-zombies.length);
        let spawned=0;
        for(let n=0;n<toSpawn;n++){
          for(let k=0;k<30;k++){
            const a=rnd(0,6.283),dist=rnd(320,640);
            const x=sx+Math.cos(a)*dist,y=sy+Math.sin(a)*dist;
            if(x<30||y<30||x>WW-30||y>WH-30||solidPoint(x,y,12)||bldNear(x,y,18)||inAnyView(x,y,140))continue;
            spawnZ(x,y);
            spawned++;
            break;
          }
        }
        // Mini-horda extra à noite a partir do dia 3
        if(dark>0.58 && day>=3 && Math.random()<0.22 && zombies.length<dd.cap){
          for(let n=0;n<Math.min(3,dd.cap-zombies.length);n++){
            const a=rnd(0,6.283),dist=rnd(280,480);
            const x=sx+Math.cos(a)*dist,y=sy+Math.sin(a)*dist;
            if(x>40&&y>40&&x<WW-40&&y<WH-40&&!solidPoint(x,y,12)&&!bldNear(x,y,18)&&!inAnyView(x,y,140)) spawnZ(x,y);
          }
        }
      }
    }
    // Anúncio de horda ao virar o dia
    if(typeof update._lastDay==='number' && day>update._lastDay){
      // burst de spawn ao amanhecer do novo dia
      if(zombies.length<dd.cap){
        const burst=Math.min(3+Math.floor(day/2), dd.cap-zombies.length, 8);
        for(let n=0;n<burst;n++){
          const a=rnd(0,6.283),dist=rnd(360,620);
          const x=P.x+Math.cos(a)*dist,y=P.y+Math.sin(a)*dist;
          if(x>40&&y>40&&x<WW-40&&y<WH-40&&!solidPoint(x,y,12)&&!bldNear(x,y,18)&&!inAnyView(x,y,140)) spawnZ(x,y, pickZombieKind());
        }
      }
    }
    if(typeof update._lastDay==='number'&&day>update._lastDay)dayAdvanced(day-update._lastDay);
    update._lastDay=day;
  } else {
    if(typeof update._lastDay==='number'&&day>update._lastDay){dayAdvanced(day-update._lastDay);}
    update._lastDay=day;
  }
  // Convidado: suaviza zumbis/animais entre snapshots (antes davam “saltos” a cada ~0,16s)
  if(MP.active&&!MP.isHost){
    const k=Math.min(1,dt*14);
    for(const z of zombies){
      if(z.hit>0)z.hit=Math.max(0,z.hit-dt); // antes só o host zerava: zumbi ficava “branco/rosa” para sempre
      if(z.dead||z._nx===undefined)continue;
      if(z.moving)z.anim+=dt*(z.kind===1?10:6);
      const dx=z._nx-z.x,dy=z._ny-z.y;
      if(dx*dx+dy*dy>8100){z.x=z._nx;z.y=z._ny;}else{z.x+=dx*k;z.y+=dy*k;}
    }
    for(const a of animals){
      if(a._predT)a._predT=Math.max(0,a._predT-dt);
      if(a.dead||a._nx===undefined)continue;
      const dx=a._nx-a.x,dy=a._ny-a.y;
      if(dx*dx+dy*dy>8100){a.x=a._nx;a.y=a._ny;}else{a.x+=dx*k;a.y+=dy*k;}
    }
  }
  // Multiplayer: suaviza carros que outro jogador dirige / que vieram no snapshot
  if(MP.active){
    const kv=Math.min(1,dt*14);
    for(const v of vehicles){
      if(P&&P.inVehicle===v){ v._nx=undefined; continue; }
      if(v._nx===undefined) continue;
      v.x+=(v._nx-v.x)*kv; v.y+=(v._ny-v.y)*kv;
      v.face+=wrap((v._nf||0)-(v.face||0))*kv;
    }
  }
  // Decay local damage prediction timers
  for(const z of zombies){
    if(z._predT) z._predT = Math.max(0, z._predT - dt);
  }
  // Guest: take melee damage from nearby zombies (Host runs AI, Guest applies local hits)
  if(MP.active && !MP.isHost && P && !P.dead){
    for(const z of zombies){
      if(z.dead) continue;
      z._hitCD = (z._hitCD||0) - dt;
      const dd=Math.hypot(z.x-P.x,z.y-P.y);
      const ys=z.kind===9?1.45:1,zr=(z.r||5)*ys;                          // Yeti é grande: alcance maior (igual ao do anfitrião)
      let reach=dd < zr+P.r+(z.kind===9?12:6) && !wallBlocks(z.x,z.y,P.x,P.y);
      if(P.inVehicle){ // dentro do carro: o alcance e medido ate a lataria
        const v=P.inVehicle;vehHalf(v);
        reach=Math.hypot(Math.max(0,Math.abs(z.x-v.x)-v._hx),Math.max(0,Math.abs(z.y-v.y)-v._hy))<zr+3;
      }
      if(reach && z._hitCD<=0){
        const kind = z.kind||0;
        zombieHurt(z.dmg||9, kind===2?.5:kind===3?.6:.25);
        zombieVoice(z,'attack');
        z.lunge=.15;sendEvt('zAtk',{id:z.netId});   // o anfitrião também vê (e ouve) o zumbi atacando
        z._hitCD = 1.1;
        if((kind===2||kind===3)&&!P.inVehicle){
          const a=Math.atan2(P.y-z.y,P.x-z.x);
          P.x+=Math.cos(a)*20;P.y+=Math.sin(a)*20;
        }
      }
    }
  }
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;p.t-=dt;}
  parts=parts.filter(p=>p.t>0);
  for(const f of floaters){f.y+=f.vy*dt;f.t-=dt;f.vy*=0.98;}
  floaters=floaters.filter(f=>f.t>0);
  for(const t of tracers)t.t-=dt;
  tracers=tracers.filter(t=>t.t>0);
  for(const b of blds){
    let target=P.inside===b?0:1;
    // o telhado só abre quando o jogador está dentro da casa; de carro ou parado no canto, nada aparece
    b.roofA+=(target-b.roofA)*Math.min(1,dt*8);
  }
  for(const c of campfires){
    c.flicker=(c.flicker||0)+dt*8;
    const fireRate=dt*perf().fireRate;
    const smokeRate=dt*perf().smokeRate;
    if(Math.random()<fireRate)parts.push({x:c.x+rnd(-4,4),y:c.y-8,vx:rnd(-6,6),vy:rnd(-40,-20),t:rnd(.5,1.2),c:Math.random()<.5?'#ffb040':'#ff7020'});
    if(Math.random()<smokeRate)parts.push({x:c.x+rnd(-3,3),y:c.y-14,vx:rnd(-8,8),vy:rnd(-30,-15),t:rnd(1,2),c:'rgba(80,80,80,.7)'});
  }
  flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt*12);
  if(P&&P._grace>0)P._grace-=dt;
  // Guest: dano de animais agressivos por proximidade (host simula AI)
  if(MP.active && !MP.isHost && P && !P.dead){
    for(const a of animals){
      if(a.dead||!ANIMAL_AGGRO[a.k]) continue;
      a._hitCD=(a._hitCD||0)-dt;
      let near=Math.hypot(a.x-P.x,a.y-P.y)<30;
      if(P.inVehicle){const v=vehHalf(P.inVehicle);near=Math.hypot(Math.max(0,Math.abs(a.x-v.x)-v._hx),Math.max(0,Math.abs(a.y-v.y)-v._hy))<14;} // dirigindo: alcance medido até a lataria
      if(near && a._hitCD<=0 && !wallBlocks(a.x,a.y,P.x,P.y)){
        a._hitCD=1.1;a.lunge=.12;sendEvt('aAtk',{x:Math.round(a.x),y:Math.round(a.y),k:a.k});
        animalHurt(a.k==='boar'?12:(a.k==='wolf'?10:(a.k==='scorpion'?8:6)),0.15);
      }
    }
  }
  hudT-=dt;if(hudT<=0){hudT=perf().hudInterval;updateHud(false);}
  // Limita partículas (economia / anti-GC)
  const pCap=perf().partsCap;
  if(parts.length>pCap) parts.splice(0, parts.length-pCap);
  // Rede de segurança: conexão sumiu sem evento 'close' (acontece em redes móveis) → trata como queda após 3s
  if(MP.active&&MP.gameStarted&&!MP.reconnecting&&!MP.guestAway&&(!MP.conn||!MP.conn.open)){
    MP._deadT=(MP._deadT||0)+dt;
    if(MP._deadT>3){MP._deadT=0;MP.connected=false;mpConnectionLost();}
  } else MP._deadT=0;
  if(MP.active&&MP.connected&&MP.conn&&MP.conn.open && P){
    // Ping periódico pra medir pressão da rede
    MP.pingT=(MP.pingT||0)-dt;
    if(MP.pingT<=0){
      MP.pingT=2.0;
      mpSend({type:'ping', t:performance.now()});
    }
    // Intervalo adaptativo + anti-flood (evita queda por pressão no canal)
    const lag=MP.rtt||80;
    const playerInterval=lag>220?0.09:(lag>150?0.065:0.05);
    // Snapshot mais frequente no começo (guest precisa dos zumbis) e na cidade
    let snapInterval=selectedMap==='city'?0.12:0.16;
    if(T<8) snapInterval=Math.min(snapInterval, 0.1);
    if(lag>180) snapInterval=0.22;
    if(lag>280) snapInterval=0.3;
    if((MP.failCount||0)>8) snapInterval=Math.max(snapInterval,0.32);
    MP.syncT-=dt;
    if(MP.syncT<=0){
      MP.syncT=playerInterval;
      if(!mpSend(packMyPlayer())) MP.failCount=(MP.failCount||0)+1;
      else if(MP.failCount>0) MP.failCount=Math.max(0,MP.failCount-1);
    }
    if(MP.isHost){
      MP.snapT=(MP.snapT||0)-dt;
      if(MP.snapT<=0){
        MP.snapT=snapInterval;
        const dch=MP.conn&&MP.conn.dataChannel;
        if(dch&&dch.bufferedAmount>80*1024){ MP.snapT=Math.max(snapInterval,0.25); } // canal congestionado: pula este snapshot em vez de acumular atraso
        else if(!mpSend(packSnapshot())) MP.failCount=(MP.failCount||0)+2;
      }
    }
    // Timeout: sem pacote por 15s (mais tolerante em 4G)
    if(MP.lastRecv && (performance.now()-MP.lastRecv)>9000){
      MP.lastRecv=performance.now();
      const dead=MP.conn;MP.connected=false;MP.conn=null;
      try{if(dead)dead.close();}catch(e){}
      mpConnectionLost();
    }
  }
  for(const id in remotePlayers){
    const rp=remotePlayers[id];
    if(rp.tx!==undefined&&rp.x!==undefined){
      const dx=rp.tx-rp.x, dy=rp.ty-rp.y;
      // Snap if too far (prevents permanent freeze from lag spikes)
      if(dx*dx+dy*dy>90*90){ rp.x=rp.tx; rp.y=rp.ty; }
      else {
        const k=Math.min(1,dt*14);
        rp.x+=dx*k; rp.y+=dy*k;
      }
    }
    if(rp.flash) rp.flash=Math.max(0,rp.flash-dt);
    if(rp.swing) rp.swing=Math.max(0,rp.swing-dt);
  }
}

function toast(msg){
  const el=$('toast');if(!el)return;
  el.textContent=msg;el.classList.add('show');
  clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),3000);
}
function updateHud(force){
  if(!P)return;
  {const bt=$('bpack');if(bt)bt.classList.toggle('nobp',!P.pack);}
  const setW=(id,v)=>{const e=$(id);if(e)e.style.width=clamp(v,0,100)+'%';};
  setW('hpb',P.hp);setW('fdb',P.food);setW('wtb',P.water);setW('stb',P.stam);
  {const sc=$('stc');if(sc)sc.style.width=(100-clamp(P._scap||100,0,100))+'%';}
  const tpb=$('tpb');
  if(tpb){const tv=P.temp||0;tpb.style.width=clamp(50+tv/2,2,100)+'%';tpb.style.background=tv<-55?'#3f6fe0':tv<-28?'#6ab0f0':tv>55?'#e04030':tv>28?'#e8863a':'#6fcf6f';}
  const hr=(START_HOUR+T/DAY_SECONDS*24)%24;
  const wthKey=weather==='rain'?'rain':(weather==='snow'?'snow':(weather==='sand'?'wind':''));
  const mpTxt=MP.active?(MP.isHost?' ['+(MP.playerName||'HOST').toUpperCase().slice(0,8)+']':' ['+(MP.playerName||'MP').toUpperCase().slice(0,8)+']'):'';
  const clk=$('clk');if(clk)clk.textContent='Dia '+day+' '+pad(Math.floor(hr))+':'+pad(Math.floor((hr%1)*60))+mpTxt;
  const kl=$('kl');if(kl)kl.textContent='Zumbis: '+kills;
  const w=WEAPONS[P.weapon];
  /* o botão de trocar arma mostra a arma na mão; só arma de fogo/arco mostra a munição. O nome aparece um instante quando troca */
  {
    const wpn=$('wpn'),sw=$('swap');
    let wk='fists',wn=w?w.n:'Mãos',wc='',low=false;
    if(w&&w.firearm&&w.bow){wk='bow';wc=String(P.arrows||0);low=(P.arrows||0)<=2;}
    else if(w&&w.firearm){wk=WEAPON_ICON[P.weapon]||'pistol';wc=String(P.ammo|0);low=(P.ammo|0)<=3;}
    else if(w){wk=WEAPON_ICON[P.weapon]||'fists';}
    const wsig=wk+'|'+wn+'|'+wc;
    if(sw&&sw._sig!==wsig){
      sw._sig=wsig;
      sw.innerHTML=pxFit(wk,40,32)+'<i class="swm">'+pxIcon('c_swap',1)+'</i>'+(wc!==''?'<b class="swc'+(low?' low':'')+'">'+wc+'</b>':'');
      sw.setAttribute('aria-label','Trocar arma. Na mão: '+wn+(wc!==''?', munição '+wc:''));
      if(wpn){
        const nameChanged=wpn._wn!==undefined&&wpn._wn!==wn;wpn._wn=wn;
        wpn.textContent=wn;
        if(nameChanged){wpn.classList.remove('chg');void wpn.offsetWidth;wpn.classList.add('chg');}
      }
    }
  }
  // Status do personagem PERMANENTE (importante)
  let st='',stk='';
  if(P.bleed){st='SANGRANDO';stk='hp';}
  else if(P.water<=0){st='SEDE';stk='water';}
  else if(P.food<=0){st='FOME';stk='food';}
  else if((P.temp||0)<-55){st='CONGELANDO';stk='cold';}
  else if((P.temp||0)>55){st='INSOLAÇÃO';stk='hot';}
  else if(P.sick>0){st='INTOXICADO';stk='sick';}
  else if(P.exhausted){st='CANSADO';stk='stam';}
  else if((P._scap||100)<65){st='FRACO';stk='stam';}
  if(!st&&MP.active&&MP.isHost&&MP.guestAway)st='CONVIDADO OFFLINE';
  const stat=$('stat');if(stat){stat.textContent=st;stat.style.opacity=st?'1':'0';stat.className=stk?'s-'+stk:'';} // a cor do aviso segue a cor da barra correspondente
  const PICK_ICON={ARAR:'c_hand',PLANTAR:'c_hand',COLHER:'c_hand',REGAR:'drop',FECHAR:'c_door',PORTA:'c_door',ABRIR:'c_chest',PEGAR:'c_hand','ÁGUA':'drop',ASSAR:'c_flame',ENTRAR:'c_door',DORMIR:'c_bed',LEVANTAR:'c_bed'};
  {const at=$('atk'),want=P.hold?'c_eat':'c_atk';
   if(at&&at.dataset.ic!==want){at.dataset.ic=want;at.setAttribute('aria-label',P.hold?'Comer':'Atacar');at.innerHTML=pxIcon(want,4);}}
  let canInteract=false,btnText='PEGAR';
  const TG=pickTarget();   // o botao sempre mostra o alvo mais perto (mesma regra de pickup)
  if(TG)canInteract=true;
  if(!TG&&(pointInLake(P.x,P.y)||nearFountain(P.x,P.y))&&mapHasLake()){canInteract=true;btnText='ÁGUA';}
  const cf=nearestCampfire()||nearestStove();
  if(TG&&TG.k==='tap'){btnText='ÁGUA';}
  else if(TG&&TG.k==='chest'){btnText='ABRIR';}
  else if(TG&&TG.k==='door'){btnText=TG.dr.open?'FECHAR':'PORTA';}
  else if(TG&&TG.k==='plot'){btnText=TG.act;}
  else if(TG&&TG.k==='veh'){if(TG.v.looted)btnText='ENTRAR';}
  if(!TG&&nearestCactus()){canInteract=true;btnText='ÁGUA';}
  if(cf && P.hold && cookOf(P.hold)){canInteract=true;btnText='ASSAR';}
  if(P.sleeping){canInteract=true;btnText='LEVANTAR';}
  else if(TG&&TG.k==='bed'){btnText='DORMIR';}
  const pick_=$('pick');
  if(pick_){if(pick_.dataset.st!==btnText){pick_.dataset.st=btnText;pick_.setAttribute('aria-label',btnText==='ABRIR'?'Abrir baú':btnText==='ÁGUA'?'Beber água':btnText==='ASSAR'?'Assar':btnText==='ENTRAR'?'Entrar':btnText==='FECHAR'?'Fechar porta':btnText==='PORTA'?'Abrir porta':btnText==='DORMIR'?'Dormir':btnText==='LEVANTAR'?'Levantar':'Pegar');if(plotAria[btnText])pick_.setAttribute('aria-label',plotAria[btnText]);pick_.innerHTML=pxIcon(PICK_ICON[btnText]||'c_hand',3);}
    pick_.classList.toggle('hot',canInteract);}
}

