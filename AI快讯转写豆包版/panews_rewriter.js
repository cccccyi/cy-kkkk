// Panews快讯转写脚本
// 依赖: mysql2, axios, dotenv
// 功能: 监控panews_flash表中的新数据并调用豆包大模型进行转写

require('dotenv').config()

const mysql = require('mysql2/promise')
const axios = require('axios')

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'a03007600',
  database: process.env.DB_NAME || 'block_chain'
}

let connection = null

// 提示词
const PROMPT = `你是一个专业的区块链新闻编辑，擅长将复杂的区块链新闻转化为简洁明了的中文报道。
请根据以下新闻标题和内容，重新撰写一个更吸引人的标题和内容。
要求：
1. 标题要突出核心信息，简洁有力
2. 内容要保留关键信息，语言流畅自然
3. 保持原文的事实准确性
4. 去掉PANews的痕迹，以及所有与PANews相关的内容、字样
5. 输出格式为JSON，包含两个字段：rewritten_title和rewritten_desc

请严格按照JSON格式输出，不要添加任何其他内容。`

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

async function getUnprocessedRecords() {
  try {
    // 查询状态为collected的记录，按ID排序确保处理顺序
    const [rows] = await connection.execute(
      'SELECT id, original_id, original_title, original_desc FROM panews_flash WHERE status = ? ORDER BY id ASC LIMIT 5',
      ['collected']
    );
    return rows;
  } catch (error) {
    console.error('查询未处理记录出错:', error.message);
    return [];
  }
}

async function callDoubaoAPI(title, desc) {
  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/responses',
      {
        "model": "doubao-seed-2-0-lite-260215",
        "input": [
          {
            "role": "user",
            "content": [
              {
                "type": "input_text",
                "text": `${PROMPT}\n\n标题：${title}\n\n内容：${desc}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Authorization": "Bearer 89adda99-f132-4ac1-9209-ab7d4cf5fd10",
          "Content-Type": "application/json"
        }
      }
    );
    
    // 详细日志
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    // 安全解析响应
    if (response.data && response.data.output && Array.isArray(response.data.output)) {
      // 找到类型为message的输出
      const messageOutput = response.data.output.find(output => output.type === 'message');
      
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        const textContent = messageOutput.content.find(content => content.type === 'output_text');
        
        if (textContent && textContent.text) {
          const content = textContent.text;
          console.log('豆包API返回:', content);
          
          // 尝试解析JSON
          try {
            const parsed = JSON.parse(content);
            return parsed;
          } catch (parseError) {
            console.error('解析豆包返回的JSON失败:', parseError.message);
            return null;
          }
        }
      }
      console.error('API响应格式不符合预期');
      return null;
    } else {
      console.error('API响应格式不符合预期');
      return null;
    }
  } catch (error) {
    console.error('调用豆包API出错:', error.message);
    if (error.response) {
      console.error('API错误响应:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function updateRecord(id, rewrittenTitle, rewrittenDesc) {
  try {
    // 更新记录
    await connection.execute(
      'UPDATE panews_flash SET rewritten_title = ?, rewritten_desc = ?, status = ?, tg_sent = 0 WHERE id = ?',
      [rewrittenTitle, rewrittenDesc, 'rewritten', id]
    );
    console.log(`记录更新成功: ID ${id}`);
  } catch (error) {
    console.error('更新记录出错:', error.message);
  }
}

async function processRecords() {
  try {
    const records = await getUnprocessedRecords();
    
    for (const record of records) {
      console.log(`处理记录: ${record.original_title}`);
      
      // 调用豆包API进行转写
      const rewritten = await callDoubaoAPI(record.original_title, record.original_desc);
      
      if (rewritten && rewritten.rewritten_title && rewritten.rewritten_desc) {
        // 更新记录
        await updateRecord(record.id, rewritten.rewritten_title, rewritten.rewritten_desc);
      } else {
        console.log(`转写失败: ${record.original_title}`);
      }
      
      // 避免请求过于频繁，添加延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('处理记录出错:', error.message);
  }
}

async function run() {
  let isRunning = false;
  
  try {
    await connectMysql();
    console.log('开始定时执行Panews快讯转写任务，间隔5秒...');
    
    // 每5秒执行一次处理
    setInterval(async () => {
      if (isRunning) {
        console.log('上一次任务尚未完成，跳过此次执行');
        return;
      }
      
      isRunning = true;
      try {
        await processRecords();
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
      }
    }, 5000);
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
