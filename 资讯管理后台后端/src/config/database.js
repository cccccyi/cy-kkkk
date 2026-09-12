const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// 根据环境选择不同的配置
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  connectionLimit: isProduction ? 20 : 10,
  // 生产环境配置
  ...(isProduction && {
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA_PATH && {
        ca: fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8')
      })
    }
  }),
  // 开发环境配置
  ...(!isProduction && {
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  })
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    
    // 提供详细的错误信息
    if (error.code === 'ENOTFOUND') {
      console.error('无法解析数据库主机地址');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('数据库连接被拒绝，请检查端口和服务状态');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('数据库访问被拒绝，请检查用户名和密码');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('数据库不存在，请检查数据库名称');
    }
    
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
