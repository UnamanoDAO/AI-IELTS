# 阅读文章语音生成指南

本指南说明如何为阅读文章生成语音配音。

## 前置要求

### 1. 阿里云账号配置

需要在阿里云控制台完成以下配置：

1. **开通智能语音交互服务**
   - 访问：https://nls-portal.console.aliyun.com/
   - 开通"长文本语音合成"商用版

2. **创建项目并获取 AppKey**
   - 在智能语音交互控制台创建项目
   - 记录项目的 AppKey

3. **创建 AccessKey**
   - 访问：https://ram.console.aliyun.com/manage/ak
   - 创建 AccessKey ID 和 AccessKey Secret
   - **重要**：请妥善保管，不要泄露

4. **OSS 配置**
   - Bucket: `creatimage`
   - Region: `oss-cn-beijing`
   - 确保 AccessKey 有 OSS 的读写权限

### 2. 环境变量配置

在 `backend/.env` 文件中添加以下配置：

```bash
# 阿里云访问凭证
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 阿里云语音合成 AppKey
ALIYUN_TTS_APP_KEY=your_tts_app_key
```

## 使用步骤

### 1. 添加数据库字段

首次使用前，需要为 `unit_readings` 表添加 `audio_url` 字段：

```bash
npm run add-audio-field
```

### 2. 生成音频

#### 为所有文章生成音频

```bash
npm run generate-audio
```

#### 测试模式（只处理前 N 篇）

```bash
npm run generate-audio 5
```

这将只为前 5 篇文章生成音频，用于测试。

## 工作流程

脚本会自动完成以下步骤：

1. **查询文章**：从数据库获取所有没有音频的文章
2. **提交任务**：调用阿里云长文本语音合成 API 提交任务
3. **等待完成**：每 5 秒检查一次任务状态，最多等待 3 分钟
4. **下载音频**：任务完成后下载生成的 MP3 文件
5. **上传 OSS**：将音频文件上传到阿里云 OSS
6. **更新数据库**：将音频 URL 保存到数据库

## 语音配置

当前使用的语音配置（可在 `scripts/generate-audio.js` 中修改）：

- **发音人**：`zhixiaoxia`（知小夏 - 普通话女声）
- **格式**：MP3
- **采样率**：24000 Hz
- **音量**：50
- **语速**：正常（0）

### 其他可选发音人

根据阿里云文档，以下发音人适合阅读场景：

- `siqi`（思琪）- 温柔女声
- `sijia`（思佳）- 标准女声
- `sicheng`（思诚）- 标准男声
- `zhixiaobai`（知小白）- 普通话女声
- `zhixiaomei`（知小妹）- 普通话女声

## 前端集成

### 1. 更新 API

在 `backend/src/routes/readings.js` 中，确保返回 `audio_url` 字段：

```javascript
router.get('/readings/:readingId', async (req, res, next) => {
  try {
    const { readingId } = req.params
    const [readingRows] = await pool.query(
      `SELECT 
        id,
        unit_id,
        title,
        content,
        audio_url,  // 添加这个字段
        created_at
      FROM unit_readings
      WHERE id = ?`,
      [readingId]
    )
    // ... 其余代码
  }
})
```

### 2. 前端播放

在 `frontend/src/views/Reading.vue` 中添加音频播放器：

```vue
<template>
  <!-- 在文章详情中添加 -->
  <div v-if="selectedReading.audio_url" class="audio-player">
    <audio controls :src="selectedReading.audio_url">
      您的浏览器不支持音频播放
    </audio>
  </div>
</template>

<style scoped>
.audio-player {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.audio-player audio {
  width: 100%;
}
</style>
```

## 费用说明

阿里云长文本语音合成按字符数计费：

- 商用版：约 0.0002 元/字符
- 示例：一篇 300 字的文章约 0.06 元
- 305 篇文章（平均 350 字）总费用约：305 × 350 × 0.0002 = 21.35 元

OSS 存储费用：
- 标准存储：0.12 元/GB/月
- 305 个 MP3 文件（每个约 500KB）约 150MB，月费用约 0.018 元

## 故障排查

### 1. 签名错误

如果遇到 `SignatureDoesNotMatch` 错误：
- 检查 AccessKey ID 和 Secret 是否正确
- 确认系统时间准确（签名包含时间戳）

### 2. AppKey 错误

如果遇到 `InvalidAppKey` 错误：
- 确认 AppKey 是否正确
- 检查是否已开通长文本语音合成服务

### 3. 任务超时

如果任务一直处于 RUNNING 状态：
- 检查文本长度是否超过限制（最大 10 万字符）
- 稍后重试，可能是服务端繁忙

### 4. OSS 上传失败

如果上传 OSS 失败：
- 检查 AccessKey 是否有 OSS 权限
- 确认 Bucket 名称和 Region 是否正确
- 检查 Bucket 的访问权限设置

## 注意事项

1. **请求频率**：脚本在每篇文章之间自动延迟 3 秒，避免请求过快
2. **任务时长**：每篇文章的合成时间约 10-30 秒
3. **网络稳定**：确保网络连接稳定，避免下载音频时中断
4. **成本控制**：建议先用测试模式验证，再批量生成

## 相关文档

- [阿里云长文本语音合成文档](https://help.aliyun.com/zh/isi/developer-reference/restful-api)
- [阿里云 OSS Node.js SDK](https://help.aliyun.com/document_detail/32068.html)




