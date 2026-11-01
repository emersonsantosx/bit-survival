/* Arte do menu principal (logotipo e cena em pixel art). Independente da logica do jogo. */
(function(){
  try{
    const CREAM='#E8E0CC',MOSS='#8DA568',AMBER='#C79A54',BG='#171A20',LINE='#2a2f38',DEEP='#0c0e12',DMOSS='#5b6e43',BROWN='#7a5a30';
    const GL={
      B:['####.','#...#','#...#','####.','#...#','#...#','####.'],
      I:['###','.#.','.#.','.#.','.#.','.#.','###'],
      T:['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
      S:['.####','#....','#....','.###.','....#','....#','####.'],
      U:['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
      R:['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
      V:['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
      A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
      L:['#....','#....','#....','#....','#....','#....','#####']};
    function word(c,txt,x,y,sc,col,sh){
      let cx=x;
      for(const ch of txt){const g=GL[ch];
        for(let r=0;r<g.length;r++)for(let k=0;k<g[r].length;k++)if(g[r][k]==='#'){
          if(sh){c.fillStyle=sh;c.fillRect(cx+k*sc+1,y+r*sc+1,sc,sc);}
        }
        cx+=(g[0].length+1)*sc;}
      cx=x;
      for(const ch of txt){const g=GL[ch];
        c.fillStyle=col;
        for(let r=0;r<g.length;r++)for(let k=0;k<g[r].length;k++)if(g[r][k]==='#')c.fillRect(cx+k*sc,y+r*sc,sc,sc);
        cx+=(g[0].length+1)*sc;}
    }
    const wid=(txt,sc)=>{let w=0;for(const ch of txt)w+=(GL[ch][0].length+1)*sc;return w-sc;};
    function drawLogo(){
      const cv=document.getElementById('logoCv');if(!cv)return;const c=cv.getContext('2d');
      c.clearRect(0,0,cv.width,cv.height);
      // Tudo alinhado a esquerda em x=0 e com a mesma largura (45 colunas): BIT (3x), SURVIVAL (1x) e as duas barras.
      const W=wid('SURVIVAL',1);
      word(c,'BIT',Math.floor((W-wid('BIT',3))/2),0,3,MOSS,DEEP);
      word(c,'SURVIVAL',0,24,1,CREAM,DEEP);
      c.fillStyle=AMBER;c.fillRect(0,33,W,1);c.fillRect(0,35,W,1);
    }
    const SP={G:MOSS,D:DMOSS,B:BROWN,C:CREAM,A:AMBER,K:'#3a414d',W:'#e0b25a',R:'#c2452f'};
    const ART={
      tree:['..GGG..','.GGGGG.','GGGDGGG','.GGGGG.','GGGGDGG','..GGG..','...B...','...B...'],
      cactus:['..D..','D.D.D','D.D.D','DDDDD','..D..','..D..','..D..'],
      pine:['..C..','.CGC.','..G..','.GGG.','GGGGG','.GGG.','GGGGG','..B..'],
      city:['KKKKKKK','KWKKWKK','KKKKKKK','KKWKKWK','KKKKKKK','KWKKWKK','KKKKKKK','KKKDKKK'],
      fire1:['..R....','..RR...','.RRAR..','.RAAAR.','RAACAAR','RAAAAAR','BBBBBBB','.BB.BB.'],
      fire2:['....R..','...RR..','..RARR.','.RAAAR.','RAACAAR','RAAAAAR','BBBBBBB','.BB.BB.']};
    function put(c,a,x,y){for(let r=0;r<a.length;r++)for(let k=0;k<a[r].length;k++){const ch=a[r][k];if(ch!=='.'){c.fillStyle=SP[ch];c.fillRect(x+k,y+r,1,1);}}}
    let frame=0;
    function drawScene(){
      const cv=document.getElementById('sceneCv');if(!cv)return;const c=cv.getContext('2d');
      c.clearRect(0,0,cv.width,cv.height);
      c.fillStyle=LINE;c.fillRect(0,13,45,1); // mesma largura do logotipo (45 colunas)
      put(c,ART.tree,1,5);put(c,ART.cactus,11,6);
      put(c,frame?ART.fire2:ART.fire1,19,5);
      put(c,ART.pine,29,5);put(c,ART.city,38,5);
    }
    function fit(){
      const lg=document.getElementById('logoCv'),sc=document.getElementById('sceneCv'),card=document.querySelector('#menu .card');
      if(!lg||!sc||!card)return;
      const land=innerWidth>innerHeight&&innerHeight<=520;
      const maxW=land?Math.min(innerWidth*.45,360):Math.min(innerWidth-40,340);
      const maxH=land?innerHeight*.5:innerHeight*.3;
      const sL=Math.max(2,Math.min(Math.floor(maxW/46),Math.floor(maxH/37),8));
      lg.style.width=46*sL+'px';lg.style.height=37*sL+'px';
      sc.style.width=46*sL+'px';sc.style.height=14*sL+'px'; // mesma grade de pixels do logotipo
    }
    function drawIcons(){
      document.querySelectorAll('canvas.ico[data-art]').forEach(cv=>{
        const a=ART[cv.dataset.art];if(!a)return;const c=cv.getContext('2d');c.clearRect(0,0,9,9);
        put(c,a,Math.floor((9-a[0].length)/2),Math.floor((9-a.length)/2));});
    }
    drawLogo();drawScene();drawIcons();fit();
    addEventListener('resize',fit);addEventListener('orientationchange',fit);
    setInterval(()=>{const m=document.getElementById('menu');if(m&&!m.classList.contains('hide')){frame^=1;drawScene();}},500);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  }catch(e){}
})();
