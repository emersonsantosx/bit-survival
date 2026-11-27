#!/usr/bin/env bash
# Assina o APK com a chave fixa do Bit Survival, para um APK novo atualizar o instalado sem desinstalar.
# Usado pelo build.yml. A chave vem dos segredos do repositorio em CHAVE_B64 (arquivo PKCS12 em base64) e CHAVE_SENHA.
# Sem os segredos, assina com uma chave temporaria e marca o APK com o sufixo "-chave-temporaria".
set -euo pipefail
APK=$1
RAIZ=$(cd "$(dirname "$0")/.." && pwd)
FERRAMENTAS=$(ls -d "$ANDROID_HOME"/build-tools/*/ | sort -V | tail -1)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
erro() { echo "::error::$1"; exit 1; }

if [ -n "${CHAVE_B64:-}" ] && [ -n "${CHAVE_SENHA:-}" ]; then
  TIPO=fixa
  printf %s "$CHAVE_B64" | tr -d '[:space:]' | base64 -d > "$TMP/chave.p12" || erro "ANDROID_KEYSTORE_BASE64 nao e um base64 valido: copie o valor inteiro de novo"
elif [ -n "${CHAVE_B64:-}${CHAVE_SENHA:-}" ]; then
  erro "So um dos segredos esta cadastrado: precisa de ANDROID_KEYSTORE_BASE64 e ANDROID_KEYSTORE_PASSWORD"
else
  TIPO=temporaria
  echo "::warning::Segredos da chave nao cadastrados: APK assinado com chave temporaria (para atualizar sera preciso desinstalar)"
  CHAVE_SENHA=$(openssl rand -hex 16)
  export CHAVE_SENHA
  keytool -genkeypair -storetype PKCS12 -keystore "$TMP/chave.p12" -alias bitsurvival -keyalg RSA -keysize 2048 -validity 30 \
    -dname "CN=Temporaria" -storepass:env CHAVE_SENHA -keypass:env CHAVE_SENHA
fi

"$FERRAMENTAS/apksigner" sign --ks "$TMP/chave.p12" --ks-key-alias bitsurvival --ks-pass env:CHAVE_SENHA --key-pass env:CHAVE_SENHA "$APK" \
  || erro "Nao foi possivel assinar: confira os dois segredos"
"$FERRAMENTAS/apksigner" verify --print-certs "$APK" > "$TMP/certificado.txt"
DIGITAL=$(grep -m1 "certificate SHA-256 digest" "$TMP/certificado.txt" | awk '{print $NF}')
echo "Chave $TIPO, certificado SHA-256: $DIGITAL"
if [ "$TIPO" = fixa ]; then
  ESPERADA=$(tr -d ':[:space:]' < "$RAIZ/android/assinatura.sha256" | tr 'A-F' 'a-f')
  [ "$DIGITAL" = "$ESPERADA" ] || erro "A chave dos segredos nao e a do jogo (android/assinatura.sha256)"
  SUFIXO=
else
  SUFIXO=-chave-temporaria
fi
echo "sufixo=$SUFIXO" >> "${GITHUB_OUTPUT:-/dev/null}"
