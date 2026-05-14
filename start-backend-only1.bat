@echo off
title OptiCRM - Backend

echo.
echo ================================================================
echo              OptiCRM - Backend uniquement
echo ================================================================
echo.

where java >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Java n'est pas installe.
    echo Installez Java 21+: https://adoptium.net/
    pause
    exit /b 1
)

where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERREUR] Maven n'est pas installe.
    echo Installez Maven: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

cd /d D:\OptiCRM\crm-backend

echo [INFO] Demarrage du backend Spring Boot...
echo [INFO] API: http://localhost:8080
echo [INFO] Swagger: http://localhost:8080/swagger-ui.html
echo.

mvn spring-boot:run -pl crm-api -DskipTests
