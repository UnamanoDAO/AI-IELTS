#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/docker"
ENV_FILE="${DOCKER_DIR}/.env"

echo "▶️  LeanEnglish Docker deploy started"
echo "   Project root: ${PROJECT_ROOT}"

if ! command -v docker &>/dev/null; then
  echo "❌ 未找到 docker，请先安装 docker 后再运行此脚本。" >&2
  exit 1
fi

if ! docker compose version &>/dev/null; then
  if command -v docker-compose &>/dev/null; then
    export DOCKER_COMPOSE="docker-compose"
  else
    echo "❌ 未找到 docker compose，请安装 Docker Compose V2 或 docker-compose。" >&2
    exit 1
  fi
else
  export DOCKER_COMPOSE="docker compose"
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "⚠️  未发现 ${ENV_FILE}，即将从 env.example 生成。请根据实际情况修改变量。"
  cp "${DOCKER_DIR}/env.example" "${ENV_FILE}"
  echo "✅ 已创建 ${ENV_FILE}，请编辑内容后重新运行本脚本。"
  exit 0
fi

cd "${DOCKER_DIR}"

echo "🔧 构建镜像..."
${DOCKER_COMPOSE} build

echo "🚀 启动或更新服务..."
${DOCKER_COMPOSE} up -d

if [ "${RUN_IMPORT:-false}" = "true" ]; then
  echo "📥 RUN_IMPORT=true，执行数据导入..."
  ${DOCKER_COMPOSE} exec backend npm run import
fi

echo "📋 当前服务状态："
${DOCKER_COMPOSE} ps

echo "✅ 部署完成！"
echo "   前端: http://<服务器IP>/"
echo "   健康检查: http://<服务器IP>/api/health"

