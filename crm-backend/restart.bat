@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo ============================================
echo   OptiCRM Backend - Rebuild et Restart
echo ============================================

echo.
echo [1/3] Arret du backend sur le port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 " 2^>nul') do (
    echo     Arret PID %%a
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 >nul

echo.
echo [2/3] Build Maven (sans tests)...
call mvn clean install -DskipTests
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================
    echo ERREUR BUILD - Voir les erreurs ci-dessus
    echo ============================================
    pause
    exit /b 1
)

echo.
echo [3/3] Demarrage Spring Boot...
echo OK - Les migrations Flyway V47+V48 vont s'executer automatiquement
java -Duser.timezone=UTC ^
     -Dspring.flyway.locations=filesystem:crm-api/src/main/resources/db/migration ^
     -Dspring.flyway.validate-on-migrate=false ^
     -jar crm-api\target\crm-api-1.0.0-SNAPSHOT.jar

echo [Backend] Exit code: %ERRORLEVEL%
pause
