@echo off
title FinanzasPro - Finanzas Personales
chcp 65001 > nul
cls

echo ========================================================
echo    🚀 INICIANDO FINANZASPRO (WINDOWS Y ANDROID)
echo ========================================================
echo.
echo  Abriendo navegador y arrancando servidor...
echo.

cd /d "%~dp0"

REM Abrir el navegador en localhost:3000
start http://localhost:3000

REM Iniciar con Node.js o Python según disponibilidad
where node >nul 2>nul
if %errorlevel% equ 0 (
    node server.js
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python server.py
    goto end
)

echo [ERROR] No se encontro Node.js ni Python en el sistema.
echo Puedes abrir directamente el archivo index.html en tu navegador.
start index.html
pause

:end
