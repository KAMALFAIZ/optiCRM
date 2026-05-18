@echo off
title OptiCRM Backend (Odyssee)
set ROOT=%~dp0
set BACKEND_DIR=%ROOT%crm-backend
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "%BACKEND_DIR%"

echo.
echo  ========================================================
echo   Backend OptiCRM - Odyssee
echo   Base : opticrm_odyssee sur kasoft.selfip.net
echo   Port : 8081
echo  ========================================================
echo.

java -Duser.timezone=UTC -Dserver.port=8081 "-Dspring.datasource.url=jdbc:sqlserver://kasoft.selfip.net;databaseName=opticrm_odyssee;encrypt=false;trustServerCertificate=true;sendStringParametersAsUnicode=true" -Dspring.datasource.username=sa "-Dspring.datasource.password=SQL@2019" "-Djwt.secret=nACEtKBelKLKlXDlE3kjoYODI9/BrCIcEUknrEXjEddQ/XvzspzZW9bTbUmbzI38g98TMd5z8kaaqbcX/L6Vkw==" -Dspring.flyway.locations=filesystem:crm-api/src/main/resources/db/migration -Dspring.flyway.validate-on-migrate=false "-Dspring.flyway.ignore-migration-patterns=*:failed" -jar crm-api\target\crm-api-1.0.0-SNAPSHOT.jar
