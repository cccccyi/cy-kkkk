const path = require('path')

exports.binanceAnnouncementList = function(htmlStr, requestData){
    //$g.log.append('debug binanceAnnouncementList', htmlStr)
    let news = []
    const checkCategories = ['数字货币及交易对上新', '币安最新动态', '下架讯息']
    const data = $g.$json_from_string(htmlStr)
    if(!data.data){
        return
    }
    const catalogs = data.data.catalogs
    for(const log of catalogs){
        const articles = log.articles
        const catalogName = log.catalogName
        if(checkCategories.indexOf(catalogName) == -1){
            continue;
        }
        for(const record of articles){
            news.push({
                site: 'binance',
                new_id: record.id,
                new_type: 'announce',
                new_url: 'https://www.binance.com/zh-CN/support/announcement/' + record.code,
                title: record.title,
                publish_time: Math.floor(record.releaseDate/1000),
                primary_category: catalogName
            })
        }
    }
    resultData.binanceAnnouncementList = news
}

exports.binanceAnnouncementDetail = function(htmlStr, requestData){
    const pattern = />({"dynamicIds".*?})<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        // $g.log.append('debug binanceAnnouncementDetail 1', matchObj[1])
        const data = $g.$json_from_string(matchObj[1])
        let articleDetail = null
        for (const key in data.appState.loader.dataByRouteId){
            if(data.appState.loader.dataByRouteId[key].articleDetail){
                articleDetail = data.appState.loader.dataByRouteId[key].articleDetail
            }
        }
        if(!articleDetail){
            return
        }
        //$g.log.append('debug binanceAnnouncementDetail articleDetail', JSON.stringify(articleDetail))
        const body = articleDetail.body
        //$g.log.append('debug binanceAnnouncementDetail body', body)
        const bodyObj = $g.$json_from_string(body)
        let content = ''
        for(const childL1 of bodyObj.child){
            for(const childL2 of childL1.child || []){
                if(childL2.node == 'text'){
                    content += childL2.text + "\n"
                }
                for(const childL3 of childL2.child || []){
                    if(childL3.node == 'text'){
                        content += childL3.text + "\n"
                    }
                    for(const childL4 of childL3.child || []){
                        if(childL4.node == 'text'){
                            content += childL4.text
                        }
                        for(const childL5 of childL4.child || []){
                            if(childL5.node == 'text'){
                                content += childL5.text
                            }
                        }
                    }
                }
            }
        }
        resultData.binanceAnnouncementDetail = {
            id: articleDetail.id,
            content: content
        }
    }
}

// 恐惧贪婪指数
exports.bianceFearAndGreedIndex = function(htmlStr, requestData){
    const pattern = /<script id="__APP_DATA" .*?>(.*?)<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        // $g.log.append('debug', matchObj[1])
        const data = JSON.parse(matchObj[1])
        if(data.appState?.loader?.dataByRouteId['53ee']?.fearGreed){
            const info = data.appState.loader.dataByRouteId['53ee'].fearGreed
            $g.log.append('debug', JSON.stringify(info))
            resultData.binanceFearAndGreedIndex = {
                currentValue: info.currentValue,
                yesterdayValue: info.yesterdayValue,
                lastWeekValue: info.lastWeekValue,
                bearishValue: info.bearishValue,
                bullishValue: info.bullishValue 
            }
        }
    }
}