#!/bin/bash
# 上传缺失的 package.json 和 package-lock.json 文件到阿里云服务器
# 执行方式: bash upload-package-files.sh

echo "📦 上传缺失的依赖文件到服务器..."
echo ""

SERVER="root@123.56.55.132"
PROJECT_PATH="/opt/lean-english"

# 上传 backend 文件
echo "📤 上传 backend/package.json ..."
scp backend/package.json "${SERVER}:${PROJECT_PATH}/backend/package.json"

echo "📤 上传 backend/package-lock.json ..."
scp backend/package-lock.json "${SERVER}:${PROJECT_PATH}/backend/package-lock.json"

# 上传 frontend 文件
echo "📤 上传 frontend/package.json ..."
scp frontend/package.json "${SERVER}:${PROJECT_PATH}/frontend/package.json"

echo "📤 上传 frontend/package-lock.json ..."
scp frontend/package-lock.json "${SERVER}:${PROJECT_PATH}/frontend/package-lock.json"

echo ""
echo "✅ 文件上传完成！"
echo ""
echo "现在可以重新构建 Docker 镜像了:"
echo "ssh $SERVER"
echo "cd $PROJECT_PATH/docker"
echo "docker-compose build --no-cache"
echo "docker-compose up -d"
