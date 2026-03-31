@echo off
title OptiCRM - Arret des services

echo.
echo ================================================================
echo                    OptiCRM - Arret
echo ================================================================
echo.

echo [1/2] Arret des conteneurs Docker...
cd /d D:\OptiCRM
docker compose -f docker-compose.dev.yml down

echo [OK] Conteneurs Docker arretes.
echo.

echo [2/2] Fermeture des processus Java et Node...

REM Arreter les processus Java (backend Spring Boot)
taskkill /F /IM java.exe >nul 2>nul
echo     Processus Java arretes.

REM Arreter les processus Node (frontend Vite)
taskkill /F /IM node.exe >nul 2>nul
echo     Processus Node arretes.

echo.
echo ================================================================
echo           Tous les services ont ete arretes.
echo ================================================================
echo.
pause
