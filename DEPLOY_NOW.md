# 🎓 阿里云部署更新 - 最终指南

## 🎯 三种部署方式任选其一

---

## 方式一：本地一键部署（最简单）⭐

### Windows用户
```powershell
# 在项目根目录执行
.\deploy-to-server.ps1
```

### Linux/Mac用户
```bash
# 在项目根目录执行
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

**优点**：在本地电脑执行，自动SSH到服务器完成所有操作

---

## 方式二：服务器上执行（推荐）⭐⭐⭐

### 直接复制粘贴以下命令

```bash
ssh root@123.56.55.132 << 'ENDSSH'
cd /opt/lean-english
cp -r docker docker-backup-$(date +%Y%m%d-%H%M%S)
git pull origin main || echo "未使用Git，跳过"
cd /opt/lean-english/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
sleep 10
docker-compose ps
curl http://localhost:3000/api/health
echo ""
echo "✅ 部署完成！"
echo "访问: http://123.56.55.132"
ENDSSH
```

**优点**：一条命令搞定，复制粘贴即可

---

## 方式三：手动分步执行（适合需要观察每步）

### 步骤1: SSH登录
```bash
ssh root@123.56.55.132
```

### 步骤2: 进入项目
```bash
cd /opt/lean-english
```

### 步骤3: 备份配置
```bash
cp -r docker docker-backup-$(date +%Y%m%d-%H%M%S)
```

### 步骤4: 更新代码（如果使用Git）
```bash
git pull origin main
```

### 步骤5: 部署
```bash
cd /opt/lean-english/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 步骤6: 验证
```bash
docker-compose ps
docker-compose logs -f
```

**优点**：可以观察每一步的执行情况

---

## ✅ 部署成功标志

访问 **http://123.56.55.132**，看到：

- [x] 网站正常加载
- [x] 右下角有紫色悬浮球
- [x] 点击悬浮球打开聊天窗口
- [x] 可以与AI助手对话
- [x] 语音功能正常

---

## 🔍 验证命令

```bash
# 在服务器上执行
cd /opt/lean-english/docker

# 1. 检查容器状态
docker-compose ps

# 2. 检查后端健康
curl http://localhost:3000/api/health

# 3. 测试AI助手
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'
```

---

## 📝 新功能说明

### AI智能助手
- **位置**: 网站右下角紫色悬浮球
- **功能**:
  - 文字对话 - 输入问题获得专业解答
  - 语音输入 - 长按麦克风说话
  - 语音输出 - 点击播放AI回复
- **适用**: 词汇、阅读、听力、写作、口语全方位指导

---

## 🐛 常见问题

### Q1: AI助手无法回复？
```bash
# 在服务器上检查
cd /opt/lean-english/docker
docker-compose exec backend env | grep AI_API_KEY
# 应该看到配置的API Key

# 查看日志
docker-compose logs backend | grep -i error
```

### Q2: 容器启动失败？
```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 重新构建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Q3: 端口被占用？
```bash
# 检查端口
netstat -tulpn | grep :3000
netstat -tulpn | grep :80

# 停止占用的进程或修改docker-compose.yml端口
```

---

## 🔄 回滚方法

如果新版本有问题：

```bash
cd /opt/lean-english/docker
docker-compose down

# 恢复备份（选择最新的备份目录）
cd /opt/lean-english
ls -lh docker-backup-*
cp -r docker-backup-20240XXX-XXXXXX/. docker/

cd docker
docker-compose up -d
```

---

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| [DEPLOY_ON_SERVER.md](./DEPLOY_ON_SERVER.md) | 服务器部署详细步骤 |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 完整部署指南 |
| [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) | 快速命令速查 |
| [UPDATE_NOTES.md](./UPDATE_NOTES.md) | 详细更新说明 |
| [IELTS_ASSISTANT_GUIDE.md](./IELTS_ASSISTANT_GUIDE.md) | 功能使用指南 |

---

## 🎯 现在就开始！

**推荐使用方式二**（服务器上一条命令部署）：

1. 复制上面"方式二"的完整命令
2. 在终端粘贴执行
3. 等待3-5分钟完成
4. 访问网站验证功能

---

## 💡 温馨提示

1. **备份重要**：每次部署都会自动备份当前配置
2. **日志监控**：部署后可以用 `docker-compose logs -f` 查看日志
3. **API配额**：AI助手需要API配额，请关注使用情况
4. **浏览器权限**：语音功能需要授权麦克风权限

---

## 🎉 部署后

新功能已上线：
- ✅ 24/7 AI智能助手
- ✅ 语音交互能力
- ✅ 专业雅思指导

访问 **http://123.56.55.132** 体验全新功能！

**祝部署顺利！** 🚀
