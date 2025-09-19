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
  const apikey = 'LWIzMWUtYzU0Ny1kMjk5LWI2ZDA3Yjc2MzFhYmEyYzkwM2NjfDI4NTQ2MDA1MTc4OTAzNDc='
  /*
  // 使用 await 执行 SQL 查询
  const [rows, fields] = await connection.execute("select last_update_time from dt_news_list where site='panews' and new_type=2 order by last_update_time desc limit 1");
  const lastTime = rows[0]['last_update_time']
  const nowTimestamp = Math.floor(Date.now() / 1000)
  const timeout = nowTimestamp - lastTime
  console.log(`last crawl panews news time ${lastTime}, timeout: ${timeout}`)
  if (timeout < 30) {
    return
  }
  **/
  const url = 'https://api.coinank.com/api/longshort/longShortRatio?limit=3&exchangeName=Binance&interval=5m&baseCoin=BTC&exchangeType=USDT&type=USDT'
  const headers = {
    'coinank-apikey': apikey,
    'client': 'web',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  }
  const response = await axios.get(url, { headers }, {httpsAgent: agent})
  const htmlStr = response.data
  console.log(response.data)
  return
  const pattern = /<script>window\.__NUXT__=\((.*?)\)<\/script>/
  const matchObj = htmlStr.match(pattern)
  if(matchObj && matchObj[1]){
    const data = eval("(" + matchObj[1] + ")")
    const sqTopicsList = data.data[0].sqTopicsList
    for(const list of sqTopicsList){
        for(const record of list.list){
        const newURL = `https://www.panewslab.com/zh/sqarticledetails/${record.id}.html`
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
        return
    }, 10000);
}

run();


