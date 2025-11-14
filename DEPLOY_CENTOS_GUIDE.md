# CentOS 阿里云服务器部署指南

## 📋 前置要求

- CentOS 7/8 服务器
- Root权限
- 已安装Docker和Docker Compose
- 开放端口：80 (HTTP), 3000 (后端API)

## 🚀 快速部署

### 方式一：使用自动化部署脚本（推荐）

```bash
# 1. 下载部署脚本
curl -o deploy-centos.sh https://raw.githubusercontent.com/UnamanoDAO/AI-IELTS/master/deploy-centos.sh

# 2. 添加执行权限
chmod +x deploy-centos.sh

# 3. 运行部署脚本
./deploy-centos.sh
```

脚本会自动完成：
- ✅ 检查系统环境
- ✅ 停止旧容器
- ✅ 拉取最新代码
- ✅ 配置环境变量
- ✅ 构建Docker镜像
- ✅ 启动服务

### 方式二：手动部署

#### 步骤 1: 安装Docker（如果未安装）

```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash

# 启动Docker
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 步骤 2: 停止旧容器

```bash
# 查看运行的容器
docker ps -a

# 停止并删除旧容器
docker stop lean-english-backend lean-english-frontend
docker rm lean-english-backend lean-english-frontend

# 或使用docker-compose停止
cd /root/old-project-directory/docker
docker-compose down
```

#### 步骤 3: 克隆代码

```bash
# 进入部署目录
cd /root

# 如果目录已存在，先删除
rm -rf AI-IELTS

# 克隆仓库
git clone https://github.com/UnamanoDAO/AI-IELTS.git
cd AI-IELTS
```

#### 步骤 4: 配置环境变量

```bash
# 复制环境变量模板
cd docker
cp ../backend/env.exmp .env

# 编辑配置文件
vi .env
```

必填配置项：
```bash
# 数据库配置（阿里云RDS）
DB_HOST=rm-xxxxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=english

# 阿里云OSS配置
ALIYUN_ACCESS_KEY_ID=LTAI5txxxxxx
ALIYUN_ACCESS_KEY_SECRET=xxxxxxxxxxxxxx
OSS_BUCKET=your_bucket_name

# 阿里云TTS配置
ALIYUN_TTS_APP_KEY=xxxxxxxxxxxxxx

# AI API配置
AI_API_KEY=sk-xxxxxxxxxxxxxxxx
AI_API_URL=https://api.bltcy.ai
AI_MODEL=gpt-5.1-thinking

# CORS配置（你的域名或IP）
CORS_ORIGIN=http://your_domain.com
```

#### 步骤 5: 构建和启动

```bash
# 进入docker目录
cd /root/AI-IELTS/docker

# 构建镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📊 验证部署

### 检查容器状态

```bash
cd /root/AI-IELTS/docker
docker-compose ps
```

期望输出：
```
NAME                      STATUS              PORTS
lean-english-backend      Up (healthy)        0.0.0.0:3000->3000/tcp
lean-english-frontend     Up                  0.0.0.0:80->80/tcp
```

### 测试服务

```bash
# 测试后端健康检查
curl http://localhost:3000/api/health

# 测试前端
curl http://localhost:80

# 从外部访问
curl http://your_server_ip
```

## 🔧 常用命令

### 查看日志

```bash
cd /root/AI-IELTS/docker

# 查看所有服务日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 只查看前端日志
docker-compose logs -f frontend

# 查看最近50行日志
docker-compose logs --tail=50
```

### 重启服务

```bash
cd /root/AI-IELTS/docker

# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启前端
docker-compose restart frontend
```

### 停止服务

```bash
cd /root/AI-IELTS/docker

# 停止服务（保留数据）
docker-compose stop

# 停止并删除容器（保留数据卷）
docker-compose down

# 停止并删除所有（包括数据）
docker-compose down -v
```

### 更新代码

```bash
cd /root/AI-IELTS

# 拉取最新代码
git pull origin master

# 重新构建并启动
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔥 防火墙配置

### CentOS 7 (firewalld)

```bash
# 开放端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
```

### 阿里云安全组

登录阿里云控制台 → ECS → 安全组 → 配置规则

添加入方向规则：
- 端口：80/80，协议：TCP，授权对象：0.0.0.0/0
- 端口：3000/3000，协议：TCP，授权对象：0.0.0.0/0

## 🔍 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 查看容器状态
docker ps -a
```

### 2. 数据库连接失败

检查 `.env` 配置：
- DB_HOST 是否正确
- 阿里云RDS白名单是否添加服务器IP
- 数据库用户名密码是否正确

```bash
# 测试数据库连接
mysql -h your_db_host -u your_user -p
```

### 3. 端口被占用

```bash
# 查看端口占用
netstat -tunlp | grep :80
netstat -tunlp | grep :3000

# 停止占用端口的进程
kill -9 <PID>
```

### 4. 构建失败

```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

## 📈 性能优化

### 1. 启用日志轮转

已在 `docker-compose.yml` 中配置：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. 定期清理Docker

```bash
# 清理未使用的容器、网络、镜像
docker system prune -a

# 定时任务（每周日凌晨3点）
crontab -e
# 添加: 0 3 * * 0 docker system prune -f
```

## 🔐 安全建议

1. **使用HTTPS**: 建议配置SSL证书（Let's Encrypt）
2. **防火墙**: 只开放必要端口
3. **定期更新**: 保持系统和Docker版本最新
4. **备份**: 定期备份数据库和配置文件
5. **监控**: 配置日志监控和告警

## 📞 支持

如有问题，请查看：
- [GitHub Issues](https://github.com/UnamanoDAO/AI-IELTS/issues)
- [项目文档](https://github.com/UnamanoDAO/AI-IELTS/blob/master/README.md)
