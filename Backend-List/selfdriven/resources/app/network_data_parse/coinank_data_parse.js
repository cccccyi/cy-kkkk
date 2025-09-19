const path = require('path')

exports.longShortRatio = function(htmlStr, requestData){
    if (!resultData.coinrank_longshort_ratio) {
        resultData.coinrank_longshort_ratio = []
    }
    const data = JSON.parse(htmlStr).data
    const exchangeName = data.exchangeName
    const interval = data.interval
    const baseCoin = data.baseCoin
    const longShortRatio = data.longShortRatio[2]
    const lastLongShortRatio = data.longShortRatio[1]
    const info = {
        exchangeName,
        baseCoin,
        interval,
        longShortRatio,
        lastLongShortRatio
    }
    resultData.coinrank_longshort_ratio.push(info)
}

exports.statisticsAll = function(htmlStr, requestData){
    const data = JSON.parse(htmlStr).data
    resultData.coinrank_statistic_all = data
}

exports.liquidationStatisticV2 = function(htmlStr, requestData){
    if (!resultData.coinrank_turnover_data) {
        resultData.coinrank_turnover_data = []
    }
    const data = JSON.parse(htmlStr)
    resultData.coinrank_turnover_data.push(data)
}

exports.getAltcoinSeasonMini = function(htmlStr, requestData){
    const data = JSON.parse(htmlStr).data
    resultData.coinrank_altcoin_season = data
}
