
const fs = require("fs");
const path = require("path")
const https = require('https')
const axios = require('axios')
const agent = new https.Agent({rejectUnauthorized: false})

const url = 'https://47.74.153.74/crawler_center_service/cp_save_crawl_result'

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
    const response = await axios.post(url, params, {httpsAgent: agent})
    console.log(response)
    return response
}