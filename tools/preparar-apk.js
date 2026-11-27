/* Monta a pasta www do app Android: o mesmo jogo do link, mais o que so existe no APK (cordova.js e android/app.js).
   A fonte das telas e o PeerJS, que o link carrega da internet, vao DENTRO do app (pacotes npm de versao fixa, baixados no build.yml).
   Uso: node tools/preparar-apk.js <pasta de destino> <pasta node_modules com os pacotes>. A pasta de destino e apagada e criada de novo.
   O repositorio nao e alterado. */
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const destino = process.argv[2] && path.resolve(process.argv[2]);
const pacotes = process.argv[3] && path.resolve(process.argv[3]);
const falhar = msg => { console.error(msg); process.exit(1); };
/* a pasta e apagada: nunca a raiz (ou acima dela), e dentro do repositorio so uma pasta chamada www (evita apagar js/ ou css/ por engano) */
const dentro = !!destino && destino.startsWith(raiz + path.sep);
if (!destino || !pacotes || destino === raiz || raiz.startsWith(destino + path.sep) || (dentro && path.basename(destino) !== 'www')) {
  falhar('Uso: node tools/preparar-apk.js <pasta de destino> <pasta node_modules> (dentro do repositorio, o destino precisa se chamar www)');
}
const fonte = path.join(pacotes, '@fontsource', 'press-start-2p'), peer = path.join(pacotes, 'peerjs');
for (const f of [path.join(fonte, '400.css'), path.join(peer, 'dist', 'peerjs.min.js')]) if (!fs.existsSync(f)) falhar('Falta o arquivo ' + f);
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
for (const nome of ['css', 'js']) fs.cpSync(path.join(raiz, nome), path.join(destino, nome), { recursive: true });
fs.copyFileSync(path.join(raiz, 'android', 'app.js'), path.join(destino, 'js', 'apk.js'));
const copiar = (de, para) => { fs.mkdirSync(path.dirname(path.join(destino, para)), { recursive: true }); fs.copyFileSync(de, path.join(destino, para)); };
/* fonte das telas: o CSS do pacote, apontando para as copias em css/vendor/ (a licenca vai junto) */
const cssFonte = fs.readFileSync(path.join(fonte, '400.css'), 'utf8').replace(/url\((['"]?)\.\/files\/([\w.-]+)\1\)/g, (m, a, nome) => {
  copiar(path.join(fonte, 'files', nome), 'css/vendor/' + nome); return "url('vendor/" + nome + "')";
});
if (!/Press Start 2P/.test(cssFonte) || !/url\('vendor\//.test(cssFonte)) falhar('O CSS da fonte mudou de formato');
fs.writeFileSync(path.join(destino, 'css', 'fonte-telas.css'), cssFonte);
copiar(path.join(peer, 'dist', 'peerjs.min.js'), 'js/vendor/peerjs.min.js');
for (const [pasta, para] of [[fonte, 'css/vendor/LICENSE-fonte'], [peer, 'js/vendor/LICENSE-peerjs']]) if (fs.existsSync(path.join(pasta, 'LICENSE'))) copiar(path.join(pasta, 'LICENSE'), para);

let html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
if (html.split('</body>').length !== 2) falhar('index.html precisa ter exatamente um </body>');
/* tira o Google Fonts do app e usa a copia local */
const linkFonte = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Press\+Start\+2P[^"]*" rel="stylesheet">/;
if (!linkFonte.test(html)) falhar('index.html: nao achei o link da fonte Press Start 2P');
html = html.replace(linkFonte, '<link href="css/fonte-telas.css" rel="stylesheet">').replace(/<link rel="preconnect" href="https:\/\/fonts\.[^>]*>\r?\n?/g, '');
if (/<(link|script)\b[^>]*(href|src)="(https?:)?\/\//i.test(html)) falhar('index.html ainda carrega algo da internet: inclua no app');
fs.writeFileSync(path.join(destino, 'index.html'), html.replace('</body>', () => '<script src="js/vendor/peerjs.min.js"></script>\n<script src="cordova.js"></script>\n<script src="js/apk.js"></script>\n</body>'));
console.log('App montado em ' + destino);
