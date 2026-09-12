
const fs = require("fs");
const path = require("path")
const axios = require('axios')
const { buildCrawlerUrl, getCrawlerRequestConfig } = require('./crawler_client')

const url = buildCrawlerUrl("/cp_save_crawl_result")

const resultFile = 'C:\\Users\\hushuangxing\\Downloads\\result_ex_1693279596601.txt'
const resultStr = fs.readFileSync(resultFile, "utf-8")
let resultData = JSON.parse(resultStr) || {}
// const postList = resultData.dataEx.network_crawler.feed_post_list
// delete resultData.dataEx.network_crawler.feed_post_list
// resultData.dataEx.network_crawler.feed_post_list.splice(220)

const saveParams = {
    last_crawl_operation_id: 1111,
    exec_id: '',
    task_exec_status: '',
    crawl_fids: [],
    user_id: 1111,
    content: JSON.stringify(resultData)
}
let paramsStr = new Buffer.from(JSON.stringify(saveParams)).toString('base64')
paramsStr = encodeURIComponent(paramsStr)

const params = `params=${paramsStr}`

axiosPost(url, params)

async function axiosPost(url, params){
    const response = await axios.post(url, params, getCrawlerRequestConfig())
    console.log({status: response.status, success: response.data?.success === true})
    return response
}
