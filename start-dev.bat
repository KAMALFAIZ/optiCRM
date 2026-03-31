@echo off
title OptiCRM - Demarrage

echo.
echo ================================================================
echo                    OptiCRM - Demarrage
echo ================================================================
echo.

REM Verifier si Docker est installe
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou pas dans le PATH.
    echo Installez Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verifier si Docker tourne
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker n'est pas demarre.
    echo Veuillez demarrer Docker Desktop et reessayer.
    pause
    exit /b 1
)

echo [1/4] Demarrage des services Docker (PostgreSQL + Redis)...
cd /d D:\OptiCRM
docker compose -f docker-compose.dev.yml up -d

if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Impossible de demarrer les conteneurs Docker.
    pause
    exit /b 1
)

echo [OK] Services Docker demarres.
echo.

REM Attendre que PostgreSQL soit pret
echo [2/4] Attente de PostgreSQL...
:wait_postgres
docker exec opticrm-postgres pg_isready -U opticrm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo     En attente de PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo [OK] PostgreSQL est pret.
echo.

REM Demarrer le backend dans une nouvelle fenetre
echo [3/4] Demarrage du backend Spring Boot...
start "OptiCRM Backend" cmd /k "cd /d D:\OptiCRM\crm-backend && echo Demarrage du backend... && mvn spring-boot:run -pl crm-api -DskipTests"

REM Attendre un peu avant de demarrer le frontend
timeout /t 5 /nobreak >nul

REM Demarrer le frontend dans une nouvelle fenetre
echo [4/4] Demarrage du frontend React...
start "OptiCRM Frontend" cmd /k "cd /d D:\OptiCRM\crm-web && echo Demarrage du frontend... && npm run dev"

echo.
echo ================================================================
echo                  Demarrage en cours...
echo ================================================================
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8080
echo   API Docs : http://localhost:8080/swagger-ui.html
echo.
echo   Identifiants par defaut :
echo     Email       : admin@opticrm.com
echo     Mot de passe: Admin@123
echo.
echo ================================================================
echo   Appuyez sur une touche pour fermer cette fenetre.
echo   Les services continueront de fonctionner.
echo ================================================================
echo.
pause
