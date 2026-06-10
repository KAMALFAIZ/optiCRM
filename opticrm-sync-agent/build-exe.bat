@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM  Build OptiCRMSyncAgent.exe (Windows app installer)
REM
REM  Prérequis :
REM   - JDK 21 installé (avec jpackage)
REM   - WiX Toolset 3.x dans le PATH (https://wixtoolset.org/) pour MSI
REM     OU lancer en mode app-image (pas d'installeur, juste un dossier)
REM ─────────────────────────────────────────────────────────────────────────

setlocal
set APP_NAME=OptiCRMSyncAgent
set APP_VERSION=1.0.0
set MAIN_CLASS=com.opticrm.agent.AgentApplication
set VENDOR=Kasoft

REM Étape 1 : Build le fat JAR
echo [1/3] Compilation Maven...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo Echec compilation
    exit /b 1
)

REM Étape 2 : Préparation du dossier d'input pour jpackage
echo [2/3] Préparation des fichiers...
if exist build rmdir /s /q build
mkdir build\input
copy target\opticrm-sync-agent.jar build\input\

REM Étape 3 : jpackage
echo [3/3] Génération de l'EXE avec JRE bundlé...
jpackage ^
    --type app-image ^
    --name %APP_NAME% ^
    --app-version %APP_VERSION% ^
    --vendor "%VENDOR%" ^
    --input build\input ^
    --main-jar opticrm-sync-agent.jar ^
    --main-class org.springframework.boot.loader.launch.JarLauncher ^
    --dest build\dist ^
    --add-modules "java.base,java.desktop,java.logging,java.management,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.security.jgss,java.sql,java.transaction.xa,java.xml,jdk.crypto.cryptoki,jdk.crypto.ec,jdk.unsupported" ^
    --java-options "-Djava.awt.headless=false" ^
    --java-options "-Dspring.main.headless=false" ^
    --java-options "-Dfile.encoding=UTF-8" ^
    --java-options "-Xmx512m"

if errorlevel 1 (
    echo Echec jpackage — verifiez que jpackage est dans le PATH
    exit /b 1
)

echo.
echo ============================================================
echo  Build termine !
echo  Application : build\dist\%APP_NAME%\
echo  Executable  : build\dist\%APP_NAME%\%APP_NAME%.exe
echo ============================================================
echo.
echo Pour creer un installeur MSI (necessite WiX dans le PATH) :
echo   jpackage --type msi --name %APP_NAME% --app-version %APP_VERSION% ^
echo            --vendor "%VENDOR%" --input build\input ^
echo            --main-jar opticrm-sync-agent.jar ^
echo            --main-class org.springframework.boot.loader.launch.JarLauncher ^
echo            --dest build\dist --win-menu --win-shortcut --win-dir-chooser
endlocal
