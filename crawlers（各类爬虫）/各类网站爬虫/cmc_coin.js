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

async function process_coin_list(){
  const allInfos = []; // 收集所有记录的 info 对象

  for(let page=0; page<95; page++){
    const start = page*100 + 1;
    const url = `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=${start}&limit=100&sortBy=market_cap&sortType=desc&convert=USD,BTC,ETH&cryptoType=all&tagType=all&audited=false&aux=ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,max_supply,circulating_supply,total_supply,volume_7d,volume_30d,self_reported_circulating_supply,self_reported_market_cap`
    const response = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        'Host': 'api.coinmarketcap.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
      }
    })
    const result = response.data.data
    for(const record of result.cryptoCurrencyList){
      let quoteUSD = {}
      for(const quote of record.quotes){
        if(quote.name == 'USD'){
          quoteUSD = quote
        }
      }
      const info = {
        id: record.id,
        name: record.name,
        symbol: record.symbol,
        slug: record.slug,
        cmcRank: record.cmcRank,
        marketPairCount: record.marketPairCount,
        circulatingSupply: record.circulatingSupply,
        totalSupply: record.totalSupply,
        maxSupply: record.maxSupply || null,
        highAllTime: record.ath,
        lowAllTime: record.atl,
        high24h: record.high24h,
        low24h: record.low24h,
        price: quoteUSD.price,
        volume24h: quoteUSD.volume24h,
        volume7d: quoteUSD.volume7d,        
        volume30d: quoteUSD.volume30d,
        marketCap: quoteUSD.marketCap,
        percentChange1h: quoteUSD.percentChange1h,
        percentChange24h: quoteUSD.percentChange24h,
        percentChange7d: quoteUSD.percentChange7d,
        percentChange30d: quoteUSD.percentChange30d,
        percentChange60d: quoteUSD.percentChange60d,
        percentChange90d: quoteUSD.percentChange90d,
        percentChange1y: quoteUSD.percentChange1y,
        dominance: quoteUSD.dominance,
        turnover: quoteUSD.turnover,
        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${record.id}.png`
      }
      allInfos.push(info)
      /*
      // console.log(info);
      const [rows] = await connection.execute(
              'SELECT id FROM dt_crawl_cmc_coin_list WHERE id = ?',
              [record.id]
          )
      
      if (rows.length > 0) {
          const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
          const values = Object.values(info)
          await connection.execute(
          `UPDATE dt_crawl_cmc_coin_list SET ${fields} WHERE id = ?`,
          [...values, rows[0].id]
          )
          console.log(`记录 代币-列表项 已更新: ${info.name}`)
      } else {
          const fields = Object.keys(info).join(', ')
          const placeholders = Object.keys(info).map(() => '?').join(', ')
          const values = Object.values(info)
          
          await connection.execute(
          `INSERT INTO dt_crawl_cmc_coin_list (${fields}) VALUES (${placeholders})`,
          values
          );
          console.log(`记录 代币-列表项 已插入: ${info.name}`)
      }
      */
    }
  }

  if (allInfos.length > 0) {
    // 构建字段列表
    const fields = Object.keys(allInfos[0]);
    const updateFields = fields.map(key => `${key} = VALUES(${key})`).join(', ');

    // 构建 values 数组：每个 info 的值数组
    const values = allInfos.map(info => fields.map(key => info[key]));

    // 构建 SQL 语句
    const sql = `
      INSERT INTO dt_crawl_cmc_coin_list (${fields.join(', ')})
      VALUES ?
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;

    // 执行批量 upsert
    await connection.query(sql, [values]);
    console.log(`批量处理完成: 共 ${allInfos.length} 条记录（插入/更新）`);
  }  

}

async function process_per_coin(){
  let allInfos = []; // 收集所有记录的 info 对象

  // const [rows, fields] = await connection.execute("select id,slug,update_time from dt_crawl_cmc_coin_list where id=1")
  const [rows, fields] = await connection.execute("select id,slug,update_time from dt_crawl_cmc_coin_list order by id")
  for(const row of rows){
    try {
      const slug = row.slug
      const url = `https://coinmarketcap.com/currencies/${slug}`
      const response = await axios.get(url, {
        httpsAgent: agent,
        headers: {
          'Host': 'coinmarketcap.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }
      })
      const html = response.data
      const matchObj = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/)
      if(matchObj[1]){
        let data = {}
        try{
          data = JSON.parse(matchObj[1])
        }catch(e){
          console.log(matchObj)
          continue
        }
        const record = data.props.pageProps.detailRes.detail.statistics
        const info = {
          id: row.id,
          price: record.price,
          circulatingSupply: record.circulatingSupply,
          totalSupply: record.totalSupply,
          maxSupply: record.maxSupply || null,
          high24h: record.high24h,
          low24h: record.low24h,
          low7d: record.low7d,
          high7d: record.high7d,
          low30d: record.low30d,
          high30d: record.high30d,
          low90d: record.low90d,
          high90d: record.high90d,
          low52w: record.low52w,
          high52w: record.high52w,
          lowAllTime: record.lowAllTime,
          highAllTime: record.highAllTime
        }
        allInfos.push(info)
        console.log(`记录 代币-详情 已更新: ${row.slug}  cursor: ${allInfos.length}`)  
      }
      /**
      const fields = Object.keys(update).map(key => `${key} = ?`).join(', ')
      const values = Object.values(update)
      await connection.execute(
        `UPDATE dt_crawl_cmc_coin_list SET ${fields} WHERE id = ?`,
        [...values, row.id]
      )
      console.log(`记录 代币-详情 已更新: ${row.slug}`)  
      **/
     if (allInfos.length > 100) {
        const fields = Object.keys(allInfos[0]);
        const updateFields = fields.slice(1).map(key => `${key} = VALUES(${key})`).join(', ');
        const values = allInfos.map(update => fields.map(key => update[key]));
        const sql = `
          INSERT INTO dt_crawl_cmc_coin_list (${fields.join(', ')})
          VALUES ?
          ON DUPLICATE KEY UPDATE ${updateFields}
        `;
        await connection.query(sql, [values]);
        console.log(`批量更新完成: 共 ${allInfos.length} 条记录`);
        allInfos = []
      }
    } catch (err) {
      console.error(`Error processing ${row.slug}: ${err}`);
    }
  }

  if (allInfos.length > 0) {
    const fields = Object.keys(allInfos[0]);
    const updateFields = fields.slice(1).map(key => `${key} = VALUES(${key})`).join(', ');
    const values = allInfos.map(update => fields.map(key => update[key]));
    const sql = `
      INSERT INTO dt_crawl_cmc_coin_list (${fields.join(', ')})
      VALUES ?
      ON DUPLICATE KEY UPDATE ${updateFields}
    `;
    await connection.query(sql, [values]);
    console.log(`批量更新完成: 共 ${allInfos.length} 条记录`);
  }

}

async function process_exchange_list(url, category, dexStatus){
  const response = await axios.get(url, {
    httpsAgent: agent,
    headers: {
      'Host': 'coinmarketcap.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    }
  })
  const html = response.data
  const matchObj = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/)
  if(matchObj[1]){
    let data = {}
    try{
      data = JSON.parse(matchObj[1])
    }catch(e){
      console.log(matchObj)
      return
    }
    const exchanges = data.props.pageProps.initialData.exchanges
     const allInfos = []
    for(const record of exchanges){
      const info = {
        id: record.id,
        name: record.name,
        slug: record.slug,
        dexStatus: dexStatus,
        platformId: record.platformId,
        score: record.score || null,
        filteredTotalVol24h: record.filteredTotalVol24h,
        totalVol24h: record.totalVol24h,
        totalVolAdjusted24h: record.totalVolAdjusted24h,
        totalVol7d: record.totalVol7d,
        totalVol30d: record.totalVol30d,
        spotVol24h: record.spotVol24h,
        derivativesVol24h: record.derivativesVol24h || null,
        derivativesOpenInterests: record.derivativesOpenInterests || null,
        derivativesMarketPairs: record.derivativesMarketPairs || null,
        totalVolChgPct24h: record.totalVolChgPct24h,
        totalVolChgPct7d: record.totalVolChgPct7d,
        totalVolChgPct30d: record.totalVolChgPct30d,
        visits: record.visits || null,
        liquidity: record.liquidity || null,
        numMarkets: record.numMarkets,
        numCoins: record.numCoins,
        type: record.type,
        logo: `https://s2.coinmarketcap.com/static/img/exchanges/64x64/${record.id}.png`
      }
      if(category == 'derivatives'){
        info.derivativesRank = record.rank
      }else{
        info.rank = record.rank
      }
      allInfos.push(info);
      /*
      const [rows] = await connection.execute(
              'SELECT id FROM dt_crawl_exchange_list WHERE id = ?',
              [record.id]
          )
      if (rows.length > 0) {
          const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
          const values = Object.values(info)
          await connection.execute(
          `UPDATE dt_crawl_exchange_list SET ${fields} WHERE id = ?`,
          [...values, rows[0].id]
          )
          console.log(`记录 exchange 已更新: ${info.name}`)
      } else {
          const fields = Object.keys(info).join(', ')
          const placeholders = Object.keys(info).map(() => '?').join(', ')
          const values = Object.values(info)
          
          await connection.execute(
          `INSERT INTO dt_crawl_exchange_list (${fields}) VALUES (${placeholders})`,
          values
          );
          console.log(`记录 exchange 已插入: ${info.name}`)
      }
      */
    }

    if (allInfos.length > 0) {
      // 构建字段列表（使用第一个 info 的 keys，所有记录字段一致）
      const fields = Object.keys(allInfos[0]);
      const updateFields = fields.map(key => `${key} = VALUES(${key})`).join(', ');

      // 构建 values 数组：每个 info 的值数组
      const values = allInfos.map(info => fields.map(key => info[key]));

      // 构建 SQL 语句
      const sql = `
        INSERT INTO dt_crawl_exchange_list (${fields.join(', ')})
        VALUES ?
        ON DUPLICATE KEY UPDATE ${updateFields}
      `;

      // 执行批量 upsert
      await connection.query(sql, [values]);
      console.log(`批量处理完成: 共 ${allInfos.length} 条记录（插入/更新）`);
    }    

  }
}

async function process_per_exchange_basicinfo(lang){
  //const [rows, fields] = await connection.execute("select id,slug from dt_crawl_exchange_list where slug='binance' order by rank");
  let baseUrl = 'https://coinmarketcap.com/exchanges/'
  let sql = "select id,slug from dt_crawl_exchange_list where descriptionEn is null order by rank"
  if(lang == 'zh'){
    baseUrl = 'https://coinmarketcap.com/zh/exchanges/'
    sql = "select id,slug from dt_crawl_exchange_list where descriptionZh is null order by rank"
  }
  const [rows, fields] = await connection.execute(sql);
  for(const row of rows){
    const slug = row.slug
    const url = `${baseUrl}${slug}`
    let response = {}
    try {
      response = await axios.get(url, {
        httpsAgent: agent,
        headers: {
          'Host': 'coinmarketcap.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }
      })
    }catch (err) {
      console.log('请求失败： ', url)
      continue
    }
    
    const html = response.data
    const matchObj = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/)
    if(matchObj[1]){
      let data = {}
      try{
        data = JSON.parse(matchObj[1])
      }catch(e){
        console.log(matchObj)
        return
      }
      data = data.props.pageProps.info
      const info = {
        websiteUrl: data.urls.website[0] || null,
        feeUrl: data.urls.fee[0] || null,
        chatUrl: data.urls.chat[0] || null,
        twitterUrl: data.urls.twitter[0] || null
      }
      if(lang == 'zh'){
        info.descriptionZh = data.description || null
      }else{
        info.descriptionEn = data.description || null
      }
      //console.log(info)
      const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
      const values = Object.values(info)
      await connection.execute(
        `UPDATE dt_crawl_exchange_list SET ${fields} WHERE slug = ?`,
        [...values, slug]
      )
      console.log(`记录 basic_info 已更新: ${slug}`)
    }
  }
}

async function process_per_exchange(){
  const categoryArr = ['spot', 'perpetual']
  // const [rows, fields] = await connection.execute("select id,slug,dexStatus,type,spotVol24h,derivativesVol24h from dt_crawl_exchange_list where id=6706 order by rank");
  const [rows, fields] = await connection.execute("select id,slug,dexStatus,type,spotVol24h,derivativesVol24h from dt_crawl_exchange_list order by rank");

  for(const row of rows){
    const allInfos = []
    for(const category of categoryArr){
      if(category=='spot' && row.spotVol24h == null){
        continue
      }
      if(category=='perpetual' && row.derivativesVol24h == null){
        continue
      }
      if(category=='spot' && row.dexStatus==1 && !['orderbook', 'Orderbook'].includes(row.type)){
        continue
      }
      const slug = row.slug
      // https://api.coinmarketcap.com/dexer/v3/platformpage/pair-pages?platform-id=14&dexer-id=6706&sort-field=txns24h&category=spot&page=2
      const url = `https://api.coinmarketcap.com/data-api/v3/exchange/market-pairs/latest?slug=${slug}&category=${category}&start=1&limit=100`
      const response = await axios.get(url, {
        httpsAgent: agent,
        headers: {
          'Host': 'api.coinmarketcap.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }
      })
      const result = response.data.data
      const marketPairs = result.marketPairs
      for(const record of marketPairs){
        //console.log(record)
        const info = {
          marketId: record.marketId,
          marketPair: record.marketPair,
          rank: record.rank,
          exchangeId: record.exchangeId,
          exchangeName: record.exchangeName,
          exchangeSlug: record.exchangeSlug,
          category: record.category,
          marketUrl: record.marketUrl,
          baseSymbol: record.baseSymbol,
          baseCurrencyId: record.baseCurrencyId,
          baseCurrencyName: record.baseCurrencyName,
          baseCurrencySlug: record.baseCurrencySlug,
          quoteSymbol: record.quoteSymbol,
          quoteCurrencyId: record.quoteCurrencyId,
          price: record.price,
          volumeUsd: record.volumeUsd,
          effectiveLiquidity: record.effectiveLiquidity || null,
          volumeBase: record.volumeBase,
          volumeQuote: record.volumeQuote,
          depthUsdNegativeTwo: record.depthUsdNegativeTwo || null,
          depthUsdPositiveTwo: record.depthUsdPositiveTwo || null,
          volumePercent: record.volumePercent,
          openInterestUsd: record.openInterestUsd || null,
          indexPrice: record.indexPrice || null,
          indexBasis: record.indexBasis || null,
          fundingRate: record.fundingRate || null,
          type: record.type,
          logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${record.baseCurrencyId}.png`,
        }
        allInfos.push(info)
        // 保持日志，但由于批量，日志在收集时
        //console.log(`${slug} - ${category} 记录 交易对 已处理: ${info.marketPair}`)
        //console.log(info);
        /*
        const [rows] = await connection.execute(
            'SELECT id,marketId FROM dt_crawl_market_pairs_list WHERE marketId = ?',
            [record.marketId]
        )
        if (rows.length > 0) {
            const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
            const values = Object.values(info)
            await connection.execute(
              `UPDATE dt_crawl_market_pairs_list SET ${fields} WHERE marketId = ?`,
              [...values, rows[0].marketId]
            )
            console.log(`${slug} - ${category} 记录 交易对 已更新: ${info.marketPair}`)
        } else {
            const fields = Object.keys(info).join(', ')
            const placeholders = Object.keys(info).map(() => '?').join(', ')
            const values = Object.values(info)
            
            await connection.execute(
              `INSERT INTO dt_crawl_market_pairs_list (${fields}) VALUES (${placeholders})`,
              values
            );
            console.log(`${slug} - ${category} 记录 交易对 已插入: ${info.marketPair}`)
        }
        */
      }
    }

    if (allInfos.length > 0) {
      const fields = Object.keys(allInfos[0]);
      const updateFields = fields.map(key => `${key} = VALUES(${key})`).join(', ');
      const values = allInfos.map(info => fields.map(key => info[key]));
      const sql = `
        INSERT INTO dt_crawl_market_pairs_list (${fields.join(', ')})
        VALUES ?
        ON DUPLICATE KEY UPDATE ${updateFields}
      `;
      await connection.query(sql, [values]);
      console.log(`process_per_exchange 批量处理完成: 共 ${allInfos.length} 条记录（插入/更新）`);
    }

  }

}

async function process_per_exchange_dex_spot(){
  // const [rows, fields] = await connection.execute("select id,slug,dexStatus,type,spotVol24h,derivativesVol24h from dt_crawl_exchange_list where id=6706 order by rank");
  const [rows, fields] = await connection.execute("select id,slug,platformId from dt_crawl_exchange_list order by rank");
  for(const row of rows){
      const slug = row.slug
      const url = `https://api.coinmarketcap.com/dexer/v3/platformpage/pair-pages?platform-id=${row.platformId}&dexer-id=${row.id}&sort-field=txns24h&category=spot&page=1`
      const response = await axios.get(url, {
        httpsAgent: agent,
        headers: {
          'Host': 'api.coinmarketcap.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }
      })
      const result = response.data.data
      if(!result){
        console.log(url)
        continue
      }
      const marketPairs = result.pageList
      const allInfos = []
      for(const record of marketPairs){
        const info = {
          platformId: record.platformId,
          platformName: record.platformName,
          dexerPlatformName: record.dexerPlatformName,
          platformCryptoId: record.platformCryptoId,
          poolId: record.poolId,
          pairContractAddress: record.pairContractAddress,
          factoryAddress: record.factoryAddress,
          dexerId: record.dexerId,
          dexerName: record.dexerName,
          baseCurrencyId: record.baseCurrencyId || 0,
          baseTokenId: record.baseTokenId || 0,
          baseTokenName: record.baseTokenName,
          baseTokenAddress: record.baseTokenAddress,
          baseTokenSymbol: record.baseTokenSymbol,
          baseTelegramUrl: record.baseTelegramUrl || '',
          baseTwitterUrl: record.baseTwitterUrl || '',
          baseWebsiteUrl: record.baseWebsiteUrl || '',
          quoteCryptoId: record.quoteCryptoId || 0,
          quotoTokenId: record.quotoTokenId || 0,
          quotoTokenName: record.quotoTokenName,
          quotoTokenAddress: record.quotoTokenAddress,
          quotoTokenSymbol: record.quotoTokenSymbol,
          marketCap: record.marketCap || 0,
          fdv: record.fdv || 0,
          liquidity: record.liquidity || 0,
          marketUrl: record.marketUrl,
          reverseOrder: record.reverseOrder,
          rank: record.rank,
          poolCreatedDate: record.poolCreatedDate? Math.floor(record.poolCreatedDate / 1000) : 0,
          priceUsd: record.priceUsd,
          priceQuote: record.priceQuote,
          basePrice5m: record.basePrice5m,
          quotePrice5m: record.quotePrice5m,
          basePrice1h: record.basePrice1h,
          quotePrice1h: record.quotePrice1h,
          basePrice4h: record.basePrice4h,
          basePrice4h: record.basePrice4h,
          quotePrice4h: record.quotePrice4h,
          volumeUsd24h: record.volumeUsd24h,
          txns24h: record.txns24h,
          baseChange24h: record.baseChange24h,
          quoteChange24h: record.quoteChange24h,
          baseChange7d: record.baseChange7d,
          quoteChange7d: record.quoteChange7d,
          logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${record.baseCurrencyId}.png`,
        }
        //console.log(info);
        allInfos.push(info)
        /*
        const [rows] = await connection.execute(
            'SELECT id,poolId FROM dt_crawl_market_pairs_list_dex_spot WHERE poolId = ?',
            [record.poolId]
        )
        if (rows.length > 0) {
            const fields = Object.keys(info).map(key => `${key} = ?`).join(', ')
            const values = Object.values(info)
            await connection.execute(
              `UPDATE dt_crawl_market_pairs_list_dex_spot SET ${fields} WHERE poolId = ?`,
              [...values, rows[0].poolId]
            )
            console.log(`DEX SPOT ${row.slug} - 记录 交易对 已更新: ${info.poolId}`)
        } else {
            const fields = Object.keys(info).join(', ')
            const placeholders = Object.keys(info).map(() => '?').join(', ')
            const values = Object.values(info)
            
            await connection.execute(
              `INSERT INTO dt_crawl_market_pairs_list_dex_spot (${fields}) VALUES (${placeholders})`,
              values
            );
            console.log(`DEX SPOT - 记录  ${row.slug} 交易对 已插入: ${info.poolId}`)
        }
        **/
      }

      if (allInfos.length > 0) {
        const fields = Object.keys(allInfos[0]);
        const updateFields = fields.map(key => `${key} = VALUES(${key})`).join(', ');
        const values = allInfos.map(info => fields.map(key => info[key]));
        const sql = `
          INSERT INTO dt_crawl_market_pairs_list_dex_spot (${fields.join(', ')})
          VALUES ?
          ON DUPLICATE KEY UPDATE ${updateFields}
        `;
        await connection.query(sql, [values]);
        console.log(`function process_per_exchange_dex_spot ${row.slug} 批量处理完成: 共 ${allInfos.length} 条记录（插入/更新）`);
      }

  }
}

async function main() {
  let start, end;
  // 辅助函数：将毫秒转换为分钟和秒
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes} min ${seconds} sec`;
  };

  start = Date.now();  
  await process_coin_list()
  end = Date.now();
  console.log(`process_coin_list executed in ${formatDuration(end - start)}`);

  start = Date.now();
  await process_per_coin()
  end = Date.now();
  console.log(`process_per_coin executed in ${formatDuration(end - start)}`);

  start = Date.now();
  await process_exchange_list('https://coinmarketcap.com/rankings/exchanges/', 'spot', 0);
  end = Date.now();
  console.log(`exchange_list spot 0 executed in ${formatDuration(end - start)}`);

  start = Date.now();
  await process_exchange_list('https://coinmarketcap.com/rankings/exchanges/derivatives/', 'derivatives', 0);
  end = Date.now();
  console.log(`exchange_list derivatives 0 executed in ${formatDuration(end - start)}`);
  
  start = Date.now();
  await process_exchange_list('https://coinmarketcap.com/rankings/exchanges/dex/?type=spot', 'spot', 1);
  end = Date.now();
  console.log(`exchange_list spot 1 executed in ${formatDuration(end - start)}`);
  
  start = Date.now();
  await process_exchange_list('https://coinmarketcap.com/rankings/exchanges/dex/?type=derivatives', 'derivatives', 1);
  end = Date.now();
  console.log(`exchange_list derivatives 1 executed in ${formatDuration(end - start)}`);
  
  start = Date.now();
  await process_per_exchange();
  end = Date.now();
  console.log(`process_per_exchange executed in ${formatDuration(end - start)}`);

  start = Date.now();
  await process_per_exchange_dex_spot();
  end = Date.now();
  console.log(`process_per_exchange_dex_spot executed in ${formatDuration(end - start)}`);
  // 关闭连接
  //await connection.end();
}

async function run() {
    let isRunning = false;
    await connectMysql();

    //await process_per_exchange_basicinfo('en');
    //await process_per_exchange_basicinfo('zh');
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
    }, 10000);
}

run();


