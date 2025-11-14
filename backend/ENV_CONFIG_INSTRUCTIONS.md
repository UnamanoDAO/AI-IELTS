# 环境变量配置说明

## ⚠️ 安全警告

**你的 AccessKey Secret 已经暴露！请立即采取以下措施：**

1. 访问阿里云 RAM 控制台：https://ram.console.aliyun.com/manage/ak
2. 找到 AccessKey ID: `LTAI5t6vmRDknJA7FQvioyAT`
3. 点击"禁用"或"删除"
4. 创建新的 AccessKey
5. 妥善保管新的 Secret，不要再次泄露

## 📝 配置步骤

### 1. 获取语音合成 AppKey

1. 访问阿里云智能语音交互控制台：https://nls-portal.console.aliyun.com/
2. 如果还没开通，点击"立即开通"
3. 选择"长文本语音合成"商用版
4. 创建项目（或使用已有项目）
5. 在项目详情中找到 **AppKey**，复制它

### 2. 创建 .env 文件

在 `backend/` 目录下创建 `.env` 文件（如果不存在），添加以下内容：

```bash
# 阿里云访问凭证（请使用新创建的 AccessKey！）
ALIYUN_ACCESS_KEY_ID=你的新AccessKey_ID
ALIYUN_ACCESS_KEY_SECRET=你的新AccessKey_Secret

# 阿里云语音合成 AppKey
ALIYUN_TTS_APP_KEY=你的AppKey

# 数据库配置
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=sousoujuan
DB_PASSWORD=Xj196210*
DB_NAME=english

# 服务器配置
PORT=3000
NODE_ENV=production

# CORS 配置
CORS_ORIGIN=*
```

### 3. 测试配置

配置完成后，运行测试脚本：

```bash
cd backend
npm run test-aliyun
```

如果看到以下输出，说明配置成功：

```
✓ ALIYUN_ACCESS_KEY_ID: LTAI5t...
✓ ALIYUN_ACCESS_KEY_SECRET: 41Za...
✓ ALIYUN_TTS_APP_KEY: your_app_key
✓ OSS 连接成功
✓ Bucket: creatimage
✓ TTS API endpoint 可访问
```

### 4. 添加数据库字段

```bash
npm run add-audio-field
```

### 5. 测试生成音频

先测试生成 1 篇文章：

```bash
npm run generate-audio 1
```

### 6. 批量生成

确认无误后，生成所有文章的音频：

```bash
npm run generate-audio
```

## 🔐 安全最佳实践

1. ✅ 永远不要在代码中硬编码 AccessKey
2. ✅ 永远不要将 `.env` 文件提交到 Git
3. ✅ 定期轮换 AccessKey
4. ✅ 为不同环境使用不同的 AccessKey
5. ✅ 使用 RAM 子账号，授予最小权限

## 📞 需要帮助？

如果遇到问题，请查看：
- `AUDIO_GENERATION_GUIDE.md` - 详细文档
- `AUDIO_QUICK_START.md` - 快速开始指南




