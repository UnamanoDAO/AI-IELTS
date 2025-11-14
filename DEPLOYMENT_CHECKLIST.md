# 阿里云部署检查清单

部署日期: __________
部署人员: __________

## 部署前检查 (Pre-Deployment)

### 1. 环境准备
- [ ] 已获取DeepSeek API Key
- [ ] 已更新 `docker/.env` 文件中的 `AI_API_KEY`
- [ ] 已备份当前运行的版本
- [ ] 已通知用户将进行维护（如需要）

### 2. 代码准备
- [ ] 本地代码已测试通过
- [ ] 所有依赖已安装 (`npm install`)
- [ ] 前端构建成功 (`npm run build`)
- [ ] 后端启动正常 (`npm run dev`)

### 3. 配置检查
```bash
# 检查以下配置项：
docker/.env:
  - [ ] DB_HOST
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] ALIYUN_ACCESS_KEY_ID
  - [ ] ALIYUN_ACCESS_KEY_SECRET
  - [ ] ALIYUN_TTS_APP_KEY
  - [ ] AI_API_KEY (不能是默认值)
  - [ ] AI_API_URL
```

---

## 部署步骤 (Deployment)

### 方式选择
- [ ] 方式一: Git拉取更新
- [ ] 方式二: 手动上传文件
- [ ] 方式三: Docker Hub镜像

### 执行命令记录
```bash
开始时间: __________

命令1: ssh root@123.56.55.132
执行时间: __________
状态: [ ] 成功 [ ] 失败
备注: ________________

命令2: cd /path/to/LeanEnglish/docker
执行时间: __________
状态: [ ] 成功 [ ] 失败

命令3: vi .env (配置AI_API_KEY)
执行时间: __________
状态: [ ] 成功 [ ] 失败

命令4: docker-compose down
执行时间: __________
状态: [ ] 成功 [ ] 失败

命令5: docker-compose build --no-cache
执行时间: __________
状态: [ ] 成功 [ ] 失败
备注: ________________

命令6: docker-compose up -d
执行时间: __________
状态: [ ] 成功 [ ] 失败

完成时间: __________
总耗时: __________ 分钟
```

---

## 部署后验证 (Post-Deployment)

### 1. 容器状态检查
```bash
docker-compose ps
```
- [ ] backend容器状态为 `Up`
- [ ] frontend容器状态为 `Up`
- [ ] 无重启循环（Restarting）状态

### 2. 日志检查
```bash
docker-compose logs backend | tail -50
```
- [ ] 后端启动成功信息: `✓ Server running on...`
- [ ] 数据库连接成功: `✓ Database connected`
- [ ] 无严重错误（ERROR）日志
- [ ] OSS客户端初始化成功

```bash
docker-compose logs frontend | tail -50
```
- [ ] Nginx启动成功
- [ ] 无配置错误

### 3. 健康检查
```bash
curl http://localhost:3000/api/health
```
响应示例:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```
- [ ] 返回200状态码
- [ ] status为"ok"
- [ ] database为"connected"

### 4. API功能测试

#### 测试AI对话接口
```bash
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"accumulate是什么意思?"}'
```
- [ ] 返回200状态码
- [ ] 包含text字段（AI回复文字）
- [ ] 包含audioUrl字段（语音URL）
- [ ] audioUrl可以访问

#### 测试其他接口
```bash
# 测试分类接口
curl http://localhost:3000/api/categories

# 测试单元接口
curl http://localhost:3000/api/units

# 测试阅读接口
curl http://localhost:3000/api/readings/1
```
- [ ] 所有接口正常响应
- [ ] 数据返回正确

### 5. 前端功能测试

访问: http://123.56.55.132

#### 基础功能
- [ ] 页面正常加载
- [ ] 导航功能正常
- [ ] 词汇学习页面正常
- [ ] 阅读页面正常
- [ ] 音频播放正常

#### AI助手功能
- [ ] 右下角显示紫色悬浮球
- [ ] 点击悬浮球打开聊天窗口
- [ ] 聊天窗口UI显示正常
- [ ] 输入文字可以发送
- [ ] AI能正常回复（文字）
- [ ] 点击播放按钮可以播放语音
- [ ] 长按麦克风可以录音
- [ ] 录音后能识别为文字
- [ ] 识别后AI正常回复
- [ ] 快捷问题按钮正常工作

### 6. 性能检查
```bash
# CPU和内存使用
docker stats --no-stream
```
- [ ] CPU使用率 < 80%
- [ ] 内存使用率 < 80%
- [ ] 无内存泄漏迹象

### 7. 浏览器兼容性测试
- [ ] Chrome/Edge (桌面)
- [ ] Firefox (桌面)
- [ ] Safari (Mac)
- [ ] Chrome (移动端)
- [ ] Safari (移动端)

---

## 问题记录 (Issues)

### 发现的问题
| 时间 | 问题描述 | 严重程度 | 解决方案 | 状态 |
|------|----------|----------|----------|------|
|      |          | 🔴高/🟡中/🟢低 |          | ✅/⏳/❌ |
|      |          |          |          |      |

### 错误日志摘录
```
粘贴相关错误日志...
```

---

## 回滚决策 (Rollback Decision)

如果出现以下情况，考虑回滚：
- [ ] 核心功能无法使用
- [ ] 数据库连接失败
- [ ] 服务频繁崩溃
- [ ] 严重性能问题
- [ ] 安全漏洞

回滚命令:
```bash
cd /path/to/LeanEnglish/docker
docker-compose down
cd ..
mv LeanEnglish LeanEnglish-failed
mv LeanEnglish-backup-YYYYMMDD LeanEnglish
cd LeanEnglish/docker
docker-compose up -d
```

是否回滚: [ ] 是 [ ] 否
回滚原因: ________________
回滚时间: __________

---

## 部署总结

### 成功指标
- [ ] 所有容器正常运行
- [ ] 所有API接口正常
- [ ] 前端功能完整
- [ ] AI助手功能正常
- [ ] 无严重错误日志
- [ ] 性能指标正常

### 部署结果
- [ ] ✅ 完全成功
- [ ] ⚠️ 部分成功（有小问题但不影响使用）
- [ ] ❌ 失败（已回滚）

### 新功能上线清单
- [ ] AI智能助手
- [ ] 语音识别输入
- [ ] 语音合成输出
- [ ] 专业雅思指导

### 已知限制
1. AI助手需要DeepSeek API配额，如果配额用完会无法回复
2. 语音识别需要浏览器麦克风权限
3. 首次录音可能需要用户授权

### 待办事项
- [ ] 监控API Key使用情况
- [ ] 配置自动备份
- [ ] 设置日志轮转
- [ ] 配置监控告警

---

## 签名

部署人员: _________________ 日期: __________
审核人员: _________________ 日期: __________

---

## 附录：常用命令速查

### 查看日志
```bash
docker-compose logs -f              # 所有服务
docker-compose logs -f backend      # 仅后端
docker-compose logs -f frontend     # 仅前端
docker-compose logs --tail=100 backend  # 最近100行
```

### 重启服务
```bash
docker-compose restart              # 所有服务
docker-compose restart backend      # 仅后端
docker-compose restart frontend     # 仅前端
```

### 进入容器
```bash
docker-compose exec backend sh      # 进入后端容器
docker-compose exec frontend sh     # 进入前端容器
```

### 查看资源
```bash
docker stats                        # 实时资源使用
docker-compose ps                   # 容器状态
docker images                       # 镜像列表
docker volume ls                    # 卷列表
```

### 清理资源
```bash
docker system prune                 # 清理未使用的资源
docker system prune -a              # 清理所有未使用的资源
docker volume prune                 # 清理未使用的卷
```

---

**部署完成！请妥善保存此检查清单作为部署记录。**
