# 故障排除指南

## 500错误：Failed to fetch articles

### 快速修复步骤

```bash
# 1. 停止后端服务 (Ctrl+C)

# 2. 测试数据库连接
cd backend
node scripts/test-database.js

# 3. 如果表不存在，运行迁移
node scripts/create-reading-tables.js

# 4. 重启后端
npm run dev
```

### 问题诊断

根据你的错误，文章创建成功（POST请求成功），但获取文章列表失败（GET请求500错误）。

**最可能的原因：**
1. 数据库表创建不完整
2. `axios` 未安装（用于有道词典API）
3. 后端服务需要重启

### 详细步骤

#### 步骤1：检查后端日志

查看后端控制台，找到具体错误信息。可能看到：
- `Table doesn't exist`
- `Cannot find module`
- 具体的JavaScript错误

#### 步骤2：重新安装依赖

```bash
cd backend
npm install
```

确保以下包已安装：
- `axios` (用于HTTP请求)
- `@alicloud/pop-core` (阿里云SDK，可选)
- `mysql2` (数据库)
- `express` (Web框架)

#### 步骤3：验证数据库

```bash
node scripts/test-database.js
```

应该看到：
```
✅ Database connected
✅ Found X articles
✅ All database tests passed!
```

如果看到错误，运行：
```bash
node scripts/create-reading-tables.js
```

#### 步骤4：测试API

使用浏览器或curl测试：
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/articles
```

### 已修复的问题

我已经修复了以下问题：

1. ✅ 将 `fetch` 改为 `axios`（Node.js兼容性）
2. ✅ 添加阿里云API密钥检查（可选配置）
3. ✅ 增强错误处理（不会因翻译失败而崩溃）
4. ✅ 有道词典API作为主要翻译源（无需配置）

### 环境变量（可选）

```env
# backend/.env
# 阿里云翻译API（可选，有备用方案）
ALIYUN_ACCESS_KEY_ID=your_key
ALIYUN_ACCESS_KEY_SECRET=your_secret

# 数据库配置（必需）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ielts_vocabulary
```

### 如果问题仍存在

请提供后端控制台的完整错误日志，我可以进一步诊断。
