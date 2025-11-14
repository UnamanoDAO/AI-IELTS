# 🎓 IELTS Vocabulary Learning Platform

一个完整的雅思词汇学习平台，采用 Vue 3 + Node.js 构建，支持系统化学习、测验功能和AI智能助手。

## ✨ 最新更新 (v2.0.0)

### 🤖 AI智能助手
- **24/7在线指导**: 专业的雅思学习导师随时答疑
- **语音交互**: 支持语音输入和输出
- **全方位支持**: 词汇、阅读、听力、写作、口语五大模块
- **悬浮助手球**: 优雅的UI设计，不干扰学习

**快速开始**: 点击网站右下角紫色悬浮球即可使用！

📖 **[查看更新说明](./UPDATE_NOTES.md)** | 🚀 **[立即部署](./DEPLOY_NOW.md)**

---

## 📚 核心功能

### 学习模式
- 单词卡片展示，包含音标、词性、中文释义
- 词根拆解帮助记忆
- 例句展示加深理解
- 音频播放标准发音
- 学习进度追踪
- **📖 阅读文章**: 每单元配套雅思阅读文章（含音频）

### 测验模式
- **选择题**：根据中文选择对应英文单词
- **填空题**：输入英文单词
- **听力题**：听音频选择正确单词
- 即时反馈和详细的答题回顾
- 成绩自动保存

### 🤖 AI助手 (NEW!)
- **智能对话**: 专业雅思学习指导
- **语音输入**: 长按麦克风说话提问
- **语音输出**: AI回复自动生成语音
- **快捷提问**: 常见问题一键提问
- **上下文记忆**: 连续对话更自然

### 进度管理
- 浏览器本地存储学习进度
- 每单元学习进度百分比
- 测验成绩历史记录
- 无需登录，数据本地保存

---

## 🏗️ 项目架构

```
LeanEnglish/
├── backend/                     # Node.js 后端
│   ├── src/
│   │   ├── config/             # 数据库配置
│   │   ├── routes/             # API 路由
│   │   │   ├── assistant.js    # AI助手路由 ⭐NEW
│   │   │   ├── units.js
│   │   │   ├── words.js
│   │   │   ├── quiz.js
│   │   │   └── readings.js
│   │   ├── services/           # 业务服务 ⭐NEW
│   │   │   ├── speechRecognition.js  # 语音识别
│   │   │   └── aiAssistant.js        # AI助手
│   │   └── app.js
│   ├── scripts/                # 工具脚本
│   │   ├── generate-longtts-audio.js  # 长文本TTS ⭐NEW
│   │   └── ...
│   └── package.json
│
├── frontend/                    # Vue 3 前端
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   │   ├── Home.vue
│   │   │   ├── Learn.vue
│   │   │   ├── Quiz.vue
│   │   │   └── Reading.vue     # 阅读页面
│   │   ├── components/         # UI 组件
│   │   │   ├── IELTSAssistant.vue  # AI助手 ⭐NEW
│   │   │   └── ...
│   │   ├── stores/             # 状态管理
│   │   ├── router/             # 路由配置
│   │   └── api/                # API 客户端
│   └── package.json
│
├── docker/                      # Docker 部署
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   ├── deploy.sh               # 部署脚本 ⭐NEW
│   └── .env                    # 环境变量
│
├── docs/                        # 文档 ⭐NEW
│   ├── DEPLOY_NOW.md           # 快速部署
│   ├── DEPLOYMENT_GUIDE.md     # 完整部署指南
│   ├── IELTS_ASSISTANT_GUIDE.md # 功能使用指南
│   └── ...
│
└── database/                    # 数据库架构
    └── schema.sql
```

---

## 🚀 快速开始

### 本地开发

#### 1. 后端启动
```bash
cd backend
npm install
npm run dev
```
后端服务将运行在 http://localhost:3000

#### 2. 前端启动
```bash
cd frontend
npm install
npm run dev
```
前端应用将运行在 http://localhost:5174

### Docker部署

#### 开发环境
```bash
cd docker
docker-compose up -d
```

#### 生产环境（阿里云）
```bash
# 方式1: 一键部署
./deploy-to-server.sh

# 方式2: 手动部署
ssh root@123.56.55.132
cd /opt/lean-english/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**详细部署指南**: [DEPLOY_NOW.md](./DEPLOY_NOW.md)

---

## 🔌 API 接口

### 基础接口
- `GET /api/health` - 健康检查
- `GET /api/units` - 获取所有学习单元
- `GET /api/units/:id/words` - 获取单元内所有单词
- `GET /api/readings/:unit_id` - 获取阅读文章

### AI助手接口 ⭐NEW
- `POST /api/assistant/speech-to-text` - 语音转文字
- `POST /api/assistant/chat` - AI对话（含TTS）

---

## 🛠️ 技术栈

### 后端
- Node.js + Express
- MySQL2 (阿里云 RDS)
- **alibabacloud-nls** - 语音识别/合成 ⭐NEW
- **DeepSeek API** - AI对话 ⭐NEW
- Ali-OSS - 对象存储

### 前端
- Vue 3 (Composition API)
- Vue Router 4
- Pinia (状态管理)
- Vite
- **MediaRecorder API** - 录音 ⭐NEW

### 云服务
- 阿里云 RDS MySQL
- 阿里云 OSS (音频存储)
- 阿里云 NLS (语音服务)
- DeepSeek AI

---

## 🎯 学习单元

- 每个学习单元包含 **50-100** 个单词
- 按难度和主题分类
- 每单元设计为 **7天** 学习量
- 单词包含完整的音标、释义、词根、例句
- **每单元配套阅读文章**（2000-3000字，含音频）

---

## 💡 使用指南

### AI助手使用
1. 点击网站右下角紫色悬浮球
2. 在聊天窗口输入问题或点击快捷提问
3. 长按麦克风按钮进行语音提问
4. AI回复包含文字和语音，点击播放按钮收听

**详细指南**: [IELTS_ASSISTANT_GUIDE.md](./IELTS_ASSISTANT_GUIDE.md)

### 阅读学习
1. 选择对应单元
2. 阅读文章，点击播放按钮收听朗读
3. 遇到不懂的问题可以询问AI助手

---

## 📊 数据库配置

环境变量在 `backend/.env` 或 `docker/.env` 中配置：

```env
# 数据库配置
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=english

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=your_key_id
ALIYUN_ACCESS_KEY_SECRET=your_key_secret
ALIYUN_TTS_APP_KEY=your_app_key

# AI配置 ⭐重要
AI_API_KEY=your_deepseek_api_key
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

---

## 📱 浏览器支持

- Chrome (推荐，语音功能最佳)
- Firefox
- Safari
- Edge

*注：语音功能需要浏览器支持 MediaRecorder API*

---

## 📚 文档导航

### 部署文档
- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - 立即开始部署
- [DEPLOY_ON_SERVER.md](./DEPLOY_ON_SERVER.md) - 服务器部署步骤
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速命令速查
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署检查清单

### 功能文档
- [UPDATE_NOTES.md](./UPDATE_NOTES.md) - 详细更新说明
- [IELTS_ASSISTANT_GUIDE.md](./IELTS_ASSISTANT_GUIDE.md) - AI助手使用指南
- [IELTS_ASSISTANT_PROMPT.md](./IELTS_ASSISTANT_PROMPT.md) - AI提示词设计

### 总结文档
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - 最终总结
- [READY_TO_DEPLOY.md](./READY_TO_DEPLOY.md) - 部署准备

---

## 🎁 新功能演示

### AI助手界面
- 右下角紫色悬浮球
- 点击打开聊天窗口
- 欢迎界面 + 快捷提问
- 语音录制 + 播放功能

### 使用场景示例
```
用户: "accumulate是什么意思？"
AI: "accumulate /əˈkjuːmjəleɪt/ 是一个重要的雅思词汇...
     [提供详细解释、例句、记忆技巧]"

用户: [语音] "如何提高雅思阅读速度？"
AI: [文字+语音] "提高雅思阅读速度的有效方法包括...
     [提供具体建议和练习方法]"
```

---

## 🚀 生产环境

**访问地址**: http://123.56.55.132
**部署位置**: `/opt/lean-english/`

---

## 🐛 常见问题

### AI助手无法回复？
检查 `AI_API_KEY` 配置是否正确。

### 语音功能不工作？
1. 确认浏览器支持 MediaRecorder API
2. 检查麦克风权限是否已授予
3. 确认阿里云 NLS 服务已开通

更多问题查看: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📄 License

MIT

---

## 👤 作者

Built with ❤️ for IELTS learners

---

## 🎉 致谢

感谢以下服务提供商：
- 阿里云（RDS、OSS、NLS）
- DeepSeek（AI对话）
- Vue.js、Node.js 开源社区

---

**最新版本**: v2.0.0 - AI智能助手版
**更新日期**: 2024年11月

🚀 **[立即部署最新版本](./DEPLOY_NOW.md)**
