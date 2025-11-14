# 阅读文章语音生成快速开始

## 📋 前置准备

### 1. 获取阿里云凭证

访问阿里云控制台获取以下信息：

1. **AccessKey**
   - 访问：https://ram.console.aliyun.com/manage/ak
   - 创建 AccessKey ID 和 AccessKey Secret

2. **语音合成 AppKey**
   - 访问：https://nls-portal.console.aliyun.com/
   - 开通"长文本语音合成"商用版
   - 创建项目并获取 AppKey

### 2. 配置环境变量

在 `backend/.env` 文件中添加：

```bash
# 阿里云访问凭证
ALIYUN_ACCESS_KEY_ID=你的AccessKey_ID
ALIYUN_ACCESS_KEY_SECRET=你的AccessKey_Secret

# 阿里云语音合成 AppKey
ALIYUN_TTS_APP_KEY=你的TTS_AppKey
```

## 🚀 快速开始

### 步骤 1：添加数据库字段

```bash
cd backend
npm run add-audio-field
```

### 步骤 2：生成音频（测试）

先测试生成 2 篇文章的音频：

```bash
npm run generate-audio 2
```

### 步骤 3：批量生成

确认测试成功后，为所有文章生成音频：

```bash
npm run generate-audio
```

这将处理所有 305 篇文章，预计耗时约 30-60 分钟。

### 步骤 4：重启后端服务

```bash
npm start
```

### 步骤 5：前端访问

访问任意单元的阅读文章页面，点击文章后即可看到音频播放器。

## 📊 预期效果

- ✅ 每篇文章顶部显示音频播放器
- ✅ 点击播放按钮即可收听文章
- ✅ 音频文件存储在阿里云 OSS
- ✅ 支持暂停、快进、音量控制等

## 💰 费用预估

- **语音合成**：305 篇 × 350 字 × 0.0002 元/字 ≈ 21.35 元
- **OSS 存储**：150MB × 0.12 元/GB/月 ≈ 0.018 元/月
- **总计**：约 21.4 元（一次性）

## ⚠️ 注意事项

1. 确保阿里云账户余额充足
2. 生成过程中保持网络稳定
3. 脚本会自动跳过已有音频的文章
4. 可以随时中断，下次继续未完成的部分

## 🔧 故障排查

### 签名错误

```
Error: SignatureDoesNotMatch
```

**解决方法**：
- 检查 AccessKey ID 和 Secret 是否正确
- 确认系统时间准确

### AppKey 错误

```
Error: InvalidAppKey
```

**解决方法**：
- 确认 AppKey 是否正确
- 检查是否已开通长文本语音合成服务

### OSS 上传失败

```
Error: AccessDenied
```

**解决方法**：
- 检查 AccessKey 是否有 OSS 权限
- 确认 Bucket 名称和 Region 是否正确

## 📚 详细文档

查看完整文档：`backend/AUDIO_GENERATION_GUIDE.md`

## 🎉 完成

现在你的学生可以在车上或走路时收听英语文章了！




