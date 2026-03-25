const path = require('path')
const cheerio = require('cheerio')

exports.profundityNews = function(htmlStr, requestData){
    $g.log.append('debug', 'start profundityNews')
    //const pattern = /<script>window\.__NUXT__=\(function\((.*?)\){return ({.*?})}\((.*?)\)\)<\/script>/
    const pattern = /<script>window\.__NUXT__=\((.*?)\)<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        //$g.log.append('debug 1', matchObj[1])
        const data = eval("(" + matchObj[1] + ")")
        //$g.log.append('data', JSON.stringify(data))
        const articleList = data.data[0].articleList
        //$g.log.append('articleList', JSON.stringify(articleList))
        for(const record of articleList){
            news.push({
                site: 'panews',
                new_id: record.id,
                new_type: record.type,
                new_url: `https://www.panewslab.com/zh/articledetails/${record.id}.html`,
                title: record.title,
                description: record.desc,
                publish_time: record.publishTime,
                tags: JSON.stringify(record.tags),
                read_count: record.readnum,
                collection_count: record.collection,
                love_count: record.lovenum,
                author_id: record.author.id,
                author_name: record.author.name,
                author_img: record.author.img,
                img: record.img
            })
        }
    }
    resultData.paNewsList = news
}

exports.detailsNew = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\)<\/script>/
    const matchObj = htmlStr.match(pattern)
    if(matchObj && matchObj[1]){
        //$g.log.append('debug 1', matchObj[1])
        const data = eval("(" + matchObj[1] + ")")
        //$g.log.append('data', JSON.stringify(data))
        const pageData = data.data[0].pageData
        resultData.paNewDetail = {
            id: pageData.id,
            new_type: pageData.type,
            content: pageData.content
        }
    }
}

exports.newsList = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\)<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        //$g.log.append('debug 1', matchObj[1])
        const data = eval("(" + matchObj[1] + ")")
        //$g.log.append('data', JSON.stringify(data))
        const sqTopicsList = data.data[0].sqTopicsList
        for(const list of sqTopicsList){
            for(const record of list.list){
                news.push({
                    site: 'panews',
                    new_id: record.id,
                    new_type: record.type,
                    new_url: `https://www.panewslab.com/zh/sqarticledetails/${record.id}.html`,
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
                    img: record.img
                })
            }
        }
    }
    resultData.pasqNewsList = news
}
