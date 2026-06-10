@echo off
REM Genere un installeur MSI Windows (necessite WiX Toolset 3.x)

setlocal
set APP_NAME=OptiCRMSyncAgent
set APP_VERSION=1.0.0
set VENDOR=Kasoft

echo Compilation Maven...
call mvn clean package -DskipTests
if errorlevel 1 exit /b 1

if exist build rmdir /s /q build
mkdir build\input
copy target\opticrm-sync-agent.jar build\input\

echo Generation du MSI...
jpackage ^
    --type msi ^
    --name %APP_NAME% ^
    --app-version %APP_VERSION% ^
    --vendor "%VENDOR%" ^
    --input build\input ^
    --main-jar opticrm-sync-agent.jar ^
    --main-class org.springframework.boot.loader.launch.JarLauncher ^
    --dest build\dist ^
    --win-menu ^
    --win-menu-group "OptiCRM" ^
    --win-shortcut ^
    --win-dir-chooser ^
    --win-per-user-install ^
    --add-modules "java.base,java.desktop,java.logging,java.management,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.security.jgss,java.sql,java.transaction.xa,java.xml,jdk.crypto.cryptoki,jdk.crypto.ec,jdk.unsupported" ^
    --java-options "-Djava.awt.headless=false" ^
    --java-options "-Dspring.main.headless=false" ^
    --java-options "-Dfile.encoding=UTF-8" ^
    --java-options "-Xmx512m"

if errorlevel 1 (
    echo Echec — WiX Toolset 3.x doit etre installe et dans le PATH
    exit /b 1
)

echo.
echo MSI cree : build\dist\%APP_NAME%-%APP_VERSION%.msi
endlocal
