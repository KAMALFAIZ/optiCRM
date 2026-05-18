@echo off
title OptiCRM Frontend (Odyssee)
set ROOT=%~dp0
set FRONTEND_DIR=%ROOT%crm-web
cd /d "%FRONTEND_DIR%"
echo.
echo  ========================================================
echo   Frontend OptiCRM - Odyssee
echo   URL  : http://localhost:3009
echo   Proxy: /api  ^>  http://localhost:8081
echo  ========================================================
echo.
npm run dev
