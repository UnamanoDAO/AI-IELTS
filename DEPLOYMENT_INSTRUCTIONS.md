# 部署和增强词汇数据指南

## 🚀 Docker 一键部署（推荐）

如果你希望在服务器上通过 Docker 快速部署，请按照以下步骤：

1. 在项目根目录找到 `docker/` 文件夹（已包含 Dockerfile 和 Nginx 配置）。
2. 复制示例环境变量文件：
   ```bash
   cd docker
   cp env.example .env
   ```
   按实际情况填写数据库与 CORS 配置（`PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CORS_ORIGIN` 等）。
3. 构建并后台运行前后端：
   ```bash
   docker compose build
   docker compose up -d
   ```
4. 初次运行需要导入数据库数据：
   ```bash
   docker compose exec backend npm run import
   ```
5. 验证：
   - 前端页面：http://服务器IP/
   - 后端健康检查：http://服务器IP/api/health
6. 更新代码后，只需重新上传并执行：
   ```bash
   docker compose build
   docker compose up -d
   ```

---

## 📝 本地增强词汇数据步骤

所有代码已经完成，现在需要执行以下命令来应用增强：

### 1. 添加数据库字段

```bash
cd backend
npm run add-memory-field
```

这将在 `words` 表中添加 `memory_tip` 字段。

### 2. 增强词汇数据

```bash
npm run enhance-vocabulary
```

这将为50个单词添加：
- 音标（标准IPA格式）
- 词根拆解
- 记忆方法

### 3. 重新导入数据库

```bash
npm run import
```

这将把增强后的数据重新导入到数据库。

### 4. 重启后端服务

```bash
npm run dev
```

### 5. 刷新前端

在浏览器中刷新 `http://localhost:5173`，然后点击"开始学习"查看单词。

## ✅ 预期结果

完成后，每个单词卡片将显示：

- ✅ 单词本身（大标题）
- ✅ **音标**（如 /ˈætməsfɪr/）
- ✅ 词性标签（n./v./adj.等）
- ✅ **中文释义**（大字体）
- ✅ **词根拆解**（灰色背景框）
- ✅ 例句（斜体）
- ✅ **💡 记忆方法**（蓝绿渐变背景框）
- ✅ **音频播放按钮**（点击播放发音）

## 🎯 增强的单词（50个）

已为以下单词提供完整的增强数据：

1. atmosphere - 大气层
2. hydrosphere - 水圈
3. lithosphere - 岩石圈
4. oxygen - 氧气
5. oxide - 氧化物
6. carbon dioxide - 二氧化碳
7. hydrogen - 氢气
8. core - 地核
9. crust - 地壳
10. mantle - 地幔

...（共50个单词）

## 📱 前端新增功能

### WordCard组件
- 新增"记忆方法"区域
- 带有💡图标的醒目标题
- 蓝绿渐变背景，左侧蓝色边框
- 字体颜色使用主题蓝色

### 显示逻辑
- 只有包含 memory_tip 的单词才显示记忆方法区域
- 音标区域会显示标准IPA音标
- 词根拆解区域显示增强后的详细拆解

## 🔊 音频功能

所有单词使用有道词典API提供发音：
```
https://dict.youdao.com/dictvoice?audio={word}&type=1
```

点击🔈按钮即可播放单词发音。

## 📚 后续扩展

如果需要为更多单词添加增强数据：

1. 编辑 `backend/scripts/enhance-vocabulary.js`
2. 在 `enhancedVocabulary` 对象中添加新单词的数据
3. 重新运行 `npm run enhance-vocabulary`
4. 重新导入：`npm run import`

## 🎉 完成！

执行完以上步骤后，你的IELTS词汇学习平台将拥有完整的：
- 音标
- 词根拆解
- 记忆方法
- 音频播放

这将大大提升学习体验！

