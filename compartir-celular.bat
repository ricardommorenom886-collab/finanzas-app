@echo off
title FinanzasPro - Conectar Celular (Android / iOS)
chcp 65001 > nul
cls

echo ====================================================================
echo      📱 FINANZASPRO - CONECTAR Y EJECUTAR EN TU CELULAR
echo ====================================================================
echo.
echo  Verificando la direccion IP de tu PC en la red Wi-Fi...
echo.

cd /d "%~dp0"

REM Obtener IP local con PowerShell
for /f "tokens=*" %%a in ('powershell -Command "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*' | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -ExpandProperty IPAddress -First 1"') do set LOCAL_IP=%%a

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=localhost
)

echo  ------------------------------------------------------------------
echo   METODO 1: En tu celular (misma red Wi-Fi)
echo  ------------------------------------------------------------------
echo   Abre Google Chrome en tu telefono y escribe:
echo.
echo   👉  http://%LOCAL_IP%:3000
echo.
echo   (Tambien puedes abrir http://localhost:3000 en la PC y hacer
echo    clic en 'Movil' para escanear el codigo QR con tu camara)
echo  ------------------------------------------------------------------
echo.
echo   METODO 2: Crear enlace de acceso remoto en la nube (Localtunnel)
echo  ------------------------------------------------------------------
echo   Deseas generar un enlace web seguro (HTTPS) para abrirlo
echo   en tu celular desde cualquier lugar?
echo.
set /p OP="Presiona 'S' para enlace remoto HTTPS, o ENTER para solo Wi-Fi: "

if /i "%OP%"=="S" (
    echo.
    echo Iniciando tunel seguro...
    start http://localhost:3000
    npx -y localtunnel --port 3000
    goto end
)

echo.
echo Iniciando servidor local...
start http://localhost:3000
node server.js

:end
pause
