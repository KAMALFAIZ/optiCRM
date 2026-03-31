@echo off
title OptiCRM - Arret des services
color 0C

echo ============================================
echo         OptiCRM - Arret des services
echo ============================================
echo.

:: Arreter les processus Node.js (frontend)
echo [1/3] Arret du frontend...
taskkill /F /IM node.exe >nul 2>&1
echo [OK] Frontend arrete.
echo.

:: Arreter les processus Java (backend)
echo [2/3] Arret du backend...
taskkill /F /IM java.exe >nul 2>&1
echo [OK] Backend arrete.
echo.

:: Arreter les conteneurs Docker
echo [3/3] Arret de PostgreSQL et Redis...
cd /d D:\OptiCRM
docker-compose down
echo [OK] Conteneurs Docker arretes.
echo.

echo ============================================
echo    Tous les services OptiCRM sont arretes
echo ============================================
echo.
pause
