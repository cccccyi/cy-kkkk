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

const iconMaps = {
  BTC: 'https://static.futunn.com/futu5_website/img/68615d1.png',
  ETH: 'https://static.futunn.com/futu5_website/img/8841be9.png',
  AVAXUSD: 'https://static.futunn.com/futu5_website/img/0e589e7.png',
  LINKUSD: 'https://static.futunn.com/futu5_website/img/97692be.png',
  SOL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACFUlEQVRoBe2YoavCUBTG7z/w/gHDwoLJZHom28qKFotgXDUYbGLUZBFMGl1cFMRgUDAICgZBiwgGLSJYVuSFA4fLnbsb4pnyOHKRa9r3+757tm8KwR92gB1gB9gBdoAdYAfYAXaAHUjcgR8znR8v8uNFbj7LzWfZ1TS7mmZ2k8xukj6OcJlnT17GzZVXyh+ELXIgy1ta3pKOgRbAHq4BICZD+jiSczDPnpyDcXOVHGjVF/qbQn9jD9eIEZmDefZkBuPmygwpfyAz0KovdbcAoDBAFDAPT0ciJgOt+kp7X2nvS90tYgRz0I91EEM+S7TqncYBADQMMUdCmQc4TrTqq7WT0zjA0ufwAoNxc2nVCyGqtRMdA7l6vgA7wA6IVvHeLF+b5WvducB671iTW9wq3v8VA0YBOeAdNuwREbM1JZqDwqB5zCmtSW5+0Jrkt4iEGJTjpMnhhdb0RQyRrSmsvX6Goe5c5FuTPA9Pc9C3pq9gwAIb1sA1DOQAfAF2gB0QHduHBUUDvzWtKf5LKbm/svoghoYh5q2JFqBj+z3rgQwd20f7caNhiMyBVn3PesCSAXCPALDByoSPucjml5z6YAjBKCAHxNC0Jvi/LCH1GEJYFMEc4jB8QH1wGCAEJQolBzxO8h9NH1D/xhxo1QshFK1hP3GUcaM5S5hDyvglB+ALsAPsADvADrAD7AA7wA6wA+xAwIE/hm/DAV+xjpAAAAAASUVORK5CYII=',
  TON: 'https://static.futunn.com/futu5_website/img/557e800.png',
  ARB: 'https://static.futunn.com/futu5_website/img/21c8b4e.svg',
  XRP: 'https://static.futunn.com/futu5_website/img/c9a5a59.png',
  IOTX: 'https://static.futunn.com/futu5_website/img/904a66a.png',
  KAIA: 'https://static.futunn.com/futu5_website/img/5372167.png',
  DOGE: 'https://static.futunn.com/futu5_website/img/21cb457.png',
  POL: 'https://static.futunn.com/futu5_website/img/d78a7c9.png',
  IMX: 'https://static.futunn.com/futu5_website/img/9748908.png',
  LTC: 'https://static.futunn.com/futu5_website/img/d21b040.png',
  APT: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACSElEQVRoBe1Z27GEIAz1lxboYeuwHX5tw0LowC5sgwbyEe7MZm6GRWURwce94WMHlgDnHJOA2HVSRAFRQBQQBUQBUeAvKaC1ds4BgA+Kexet9U2ZKqWGYYDfgu/C+BHRe4+I1I+I4zjeiEkkNuNOV4jMlTS01mmIOb30cJRSFzAhr8hBmWNzKocq2gMARwUxPCnEx3HMUfSrzTzPXdcZY8iLyN5a29aXtNZlIbvkw0CttWFv2+dA+fHgLwAweqp478mjaOZT4yGCIk1RoJ0Cfd8DwOv1ardEw5mVUpwuGy7TaGprbZh8AaDv+8y1KmQkOjIUp06CzvKHKf/rnN77TJ4ps1C8cPkT6ssdIwV0tU9rvSreLvTTNO2yZ2NEPLoxL9+tePbMCusSRULOcDrt8QwlFfbgr/4aGdDAKFj3hhMdMUpwNxpTIaU0QibT3kwBADiaPS5kROmlQgq/hAPverR7XILhY9H893eCzgToORzfBCu4YoQpZwOqaPMhZ1kjnwDpfVz1kH8Z5o9RmfcoHLUVCVS7ZQkl2aqHpLdsdv3PioQzF9aNMcN2McYszwjb5rk9xphCuDLsIQo457z3S+d5Bvx5numw7px7Hge6juV06Zx7huqEMrpM3pUZ08aIOE3TGVrkH5DSiKPesy/t2IUiHAVNRLwmkPKPSQlWNXfcAv9TSjnnCp4GfdG4RvhVnmFwEx9mxU2650HEaqe0VSjFf5Kc9B2NBCbP4a+RFKY3Uj1BNUIZNRMDpUsUEAVEAVFAFPhXCvwAPZKFNml4NegAAAAASUVORK5CYII=',
  AAVE: 'https://static.futunn.com/futu5_website/img/92ac352.png',
  UNI: 'https://static.futunn.com/futu5_website/img/c2b664c.png',
  USDT: 'https://static.futunn.com/futu5_website/img/3f847ab.png',
  OP: 'https://static.futunn.com/futu5_website/img/fb31472.svg'
}

function parseNumber(str){
  if (!str || typeof str !== 'string') return null;
  const unitMap = {
    '亿': 1e8, // 100,000,000
    '万': 1e4, // 10,000
    '千': 1e3, // 1,000
    '百': 1e2, // 100
    '': 1 // 无单位
  };
  const match = str.match(/^(\d*\.?\d+)(亿|万|千|百)?$/);
  if (!match) return null; // 格式不匹配，返回 null
  const number = parseFloat(match[1]); // 提取数字部分（如 10.89）
  const unit = match[2] || ''; // 提取单位（如 '亿'），无单位为空
  return number * unitMap[unit];
}

async function futnn_coins() {
  const brokerage = '富途'
  const urls = [
    'https://www.futunn.com/crypto/BTC-CC',
    'https://www.futunn.com/crypto/ETH-CC',
    'https://www.futunn.com/crypto/AVAXUSD-CC',
    'https://www.futunn.com/crypto/LINKUSD-CC',
    'https://www.futunn.com/crypto/SOL-CC',
    'https://www.futunn.com/crypto/TON-CC',
    'https://www.futunn.com/crypto/ARB-CC',
    'https://www.futunn.com/crypto/XRP-CC',
    'https://www.futunn.com/crypto/IOTX-CC',
    'https://www.futunn.com/crypto/KAIA-CC',
    'https://www.futunn.com/crypto/DOGE-CC',
    'https://www.futunn.com/crypto/POL-CC',
    'https://www.futunn.com/crypto/IMX-CC',
    'https://www.futunn.com/crypto/LTC-CC',
    'https://www.futunn.com/crypto/APT-CC',
    'https://www.futunn.com/crypto/AAVE-CC',
    'https://www.futunn.com/crypto/UNI-CC',
    'https://www.futunn.com/crypto/USDT-CC',
    'https://www.futunn.com/crypto/OP-CC'
  ]
  for(const url of urls){
    const response = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        'Host': 'www.futunn.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      }
    })
    const html = response.data
    // console.log(html)
    const matchObj = html.match(/window\.__INITIAL_STATE__=(.*?);\(/)
    if(matchObj && matchObj[1]){
      let data = {}
      try{
        data = JSON.parse(matchObj[1])
      }catch(e){
        console.log(matchObj)
        continue
      }
      const stockInfo = data.stock_info
      //console.log(data)
      const info = {
        exchange: brokerage,
        stockId: stockInfo.stockId,
        name: stockInfo.name,
        stockCode: stockInfo.stockCode,
        iconUrl: iconMaps[stockInfo.stockCode],
        price: stockInfo.price,
        priceChange: stockInfo.change,
        changeRatio: stockInfo.changeRatio,
        priceDirect: stockInfo.priceDirect,
        priceLastClose: stockInfo.priceLastClose,
        priceOpen: stockInfo.priceOpen,
        priceHighest: stockInfo.priceHighest,
        priceLowest: stockInfo.priceLowest,
        volume: parseNumber(stockInfo.volume),
        turnover: parseNumber(stockInfo.turnover),
        priceHighest_24h: stockInfo.statistics_24h.priceHighest,
        priceLowest_24h: stockInfo.statistics_24h.priceLowest,
        volume_24h: parseNumber(stockInfo.statistics_24h.volume),
        turnover_24h: parseNumber(stockInfo.statistics_24h.turnover),
        priceChange_24h: stockInfo.statistics_24h.priceChange,
        ratioPriceChange_24h: stockInfo.statistics_24h.ratioPriceChange,
        outstandingShares: stockInfo.outstandingShares,
        outstandingMarketCap: stockInfo.outstandingMarketCap,
        priceHighestHistory: stockInfo.priceHighestHistory,
        priceLowestHistory: stockInfo.priceLowestHistory,
        priceHighest_52week: stockInfo.priceHighest_52week,
        priceLowest_52week: stockInfo.priceLowest_52week
      }
      //console.log(info);
      const [rows] = await connection.execute(
          'SELECT id FROM dt_crawl_brokerage_coin_list WHERE exchange=? and stockId = ?',
          [brokerage, stockInfo.stockId]
      )
      
      if (rows.length > 0) {
          const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
          const values = Object.values(info)
          await connection.execute(
          `UPDATE dt_crawl_brokerage_coin_list SET ${fields} WHERE id = ?`,
          [...values, rows[0].id]
          )
          console.log(`记录已更新 ${brokerage}: ${info.name}`)
      } else {
          const fields = Object.keys(info).join(', ')
          const placeholders = Object.keys(info).map(() => '?').join(', ')
          const values = Object.values(info)
          
          await connection.execute(
          `INSERT INTO dt_crawl_brokerage_coin_list (${fields}) VALUES (${placeholders})`,
          values
          );
          console.log(`记录已插入 ${brokerage}: ${info.name}`)
      }
    }else{
      console.log('解析html失败 ...');
      console.log(url);
      //console.log(html)
    }
  }
  // 关闭连接
  //await connection.end();
}

// 胜利证券 - HashKey 数据
async function hashkey_coins() {
  const source = 'hashkey'
  const brokerage = '胜利证券'
  const url = 'https://api-pro.hashkey.com/quote/v1/ticker/24hr'
  const response = await axios.get(url, {
    httpsAgent: agent,
    headers: {
      'accept': 'application/json'
    }
  })
  const data = response.data
  for(const item of data){
    const info = {
      source: source,
      stockId: null,
      name: item.s,
      stockCode: item.s,
      iconUrl: '',
      price: item.c,
      priceChange: null,
      changeRatio: null,
      priceDirect: null,
      priceLastClose: null,
      priceOpen: item.o,
      priceHighest: item.h,
      priceLowest: item.l,
      volume: item.v,
      turnover: item.qv,
      volume_24h: item.v,
      turnover_24h: item.qv
    }
    await process_save_hashkey_coin(brokerage, source, info)
    if (['BTCUSD', 'BTCHKD', 'ETHUSD', 'ETHHKD'].includes(item.s)) {
      process_save_hashkey_coin('哈富证券', source, info)
    }
    
  }

  // 关闭连接
  //await connection.end();
}


// 胜利证券 - HashKey 数据
async function osl_coins() {
  const source = 'osl'
  const brokerage = '胜利证券'
  const urls = [
    'https://trade-hk.osl.com/api/v4/instrument?symbol=BTCUSD',
    'https://trade-hk.osl.com/api/v4/instrument?symbol=ETHUSD'
  ]
  for (const url of urls) {
    const response = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        'accept': 'application/json'
      }
    })
    const data = response.data
    const item = data[0]
    const info = {
      source: source,
      stockId: null,
      name: item.symbol,
      stockCode: item.symbol,
      iconUrl: '',
      price: item.lastPrice,
      priceChange: null,
      changeRatio: null,
      priceDirect: null,
      priceLastClose: null,
      priceOpen: item.askPrice,
      priceHighest: item.highPrice,
      priceLowest: item.lowPrice,
      volume: item.volume,
      turnover: item.volume * item.lastPrice,
      volume_24h: item.volume,
      turnover_24h: item.volume * item.lastPrice
    }
    await process_save_hashkey_coin(brokerage, source, info)
  }

  // 关闭连接
  //await connection.end();
}

async function process_save_hashkey_coin(brokerage, source, info){
     info.exchange = brokerage
    // console.log(info)
    const [rows] = await connection.execute(
        'SELECT id FROM dt_crawl_brokerage_coin_list WHERE exchange=? and source=? and stockCode = ?',
        [brokerage, source, info.stockCode]
    )
    if (rows.length > 0) {
        const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
        const values = Object.values(info)
        await connection.execute(
        `UPDATE dt_crawl_brokerage_coin_list SET ${fields} WHERE id = ?`,
        [...values, rows[0].id]
        )
        console.log(`记录已更新 ${brokerage}:  ${info.name}`)
    } else {
        const fields = Object.keys(info).join(', ')
        const placeholders = Object.keys(info).map(() => '?').join(', ')
        const values = Object.values(info)
        
        await connection.execute(
        `INSERT INTO dt_crawl_brokerage_coin_list (${fields}) VALUES (${placeholders})`,
        values
        );
        console.log(`记录已插入 ${brokerage}: ${info.name}`)
    }
}

async function main() {
  await futnn_coins()
  await hashkey_coins()
  await osl_coins()
}

async function run() {
    await connectMysql();
    // 每10秒执行一次 main() 函数
    //await main().catch(err => console.error('执行任务出错：', err));return;
    setInterval(async () => {
        await main().catch(err => console.error('执行任务出错：', err));
    }, 60000);
}

run();


