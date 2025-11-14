# 阿里云Docker部署更新指南

## 概述
本指南将帮助您更新阿里云服务器上的雅思学习平台Docker部署，添加全新的AI助手功能。

## 服务器信息
- **IP地址**: 123.56.55.132
- **数据库**: 阿里云RDS MySQL
- **存储**: 阿里云OSS

## 部署前准备

### 1. 获取DeepSeek API Key (必须)

**重要**: AI助手功能需要AI API Key才能工作。

1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入API Keys页面
4. 创建新的API Key
5. 复制Key（形如：`sk-xxxxxxxxxxxxxx`）

### 2. 更新docker/.env配置

在您的本地项目中，确认 `docker/.env` 文件包含以下配置：

```env
# AI API 配置 - ⚠️ 必须替换为您的真实API Key
AI_API_KEY=sk-your_actual_api_key_here
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

## 部署步骤

### 方法一：使用Git更新（推荐）

如果您的服务器上已经配置了Git仓库：

```bash
# 1. SSH登录阿里云服务器
ssh root@123.56.55.132

# 2. 进入项目目录
cd /path/to/LeanEnglish

# 3. 拉取最新代码
git pull origin main

# 4. 编辑环境变量，添加AI API Key
vi docker/.env
# 找到 AI_API_KEY=your_deepseek_api_key_here
# 替换为您的真实API Key

# 5. 停止旧容器
cd docker
docker-compose down

# 6. 重新构建并启动容器
docker-compose build --no-cache
docker-compose up -d

# 7. 查看日志确认启动成功
docker-compose logs -f
```

### 方法二：手动上传文件

如果没有配置Git，手动上传文件：

#### 步骤1: 在本地打包项目

```bash
# Windows (PowerShell)
# 在项目根目录执行
Compress-Archive -Path * -DestinationPath LeanEnglish-update.zip

# Linux/Mac
tar -czf LeanEnglish-update.tar.gz .
```

#### 步骤2: 上传到服务器

```bash
# 使用scp上传
scp LeanEnglish-update.zip root@123.56.55.132:/tmp/

# 或使用FTP工具（如FileZilla）上传
```

#### 步骤3: 在服务器上部署

```bash
# SSH登录服务器
ssh root@123.56.55.132

# 备份旧版本
cd /path/to
mv LeanEnglish LeanEnglish-backup-$(date +%Y%m%d)

# 解压新版本
cd /path/to
unzip /tmp/LeanEnglish-update.zip -d LeanEnglish
cd LeanEnglish

# 编辑环境变量
vi docker/.env
# 添加您的AI API Key

# 重新部署
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 方法三：使用Docker Hub（推荐用于生产环境）

#### 本地构建并推送镜像：

```bash
# 1. 登录Docker Hub
docker login

# 2. 构建镜像
cd docker

# 构建后端镜像
docker build -t your-dockerhub-username/leanenglish-backend:latest \
  -f Dockerfile.backend ..

# 构建前端镜像
docker build -t your-dockerhub-username/leanenglish-frontend:latest \
  -f Dockerfile.frontend ..

# 3. 推送到Docker Hub
docker push your-dockerhub-username/leanenglish-backend:latest
docker push your-dockerhub-username/leanenglish-frontend:latest
```

#### 服务器上拉取并运行：

```bash
# SSH登录服务器
ssh root@123.56.55.132

cd /path/to/LeanEnglish/docker

# 更新docker-compose.yml使用远程镜像
vi docker-compose.yml

# 修改为：
# services:
#   backend:
#     image: your-dockerhub-username/leanenglish-backend:latest
#   frontend:
#     image: your-dockerhub-username/leanenglish-frontend:latest

# 拉取新镜像
docker-compose pull

# 重启服务
docker-compose down
docker-compose up -d
```

## 验证部署

### 1. 检查容器状态

```bash
docker-compose ps
# 应该看到两个容器都在运行中（Up状态）
```

### 2. 查看日志

```bash
# 查看后端日志
docker-compose logs backend

# 应该看到：
# ✓ Server running on http://localhost:3000
# ✓ Database connected

# 查看前端日志
docker-compose logs frontend
```

### 3. 测试功能

1. **访问网站**: http://123.56.55.132
2. **测试AI助手**:
   - 在右下角看到紫色悬浮球
   - 点击打开聊天窗口
   - 输入问题测试AI回复
   - 测试语音录制功能

### 4. 测试API接口

```bash
# 测试后端健康检查
curl http://123.56.55.132:3000/api/health

# 测试AI助手接口（需要在服务器上执行）
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "accumulate是什么意思?"}'
```

## 常见问题排查

### 问题1: 容器无法启动

```bash
# 查看详细错误日志
docker-compose logs backend
docker-compose logs frontend

# 常见原因：
# 1. 端口被占用 - 检查3000和80端口
# 2. 环境变量配置错误 - 检查docker/.env
# 3. 依赖安装失败 - 重新构建镜像
```

### 问题2: AI助手无法回复

```bash
# 进入后端容器检查
docker-compose exec backend sh

# 检查环境变量
env | grep AI_API_KEY

# 如果为空或是默认值，说明.env未正确配置
exit

# 修正：
vi docker/.env  # 添加正确的API Key
docker-compose restart backend
```

### 问题3: 语音功能不工作

```bash
# 检查阿里云配置
docker-compose exec backend sh
env | grep ALIYUN

# 确认以下变量都已设置：
# ALIYUN_ACCESS_KEY_ID
# ALIYUN_ACCESS_KEY_SECRET
# ALIYUN_TTS_APP_KEY
```

### 问题4: 前端无法连接后端

检查nginx配置：

```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# 确认proxy_pass指向正确的后端地址
```

## 回滚到旧版本

如果出现问题需要回滚：

```bash
# 停止新版本
cd /path/to/LeanEnglish/docker
docker-compose down

# 恢复备份
cd /path/to
mv LeanEnglish LeanEnglish-failed
mv LeanEnglish-backup-YYYYMMDD LeanEnglish

# 启动旧版本
cd LeanEnglish/docker
docker-compose up -d
```

## 性能优化建议

### 1. 使用多阶段构建（已实现）
- 减小镜像体积
- 只包含生产依赖

### 2. 启用Docker日志限制

编辑 `docker-compose.yml`，添加：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 配置资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 监控和维护

### 定期检查

```bash
# 每天检查容器状态
docker-compose ps

# 每周检查磁盘使用
df -h

# 清理未使用的Docker资源
docker system prune -a
```

### 日志监控

```bash
# 实时查看日志
docker-compose logs -f --tail=100

# 导出日志进行分析
docker-compose logs > logs-$(date +%Y%m%d).txt
```

## 安全建议

1. **不要在Git中提交.env文件**
   - 已添加到.gitignore
   - 敏感信息通过环境变量管理

2. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

3. **使用HTTPS**
   - 考虑配置SSL证书
   - 使用docker-compose-ssl.yml

4. **限制容器权限**
   - 不要使用root用户运行应用
   - 在Dockerfile中添加：
   ```dockerfile
   USER node
   ```

## 新功能清单

✅ 雅思AI助手
- 悬浮助手球UI
- 文字对话功能
- 语音识别（长按录音）
- 语音合成（AI回复带语音）
- 对话历史管理

## 总结

完成以上步骤后，您的阿里云部署将包含以下新功能：
1. 智能AI助手
2. 语音交互能力
3. 专业的雅思学习指导

如有问题，请检查：
- 容器日志
- 环境变量配置
- API Key是否有效
- 网络连接是否正常

祝部署顺利！🚀
