@echo off
setlocal enabledelayedexpansion
title Smart Water - Dev

echo ============================================
echo   Smart Water Platform - Development
echo ============================================
echo.

REM ========== Database ==========
set "MYSQL_HOST=139.224.26.134"
set "MYSQL_PORT=3306"
set "MYSQL_USERNAME=dma"
set "MYSQL_PASSWORD=QzwTwHR3YT85AbNf"
set "MYSQL_DATABASE=dma"

REM ========== Redis ==========
set "REDIS_HOST=127.0.0.1"
set "REDIS_PORT=6379"
set "REDIS_PASSWORD=123456"

REM ========== TDengine ==========
set "TDENGINE_HOST=139.224.26.134"
set "TDENGINE_PORT=6041"
set "TDENGINE_PASSWORD=taosdata"

REM ========== JWT ==========
set "JWT_SECRET=dev-jwt-secret-key"

echo Config:
echo   MySQL:    %MYSQL_HOST%:%MYSQL_PORT%/%MYSQL_DATABASE%
echo   Redis:    %REDIS_HOST%:%REDIS_PORT%
echo   TDengine: %TDENGINE_HOST%:%TDENGINE_PORT%
echo.

echo Starting all services...
echo.

call npm run start:all

endlocal
