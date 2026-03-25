const mysql = require('mysql2/promise');
const dbConfig = require('./database');

// 创建数据库连接（不指定数据库）
async function createDatabaseIfNotExists() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  try {
    // 创建数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`数据库 ${dbConfig.database} 创建成功或已存在`);
  } catch (error) {
    console.error('创建数据库失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 初始化数据表
async function initializeTables() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // 创建用户表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        screen_name VARCHAR(255) NOT NULL,
        image_url TEXT,
        followed_by BOOLEAN DEFAULT FALSE,
        \`call\` INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createTableSQL);
    console.log('用户表创建成功或已存在');
    
    // 检查表是否存在
    const [rows] = await connection.execute('SHOW TABLES LIKE "users"');
    if (rows.length > 0) {
      console.log('users 表已存在');
    }
  } catch (error) {
    console.error('创建数据表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 初始化数据库
async function initializeDatabase() {
  try {
    console.log('开始初始化数据库...');
    await createDatabaseIfNotExists();
    await initializeTables();
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  createDatabaseIfNotExists,
  initializeTables
};