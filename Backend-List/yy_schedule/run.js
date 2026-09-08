const axios = require('axios')
const path = require('path')
const fs = require('fs')
const moment = require('moment');
const {
    buildCrawlerUrl,
    getCrawlerRequestConfig,
    requireSafeAccountCache,
    resolveSafeChildDirectory,
    runCrawlerProcess
} = require('./crawler_client')
const { $util } = require('./utils')
const sleep=(delay)=>new Promise((resolve) => setTimeout(resolve, delay));

const crawlURL = buildCrawlerUrl("/cp_crawler_target")
const saveURL = buildCrawlerUrl("/cp_save_crawl_result")

let electronPath = ''
let baseTaskDir = ''
let baseUserDataDir = ''
if (process.platform === 'linux') {
    electronPath = '/data/browsers_self/browser_monitor/electron'
    baseTaskDir = '/data/task_logs/'
    baseUserDataDir = '/data/account_cache/'
} else {
    //electronPath = 'D:\\electron\\selfdriven\\electron'
    //baseTaskDir = 'D:\\electron\\task'
    //baseUserDataDir = 'D:\\electron\\user_data'
    electronPath = 'C:\\Users\\hushuangxing\\Electron\\selfdriven\\electron'
    baseTaskDir = 'C:\\Users\\hushuangxing\\Desktop\\electron_data\\task'
    baseUserDataDir = 'C:\\Users\\hushuangxing\\Desktop\\electron_data\\user_data'
}

const configStr = $util.fs.read('./configs.json')
const config = $util.$json_from_string(configStr)
const machineLoc = config.loc

console.log('start ...')
async function main(){
    deleteOldFolders(baseTaskDir)
    let res = ''
    try {
        res = await axios.post(crawlURL, `params={"site":"blockchain","loc":"${machineLoc}"}`, getCrawlerRequestConfig())
    } catch(err) {
        console.log('crawler request failed: ' + (err && err.code ? err.code : 'unknown'))
        return
    }
    if(!res.data.success) {
        console.log('current not found task')
        return
    }
    const taskId = res.data.task_id
    const taskType = res.data.task_type
    let accountCache
    try {
        accountCache = requireSafeAccountCache(res.data.account_cache)
    } catch (err) {
        console.log('rejected task with invalid account_cache')
        return
    }
    const scriptContent = res.data.script_content
    if (typeof scriptContent !== 'string' || scriptContent.length > 5 * 1024 * 1024) {
        console.log('rejected task with invalid script content')
        return
    }
    const currentDate = moment().format('YYYYMMDD')
    const currentTime = moment().format('YYYYMMDDHHmmss')
    const taskDateDir = path.join(baseTaskDir, currentDate)
    if (!$util.fs.exists(taskDateDir)) {
        $util.fs.mkdir(taskDateDir)
    }
    
    const taskDir = resolveSafeChildDirectory(taskDateDir, `${currentTime}_${accountCache}`)
    $util.fs.mkdir(taskDir)
    const taskScriptPath = path.join(taskDir, 'script')
    fs.writeFileSync(taskScriptPath, scriptContent, {encoding: 'utf8', mode: 0o600})
    const userDataDir = resolveSafeChildDirectory(baseUserDataDir, accountCache)
    
    const processResult = runCrawlerProcess(electronPath, taskScriptPath, userDataDir, true)
    try {
        fs.unlinkSync(taskScriptPath)
    } catch (err) {
        console.log('failed to remove temporary task script')
        return
    }
    if (!processResult.ok) {
        const failure = processResult.errorCode || processResult.signal || processResult.status || 'unknown'
        console.log(`crawler process failed: ${failure}`)
        return
    }
    //const taskDir = path.join(taskDateDir, '20250103105142_twitter')
    const resultFile = `${taskDir}/result_ex_crawler.txt`
    if (!$util.fs.exists(resultFile)) {
        return
    }
    let taskResult = 1
    let lastStepImage = ''
    let snapshots = {}
    if ($util.fs.exists(path.join(taskDir, 'ret'))) {
        taskResult = $util.fs.read(path.join(taskDir, 'ret'))
    }
    if ($util.fs.exists(path.join(taskDir, 'last_step.jpg'))) {
        const imageContent = $util.fs.readImage(path.join(taskDir, 'last_step.jpg'))
        const imageBase64 = new Buffer.from(imageContent).toString('base64')
        lastStepImage = `data:image/jpg;base64,${imageBase64}`
    }
    const files = fs.readdirSync(taskDir)
    files.forEach(fileName => {
        if (fileName.indexOf('snapshot_') === 0) {
            const imageContent = $util.fs.readImage(path.join(taskDir, fileName))
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            snapshots[fileName] = `data:image/jpg;base64,${imageBase64}`
        }
    })
    const resultData = $util.fs.read(resultFile)
    const saveParams = {
        task_id: taskId,
        task_type: taskType,
        result: taskResult,
        last_step_image: lastStepImage,
        snapshots: snapshots,
        content: resultData
    }
    let paramsStr = new Buffer.from(JSON.stringify(saveParams)).toString('base64')
    paramsStr = encodeURIComponent(paramsStr)
    for (let i=0; i<10; i++) {
        try {
            await axios.post(saveURL, `params=${paramsStr}`, getCrawlerRequestConfig())
            console.log('crawl result saved')
            break
        } catch (err) {
            console.log('save failed: ' + (err && err.code ? err.code : 'unknown'))
            //console.log(paramsStr)
        }
        console.log('retry: ' + i)
    }
}

function deleteOldFolders(dirPath) {
    const now = new Date();
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        entries.forEach(entry => {
            const fullPath = path.join(dirPath, entry.name);
            // 获取文件或文件夹状态
            const stats = fs.statSync(fullPath);
            // 检查文件夹最后修改时间是否超过7天
            const modifiedTime = new Date(stats.mtime);
            const diffDays = (now - modifiedTime) / (1000 * 60 * 60 * 24);
            if (diffDays > 7) {
                if (entry.isDirectory()) {
                    // 递归删除文件夹内容
                    deleteOldFolders(fullPath);
                    // 尝试删除文件夹
                    fs.rmdirSync(fullPath);
                    console.log('Deleted folder: ' + fullPath);
                } else {
                    fs.unlinkSync(fullPath);
                }
            } else if (entry.isDirectory()) {
                // 如果文件夹未超过7天，递归检查其内容
                // deleteOldFolders(fullPath);
            }
        });
    } catch (err) {
        console.error('Error occurred:', err);
    }
}


async function start(){
    while(true){
        await main();
        // break;
        await sleep(5000);
    }
}

start();
