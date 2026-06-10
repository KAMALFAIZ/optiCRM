@echo off
REM Installation de l'agent OptiCRM Sync comme service Windows via NSSM
REM Prérequis : nssm.exe dans le PATH (https://nssm.cc/download)

set SERVICE_NAME=OptiCRMSyncAgent
set INSTALL_DIR=%~dp0..
set JAR=%INSTALL_DIR%\opticrm-sync-agent.jar
set JAVA_HOME=%JAVA_HOME%
if "%JAVA_HOME%"=="" set JAVA_HOME=C:\Program Files\Java\jdk-21

echo Installing %SERVICE_NAME%...
nssm install %SERVICE_NAME% "%JAVA_HOME%\bin\java.exe" -jar "%JAR%"
nssm set %SERVICE_NAME% AppDirectory "%INSTALL_DIR%"
nssm set %SERVICE_NAME% DisplayName "OptiCRM Sync Agent"
nssm set %SERVICE_NAME% Description "Agent local de synchronisation Sage <-> OptiCRM"
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
nssm set %SERVICE_NAME% AppStdout "%INSTALL_DIR%\logs\service.out.log"
nssm set %SERVICE_NAME% AppStderr "%INSTALL_DIR%\logs\service.err.log"

echo Service installed. Start with: nssm start %SERVICE_NAME%
