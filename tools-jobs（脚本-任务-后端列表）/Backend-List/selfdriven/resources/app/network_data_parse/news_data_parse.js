const https = require('https')
const axios = require('axios')

exports.newsTaiwanTimes = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr);
    let new_list = [];
    if (node.listOfBlog) {
        for (const listOfBlog of node.listOfBlog) {
            $g.log.append(listOfBlog.id)
            let newList = {
                'url': 'https://www.taiwantimes.com.tw/app-container/app-content/new/new-content-detail?blogId=' + listOfBlog.id,
                'title': listOfBlog.title,
                'site_id': 1006028,
                'template_name': ''
            }
            new_list.push(newList)
        }
    }
    if (new_list.length > 0) {
        resultData['urlList'] = {
            'desc': {},
            "data": {}
        }
        resultData['urlList'].data = new_list
    }
}

exports.sheinDocument = function (htmlStr, requestData) {
    const pattern = /({"results":{"currentCat":.*?)\n/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    if (!resultData.sheinProductOther) {
        resultData.sheinProductOther = []
    }
    //$g.log.append('debug', matchObj)
    const data = $g.$json_from_string(matchObj[1])
    //$g.log.append('debug', JSON.stringify(data))
    const goods = data.results.goods
    //$g.log.append('debug', JSON.stringify(goods))
    $g.log.append('debug', 'goods count: ' + goods.length)
    for (const item of goods) {
        const info = {
            productRelationID: item.productRelationID,
            goods_name: item.goods_name,
            goods_url_name: item.goods_url_name,
            cat_id: item.cat_id,
            parent_id: item.parent_id,
            goods_desc: item.goods_desc,
            goods_img: item.goods_img,
            detail_image: JSON.stringify(item.detail_image),
            goodsDetailUrl: item.pretreatInfo.goodsDetailUrl
        }
        resultData.sheinProductOther.push(info)
    }
}

exports.sheinProductList = function (htmlStr, requestData) {
    if (!resultData.sheinProducts) {
        resultData.sheinProducts = []
    }
    const data = $g.$json_from_string(htmlStr)
    for (const key in data) {
        const item = data[key]
        if (item.productRelationID) {
            const info = {
                goods_id: item.goods_id,
                productRelationID: item.productRelationID,
                goods_sn: item.goods_sn,
                brand: item.brand,
                is_on_sale: item.is_on_sale,
                stock: item.stock,
                wishStatus: item.wishStatus,
                retailPrice_amount: item.retailPrice.amount,
                retailPrice_amountWithSymbol: item.retailPrice.amountWithSymbol,
                retailPrice_usdAmount: item.retailPrice.usdAmount,
                retailPrice_usdAmountWithSymbol: item.retailPrice.usdAmountWithSymbol,
                salePrice_amount: item.salePrice.amount,
                salePrice_amountWithSymbol: item.salePrice.amountWithSymbol,
                salePrice_usdAmount: item.salePrice.usdAmount,
                salePrice_usdAmountWithSymbol: item.salePrice.usdAmountWithSymbol,
                unit_discount: item.unit_discount,
                original_discount: item.original_discount
            }
            resultData.sheinProducts.push(info)
        }
    }
}
exports.googleTrends = function (htmlStr, requestData) {
    //金华涛
    if (!resultData.googleTrends) {
        resultData.googleTrends = []
    }
    const pattern = /{"default":({"timelineData":.*?})}/
    const matchObj = htmlStr.match(htmlStr)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    let edges = data.timelineData
    for (const key in edges) {
        const item = edges[key]
        const info = {
            formattedTime: item.formattedTime,
            value: item.value[0]
        }
        resultData.googleTrends.push(info)
    }
}

exports.mastodonNewDetail = function (htmlStr, requestData) {
    if (!resultData.mastodonNewDetail) {
        resultData.mastodonNewDetail = []
    }
    const data = $g.$json_from_string(htmlStr)
    for (const key in data) {
        const item = data[key]
        if (!item.content) {
            continue;
        }
        let tag = [];
        if (item.tags) {
            for (const keys in item.tags) {
                let name = item.tags[keys].name;
                name = "#" + name;
                tag.push(name)
            }
            if (tag.length > 0) {
                let display_name = '';
                let site_name = '';
                if (item.account) {
                    display_name = item.account.display_name;
                    site_name = item.account.acct;
                    site_name = '@' + site_name;
                }
                const info = {
                    content: item.content,
                    url: item.url,
                    user_name: display_name,
                    post_time: item.created_at,
                    site_name: site_name,
                    tag: tag,
                }
                resultData.mastodonNewDetail.push(info)
            }
        } else {
            continue;
        }

    }
}
exports.abcVideo = function (htmlStr, requestData) {
    const pattern = /({"bands":\[{"displayName":.*?},"masthead":{}})/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[0]) {
        return
    }
    if (!resultData.urlList) {
        resultData.urlList = {
            'desc': {},
            "data": []
        }
    }
    const bands = $g.$json_from_string(matchObj[0])

    if (bands.bands) {
        const newsStr = bands.bands
        for (const key in newsStr) {
            const iemt = newsStr[key]
            // $g.log.append('debug', iemt.displayName)
            if (iemt.blocks) {
                const blocks = iemt.blocks
                for (const bl in blocks) {
                    if (blocks[bl].type != 'liveCarousel') {
                        if (blocks[bl].items.latestVideos) {
                            const latestVideos = blocks[bl].items.latestVideos
                            for (const ne in latestVideos) {
                                const latest = latestVideos[ne]
                                // $g.log.append('debug', latest.id)
                                let url = latest.location
                                if (!latest.location.startsWith('http')) {
                                    url = 'https://abcnews.go.com'+latest.location
                                }
                                const info = {
                                    title: latest.title,
                                    url: url
                                }
                                resultData.urlList.data.push(info)
                            }
                        }
                    }
                }
            }
        }
    }

}

exports.reutersList = function (htmlStr, requestData) {
    const pattern = /"props":({.*?]}}})/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[0]) {
        return
    }

    const bands = $g.$json_from_string(matchObj[1])
    if (bands) {
        const newsStr = bands.initialState
        if (newsStr.video) {
            const video = newsStr.video
            for (const key in video) {
                if (key == 'playlist') {
                    const playlist = video['playlist']
                    const user = playlistFn(playlist);
                } else {
                    // const playlistarr = video[key]
                    // for (const arr in playlistarr) {
                    //     playlistFn(playlistarr[arr].playlist);
                    // }
                }
            }
        }

    }
    return true;
}
const playlistFn = function (playlist) {
    if (!resultData.urlList) {
        resultData.urlList = {
            'desc': {},
            "data": []
        }
    }
    for (const key in playlist) {
        const list = playlist[key]
        const list_detail = list.share
        const info = {
            title: list_detail.title,
            url: list.canonical_url
        }
        resultData.urlList.data.push(info)
    }
    return true;
}

exports.abcVideoDetail = async function (htmlStr, requestData) {
    // const pattern = /("{\"data\":.*?}")/
    const pattern = /INITIAL_DATA__=(.*?);<\/script/

    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[0]) {
        return
    }
    if (!resultData.newsDetail) {
        resultData.newsDetail = {
            'desc': {},
            "data": []
        }
    }
    //$g.log.append('debug',JSON.parse(matchObj[1]))
    const bands = JSON.parse(JSON.parse(matchObj[1]))
    let video_url = ''
    if (bands.stores.article) {
        if (bands.stores.article.articleBodyContent) {
            const newsStr = bands.stores.article.articleBodyContent
            var title = bands.stores.article.metadata.seoHeadline
            var post_time = bands.stores.article.metadata.analytics.page.additionalProperties.custom_var_2
            if (newsStr) {
                var content = ''
                var url_img_arr = []
                var video_url_arr = []
                for (const key in newsStr) {
                    const list = newsStr[key]
                    if (list.type == 'text') {
                        content += list.model.blocks[0].model.text + "\n\n"
                    }
                    if (list.type == 'image') {
                        const locator = list.model.blocks[1].model.locator
                        if (list.model.blocks[1].model.height > 2) {
                            const url = "https://ichef.bbci.co.uk/news/976/cpsprodpb/" + locator
                            url_img_arr.push(url)
                        }
                    }
                    if (list.type == 'video') {
                        const subheadline = newsStr[key - 1]
                        const subheadline_text = subheadline.model.blocks[0].model.blocks[0].model.text
                        if (subheadline_text == 'You may also be interested in:') {
                            continue;
                        }
                        const versionId = list.model.blocks[0].model.blocks[0].model.versions[0].versionId
                        let url = "https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/" + versionId + "/format/json/jsfunc/JS_callbacks0"
                        let videourl = await bbcURL(url)
                        $g.log.append('videourl', videourl)
                        if (videourl) {
                            url = videourl
                        }
                        video_url_arr.push(url)
                    }
                }
                var url_img = url_img_arr.join()
                video_url = video_url_arr.join()
            }
        }
    } else {
        for (var key in bands.data) {
            if (key.indexOf('media-experience?') > -1) {
                const list = bands.data[key]
                var title = list.data.initialItem.mediaItem.title.content
                var post_time = list.data.initialItem.mediaItem.metadata.items[0].timestamp
                if (!post_time) {
                    var post_time = list.data.initialItem.mediaItem.metadata.items[1].timestamp
                }
                var content = ''
                var url_img = ''
                const summary = list.data.initialItem.mediaItem.summary.blocks
                for (var key1 in summary) {
                    const text = summary[key1].model.text
                    content += text
                }
                const versionId = list.data.initialItem.mediaItem.media.items[0].id
                video_url = "https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/pc/vpid/" + versionId + "/format/json/jsfunc/JS_callbacks0"
                let videourl = await bbcURL(video_url)
                if (videourl) {
                    video_url = videourl
                }
            }
        }
    }
    const info = {
        content: content,
        img: url_img,
        video: video_url,
        title: title,
        post_time: post_time,

    }
    resultData.newsDetail.data.push(info)
    return true;
}
exports.googleStoreApps = function (htmlStr, requestData) {
    var pattern5 = htmlStr.match(/AF_initDataCallback\(({key: 'ds:5',.*?})\);<\/script>/);
    jsonResulte = JSON.parse(pattern5[0].split("data:")[1].split(", sideChannel:")[0]);
    if (!jsonResulte && !jsonResulte[1][2][0]) {
        var pattern4 = htmlStr.match(/AF_initDataCallback\(({key: 'ds:4',.*?})\);<\/script>/);
        jsonResulte = JSON.parse(pattern4[0].split("data:")[1].split(", sideChannel:")[0]);
        if (!jsonResulte && !jsonResulte[1][2][0]) {
            var pattern3 = htmlStr.match(/AF_initDataCallback\(({key: 'ds:3',.*?})\);<\/script>/);
            pattern3 = JSON.parse(pattern3[0].split("data:")[1].split(", sideChannel:")[0]);
            if (!jsonResulte && !jsonResulte[1][2][0]) {
                var pattern6 = htmlStr.match(/AF_initDataCallback\(({key: 'ds:6',.*?})\);<\/script>/);
                jsonResulte = JSON.parse(pattern6[0].split("data:")[1].split(", sideChannel:")[0]);
            }
        }
    }
    if (!resultData.newsDetail) {
        resultData.newsDetail = {
            'desc': {},
            "data": []
        }
    }
    $g.log.append('debug', jsonResulte[1][2][68][1][4][2])
    content = jsonResulte[1][2][72][0][1].replace('\'', '’').replace('\n', '').replace('  ', '')
    download_count_str = jsonResulte[1][2][13][1]

    download_count = download_count_str ? download_count_str : 0
    review_count = jsonResulte[1][2][51][2][1] ? jsonResulte[1][2][51][2][1] : 0
    $g.log.append('debug', download_count_str)
    try {
        var version = jsonResulte[1][2][140][0][0][0]
    } catch (err) {
        var version = "因设备而异"
    }

    try {
        var app_id = jsonResulte[1][2][77][0]
    } catch (err) {
        var app_id = ""
    }

    try {
        var official_website = jsonResulte[1][2][69][0][5][2]
    } catch (err) {
        var official_website = "无"
    }

    try {
        var version_time = jsonResulte[1][2][145][0][0]
    } catch (err) {
        var version_time = "无"
    }
    try {
        var tool_release_time_str = jsonResulte[1][2][10][0]
    } catch (err) {
        var tool_release_time_str = "无"
    }
    const info = {
        title: jsonResulte[1][2][0][0],
        content: jsonResulte[1][2][72][0][1],
        developer: jsonResulte[1][2][68][0],
        developerUrl: 'https://play.google.com' + jsonResulte[1][2][68][1][4][2],
        content: content,
        pic_url: jsonResulte[1][2][95][0][3][2],
        download_count: download_count,
        review_count: review_count,
        source: "play.google.com",
        version: version,
        official_website: official_website,
        app_id: app_id,
        version_time: version_time,
        tool_release_time: tool_release_time_str
    }
    $g.log.append('debug', JSON.stringify(info))

    resultData.newsDetail.data.push(info)
    return true;
}

async function bbcURL(URL) {
    $g.log.append('bbc video url', URL)
    try {
        const agent = new https.Agent({ rejectUnauthorized: false })
        const response = await axios.get(URL, { httpsAgent: agent })
        const contentStr = response.data.replace('/**/ JS_callbacks0(', '').replace(');', '')
        const data = $g.$json_from_string(contentStr)
        for (const node of data.media) {
            if (node.kind == 'video') {
                const href_m3u8 = node.connection[3].href
                $g.log.append('bbcURL', `video href ${href_m3u8}`)
                const muagent = new https.Agent({ rejectUnauthorized: false })   //二次请求
                const muresponse = await axios.get(href_m3u8, { httpsAgent: muagent })
                var text = muresponse.data.match(/[\S]*\.m3u8/)    //获取新的m3u8
                $g.log.append('获取新的m3u8', `m3u8 ${muresponse}`)
                var m3u8_1 = href_m3u8.substr(0, href_m3u8.lastIndexOf(".ism") + 5)
                var href = m3u8_1 + text[0]   //拼接最终的m3u8链接
                $g.log.append('拼接最终的m3u8链接', `m3u8 ${text[0]}`)
                return href
            }
        }
    } catch (err) {
        $g.log.append('bbcURL', `Exception: ${err.toString()}`);
    }
}
