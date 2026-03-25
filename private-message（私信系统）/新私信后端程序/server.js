const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeDatabase } = require('./config/initDatabase');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api', apiRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    console.log('正在初始化数据库...');
    await initializeDatabase();
    console.log('数据库初始化完成');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`服务器启动成功！`);
      console.log(`端口: ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
      console.log(`保存接口: http://localhost:${PORT}/api/save`);
      console.log(`获取用户列表: http://localhost:${PORT}/api/users`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer();