const path = require('path')
const cheerio = require('cheerio')

exports.latestNews = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\);?<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        const data = JSON.parse(matchObj[1])
        //$g.log.append('data', JSON.stringify(data))
        const posts = data.data[0].posts
        for(const record of posts){
            news.push({
                site: 'cointelegraph',
                new_id: record.id,
                new_type: record.badgeName,
                new_url: record.absoluteUrl,
                title: record.title,
                description: record.previewText,
                publish_time: Math.floor(Date.parse(record.published) / 1000),
                read_count: record.views,
                author_id: record.authorUrl,
                author_name: record.authorName,
                img: record.cover
            })
        }
    }
    resultData.pasqNewsList = news
}

exports.coinTelegraphNewDetail = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\);?<\/script>/
    const matchObj = htmlStr.match(pattern)
    if(matchObj && matchObj[1]){
        //$g.log.append('debug 1', matchObj[1])
        const data = JSON.parse(matchObj[1])
        //$g.log.append('data', JSON.stringify(data))
        const article = data.data[0].currentArticle
        resultData.paNewDetail = {
            id: article.id,
            new_type: 1,
            content: article.fullText,
            tags: article.tags
        }
    }
}
