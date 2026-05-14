@echo off
title OptiCRM - Restart complet
color 0A

echo.
echo ================================================================
echo          OptiCRM - Kill + Redemarrage complet
echo ================================================================
echo.

:: ── 1. Tuer les anciens processus ──────────────────────────────────
echo [1/4] Arret des anciens processus...

taskkill /F /IM java.exe   >nul 2>nul && echo   [OK] Java arrete     || echo   [--] Java : aucun process
taskkill /F /IM node.exe   >nul 2>nul && echo   [OK] Node arrete     || echo   [--] Node : aucun process
taskkill /F /IM mvn.cmd    >nul 2>nul

:: Liberer les ports au cas ou
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8081 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3009 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

timeout /t 2 /nobreak >nul
echo.

:: ── 2. Docker (PostgreSQL + Redis) ─────────────────────────────────
echo [2/4] Verification Docker...

docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   [WARN] Docker non disponible - ignoré
) else (
    docker compose -f D:\kasoft-platform\OptiCRM\docker-compose.dev.yml up -d >nul 2>nul
    echo   [OK] Docker services demarres
)
echo.

:: ── 3. Backend Spring Boot ──────────────────────────────────────────
echo [3/4] Demarrage Backend Spring Boot (port 8081)...
start "OptiCRM Backend" cmd /k "color 0B && title Backend Spring Boot && cd /d D:\kasoft-platform\OptiCRM\crm-backend && echo Compilation Maven en cours... && mvn spring-boot:run -pl crm-api -DskipTests"
echo   [OK] Fenetre backend ouverte (attendre ~60s)
echo.

:: Laisser Maven demarrer un peu
timeout /t 5 /nobreak >nul

:: ── 4. Frontend React/Vite ──────────────────────────────────────────
echo [4/4] Demarrage Frontend React (port 3009)...
start "OptiCRM Frontend" cmd /k "color 0E && title Frontend React && cd /d D:\kasoft-platform\OptiCRM\crm-web && echo Installation dependances si besoin... && npm run dev"
echo   [OK] Fenetre frontend ouverte
echo.

:: ── Recap ───────────────────────────────────────────────────────────
echo ================================================================
echo   Services en cours de demarrage...
echo ================================================================
echo.
echo   Frontend  : http://localhost:3009
echo   Backend   : http://localhost:8081
echo   Swagger   : http://localhost:8081/swagger-ui.html
echo.
echo   Login     : admin@opticrm.com
echo   Mot passe : Admin123!
echo.
echo   IMPORTANT : Si le backend echoue, verifier que le serveur
echo   SQL Server est accessible : kasoft.selfip.net:1433
echo   (VPN requis si acces distant)
echo.
echo ================================================================
pause
