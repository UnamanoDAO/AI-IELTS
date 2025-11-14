#!/bin/bash

##############################################################################
# LeanEnglish CentOS 部署脚本 (阿里云)
# 部署目录: /root/AI-IELTS
#
# 功能：
# 1. 停止并清理旧容器
# 2. 从GitHub拉取最新代码
# 3. 配置环境变量
# 4. 构建并启动Docker容器
##############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
DEPLOY_DIR="/root/AI-IELTS"
REPO_URL="https://github.com/UnamanoDAO/AI-IELTS.git"
BRANCH="master"

##############################################################################
# 步骤 1: 检查系统环境
##############################################################################
log_info "========================================="
log_info "步骤 1: 检查系统环境"
log_info "========================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root用户运行此脚本"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装，请先安装Docker"
    log_info "安装命令: curl -fsSL https://get.docker.com | bash"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose未安装，请先安装Docker Compose"
    log_info "安装命令: curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    log_warning "Git未安装，正在安装..."
    yum install -y git
fi

log_success "系统环境检查完成"

##############################################################################
# 步骤 2: 停止旧容器
##############################################################################
log_info "========================================="
log_info "步骤 2: 停止旧容器"
log_info "========================================="

# 显示当前运行的容器
log_info "当前运行的容器:"
docker ps -a

# 停止并删除旧的LeanEnglish容器
log_info "停止旧容器..."
docker stop lean-english-backend lean-english-frontend 2>/dev/null || log_warning "没有找到旧容器"
docker rm lean-english-backend lean-english-frontend 2>/dev/null || log_warning "没有需要删除的容器"

log_success "旧容器已停止"

##############################################################################
# 步骤 3: 清理或获取代码
##############################################################################
log_info "========================================="
log_info "步骤 3: 获取最新代码"
log_info "========================================="

if [ -d "$DEPLOY_DIR" ]; then
    log_warning "目录 $DEPLOY_DIR 已存在"
    read -p "是否删除并重新克隆? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "删除旧目录..."
        rm -rf "$DEPLOY_DIR"
        log_info "克隆仓库..."
        git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
    else
        log_info "更新现有仓库..."
        cd "$DEPLOY_DIR"
        git fetch origin
        git reset --hard origin/"$BRANCH"
        git pull origin "$BRANCH"
    fi
else
    log_info "克隆仓库到 $DEPLOY_DIR ..."
    git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"
log_success "代码获取完成"

##############################################################################
# 步骤 4: 配置环境变量
##############################################################################
log_info "========================================="
log_info "步骤 4: 配置环境变量"
log_info "========================================="

ENV_FILE="$DEPLOY_DIR/docker/.env"

if [ -f "$ENV_FILE" ]; then
    log_warning ".env 文件已存在"
    read -p "是否重新配置? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "跳过环境变量配置"
    else
        rm "$ENV_FILE"
    fi
fi

if [ ! -f "$ENV_FILE" ]; then
    log_info "创建 .env 文件..."
    cat > "$ENV_FILE" << 'EOF'
# Database Configuration
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=english

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://your_domain.com

# OSS配置
OSS_REGION=oss-cn-beijing
ALIYUN_ACCESS_KEY_ID=your_aliyun_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
OSS_BUCKET=your_oss_bucket_name
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com

# 阿里云语音合成 AppKey
ALIYUN_TTS_APP_KEY=your_aliyun_tts_app_key

# AI API 配置
AI_API_KEY=your_ai_api_key_here
AI_API_URL=https://api.bltcy.ai
AI_MODEL=gpt-5.1-thinking
EOF

    log_warning "请编辑 $ENV_FILE 填写真实配置"
    log_info "按Enter键打开编辑器..."
    read
    vi "$ENV_FILE"
fi

log_success "环境变量配置完成"

##############################################################################
# 步骤 5: 构建Docker镜像
##############################################################################
log_info "========================================="
log_info "步骤 5: 构建Docker镜像"
log_info "========================================="

cd "$DEPLOY_DIR/docker"

log_info "清理旧镜像..."
docker images | grep lean-english | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || log_warning "没有旧镜像需要清理"

log_info "开始构建镜像（这可能需要几分钟）..."
docker-compose build --no-cache

log_success "镜像构建完成"

##############################################################################
# 步骤 6: 启动容器
##############################################################################
log_info "========================================="
log_info "步骤 6: 启动容器"
log_info "========================================="

log_info "启动容器..."
docker-compose up -d

# 等待容器启动
log_info "等待容器启动（30秒）..."
sleep 30

# 检查容器状态
log_info "检查容器状态:"
docker-compose ps

# 检查后端健康状态
log_info "检查后端服务..."
if curl -f http://localhost:3000/api/health &>/dev/null; then
    log_success "后端服务运行正常"
else
    log_warning "后端服务可能未就绪，请查看日志"
fi

# 检查前端
log_info "检查前端服务..."
if curl -f http://localhost:80 &>/dev/null; then
    log_success "前端服务运行正常"
else
    log_warning "前端服务可能未就绪，请查看日志"
fi

##############################################################################
# 步骤 7: 显示日志和状态
##############################################################################
log_info "========================================="
log_info "步骤 7: 部署完成"
log_info "========================================="

log_success "✅ 部署成功完成！"
echo ""
log_info "服务访问地址:"
log_info "  - 前端: http://$(curl -s ifconfig.me)"
log_info "  - 后端API: http://$(curl -s ifconfig.me):3000"
echo ""
log_info "常用命令:"
log_info "  查看日志:    cd $DEPLOY_DIR/docker && docker-compose logs -f"
log_info "  重启服务:    cd $DEPLOY_DIR/docker && docker-compose restart"
log_info "  停止服务:    cd $DEPLOY_DIR/docker && docker-compose down"
log_info "  查看状态:    cd $DEPLOY_DIR/docker && docker-compose ps"
echo ""
log_info "查看实时日志（按Ctrl+C退出）..."
docker-compose logs -f --tail=50
