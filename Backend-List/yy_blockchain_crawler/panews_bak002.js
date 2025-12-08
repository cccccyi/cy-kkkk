const mysql = require('mysql2/promise')
const https = require('https')
const axios = require('axios')
const crypto = require('crypto')
const agent = new https.Agent({rejectUnauthorized: false})

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
  const [rows, fields] = await connection.execute("select last_update_time from dt_news_list where site='panews' and new_type=2 order by last_update_time desc limit 1");
  const lastTime = rows[0]['last_update_time']
  const nowTimestamp = Math.floor(Date.now() / 1000)
  const timeout = nowTimestamp - lastTime
  console.log(`last crawl panews news time ${lastTime}, timeout: ${timeout}`)
  if (timeout < 30) {
    return
  }
  const url = 'https://www.panewslab.com/zh/newsflash'
  const response = await axios.get(url, {}, {httpsAgent: agent})
  const htmlStr = response.data
  // console.log(response.data)
  const pattern = /<script.*?id="__NUXT_DATA__">(.*?)<\/script>/
  const matchObj = htmlStr.match(pattern)
  if(matchObj && matchObj[1]){
    const data = eval("(" + matchObj[1] + ")")
    for(let i=0; i<data.length; i++){
      if(typeof data[i] === 'object' && data[i] && Object.keys(data[i]).length == 16){
        const record = data[i]
        //console.log(i, Object.keys(data[i]).length, data[i])
        console.log('author:', data[record.author])
        const newURL = `https://www.panewslab.com/zh/articles/${data[record.id]}`
        const newURLMd5 = md5(newURL)
        const info = {
          site: 'panews',
          new_id: data[record.id],
          new_type: data[record.type],
          new_url: newURL,
          new_url_md5: newURLMd5,
          title: data[record.title],
          description: data[record.desc],
          publish_time: data[record.publishTime],
          tags: data[record.tags]? JSON.stringify(data[record.tags]) : '',
          read_count: data[record.readnum],
          collection_count: data[record.collection],
          love_count: data[record.lovenum],
          author_id: data[data[record.author].id],
          author_name: data[data[record.author].name],
          author_img: data[data[record.author].img],
          img: data[record.img],
          push_flag: data[record.apppush] == 1? 'y' : 'n',
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
  }
  // 关闭连接
  //await connection.end();
}

async function run() {
    await connectMysql();
    // 每10秒执行一次 main() 函数
    setInterval(async () => {
        await main().catch(err => console.error('执行任务出错：', err));
    }, 10000);
}

run();


