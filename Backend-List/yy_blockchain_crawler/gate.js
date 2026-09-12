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
    // 建立数据库连接
  connection = await mysql.createConnection({
    host: '82.157.161.88',
    user: 'root',
    password: 'HSXpwd@123',
    database: 'block_chain'
  });
  console.log('数据库连接成功 ...');
}


async function main() {
  // 使用 await 执行 SQL 查询
  const [rows, fields] = await connection.execute("select last_update_time from dt_news_list where site='gate' order by last_update_time desc limit 1");
  const lastTime = rows.length > 0? rows[0]['last_update_time'] : 0
  const nowTimestamp = Math.floor(Date.now() / 1000)
  const timeout = nowTimestamp - lastTime
  console.log(`last crawl gate announce time ${lastTime}, timeout: ${timeout}`)
  if (timeout < 10) {
    return
  }
  const url = 'https://www.gate.com/zh/announcements/newlisted'
  const response = await axios.get(url, {}, {httpsAgent: agent})
  const htmlStr = response.data
  const pattern = /<script.*?id="__NEXT_DATA__".*?>(.*?)<\/script>/
  const matchObj = htmlStr.match(pattern)
  if(matchObj && matchObj[1]){
    //console.log(matchObj[1])
    const data = JSON.parse(matchObj[1])
    //console.log(JSON.stringify(data))
    const items = data.props.pageProps.listData.list || []
    for(const record of items){
      const newURL = `https://www.gate.com/zh/announcements/article/${record.id}`
      const newURLMd5 = md5(newURL)
      const info = {
        site: 'gate',
        new_id: record.id,
        new_type: 'announce',
        primary_category: '数字货币及交易对上新',
        new_url: newURL,
        new_url_md5: newURLMd5,
        title: record.title,
        publish_time: record.release_timestamp,
        last_update_time: nowTimestamp
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
  }
  // 详情页采集
  const [news] = await connection.execute("select id,new_url from dt_news_list where site='gate' and content is null order by id");
  for (const row of news) {
    console.log(row.new_url)
    const response = await axios.get(row.new_url, {}, {httpsAgent: agent})
    const htmlStr = response.data
    const pattern = /<script.*?id="__NEXT_DATA__".*?>(.*?)<\/script>/
    const matchObj = htmlStr.match(pattern)
    if(matchObj && matchObj[1]){
      //console.log(matchObj[1])
      const data = JSON.parse(matchObj[1])
      //console.log(JSON.stringify(data))
      let title = data.props.pageProps.tdkTitle || ''
      let content = data.props.pageProps.tdkDescription || ''
      if(content){
        const info = {
          title: title,
          content: content
        }
        const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
        const values = Object.values(info)
        await connection.execute(
          `UPDATE dt_news_list SET ${fields} WHERE id = ?`,
          [...values, row.id]
        )
        console.log(`记录已更新: ${row.id}`)
      }
    }
  }
  // 关闭连接
  //await connection.end();
}

async function run() {
    let isRunning = false;
    await connectMysql();
    // 每10秒执行一次 main() 函数
    setInterval(async () => {
        if (isRunning) {
          console.log('上一次任务尚未完成，跳过此次执行');
          return;
        }
        isRunning = true;
        try {
          await main();
        } catch (err) {
          console.error('执行任务出错：', err);
        } finally {
          isRunning = false;
        }
    }, 3000);
}

run();
