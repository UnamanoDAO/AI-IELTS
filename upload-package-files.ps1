# 上传缺失的 package.json 和 package-lock.json 文件到阿里云服务器
# 执行方式: .\upload-package-files.ps1

Write-Host "📦 上传缺失的依赖文件到服务器..." -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@123.56.55.132"
$PROJECT_PATH = "/opt/lean-english"

# 上传 backend 文件
Write-Host "📤 上传 backend/package.json ..." -ForegroundColor Yellow
scp backend/package.json "${SERVER}:${PROJECT_PATH}/backend/package.json"

Write-Host "📤 上传 backend/package-lock.json ..." -ForegroundColor Yellow
scp backend/package-lock.json "${SERVER}:${PROJECT_PATH}/backend/package-lock.json"

# 上传 frontend 文件
Write-Host "📤 上传 frontend/package.json ..." -ForegroundColor Yellow
scp frontend/package.json "${SERVER}:${PROJECT_PATH}/frontend/package.json"

Write-Host "📤 上传 frontend/package-lock.json ..." -ForegroundColor Yellow
scp frontend/package-lock.json "${SERVER}:${PROJECT_PATH}/frontend/package-lock.json"

Write-Host ""
Write-Host "✅ 文件上传完成！" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以重新构建 Docker 镜像了:" -ForegroundColor Cyan
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "cd $PROJECT_PATH/docker" -ForegroundColor White
Write-Host "docker-compose build --no-cache" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White
