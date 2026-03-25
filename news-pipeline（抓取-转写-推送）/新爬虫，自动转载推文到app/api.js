const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

// 创建Express应用
const app = express();
const port = 3008;

// 配置CORS中间件，允许所有跨域请求
app.use(cors());

// 配置对象
const config = {
  dbConfig: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  }
};

/**
 * 连接数据库
 * @returns {Promise<Connection>} - 数据库连接对象
 */
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(config.dbConfig);
    return connection;
  } catch (error) {
    console.error('连接数据库失败:', error);
    throw error;
  }
}

/**
 * 分页查询推文列表，支持按title模糊搜索
 */
app.get('/api/tweets', async (req, res) => {
  try {
    // 获取查询参数
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const title = req.query.title || '';
    const exclude = req.query.exclude || '';
    
    // 处理排除关键字
    const excludeKeywords = exclude.split(',').filter(keyword => keyword.trim() !== '');
    
    // 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 连接数据库
    const connection = await connectToDatabase();
    
    // 执行查询
    let tweets, countResult;
    let query, countQuery;
    let queryParams = [];
    let countParams = [];
    
    // 构建查询条件
    if (title) {
      // 有标题搜索
      const titlePattern = `%${title}%`;
      query = 'SELECT id, url, type, title, content, media_urls, status, created_at FROM twitter_tweets WHERE title LIKE ? AND status = 2';
      countQuery = 'SELECT COUNT(*) as total FROM twitter_tweets WHERE title LIKE ? AND status = 2';
      queryParams.push(titlePattern);
      countParams.push(titlePattern);
    } else {
      // 没有标题搜索
      query = 'SELECT id, url, type, title, content, media_urls, status, created_at FROM twitter_tweets WHERE status = 2';
      countQuery = 'SELECT COUNT(*) as total FROM twitter_tweets WHERE status = 2';
    }
    
    // 添加排除条件
    if (excludeKeywords.length > 0) {
      excludeKeywords.forEach((keyword, index) => {
        const excludePattern = `%${keyword.trim()}%`;
        query += ' AND title NOT LIKE ?';
        countQuery += ' AND title NOT LIKE ?';
        queryParams.push(excludePattern);
        countParams.push(excludePattern);
      });
    }
    
    // 添加排序和分页
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);
    
    // 执行查询
    tweets = await connection.query(query, queryParams);
    countResult = await connection.query(countQuery, countParams);
    
    // 关闭数据库连接
    await connection.end();
    
    // 计算总页数
    const total = countResult[0][0].total;
    const totalPages = Math.ceil(total / pageSize);
    
    // 返回响应
    res.json({
      success: true,
      data: tweets[0],
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('查询推文失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 获取单个推文详情
 */
app.get('/api/tweets/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 连接数据库
    const connection = await connectToDatabase();
    
    // 执行查询
    const [tweets] = await connection.execute(
      'SELECT id, url, type, title, content, media_urls, status, created_at FROM twitter_tweets WHERE id = ? AND status = 2',
      [id]
    );
    
    // 关闭数据库连接
    await connection.end();
    
    if (tweets.length === 0) {
      return res.status(404).json({
        success: false,
        message: '推文不存在'
      });
    }
    
    res.json({
      success: true,
      data: tweets[0]
    });
  } catch (error) {
    console.error('查询推文详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 删除推文
 */
app.delete('/api/tweets/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 连接数据库
    const connection = await connectToDatabase();
    
    // 执行删除操作
    const [result] = await connection.execute(
      'DELETE FROM twitter_tweets WHERE id = ?',
      [id]
    );
    
    // 关闭数据库连接
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '推文不存在或已被删除'
      });
    }
    
    res.json({
      success: true,
      message: '推文删除成功'
    });
  } catch (error) {
    console.error('删除推文失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 将推文状态更新为1
 */
app.patch('/api/tweets/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 连接数据库
    const connection = await connectToDatabase();
    
    // 执行更新操作，将status字段改为1
    const [result] = await connection.execute(
      'UPDATE twitter_tweets SET status = 1 WHERE id = ?',
      [id]
    );
    
    // 关闭数据库连接
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '推文不存在'
      });
    }
    
    res.json({
      success: true,
      message: '推文状态已更新为1'
    });
  } catch (error) {
    console.error('更新推文状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`✅ API服务器已启动，监听端口 ${port}`);
  console.log(`📝 API文档:`);
  console.log(`   GET /api/tweets - 分页查询推文列表`);
  console.log(`   GET /api/tweets/:id - 获取单个推文详情`);
  console.log(`   DELETE /api/tweets/:id - 删除推文`);
  console.log(`   PATCH /api/tweets/:id/status - 将推文状态更新为1`);
  console.log(`📋 查询参数:`);
  console.log(`   page: 页码 (默认: 1)`);
  console.log(`   pageSize: 每页条数 (默认: 10)`);
  console.log(`   title: 标题模糊搜索 (可选)`);
  console.log(`   exclude: 排除标题中含有指定关键字的条目，用英文逗号分隔多个关键字 (可选)`);
});
