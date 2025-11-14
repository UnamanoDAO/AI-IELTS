# 🎙️ 开始使用语音配音功能

## ⚠️ 重要安全提示

**你的 AccessKey Secret 已经在聊天中暴露！请立即采取行动：**

### 立即执行（5分钟）

1. 访问：https://ram.console.aliyun.com/manage/ak
2. 找到 AccessKey ID: `LTAI5t6vmRDknJA7FQvioyAT`
3. 点击"禁用"或"删除"
4. 创建新的 AccessKey 并妥善保管

---

## 🚀 快速开始（3 步完成）

### 步骤 1：获取语音合成 AppKey

1. 访问：https://nls-portal.console.aliyun.com/
2. 开通"长文本语音合成"商用版
3. 创建项目，获取 AppKey

### 步骤 2：配置环境变量

#### 方式 A：使用配置向导（推荐）

**Windows PowerShell:**
```powershell
cd backend
.\setup-audio-env.ps1
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup-audio-env.sh
./setup-audio-env.sh
```

#### 方式 B：手动编辑

在 `backend/.env` 文件中添加：

```bash
# 阿里云访问凭证（使用新创建的 AccessKey！）
ALIYUN_ACCESS_KEY_ID=你的新AccessKey_ID
ALIYUN_ACCESS_KEY_SECRET=你的新AccessKey_Secret

# 阿里云语音合成 AppKey
ALIYUN_TTS_APP_KEY=你的AppKey
```

### 步骤 3：运行脚本

```bash
cd backend

# 1. 测试配置
npm run test-aliyun

# 2. 添加数据库字段
npm run add-audio-field

# 3. 测试生成（1篇文章）
npm run generate-audio 1

# 4. 批量生成（所有文章）
npm run generate-audio
```

---

## 📋 完整流程

### 1. 测试配置 ✅

```bash
npm run test-aliyun
```

**预期输出：**
```
✓ ALIYUN_ACCESS_KEY_ID: LTAI...
✓ ALIYUN_ACCESS_KEY_SECRET: ****...
✓ ALIYUN_TTS_APP_KEY: your_app_key
✓ OSS 连接成功
✓ Bucket: creatimage
✓ TTS API endpoint 可访问
```

### 2. 添加数据库字段 ✅

```bash
npm run add-audio-field
```

**预期输出：**
```
✅ audio_url 字段添加成功
```

### 3. 测试生成音频 ✅

```bash
npm run generate-audio 1
```

**预期输出：**
```
[1/1] 处理文章...
  文章 1: Modern Applications and Understanding in Physical Geography
    📝 内容长度: 357 字符
    🎙️  提交语音合成任务...
    ✓ 任务提交成功，任务ID: xxx
    ⏳ 等待任务完成...
    ✓ 任务完成，音频URL: xxx
    ⬇️  下载音频文件...
    ⬆️  上传到 OSS...
    ✓ 上传到 OSS 成功
    ✅ 音频生成成功
```

### 4. 批量生成 ✅

```bash
npm run generate-audio
```

这将为所有 305 篇文章生成音频，预计耗时 30-60 分钟。

---

## 🎯 验证效果

### 前端访问

1. 启动后端服务（如果还没启动）：
   ```bash
   cd backend
   npm start
   ```

2. 访问前端：http://localhost:5173

3. 进入任意单元的阅读文章页面

4. 点击任意文章

5. 在文章标题下方看到音频播放器 🎧

6. 点击播放按钮，开始收听！

---

## 💰 费用说明

### 一次性费用
- 生成 305 篇文章音频：约 **21.4 元**

### 每月费用
- OSS 存储 + 流量：约 **1 元/月**

---

## 🔧 故障排查

### 问题 1：签名错误
```
Error: SignatureDoesNotMatch
```
**解决**：检查 AccessKey ID 和 Secret 是否正确

### 问题 2：AppKey 无效
```
Error: InvalidAppKey
```
**解决**：
1. 确认 AppKey 是否正确
2. 检查是否已开通长文本语音合成服务

### 问题 3：OSS 上传失败
```
Error: AccessDenied
```
**解决**：
1. 检查 AccessKey 是否有 OSS 权限
2. 确认 Bucket 名称和 Region 是否正确

### 问题 4：任务超时
```
Error: 任务超时
```
**解决**：
1. 检查网络连接
2. 稍后重试（可能是服务端繁忙）

---

## 📚 相关文档

- **详细文档**：`backend/AUDIO_GENERATION_GUIDE.md`
- **快速开始**：`AUDIO_QUICK_START.md`
- **功能总结**：`AUDIO_FEATURE_SUMMARY.md`
- **配置说明**：`backend/ENV_CONFIG_INSTRUCTIONS.md`

---

## ✅ 检查清单

- [ ] 已禁用/删除泄露的 AccessKey
- [ ] 已创建新的 AccessKey
- [ ] 已获取语音合成 AppKey
- [ ] 已配置 .env 文件
- [ ] 已运行 `npm run test-aliyun` 测试成功
- [ ] 已运行 `npm run add-audio-field` 添加字段
- [ ] 已运行 `npm run generate-audio 1` 测试生成
- [ ] 已运行 `npm run generate-audio` 批量生成
- [ ] 已在前端验证音频播放

---

## 🎉 完成！

现在你的学生可以在车上或走路时收听英语文章了！

**祝你使用愉快！** 🎧📚




