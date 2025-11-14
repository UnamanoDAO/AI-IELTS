# 阅读文章功能部署指南

## 功能概述

为每个 Unit 添加了 5 篇阅读文章功能：
- 每篇文章 300-400 词
- 使用该 Unit 的词汇编写
- 点击句子显示中文翻译
- 移动端友好的交互体验

## 部署步骤

### 1. 更新数据库结构

在服务器上执行以下SQL（或重新运行 schema.sql）：

```bash
mysql -h <db-host> -u <user> -p <db_name> < database/schema.sql
```

或者只添加新表：

```sql
CREATE TABLE IF NOT EXISTS unit_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_unit_readings_unit
    FOREIGN KEY (unit_id) REFERENCES learning_units(id) ON DELETE CASCADE,
  INDEX idx_unit_readings_unit (unit_id),
  INDEX idx_unit_readings_order (unit_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reading_sentences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reading_id INT NOT NULL,
  sentence_text TEXT NOT NULL,
  translation TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_sentences_reading
    FOREIGN KEY (reading_id) REFERENCES unit_readings(id) ON DELETE CASCADE,
  INDEX idx_reading_sentences_reading (reading_id),
  INDEX idx_reading_sentences_order (reading_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. 生成阅读文章数据

在后端目录运行：

```bash
cd backend
npm run generate-readings
```

这将为每个 Unit 生成 5 篇示例文章。

**注意**：生成的文章是基础版本，建议后续使用 AI 或人工编写更高质量的内容。

### 3. 打包前端

```bash
cd frontend
npm run build
```

### 4. 打包后端

```bash
cd ..
tar -czf backend-with-readings.tar.gz -C backend package.json package-lock.json src data scripts
```

### 5. 打包前端

```bash
tar -czf frontend-with-readings.tar.gz -C frontend package.json package-lock.json src index.html vite.config.js README.md
```

### 6. 上传到服务器

```powershell
scp backend-with-readings.tar.gz frontend-with-readings.tar.gz root@learnenglish.xin:/opt/lean-english/
```

### 7. 在服务器上部署

```bash
cd /opt/lean-english

# 解压后端
rm -rf backend
mkdir backend
tar -xzf backend-with-readings.tar.gz -C backend

# 解压前端
rm -rf frontend
mkdir frontend
tar -xzf frontend-with-readings.tar.gz -C frontend

# 重新构建 Docker
cd docker
docker compose build
docker compose up -d

# 如果还没有运行过 generate-readings，在容器内执行
docker compose exec backend npm run generate-readings
```

### 8. 验证部署

访问网站，进入任意单元，应该能看到：
- 单元卡片上有"📚 阅读文章"按钮
- 点击后进入阅读文章列表页面
- 选择文章后可以阅读，点击句子显示翻译

## 新增文件清单

### 数据库
- `database/schema.sql` - 新增两个表

### 后端
- `backend/src/routes/readings.js` - 阅读文章 API 路由
- `backend/src/app.js` - 注册新路由
- `backend/scripts/generate-readings.js` - 文章生成脚本
- `backend/package.json` - 添加 generate-readings 命令

### 前端
- `frontend/src/views/Reading.vue` - 阅读页面组件
- `frontend/src/router/index.js` - 添加阅读路由
- `frontend/src/views/Home.vue` - 添加阅读按钮

## API 端点

- `GET /api/units/:unitId/readings` - 获取单元的所有阅读文章
- `GET /api/readings/:readingId` - 获取文章详情（包含句子和翻译）

## 后续改进建议

1. **高质量内容**：使用 AI（如 ChatGPT/Claude）或人工编写更专业的文章
2. **AI 翻译**：集成翻译 API 提供更准确的中文翻译
3. **难度分级**：根据单词难度自动调整文章复杂度
4. **阅读理解题**：添加文章相关的选择题或问答题
5. **生词标注**：自动高亮 Unit 词汇，提供快速查看释义
6. **语音朗读**：集成 TTS 服务，支持文章朗读

## 故障排查

### 文章列表为空
- 检查是否运行了 `npm run generate-readings`
- 检查数据库表是否创建成功
- 查看后端日志：`docker compose logs backend`

### 翻译不显示
- 检查浏览器控制台是否有错误
- 确认 reading_sentences 表有数据
- 检查 API 响应是否包含 sentences 数组

### 样式异常
- 清除浏览器缓存
- 检查是否使用了最新的前端构建

## 完成 ✅

所有功能已实现并可以部署！

