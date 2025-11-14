# 雅思学习平台 - Windows一键部署脚本
# 执行方式: .\deploy-to-server.ps1

Write-Host "🚀 开始部署到阿里云服务器..." -ForegroundColor Cyan
Write-Host ""

# 服务器信息
$SERVER = "root@123.56.55.132"
$PROJECT_PATH = "/opt/lean-english"

Write-Host "📡 连接到服务器 $SERVER ..." -ForegroundColor Yellow

# 创建部署命令
$deployCommands = @"
echo '✅ 已连接到服务器'
echo ''

# 进入项目目录
cd /opt/lean-english
echo '📁 当前目录: $(pwd)'
echo ''

# 备份
echo '💾 备份当前配置...'
cp -r docker docker-backup-`$(date +%Y%m%d-%H%M%S)
echo '✅ 备份完成'
echo ''

# 更新代码（如果使用Git）
if [ -d '.git' ]; then
    echo '🔄 拉取最新代码...'
    git pull origin main
    echo '✅ 代码更新完成'
else
    echo '⚠️  未检测到Git仓库，跳过代码拉取'
fi
echo ''

# 进入docker目录
cd /opt/lean-english/docker
echo '📦 准备部署...'
echo ''

# 停止旧容器
echo '🛑 停止旧容器...'
docker-compose down
echo ''

# 重新构建
echo '🔨 构建新镜像（这可能需要几分钟）...'
docker-compose build --no-cache
echo ''

# 启动容器
echo '🚀 启动新容器...'
docker-compose up -d
echo ''

# 等待启动
echo '⏳ 等待服务启动...'
sleep 10
echo ''

# 检查状态
echo '📊 容器状态:'
docker-compose ps
echo ''

# 检查健康
echo '🏥 检查后端健康...'
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo '✅ 后端服务正常'
else
    echo '❌ 后端服务异常，请检查日志'
fi
echo ''

echo '======================================'
echo '✨ 部署完成！'
echo '======================================'
echo ''
echo '访问地址: http://123.56.55.132'
echo ''
echo '查看日志: docker-compose logs -f'
echo '重启服务: docker-compose restart'
echo ''
"@

# 执行SSH命令
ssh $SERVER $deployCommands

Write-Host ""
Write-Host "🎉 部署流程执行完毕！" -ForegroundColor Green
Write-Host ""
Write-Host "请访问 http://123.56.55.132 验证功能" -ForegroundColor Cyan
Write-Host "新功能: 右下角紫色悬浮球 - AI智能助手" -ForegroundColor Cyan
