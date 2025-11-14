# 错题本功能使用指南

## 功能概述

已成功为 LeanEnglish 平台添加了完整的错题本（单词本）功能，包括：

1. ✅ **用户认证系统**：注册、登录（密码认证）
2. ✅ **主菜单**：学单词 + 错题本双模块入口（H5适配）
3. ✅ **单词本管理**：添加、删除、查看单词
4. ✅ **AI智能分析**：自动生成音标、发音、中文释义、词根拆解、记忆技巧、衍生词、例句等
5. ✅ **连线测试游戏**：5单词匹配测试，正确答案自动标记为已掌握
6. ✅ **阿里云TTS语音合成**：单词发音和例句朗读

## 快速开始

### 1. 启动服务

**后端**:
```bash
cd backend
npm start
```

**前端**:
```bash
cd frontend
npm run dev
```

访问: http://localhost:5174

### 2. 使用流程

1. **注册/登录**
   - 打开应用后会自动跳转到主菜单
   - 点击"登录/注册"按钮
   - 输入用户名（3-50字符）和密码（至少6字符）

2. **添加单词到错题本**
   - 从主菜单进入"错题本"
   - 点击右上角"+ 添加"按钮
   - 输入英文单词
   - AI会自动分析并生成：
     - 音标
     - 发音音频（阿里云TTS）
     - 中文释义
     - 词根拆解（前缀+词根+后缀）
     - 记忆技巧
     - 衍生词
     - 常用用法
     - 例句（带中文翻译和语音）

3. **查看单词详情**
   - 在单词本列表中点击任意单词
   - 查看完整的AI分析结果
   - 播放发音和例句音频
   - 标记/取消标记为"已掌握"

4. **进行连线测试**
   - 在单词本中添加至少2个单词
   - 点击底部"开始连线测试"按钮
   - 将左边英文单词与右边中文释义连线
   - 提交后查看结果和正确率
   - 连线正确的单词会自动标记为已掌握

5. **查看统计**
   - 单词本顶部显示：总单词数、已掌握数、待掌握数
   - 可筛选查看：全部/待掌握/已掌握

## 技术架构

### 后端

**新增API路由**:
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/vocabulary-book` - 获取用户单词列表
- `GET /api/vocabulary-book/:id` - 获取单词详情
- `POST /api/vocabulary-book` - 添加单词（AI分析）
- `PATCH /api/vocabulary-book/:id/mastered` - 标记掌握状态
- `DELETE /api/vocabulary-book/:id` - 删除单词
- `GET /api/vocabulary-book/stats/summary` - 获取统计数据
- `POST /api/vocabulary-test/generate` - 生成测试题目
- `POST /api/vocabulary-test/submit` - 提交测试答案
- `GET /api/vocabulary-test/history` - 查看测试历史

**核心服务**:
- `wordAnalyzer.js` - AI单词分析服务（使用Dictionary API + 阿里云TTS）
- `auth.js` - JWT认证中间件
- 阿里云NLS TTS集成（复用现有配置）

**数据库表**:
- `users` - 用户表
- `user_vocabulary_book` - 用户单词本
- `vocabulary_test_results` - 测试记录

### 前端

**新增页面**:
- `MainMenu.vue` - 主菜单（学单词 + 错题本）
- `Login.vue` - 登录/注册页面
- `VocabularyBook.vue` - 单词本列表
- `VocabularyDetail.vue` - 单词详情
- `VocabularyTest.vue` - 连线测试游戏

**状态管理**:
- `stores/user.js` - 用户状态管理（Pinia）
  - JWT token 持久化（localStorage）
  - 自动认证初始化
  - 登录/注册/登出

**路由守卫**:
- 单词本相关页面需要登录
- 未登录自动重定向到登录页

## 环境配置

确保 `.env` 文件包含以下配置：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ielts_vocabulary

# 阿里云（TTS音频生成）
ALIYUN_ACCESS_KEY_ID=your_key
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_TTS_APP_KEY=your_app_key

# OSS存储（音频文件）
OSS_REGION=oss-cn-beijing
OSS_BUCKET=creatimage

# JWT密钥（可选，默认有值）
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5174
```

## 数据库迁移

运行以下命令创建新表：

```bash
cd backend
npm run migrate
```

## 功能特色

### 1. AI智能分析
- 自动获取音标、释义（Dictionary API）
- 智能拆解词根词缀
- 生成记忆技巧
- 推荐衍生词和例句

### 2. 语音合成
- 单词发音（阿里云TTS zhixiaoxia音色）
- 例句朗读
- 音频自动上传OSS并永久保存

### 3. 连线游戏
- 随机抽取5个待掌握单词
- 中文释义打乱顺序
- 计时功能
- 正确率统计
- 自动标记已掌握

### 4. H5移动端适配
- 响应式设计
- 触摸友好的交互
- 移动端优化布局

## 注意事项

1. **音频生成**：添加单词时会调用阿里云TTS，请确保配置正确且有足够余额
2. **词典API**：使用免费的 dictionaryapi.dev，偶尔可能不稳定
3. **中文翻译**：当前为简化实现，实际生产建议接入专业翻译API
4. **测试题目**：至少需要2个待掌握单词才能开始测试

## 下一步优化建议

1. 集成真实的翻译API（百度翻译/有道翻译）
2. 优化AI分析准确度
3. 添加单词复习提醒
4. 增加学习曲线图表
5. 支持导入/导出单词本
6. 添加单词搜索和分类功能
7. 实现错题本的分享功能

## 测试账号

可以使用以下测试流程：
1. 注册新账号：testuser / 123456
2. 添加单词：hello, world, test, learn, study
3. 查看单词详情，播放音频
4. 进行连线测试
5. 查看统计数据

祝使用愉快！🎉
