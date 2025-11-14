# AI 文章生成配置指南

## 概述

`generate-ai-readings.js` 脚本使用 AI（OpenAI GPT）为每个学习单元生成高质量的英文阅读文章和中文翻译。

## 配置步骤

### 方案 1：使用 OpenAI API（推荐）

1. **获取 API Key**
   - 访问 https://platform.openai.com/api-keys
   - 创建新的 API Key
   - 复制保存（只显示一次）

2. **配置环境变量**
   
   在 `backend/.env` 文件中添加：
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **运行生成脚本**
   ```bash
   cd backend
   npm run generate-ai-readings
   ```

### 方案 2：使用其他 AI 服务

如果你想使用其他 AI 服务（Claude、通义千问、文心一言等），需要修改脚本中的 API 调用部分：

1. 打开 `backend/scripts/generate-ai-readings.js`
2. 找到 `generateArticleWithAI` 和 `translateToChineseWithAI` 函数
3. 替换为你的 AI 服务的 API 调用

### 方案 3：无 API Key 运行（备选方案）

如果没有配置 API Key，脚本会自动使用备选方案生成结构化的示例文章。

```bash
npm run generate-ai-readings
```

文章质量会略低，但仍然可用。

## 生成的内容

- **文章数量**：每个单元 5 篇
- **文章长度**：300-400 词
- **词汇使用**：优先使用单元词汇，其他部分使用简单词汇
- **翻译**：每个句子都有对应的中文翻译

## 成本估算（OpenAI）

- 模型：GPT-3.5-turbo
- 每篇文章约：0.01-0.02 USD
- 61 个单元 × 5 篇 = 305 篇
- 总成本约：3-6 USD

## 性能优化

1. **批量处理**：脚本默认先处理前 10 个单元（测试模式）
2. **API 限流**：每次请求后延迟 1 秒
3. **错误处理**：API 失败时自动回退到备选方案

## 自定义文章主题

编辑 `articlePrompts` 数组可以自定义文章风格：

```javascript
const articlePrompts = [
  {
    theme: "你的主题",
    prompt: (unitName, words) => `你的提示词模板`
  }
]
```

## 常见问题

### Q: API 报错 401 Unauthorized
**A:** 检查 API Key 是否正确配置在 `.env` 文件中

### Q: API 报错 429 Too Many Requests
**A:** 增加延迟时间或购买更高配额

### Q: 生成的文章没有使用单元词汇
**A:** 检查提示词是否清晰，或手动在提示词中强调词汇使用

### Q: 翻译质量不佳
**A:** 可以切换到更强大的模型（如 GPT-4），或使用专业翻译 API

## 重新生成文章

如果需要重新生成所有文章：

```bash
npm run generate-ai-readings
```

脚本会自动清空现有文章并重新生成。

## 生产环境建议

1. 使用 GPT-4 以获得更高质量的文章
2. 添加人工审核流程
3. 定期更新和优化内容
4. 考虑使用本地 AI 模型降低成本

