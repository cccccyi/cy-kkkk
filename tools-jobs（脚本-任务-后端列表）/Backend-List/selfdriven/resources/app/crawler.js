let $g, taskConfig, taskId, crawlerActionsMap
const path = require("path")
const https = require('https')
const axios = require('axios')
const agent = new https.Agent({rejectUnauthorized: false})
//const crawlURL = 'https://183.240.204.129:12443/crawler_center_service/cp_crawler_target'
//const crawlURL = 'https://183.240.204.129:12443/crawler_center_service/cp_crawl_fb_account_target_debug'
//const crawlSaveURL = 'https://183.240.204.129:12443/crawler_center_service/cp_save_crawl_result'
//const crawlURL = 'http://161.117.55.73:8011/crawler_center_service/cp_crawler_target'
//const crawlSaveURL = 'http://161.117.55.73:8011/crawler_center_service/cp_save_crawl_result'
const crawlURL = 'http://82.157.161.88/crawler_center_service/cp_crawler_target'
const crawlSaveURL = 'http://82.157.161.88/crawler_center_service/cp_save_crawl_result'

async function axiosPost(url, params, retry=3){
  for (let i=0; i<retry; i++) {
    try{
      const response = await axios.post(url, params, {httpsAgent: agent})
      return response
    }catch(err){
      $g.log.append("axiosPost", "Exception: " + err.toString());
    }
  }
  return {}
}

exports.create = function(_$g, _taskId) {
    $g = _$g
    taskId = _taskId
    const scriptsPath = path.resolve(__dirname, 'scripts')
    crawlerActionsMap = {
        fb_crawl_feeds: $g.fs.read(path.resolve(scriptsPath, 'fb_crawl_feeds.js'), 'utf-8'),
        fb_guid_account: $g.fs.read(path.resolve(scriptsPath, 'crawl_fb_guid_account.js'), 'utf-8'),
        post_detect: $g.fs.read(path.resolve(scriptsPath, 'fb_group_post_detect.js'), 'utf-8'),
        post_info: $g.fs.read(path.resolve(scriptsPath, 'fb_group_post_info_collect.js'), 'utf-8'),
        join_detect: $g.fs.read(path.resolve(scriptsPath, 'fb_group_join_detect.js'), 'utf-8'),
        monitor_target: $g.fs.read(path.resolve(scriptsPath, 'crawl_fb_monitor_account.js'), 'utf-8'),
        fb_single_post: $g.fs.read(path.resolve(scriptsPath, 'fb_single_post.js'), 'utf-8'),
        fb_follow_target: $g.fs.read(path.resolve(scriptsPath, 'fb_follow_target.js'), 'utf-8'),
        fb_crawler_friends: $g.fs.read(path.resolve(scriptsPath, 'fb_crawl_friends.js'), 'utf-8'),
        fb_crawler_followers: $g.fs.read(path.resolve(scriptsPath, 'fb_crawl_followers.js'), 'utf-8'),
        fb_crawler_following: $g.fs.read(path.resolve(scriptsPath, 'fb_crawl_following.js'), 'utf-8'),
        ins_monitor_account: $g.fs.read(path.resolve(scriptsPath, 'crawl_ins_monitor_account.js'), 'utf-8'),
        tweet_info: $g.fs.read(path.resolve(scriptsPath, 'tw_tweet_info.js'), 'utf-8')
    }
}

exports.processCrawlParams = async function(_taskConfig) {
    taskConfig = _taskConfig
    if (!taskConfig.crawlOptions) {
      if ($g.log) {
        $g.log.append('crawler', 'not process crawl')
      }
      return taskConfig
    }
    const crawlOptions = taskConfig.crawlOptions
    if (crawlOptions.crawlerType) {
        const fid = crawlOptions.crawlerAccountFid || ''
        $g.log.append('debug', `params={"site":"${crawlOptions.site}","type":"${crawlOptions.crawlerType}","fid":"${fid}","exec_id":"${taskId}"}`)
        const response = await axiosPost(crawlURL, `params={"site":"${crawlOptions.site}","type":"${crawlOptions.crawlerType}","fid":"${fid}","exec_id":"${taskId}"}`)
        $g.log.append('crawler request', JSON.stringify(response.data))
        const type = response.data?.type || ''
        const result = response.data?.data || []
        switch (type) {
            case 'tweet_info':
                $g.crawlGroupPermeationType = 'twitter_tweet_info'
                $g.crawlTaskParams = result
                let crawlTweetInfoActionsStr = crawlerActionsMap.tweet_info
                for (const key in result) {
                    crawlTweetInfoActionsStr = crawlTweetInfoActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), result[key])
                }
                const crawlTweetInfoActionsArr = JSON.parse(crawlTweetInfoActionsStr)
                taskConfig.actions.push(...crawlTweetInfoActionsArr)
            break
            case 'fb_crawler_feeds':
                let crawlFbFeedsActionsStr = crawlerActionsMap.fb_crawl_feeds
                for (const key in result) {
                    crawlFbFeedsActionsStr = crawlFbFeedsActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), result[key])
                }
                const crawlFbFeedsActionsArr = JSON.parse(crawlFbFeedsActionsStr)
                taskConfig.actions.push(...crawlFbFeedsActionsArr)
            break
            case 'fb_guid_account':
                for (const fid of result) {
                    let crawlerUrl = `https://www.facebook.com/${fid}`
                    if (fid.indexOf('facebook') != -1){
                        crawlerUrl = fid
                    }
                    const crawlFbGuidAccountActionsStr = crawlerActionsMap.fb_guid_account.replace(new RegExp('{{crawlerUrl}}', 'g'), crawlerUrl)
                    const crawlFbGuidAccountActionsArr = JSON.parse(crawlFbGuidAccountActionsStr)
                    taskConfig.actions.push(...crawlFbGuidAccountActionsArr)
                }
            break
            case 'monitor_target':
                for (const params of result) {
                    let crawlFbMonitorAccountActionsStr = crawlerActionsMap.monitor_target
                    for (const key in params) {
                      crawlFbMonitorAccountActionsStr = crawlFbMonitorAccountActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                    }
                    const crawlFbMonitorAccountActionsArr = JSON.parse(crawlFbMonitorAccountActionsStr)
                    taskConfig.actions.push(...crawlFbMonitorAccountActionsArr)
                }
            break
            case 'fb_single_post':
                for (const params of result) {
                    $g.crawlGroupPermeationType = 'fb_post_single'
                    $g.crawlTaskParams = params
                    let crawlFbSinglePostActionsStr = crawlerActionsMap.fb_single_post
                    for (const key in params) {
                        crawlFbSinglePostActionsStr = crawlFbSinglePostActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                    }
                    const crawlFbSinglePostActionsArr = JSON.parse(crawlFbSinglePostActionsStr)
                    taskConfig.actions.push(...crawlFbSinglePostActionsArr)
                }
            break
            case 'post_detect':
                for (const params of result) {
                    $g.crawlGroupPermeationType = 'group_permeation_post_detect'
                    $g.crawlTaskParams = params
                    let crawlFbGroupPostDetectActionsStr = crawlerActionsMap.post_detect
                    for (const key in params) {
                        crawlFbGroupPostDetectActionsStr = crawlFbGroupPostDetectActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                    }
                    const crawlFbGroupPostDetectActionsArr = JSON.parse(crawlFbGroupPostDetectActionsStr)
                    taskConfig.actions.push(...crawlFbGroupPostDetectActionsArr)
                }
            break
            case 'post_info':
                for (const params of result) {
                    $g.crawlGroupPermeationType = 'group_permeation_post_info'
                    $g.crawlTaskParams = params
                    let crawlFbGroupPostInfoActionsStr = crawlerActionsMap.post_info
                    for (const key in params) {
                        crawlFbGroupPostInfoActionsStr = crawlFbGroupPostInfoActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                    }
                    const crawlFbGroupPostInfoActionsArr = JSON.parse(crawlFbGroupPostInfoActionsStr)
                    taskConfig.actions.push(...crawlFbGroupPostInfoActionsArr)
                }
            break
            case 'join_detect':
                for (const params of result) {
                    $g.crawlGroupPermeationType = 'group_permeation_join_detect'
                    $g.crawlTaskParams = params
                    let crawlFbGroupJoinDetectActionsStr = crawlerActionsMap.join_detect
                    for (const key in params) {
                        crawlFbGroupJoinDetectActionsStr = crawlFbGroupJoinDetectActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                    }
                    try {
                        const crawlFbGroupJoinDetectActionsArr = JSON.parse(crawlFbGroupJoinDetectActionsStr)
                        taskConfig.actions.push(...crawlFbGroupJoinDetectActionsArr)
                        flag = false
                    } catch (error) {
                        $g.log.append('Crawl error', error)
                        $g.log.append('Script', crawlFbGroupJoinDetectActionsStr)
                    }
                }
            break
            case 'fb_account_url_map':
                for (const params of result) {
                    $g.crawlGroupPermeationType = 'fb_account_url_map'
                    $g.crawlTaskParams = params
                    const crawlerUrl = params.crawlerUrl
                    const crawlFbGuidAccountActionsStr = crawlerActionsMap.fb_guid_account.replace(new RegExp('{{crawlerUrl}}', 'g'), crawlerUrl)
                    const crawlFbGuidAccountActionsArr = JSON.parse(crawlFbGuidAccountActionsStr)
                    taskConfig.actions.push(...crawlFbGuidAccountActionsArr)
                }
            break
            case 'fb_follow_target':
              for (const params of result) {
                let crawlFbFollowTargetActionsStr = crawlerActionsMap.fb_follow_target
                for (const key in params) {
                  crawlFbFollowTargetActionsStr = crawlFbFollowTargetActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
                }
                const crawlFbFollowTargetActionsArr = JSON.parse(crawlFbFollowTargetActionsStr)
                taskConfig.actions.push(...crawlFbFollowTargetActionsArr)
              }
            break
            case 'fb_crawler_friends':
              let crawlFriendsActionsStr = crawlerActionsMap.fb_crawler_friends
              for (const key in result) {
                crawlFriendsActionsStr = crawlFriendsActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), result[key])
              }
              const crawlFriendsActionsArr = JSON.parse(crawlFriendsActionsStr)
              taskConfig.actions.push(...crawlFriendsActionsArr)
            break
            case 'fb_crawler_followers':
                let crawlFollowersActionsStr = crawlerActionsMap.fb_crawler_followers
                for (const key in result) {
                    crawlFollowersActionsStr = crawlFollowersActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), result[key])
                }
                const crawlFollowersActionsArr = JSON.parse(crawlFollowersActionsStr)
                taskConfig.actions.push(...crawlFollowersActionsArr)
            break
            case 'fb_crawler_following':
                let crawlFollowingActionsStr = crawlerActionsMap.fb_crawler_following
                for (const key in result) {
                    crawlFollowingActionsStr = crawlFollowingActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), result[key])
                }
                const crawlFollowingActionsArr = JSON.parse(crawlFollowingActionsStr)
                taskConfig.actions.push(...crawlFollowingActionsArr)
            break
            case 'twitter_reply':
                $g.twitterScreenName = fid
                const twitterReplyActionsArr = JSON.parse(response.data?.script_content)
                // $g.log.append('crawler twitterReplyActionsArr', twitterReplyActionsArr)
                taskConfig.actions.push(...twitterReplyActionsArr)
            break
            case 'monitor':
                const monitorActionsArr = JSON.parse(response.data?.script_content)
                taskConfig.actions.push(...monitorActionsArr)
            break
        }
    } else if (crawlOptions.crawlIns=="y") {
        const response = await axiosPost(crawlURL, `params={"site":"instagram","exec_id":"${taskId}"}`)
        $g.log.append('crawl ins', JSON.stringify(response.data))
        const result = response.data?.data || []
        for (const params of result) {
          $g.crawlTaskParams = params
          let crawlInsMonitorAccountActionsStr = crawlerActionsMap.ins_monitor_account
          for (const key in params) {
            crawlInsMonitorAccountActionsStr = crawlInsMonitorAccountActionsStr.replace(new RegExp('{{'+key+'}}', 'g'), params[key])
          }
          const crawlInsMonitorAccountActionsArr = JSON.parse(crawlInsMonitorAccountActionsStr)
          taskConfig.actions.push(...crawlInsMonitorAccountActionsArr)
        }
    }
    taskConfig.homeUrl = 'https://www.google.com'
    return taskConfig
}

exports.processCrawlSave = async function() {
    const resultFile = path.join($g.taskPath, 'result_ex.txt')
    if ($g.fs.exists(resultFile)) {
        const resultData = $g.$json(resultFile) || {}
        const oldResultFile = "result_ex_" + new Date().getTime() + ".txt"
        const oldResult = path.join($g.taskPath, oldResultFile);
        await $g.fs.$rename(resultFile, oldResult);
        $g.log.append('continue_crawl', 'result_ex.txt : ' + oldResult)
        const saveParams = {
            last_crawl_operation_id: 1111,
            exec_id: taskId,
            task_exec_status: '',
            crawl_fids: [],
            user_id: 1111,
            content: JSON.stringify(resultData)
        }
        let paramsStr = new Buffer.from(JSON.stringify(saveParams)).toString('base64')
        paramsStr = encodeURIComponent(paramsStr)
        const response = await axiosPost(crawlSaveURL, `params=${paramsStr}`)
        $g.log.append('continue_crawl', 'save return: ' + JSON.stringify(response.data))
    }
    const indexFile = path.join($g.networkPath, 'index')
    if ($g.fs.exists(indexFile)) {
        let oldIndexFile = "index" + new Date().getTime();
        let oldIndex = path.join($g.networkPath, oldIndexFile);
        await $g.fs.$rename(indexFile, oldIndex);
        $g.log.append('continue_crawl', `index file: ${oldIndexFile}`)
    }
}