// Panews快讯采集脚本
// 依赖: mysql2, axios, dotenv
// 环境变量配置: .env文件

require('dotenv').config()

const mysql = require('mysql2/promise')
const https = require('https')
const axios = require('axios')
const agent = new https.Agent({rejectUnauthorized: false})

// 配置项
const CONFIG = {
  // 采集间隔时间数组（毫秒），从环境变量读取
  intervals: process.env.COLLECTOR_INTERVALS ? process.env.COLLECTOR_INTERVALS.split(',').map(Number) : [3000, 5000, 6500],
  // 过滤关键词，从环境变量读取
  filterKeywords: process.env.FILTER_KEYWORDS ? process.env.FILTER_KEYWORDS.split(',') : ['昨夜今晨']
}

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'a03007600',
  database: process.env.DB_NAME || 'block_chain'
}

let connection = null
let currentIntervalIndex = 0

async function connectMysql() {
  try {
    // 首先连接到MySQL服务器（不指定数据库）
    let tempConnection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });
    
    // 创建数据库（如果不存在）
    const dbName = DB_CONFIG.database;
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`数据库 ${dbName} 检查/创建完成`);
    
    // 关闭临时连接
    await tempConnection.end();
    
    // 连接到指定数据库
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: dbName
    });
    console.log('数据库连接成功 ...');
    
    // 创建表结构
    await createTable();
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error; // 抛出错误以便上层处理
  }
}

async function createTable() {
  try {
    // 创建快讯表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS panews_flash (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id VARCHAR(255) UNIQUE NOT NULL,
        original_title VARCHAR(255) NOT NULL,
        original_desc TEXT NOT NULL,
        rewritten_title VARCHAR(255) DEFAULT NULL,
        rewritten_desc TEXT DEFAULT NULL,
        status ENUM('collected', 'rewritten') DEFAULT 'collected',
        tg_sent TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('数据库表结构创建/检查完成');
  } catch (error) {
    console.error('创建表结构失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const url = 'https://api.panewslab.com/webapi/flashnews?rn=20&lid=1&apppush=0'
    const response = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        'Host': 'api.panewslab.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      }
    })
    
    const result = response.data.data
    
    if (result && result.flashNews && result.flashNews.length > 0) {
      for (const flashNews of result.flashNews) {
        if (flashNews.list && flashNews.list.length > 0) {
          for (const record of flashNews.list) {
            await processRecord(record);
          }
        }
      }
    }
  } catch (error) {
    console.error('采集数据出错:', error.message);
  }
}

async function processRecord(record) {
  try {
    // 检查标题是否包含过滤关键词
    const title = record.title || '';
    const containsKeyword = CONFIG.filterKeywords.some(keyword => 
      title.includes(keyword)
    );
    
    if (containsKeyword) {
      console.log(`记录包含过滤关键词，已忽略: ${title}`);
      return;
    }
    
    // 检查是否已存在
    const [rows] = await connection.execute(
      'SELECT id FROM panews_flash WHERE original_id = ?',
      [record.id]
    )
    
    if (rows.length > 0) {
      console.log(`记录已存在: ${title}`);
    } else {
      // 插入新记录
      await connection.execute(
        `INSERT INTO panews_flash (original_id, original_title, original_desc, status, tg_sent) 
         VALUES (?, ?, ?, 'collected', -1)`,
        [record.id, title, record.desc]
      );
      console.log(`记录已插入: ${title}`);
    }
  } catch (error) {
    console.error('处理记录出错:', error.message);
  }
}

function getCurrentInterval() {
  const interval = CONFIG.intervals[currentIntervalIndex];
  // 切换到下一个间隔时间，循环使用
  currentIntervalIndex = (currentIntervalIndex + 1) % CONFIG.intervals.length;
  return interval;
}

async function run() {
  let isRunning = false;
  
  try {
    await connectMysql();
    console.log(`开始定时执行Panews快讯采集任务，初始间隔${getCurrentInterval()}毫秒...`);
    
    // 执行定时任务
    async function executeTask() {
      if (isRunning) {
        console.log('上一次任务尚未完成，跳过此次执行');
        // 安排下一次执行
        const nextInterval = getCurrentInterval();
        setTimeout(executeTask, nextInterval);
        return;
      }
      
      isRunning = true;
      try {
        await main();
      } catch (err) {
        console.error('执行任务出错：', err.message);
        // 如果是数据库连接错误，可以尝试重新连接
        if (err.code && (err.code.includes('CONNECTION') || err.code.includes('PROTOCOL'))) {
          console.log('尝试重新连接数据库...');
          try {
            await connectMysql();
          } catch (reconnectErr) {
            console.error('数据库重新连接失败:', reconnectErr.message);
          }
        }
      } finally {
        isRunning = false;
        // 安排下一次执行
        const nextInterval = getCurrentInterval();
        console.log(`任务执行完成，下次执行间隔${nextInterval}毫秒`);
        setTimeout(executeTask, nextInterval);
      }
    }
    
    // 启动定时任务
    const initialInterval = getCurrentInterval();
    setTimeout(executeTask, initialInterval);
  } catch (err) {
    console.error('启动失败:', err.message);
    // 如果启动失败，等待3秒后重试
    setTimeout(() => {
      console.log('重新尝试启动...');
      run();
    }, 3000);
  }
}

run();
