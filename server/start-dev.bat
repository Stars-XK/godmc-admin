@echo off
chcp 65001 >nul
title 智慧水务 - 开发环境启动

echo ============================================
echo   智慧水务通用项目 - 开发环境
echo ============================================
echo.

REM ========== 数据库配置 ==========
set MYSQL_HOST=139.224.26.134
set MYSQL_PORT=3306
set MYSQL_USERNAME=dma
set MYSQL_PASSWORD=QzwTwHR3YT85AbNf
set MYSQL_DATABASE=dma

REM ========== Redis 配置 ==========
set REDIS_HOST=127.0.0.1
set REDIS_PORT=6379
set REDIS_PASSWORD=123456

REM ========== TDengine 配置 ==========
set TDENGINE_HOST=139.224.26.134
set TDENGINE_PORT=6041
set TDENGINE_PASSWORD=taosdata

REM ========== JWT 密钥 ==========
set JWT_SECRET=dev-jwt-secret-key

REM ========== 服务端口（各微服务端口自动分配） ==========
REM 网关: 8080, auth: 3001, system: 3002, monitor: 3003
REM upload: 3004, tools: 3005, water-basic: 3006
REM data-integration: 3007, alarm: 3008

echo 配置信息:
echo   MySQL:    %MYSQL_HOST%:%MYSQL_PORT%/%MYSQL_DATABASE%
echo   Redis:    %REDIS_HOST%:%REDIS_PORT%
echo   TDengine: %TDENGINE_HOST%:%TDENGINE_PORT%
echo.

echo 正在启动全部微服务...
echo.

call npm run start:all

pause
