// Posto de vigia florestal: gera na floresta, sobe pela escada, anda em volta, entra na cabine, desce; zumbi nao alcanca; salva e carrega.
const {chromium}=require('playwright');
const path=require('path');
(async()=>{
  const br=await chromium.launch();const pg=await br.newPage({viewport:{width:900,height:520}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(/posto de vigia/.test(m.text()))errs.push(m.text());});
  await pg.goto('file://'+path.resolve(__dirname,'..','index.html'));
  const r=await pg.evaluate(()=>{
    window.requestAnimationFrame=()=>0;const out={},ok=(k,v)=>out[k]=!!v;
    localStorage.clear();
    for(const m of ['desert','snow','city']){selectedMap=m;newGame();ok('sem posto '+m,!towerInfo());}
    selectedMap='forest';startGame();curSlot=1;
    const t=towerInfo();ok('posto na floresta',t);if(!t)return out;
    const inT=o=>o.x>t.dx-20&&o.x<t.dx+132&&o.y>t.dy-20&&o.y<t.foot+20;
    ok('clareira',!trees.some(inT)&&!rocks.some(inT)&&!logList().some(inT));
    const seed=worldSeed;genWorld(seed);const u=towerInfo();ok('mesma semente mesmo lugar',u.cx===t.cx&&u.cy===t.cy);
    zombies=[];animals=[];
    const walk=(dx,dy,n)=>{for(let i=0;i<n;i++){P.hp=100;joy.x=dx;joy.y=dy;joy.active=true;updateP(1/30);}joy.x=joy.y=0;joy.active=false;};
    const goX=x=>{for(let i=0;i<600&&Math.abs(P.x-x)>1.2;i++)walk(Math.sign(x-P.x),0,1);};
    const goY=y=>{for(let i=0;i<600&&Math.abs(P.y-y)>1.2;i++)walk(0,Math.sign(y-P.y),1);};
    const put=(x,y)=>{P.x=x;P.y=y;P.tw=0;};
    // lado da escada barra quem esta no chao
    put(t.cx-30,t.foot-25);walk(1,0,60);ok('lado da escada barra',!P.tw&&P.x<t.cx-12);
    // passar na frente do pe da escada nao sobe
    put(t.cx-30,t.foot+8);walk(1,0,70);ok('passar na frente nao sobe',!P.tw&&P.x>t.cx+14);
    // subir
    put(t.cx,t.foot+30);walk(0,-1,60);ok('na escada',P.tw===1);
    walk(0,-1,150);ok('no deck',P.tw===2);
    // entrar na cabine
    goY(t.iy+48);
    ok('entrou pela porta',P.y<t.iy+60-6&&P.x>t.ix&&P.x<t.ix+72);
    walk(0,0,40);render();ok('cabine abriga',shelterAt(P.x,P.y)===2);
    // paredes seguram
    walk(-1,0,80);ok('parede oeste',P.x>t.ix+4&&P.tw===2);
    walk(1,0,120);ok('parede leste',P.x<t.ix+72-4);
    goX(t.cx);goY(t.db-12);ok('saiu da cabine',P.y>t.iy+60);
    // dar a volta na passarela
    goX(t.dx+11);ok('passarela oeste',Math.abs(P.x-(t.dx+11))<2);
    goY(t.dy+10);ok('canto noroeste',Math.abs(P.y-(t.dy+10))<2);
    goX(t.dx+101);ok('canto nordeste',Math.abs(P.x-(t.dx+101))<2);
    goY(t.db-12);ok('canto sudeste',Math.abs(P.y-(t.db-12))<2);
    walk(0,1,60);ok('guarda-corpo segura',P.tw===2&&P.y<t.db-3);
    walk(1,0,60);ok('guarda-corpo leste',P.x<t.dx+112-3);
    // nada do chao ao alcance
    items.push({t:'wood',x:P.x,y:P.y});ok('sem pegar item',!pickTarget()&&!nearestItem()&&!itemsNear().length);items.pop();
    // zumbi vai ao pe da escada e nao machuca
    spawnZ(t.cx+6,t.foot+30,0);const z=zombies[zombies.length-1];P.hp=100;z.lock=9;z.seen=true;
    put(P.x,P.y);P.tw=2;goX(t.cx);goY(t.db-8);const hp=P.hp;z.x=P.x;z.y=P.y;for(let i=0;i<60;i++)updateZ(z,1/30);ok('zumbi nao alcanca',P.hp===hp);
    z.x=t.cx;z.y=t.foot+20;for(let i=0;i<120;i++)updateZ(z,1/30);ok('zumbi nao sobe',!(z.y<t.foot&&Math.abs(z.x-t.cx)<8));
    const zhp=z.hp;z.x=P.x;z.y=P.y+8;P.face=Math.PI/2;P.cd=0;P.weapon='fists';attack();ok('soco nao alcanca o chao',z.hp===zhp);
    zombies=[];
    ok('pacote de rede',packMyPlayer().tw===2);
    remotePlayers.g1={id:'g1',name:'Ana',x:t.dx+10,y:t.cy,tw:2,alive:true,face:0,hp:80};
    goX(t.cx);goY(t.iy+30);for(let i=0;i<5;i++)render();ok('desenha com aliado no alto',true);delete remotePlayers.g1;
    // salvar e carregar em cima
    const sx=P.x,sy=P.y;ok('salvou',saveGame());P.tw=0;P.x=100;P.y=100;continueGame(1);
    ok('carregou no alto',P.tw===2&&Math.abs(P.x-sx)<2&&Math.abs(P.y-sy)<2);
    updateP(1/30);ok('continua no alto',P.tw===2);
    // descer
    zombies=[];animals=[];goX(t.cx);goY(t.db-12);walk(0,1,40);goY(t.foot+20);ok('desceu',!P.tw&&P.y>t.foot);
    // renascer longe volta ao chao
    P.tw=2;P.x=100;P.y=100;updateP(1/30);ok('longe da torre fica no chao',!P.tw);
    return out;
  });
  const bad=Object.keys(r).filter(k=>!r[k]);
  console.log(Object.keys(r).length+' verificações; falhas: '+(bad.join(', ')||'nenhuma'));
  if(errs.length)console.log('erros:',errs);
  await br.close();process.exit(bad.length||errs.length?1:0);
})();
