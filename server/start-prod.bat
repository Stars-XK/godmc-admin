@echo off
chcp 65001 >nul
title 智慧水务 - 生产环境启动

echo ============================================
echo   智慧水务通用项目 - 生产环境
echo ============================================
echo.

REM ========== 数据库配置（务必修改为实际地址） ==========
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
set MYSQL_USERNAME=root
set MYSQL_PASSWORD=
set MYSQL_DATABASE=nest-admin

REM ========== Redis 配置 ==========
set REDIS_HOST=127.0.0.1
set REDIS_PORT=6379
set REDIS_PASSWORD=

REM ========== TDengine 配置 ==========
set TDENGINE_HOST=127.0.0.1
set TDENGINE_PORT=6041
set TDENGINE_PASSWORD=taosdata

REM ========== JWT 密钥（生产环境务必修改为强密钥） ==========
set JWT_SECRET=

REM ========== 文件服务器地址（生产环境改为可访问域名） ==========
set APP_FILE_DOMAIN=http://your-domain.com

echo 配置信息:
echo   MySQL:    %MYSQL_HOST%:%MYSQL_PORT%/%MYSQL_DATABASE%
echo   Redis:    %REDIS_HOST%:%REDIS_PORT%
echo   TDengine: %TDENGINE_HOST%:%TDENGINE_PORT%
echo.

echo 正在编译全部微服务...
call npm run build:all

echo.
echo 正在启动网关...
set NODE_ENV=production
node dist/apps/api-gateway/main

pause
