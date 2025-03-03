const path = require('path')
const cheerio = require('cheerio')

exports.meweSendPost = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const newPost = data.post || ''
    const user = data.users[0] || ''
    if (!newPost || !user) {
        return
    }
    let post = {
        post_id: newPost.postItemId,
        uid: newPost.userId,
        post_time: newPost.createdAt,
        post_text: newPost.text,
        uname: user.name,
        uscreen_name: user.publicLinkId
    }
    resultData.mewe_create_post = post
    const screenshotFile = path.join($g.taskPath, 'mewe_post_001.jpg')
    if ($g.fs.exists(screenshotFile)) {
        const imageContent = $g.fs.readImage(screenshotFile)
        const imageBase64 = new Buffer.from(imageContent).toString('base64')
        resultData.mewe_post_screenshot = `data:image/jpg;base64,${imageBase64}`
    }
}