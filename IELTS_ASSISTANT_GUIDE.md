# 雅思助手功能使用指南

## 功能概述

雅思助手是一个智能AI助手，悬浮在应用右下角，可以帮助您解答雅思学习中的各种问题。它支持文字输入和语音输入，回复会同时包含文字和语音。

## 功能特点

### 1. 智能对话
- 基于专业的雅思导师提示词
- 支持词汇学习、阅读理解、听力练习、写作指导、口语练习等各方面的指导
- 提供中英结合的回答，确保学生理解

### 2. 语音交互
- **语音输入**：长按麦克风按钮录音，松开后自动识别并发送
- **语音输出**：AI回复会自动转换为语音，点击播放按钮即可收听

### 3. 快捷提问
- 首次打开提供常见问题快捷按钮
- 点击即可快速提问

## 使用步骤

### 1. 配置环境变量

#### 后端配置 (backend/.env)
```env
# 阿里云配置 (已有)
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_TTS_APP_KEY=your_tts_app_key

# AI API 配置 (需要添加)
AI_API_KEY=your_deepseek_api_key
AI_API_URL=https://api.deepseek.com/v1/chat/completions
```

**重要**：您需要：
1. 注册DeepSeek账号并获取API Key（或使用其他AI服务）
2. 将API Key填入 `AI_API_KEY` 配置项

#### 前端配置 (frontend/.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 3. 启动服务

```bash
# 启动后端 (在backend目录)
npm run dev

# 启动前端 (在frontend目录，新终端)
npm run dev
```

### 4. 使用助手

1. **打开应用**：访问 http://localhost:5174
2. **查看助手**：在页面右下角会看到紫色的悬浮球
3. **开始对话**：
   - 点击悬浮球打开聊天窗口
   - 可以输入文字或长按麦克风录音
   - AI会回复文字和语音

## API接口说明

### 1. 语音转文字接口
```
POST /api/assistant/speech-to-text
Content-Type: multipart/form-data

参数:
- audio: 音频文件 (WebM/MP3/WAV/PCM格式)

返回:
{
  "success": true,
  "text": "识别的文字内容"
}
```

### 2. AI对话接口
```
POST /api/assistant/chat
Content-Type: application/json

参数:
{
  "message": "用户问题",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

返回:
{
  "success": true,
  "data": {
    "text": "AI回复文字",
    "audioUrl": "语音URL"
  }
}
```

## 技术架构

### 后端技术栈
- **Express.js**: Web框架
- **alibabacloud-nls**: 阿里云语音识别SDK
- **ali-oss**: 阿里云对象存储
- **axios**: HTTP客户端
- **multer**: 文件上传处理

### 前端技术栈
- **Vue 3**: 前端框架
- **MediaRecorder API**: 浏览器录音API
- **Audio API**: 音频播放

### 核心服务

#### 1. 语音识别服务 (speechRecognition.js)
- 使用阿里云一句话识别API
- 支持PCM/WebM等格式
- 实时返回识别结果

#### 2. AI助手服务 (aiAssistant.js)
- 读取雅思助手提示词
- 调用DeepSeek AI API
- 使用阿里云TTS生成语音
- 上传音频到OSS并返回URL

## 常见问题

### Q1: 无法录音？
**A**: 检查浏览器麦克风权限。在浏览器地址栏左侧点击锁图标，允许麦克风权限。

### Q2: AI无法回复？
**A**: 检查以下几点：
1. 确认 `AI_API_KEY` 已正确配置
2. 检查网络连接
3. 查看后端控制台错误信息

### Q3: 语音识别失败？
**A**:
1. 确认阿里云NLS服务已开通
2. 检查 `ALIYUN_TTS_APP_KEY` 配置
3. 确保录音时间不要太短（至少1秒）

### Q4: 音频无法播放？
**A**:
1. 检查OSS存储桶权限（需要公共读权限）
2. 确认音频URL可以直接访问
3. 检查浏览器控制台错误

## 自定义配置

### 修改AI提示词
编辑 `IELTS_ASSISTANT_PROMPT.md` 文件，可以自定义助手的行为和回答风格。

### 更换AI服务
如果使用其他AI服务（如OpenAI、Claude等），修改 `backend/src/services/aiAssistant.js` 中的API调用部分。

### 自定义UI样式
编辑 `frontend/src/components/IELTSAssistant.vue` 中的样式部分，可以修改颜色、大小、位置等。

## 性能优化建议

1. **Token缓存**: NLS Token会自动缓存，避免频繁请求
2. **音频压缩**: 前端录音使用WebM格式，文件较小
3. **消息历史**: 对话历史会传递给AI，建议限制在最近10条
4. **语音生成**: TTS音频上传到OSS后永久保存，可以重复播放

## 扩展建议

1. **添加对话历史保存**: 使用localStorage或数据库保存对话记录
2. **多语言支持**: 添加英文界面选项
3. **语音识别优化**: 支持实时流式识别
4. **个性化设置**: 允许用户选择AI角色、语音等
5. **数据分析**: 统计常见问题，优化助手回答

## 许可证

MIT License

## 支持

如有问题，请检查：
1. 后端控制台日志
2. 前端浏览器控制台
3. 网络请求详情

祝您使用愉快！💪
