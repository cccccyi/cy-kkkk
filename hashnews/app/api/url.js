const _BASE = 'http://82.157.161.88:8088';
const _BASEOut = 'http://47.245.119.14';
//out是新加坡服务器，api是82国内服务器
const _URL = {
    news_list                  :  `${_BASE}/media/news/list`,                   //快讯列表
    news                       :  `${_BASE}/media/news`,                        //指定快讯
    news_category_statistic    :  `${_BASE}/media/news/category/statistic`,     //快讯的分类
    sounds                     :  `${_BASE}/tts_output/`,                           //语音播报目录
    mediaCoinglassStatistic    :  `${_BASE}/media/coinglass/statistic`,         //巨鲸统计
    mediaCoinglassAction       :  `${_BASE}/media/coinglass/action`,            //巨鲸动态
    mediaCoinglassHyperliquid  :  `${_BASE}/media/coinglass/hyperliquid`,       //巨鲸持仓
    tweetList                  :  `${_BASE}/media/tweet/list`,                  //推文列表
    tweet                      :  `${_BASE}/media/tweet`,                       //指定推文
    feargreedindex             :  `${_BASE}/media/coinglass/feargreedindex`,    //贪婪指数
    getTweetProfileImageByName :  `${_BASEOut}/boost_interface/divination/getTweetProfileImageByName`,    //根据推特账号获取头像及用户名
    doDivination               :  `${_BASEOut}/boost_interface/divination/doDivination`,                  //获取推算结果
    coinankStatistic           :  `${_BASE}/media/coinglass/coinankStatistic`,   //新贪婪指数，来自coinank
    altcoinSeason              :  `${_BASE}/media/coinglass/altcoinSeason`,      //山寨指数
    longshortRatio             :  `${_BASE}/media/coinglass/longshortRatio`,     //多空比    interval:5m,1h,4h,1d
    turnover                   :  `${_BASE}/media/coinglass/turnover`,           //爆仓数据  interval:5m,1h,4h,1d
    articleList                :  `${_BASE}/media/article/list`,                 //推文列表
    articleListNew             :  `https://hashnews.pro/sdapi/api/tweets`,       //推文列表
    //articleListNew             :  `http://154.219.101.126:3008/api/tweets`,       //推文列表
    article                    :  `${_BASE}/media/article`,                      //指定文章
    fundingRate                :  `${_BASE}/media/coinglass/fundingRate`,        //资金费对比
    deviceInfo                 :  `${_BASE}/app/deviceInfo`,                     //绑定推送ID
    version                    :  `${_BASE}/app/version`,                        //获取最新版本号
    broker                     :  `${_BASE}/cmc/broker`,                         //获取券商列表
    futunn_coins               :  `${_BASE}/cmc/futunn_coins`,                   //富途代币列表
    coin_list                  :  `${_BASE}/cmc/coin_list`,                      //币种列表
    exchange_list              :  `${_BASE}/cmc/exchange_list`,                  //交易所列表
    pair_list                  :  `${_BASE}/cmc/pair_list`,                      //交易对列表
    dex_spot_pair_list         :  `${_BASE}/cmc/dex_spot_pair_list`,             //DEX现货单独接口
};