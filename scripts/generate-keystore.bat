@echo off
setlocal enabledelayedexpansion
REM =========================================================================
REM Expedient Generation 43 - Production Release Keystore Generator
REM =========================================================================

echo [Expedient 43] Generating production release keystore...
if not exist "android" mkdir android

set "KEYTOOL_CMD="

where keytool >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "KEYTOOL_CMD=keytool"
)

if not defined KEYTOOL_CMD (
    if defined JAVA_HOME (
        if exist "%JAVA_HOME%\bin\keytool.exe" (
            set "KEYTOOL_CMD=%JAVA_HOME%\bin\keytool.exe"
        )
    )
)

if not defined KEYTOOL_CMD (
    for /d %%D in ("C:\Program Files\Java\jdk*") do (
        if exist "%%D\bin\keytool.exe" (
            set "KEYTOOL_CMD=%%D\bin\keytool.exe"
        )
    )
)

if not defined KEYTOOL_CMD (
    for /d %%D in ("C:\Program Files (x86)\Java\jdk*") do (
        if exist "%%D\bin\keytool.exe" (
            set "KEYTOOL_CMD=%%D\bin\keytool.exe"
        )
    )
)

if not defined KEYTOOL_CMD (
    echo [ERROR] keytool is not recognized and no JDK was found in standard directories.
    echo Please set JAVA_HOME or add JDK bin to PATH.
    exit /b 1
)

echo Using keytool: "!KEYTOOL_CMD!"

if "!KEYTOOL_CMD!"=="keytool" (
    keytool -genkey -v -keystore android\release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias expedient-release -dname "CN=Expedient Generation, OU=Engineering, O=Expedient, L=Jakarta, ST=DKI, C=ID"
) else (
    "!KEYTOOL_CMD!" -genkey -v -keystore android\release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias expedient-release -dname "CN=Expedient Generation, OU=Engineering, O=Expedient, L=Jakarta, ST=DKI, C=ID"
)

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Keystore successfully generated at: android\release-key.jks
    echo Next step: copy android\key.properties.example to android\key.properties and set your passwords.
) else (
    echo [ERROR] Failed to generate keystore.
)
