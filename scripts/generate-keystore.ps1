# =========================================================================
# Expedient Generation 43 - Production Release Keystore Generator (PowerShell)
# =========================================================================

Write-Host "[Expedient 43] Mendeteksi Java JDK keytool..." -ForegroundColor Cyan

$keytoolPath = $null

if (Get-Command keytool -ErrorAction SilentlyContinue) {
    $keytoolPath = "keytool"
} elseif ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) {
    $keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
} else {
    $found = Get-ChildItem "C:\Program Files\Java\jdk*\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $keytoolPath = $found.FullName
    } else {
        $foundX86 = Get-ChildItem "C:\Program Files (x86)\Java\jdk*\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($foundX86) {
            $keytoolPath = $foundX86.FullName
        }
    }
}

if (-not $keytoolPath) {
    Write-Host "[ERROR] keytool.exe tidak ditemukan. Pastikan Java JDK terinstal." -ForegroundColor Red
    exit 1
}

Write-Host "[Expedient 43] Menggunakan keytool: $keytoolPath" -ForegroundColor Green

if (-not (Test-Path "android")) {
    New-Item -ItemType Directory -Path "android" | Out-Null
}

& $keytoolPath -genkey -v -keystore "android\release-key.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias expedient-release -dname "CN=Expedient Generation, OU=Engineering, O=Expedient, L=Jakarta, ST=DKI, C=ID"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Keystore berhasil dibuat di: android\release-key.jks" -ForegroundColor Green
    Write-Host "Langkah selanjutnya: salin android\key.properties.example ke android\key.properties dan masukkan password Anda." -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Gagal membuat keystore." -ForegroundColor Red
}
