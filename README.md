# Bit Survival

Jogo de sobrevivência 2D em pixel art, feito com HTML, CSS e JavaScript puros (sem framework e sem etapa de compilação). Quatro mapas: floresta, neve, deserto e cidade. Será lançado nas lojas digitais.

## O que tem no jogo

- **Sobrevivência:** fome, sede, frio e vida; coleta, criação de itens, construção (cercas, portões, paredes, baús, poços, plantações, lareiras), pesca, árvores frutíferas e clima (chuva, neve, poças); quem sangra deixa gotas de sangue no chão, que secam e somem (no multiplayer os aliados veem o sangramento uns dos outros).
- **Mundo:** predios com interior, vilas, cidade com ruas e carros, veículos (carro, moto de neve, quadriciclo, buggy; levam até 2 jogadores, motorista e passageiro), animais, zumbis, missões e mapa.
- **Multiplayer P2P (até 4 jogadores):** o host cria a sala e passa o código de 6 caracteres; os amigos entram, marcam **PRONTO** e só o host inicia a partida. Sala cheia e partida já iniciada são recusadas; quem cai durante a partida mantém a vaga e volta pelo mesmo nome. Usa PeerJS (WebRTC), sem servidor próprio.
- **Celular e computador:** o jogo detecta o dispositivo. No celular usa os controles de toque; no computador usa teclado e mouse (a tela de controles mostra as teclas).
- **Desempenho:** chão, ruas e cercas em blocos/figurinhas prontos e bichos distantes em passo maior, sem alterar o visual.

## Avisos na tela

Avisos sobre o que o personagem fez (inventário cheio, sem munição, o que pegou, comeu ou usou) usam `say(texto)`: texto simples que sobe da cabeça dele e some, sem fundo (`js/11-pesca-update.js`). Status (sangrando, frio, calor, queimadura), avisos do jogo (clima, missões, save, multiplayer) e dicas continuam em `toast(texto)`, no topo da tela.

## Como jogar no navegador

Abra o `index.html` em qualquer navegador moderno. Não precisa de servidor. O multiplayer precisa de internet (o PeerJS é carregado da rede).

## Como gerar o APK

O workflow `.github/workflows/build.yml` compila o APK de debug (Cordova) a cada push na `main` (e nas branches `ajuste/apk-...`, para testar antes do merge) e guarda o arquivo como artefato da execução (aba Actions). A etapa de compilação tenta de novo até 4 vezes porque o download das dependências às vezes falha por limite de requisições.

O APK é o mesmo jogo do link, com ajustes que só existem nele (o link não carrega nada disso):

- abre deitado (os dois lados) e em tela cheia, usando também a área da câmera, com a HUD afastada do recorte; a tela não apaga;
- sem a tela "gire o celular" e sem o botão de tela cheia;
- botão ou gesto de voltar fecha o que estiver aberto, pausa a partida e, no menu, pede um segundo toque para fechar o jogo;
- ao minimizar, o progresso é salvo, a partida solo pausa e o som para (no multiplayer a partida continua);
- o teclado não cobre o campo do chat nem os campos dos menus.

Onde fica: `config.xml` (orientação e tela cheia), `android/app.js` (comportamento no app), `android/plugin-bit/` (parte nativa) e `tools/preparar-apk.js` (monta a pasta do app). Cada APK de debug é assinado com uma chave diferente: antes de instalar um novo, desinstale o anterior (o progresso salvo no app é apagado junto). Sem internet, a fonte das telas e o multiplayer ainda não funcionam.

## Estrutura

| Pasta ou arquivo | O que tem |
|---|---|
| `index.html` | A página e os botões da HUD |
| `css/estilo.css` | Todo o visual (posições, tamanhos e telas) |
| `css/hud-pixel.css` | Aparência pixel art da HUD (molduras, cores, fonte, estados). Só visual: carrega depois do `estilo.css` e não mexe em função |
| `css/sprites-hud.css`, `css/fonte-hud.css` | **Gerados**: molduras 9-slice e fonte pixel BitHUD embutidas (funcionam offline) |
| `js/01-base.js` ... `js/35-veiculo-agua.js` | O jogo, em scripts clássicos carregados na ordem do número. Alguns pontos de partida: `12-crafting-multiplayer.js` (rede), `29-sala-multiplayer.js` (tela da sala), `28-modo-desktop.js` (teclado e mouse), `30-desempenho.js` (blocos prontos de chão e ruas), `31-rastro-sangue.js` (gotas de sangue de quem está sangrando, também dos aliados no multiplayer, e o desenho das manchas de zumbi: poças em pixel art de várias formas no chão e nuvem recortada pelo contorno na água), `32-passageiro.js` (até 2 jogadores por veículo: motorista e passageiro), `34-caminhos-naturais.js` (ruas e estradas da floresta, deserto e neve: máscara orgânica com dobras em arco, serpenteio e borda irregular, sobre o mesmo esqueleto de `roads`) |
| `tests/` | Testes automáticos (Playwright) |
| `tools/gerar-sprites-hud.py`, `tools/gerar-fonte-hud.py` | Geram `css/sprites-hud.css` e `css/fonte-hud.css` (paleta e desenho das molduras ficam no topo do gerador; rodar de novo depois de mudar) |
| `tools/dependencias.js` | Gera `docs/dependencias.md`, o mapa de quem usa o quê entre os arquivos `js/` |
| `config.xml`, `icon.png`, `.github/workflows/build.yml` | Geração do APK (Cordova) |
| `android/`, `tools/preparar-apk.js` | O que só existe no APK e a montagem da pasta do app (ver "Como gerar o APK") |

Os arquivos `js/` compartilham funções globais; a ordem do número é a ordem de carregamento. Para ver as dependências: `node tools/dependencias.js`.

## Testes

```
npm install
npm run instalar-navegador   # só na primeira vez
npm test                     # roda todos os testes
npm run test:saves           # só os saves
node tests/teste-cerca.js    # um teste específico
```

Cada teste abre o jogo num navegador sem tela, simula o que for preciso e termina com código 1 se algo falhar. Os testes rodam sozinhos a cada PR (`.github/workflows/testes.yml`). `tests/teste-multiplayer-sala.js` cobre a sala de 4 jogadores e `tests/teste-desempenho.js` confere que a imagem otimizada é igual ao desenho direto e `tests/teste-desempenho-arvores.js` protege o desempenho em florestas densas (tiros pela grade, sombras em cache). `tests/teste-dano-visual.js` confere as marcas de dano em tudo que se quebra (`js/33-dano-visual.js`). `tests/teste-partida-curta.js` roda 7 minutos de jogo seguidos (mais de meio dia, com o dia virando) em cada mapa e confere números válidos, dia virando, salvamento e carregamento. `tests/teste-avisos-jogador.js` confere os avisos sobre o jogador (texto que sobe da cabeça do personagem, em neon: contorno escuro, brilho na cor do item e miolo claro) e a katana reta. `tests/teste-clima-aleatorio.js` confere o sorteio do clima (chance, duração e intensidade de cada rodada). `tests/teste-chuva-sono.js` garante que dormir não apaga nem inventa chuva (o clima segue o relógio). `tests/teste-arvore-transparencia.js` confere que a copa fica translúcida atrás do jogador com transição suave (sem salto de um quadro). `tests/teste-gelo-veiculo.js` confere que o veículo (parado ou andando devagar) pesa e quebra o gelo do lago do mapa de Neve, em dois buracos, e que em velocidade só atravessando não quebra. `tests/teste-caminhos-naturais.js` confere a máscara dos caminhos (só nos mapas naturais, mesma semente = mesma máscara, estrada que serpenteia, terreno igual ao desenho, chão pronto = desenho direto). `tests/teste-sangue-zumbis.js` confere as poças de sangue de zumbi (várias formas, sempre a mesma por posição, secando com o tempo) e a nuvem na água (recortada pelo lago, some antes da poça), sem mudar o save nem o limite de 24 manchas. `tests/teste-arsenal-visual.js` confere que o arsenal de armas (botão de trocar arma) usa o mesmo visual do inventário e do crafting (painel plano quadrado, borda grossa, sombra dura, fonte pixel, arma equipada em verde-musgo) e continua equipando ao tocar. `tests/teste-multiplayer-visual.js` confere o visual da sala do multiplayer, do painel de chat e do menu MULTIPLAYER (painel plano, borda quadrada de 3 px, sombra dura, fonte pixel, você em âmbar, pronto em musgo, INICIAR bloqueado em cinza). `tests/teste-multiplayer-entrada.js` confere a tela ENTRAR EM SALA (erro em painel dizendo o que houve e o que fazer, botão bloqueado só enquanto conecta, código da última sala já preenchido e esquecido quando o host encerra a sala). `tests/teste-camera-borda.js` confere a câmera travada nas bordas do mundo (`camOrigin` em `js/14-arquitetura-luz-ambiente.js`): nos 4 mapas, nas bordas, cantos e com o zoom do veículo, nunca aparece o preto de fora e no meio do mundo o jogador continua no centro da tela. `tests/teste-caminhada-fluida.js` confere a caminhada fluida do personagem (`humanBody`, `humanDraw` e `lookFace` em `js/13-render-personagens.js`): pernas alternam e o corpo sobe 1 px a cada passo, correr balança mais, parado ele respira, o corpo gira aos poucos pelo caminho mais curto enquanto a mira (`P.face`) continua instantânea, e zumbis, menu de skins, vara de pesca e save ficam como antes. `tests/teste-missoes.js` cobre as missões (lista só pela semente, progresso, conclusão e próxima missão).

## Saves

Os saves ficam no `localStorage` (`minisurv_save_1` a `minisurv_save_4`). Ao mudar o formato, suba `SAVE_VER` e mantenha a migração dos saves antigos; `tests/teste-saves.js` confere o ciclo salvar e carregar em todos os mapas.

Como o carregamento trata saves antigos hoje (protegido por `tests/teste-saves-antigos.js`): save de **outra versão** não é carregado nem apagado (aparece "incompatível com esta versão"); save da versão atual feito antes de um campo novo existir carrega com o padrão, então **todo campo novo do save precisa ser opcional na leitura**; o save do slot único antigo (`minisurv_save`) vai para o primeiro slot livre. Se o carregamento falhar no meio, `continueGame` apaga o save desse slot, então um campo novo mal lido pode custar o jogo do jogador. O dia do jogo dura 10 minutos (`DAY_SECONDS`); o save guarda `ds` e, se for de um dia de outro tamanho (os antigos, de 480 s), `saveDayScale` reescala a hora, as plantas, as frutas e o loot. As missões não entram no save: ao continuar, a lista é sorteada de novo.

## Fluxo de trabalho

- Uma branch nova por mudança, a partir da `main` atualizada.
- Nunca commitar direto na `main`: tudo entra por PR.
- Antes de abrir o PR: `npm test`.
- Ao fim de cada mudança, regerar `docs/dependencias.md` (se der conflito ao mesclar, é só rodar `node tools/dependencias.js` de novo).
- Sprites e luz: vista de cima, sol a noroeste (realce a noroeste, tom escuro a sudeste) e sombra projetada sempre dinâmica (`shadow`, `shadowBody`, `shadowCar`, `treeShadow`, `bldShadow`, e `boxShadow`/`boxShadowPath` para caixas: cerca, parede, telhado, baú, poço, tora), nunca uma elipse fixa. Peças vizinhas que se encostam (cerca, parede, telhado) juntam as sombras num caminho só e preenchem uma vez, para o escuro não somar nas emendas. Plantas e postes usam `groundShadowBatch` (`js/14-arquitetura-luz-ambiente.js`), no mesmo esquema; nunca pinte sombra dentro do sprite. Decoração alta (poste, estátua, palmeira, guarda-sol...) entra nas tabelas `DECO_POLO` e `DECO_CAIXA` (`js/13-render-personagens.js`): a sombra tem o tamanho da peça. Um `case` novo em `drawDecoration0` não pode repetir um tipo que já existe (o primeiro vence e o segundo nunca roda). Objeto que gira (arma na mão) não leva a luz junto: `drawHeld` desenha num quadro auxiliar e aplica `pxLight` (noroeste claro, sudeste escuro) já no espaço da tela; itens no chão usam `pxCanvasLit`. Ao desenhar um ícone novo, escreva a luz sempre a noroeste (borda de cima e da esquerda clara). Em objeto que gira, a luz não gira junto: nos veículos use `RL` e `vehRim` (`js/13-render-personagens.js`). `tests/teste-luz-veiculos.js`, `tests/teste-luz-estruturas.js`, `tests/teste-luz-plantas.js`, `tests/teste-luz-decoracoes.js` e `tests/teste-luz-itens.js` guardam essa regra.
- Mexeu em algo que gera o mundo? Não mude a ordem nem a quantidade de sorteios da semente, senão os mundos salvos e o multiplayer deixam de bater.
