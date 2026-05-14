@echo off
REM =============================================================================
REM  SAV Agent - Installation Windows Service
REM =============================================================================
REM  Prérequis : Java 21+ installé, NSSM ou WinSW disponible
REM  Usage     : install-windows.bat [NOM_AGENT] [CLE_API] [URL_CRM]
REM =============================================================================

setlocal enabledelayedexpansion

set SERVICE_NAME=SavAgent
set DISPLAY_NAME=OptiCRM SAV Agent
set DESCRIPTION=Agent local OptiCRM pour la communication avec le serveur CRM central

set AGENT_NAME=%~1
set API_KEY=%~2
set CENTRAL_URL=%~3
set INSTALL_DIR=C:\OptiCRM\SavAgent

if "%AGENT_NAME%"=="" (
    echo.
    echo Usage: install-windows.bat ^<NOM_AGENT^> ^<CLE_API^> ^<URL_CRM^>
    echo.
    echo Exemple:
    echo   install-windows.bat "SAV-Agent-01" "votre_cle_api" "wss://crm.example.com/ws/agent"
    echo.
    exit /b 1
)

if "%API_KEY%"=="" (
    echo ERREUR: La cle API est obligatoire
    exit /b 1
)

if "%CENTRAL_URL%"=="" (
    set CENTRAL_URL=wss://crm.example.com/ws/agent
)

echo.
echo ============================================
echo   Installation SAV Agent
echo ============================================
echo   Nom         : %AGENT_NAME%
echo   URL CRM     : %CENTRAL_URL%
echo   Repertoire  : %INSTALL_DIR%
echo ============================================
echo.

REM Créer le répertoire d'installation
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"
if not exist "%INSTALL_DIR%\config" mkdir "%INSTALL_DIR%\config"

REM Copier le JAR
copy /Y sav-agent.jar "%INSTALL_DIR%\sav-agent.jar"

REM Générer le fichier de configuration
(
echo # SAV Agent - Configuration
echo sav-agent:
echo   central-url: %CENTRAL_URL%
echo   api-key: %API_KEY%
echo   agent-name: %AGENT_NAME%
echo.
echo   local-database:
echo     enabled: false
echo     # url: jdbc:sqlserver://localhost:1433;databaseName=erp_local;encrypt=false
echo     # username: readonly_user
echo     # password: votre_mot_de_passe
echo.
echo   local-http:
echo     enabled: true
echo     base-url: http://localhost:8090
echo.
echo   shell:
echo     enabled: false
echo.
echo   security:
echo     strict-mode: true
echo     allowed-sql-patterns:
echo       - "^SELECT .+ FROM stock .+"
echo       - "^SELECT .+ FROM articles .+"
echo     allowed-http-prefixes:
echo       - "http://localhost:8090/api/"
echo     allowed-file-paths:
echo       - "C:/OptiCRM/exports"
echo       - "C:/OptiCRM/imports"
echo.
echo management:
echo   server:
echo     port: 9091
echo.
echo logging:
echo   file:
echo     name: "%INSTALL_DIR:\=/%/logs/sav-agent.log"
) > "%INSTALL_DIR%\config\application.yml"

REM Installer comme service Windows avec sc.exe
echo.
echo Installation du service Windows...

sc create %SERVICE_NAME% ^
    binpath= "java -jar -Xms128m -Xmx512m -Dspring.config.additional-location=file:%INSTALL_DIR%\config\application.yml %INSTALL_DIR%\sav-agent.jar" ^
    displayname= "%DISPLAY_NAME%" ^
    start= auto

sc description %SERVICE_NAME% "%DESCRIPTION%"

REM Démarrer le service
echo Demarrage du service...
sc start %SERVICE_NAME%

echo.
echo ============================================
echo   Installation terminee !
echo ============================================
echo   Service     : %SERVICE_NAME%
echo   Config      : %INSTALL_DIR%\config\application.yml
echo   Logs        : %INSTALL_DIR%\logs\sav-agent.log
echo   Health      : http://localhost:9091/actuator/health
echo.
echo   Commandes utiles :
echo     sc stop %SERVICE_NAME%
echo     sc start %SERVICE_NAME%
echo     sc delete %SERVICE_NAME%
echo ============================================

endlocal
