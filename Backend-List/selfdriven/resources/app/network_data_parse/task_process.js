const path = require('path')

/**
 * Task process function
 * there is some crawler task, result data need formated
 */
$g = null
parseOptions = null
resultData = {}
outerResultData = {}
taskParams = {}

exports.taskProcessInitData = function(_$g, _parseOptions, _resultData) {
    $g = _$g
    parseOptions = _parseOptions
    resultData = _resultData
    taskParams = parseOptions.taskParams.params
}

exports.getTaskResultData = function() {
    return {outerResultData}
}

exports.processFbAccountInfoCollect = function() {
    const accountFid = taskParams.targetAccountFid
    let accountAvailable = true
    let accountInfo = null
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available')) {
            if (data.url.indexOf(accountFid) > -1) {
                accountAvailable = false
                break
            }
        }
        if (key.startsWith('account_')) {
            if (data.identity === accountFid) {
                accountInfo = data
                break
            }
        }
    }
    if (!accountAvailable) {
        outerResultData.crawler_account_info = {
            identity: accountFid,
            available: 'n'
        }
    } else {
        outerResultData.crawler_account_info = accountInfo
    }
}

exports.processFbGroupInfoCollect = function() {
    const groupFid = taskParams.groupIdentity
    let groupAvailable = true
    let groupInfo = null
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available')) {
            if (data.url.indexOf(groupFid) > -1) {
                groupAvailable = false
                break
            }
        }
        if (key.startsWith('account_')) {
            if (data.identity === groupFid) {
                groupInfo = data
                break
            }
        }
    }
    if (!groupAvailable) {
        outerResultData.crawler_group_info = {
            identity: groupFid,
            available: 'n'
        }
    } else {
        outerResultData.crawler_group_info = groupInfo
    }
}

exports.processFbJoinGroupDetect = function() {
    const groupFid = taskParams.groupIdentity
    const accountName = taskParams.targetAccountName
    const accountFid = taskParams.targetAccountFid
    let isPermeation = 'n'
    let groupAvailable = true
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available')) {
            if (data.url.indexOf(groupFid) > -1) {
                groupAvailable = false
                break
            }
        }
        if (key.startsWith('group_member_')) {
            for (const member of data) {
                if (member.group_iid === groupFid && member.user_iid === accountFid) {
                    isPermeation = 'y'
                }
            }
        }
    }
    if (!groupAvailable) {
        outerResultData.crawler_group_info = {
            identity: groupFid,
            available: 'n'
        }
    } else {
        outerResultData.crawler_join_group_check = {
            group_fid: groupFid,
            account_fid: accountFid,
            accountName: accountName,
            last_check_permeation_time: new Date().getTime(),
            is_permeation: isPermeation
        }
    }
}

exports.processFbGroupPostDetect = function() {
    const groupFid = taskParams.groupIdentity
    const accountFid = taskParams.targetAccountFid
    const guidEsId = taskParams.guidEsId
    const taskTime = taskParams.task_time
    const effectiveTimeDuration = taskParams.effective_time_duration
    let matchPost = {}
    let lastAbsTime = effectiveTimeDuration
    let groupAvailable = true
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available')) {
            if (data.url.indexOf(groupFid) > -1) {
                groupAvailable = false
                break
            }
        }
        if (key.startsWith('search_group_post_') || key.startsWith('single_post_')) {
            for (const post of data) {
                if (post.group_fid === groupFid && post.user_iid === accountFid) {
                    const postTimestamp = new Date(post.post_time).getTime() / 1000
                    if (taskTime - postTimestamp > 3600) {
                        continue
                    }
                    const absTime = Math.abs(postTimestamp - taskTime)
                    if (absTime < effectiveTimeDuration && absTime < lastAbsTime) {
                        matchPost = post
                        lastAbsTime = absTime;
                    }
                }
            }
        }
    }
    if (!groupAvailable) {
        outerResultData.crawler_group_info = {
            identity: groupFid,
            available: 'n'
        }
    } else {
        if (outerResultData.crawler_group_post_check?.post_info) {
            const lastPostTimestamp = new Date(outerResultData.crawler_group_post_check.post_info.post_time).getTime() / 1000
            const postTimestamp = new Date(matchPost.post_time).getTime() / 1000
            if (Math.abs(postTimestamp - taskTime) > Math.abs(lastPostTimestamp - taskTime)) {
                return
            }
        } 
        outerResultData.crawler_group_post_check = {
            guid_es_id: guidEsId,
            post_info: matchPost
        }
    }
}

exports.processFbGroupPostInfoCollect = function() {
    const postFid = taskParams.post_fid
    let postInfo = null
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available_')) {
            if (data.url.indexOf(postFid) > -1) {
                postInfo = {
                    post_fid: postFid,
                    operator_available: 'n'
                }
                break
            }
        }
        if (key.startsWith('single_post_')) {
            for (const post of data) {
                if (postFid === post.identity) {
                    postInfo = post
                    break
                }
            }
        }
    }
    if (postInfo) {
        outerResultData.crawler_post_info = postInfo
    }
}

// group permeation crawl task
exports.processGroupPermeationPostDdetect = function() {
    const groupFid = $g.crawlTaskParams.group_fid
    const accountFid = $g.crawlTaskParams.account_fid
    const guidEsId = $g.crawlTaskParams.guid_es_id
    const taskTime = $g.crawlTaskParams.task_time
    const effectiveTimeDuration = $g.crawlTaskParams.effective_time_duration
    let matchPost = {}
    let lastAbsTime = effectiveTimeDuration
    let groupAvailable = true
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available')) {
            if (data.url.indexOf(groupFid) > -1) {
                groupAvailable = false
                break
            }
        }
        if (key == 'group_user_posts') {
            for (const post of data) {
                if (post.group_fid === groupFid && post.user_iid === accountFid) {
                    const postTimestamp = new Date(post.post_time).getTime() / 1000
                    if (taskTime - postTimestamp > 3600) {
                        continue
                    }
                    const absTime = Math.abs(postTimestamp - taskTime)
                    if (absTime < effectiveTimeDuration && absTime < lastAbsTime) {
                        matchPost = post
                        lastAbsTime = absTime;
                    }
                }
            }
        }
    }
    if (!groupAvailable) {
        outerResultData.crawler_group_info = {
            identity: groupFid,
            available: 'n'
        }
    } else {
        if (outerResultData.crawler_group_post_check?.post_info) {
            const lastPostTimestamp = new Date(outerResultData.crawler_group_post_check.post_info.post_time).getTime() / 1000
            const postTimestamp = new Date(matchPost.post_time).getTime() / 1000
            if (Math.abs(postTimestamp - taskTime) > Math.abs(lastPostTimestamp - taskTime)) {
                return
            }
        } 
        outerResultData.crawler_group_post_check = {
            guid_es_id: guidEsId,
            post_info: matchPost
        }
    }
}

exports.processGroupPermeationPostInfo = function() {
    const postFid = $g.crawlTaskParams.post_fid
    let postInfo = null
    for (const key in resultData) {
        const data = resultData[key]
        if (key.startsWith('not_available_')) {
            if (data.url.indexOf(postFid) > -1) {
                postInfo = {
                    post_fid: postFid,
                    operator_available: 'n'
                }
                break
            }
        }
        if (key.startsWith('single_post_')) {
            for (const post of data) {
                if (postFid === post.identity) {
                    postInfo = post
                    break
                }
            }
        }
    }
    if (postInfo) {
        const screenshotFile = path.join($g.taskPath, `post_screenshot_${postFid}.jpg`)
        outerResultData.crawler_post_info = postInfo
        if ($g.fs.exists(screenshotFile)) {
            const imageContent = $g.fs.readImage(screenshotFile)
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            outerResultData.crawler_post_info.screenshot = `data:image/jpg;base64,${imageBase64}`
        }
    }
}

exports.processTwitterTweetInfo = function() {
    const tweetId = $g.crawlTaskParams.tweet_id
    let tweetInfo = null
    if (resultData.twitter_tweet) {
        for (const tweet of resultData.twitter_tweet) {
            if (tweetId == tweet.id_str) {
                tweetInfo = tweet
                break
            }
        }
    }
    if (tweetInfo) {
        const screenshotFile = path.join($g.taskPath, `tweet_screenshot_${tweetId}.jpg`)
        outerResultData.crawler_tweet_info = tweetInfo
        if ($g.fs.exists(screenshotFile)) {
            const imageContent = $g.fs.readImage(screenshotFile)
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            outerResultData.crawler_tweet_info.screenshot = `data:image/jpg;base64,${imageBase64}`
        }
    }
}