@echo off
REM =====================================================
REM OptiCRM On-Premise — Script d'installation (Windows)
REM Lancez PowerShell en administrateur, puis : .\install.bat
REM =====================================================

setlocal enabledelayedexpansion
set COMPOSE_FILE=docker-compose.onpremise.yml

echo ======================================
echo   OptiCRM On-Premise  Installation
echo ======================================
echo.

REM 1. Verifier Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker n'est pas installe.
    echo Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker detecte.

REM 2. Verifier Docker Compose
docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Docker Compose n'est pas disponible.
    pause
    exit /b 1
)
echo [OK] Docker Compose detecte.

REM 3. Creer .env si absent
if not exist ".env" (
    echo.
    echo [INFO] Fichier .env introuvable. Creation depuis le modele...
    copy ".env.onpremise.example" ".env"
    echo.
    echo [IMPORTANT] Configurez le fichier .env avant de continuer :
    echo   - DB_SA_PASSWORD  : mot de passe SQL Server
    echo   - REDIS_PASSWORD  : mot de passe Redis
    echo   - LICENSE_KEY     : cle de licence (optionnel)
    echo.
    notepad .env
    echo.
    pause
)

REM 4. Demarrer les services
echo.
echo [INFO] Demarrage des services OptiCRM...
docker compose -f %COMPOSE_FILE% pull
docker compose -f %COMPOSE_FILE% up -d

REM 5. Attendre l'API
echo.
echo [INFO] Attente du demarrage de l'API (2-3 minutes)...
set COUNT=0
:WAIT_LOOP
set /a COUNT+=1
if %COUNT% gtr 30 goto TIMEOUT
timeout /t 10 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:80/actuator/health 2>nul | findstr "200" >nul
if %ERRORLEVEL% equ 0 goto READY
echo|set /p=.
goto WAIT_LOOP

:TIMEOUT
echo.
echo [AVERTISSEMENT] L'API n'a pas repondu. Verifiez les logs :
echo   docker compose -f %COMPOSE_FILE% logs api
goto END

:READY
echo.
echo [OK] OptiCRM est demarre !

:END
echo.
echo ======================================
echo   OptiCRM accessible sur :
echo   http://localhost
echo ======================================
echo.
echo Commandes utiles :
echo   Arreter    : docker compose -f %COMPOSE_FILE% down
echo   Logs       : docker compose -f %COMPOSE_FILE% logs -f
echo.
pause
