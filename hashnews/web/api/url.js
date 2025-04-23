const _BASE = 'https://hashnews.pro';
//out是新加坡服务器，api是82国内服务器
const _URL = {
    news_list                  :  `${_BASE}/api/media/news/list`,                   //快讯列表
    news                       :  `${_BASE}/api/media/news`,                        //指定快讯
    news_category_statistic    :  `${_BASE}/api/media/news/category/statistic`,     //快讯的分类
    sounds                     :  `${_BASE}/tts_output/`,                           //语音播报目录
    mediaCoinglassStatistic    :  `${_BASE}/api/media/coinglass/statistic`,         //巨鲸统计
    mediaCoinglassAction       :  `${_BASE}/api/media/coinglass/action`,            //巨鲸动态
    mediaCoinglassHyperliquid  :  `${_BASE}/api/media/coinglass/hyperliquid`,       //巨鲸持仓
    tweetList                  :  `${_BASE}/api/media/tweet/list`,                  //推文列表
    tweet                      :  `${_BASE}/api/media/tweet`,                       //指定推文
    feargreedindex             :  `${_BASE}/api/media/coinglass/feargreedindex`,    //贪婪指数
    getTweetProfileImageByName :  `${_BASE}/out/boost_interface/divination/getTweetProfileImageByName`,    //根据推特账号获取头像及用户名
    doDivination               :  `${_BASE}/out/boost_interface/divination/doDivination`,                  //获取推算结果
    coinankStatistic           :  `${_BASE}/api/media/coinglass/coinankStatistic`,   //新贪婪指数，来自coinank
    altcoinSeason              :  `${_BASE}/api/media/coinglass/altcoinSeason`,      //山寨指数
    longshortRatio             :  `${_BASE}/api/media/coinglass/longshortRatio`,     //多空比    interval:5m,1h,4h,1d
    turnover                   :  `${_BASE}/api/media/coinglass/turnover`,           //爆仓数据  interval:5m,1h,4h,1d
    articleList                :  `${_BASE}/api/media/article/list`,                 //推文列表
    article                    :  `${_BASE}/api/media/article`,                      //指定文章
};
export { _URL };