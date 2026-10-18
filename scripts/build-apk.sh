#!/usr/bin/env bash
# Optimallashtirilgan (release) APK yig'adi va uni Android *debug* kaliti bilan imzolaydi —
# o'z telefoningizga o'rnatish uchun. Play Market uchun EMAS (u yerga o'z kalitingiz kerak).
#
# Ishlatish:  pnpm apk                  # arm64 telefonlar (deyarli hamma zamonaviy telefonlar)
#             pnpm apk aarch64 armv7    # eski 32-bitli telefonlar uchun ham
set -euo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export NDK_HOME="${NDK_HOME:-$(ls -d "$ANDROID_HOME"/ndk/* | sort -V | tail -1)}"
BUILD_TOOLS="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
TARGETS=("${@:-aarch64}")

# Standart Android debug kaliti (paroli hammaga ma'lum: "android"); bir marta yaratiladi.
# Gradle (`pnpm tauri android dev`) ishlatadigan kalitning o'zi olinadi: XDG_CONFIG_HOME o'rnatilgan
# bo'lsa u ~/.config/.android da turadi. Kalitlar har xil bo'lsa telefon APK'ni o'rnatmaydi
# (INSTALL_FAILED_UPDATE_INCOMPATIBLE) va dev build'dan qolgan eski ilova joyida qoladi.
if [ -n "${ANDROID_USER_HOME:-}" ]; then
  ANDROID_USER_DIR="$ANDROID_USER_HOME"
elif [ -n "${XDG_CONFIG_HOME:-}" ] && [ -d "$XDG_CONFIG_HOME/.android" ]; then
  ANDROID_USER_DIR="$XDG_CONFIG_HOME/.android"
else
  ANDROID_USER_DIR="$HOME/.android"
fi
KEYSTORE="$ANDROID_USER_DIR/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
  echo "→ Android debug kaliti yaratilmoqda: $KEYSTORE"
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -storepass android -keypass android \
    -alias androiddebugkey -dname "CN=Android Debug,O=Android,C=US" \
    -keyalg RSA -keysize 2048 -validity 10000
fi

echo "→ Release APK yig'ilmoqda: ${TARGETS[*]}"
pnpm tauri android build --apk --target "${TARGETS[@]}"

APK_DIR=src-tauri/gen/android/app/build/outputs/apk/universal/release
UNSIGNED="$APK_DIR/app-universal-release-unsigned.apk"
[ -f "$UNSIGNED" ] || UNSIGNED="$APK_DIR/app-universal-release.apk" # keystore.properties bilan imzolangan bo'lsa

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
OUT_DIR=apk
OUT="$OUT_DIR/kho-resume-$VERSION.apk"
mkdir -p "$OUT_DIR"

echo "→ Debug kaliti bilan imzolanmoqda"
"$BUILD_TOOLS/zipalign" -f -p 4 "$UNSIGNED" "$OUT.aligned"
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias androiddebugkey --out "$OUT" "$OUT.aligned"
rm -f "$OUT.aligned" "$OUT.idsig"
"$BUILD_TOOLS/apksigner" verify "$OUT"

echo
echo "✓ APK tayyor: frontend/$OUT ($(du -h "$OUT" | cut -f1))"
echo "  USB orqali o'rnatish:  adb install -r $OUT"
