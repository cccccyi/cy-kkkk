const path = require('path')
const cheerio = require('cheerio')

exports.discussProfile = function (htmlStr, requestData) {
    const $ = cheerio.load(htmlStr)
    if (!resultData.discuss_profile_list) {
        resultData.discuss_profile_list = []
    }
    let profile = {
        uid: '',
        username: '',
        photo: '',
        position: '',
        threadCount: 0,
        followerCount: 0,
        followingCount: 0
    }
    const nameArr = $(".user-profile-name").text().split(' | ')
    profile.username = nameArr[0]
    profile.position = nameArr[1]
    const uProfileUrl = $("meta[property='og:url']").attr("content")
    const matchUidObj = uProfileUrl.match(/uid=(\d+)/)
    if (matchUidObj[1]) {
        profile.uid = matchUidObj[1]
    }
    const matchAvatarObj = htmlStr.match(/<div class="user\-profile\-pic" style="background\-image: url\('(.*?)'\);">/)
    if (matchAvatarObj[1]) {
        profile.photo = matchAvatarObj[1]
    }
    const matchThreadObj = htmlStr.match(/<div class="user\-profile\-info\-left">帖子<\/div>\s*<div class="user\-profile\-info\-right">(\d+)<\/div>/)
    if (matchThreadObj[1]) {
        profile.threadCount = matchThreadObj[1]
    }   
    profile.followerCount = $(".follower-num").text()
    const matchFollowingObj = htmlStr.match(/<div class="user\-profile\-number" style="border:none">\s*(\d+)<br>\s*<span style=".*?">追蹤<\/span>/)
    if (matchFollowingObj[1]) {
        profile.followingCount = matchFollowingObj[1]
    }   
    //$g.log.append('debug', JSON.stringify(profile))
    resultData.discuss_profile_list.push(profile)
}

exports.discussThread = function (htmlStr, requestData) {
    if (!resultData.discuss_thread_list) {
        resultData.discuss_thread_list = []
    }
    let thread = {
        tid: '',
        uid: '',
        uname: '',
        post_time: '',
        url: '',
        title: '',
        description: '',
        image: '',
        level1: '',
        level2: ''
    }
    const $ = cheerio.load(htmlStr)
    const url = $("meta[property='og:url']").attr("content")
    if (!url){
        return
    }
    thread.url = url
    const matchTidObj = url.match(/viewthread\.php\?tid=(\d+)/)
    if (matchTidObj[1]) {
        thread.tid = matchTidObj[1]
    } else {
        return
    }
    thread.title = $("meta[property='og:title']").attr("content")
    thread.description = $("meta[property='og:description']").attr("content")
    thread.image = $("meta[property='og:image']").attr("content")
    thread.level1 = $("meta[property='dmp:level1']").attr("content")
    thread.level2 = $("meta[property='dmp:level2']").attr("content")
    thread.uname = $("table[id*='table-pid'] .autor-name-row a").text()
    const uProfileUrl = $("table[id*='table-pid'] .autor-name-row a").attr("href")
    const matchUidObj = uProfileUrl.match(/space\.php\?uid=(\d+)/)
    if (matchUidObj[1]) {
        thread.uid = matchUidObj[1]
    }
    const postTimeText = $("table[id*='table-pid'] .postinfo .post-date").text()
    const matchPostTimeObj = postTimeText.match(/發表於 (\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2})/)
    if (matchPostTimeObj[1]) {
        thread.post_time = matchPostTimeObj[1]
    }
    let existsFlag = false
    for (const existsThread of resultData.discuss_thread_list) {
        if (existsThread.tid == thread.tid) {
            existsFlag = true
        }
    }
    if (!existsFlag) {
        resultData.discuss_thread_list.push(thread)
    }
    const screenshotFile = path.join($g.taskPath, 'discuss_thread_001.jpg')
    if ($g.fs.exists(screenshotFile)) {
        const imageContent = $g.fs.readImage(screenshotFile)
        const imageBase64 = new Buffer.from(imageContent).toString('base64')
        resultData.discuss_thread_screenshot = `data:image/jpg;base64,${imageBase64}`
    }
    //thread posts
    if (!resultData.discuss_post_list) {
        resultData.discuss_post_list = []
    }
    const postsArea = $("table[id*='table-pid']")
    for (const postArea of postsArea) {
        const pid = $(postArea).attr('id').replace('table-pid', '')
        const userEle = $(postArea).find('.autor-name-row a')
        const userURL = $(userEle).attr('href')
        const post = {
            tid: thread.tid,
            pid: pid,
            uname: userEle.text(),
            uid: '',
            post_time: '',
            text: ''
        }
        const matchUidObj = userURL.match(/space\.php\?uid=(\d+)/)
        if (matchUidObj[1]) {
            post.uid = matchUidObj[1]
        }
        const postTimeText = $(postArea).find(".postinfo .post-date").text()
        const matchPostTimeObj = postTimeText.match(/發表於 (\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2})/)
        if (matchPostTimeObj[1]) {
            post.post_time = matchPostTimeObj[1]
        }
        post.text = $(postArea).find("div[id*='postmessage_']  span[id*='postorig_']").text()
        resultData.discuss_post_list.push(post)

        const screenshotFile = path.join($g.taskPath, 'discuss_post_001.jpg')
        if ($g.fs.exists(screenshotFile)) {
            const imageContent = $g.fs.readImage(screenshotFile)
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            resultData.discuss_post_screenshot = `data:image/jpg;base64,${imageBase64}`
        }
    }
}