#!/usr/bin/env bash
# 智慧水务 - 生产环境启动脚本 (Linux 服务器)

echo "============================================"
echo "  智慧水务通用项目 - 生产环境"
echo "============================================"
echo ""

# ========== 数据库配置（务必修改为实际地址） ==========
export MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
export MYSQL_PORT="${MYSQL_PORT:-3306}"
export MYSQL_USERNAME="${MYSQL_USERNAME:-root}"
export MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
export MYSQL_DATABASE="${MYSQL_DATABASE:-nest-admin}"

# ========== Redis 配置 ==========
export REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# ========== TDengine 配置 ==========
export TDENGINE_HOST="${TDENGINE_HOST:-127.0.0.1}"
export TDENGINE_PORT="${TDENGINE_PORT:-6041}"
export TDENGINE_PASSWORD="${TDENGINE_PASSWORD:-taosdata}"

# ========== JWT 密钥（生产环境务必修改为强密钥） ==========
export JWT_SECRET="${JWT_SECRET:-}"

# ========== 文件服务器地址 ==========
export APP_FILE_DOMAIN="${APP_FILE_DOMAIN:-http://your-domain.com}"

echo "配置信息:"
echo "  MySQL:    ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
echo "  Redis:    ${REDIS_HOST}:${REDIS_PORT}"
echo "  TDengine: ${TDENGINE_HOST}:${TDENGINE_PORT}"
echo ""

echo "正在编译全部微服务..."
npm run build:all

echo ""
echo "正在启动网关..."
NODE_ENV=production node dist/apps/api-gateway/main
