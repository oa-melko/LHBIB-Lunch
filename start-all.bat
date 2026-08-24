@echo off
chcp 65001 >nul
REM ============================================================
REM start-all.bat - LHBIB-Lunch : lance le serveur d'equipe.
REM   Serveur unique Express + socket.io : port 3001.
REM   Il sert le build de ui/dist : les telephones ouvrent
REM   http://192.168.100.134:3001 sur le meme Wi-Fi.
REM
REM Projet volontairement HORS du schema 60XX/61XX : il garde
REM ses ports d'origine (3001 equipe, 5173 dev).
REM
REM Pour developper avec rechargement a chaud, ce n'est pas ce
REM script : c'est "npm run dev" (serveur 3001 + Vite 5173).
REM ============================================================
title LHBIB-Lunch - Demarrage

cd /d "%~dp0"

if not exist "node_modules" (
    echo [ERREUR] node_modules absent - lance d'abord : npm install
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [AVERTISSEMENT] Pas de build dist - le serveur servira du vide.
    echo Lance : npm run build
    echo.
)

echo.
echo  Demarrage de LHBIB-Lunch sur le port 3001...
echo.

start "LHBIB SERVEUR 3001" cmd /k "cd /d "%~dp0" && npm start"

timeout /t 4 /nobreak >nul
start "" "http://localhost:3001"

echo   Equipe   : http://192.168.100.134:3001
echo   Ce PC    : http://localhost:3001
echo   Arret    : .\stop-all.bat
echo.
exit /b 0
