#!/bin/bash

# SSL 证书初始化脚本
# 用于首次申请 Let's Encrypt 证书

set -e

DOMAIN="learnenglish.xin"
EMAIL="your-email@example.com"  # 请修改为你的邮箱

echo "🔐 开始申请 SSL 证书..."
echo "域名: $DOMAIN, www.$DOMAIN"
echo "邮箱: $EMAIL"
echo ""

# 1. 确保目录存在
mkdir -p certbot/conf certbot/www

# 2. 临时使用 HTTP 配置启动 Nginx
echo "📝 使用临时 HTTP 配置..."
cp nginx.conf nginx-temp.conf
docker compose up -d frontend

# 3. 等待 Nginx 启动
echo "⏳ 等待 Nginx 启动..."
sleep 5

# 4. 申请证书
echo "🎫 申请证书..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# 5. 切换到 HTTPS 配置
echo "🔄 切换到 HTTPS 配置..."
docker compose down
cp nginx-ssl.conf nginx.conf
docker compose -f docker-compose-ssl.yml up -d

echo ""
echo "✅ SSL 证书申请完成！"
echo "🌐 现在可以通过 https://$DOMAIN 访问"
echo ""
echo "证书将自动续期，无需手动操作。"

