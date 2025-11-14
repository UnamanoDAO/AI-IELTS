#!/bin/bash

echo "🎙️ 阅读文章语音配音 - 环境配置向导"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在
if [ -f .env ]; then
    echo "⚠️  .env 文件已存在"
    read -p "是否要追加配置？(y/n): " append
    if [ "$append" != "y" ]; then
        echo "❌ 已取消"
        exit 0
    fi
    echo "" >> .env
    echo "# 语音合成配置 ($(date))" >> .env
else
    echo "📝 创建新的 .env 文件"
    touch .env
fi

# 获取 AccessKey ID
echo ""
echo "1️⃣ 请输入阿里云 AccessKey ID:"
echo "   (访问 https://ram.console.aliyun.com/manage/ak 获取)"
read -p "   AccessKey ID: " access_key_id

# 获取 AccessKey Secret
echo ""
echo "2️⃣ 请输入阿里云 AccessKey Secret:"
read -s -p "   AccessKey Secret: " access_key_secret
echo ""

# 获取 AppKey
echo ""
echo "3️⃣ 请输入语音合成 AppKey:"
echo "   (访问 https://nls-portal.console.aliyun.com/ 获取)"
read -p "   AppKey: " app_key

# 写入配置
echo "" >> .env
echo "# 阿里云访问凭证" >> .env
echo "ALIYUN_ACCESS_KEY_ID=$access_key_id" >> .env
echo "ALIYUN_ACCESS_KEY_SECRET=$access_key_secret" >> .env
echo "" >> .env
echo "# 阿里云语音合成 AppKey" >> .env
echo "ALIYUN_TTS_APP_KEY=$app_key" >> .env

echo ""
echo "✅ 配置已保存到 .env 文件"
echo ""
echo "📝 下一步:"
echo "   1. 运行 npm run test-aliyun 测试配置"
echo "   2. 运行 npm run add-audio-field 添加数据库字段"
echo "   3. 运行 npm run generate-audio 1 测试生成音频"
echo ""




