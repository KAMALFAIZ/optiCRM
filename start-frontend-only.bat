@echo off
title OptiCRM - Frontend

echo.
echo ================================================================
echo              OptiCRM - Frontend uniquement
echo ================================================================
echo.

cd /d "%~dp0crm-web"

if not exist "node_modules" (
    echo [INFO] Installation des dependances npm...
    call npm install
)

echo [INFO] Demarrage du serveur Vite...
echo [INFO] URL: http://localhost:3000
echo.

npm run dev
