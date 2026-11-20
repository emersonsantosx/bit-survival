# Bit Survival

Jogo de sobrevivência 2D em pixel art, feito com HTML, CSS e JavaScript puros (sem framework e sem etapa de compilação). Quatro mapas: floresta, neve, deserto e cidade. Será lançado nas lojas digitais.

## O que tem no jogo

- **Sobrevivência:** fome, sede, frio e vida; coleta, criação de itens, construção (cercas, portões, paredes, baús, poços, plantações, lareiras), pesca, árvores frutíferas e clima (chuva, neve, poças); quem sangra deixa gotas de sangue no chão, que secam e somem (no multiplayer os aliados veem o sangramento uns dos outros).
- **Mundo:** predios com interior, vilas, cidade com ruas e carros, veículos (carro, moto de neve, quadriciclo, buggy; levam até 2 jogadores, motorista e passageiro), animais, zumbis, missões e mapa.
- **Multiplayer P2P (até 4 jogadores):** o host cria a sala e passa o código de 6 caracteres; os amigos entram, marcam **PRONTO** e só o host inicia a partida. Sala cheia e partida já iniciada são recusadas; quem cai durante a partida mantém a vaga e volta pelo mesmo nome. Usa PeerJS (WebRTC), sem servidor próprio.
- **Celular e computador:** o jogo detecta o dispositivo. No celular usa os controles de toque; no computador usa teclado e mouse (a tela de controles mostra as teclas).
- **Desempenho:** chão, ruas e cercas em blocos/figurinhas prontos e bichos distantes em passo maior, sem alterar o visual.

## Como jogar no navegador

Abra o `index.html` em qualquer navegador moderno. Não precisa de servidor. O multiplayer precisa de internet (o PeerJS é carregado da rede).

## Como gerar o APK

O workflow `.github/workflows/build.yml` compila o APK de debug (Cordova) a cada push na `main` e guarda o arquivo como artefato da execução (aba Actions). A etapa de compilação tenta de novo até 4 vezes porque o download das dependências às vezes falha por limite de requisições.

## Estrutura

| Pasta ou arquivo | O que tem |
|---|---|
| `index.html` | A página e os botões da HUD |
| `css/estilo.css` | Todo o visual |
| `js/01-base.js` ... `js/32-passageiro.js` | O jogo, em scripts clássicos carregados na ordem do número. Alguns pontos de partida: `12-crafting-multiplayer.js` (rede), `29-sala-multiplayer.js` (tela da sala), `28-modo-desktop.js` (teclado e mouse), `30-desempenho.js` (blocos prontos de chão e ruas), `31-rastro-sangue.js` (gotas de sangue de quem está sangrando, também dos aliados no multiplayer), `32-passageiro.js` (até 2 jogadores por veículo: motorista e passageiro) |
| `tests/` | Testes automáticos (Playwright) |
| `tools/dependencias.js` | Gera `docs/dependencias.md`, o mapa de quem usa o quê entre os arquivos `js/` |
| `config.xml`, `icon.png`, `.github/workflows/build.yml` | Geração do APK (Cordova) |

Os arquivos `js/` compartilham funções globais; a ordem do número é a ordem de carregamento. Para ver as dependências: `node tools/dependencias.js`.

## Testes

```
npm install
npm run instalar-navegador   # só na primeira vez
npm test                     # roda todos os testes
npm run test:saves           # só os saves
node tests/teste-cerca.js    # um teste específico
```

Cada teste abre o jogo num navegador sem tela, simula o que for preciso e termina com código 1 se algo falhar. Os testes rodam sozinhos a cada PR (`.github/workflows/testes.yml`). `tests/teste-multiplayer-sala.js` cobre a sala de 4 jogadores e `tests/teste-desempenho.js` confere que a imagem otimizada é igual ao desenho direto e `tests/teste-desempenho-arvores.js` protege o desempenho em florestas densas (tiros pela grade, sombras em cache). `tests/teste-dano-visual.js` confere as marcas de dano em tudo que se quebra (`js/33-dano-visual.js`).

## Saves

Os saves ficam no `localStorage` (`minisurv_save_1` a `minisurv_save_4`). Ao mudar o formato, suba `SAVE_VER` e mantenha a migração dos saves antigos; `tests/teste-saves.js` confere o ciclo salvar e carregar em todos os mapas.

## Fluxo de trabalho

- Uma branch nova por mudança, a partir da `main` atualizada.
- Nunca commitar direto na `main`: tudo entra por PR.
- Antes de abrir o PR: `npm test`.
- Ao fim de cada mudança, regerar `docs/dependencias.md` (se der conflito ao mesclar, é só rodar `node tools/dependencias.js` de novo).
- Mexeu em algo que gera o mundo? Não mude a ordem nem a quantidade de sorteios da semente, senão os mundos salvos e o multiplayer deixam de bater.
