# 🎓 雅思学习平台 - 项目更新说明

## 📋 更新概述

本次更新为雅思学习平台添加了全新的**AI智能助手**功能，为学生提供24/7的雅思学习指导和答疑服务。

**版本**: v2.0.0
**更新日期**: 2024年
**主要功能**: AI助手、语音交互、智能问答

---

## ✨ 新增功能

### 1. 🤖 AI智能助手
- **专业雅思导师角色**: 基于精心设计的提示词，提供专业的雅思学习指导
- **全方位支持**: 涵盖词汇、阅读、听力、写作、口语五大模块
- **中英结合**: 回答清晰易懂，关键词汇和例句使用英文

### 2. 🎤 语音交互
- **语音输入**: 长按麦克风按钮录音，松开自动识别并发送
- **语音输出**: AI回复自动转换为语音，支持播放/暂停
- **高质量TTS**: 使用阿里云语音合成，声音自然流畅

### 3. 💬 智能对话
- **上下文记忆**: 保持对话历史，可以连续提问
- **快捷提问**: 提供常见问题快捷按钮
- **实时响应**: 流畅的对话体验

### 4. 🎨 优雅UI设计
- **悬浮助手球**: 右下角紫色渐变设计，不影响页面浏览
- **现代聊天界面**: 清晰的消息气泡，流畅的动画效果
- **响应式设计**: 完美适配桌面和移动设备

---

## 📁 新增文件清单

### 后端服务
```
backend/
├── src/
│   ├── routes/
│   │   └── assistant.js                 # AI助手路由
│   ├── services/
│   │   ├── speechRecognition.js         # 语音识别服务
│   │   └── aiAssistant.js               # AI助手服务
│   └── app.js                            # 已更新：添加助手路由
```

### 前端组件
```
frontend/
├── src/
│   ├── components/
│   │   └── IELTSAssistant.vue           # AI助手组件
│   ├── App.vue                          # 已更新：集成助手
│   └── .env                             # 新增：环境变量配置
```

### 文档
```
docs/
├── IELTS_ASSISTANT_PROMPT.md            # 雅思助手提示词
├── IELTS_ASSISTANT_GUIDE.md             # 功能使用指南
├── DEPLOYMENT_GUIDE.md                  # 完整部署指南
├── QUICK_DEPLOY.md                      # 快速部署命令
└── DEPLOYMENT_CHECKLIST.md              # 部署检查清单
```

### 部署脚本
```
docker/
├── deploy.sh                            # Linux/Mac部署脚本
├── deploy.ps1                           # Windows部署脚本
└── .env                                 # 已更新：添加AI配置
```

---

## 🔧 技术架构

### 后端技术栈
- **Express.js**: Web框架
- **alibabacloud-nls**: 阿里云语音识别SDK
- **ali-oss**: 阿里云对象存储
- **DeepSeek API**: AI对话服务
- **multer**: 文件上传处理

### 前端技术栈
- **Vue 3**: 渐进式前端框架
- **Composition API**: 现代Vue开发方式
- **MediaRecorder API**: 浏览器录音功能
- **Audio API**: 音频播放控制

### 云服务
- **阿里云RDS**: MySQL数据库
- **阿里云OSS**: 对象存储（音频文件）
- **阿里云NLS**: 语音识别和合成
- **DeepSeek**: AI对话模型

---

## 📦 依赖更新

### 后端新增依赖
```json
{
  "alibabacloud-nls": "^1.x.x",
  "multer": "^1.4.x",
  "axios": "^1.6.x"
}
```

安装命令:
```bash
cd backend
npm install alibabacloud-nls multer axios
```

### 前端无新增依赖
前端使用浏览器原生API，无需额外安装依赖。

---

## ⚙️ 配置要求

### 必需配置

#### 1. DeepSeek API Key（必须）
```env
# docker/.env 或 backend/.env
AI_API_KEY=sk-your_actual_api_key_here
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

**获取方式**:
1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 进入API Keys页面
4. 创建新的API Key
5. 复制Key并配置到.env文件

#### 2. 阿里云配置（已有）
```env
ALIYUN_ACCESS_KEY_ID=已配置
ALIYUN_ACCESS_KEY_SECRET=已配置
ALIYUN_TTS_APP_KEY=已配置
```

---

## 🚀 部署方式

### 方式一：快速部署（推荐）

```bash
# 在服务器上执行
cd /path/to/LeanEnglish/docker
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

```bash
# 1. 更新配置
vi docker/.env
# 添加: AI_API_KEY=sk-your_actual_key

# 2. 重新部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

### 方式三：Git更新

```bash
# 拉取最新代码
cd /path/to/LeanEnglish
git pull origin main

# 配置API Key
vi docker/.env

# 重新部署
cd docker
./deploy.sh
```

---

## ✅ 功能验证

### 1. 访问网站
```
http://123.56.55.132
```

### 2. 检查助手
- ✅ 右下角显示紫色悬浮球
- ✅ 点击打开聊天窗口
- ✅ 欢迎界面和快捷问题正常显示

### 3. 测试文字对话
1. 输入问题: "accumulate是什么意思?"
2. 等待AI回复
3. 检查回复内容是否专业准确
4. 点击播放按钮测试语音

### 4. 测试语音输入
1. 长按麦克风按钮
2. 说话: "如何提高雅思阅读速度?"
3. 松开按钮
4. 等待识别和AI回复

### 5. API测试
```bash
# 测试AI对话接口
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'

# 预期返回:
# {
#   "success": true,
#   "data": {
#     "text": "AI回复内容",
#     "audioUrl": "https://..."
#   }
# }
```

---

## 📊 API接口文档

### 1. 语音转文字
```
POST /api/assistant/speech-to-text
Content-Type: multipart/form-data

参数:
- audio: File (WebM/MP3/WAV/PCM格式)

返回:
{
  "success": true,
  "text": "识别的文字内容"
}
```

### 2. AI对话
```
POST /api/assistant/chat
Content-Type: application/json

参数:
{
  "message": "用户问题",
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}

返回:
{
  "success": true,
  "data": {
    "text": "AI回复文字",
    "audioUrl": "语音文件URL"
  }
}
```

---

## 🐛 常见问题

### Q1: AI无法回复？
**A**:
1. 检查API Key配置: `docker-compose exec backend env | grep AI_API_KEY`
2. 确认API Key有效且有配额
3. 查看后端日志: `docker-compose logs backend`

### Q2: 语音识别失败？
**A**:
1. 确认浏览器麦克风权限已授予
2. 检查阿里云NLS服务已开通
3. 确认ALIYUN_TTS_APP_KEY配置正确

### Q3: 语音无法播放？
**A**:
1. 检查OSS存储桶权限（需要公共读）
2. 确认audioUrl可以直接访问
3. 查看浏览器控制台错误

### Q4: 悬浮球不显示？
**A**:
1. 清除浏览器缓存
2. 检查前端是否正确构建: `docker-compose logs frontend`
3. 确认IELTSAssistant组件已集成到App.vue

---

## 🔐 安全建议

1. **API Key管理**
   - 不要将API Key提交到Git仓库
   - 定期轮换API Key
   - 监控API使用情况

2. **环境变量**
   - .env文件已添加到.gitignore
   - 生产环境使用独立的环境变量

3. **访问控制**
   - 考虑添加速率限制
   - 实现用户认证（如需要）

4. **HTTPS**
   - 生产环境使用HTTPS
   - 配置SSL证书

---

## 📈 性能优化

### 已实现
- ✅ Token缓存（NLS）
- ✅ 多阶段Docker构建
- ✅ 生产环境优化

### 建议
- 🔄 添加Redis缓存AI回复
- 🔄 实现对话历史持久化
- 🔄 配置CDN加速静态资源

---

## 🗺️ 未来规划

- [ ] 支持多轮对话上下文管理
- [ ] 添加用户账号系统
- [ ] 保存对话历史
- [ ] 支持多种AI模型切换
- [ ] 添加语音识别实时流式处理
- [ ] 多语言界面支持
- [ ] 数据分析和学习报告

---

## 📞 技术支持

### 文档链接
- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [快速部署命令](./QUICK_DEPLOY.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [功能使用指南](./IELTS_ASSISTANT_GUIDE.md)

### 问题反馈
如遇问题，请检查：
1. 后端日志: `docker-compose logs backend`
2. 前端控制台: 浏览器开发者工具
3. 网络请求: 检查API调用是否成功

---

## 📄 许可证

MIT License

---

## 👥 贡献者

感谢所有为本项目做出贡献的开发者！

---

**部署完成后，您的雅思学习平台将拥有强大的AI助手功能，为学生提供更好的学习体验！** 🎉

如有任何问题，请参考相关文档或联系技术支持。
