@echo off
chcp 65001 >nul
title Publicar DJ Roger no GitHub Pages
color 0d

echo ========================================================
echo   🐻 DJ ROGER - Publicador GitHub Pages 🚀
echo ========================================================
echo.
echo Se você ainda não criou o repositório no GitHub:
echo 1. Acesse: https://github.com/new
echo 2. Coloque o nome do repositório como: djroger
echo 3. Deixe como PUBLIC e clique em "Create repository"
echo.
echo ========================================================
echo.
set /p REPO_URL="Cole aqui o link do seu repositório no GitHub: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERRO] Você não digitou a URL do repositório!
    pause
    exit /b
)

echo.
echo Conectando ao repositório: %REPO_URL%
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Enviando arquivos do DJ Roger para o GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ Sucesso! Arquivos enviados com sucesso!
    echo ========================================================
    echo.
    echo Agora, para ativar o GitHub Pages:
    echo 1. Vá na aba "Settings" do seu repositório no GitHub.
    echo 2. Clique em "Pages" no menu da esquerda.
    echo 3. Em "Branch", selecione "main" e clique em "Save".
    echo.
    echo Em 1 minuto seu DJ Roger estará online no mundo todo!
    echo ========================================================
) else (
    echo.
    echo [AVISO] Se pediu login ou deu erro de autenticação:
    echo Certifique-se de estar logado na sua conta do GitHub.
)

echo.
pause
