# 快速部署命令

## 前置条件

### 必须配置AI API Key
在 `docker/.env` 文件中配置：
```env
AI_API_KEY=sk-your_actual_deepseek_api_key
```

获取API Key: https://platform.deepseek.com/

---

## 方式一：使用部署脚本（推荐）

### Linux/Mac服务器:
```bash
cd docker
chmod +x deploy.sh
./deploy.sh
```

### Windows本地测试:
```powershell
cd docker
.\deploy.ps1
```

---

## 方式二：手动命令

### 在阿里云服务器上执行：

```bash
# 1. 进入项目目录
cd /path/to/LeanEnglish/docker

# 2. 编辑环境变量（添加AI API Key）
vi .env
# 修改: AI_API_KEY=sk-your_actual_api_key

# 3. 停止旧容器
docker-compose down

# 4. 重新构建（如果代码有更新）
docker-compose build --no-cache

# 5. 启动新容器
docker-compose up -d

# 6. 查看日志
docker-compose logs -f
```

---

## 验证部署

### 1. 检查容器状态
```bash
docker-compose ps
# 确保backend和frontend都是Up状态
```

### 2. 测试后端
```bash
curl http://localhost:3000/api/health
# 应返回: {"status":"ok","database":"connected",...}
```

### 3. 测试AI助手
```bash
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'
```

### 4. 访问网站
打开浏览器: http://123.56.55.132
- 查看右下角是否有紫色悬浮球
- 点击测试AI对话功能

---

## 如果使用Git更新代码

```bash
# 在服务器上
cd /path/to/LeanEnglish

# 拉取最新代码
git pull origin main

# 重新部署
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 常见问题

### AI助手无法回复
```bash
# 检查API Key配置
docker-compose exec backend env | grep AI_API_KEY

# 如果是默认值，重新配置：
vi .env
docker-compose restart backend
```

### 容器启动失败
```bash
# 查看错误日志
docker-compose logs backend
docker-compose logs frontend

# 常见原因：
# - 端口占用：检查3000和80端口
# - 环境变量错误：检查.env文件
# - 构建失败：删除镜像重新构建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 清理Docker资源
```bash
# 停止所有容器
docker-compose down

# 清理未使用的镜像
docker system prune -a

# 重新部署
docker-compose up -d
```

---

## 回滚到旧版本

```bash
# 1. 停止当前版本
cd /path/to/LeanEnglish/docker
docker-compose down

# 2. 如果有备份
cd ..
mv LeanEnglish LeanEnglish-new
mv LeanEnglish-backup LeanEnglish

# 3. 启动旧版本
cd LeanEnglish/docker
docker-compose up -d
```

---

## 监控和维护

### 实时查看日志
```bash
docker-compose logs -f
```

### 重启单个服务
```bash
docker-compose restart backend
# 或
docker-compose restart frontend
```

### 进入容器调试
```bash
docker-compose exec backend sh
```

### 查看资源使用
```bash
docker stats
```

---

## 重要提示

1. ⚠️ 必须配置真实的AI API Key，否则助手功能无法使用
2. 📝 部署前备份重要数据
3. 🔒 不要将.env文件提交到Git仓库
4. 📊 定期查看日志和监控容器状态
5. 🔄 建议在非高峰时段部署更新

---

部署完成后，新功能包括：
✅ AI智能助手
✅ 语音识别输入
✅ 语音合成输出
✅ 专业雅思学习指导
