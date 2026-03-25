const path = require('path')

exports.createWeibo = function(htmlStr, requestData){
    const key = 'weibo_create_post'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr).data
    resultData[key].push({
        user_id: data.user.id,
        mblogid: data.mblogid,
        created_at: data.created_at,
        text_raw: data.text_raw
    });
}

