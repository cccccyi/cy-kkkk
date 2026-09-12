const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./src/config/database');
const { pool } = require('./src/config/database');
const { errorHandler, requestLogger } = require('./src/utils/middleware');
const { loadSecurityConfig, createBearerAuth } = require('./src/utils/security');
const newsRoutes = require('./src/routes/newsRoutes');

const app = express();
const PORT = process.env.PORT || 3010;
const HOST = process.env.HOST || '127.0.0.1';
const securityConfig = loadSecurityConfig();
const bearerAuth = createBearerAuth(securityConfig.tokenDigest);

app.use(cors(securityConfig.corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.post('/api/session', bearerAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true });
});
app.use('/api', bearerAuth, newsRoutes);

// API 文档
app.get('/', (req, res) => {
  res.json({
    message: '新闻管理 API',
    version: '1.0.0',
    endpoints: {
      'POST /api/news': {
        description: '创建新闻',
        required: ['title'],
        optional: [
          'source_id', 'publish_time', 'primary_category', 
          'categories', 'tags', 'push_flag', 'content', 'detail_content',
          'title_en', 'content_en', 'detail_content_en', 'audio_text', 
          'remark', 'create_by', 'update_by', 'sounds'
        ],
        auto_fields: {
          'unique_code': '自动生成10位字母数字编码',
          'del_flag': '默认"0"（未删除）',
          'status': '默认"0"（正常状态）',
          'tg_status': '默认"i"（TG初始状态）',
          'push_status': '默认"i"（推送初始状态）',
          'push_flag': '默认"n"（不推送）',
          'publish_time': '默认当前时间戳'
        }
      },
      'GET /api/news': {
        description: '获取新闻列表',
        query: ['page', 'limit', 'category', 'status', 'keyword', 'sortBy', 'sortOrder']
      },
      'GET /api/news/:id': {
        description: '根据ID获取新闻详情'
      },
      'PUT /api/news/:id': {
        description: '更新新闻',
        optional: [
          'title', 'content', 'primary_category', 'categories', 'tags', 
          'status', 'update_by', 'publish_time', 'del_flag', 'tg_status', 
          'push_status', 'push_flag', 'source_id', 'detail_content', 
          'title_en', 'content_en', 'detail_content_en', 'audio_text', 
          'remark', 'sounds'
        ],
        note: '支持修改 del_flag 进行逻辑删除（"0"=未删除，"1"=已删除）'
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    // 测试连接池
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();

    app.listen(PORT, HOST, () => {
      console.log(`服务器运行在 ${HOST}:${PORT}`);
      console.log(`API 文档: http://${HOST}:${PORT}/`);
      console.log(`新闻接口: http://${HOST}:${PORT}/api/news`);
    });
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    console.error('服务器启动终止');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
