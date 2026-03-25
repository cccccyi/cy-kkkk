const path = require('path')
const cheerio = require('cheerio')

exports.zhaoBiaoGongGao = function(htmlStr, requestData){
    const key = 'tender_data_list'
    if (!resultData[key]) {
        resultData[key] = []
    }
    //$g.log.append('debug', JSON.stringify(requestData))
    //$g.log.append('debug', htmlStr)
    const url = requestData.url
    const postData = requestData.postData
    resultData[key].push({
        site: 'okcis',
        url,
        postData,
        html: htmlStr
    })
}

