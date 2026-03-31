@echo off
title OptiCRM - Demarrage des services
color 0A

echo ============================================
echo         OptiCRM - Demarrage
echo ============================================
echo.

:: Configuration des chemins
set MAVEN_HOME=C:\Tools\apache-maven-3.9.6
set PATH=%PATH%;%MAVEN_HOME%\bin

:: Verifier si Docker est en cours d'execution
echo [1/4] Verification de Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas demarre. Veuillez demarrer Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker est en cours d'execution.
echo.

:: Demarrer PostgreSQL et Redis via Docker Compose
echo [2/4] Demarrage de PostgreSQL et Redis...
cd /d D:\OptiCRM
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de demarrer les conteneurs Docker.
    pause
    exit /b 1
)
echo [OK] PostgreSQL et Redis sont demarres.
echo.

:: Attendre que PostgreSQL soit pret
echo Attente de PostgreSQL...
timeout /t 5 /nobreak >nul

:: Demarrer le backend Spring Boot
echo [3/4] Demarrage du backend Spring Boot (port 8081)...
cd /d D:\OptiCRM\crm-backend
start "OptiCRM Backend" cmd /k "set PATH=%PATH%;%MAVEN_HOME%\bin && mvn spring-boot:run -pl crm-api -Dspring-boot.run.arguments=--server.port=8081"
echo [OK] Backend en cours de demarrage...
echo.

:: Attendre que le backend demarre
echo Attente du backend (15 secondes)...
timeout /t 15 /nobreak >nul

:: Demarrer le frontend React
echo [4/4] Demarrage du frontend React (port 3000)...
cd /d D:\OptiCRM\crm-web
start "OptiCRM Frontend" cmd /k "npm run dev"
echo [OK] Frontend en cours de demarrage...
echo.

echo ============================================
echo         OptiCRM demarre avec succes!
echo ============================================
echo.
echo Services disponibles:
echo   - Frontend:  http://localhost:3000
echo   - Backend:   http://localhost:8081
echo   - Swagger:   http://localhost:8081/swagger-ui.html
echo.
echo Identifiants par defaut:
echo   - Email:     admin@opticrm.com
echo   - Mot de passe: Admin123!
echo.
echo Pour arreter les services, fermez les fenetres
echo de commande ou utilisez stop-opticrm.bat
echo ============================================
echo.
pause
