# 阅读理解学习功能使用说明

## 功能概述

这个新功能允许用户导入英文文章，然后在阅读时点击任何单词查看翻译，并可将单词添加到个人单词本中。

## 功能特点

1. **文章管理**
   - 导入自定义英文文章
   - 支持设置文章难度（初级/中级/高级）
   - 自动计算文章字数
   - 可编辑和删除已导入的文章

2. **智能阅读**
   - 点击任意单词即可查看翻译
   - 自动获取音标和词性
   - 显示单词在文章中的上下文
   - 已添加到单词本的单词会高亮显示

3. **单词本集成**
   - 一键将单词添加到个人单词本
   - 自动保存单词的上下文例句
   - 支持掌握程度标记（新单词/学习中/熟悉/已掌握）
   - 统计学习进度

## 使用步骤

### 1. 启动后端服务

```bash
cd backend

# 确保数据库已初始化
npm run init-db

# 运行数据库迁移（创建新表）
node scripts/create-reading-tables.js

# 启动后端
npm run dev
```

### 2. 配置环境变量

确保 `backend/.env` 文件包含阿里云翻译API配置：

```
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
```

### 3. 启动前端服务

```bash
cd frontend
npm run dev
```

### 4. 使用功能

1. **访问阅读理解页面**
   - 登录后，在"我的单词本"页面点击 "📚 阅读理解" 按钮
   - 或直接访问 `/reading-comprehension`

2. **导入文章**
   - 点击"导入文章"按钮
   - 输入文章标题和内容
   - 选择难度级别
   - （可选）填写文章来源
   - 点击"导入"

3. **阅读文章**
   - 在文章列表中点击任意文章卡片
   - 点击文章中的任意单词查看翻译
   - 点击弹窗中的"加入单词本"按钮保存单词

4. **管理单词本**
   - 点击阅读页面的返回按钮
   - 在文章列表页点击"我的单词本"
   - 查看和管理已收集的单词

## 数据库架构

### 新增表结构

1. **custom_articles** - 自定义阅读文章
   - `id`: 主键
   - `title`: 文章标题
   - `content`: 文章内容
   - `source`: 来源
   - `difficulty`: 难度级别
   - `word_count`: 字数统计

2. **word_translations** - 单词翻译缓存
   - `id`: 主键
   - `word`: 单词（小写）
   - `translation`: 中文翻译
   - `phonetic`: 音标
   - `word_type`: 词性

3. **user_vocabulary** - 用户单词本
   - `id`: 主键
   - `word`: 单词
   - `translation`: 翻译
   - `article_id`: 来源文章ID
   - `context_sentence`: 上下文例句
   - `mastery_level`: 掌握程度
   - `review_count`: 复习次数
   - `last_reviewed_at`: 最后复习时间

## API 端点

### 文章管理

- `GET /api/articles` - 获取所有文章
- `GET /api/articles/:id` - 获取单篇文章
- `POST /api/articles` - 创建新文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `POST /api/articles/:id/translate` - 翻译单词

### 单词本管理

- `GET /api/vocabulary` - 获取所有单词
- `GET /api/vocabulary/stats` - 获取统计数据
- `POST /api/vocabulary` - 添加单词
- `PUT /api/vocabulary/:id` - 更新单词
- `DELETE /api/vocabulary/:id` - 删除单词
- `POST /api/vocabulary/:id/review` - 标记复习
- `POST /api/vocabulary/check` - 检查单词是否存在

## 技术实现

### 后端技术

- **翻译服务**: 阿里云机器翻译 API
- **翻译缓存**: MySQL 数据库缓存
- **备用方案**: 有道词典 API（当阿里云不可用时）

### 前端技术

- **状态管理**: Pinia Store
- **路由**: Vue Router
- **样式**: Scoped CSS with 渐变色设计
- **交互**: 点击单词弹窗、悬停高亮

### 关键功能

1. **单词分词**: 正则表达式分离单词和标点
2. **翻译缓存**: 减少API调用，提升响应速度
3. **智能弹窗**: 自适应位置，避免超出屏幕
4. **移动适配**: 响应式设计，支持触摸操作

## 注意事项

1. **API配额**: 阿里云翻译API有调用限制，请合理使用
2. **数据安全**: 确保 `.env` 文件不要提交到版本控制
3. **性能优化**: 翻译结果会缓存，避免重复调用
4. **浏览器兼容**: 建议使用现代浏览器（Chrome, Firefox, Safari, Edge）

## 故障排除

### 翻译功能不工作

1. 检查阿里云 API 密钥是否正确
2. 查看后端日志确认 API 调用状态
3. 确认网络连接正常

### 单词无法添加到单词本

1. 检查数据库连接
2. 确认 `user_vocabulary` 表已创建
3. 查看浏览器控制台错误信息

### 文章列表为空

1. 确认已成功导入文章
2. 检查数据库中 `custom_articles` 表
3. 查看网络请求是否成功

## 未来改进方向

1. 支持 PDF 文件导入
2. 添加文章收藏功能
3. 实现单词复习提醒
4. 支持离线缓存
5. 添加学习统计图表
6. 支持多语言翻译

## 联系支持

如遇到问题，请查看：
- 后端日志: `backend/logs/`
- 浏览器控制台
- 数据库连接状态: `/api/health`
