#!/bin/bash

# 部署脚本 - 用于 Linux 服务器

echo "开始部署新闻管理 API..."

# 检查 Node.js 版本
echo "检查 Node.js 版本..."
node --version
npm --version

# 安装依赖
echo "安装依赖..."
npm install --production

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "错误: .env 文件不存在"
    echo "请创建 .env 文件并配置以下变量:"
    echo "DB_HOST=数据库主机"
    echo "DB_PORT=3306"
    echo "DB_USER=数据库用户名"
    echo "DB_PASSWORD=数据库密码"
    echo "DB_NAME=数据库名称"
    echo "PORT=3010"
    echo "NODE_ENV=production"
    exit 1
fi

# 测试数据库连接
echo "测试数据库连接..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ 数据库连接成功');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
})();
"

if [ $? -ne 0 ]; then
    echo "数据库连接失败，请检查配置"
    exit 1
fi

# 启动服务
echo "启动服务..."
npm start