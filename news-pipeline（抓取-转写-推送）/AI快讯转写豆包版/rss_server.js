// RSS服务接口
// 依赖: mysql2, express, dotenv

require('dotenv').config()

const mysql = require('mysql2/promise')
const express = require('express')
const app = express()
const port = process.env.RSS_PORT || 3000

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'a03007600',
  database: process.env.DB_NAME || 'block_chain'
}

let connection = null

async function connectMysql() {
  try {
    // 建立数据库连接
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database
    });
    console.log('数据库连接成功 ...');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error;
  }
}

async function getNewsData() {
  try {
    // 查询已转写的新闻，按创建时间倒序排列，取前10条
    const [rows] = await connection.execute(
      'SELECT original_id, rewritten_title, rewritten_desc, created_at FROM panews_flash WHERE status = ? ORDER BY created_at DESC LIMIT 10',
      ['rewritten']
    );
    return rows;
  } catch (error) {
    console.error('查询新闻数据出错:', error.message);
    return [];
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateRSS(data) {
  // 生成RSS XML
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>HashNews</title>
<link>https://hashnews.pro/</link>
<description/>
`;
  
  // 生成item
  data.forEach((item, index) => {
    // 生成唯一的code
    const code = generateCode(item.original_id);
    const link = `https://hashnews.pro/news?code=${code}`;
    
    // 格式化日期
    const pubDate = new Date(item.created_at).toUTCString();
    
    // 构建description
    const escapedTitle = escapeHtml(item.rewritten_title);
    const escapedDesc = escapeHtml(item.rewritten_desc);
   // const description = `&lt;div style='font-weight:bold'&gt;${escapedTitle}&lt;/div&gt;&lt;br/&gt;&lt;br/&gt;哈世链闻消息，${escapedDesc}`;
     const description = `哈世链闻消息，${escapedDesc}`;
    rss += `
<item>
<title>${escapedTitle}</title>
<link>${link}</link>
<guid>${link}</guid>
<category>HashNews</category>
<pubDate>${pubDate}</pubDate>
<description>${description}</description>
</item>`;
  });
  
  rss += `
</channel>
</rss>`;
  
  return rss;
}

function generateCode(originalId) {
  // 基于原始ID生成唯一的code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    const index = (originalId.charCodeAt(i % originalId.length) + i) % chars.length;
    code += chars[index];
  }
  return code;
}

app.get('/rss/news', async (req, res) => {
  try {
    const newsData = await getNewsData();
    const rssXml = generateRSS(newsData);
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rssXml);
  } catch (error) {
    console.error('生成RSS出错:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

async function startServer() {
  try {
    await connectMysql();
    app.listen(port, () => {
      console.log(`RSS服务已启动，访问地址: http://localhost:${port}/rss`);
    });
  } catch (error) {
    console.error('启动RSS服务失败:', error.message);
    // 等待3秒后重试
    setTimeout(() => {
      console.log('重新尝试启动RSS服务...');
      startServer();
    }, 3000);
  }
}

startServer();
