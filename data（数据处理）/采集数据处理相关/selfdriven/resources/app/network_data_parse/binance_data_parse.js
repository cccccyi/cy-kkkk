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
        //$g.log.append('debug binanceAnnouncementDetail 1', matchObj[1])
        const data = $g.$json_from_string(matchObj[1])
        const articleDetail = data.appState.loader.dataByRouteId.d34e.articleDetail
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
                    content += childL2.text
                }
                for(const childL3 of childL2.child || []){
                    if(childL3.node == 'text'){
                        content += childL3.text
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
