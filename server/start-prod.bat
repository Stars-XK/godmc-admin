@echo off
setlocal enabledelayedexpansion
title Smart Water - Production

echo ============================================
echo   Smart Water Platform - Production
echo ============================================
echo.

REM ========== Database (REQUIRED - change to actual values) ==========
set "MYSQL_HOST=127.0.0.1"
set "MYSQL_PORT=3306"
set "MYSQL_USERNAME=root"
set "MYSQL_PASSWORD="
set "MYSQL_DATABASE=nest-admin"

REM ========== Redis ==========
set "REDIS_HOST=127.0.0.1"
set "REDIS_PORT=6379"
set "REDIS_PASSWORD="

REM ========== TDengine ==========
set "TDENGINE_HOST=127.0.0.1"
set "TDENGINE_PORT=6041"
set "TDENGINE_PASSWORD=taosdata"

REM ========== JWT (REQUIRED - set a strong secret) ==========
set "JWT_SECRET="

REM ========== File server domain ==========
set "APP_FILE_DOMAIN=http://your-domain.com"

echo Config:
echo   MySQL:    %MYSQL_HOST%:%MYSQL_PORT%/%MYSQL_DATABASE%
echo   Redis:    %REDIS_HOST%:%REDIS_PORT%
echo   TDengine: %TDENGINE_HOST%:%TDENGINE_PORT%
echo.

echo Building all services...
call npm run build:all

echo.
echo Starting gateway...
set "NODE_ENV=production"
node dist/apps/api-gateway/main

endlocal
