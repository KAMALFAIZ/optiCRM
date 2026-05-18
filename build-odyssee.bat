@echo off
title OptiCRM - Build (Odyssee)
color 0E

echo.
echo  ============================================================
echo             OptiCRM - Build Maven (Odyssee)
echo  ============================================================
echo.

set ROOT=%~dp0
set BACKEND_DIR=%ROOT%crm-backend
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

:: Verifier Maven
where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Maven introuvable dans le PATH.
    echo Installez Maven ou ajoutez-le au PATH.
    pause
    exit /b 1
)

:: Arreter le backend s'il tourne (port 8081)
echo [1/2] Arret du backend en cours (port 8081)...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8081 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo     [OK] Port 8081 libere.
echo.

:: Build Maven
echo [2/2] Build Maven en cours...
echo     Commande : mvn clean install -DskipTests
echo.
cd /d "%BACKEND_DIR%"
call mvn clean install -DskipTests

if %ERRORLEVEL% equ 0 (
    color 0A
    echo.
    echo  ============================================================
    echo             BUILD REUSSI !
    echo  ============================================================
    echo.
    echo   JAR produit :
    echo   %BACKEND_DIR%\crm-api\target\crm-api-1.0.0-SNAPSHOT.jar
    echo.
    echo   Lancez maintenant : start-odyssee.bat
    echo  ============================================================
) else (
    color 0C
    echo.
    echo  ============================================================
    echo             ECHEC DU BUILD !
    echo  ============================================================
    echo.
    echo   Consultez les erreurs ci-dessus.
    echo  ============================================================
)
echo.
pause
