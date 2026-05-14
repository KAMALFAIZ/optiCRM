@echo off
title OptiCRM - Backend

echo.
echo ================================================================
echo              OptiCRM - Backend uniquement
echo ================================================================
echo.

:: Configuration Java et Maven
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
set "MAVEN_HOME=C:\Tools\apache-maven-3.9.6"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERREUR] Java n'est pas trouve dans %JAVA_HOME%
    echo Installez Java 21+: https://adoptium.net/
    pause
    exit /b 1
)

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo [ERREUR] Maven n'est pas trouve dans %MAVEN_HOME%
    echo Installez Maven: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

echo [INFO] Java: %JAVA_HOME%
echo [INFO] Maven: %MAVEN_HOME%
echo.

cd /d "%~dp0crm-backend"

echo [INFO] Compilation de tous les modules...
call "%MAVEN_HOME%\bin\mvn.cmd" clean install -DskipTests
if errorlevel 1 (
    echo.
    echo [ERREUR] La compilation a echoue.
    pause
    exit /b 1
)

echo.
echo [INFO] Demarrage du backend Spring Boot...
echo [INFO] API: http://localhost:8081
echo [INFO] Swagger: http://localhost:8081/swagger-ui.html
echo.

call "%MAVEN_HOME%\bin\mvn.cmd" spring-boot:run -pl crm-api -DskipTests

if errorlevel 1 (
    echo.
    echo [ERREUR] Le backend s'est arrete avec une erreur.
    pause
)
