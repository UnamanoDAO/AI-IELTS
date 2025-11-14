# 雅思学习平台 - Windows PowerShell 部署脚本

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "雅思学习平台 - 部署脚本" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在docker目录
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "错误: 请在docker目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查.env文件
if (-not (Test-Path ".env")) {
    Write-Host "错误: 未找到.env文件" -ForegroundColor Red
    exit 1
}

# 检查AI API Key
$envContent = Get-Content ".env" -Raw
if ($envContent -match "your_deepseek_api_key_here") {
    Write-Host "警告: 检测到默认的AI API Key" -ForegroundColor Yellow
    Write-Host "AI助手功能需要配置真实的API Key才能工作" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "是否继续部署? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "部署已取消" -ForegroundColor Red
        exit 1
    }
}

Write-Host "步骤 1/5: 停止旧容器..." -ForegroundColor Green
docker-compose down 2>$null
Write-Host ""

Write-Host "步骤 2/5: 清理旧镜像..." -ForegroundColor Green
docker-compose rm -f 2>$null
Write-Host ""

Write-Host "步骤 3/5: 构建新镜像 (这可能需要几分钟)..." -ForegroundColor Green
docker-compose build --no-cache
Write-Host ""

Write-Host "步骤 4/5: 启动容器..." -ForegroundColor Green
docker-compose up -d
Write-Host ""

Write-Host "步骤 5/5: 等待服务启动..." -ForegroundColor Green
Start-Sleep -Seconds 10
Write-Host ""

# 检查容器状态
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "容器状态:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# 检查后端健康
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "检查后端服务:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ 后端服务正常" -ForegroundColor Green
} catch {
    Write-Host "✗ 后端服务异常" -ForegroundColor Red
    Write-Host "查看日志: docker-compose logs backend"
}
Write-Host ""

# 显示日志尾部
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "最近的后端日志:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
docker-compose logs --tail=20 backend
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "部署完成!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址:"
Write-Host "  前端: http://localhost"
Write-Host "  后端: http://localhost:3000"
Write-Host ""
Write-Host "常用命令:"
Write-Host "  查看日志: docker-compose logs -f"
Write-Host "  重启服务: docker-compose restart"
Write-Host "  停止服务: docker-compose down"
Write-Host ""
Write-Host "部署成功! 🎉" -ForegroundColor Green
