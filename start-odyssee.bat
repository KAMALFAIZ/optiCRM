@echo off
title OptiCRM - Odyssee
color 0A

echo.
echo  ============================================================
echo             OptiCRM - Lancement (Odyssee)
echo  ============================================================
echo.

set ROOT=%~dp0
set BACKEND_DIR=%ROOT%crm-backend
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

if not exist "%BACKEND_DIR%\crm-api\target\crm-api-1.0.0-SNAPSHOT.jar" (
    echo [ERREUR] JAR introuvable.
    echo Lancez : mvn clean install -DskipTests depuis crm-backend
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Node.js introuvable dans le PATH.
    pause
    exit /b 1
)

echo [1/3] Liberation des ports 8081 et 3009...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8081 "') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3009 "') do taskkill /PID %%p /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/3] Demarrage du backend Spring Boot (port 8081)...
start "OptiCRM Backend" cmd /k "%ROOT%_backend-odyssee.bat"

echo.
echo     Attente du backend...
:wait_backend
timeout /t 3 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:8081/api/v1/public/tenants/resolve?slug=odyssee 2>nul | findstr "200" >nul
if %ERRORLEVEL% neq 0 (
    echo     En attente...
    goto wait_backend
)
echo     [OK] Backend pret !
echo.

echo [3/3] Demarrage du frontend React (port 3009)...
start "OptiCRM Frontend" cmd /k "%ROOT%_frontend-odyssee.bat"

echo.
echo  ============================================================
echo             OptiCRM est en cours de demarrage !
echo  ============================================================
echo.
echo   Frontend  :  http://localhost:3009
echo   Backend   :  http://localhost:8081
echo   Swagger   :  http://localhost:8081/swagger-ui.html
echo.
echo   Connexion :  admin@odyssee.ma  /  Admin123!
echo   Client    :  Odyssee (opticrm_odyssee)
echo.
echo   Utilisez stop-odyssee.bat pour arreter les services.
echo  ============================================================
echo.
pause

