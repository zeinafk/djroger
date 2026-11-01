@echo off
chcp 65001 >nul
title DJ Roger - Enviar para GitHub
color 0b

echo ========================================================
echo   🐻 DJ ROGER - Enviando para zeinafk/djroger...
echo ========================================================
echo.

cd /d "%~dp0"
git branch -M main
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ Sucesso! Arquivos enviados para o GitHub!
    echo ========================================================
    echo.
    echo Agora no seu navegador:
    echo 1. Va em Settings do seu repositorio:
    echo    https://github.com/zeinafk/djroger/settings/pages
    echo 2. Em "Branch", selecione "main" e clique em "Save".
    echo.
    echo Em 1 minuto seu link estara ativo em:
    echo https://zeinafk.github.io/djroger/
    echo ========================================================
) else (
    echo.
    echo Se pediu autorizacao na tela, aprove para continuar.
)

echo.
pause
