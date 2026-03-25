- `create_by/update_by`: 创建者/更新者

## Linux 服务器部署指南

### 1. 环境准备

确保服务器已安装：
- Node.js (建议 v16+)
- npm
- MySQL 数据库

### 2. 部署步骤

#### 方法一：使用部署脚本
```bash
# 上传项目文件到服务器
# 进入项目目录
cd flashServer

# 给部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

#### 方法二：手动部署
```bash
# 1. 安装依赖
npm install --production

# 2. 配置环境变量
cp .env.production .env
# 编辑 .env 文件，填入实际的数据库配置

# 3. 测试数据库连接
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).then(() => {
  console.log('数据库连接成功');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接失败:', err.message);
  process.exit(1);
});
"

# 4. 启动服务
npm start
```

### 3. 使用 PM2 进行进程管理（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.json --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart news-management-api

# 停止应用
pm2 stop news-management-api
```

### 4. 常见问题排查

#### 数据库连接失败
- 检查数据库服务是否运行：`systemctl status mysql`
- 检查防火墙设置：`ufw status`
- 确保数据库用户有远程连接权限
- 验证数据库连接参数是否正确

#### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3010

# 杀死进程
kill -9 <PID>
```

#### 权限问题
```bash
# 确保脚本有执行权限
chmod +x deploy.sh

# 确保日志目录存在且有写权限
mkdir -p logs
chmod 755 logs
```

### 5. 安全建议

- 使用强密码
- 配置防火墙，只开放必要端口
- 定期备份数据库
- 使用 HTTPS（建议配合 Nginx）
- 定期更新依赖包

### 6. 监控和日志

使用 PM2 监控：
```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show news-management-api
```

日志文件位置：
- 应用日志：`./logs/combined.log`
- 错误日志：`./logs/error.log`
- 输出日志：`./logs/out.log`