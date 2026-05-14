@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10+7
set PATH=%JAVA_HOME%\bin;%PATH%
set DATABASE_URL=jdbc:sqlserver://kasoft.selfip.net;databaseName=opticrm_odyssee;encrypt=false;trustServerCertificate=true;sendStringParametersAsUnicode=true
echo [run-backend] Starting OptiCRM API (opticrm_odyssee)...
java -Duser.timezone=UTC -Dserver.port=8081 -Dspring.flyway.locations=filesystem:crm-api/src/main/resources/db/migration -Dspring.flyway.validate-on-migrate=false -jar crm-api\target\crm-api-1.0.0-SNAPSHOT.jar
echo [run-backend] Exit code: %ERRORLEVEL%
