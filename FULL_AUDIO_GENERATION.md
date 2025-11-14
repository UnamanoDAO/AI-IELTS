# 完整音频生成指南

## 问题说明

之前使用 `generate-audio.js` 脚本生成的音频只有约 18 秒（108KB），这是因为阿里云 TTS 同步模式对单次请求有文本长度限制（约 400 字符）。如果文章超过这个长度，只会生成前面部分的音频。

## 解决方案

新的脚本 `regenerate-full-audio.js` 会自动：
1. 将长文本分割成多个不超过 400 字符的段落
2. 为每段生成音频
3. 使用 ffmpeg 将所有音频段拼接成完整的音频文件
4. 上传到阿里云 OSS
5. 更新数据库

## 使用方法

### 1. 重新生成指定单元的完整音频

```bash
cd backend

# 重新生成 Unit 1 的音频
npm run regenerate-full-audio -- 1

# 重新生成 Unit 2 的音频
npm run regenerate-full-audio -- 2
```

### 2. 重新生成所有单元的音频

```bash
npm run regenerate-full-audio -- --all
```

### 3. 强制重新生成（即使已有音频）

```bash
# 强制重新生成 Unit 1
npm run regenerate-full-audio -- 1 --force

# 强制重新生成所有单元
npm run regenerate-full-audio -- --all --force
```

### 4. 直接使用 node 命令

```bash
# 重新生成 Unit 1
node scripts/regenerate-full-audio.js 1

# 重新生成所有单元
node scripts/regenerate-full-audio.js --all

# 强制重新生成 Unit 1
node scripts/regenerate-full-audio.js 1 --force
```

## 前置要求

1. **安装 ffmpeg**
   - Windows: 从 https://ffmpeg.org/download.html 下载并添加到 PATH
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

2. **配置环境变量**
   确保 `.env` 文件中配置了：
   ```
   ALIYUN_ACCESS_KEY_ID=your_key_id
   ALIYUN_ACCESS_KEY_SECRET=your_key_secret
   ALIYUN_TTS_APP_KEY=your_app_key
   ```

## Unit 1 测试结果

已成功为 Unit 1（01_自然地理）的 5 篇文章重新生成完整音频：

| 文章 ID | 标题 | 原音频大小 | 新音频大小 | 增加倍数 |
|---------|------|------------|------------|----------|
| 334 | Modern World: Applications and Understanding... | 108.84 KB | 813.32 KB | 7.5x |
| 335 | Geography's Importance and Impact... | - | 691.68 KB | - |
| 336 | Comprehensive Guide to Physical Geography... | - | 645.14 KB | - |
| 337 | Geography's Impact on Daily Life | - | 728.39 KB | - |
| 338 | Principles and Practices of Physical Geography | - | 762.42 KB | - |

## 音频生成详情

脚本会显示详细的进度信息：
- 文章内容长度
- 分段数量和每段的字符数
- 每段音频的生成进度和大小
- 音频拼接过程
- OSS 上传结果

## 后续步骤

如果要为所有单元重新生成完整音频：

```bash
npm run regenerate-full-audio -- --all
```

这将处理数据库中所有尚未生成音频或音频不完整的文章。

## 注意事项

1. 生成过程可能需要较长时间，每篇文章根据长度可能需要 30-60 秒
2. 脚本会在每段之间添加 1 秒延迟，避免 API 限流
3. 文章之间会有 2 秒延迟
4. 生成的音频会自动覆盖原有的不完整音频
5. 如果某篇文章生成失败，脚本会继续处理下一篇，并在最后显示失败统计
