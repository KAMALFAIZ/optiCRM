@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot
set PATH=%JAVA_HOME%\bin;C:\Tools\apache-maven-3.9.6\bin;%PATH%
cd /d D:\OptiCRM\crm-backend
mvn clean package -DskipTests -q > D:\mvn_rebuild.txt 2>&1
echo Exit: %ERRORLEVEL%
