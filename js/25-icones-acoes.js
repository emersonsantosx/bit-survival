/* ============ ICONES DAS ACOES (botao de interagir e botao de sair do veiculo) ============
   Regras do conjunto, para tudo ficar com cara de uma familia so:
   - o icone mostra O QUE VAI ACONTECER (porta fechada = vai abrir? nao: mostra o resultado: ABRIR mostra a porta aberta, FECHAR a porta fechada);
   - entrar/sentar/deitar = seta amarela para BAIXO sobre o objeto; sair/levantar = seta amarela para CIMA;
   - o veiculo muda com o mapa, igual ao do jogo: carro (cidade), quadriciclo (floresta), buggy (deserto) e trenó (neve);
   - 13 colunas de largura, contorno 'k' marrom escuro, mesma paleta PXPAL do resto do jogo, desenhados para escala 3 (botao de 64 px).
   Tudo e PXG (grade de letras) para passar pelo mesmo pxIcon/pxData dos demais icones. */
(function(){
const W=13;
const padTo=(g,w)=>g.map(r=>{const t=Math.max(0,w-r.length),l=Math.floor(t/2);return '.'.repeat(l)+r+'.'.repeat(t-l);});
const ARR_DN=['..YYY..','..YYY..','YYYYYYY','.YYYYY.','..YYY..','...Y...'];   // seta grossa, legivel em 3x
const ARR_UP=ARR_DN.slice().reverse();
const compose=(top,base)=>padTo(top,W).concat([ '.'.repeat(W) ],padTo(base,W));

/* ---- veiculos (lado) ---- */
const CAR=['...kkkkkkk...','..kSbbSbbSk..','.kSSbbSbbSSk.','kkkkkkkkkkkkk','kRRRRRRRRRRYk','kRRRRRRRRRRRk','kKKKkRRRkKKKk','kKSKk...kKSKk','.kKk.....kKk.'];
const ATV=['.....kkk.....','....kSSSkkk..','...kkkkkkRRk.','..kRRRRRRRRRk','.kRRRRRRRRRRk','kKKKkkkkkKKKk','kKSSKRRRkKSSK','kKSSKk..kKSSK','.kKKk....kKKk'];
const BUGGY=['..kkkkkkkkk..','..k..SSS..k..','..kkkkkkkkk..','kOOOOOOOOOOOk','kOOOOOOOOOOYk','.kKKKk.kKKKk.','kKSSKkkkKSSKk','kKSSKk.kKSSKk','.kKKk...kKKk.'];
const SLED=['.........kkk.','..kkkkkkkRRRk','.kRRRRRRRRRRk','kRRYRRRRRRRRk','kkkkkkkkkkkkk','kSSSSSSSSSSSk','sS.........Sk','kkkkkkkkkkkk.'];
const VEH={car:CAR,atv:ATV,buggy:BUGGY,sled:SLED};

for(const k in VEH){PXG['a_'+k+'_in']=compose(ARR_DN,VEH[k]);PXG['a_'+k+'_out']=compose(ARR_UP,VEH[k]);}

/* ---- tronco e cama ---- */
const LOGB=['.kkkkkkkkkk.','kEeNNNNNNNNk','kEeNnnnnNNNk','kEeNNNNNNNNk','.kkkkkkkkkk.'];
const BED=['NN.........','NN.........','NNWWWBBBBB.','NNWWWBBBBB.','NNNNNNNNNNN','NN.......NN','NN.......NN'];
PXG.a_log_sit=compose(ARR_DN,LOGB);
PXG.a_log_up=compose(ARR_UP,LOGB);
PXG.a_bed_up=compose(ARR_UP,BED);
PXG.a_bed_z=padTo(['.......YYYY','.........Y.','........Y..','.......YYYY'],W).concat(['.'.repeat(W)],padTo(BED,W));

/* ---- portas, portao e bau (mostram o resultado da acao) ---- */
PXG.a_door=['.kkkkkkkkk.','kNNNNNNNNNk','kNnnnnnnnNk','kNnNNNNNnNk','kNnNnnnNnNk','kNnNnnnNnNk','kNnNNNNNnNk','kNnnnnnnYNk','kNnnnnnnnNk','kNnnnnnnnNk','kNnnnnnnnNk','kkkkkkkkkkk'];
PXG.a_door_open=['.kkkkkkkkk.','kNNNNNNNNNk','kNKKKKKKKNk','kNnKKKKKKNk','kNnnKKYKKNk','kNnnKKKKKNk','kNnnKKKKKNk','kNnnKKKKKNk','kNnKKKKKKNk','kNnKKKKKKNk','kNKKKKKKKNk','kkkkkkkkkkk'];
PXG.a_gate_open=['kNk.......kNk','kNkNNN....kNk','kNkNkNNN..kNk','kNkNNNNNN.kNk','kNkNkNNN..kNk','kNkNNN....kNk','kNk.......kNk','kkk.......kkk'];
PXG.a_chest_open=['.kkkkkkkkk.','kNNNNNNNNNk','kNeeeeeeeNk','kNNNNNNNNNk','.kkkkkkkkk.','...........','kkkkkkkkkkk','kYYYWYYYYYk','kNNNNNNNNNk','kNNNNYNNNNk','kNNNNNNNNNk','.kkkkkkkkk.'];

/* ---- horta ---- */
PXG.a_sprout=['....G.G....','...GGGGG...','....gGg....','.....g.....','.kkkkkkkkk.','kNnNNnNNnNk','kNNnNNNnNNk','.kkkkkkkkk.'];
PXG.a_can=['..kkkkk......','.kSSSSSk..kk.','kSSSSSSSkkSSk','kSssSSSSSSSSk','kSSSSSSSkk.Sk','kSSSSSSSk..kk','.kkkkkkk..B.B','...........B.'];
PXG.a_basket=['...R.R..G...','..RRRRR.GG..','.kRRkRRkG...','kNNNNNNNNNk.','kNnNnNnNnNk.','.kNnNnNnNk..','..kkkkkkkk..'];

/* ---- escolha do icone do botao de interagir ---- */
/* ic = nome do icone; o texto (btnText) segue so como rotulo de acessibilidade. TG = alvo de pickTarget() */
function actionIcon(btnText,TG,P_){
  const vk=window.vehKind?vehKind():'car';
  if(P_.fish)return 'rod';
  if(P_.sleeping)return 'a_bed_up';
  if(P_.sitting)return 'a_log_up';
  if(TG){
    switch(TG.k){
      case'veh':return 'a_'+vk+'_in';
      case'log':return 'a_log_sit';
      case'bed':return 'a_bed_z';
      case'door':return TG.dr&&TG.dr.open?'a_door':'a_door_open';
      case'fgate':return TG.f&&TG.f.o?(TG.f.g===3?'a_door':'gate'):(TG.f&&TG.f.g===3?'a_door_open':'a_gate_open');
      case'chest':case'stash':return 'a_chest_open';
      case'tap':case'well':return 'drop';
      case'fruit':return 'a_basket';
      case'plot':return ({ARAR:'hoe',PLANTAR:'a_sprout',REGAR:'a_can',COLHER:'a_basket'})[TG.act]||'c_hand';
    }
  }
  return ({'ÁGUA':'drop',ASSAR:'c_flame'})[btnText]||'c_hand';
}
const ARIA={ABRIR:'Abrir',SENTAR:'Sentar',LEVANTAR:'Levantar',ENTRAR:'Entrar no veículo',DORMIR:'Dormir',PORTA:'Abrir porta','PORTÃO':'Abrir portão',FECHAR:'Fechar',COLHER:'Colher','ÁGUA':'Beber água',ASSAR:'Assar',RECOLHER:'Recolher a linha'};
window.actionIcon=actionIcon;window.ACTION_ARIA=ARIA;
})();
