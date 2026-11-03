# Bit Survival

Jogo de sobrevivência 2D em pixel art, feito com HTML, CSS e JavaScript puros (sem framework e sem etapa de compilação). Quatro mapas: floresta, neve, deserto e cidade. Será lançado nas lojas digitais.

## Como jogar no navegador

Abra o `index.html` em qualquer navegador moderno. Não precisa de servidor.

## Estrutura

| Pasta ou arquivo | O que tem |
|---|---|
| `index.html` | A página e os botões da HUD |
| `css/estilo.css` | Todo o visual |
| `js/01-base.js` ... `js/19-cerca.js` | O jogo, em scripts clássicos carregados na ordem do número |
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

Cada teste abre o jogo num navegador sem tela, simula o que for preciso e termina com código 1 se algo falhar. Os testes rodam sozinhos a cada PR (`.github/workflows/testes.yml`).

## Saves

Os saves ficam no `localStorage` (`minisurv_save_1` a `minisurv_save_4`). Ao mudar o formato, suba `SAVE_VER` e mantenha a migração dos saves antigos; `tests/teste-saves.js` confere o ciclo salvar e carregar em todos os mapas.

## Fluxo de trabalho

- Uma branch nova por mudança, a partir da `main` atualizada.
- Nunca commitar direto na `main`: tudo entra por PR.
- Antes de abrir o PR: `npm test`.
- Ao fim de cada mudança, regerar `docs/dependencias.md`.
