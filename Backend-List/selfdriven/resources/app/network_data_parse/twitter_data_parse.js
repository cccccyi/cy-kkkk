const urlMo = require("url");

function parsePostData(postData){
    let params = {}
    const postArr = postData.split('&')
    for (const str of postArr) {
        const itemArr = str.split('=')
        params[itemArr[0]] = itemArr[1]
    }
    return params
}

function parseUserInfo(result) {
    const id = result.rest_id
    const legacy = result.legacy
    const professional = result.professional || {}
    let pinnedTweetIds = []
    for (const idStr of legacy.pinned_tweet_ids_str) {
        pinnedTweetIds.push(parseInt(idStr))
    }
    //$g.log.append('debug', JSON.stringify(result))
    const info = {
        id: parseInt(id),
        id_str: id,
        name: legacy.name || result.core?.name,
        screen_name: legacy.screen_name || result.core.screen_name,
        location: legacy.location,
        description: legacy.description,
        url: legacy.url,
        entities: legacy.entities,
        protected: legacy.protected,
        followers_count: legacy.followers_count,
        fast_followers_count: legacy.fast_followers_count,
        normal_followers_count: legacy.normal_followers_count,
        friends_count: legacy.friends_count,
        listed_count: legacy.listed_count,
        created_at: legacy.created_at,
        utc_offset: null,
        time_zone: null,
        geo_enabled: false,
        verified: legacy.verified,
        statuses_count: legacy.statuses_count,
        media_count: legacy.media_count,
        lang: null,
        status: {},
        contributors_enabled: false,
        is_translator: null,
        is_translation_enabled: null,
        profile_background_color: '',
        profile_background_image_url: '',
        profile_background_image_url_https: '',
        profile_background_tile: false,
        profile_image_url: legacy.profile_image_url || result.avatar?.image_url,
        profile_image_url_https: legacy.profile_image_url_https || result.avatar?.image_url,
        profile_banner_url: legacy.profile_banner_url,
        profile_link_color: legacy.profile_link_color,
        profile_sidebar_border_color: legacy.profile_sidebar_border_color,
        profile_sidebar_fill_color: legacy.profile_sidebar_fill_color,
        profile_text_color: legacy.profile_text_color,
        profile_use_background_image: legacy.profile_use_background_image,
        has_extended_profile: legacy.has_extended_profile,
        default_profile: legacy.default_profile,
        default_profile_image: legacy.default_profile_image,
        pinned_tweet_ids: pinnedTweetIds,
        pinned_tweet_ids_str: legacy.pinned_tweet_ids_str,
        has_custom_timelines: legacy.has_custom_timelines,
        can_dm: result.dm_permissions?.can_dm ? 'y' : 'n',
        can_media_tag: legacy.can_media_tag,
        followed_by: legacy.followed_by,
        following: legacy.following,
        follow_request_sent: null,
        notifications: legacy.notifications,
        advertiser_account_type: null,
        advertiser_account_service_levels: null,
        analytics_type: null,
        business_profile_state: null,
        translator_type: legacy.translator_type,
        withheld_in_countries: legacy.withheld_in_countries,
        require_some_consent: null,
        birth: result.legacy_extended_profile?.birthdate?.year,
        like_count: legacy.favourites_count,
        category: '',
        policies: result.affiliates_highlighted_label?.label?.description || '',
        is_blue_verified: result.is_blue_verified,
        profile_image_shape: result.profile_image_shape,
        followed_by: result.relationship_perspectives?.followed_by,
        following: result.relationship_perspectives?.following,
        channel: 'user'
    }
    //$g.log.append('screen_name', info.screen_name)
    //$g.log.append('debug', JSON.stringify(result.relationship_perspectives))
    if (professional.category && professional.category[0]?.name) {
        info.category = professional.category[0].name
    }

    return info
    // 主账号与采集目标账号 - 关系
    const key = 'twitter_main_account_relationship'
    if (!resultData[key]) {
        resultData[key] = []
    }
    resultData[key].push({
        screen_name: legacy.screen_name || result.core.screen_name,
        followed_by: result.relationship_perspectives?.followed_by,
        following: result.relationship_perspectives?.following,
        blocked_by: result.relationship_perspectives?.blocked_by
    })

    return info
}

function parseTweetInfo(result) {
    const id = result.rest_id
    const legacy = result.legacy
    const userResult = result.core.user_results.result
    //$g.log.append('created_at', legacy.created_at)
    //$g.log.append('debug', JSON.stringify(result));
    // edit tweet
    if(result.edit_control?.edit_control_initial?.edit_tweet_ids){
        const key = 'twitter_edit_tweet_ids'
        if (!resultData[key]) {
            resultData[key] = []
        }
        //resultData[key] = resultData[key].concat(result.edit_control?.edit_control_initial?.edit_tweet_ids.slice(0, -1))
        //resultData[key] = [...new Set(resultData[key])]
    }
    const tweet = {
        created_at: legacy.created_at,
        id: parseInt(id),
        id_str: id,
        full_text: result.note_tweet?.note_tweet_results?.result?.text || legacy.full_text,
        truncated: false,
        display_text_range: legacy.display_text_range,
        entities: legacy.entities,
        source: legacy.source,
        in_reply_to_status_id: parseInt(legacy.in_reply_to_status_id_str),
        in_reply_to_status_id_str: legacy.in_reply_to_status_id_str,
        in_reply_to_user_id: parseInt(legacy.in_reply_to_user_id_str),
        in_reply_to_user_id_str: legacy.in_reply_to_user_id_str,
        in_reply_to_screen_name: legacy.in_reply_to_screen_name,
        user_id: parseInt(legacy.user_id_str),
        user_id_str: legacy.user_id_str,
        geo: {},
        coordinates: null,
        place: {},
        contributors: null,
        is_quote_status: legacy.is_quote_status,
        quoted_status_id: parseInt(legacy.quoted_status_id_str),
        quoted_status_id_str: legacy.quoted_status_id_str,
        retweeted_status_id_str: legacy.retweeted_status_id_str,
        quoted_status_permalink: legacy.quoted_status_permalink,
        retweet_count: legacy.retweet_count,
        favorite_count: legacy.favorite_count,
        reply_count: legacy.reply_count,
        conversation_id: parseInt(legacy.conversation_id_str),
        conversation_id_str: legacy.conversation_id_str,
        favorited: legacy.favorited,
        retweeted: legacy.retweeted,
        possibly_sensitive: legacy.possibly_sensitive,
        possibly_sensitive_editable: legacy.possibly_sensitive_editable,
        lang: legacy.lang,
        supplemental_language: null,
        views: result.views?.count,
        user: parseUserInfo(userResult)
    }

    const key1 = 'twitter_search_user'
    if (!resultData[key1]) {
        resultData[key1] = []
    }
    const user = parseUserInfo(userResult)
    let flag = true
    for(const item of resultData[key1]){
        if(item.screen_name == user.screen_name){
            flag = false            
        }
    }
    if(flag){
        resultData[key1].push(user)
    }

    return tweet
}

exports.twUserInfoParse = function(htmlStr, requestData) {
    // return
    const key = 'twitter_user'
    const data = $g.$json_from_string(htmlStr)
    const result = data.data.user?.result || {}
    if (result.legacy) {
        const info = parseUserInfo(result)
        if (!resultData[key]) {
            resultData[key] = []
        }
        resultData[key].push(info)
    } else {
        const url = decodeURIComponent(requestData.url)
        const parseUrl = urlMo.parse(url, true)
        const variables = JSON.parse(parseUrl.query.variables)
        const screenName = variables.screen_name
        if (data.data?.user?.result?.__typename == 'UserUnavailable' || htmlStr == '{"data":{}}'){
            console.log(screenName)
            if (!resultData[key]) {
                resultData[key] = []
            }
            resultData[key].push({
                screen_name: screenName,
                crawl_available: 'n'
            })
        }
    }
}

let countIndex = 0
exports.twTweetAndRepliesParse = function(htmlStr, requestData) {
    // return
    const key = 'twitter_tweet'
    let entries = []
    let tweets = []
    const data = $g.$json_from_string(htmlStr)
    let instructions = data.data?.user?.result?.timeline_v2?.timeline?.instructions || 
        data.data?.threaded_conversation_with_injections_v2?.instructions || 
        data.data?.list?.tweets_timeline?.timeline.instructions || 
        data.data?.home?.home_timeline_urt?.instructions || 
        data.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || 
        data.data?.user?.result?.timeline?.timeline?.instructions || []
    let tweetShowType = ''
    if (data.data?.home?.home_timeline_urt?.instructions){
        tweetShowType = data.data.home.home_timeline_urt.metadata?.scribeConfig?.page || ''
    }
    //$g.log.append('tweetShowType', tweetShowType);
    for (const item of instructions) {
        if (item.type == 'TimelineAddEntries') {
            entries.push(...item.entries)
        }
    }
    for (const entry of entries) {
        let items = []
        //$g.log.append('debug', JSON.stringify(entry))
        if (entry.content.items) {
            for (const item of entry.content.items) {
                if (['TimelineTweet'].indexOf(item.item.itemContent.itemType) > -1) {
                    items.push(item.item.itemContent.tweet_results.result)
                }
            }
        }
        if (entry.content.itemContent?.tweet_results) {
            items.push(entry.content.itemContent.tweet_results.result)
        }
        for (const result of items) {
            if(!result?.core){
                continue
            }
            let tweet = parseTweetInfo(result)
            tweet.channel = 'post'
            if (result.quoted_status_result?.result?.core) {
                const quotedTweet = parseTweetInfo(result.quoted_status_result.result)
                if (tweet.full_text) {
                    tweet.retweeted_status = quotedTweet
                } else {
                    tweet.quoted_status = quotedTweet
                }
            }
            //|quoted_status| json object | 不带文转推原贴信息 参考本表字段 | |
            //|retweeted_status| json object | 带文转推原贴信息 参考本表字段 | |
            //|reply_status| json object | 评论贴原贴信息 参考本表字段 | |
            //|likes_by_id| string | likes，用户点赞帖子专用字段，记录当前用户的id | |
            //$g.log.append('debug tweet', JSON.stringify(tweet))
            tweet.tweetShowType = tweetShowType
            if(!tweet.created_at){
                $g.log.append('debug', JSON.stringify(tweet))
            }
            tweets.push(tweet)
        }
    }
    if (!resultData[key]) {
        resultData[key] = []
    }
    countIndex++;
    console.log(countIndex);
    // if(countIndex <= 40 || countIndex>60){
    //     return;
    // }
    resultData[key].push(...tweets)

    // 通过关键词搜索账号列表
    const key1 = 'twitter_search_user'
    if (!resultData[key1]) {
        resultData[key1] = []
    }
    instructions = data.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || []
    for(const instruction of instructions){
        if(instruction && instruction.entries){       
            for (const entry of instruction.entries) {
                //$g.log.append('debug', JSON.stringify(entry))
                if(entry.content?.itemContent?.itemType == 'TimelineUser'){
                    const result = entry.content.itemContent.user_results.result
                    const user = parseUserInfo(result)
                    resultData[key1].push(user)
                }
            }
        }
    }
}


exports.twRetweetWithCommentParse = function(htmlStr, requestData) {
    const key = 'twitter_retweet_with_comments'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr)
    const tweets = data.globalObjects.tweets || {}
    const users = data.globalObjects.users || {}
    for (const tweetId in tweets) {
        let tweet = tweets[tweetId]
        const userId = tweet.user_id_str
        if (users[userId]) {
            tweet.user = users[userId]
        }
        resultData[key].push(tweet)
    }
}

let countFeIndex = 0
exports.twFollowersParse = function(htmlStr, requestData) {
    const key = 'twitter_followers'
    const url = decodeURIComponent(requestData.url)
    const parseUrl = urlMo.parse(url, true)
    const variables = JSON.parse(parseUrl.query.variables)
    const belongsUserId = variables.userId
    const followers = []
    const data = $g.$json_from_string(htmlStr)
    const instructions = data.data?.user?.result?.timeline?.timeline?.instructions || []
    let entries = []
    for (const item of instructions) {
        if (item.type == 'TimelineAddEntries') {
            entries = item.entries
        }
    }
    for (const item of entries) {
        if (item.content?.itemContent?.user_results?.result) {
            const result = item.content.itemContent.user_results.result
            if (result.legacy) {
                const user = parseUserInfo(result)
                user.belongs_user_id = belongsUserId
                followers.push(user)
            }
        }
    }
    countFeIndex++;
    console.log(countFeIndex);
    // if(countFeIndex <= 400 || countFeIndex>500){
    //     return;
    // }
    if (!resultData[key]) {
        resultData[key] = []
    }
    resultData[key].push(...followers)
}
let countFIndex = 0
exports.twFollowingParse = function(htmlStr, requestData) {
    const key = 'twitter_followings'
    const url = decodeURIComponent(requestData.url)
    const parseUrl = urlMo.parse(url, true)
    const variables = JSON.parse(parseUrl.query.variables)
    const belongsUserId = variables.userId
    const followings = []
    const data = $g.$json_from_string(htmlStr)
    const instructions = data.data?.user?.result?.timeline?.timeline?.instructions || []
    let entries = []
    for (const item of instructions) {
        if (item.type == 'TimelineAddEntries') {
            entries = item.entries
        }
    }
    for (const item of entries) {
        if (item.content?.itemContent?.user_results?.result) {
            const result = item.content.itemContent.user_results.result
            if (result.legacy) {
                const user = parseUserInfo(result)
                user.belongs_user_id = belongsUserId
                followings.push(user)
            }
        }
    }
    countFIndex++;
    console.log(countFIndex);
    // if(countFIndex <= 260 || countFIndex > 300){
    //     return;
    // }
    if (!resultData[key]) {
        resultData[key] = []
    }
    resultData[key].push(...followings)
}

//List 成员列表
exports.twListMembersParse = function(htmlStr, requestData){
    const key = 'twitter_search_user'
    const followings = []
    const data = $g.$json_from_string(htmlStr)
    const instructions = data.data.list.members_timeline.timeline.instructions
    let entries = []
    for (const item of instructions) {
        if (item.type == 'TimelineAddEntries') {
            entries = item.entries
        }
    }
    for (const item of entries) {
        if (item.content?.itemContent?.user_results?.result) {
            const result = item.content.itemContent.user_results.result
            if (result.legacy) {
                const user = parseUserInfo(result)
                followings.push(user)
            }
        }
    }
    if (!resultData[key]) {
        resultData[key] = []
    }
    resultData[key].push(...followings)
}
// List 关注者
exports.twListSubscribers = function(htmlStr, requestData){
    const key = 'twitter_search_user'
    const followings = []
    const data = $g.$json_from_string(htmlStr)
    const instructions = data.data.list.subscribers_timeline.timeline.instructions
    let entries = []
    for (const item of instructions) {
        if (item.type == 'TimelineAddEntries') {
            entries = item.entries
        }
    }
    for (const item of entries) {
        if (item.content?.itemContent?.user_results?.result) {
            const result = item.content.itemContent.user_results.result
            if (result.legacy) {
                const user = parseUserInfo(result)
                followings.push(user)
            }
        }
    }
    if (!resultData[key]) {
        resultData[key] = []
    }
    resultData[key].push(...followings)
}

// 社群列表
exports.twCommunitiesSearchQuery = function(htmlStr, requestData){
    const key = 'twitter_community_list'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr)
    const results = data.data?.communities_search_slice?.items_results || []
    for (const item of results) {
        if (item.result) {
            const info = item.result
            resultData[key].push({
                rest_id: info.rest_id,
                name: info.name,
                member_count: info.member_count,
                topic_name: info.primary_community_topic?.topic_name
            })
        }
    }
}

// 私信列表
exports.dmMsgList = function(htmlStr, requestData){
    // return
    const key = 'tw_dm_msgs'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr)
    const entries = data.inbox_initial_state?.entries || data.inbox_timeline?.entries || []
    for(const item of entries){
        const msg = item.message?.message_data
        if(!msg){
            continue
        }
        if(msg.recipient_id !='1624286098737483778'){
            if(!resultData[key].includes(msg.recipient_id)){
                resultData[key].push(msg.recipient_id)
            }
        }else if(msg.sender_id !='1624286098737483778'){
            if(!resultData[key].includes(msg.sender_id)){
                resultData[key].push(msg.sender_id)
            }
        }
    }
}

// 社群成员列表
exports.membersSliceTimeline_Query = function(htmlStr, requestData){
    const key = 'twitter_community_members'
    const url = decodeURIComponent(requestData.url)
    const parseUrl = urlMo.parse(url, true)
    const variables = JSON.parse(parseUrl.query.variables)
    const communityId = variables.communityId
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr)
    const results = data.data.communityResults.result.members_slice.items_results
    for (const item of results) {
        if (item.result) {
            resultData[key].push({
                community_id: communityId, 
                name: item.result.core.name,
                screen_name: item.result.core.screen_name,
                is_blue_verified: item.result.is_blue_verified
            })
        }
    }
}

exports.twCreateTweet = function(htmlStr, requestData) {
    const key = 'tw_create_tweet'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const data = $g.$json_from_string(htmlStr)
    if (data.data?.create_tweet?.tweet_results?.result) {
        const result = data.data.create_tweet.tweet_results.result
        const tweet = parseTweetInfo(result)
        resultData[key].push(tweet)
    }
    if(data.data?.notetweet_create?.tweet_results?.result){
        const result = data.data.notetweet_create.tweet_results.result
        const tweet = parseTweetInfo(result)
        resultData[key].push(tweet)
    }
}

exports.twTweetPraise = function(htmlStr, requestData) {
    const key = 'tw_tweet_praise'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const url = decodeURI(requestData.url)
    let matchArr = url.match(new RegExp(`"tweetId"%3A"(.*?)"`))
    const tweetId = matchArr[1]
    const data = $g.$json_from_string(htmlStr)
    const entries = data.data.favoriters_timeline?.timeline?.instructions[0]?.entries || []
    for (const item of entries) {
        const result = item.content.itemContent?.user_results?.result
        if (result && result.legacy) {
            const user = parseUserInfo(result)
            user.tweet_id = tweetId
            resultData[key].push(user)
        }
    }
}

exports.twTweetRetweeters = function(htmlStr, requestData) {
    const key = 'tw_tweet_retweet'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const url = decodeURI(requestData.url)
    let matchArr = url.match(new RegExp(`"tweetId"%3A"(.*?)"`))
    const tweetId = matchArr[1]
    const data = $g.$json_from_string(htmlStr)
    const entries = data.data.retweeters_timeline?.timeline?.instructions[0]?.entries || []
    for (const item of entries) {
        const result = item.content.itemContent?.user_results?.result
        if (result && result.legacy) {
            const user = parseUserInfo(result)
            user.tweet_id = tweetId
            resultData[key].push(user)
        }
    }
}

exports.twListAddMember = function(htmlStr, requestData) {
    const key = 'twitter_list_add_member'
    if (!resultData[key]) {
        resultData[key] = []
    }
    const params = JSON.parse(requestData.postData)
    const variables = params.variables
    if (variables.listId && variables.userId) {
        resultData[key].push(variables)
    }
}

exports.xDocumentDataParse = function(htmlStr, requestData) {
    const { url } = requestData
    //$g.log.append('url', url)
    if(url.match(/account\/access/)){
        resultData['twitter_locked'] = [$g.twitterScreenName]
    }
}
