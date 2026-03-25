const path = require('path')

exports.theBlockNewsList = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\);<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        //$g.log.append('debug theBlockNewsList 1', matchObj[1])
        const data = eval("(" + matchObj[1] + ")")
        //$g.log.append('debug theBlockNewsList data', JSON.stringify(data))
        const posts = data.state.pagesPlus.posts
        //$g.log.append('debug theBlockNewsList posts', JSON.stringify(posts))
        for(const record of posts){
            if(!record.body){
                continue
            }
            let categories = []
            //$g.log.append('debug theBlockNewsList record', JSON.stringify(record))
            for(const item of record.categories){
                categories.push(item.name)
            }
            let tags = []
            for(const item of record.tags){
                tags.push(item.name)
            }
            let tokens = []
            for(const item of record.relatedTokens){
                tokens.push(item.name)
            }
            news.push({
                site: 'theblock',
                new_id: record.id,
                new_type: record.type,
                new_url: record.url,
                title: record.title,
                description: record.excerpt,
                content: record.body,
                publish_time: record.publishedFormatted,
                primary_category: record.primaryCategory.name,
                categories: categories,
                tags: tags,
                related_tokens: tokens,
                author_id: record.authors[0].id,
                author_name: record.authors[0].name,
                author_img: record.authors[0].thumbnail,
                author_url: record.authors[0].url,
                img: record.thumbnail
            })
        }
    }
    resultData.theBlockNewsList = news
}

exports.theBlockResearchList = function(htmlStr, requestData){
    const pattern = /<script>window\.__NUXT__=\((.*?)\);<\/script>/
    const matchObj = htmlStr.match(pattern)
    let news = []
    if(matchObj && matchObj[1]){
        //$g.log.append('debug theBlockNewsList 1', matchObj[1])
        const data = eval("(" + matchObj[1] + ")")
        //$g.log.append('debug theBlockNewsList data', JSON.stringify(data))
        const posts = data.state.pagesPlus.posts
        //$g.log.append('debug theBlockNewsList posts', JSON.stringify(posts))
        for(const record of posts){
            if(!record.body){
                continue
            }
            let categories = []
            for(const item of record.categories){
                categories.push(item.name)
            }
            let tags = []
            for(const item of record.tags){
                tags.push(item.name)
            }
            let tokens = []
            for(const item of record.relatedTokens){
                tokens.push(item.name)
            }
            news.push({
                site: 'theblock',
                new_id: record.id,
                new_type: 'research',
                new_url: record.url,
                title: record.title,
                description: record.excerpt,
                content: record.body,
                publish_time: record.publishedFormatted,
                primary_category: record.primaryCategory.name,
                categories: categories,
                tags: tags,
                related_tokens: tokens,
                author_id: record.authors[0].id,
                author_name: record.authors[0].name,
                author_img: record.authors[0].thumbnail,
                author_url: record.authors[0].url,
                img: record.thumbnail
            })
        }
    }
    resultData.theBlockResearchNewsList = news
}