const path = require('path')
const cheerio = require('cheerio')
const zlib = require("pako")
const ee = require("crypto-js");
const { request } = require('http');

global.btoa = (str) => Buffer.from(str, 'utf-8').toString('base64');
global.atob = (base64) => Buffer.from(base64, 'base64').toString('utf-8');

const getE = function(header_user){
    const e = "/api/openInterest/v3/chart"
    let n = btoa("coinglass".concat(e, "coinglass"))
    n = n.substring(0, 16)
    console.log('getE:', n)
    n = Yt(header_user, n);
    return n;
};

const Yt = function (t, e) {
    $t = ee;
    var n = function (t) {
        var e, n = zlib.inflate(new Uint8Array(t.match(/[\da-f]{2}/gi).map((function (t) {
            return parseInt(t, 16)
        }
        )))), r = "", i = 16384;
        for (e = 0; e < n.length / i; e++)
        r += String.fromCharCode.apply(null, n.slice(e * i, (e + 1) * i));
        return r += String.fromCharCode.apply(null, n.slice(e * i)),
        decodeURIComponent(escape(r))
    }
    (ee.AES.decrypt(t, $t.enc.Utf8.parse(e), {
        mode: $t.mode.ECB,
        padding: $t.pad.Pkcs7
    }).toString($t.enc.Hex));
    return '"' == n.charAt(0) && (n = n.substring(1, n.length)),
    '"' == n.charAt(n.length - 1) && (n = n.substring(0, n.length - 1)),
    n
};

function parseNumber(str) {
  str = str.replace('$', '').replace(',', '').trim();
  let sign = 1;
  if (str.startsWith('-')) {
    sign = -1;
    str = str.slice(1);
  }
  let unit = '';
  if (str.endsWith('万')) {
    unit = '万';
    str = str.slice(0, -1);
  } else if (str.endsWith('亿')) {
    unit = '亿';
    str = str.slice(0, -1);
  }
  let num = parseFloat(str);
  if (isNaN(num)) return '0';
  if (unit === '万') num *= 10000;
  else if (unit === '亿') num *= 100000000;
  return (sign * num).toString();
}

let flag = false
exports.topPosition = function(htmlStr, requestData){
    /*
    const url = requestData.url
    const data = JSON.parse(htmlStr)
    const encryptData = data.data
     let user = ''
    for(const item of requestData.params.responseHeaders){
        if(item.name == 'user'){
            user = item.value
            break
        }
    }
    $g.log.append('user', user)
    const e = getE(user)
    $g.log.append('e', e)
    const result = Yt(encryptData, e)
    //$g.log.append('result', result)
    if(url == 'https://capi.coinglass.com/api/hyperliquid/topPosition'){
        resultData.hyperliquidTopPosition = JSON.parse(result)
    }else if(url == 'https://capi.coinglass.com/api/hyperliquid/topPosition/action'){
        resultData.hyperliquidTopPositionAction = JSON.parse(result)
    }
    **/

    if(flag){
        return
    }
    flag = true
    let positionList = []
    let positionListAction = []
    const resultStr = $g.fs.read(path.join($g.taskPath, 'result_ex.txt'))
    const resultInfo = JSON.parse(resultStr)
    for(const key in resultInfo.dataEx || []){
        $g.log.append('debug', key)
        if(key == 'whalePositionAction'){
            const html = resultInfo.dataEx[key].desc.html
            const $ = cheerio.load(html)
            const list = $('.hyperliquid-live-table')
            for (const row of list) {
                const cells = $(row).find('.hyperliquid-live-table >div >div')
                const user_id = $(cells[0]).find('a').attr('href').split('/').pop()
                const coin = $(cells[1]).text().trim()

                const position_usd = parseNumber($(cells[3]).text().trim())
                const entry_price = parseNumber($(cells[4]).text().trim())
                const liquidation_price = entry_price
                let size = position_usd / entry_price

                const state_str = $(cells[2]).text().trim()
                let state = 1
                switch(state_str){
                    case '买入开多':
                        state = 1
                    break;
                    case '卖出平多':
                        state = 2
                    break;
                    case '卖出开空':
                        state = 1
                        size = -1 * size
                    break;
                    case '买入平空':
                        state = 2
                        size = -1 * size
                    break;
                }
                
                const timePart = $(cells[5]).text().trim()
                // $g.log.append('timePart', timePart)
                const [hour, minute] = timePart.split(':')
                const now = new Date();
                let date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hour), parseInt(minute), 0);
                if (date.getTime() > now.getTime()) {
                    date.setDate(date.getDate() - 1);
                }
                const create_timestamp = date.getTime()

                positionListAction.push({
                    coin,
                    createTime: create_timestamp,
                    entryPrice: entry_price,
                    liquidationPrice: liquidation_price,
                    positionUsd: position_usd,
                    size,
                    state,
                    userId: user_id
                })
            }
        }else{
            const html = '<table>' + resultInfo.dataEx[key].desc.html + '</table>'
            const $ = cheerio.load(html)
            const list = $("tr.ant-table-row")
            for (const row of list) {
                const cells = $(row).find('td')
                if (cells.length === 0){
                    continue
                } 
                const id = $(row).attr('data-row-key')
                const coin = $(cells[3]).text().trim()
                const direction = $(cells[4]).text().trim()

                const datePart = $(cells[12]).find('div > div:last-child').text().trim()
                const timePart = $(cells[12]).find('div > div:first-child').text().trim()
                const [month, day] = datePart.split('-')
                const [hour, minute] = timePart.split(':')
                const year = new Date().getFullYear() // 当前年份，根据上下文
                const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0)
                const create_timestamp = date.getTime()

                const entry_price = parseNumber($(cells[7]).find('div > div:first-child').text().trim())
                const leverage_info = $(cells[7]).find('.font3').text().trim()
                const [leverage_str, position_type_str] = leverage_info.split(' ')
                const leverage = leverage_str.replace('X', '')
                let position_type = 'cross'
                if(position_type_str != '全仓'){
                    position_type = 'isolated'
                }
                const liquidation_price = parseNumber($(cells[8]).text().trim())
                const margin = parseNumber($(cells[9]).text().trim())
                
                const position_usd = parseNumber($(cells[5]).find('div > div:first-child').text().trim())
                const size_str = $(cells[5]).find('.font3').text().trim();
                let size = parseNumber(size_str.split(' ')[0])
                if(direction == '空'){
                    size = -1 * size
                }

                const price = parseNumber($(cells[11]).text().trim())
                const type = 'oneWay'
                const unrealized_pnl = parseNumber($(cells[6]).find('div > div:first-child').text().trim())
                const funding_fee = parseNumber($(cells[10]).text().trim())
                const user_id = $(cells[2]).find('a').attr('href').split('/').pop();

                positionList.push({
                    id,
                    coin,
                    createTime: create_timestamp,
                    entryPrice: entry_price,
                    fundingFee: funding_fee,
                    leverage,
                    liquidationPrice: liquidation_price,
                    margin,
                    positionType: position_type,
                    positionUsd: position_usd,
                    price,
                    size,
                    type,
                    unrealizedPnl: unrealized_pnl,
                    updateTime: create_timestamp,
                    userId: user_id
                })
            }
        }
    }
    resultData.hyperliquidTopPosition = positionList
    resultData.hyperliquidTopPositionAction = positionListAction
}

exports.hyperliquidInfo = function(htmlStr, requestData){
    //$g.log.append('debug', htmlStr)
    //$g.log.append('debug', JSON.stringify(requestData))
    const postData = JSON.parse(requestData.postData)
    if(!postData){
        return
    }
    const type = postData.type
    if(type != 'userFills'){
        return
    }
    const user = postData.user
    const data = JSON.parse(htmlStr)
    const result = {
        user_id: user,
        data
    }
    resultData.hyperliquidUserFills = result
}