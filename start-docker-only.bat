@echo off
title OptiCRM - Docker Services

echo.
echo ================================================================
echo            OptiCRM - Services Docker uniquement
echo ================================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker n'est pas installe.
    pause
    exit /b 1
)

docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker n'est pas demarre.
    pause
    exit /b 1
)

cd /d D:\OptiCRM

echo [INFO] Demarrage des conteneurs Docker...
docker compose -f docker-compose.dev.yml up -d

echo.
echo ================================================================
echo                Services Docker demarres
echo ================================================================
echo.
echo   PostgreSQL : localhost:5432
echo     - Base    : opticrm
echo     - User    : opticrm
echo     - Password: opticrm123
echo.
echo   Redis : localhost:6379
echo.
echo ================================================================
echo.

docker compose -f docker-compose.dev.yml ps

echo.
pause
