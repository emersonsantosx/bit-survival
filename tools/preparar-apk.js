/* Monta a pasta www do app Android: o mesmo jogo do link, mais o que so existe no APK (cordova.js e android/app.js).
   Uso: node tools/preparar-apk.js <pasta de destino>. A pasta e apagada e criada de novo. O repositorio nao e alterado. */
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const destino = process.argv[2] && path.resolve(process.argv[2]);
/* a pasta e apagada: nunca a raiz (ou acima dela), e dentro do repositorio so uma pasta chamada www (evita apagar js/ ou css/ por engano) */
const dentro = !!destino && destino.startsWith(raiz + path.sep);
if (!destino || destino === raiz || raiz.startsWith(destino + path.sep) || (dentro && path.basename(destino) !== 'www')) {
  console.error('Uso: node tools/preparar-apk.js <pasta de destino> (dentro do repositorio, a pasta precisa se chamar www)'); process.exit(1);
}
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
for (const nome of ['css', 'js']) fs.cpSync(path.join(raiz, nome), path.join(destino, nome), { recursive: true });
fs.copyFileSync(path.join(raiz, 'android', 'app.js'), path.join(destino, 'js', 'apk.js'));
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
if (html.split('</body>').length !== 2) { console.error('index.html precisa ter exatamente um </body>'); process.exit(1); }
fs.writeFileSync(path.join(destino, 'index.html'), html.replace('</body>', () => '<script src="cordova.js"></script>\n<script src="js/apk.js"></script>\n</body>'));
console.log('App montado em ' + destino);
