@echo off
title Arret OptiCRM
color 0C
chcp 65001 >nul

echo.
echo  ============================================================
echo             OptiCRM - Arret des services
echo  ============================================================
echo.

echo [1/2] Arret du backend (port 8081)...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8081 "') do (
    echo     Arret PID %%p
    taskkill /PID %%p /F >nul 2>&1
)

echo [2/2] Arret du frontend (port 3009)...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3009 "') do (
    echo     Arret PID %%p
    taskkill /PID %%p /F >nul 2>&1
)

echo.
echo  [OK] Services arretes.
echo.
timeout /t 2 /nobreak >nul
