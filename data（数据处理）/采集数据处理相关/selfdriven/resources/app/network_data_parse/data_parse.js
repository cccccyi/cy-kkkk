/**
 * Data parse function, get data to {dataEx:{}}
 * every export function (suffix is DataParse) is a parse functions
 */
const fbParseProcess = require('./facebook_data_parse')
const twParseProcess = require('./twitter_data_parse')
const newsParseProcess = require('./news_data_parse')
const insParseProcess = require('./ins_data_parse')
const uwantsProcess = require('./uwants_data_parse')
const discussProcess = require('./discuss_data_parse')
const meweProcess = require('./mewe_data_parse')
const paNewsProcess = require('./panews_data_parse')
const theBlockProcess = require('./theblock_data_parse')
const binanceProcess = require('./binance_data_parse')

$g = null
parseOptions = null
resultData = {}

exports.dataParseInitData = function(_$g, _parseOptions) {
    $g = _$g
    parseOptions = _parseOptions
    resultData = {}
}

exports.getParseResultData = function() {
    for (const key in resultData) {
        if (resultData[key].length == 0) {
            delete resultData[key]
        }
    }
    return {resultData}
}

for (const funName in fbParseProcess) {
    exports[funName] = fbParseProcess[funName]
}

for (const funName in twParseProcess) {
    exports[funName] = twParseProcess[funName]
}

for (const funName in newsParseProcess) {
    exports[funName] = newsParseProcess[funName]
}

for (const funName in insParseProcess) {
    exports[funName] = insParseProcess[funName]
}

for (const funName in uwantsProcess) {
    exports[funName] = uwantsProcess[funName]
}

for (const funName in discussProcess) {
    exports[funName] = discussProcess[funName]
}

for (const funName in meweProcess) {
    exports[funName] = meweProcess[funName]
}

for(const funName in paNewsProcess){
    exports[funName] = paNewsProcess[funName]
}

for(const funName in theBlockProcess){
    exports[funName] = theBlockProcess[funName]
}

for(const funName in binanceProcess){
    exports[funName] = binanceProcess[funName]
}