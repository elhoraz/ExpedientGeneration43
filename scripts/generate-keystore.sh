#!/usr/bin/env bash
# =========================================================================
# Expedient Generation 43 - Production Release Keystore Generator
# =========================================================================

set -e

echo "[Expedient 43] Generating production release keystore..."
mkdir -p android

keytool -genkey -v -keystore android/release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias expedient-release \
  -dname "CN=Expedient Generation, OU=Engineering, O=Expedient, L=Jakarta, ST=DKI, C=ID"

echo "[SUCCESS] Keystore successfully generated at: android/release-key.jks"
echo "Next step: copy android/key.properties.example to android/key.properties and set your passwords."
