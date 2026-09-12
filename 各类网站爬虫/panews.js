// Panews数据采集脚本
// 依赖: mysql2, axios
// 环境变量可选配置: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

const mysql = require('mysql2/promise')
const https = require('https')
const axios = require('axios')
const crypto = require('crypto')
const agent = new https.Agent({ rejectUnauthorized: true })

function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

let connection = null
async function connectMysql(){
  try {
    // 建立数据库连接，优先使用环境变量，否则使用默认值
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '82.157.161.88',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'HSXpwd@123',
      database: process.env.DB_NAME || 'block_chain'
    });
    console.log('数据库连接成功 ...');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error; // 抛出错误以便上层处理
  }
}


async function main() {
  // 使用 await 执行 SQL 查询
  const [rows, fields] = await connection.execute("select last_update_time from dt_news_list where site='panews' and new_type=2 order by last_update_time desc limit 1");
  const lastTime = rows[0]['last_update_time']
  const nowTimestamp = Math.floor(Date.now() / 1000)
  const timeout = nowTimestamp - lastTime
  console.log(`last crawl panews news time ${lastTime}, timeout: ${timeout}`)
  if (timeout < 10) {
    return
  }
  const url = 'https://api.panewslab.com/webapi/flashnews?rn=20&lid=1&apppush=0'
  const response = await axios.get(url, {
    httpsAgent: agent,
    headers: {
      'Host': 'api.panewslab.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'Cookie': '_ga=GA1.1.382407986.1747374684; _ga_KHBYDL8DMV=GS2.1.s1747607132$o6$g0$t1747607136$j0$l0$h0'
    }
  })
  const result = response.data.data


  
  for(const record of result.flashNews[0].list){
    const newURL = `https://www.panewslab.com/zh/articles/${record.id}`
    const newURLMd5 = md5(newURL)
    const info = {
      site: 'panews',
      new_id: record.id,
      new_type: record.type,
      new_url: newURL,
      new_url_md5: newURLMd5,
      title: record.title,
      description: record.desc,
      publish_time: record.publishTime,
      tags: record.tags? JSON.stringify(record.tags) : '',
      read_count: record.readnum,
      collection_count: record.collection,
      love_count: record.lovenum,
      author_id: record.author.id,
      author_name: record.author.name,
      author_img: record.author.img,
      img: record.img,
      push_flag: record.apppush == 1? 'y' : 'n',
      last_update_time: nowTimestamp,
      twitter_flag: 'y',  // 新增此行，指定 twitter_flag 为 'y'
    }
    const [rows] = await connection.execute(
            'SELECT id FROM dt_news_list WHERE new_url_md5 = ?',
            [newURLMd5]
        )
        
        if (rows.length > 0) {
            const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
            const values = Object.values(info)
            await connection.execute(
            `UPDATE dt_news_list SET ${fields} WHERE id = ?`,
            [...values, rows[0].id]
            )
            console.log(`记录已更新: ${info.title}`)
        } else {
            const fields = Object.keys(info).join(', ')
            const placeholders = Object.keys(info).map(() => '?').join(', ')
            const values = Object.values(info)
            
            await connection.execute(
            `INSERT INTO dt_news_list (${fields}) VALUES (${placeholders})`,
            values
            );
            console.log(`记录已插入: ${info.title}`)
        }
  }
  // 关闭连接
  //await connection.end();
}

async function run() {
  let isRunning = false;
  
  try {
    await connectMysql();
    console.log('开始定时执行Panews数据采集任务，间隔3秒...');
    
    // 每3秒执行一次 main() 函数
    setInterval(async () => {
      if (isRunning) {
        console.log('上一次任务尚未完成，跳过此次执行');
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
      }
    }, 3000);
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

