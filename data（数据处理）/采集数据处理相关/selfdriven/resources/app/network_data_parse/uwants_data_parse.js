const path = require('path')
const cheerio = require('cheerio')

exports.uwantsProfile = function (htmlStr, requestData) {
    const $ = cheerio.load(htmlStr)
    if (!resultData.uwants_profile_list) {
        resultData.uwants_profile_list = []
    }
    let profile = {
        uid: '',
        username: '',
        photo: '',
        position: '',
        threadCount: 0,
        followThreadCount: 0,
        followerCount: 0
    }
    profile.username = $("a.user_profile_name").text()
    const uProfileUrl = $("a.user_profile_name").attr("href")
    const matchUidObj = uProfileUrl.match(/\/(\d+)/)
    if (matchUidObj[1]) {
        profile.uid = matchUidObj[1]
    }
    const matchAvatarObj = htmlStr.match(/<div id="viewpro_header_avatar" class="user_profile_pic editable_avatar" style=".*?background\-image:url\('(.*?)'\)">/)
    if (matchAvatarObj[1]) {
        profile.photo = matchAvatarObj[1]
    }
    profile.position = $("div.user_profile_position").text()
    const matchThreadObj = htmlStr.match(/<li class="user_stat"><span>(\d*?)<\/span>\S*帖子/)
    if (matchThreadObj[1]) {
        profile.threadCount = matchThreadObj[1]
    }
    const matchFollowObj = htmlStr.match(/<li class="user_stat"><span>(\d*?)<\/span>\S*追帖/)
    if (matchFollowObj[1]) {
        profile.followThreadCount = matchFollowObj[1]
    }
    const matchFollowerObj = htmlStr.match(/<li class="user_stat"><span>(\d*?)<\/span>\S*粉絲/)
    if (matchFollowerObj[1]) {
        profile.followerCount = matchFollowerObj[1]
    }
    //$g.log.append('debug', JSON.stringify(profile))
    resultData.uwants_profile_list.push(profile)
}

exports.uwantsThread = function (htmlStr, requestData) {
    if (!resultData.uwants_thread_list) {
        resultData.uwants_thread_list = []
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
    thread.uname = $("table.threadpost[data-postcount='1'] cite a.userNameHover").text()
    const uProfileUrl = $("table.threadpost[data-postcount='1'] cite a.userNameHover").attr("href")
    const matchUidObj = uProfileUrl.match(/space\.php\?uid=(\d+)/)
    if (matchUidObj[1]) {
        thread.uid = matchUidObj[1]
    }
    const postTimeText = $("table.threadpost[data-postcount='1'] .postinfo").text()
    const matchPostTimeObj = postTimeText.match(/發表於 (\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2} [A-Z]{2})/)
    if (matchPostTimeObj[1]) {
        thread.post_time = matchPostTimeObj[1]
    }
    let existsFlag = false
    for (const existsThread of resultData.uwants_thread_list) {
        if (existsThread.tid == thread.tid) {
            existsFlag = true
        }
    }
    if (!existsFlag) {
        const screenshotFile = path.join($g.taskPath, 'uwants_thread_001.jpg')
        if ($g.fs.exists(screenshotFile)) {
            const imageContent = $g.fs.readImage(screenshotFile)
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            thread.screenshot = `data:image/jpg;base64,${imageBase64}`
        }
        resultData.uwants_thread_list.push(thread)
    }
    //thread posts
    if (!resultData.uwants_post_list) {
        resultData.uwants_post_list = []
    }
    const postsArea = $("table.threadpost")
    for (const postArea of postsArea) {
        const pid = $(postArea).attr('id').replace('pid', '')
        const userEle = $(postArea).find('.postauthor a.userNameHover')
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
        const postTimeText = $(postArea).find(".postinfo").text()
        const matchPostTimeObj = postTimeText.match(/發表於 (\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2} [A-Z]{2})/)
        if (matchPostTimeObj[1]) {
            post.post_time = matchPostTimeObj[1]
        }
        post.text = $(postArea).find("div[id*='postmessage_']  span[id*='postorig_']").text()
        resultData.uwants_post_list.push(post)

        const screenshotFile = path.join($g.taskPath, 'uwants_post_001.jpg')
        if ($g.fs.exists(screenshotFile)) {
            const imageContent = $g.fs.readImage(screenshotFile)
            const imageBase64 = new Buffer.from(imageContent).toString('base64')
            resultData.uwants_post_screenshot = `data:image/jpg;base64,${imageBase64}`
        }
    }
}