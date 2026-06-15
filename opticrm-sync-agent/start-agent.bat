@echo off
rem Lance l'agent de synchronisation OptiCRM <-> Sage.
rem Double-cliquez ce fichier (ou lancez-le depuis un terminal).
cd /d "%~dp0"

where java >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Java introuvable dans le PATH.
    echo Installez un JRE/JDK 21 ou ajoutez java au PATH.
    pause
    exit /b 1
)

if not exist "target\opticrm-sync-agent.jar" (
    echo [ERREUR] target\opticrm-sync-agent.jar introuvable.
    echo Compilez d'abord avec : mvn clean package
    pause
    exit /b 1
)

echo Demarrage de l'agent OptiCRM Sync...
java -Djava.awt.headless=false -Dfile.encoding=UTF-8 -jar "target\opticrm-sync-agent.jar"

echo.
echo L'agent s'est arrete (code %errorlevel%).
pause
