# 🚀 阿里云服务器部署指令

## 服务器信息
- **IP地址**: 123.56.55.132
- **项目路径**: `/opt/lean-english`
- **Docker配置**: `/opt/lean-english/docker`

---

## ⚡ 快速部署（复制粘贴即可）

### 步骤1: SSH登录服务器
```bash
ssh root@123.56.55.132
```

### 步骤2: 进入项目目录
```bash
cd /opt/lean-english
```

### 步骤3: 备份当前版本（可选但推荐）
```bash
# 备份docker目录
cp -r docker docker-backup-$(date +%Y%m%d-%H%M%S)
```

### 步骤4: 更新代码
如果使用Git：
```bash
git pull origin main
```

如果是手动上传文件，跳过此步骤。

### 步骤5: 进入docker目录
```bash
cd /opt/lean-english/docker
```

### 步骤6: 检查配置文件
```bash
# 查看.env文件确认AI API Key已配置
cat .env | grep AI_API_KEY
# 应该看到: AI_API_KEY=sk-BN4GTJpp8Kcx7xEF59Fd605c216d493cB8D81e205f7220De
```

### 步骤7: 执行部署
```bash
# 使用部署脚本（推荐）
chmod +x deploy.sh
./deploy.sh
```

或手动执行：
```bash
# 停止旧容器
docker-compose down

# 重新构建镜像
docker-compose build --no-cache

# 启动新容器
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

---

## 📋 一键复制命令（完整流程）

```bash
# 登录服务器
ssh root@123.56.55.132

# 进入项目并更新
cd /opt/lean-english
git pull origin main  # 如果使用Git

# 备份当前配置
cp -r docker docker-backup-$(date +%Y%m%d-%H%M%S)

# 进入docker目录
cd /opt/lean-english/docker

# 执行部署
docker-compose down && \
docker-compose build --no-cache && \
docker-compose up -d && \
docker-compose logs -f
```

---

## 🔍 部署后验证

### 1. 检查容器状态
```bash
cd /opt/lean-english/docker
docker-compose ps
```

期望输出：
```
NAME                SERVICE    STATUS
backend            backend    Up
frontend           frontend   Up
```

### 2. 检查后端服务
```bash
curl http://localhost:3000/api/health
```

期望输出：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 3. 测试AI助手
```bash
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'
```

应该返回包含text和audioUrl的响应。

### 4. 访问网站
浏览器打开: **http://123.56.55.132**
- ✅ 查看右下角紫色悬浮球
- ✅ 点击打开聊天窗口
- ✅ 测试对话功能

---

## 📝 常用维护命令

### 查看日志
```bash
cd /opt/lean-english/docker

# 查看所有日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看最近100行
docker-compose logs --tail=100 backend
```

### 重启服务
```bash
cd /opt/lean-english/docker

# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启前端
docker-compose restart frontend
```

### 停止服务
```bash
cd /opt/lean-english/docker
docker-compose down
```

### 启动服务
```bash
cd /opt/lean-english/docker
docker-compose up -d
```

### 查看容器状态
```bash
cd /opt/lean-english/docker
docker-compose ps
```

### 进入容器调试
```bash
cd /opt/lean-english/docker

# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh
```

---

## 🐛 问题排查

### 问题1: AI助手无法回复

```bash
# 检查环境变量
cd /opt/lean-english/docker
docker-compose exec backend env | grep AI_

# 如果没有看到API Key或是默认值
vi /opt/lean-english/docker/.env
# 确认 AI_API_KEY 已配置

# 重启后端
docker-compose restart backend
```

### 问题2: 容器无法启动

```bash
cd /opt/lean-english/docker

# 查看详细错误
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :80

# 完全重建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 问题3: 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理Docker资源
docker system prune -a
docker volume prune

# 清理旧的备份
cd /opt/lean-english
ls -lh docker-backup-*
# 手动删除旧备份
rm -rf docker-backup-20240101*
```

---

## 🔄 回滚到旧版本

如果新版本有问题，可以快速回滚：

```bash
cd /opt/lean-english/docker

# 停止当前版本
docker-compose down

# 恢复备份的配置
cd /opt/lean-english
cp docker/.env docker/.env.failed  # 保存失败版本的配置
cp docker-backup-YYYYMMDD-HHMMSS/.env docker/.env  # 恢复旧配置

# 重新启动
cd docker
docker-compose up -d
```

---

## 📊 监控命令

### 实时查看资源使用
```bash
docker stats
```

### 查看容器详情
```bash
cd /opt/lean-english/docker
docker-compose ps -a
```

### 检查网络
```bash
docker network ls
docker network inspect docker_default
```

---

## 🎯 部署成功标志

当您看到以下所有项目都正常时，说明部署成功：

- [x] `docker-compose ps` 显示两个容器都是Up状态
- [x] `curl http://localhost:3000/api/health` 返回成功
- [x] 访问 http://123.56.55.132 网站正常显示
- [x] 右下角显示紫色悬浮球
- [x] 可以与AI助手正常对话
- [x] 语音功能正常工作

---

## 📞 快速参考

| 操作 | 命令 |
|------|------|
| 进入项目 | `cd /opt/lean-english/docker` |
| 查看日志 | `docker-compose logs -f` |
| 重启服务 | `docker-compose restart` |
| 停止服务 | `docker-compose down` |
| 启动服务 | `docker-compose up -d` |
| 查看状态 | `docker-compose ps` |
| 重新构建 | `docker-compose build --no-cache` |

---

## 🎉 开始部署

现在您可以复制上面的命令，在服务器上执行部署了！

**推荐流程**：
1. SSH登录服务器
2. 执行"一键复制命令"部分的完整流程
3. 按照"部署后验证"检查功能
4. 访问网站测试AI助手

祝部署顺利！🚀
