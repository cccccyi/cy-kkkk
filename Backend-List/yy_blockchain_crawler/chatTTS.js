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
  const url = 'http://127.0.0.1:9966/tts'
  const data = {
    "text": "哈世链闻消息，佛罗里达州众议院提出的第487号法案和参议院的第550号法案，于5月3日被无限期推迟和撤回。这两项法案原计划允许州财政最高10%的公共资金投资于比特币，建立州级加密储备。然而，佛州议会在5月2日会议结束前并未通过相关立法，已正式退出州级比特币储备法案竞争。在此之前，类似法案也在南达科他州、蒙大纳州等地失败。相比之下，亚利桑那州仍有两项相关提案待决。",
    "prompt": "",
    "voice": "3333",
    "temperature": 0.3,
    "top_p": 0.7,
    "top_k": 20,
    "refine_max_new_token": "384",
    "infer_max_new_token": "2048",
    "skip_refine": 0,
    "is_split": 1,
    "custom_voice": 0
  }
  
  const response = await axios.psot(url, data, {httpsAgent: agent})
  const htmlStr = response.data
  console.log(response.data)
  // 关闭连接
  //await connection.end();
}

async function run() {
    await connectMysql();
    await main().catch(err => console.error('执行任务出错：', err));
    return;
    // 每10秒执行一次 main() 函数
    setInterval(async () => {
        await main().catch(err => console.error('执行任务出错：', err));
    }, 10000);
}

run();

