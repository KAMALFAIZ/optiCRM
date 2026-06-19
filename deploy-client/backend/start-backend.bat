@echo off
title OptiCRM Backend
color 0B

REM ============================================================
REM  OptiCRM - Lancement backend (a adapter au client)
REM ============================================================

REM --- Java 21 (adapter le chemin si besoin) ---
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10+7"
set "JAVA=%JAVA_HOME%\bin\java.exe"

REM --- Connexion SQL Server (A MODIFIER pour le client) ---
set "DATABASE_URL=jdbc:sqlserver://localhost;databaseName=opticrm;encrypt=false;trustServerCertificate=true;sendStringParametersAsUnicode=true"
set "DATABASE_USERNAME=sa"
set "DATABASE_PASSWORD=CHANGEZ_MOI"

REM --- Secret JWT (GENERER une valeur unique par client) ---
set "JWT_SECRET=CHANGEZ_MOI_64_CARACTERES_BASE64"

REM --- Migrations Flyway : OBLIGATOIRE a true pour creer les tables (1er deploiement) ---
set "FLYWAY_ENABLED=true"

REM --- Redis (optionnel : seulement pour Google Calendar). Laisser vide si pas de Redis ---
set "REDIS_HOST=localhost"
set "REDIS_PORT=6379"
set "REDIS_PASSWORD="

REM --- URL frontend publique du client ---
set "FRONTEND_BASE_URL=https://crm.client.com"

REM --- (optionnel) Cle Anthropic pour les fonctions IA ---
REM set "ANTHROPIC_API_KEY=sk-ant-..."

"%JAVA%" -Duser.timezone=UTC -Dserver.port=8082 -Dspring.flyway.validate-on-migrate=false -Dmanagement.health.redis.enabled=false -jar "%~dp0crm-api-1.0.0-SNAPSHOT.jar"
pause
