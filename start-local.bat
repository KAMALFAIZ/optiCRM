@echo off
title OptiCRM - Demarrage local
color 0A

echo.
echo ================================================================
echo              OptiCRM  -  Demarrage local
echo ================================================================
echo.

:: ── Chemins (pas d'espaces dans ces chemins, pas besoin de guillemets imbriques) ──
set "ROOT=%~dp0"
set "JAR=%ROOT%crm-backend\crm-api\target\crm-api-1.0.0-SNAPSHOT.jar"
set "FRONTEND=%ROOT%crm-web"

:: Java : chercher d'abord JAVA_HOME, sinon Adoptium par defaut
if not defined JAVA_HOME (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
)
set "JAVA=%JAVA_HOME%\bin\java.exe"

:: ── Verifications ────────────────────────────────────────────────────────────
if not exist "%JAVA%" (
    echo [ERREUR] Java 21 introuvable : %JAVA%
    echo Definissez la variable JAVA_HOME ou installez Adoptium JDK 21.
    echo https://adoptium.net/
    pause
    exit /b 1
)

if not exist "%JAR%" (
    echo [ERREUR] JAR introuvable : %JAR%
    echo Compilez d'abord avec : cd crm-backend ^&^& mvn clean package -DskipTests
    pause
    exit /b 1
)

if not exist "%FRONTEND%\package.json" (
    echo [ERREUR] Dossier frontend introuvable : %FRONTEND%
    pause
    exit /b 1
)

:: ── Scripts intermediaires (evite les guillemets imbriques dans cmd /k) ─────
set "BACK_CMD=%TEMP%\opticrm_backend.cmd"
set "FRONT_CMD=%TEMP%\opticrm_frontend.cmd"

(
    echo @echo off
    echo title OptiCRM Backend
    echo color 0B
    echo echo.
    echo echo  OptiCRM Backend - port 8081
    echo echo  Swagger : http://localhost:8081/swagger-ui.html
    echo echo.
    echo "%JAVA%" -jar "%JAR%" --server.port=8081
    echo pause
) > "%BACK_CMD%"

(
    echo @echo off
    echo title OptiCRM Frontend
    echo color 0E
    echo echo.
    echo echo  OptiCRM Frontend - port 3009
    echo echo  Application : http://localhost:3009
    echo echo.
    echo cd /d "%FRONTEND%"
    echo npm run dev
    echo pause
) > "%FRONT_CMD%"

:: ── Verifier si le port 8081 est deja occupe ─────────────────────────────────
netstat -ano | findstr ":8081 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] Port 8081 deja occupe - le backend tourne probablement deja.
    echo        Lancement du frontend seulement...
    echo.
    goto start_frontend
)

:: ── Backend ──────────────────────────────────────────────────────────────────
echo [1/2] Demarrage du backend Spring Boot (port 8081)...
start "OptiCRM Backend" cmd /k "%BACK_CMD%"
echo       http://localhost:8081/swagger-ui.html
echo.

echo       Attente du backend (max 30s)...
set /a count=0
:wait_backend
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:8081/actuator/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend pret.
    goto start_frontend
)
set /a count+=1
if %count% lss 15 goto wait_backend
echo [AVERT] Backend lent - lancement du frontend quand meme.
echo.

:: ── Frontend ─────────────────────────────────────────────────────────────────
:start_frontend
echo [2/2] Demarrage du frontend React (port 3009)...
start "OptiCRM Frontend" cmd /k "%FRONT_CMD%"
echo.

echo       Attente du frontend...
set /a count=0
:wait_frontend
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:3009 >nul 2>&1
if %ERRORLEVEL% equ 0 goto done
set /a count+=1
if %count% lss 15 goto wait_frontend

:done
echo.
echo ================================================================
echo                    OptiCRM est pret !
echo ================================================================
echo.
echo   Application  :  http://localhost:3009
echo   API          :  http://localhost:8081
echo   Swagger      :  http://localhost:8081/swagger-ui.html
echo.
echo   Identifiants :
echo     Email      :  admin@opticrm.local
echo     Mot de passe: Admin123!
echo.
echo   Pour arreter : fermez les fenetres "OptiCRM Backend"
echo                  et "OptiCRM Frontend"
echo ================================================================
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:3009"

pause
