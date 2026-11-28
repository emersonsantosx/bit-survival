// Feixe do aliado para na parede; arbustos e cactos quebram (com frutos caindo, save e multiplayer); ferramenta ja guardada some do crafting; sem canto na chuva.
const {chromium}=require('playwright');
const path=require('path');
(async()=>{
  const br=await chromium.launch();const pg=await br.newPage({viewport:{width:900,height:520}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.resolve(__dirname,'..','index.html'));
  const r=await pg.evaluate(()=>{
    window.requestAnimationFrame=()=>0;const out={},ok=(k,v)=>out[k]=!!v;
    localStorage.clear();selectedMap='forest';startGame();curSlot=1;zombies=[];animals=[];
    const clean=()=>{trees=[];rocks=[];blds=[];walls=[];rebuildSolidGrid();P.inside=null;};
    // crafting
    P.tools=[];state='play';openCraft();const names=()=>[...document.querySelectorAll('#craftlist .name')].map(e=>e.textContent);
    ok('enxada aparece',names().includes('Enxada'));addTool('hoe');refreshCraft();
    ok('enxada some',!names().includes('Enxada')&&names().includes('Cerca')&&names().includes('Machado'));closeCraft();
    // plantas
    const hitAll=()=>{for(let i=0;i<12;i++){P.cd=0;P.weapon='fists';attack();}};
    clean();P.face=0;P.x=600;P.y=600;items=[];decorations=[];cityDecor=[];
    const b={x:614,y:600,type:'berry',solid:false,seed:.3};decorations.push(b);
    P.cd=0;P.weapon='fists';attack();ok('arbusto marca dano',b.hp<2&&decorations.includes(b));render();
    hitAll();ok('arbusto destruido',!decorations.includes(b));ok('frutos caem',items.some(i=>i.t==='berry'));
    ok('chave no save',structPack().includes('d:614,600,berry'));
    for(const t of ['bush','bush2','drybush','frozen_bush','yucca','cactus_sm','cactus_bg','cactus_tall']){
      const d={x:614,y:600,type:t,solid:false,seed:.3};decorations=[d];hitAll();ok('quebra '+t,!decorations.length);}
    for(const t of ['flower_r','tallgrass','mushroom','fern']){const d={x:614,y:600,type:t,solid:false,seed:.3};decorations=[d];hitAll();ok('fica '+t,decorations.length===1);}
    // arvore tem prioridade sobre o arbusto
    const tr={x:618,y:600,k:0,hp:4,seed:.2};trees=[tr];decorations=[{x:612,y:600,type:'bush',seed:.1}];P.cd=0;attack();
    ok('arvore antes do arbusto',tr.hp<4&&decorations[0].hp===undefined);trees=[];
    // save e carga de um arbusto do mapa
    genWorld(worldSeed);const g=decorations.find(d=>d.type==='bush'||d.type==='bush2'||d.type==='berry');
    const k='d:'+g.x+','+g.y+','+g.type;structRemote(k);ok('convidado remove',!decorations.includes(g));
    const saved=structPack();genWorld(worldSeed);structLoad(saved);ok('continua destruido ao carregar',!structFind(k));
    // quintal da cidade
    selectedMap='city';newGame();zombies=[];animals=[];const c=cityDecor.find(d=>d.t==='bush');ok('arbusto da cidade existe',c);
    const cx=c.x,cy=c.y;clean();decorations=[];P.x=cx-12;P.y=cy;P.face=0;state='play';hitAll();
    const ckey='c:'+cx+','+cy;ok('arbusto da cidade quebra',!structFind(ckey)&&structPack().includes(ckey));
    const s2=structPack();genWorld(worldSeed);ok('volta na geracao',structFind(ckey));structLoad(s2);ok('some ao carregar',!structFind(ckey));
    // lanterna do aliado
    selectedMap='forest';startGame();zombies=[];clean();decorations=[];P.torch=false;P.x=600;P.y=600;dark=.9;
    const draw=()=>{for(let i=0;i<25;i++){dark=.9;render();}return lightBeams()[0];};
    remotePlayers={a:{x:600,y:640,face:0,lt:1,alive:true,name:'A',hp:100,anim:0}};
    const free=draw();ok('aliado sem parede',free&&free.len>120);
    genWorld(worldSeed);zombies=[];const h=blds.find(b=>b.walls&&b.walls.length);const rp=remotePlayers.a;rp.x=h.x-24;rp.y=h.y+h.h/2;rp._fLen=0;P.x=rp.x;P.y=rp.y-30;
    const cut=draw();ok('aliado para na parede',cut&&cut.len<60);remotePlayers={};
    // passaros
    let n=0;const o=window.beep;window.beep=()=>n++;P.x=600;P.y=600;const bird={sp:'sabia',x:610,y:600};
    weather='none';birdSound(bird);ok('canta sem chuva',n>0);n=0;weather='rain';birdSound(bird);ok('mudo na chuva',n===0);window.beep=o;
    return out;
  });
  await br.close();
  const bad=Object.keys(r).filter(k=>!r[k]);
  console.log(Object.keys(r).length+' verificações');
  if(bad.length||errs.length){console.log('FALHOU',bad,errs);process.exit(1);}console.log('OK');
})();
