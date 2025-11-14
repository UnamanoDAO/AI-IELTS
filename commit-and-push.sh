#!/bin/bash

# Git提交和推送脚本

echo "🎯 准备提交代码到Git仓库..."
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 检测到以下更改："
    git status --short
    echo ""
    
    # 添加所有更改
    echo "➕ 添加所有更改..."
    git add .
    
    # 提交更改
    echo ""
    echo "💾 提交更改..."
    git commit -m "feat: 添加AI智能助手功能

新增功能：
- AI智能雅思学习助手
- 语音识别输入
- 语音合成输出
- 专业雅思指导提示词

技术更新：
- 集成阿里云NLS语音服务
- 集成DeepSeek AI对话API
- 新增Vue3悬浮助手组件
- 完善Docker部署配置

部署文档：
- 完整部署指南
- 一键部署脚本
- 部署检查清单
"
    
    echo ""
    echo "🚀 推送到远程仓库..."
    git push origin main
    
    echo ""
    echo "✅ 代码已成功推送到Git仓库！"
    echo ""
    echo "📋 后续步骤："
    echo "1. 登录阿里云服务器"
    echo "2. cd /opt/lean-english"
    echo "3. git pull origin main"
    echo "4. cd docker && ./deploy.sh"
else
    echo "⚠️  没有检测到未提交的更改"
    echo ""
    echo "如需推送现有提交："
    echo "git push origin main"
fi
