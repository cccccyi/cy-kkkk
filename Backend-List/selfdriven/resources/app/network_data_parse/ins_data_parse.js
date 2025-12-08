function processTimestampSeconds(time){
    if(String(time).length > 10 && String(time).length <= 13){
        time = Math.round(time/1000)
    }else if(String(time).length > 13){
        time = Math.round(time/1000000)
    }
    return time
}

exports.instagramDeail = function (htmlStr, requestData) {
    // 图像、帖子数量、粉丝数量、文字简介、贴文列表
    const node = $g.$json_from_string(htmlStr)
    const user = node.data?.user
    if (!user) {
        return
    }
    const data = node.data.user.edge_owner_to_timeline_media
    if (!resultData.instagram_user) {
        resultData.instagram_user = []
    }
    var lynx_url = ''
    var external_url = ''
    if (user.bio_links) {
        if (user.bio_links[0]) {
            var lynx_url = user.bio_links[0].lynx_url
            var external_url = user.bio_links[0].url
        }
    }
    const account = {
        'username': user.username,                                             //用户username
        'name': user.full_name,
        'person_url': "https://www.instagram.com/" + user.username,               //用户个人页面链接
        'user_id': user.id,
        'fbid': user.fbid,
        'id': user.id,                                                           //用户的pk_id
        // 'hashtag': user.biography_with_entities.entities[0].hashtag.full_name,
        'biography': user.biography,  //用户简介信息
        'edge_follow_count': user.edge_follow.count,   //关注
        'profile_pic_url_hd': user.profile_pic_url_hd,
        'profile_pic_url': user.profile_pic_url,
        'followed_count': user.edge_followed_by.count,  //粉丝数
        'posts_count': user.edge_owner_to_timeline_media.count,    //帖子数
        'external_url': external_url,    //相关链接
        'is_business_account': user.is_business_account,    //是否为商户（企业账号）
        'business_category_name': user.business_category_name,  //商业分类
        'is_verified': user.is_verified, // 是否为认证用户
        'is_private': user.is_private,   //是否为私密用户 
        'external_url_linkshimmed': lynx_url,                 //相关链接
        'edge_media_collections': user.edge_media_collections.count,
        'highlight_reel_count': user.highlight_reel_count,
        'blocked_by_viewer': user.blocked_by_viewer,   //
        'edge_saved_media_count': user.edge_saved_media.count,
    }
    instagramPostListDeail(data, account)
    resultData.instagram_user.push(account)
}

exports.instagramPostList = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr);
    if (node.data?.user?.edge_owner_to_timeline_media) {
        const edges = node.data.user.edge_owner_to_timeline_media
        // console.log(edges);
        instagramPostListDeail(edges)
    }
    if (node.data?.users?.edge_following_hashtag) {
        const edges = node.data.users.edge_following_hashtag.edges
        instagramUserHashtag(edges)
    }
    if (node.data?.user?.edge_following_hashtag) {
        const edges = node.data.user.edge_following_hashtag.edges
        instagramUserHashtag(edges)
    }
}
function instagramPostListDeail(data, account) {
    const edges = data.edges
    // console.log(edges);
    if (!resultData.instagram_list) {
        resultData.instagram_list = []
    }
    for (const item of edges) {
        const node = item.node
        let picture = []
        let videourl = []
        const owner = account || node.owner
        let is_video = false
        if (item.node.edge_sidecar_to_children?.edges) {
            const edge_sidecar_to_children = item.node.edge_sidecar_to_children.edges
            for (const edge_sidecar of edge_sidecar_to_children) {
                const media = edge_sidecar.node
                if (media.is_video) {
                    display_url = media.video_url
                    is_video = media.is_video
                    videourl.push(display_url)
                } else {
                    display_url = media.display_url
                }
                picture.push(display_url)
            }
        } else {
            is_video = node.is_video
            if (node.is_video) {
                display_url = node.video_url
            } else {
                display_url = node.display_url
            }
            picture.push(display_url)
        }
        let content = ''
        if (node.edge_media_to_caption?.edges[0]?.node?.text) {
            content = node.edge_media_to_caption.edges[0].node.text
        }
        let location = {}
        if (item.location) {

        }
        let list = {
            id: node.id,
            user_name: node.owner.username,
            massage_text: content,
            img_url: picture,
            is_video: is_video,
            user_id: node.owner.id,
            shortcode: node.shortcode,
            video_url: videourl,
            comment_count: node.edge_media_to_comment.count,
            like_count: node.edge_liked_by.count,
            display_resources: picture[0],
            created_at: processTimestampSeconds(node.taken_at_timestamp),
            location: location,
            lvideo_original: videourl,
            lpic_original: picture,
            owner: owner
        }
        resultData.instagram_list.push(list)
    }
}
exports.instagramMoveList = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr)
    if (!node.items) {
        return;
    }
    const edges = node.items
    
    if (!resultData.instagram_list) {
        resultData.instagram_list = []
    }
    const post = insPostDetail(edges)
    resultData.instagram_list = resultData.instagram_list.concat(post)
}
function insPostDetail(edges) {
    var post = []
    for (const item of edges) {
        let list = inspost(item)
        post.push(list)
    }
    return post;
}
exports.instagramPostDetail = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr)
    if (!node.items) {
        return;
    }
    const edges = node.items
    //  console.log(edges);
    //  return ;
    if (!resultData.instagram_post) {
        resultData.instagram_post = []
    }
    const post = insPostDetail(edges)
    resultData.instagram_post = post
}

function parsePostData(postData) {
    let params = {}
    const postArr = postData.split('&')
    for (const str of postArr) {
        const itemArr = str.split('=')
        params[itemArr[0]] = itemArr[1]
    }
    return params
}

exports.instagramFbCreate = function (htmlStr, requestData) {
    if (!resultData.instagram_fb_profile) {
        resultData.instagram_fb_profile = {}
    }
    const data = JSON.parse(htmlStr)
    const params = parsePostData(requestData.postData)
    if (data.error_type) {
        return
    }
    if (params.fb_access_token) {
        resultData.instagram_fb_profile.accessToken = params.fb_access_token
    }
    resultData.instagram_fb_profile.username = params.username
}

exports.instagramFbProfile = function (htmlStr, requestData) {
    if (!resultData.instagram_fb_profile) {
        resultData.instagram_fb_profile = {}
    }
    const params = parsePostData(requestData.postData)
    if (params.accessToken) {
        resultData.instagram_fb_profile.accessToken = params.accessToken
    }
}


exports.instagramSearch = function (htmlStr, requestData) {
    let data = JSON.parse(htmlStr)
    if(!data.users && data.data.xdt_api__v1__fbsearch__topsearch_connection){
        data = data.data.xdt_api__v1__fbsearch__topsearch_connection
    }
    if (!resultData.seach_user) {
        resultData.seach_user = []
    }
    if (!resultData.seach_hashtags) {
        resultData.seach_hashtags = []
    }
    if (!resultData.seach_places) {
        resultData.seach_places = []
    }
    if (data['users']) {
        const data_user = data['users']
        for (const u in data_user) {
            const userDeatil = data_user[u].user
            let users = {
                id: userDeatil.pk,
                user_name: userDeatil.username,
                full_name: userDeatil.full_name,
                profile_pic_url: userDeatil.profile_pic_url,
                social_context: userDeatil.social_context
            }
            resultData.seach_user.push(users)
        }
    }
    if (data['hashtags']) {
        const data_hashtags = data['hashtags']
        for (const h in data_hashtags) {
            const hashtag = data_hashtags[h].hashtag
            let hashtags = {
                id: hashtag.id,
                name: hashtag.name,
                media_count: hashtag.media_count,
                search_result_subtitle: hashtag.search_result_subtitle
            }
            resultData.seach_hashtags.push(hashtags)
        }
    }
    if (data['places']) {
        const data_places = data['places']
        for (const p in data_places) {
            const item = data_places[p].place
            let places = {
                id: item.location.pk,
                short_name: item.location.short_name,
                external_source: item.location.external_source,
                address: item.location.address,
                title: item.title,
                subtitle: item.subtitle,
                slug: item.slug
            }
            resultData.seach_places.push(places)
        }
    }
}


exports.instagramPostComment = function (htmlStr, requestData) {
    if (!resultData.instagram_post_comment) {
        resultData.instagram_post_comment = []
    }
    const node = $g.$json_from_string(htmlStr)
    const comments = node.comments

    for (const item of comments) {
        var owner = {
            id: item.user.pk_id,
            username: item.user.username,
            is_verified: item.user.is_verified,
            profile_pic_url: item.user.profile_pic_url,
        }

        let comment = {
            id: item.pk,
            text: item.text,
            created_at: processTimestampSeconds(item.created_at),
            owner: owner,
            // edge_liked_by: { count: item.edge_liked_by }
        }
        resultData.instagram_post_comment.push(comment)
    }
}


exports.instagramPostLike = function (htmlStr, requestData) {
    if (!resultData.instagram_post_like) {
        resultData.instagram_post_like = []
    }
    const node = $g.$json_from_string(htmlStr)
    const post_like_user = node.users
    for (const item of post_like_user) {
        let like = {
            id: item.pk,
            username: item.username,
            full_name: item.full_name,
            profile_pic_url: item.profile_pic_url,
            is_verified: item.is_verified
        }
        resultData.instagram_post_like.push(like)
    }
}

exports.instagramFollowers = function (htmlStr, requestData) {
    if (!resultData.instagram_followers) {
        resultData.instagram_followers = []
    }
    const node = $g.$json_from_string(htmlStr)
    const post_like_user = node.users
    for (const item of post_like_user) {
        let follower = {
            id: item.pk,
            username: item.username,
            full_name: item.full_name,
            profile_pic_url: item.profile_pic_url,
            is_verified: item.is_verified,
            is_private: item.is_private

        }
        resultData.instagram_followers.push(follower)
    }
}

exports.instagramFollowering = function (htmlStr, requestData) {
    if (!resultData.instagram_following) {
        resultData.instagram_following = []
    }
    const node = $g.$json_from_string(htmlStr)
    const post_like_user = node.users
    for (const item of post_like_user) {
        let following = {
            id: item.pk,
            username: item.username,
            full_name: item.full_name,
            profile_pic_url: item.profile_pic_url,
            is_verified: item.is_verified,
            is_private: item.is_private

        }
        resultData.instagram_following.push(following)
    }
}

function instagramUserHashtag(data) {
    if (!resultData.instagram_hashtag) {
        resultData.instagram_hashtag = []
    }
    for (const node of data) {
        const item = node.node
        let hashtag = {
            id: item.pk,
            is_following: item.is_following,
            media_count: item.media_count,
            profile_pic_url: item.profile_pic_url,
            name: item.name

        }
        resultData.instagram_hashtag.push(hashtag)
    }
}

exports.instagramTagsPost = function (htmlStr, requestData) {

    const node = $g.$json_from_string(htmlStr)
    if (node.data) {
        const data = node.data
        if (data.top) {
            var tagslist = data.top.sections
            instagramHashtag(tagslist)
        }
        if (data.recent) {
            var tagslist = data.top.sections
            instagramHashtag(tagslist)
        }
        if (data.recent) {
            var tagslist = data.top.sections
            instagramHashtag(tagslist)
        }
    }
    if (node.sections) {
        var tagslist = node.sections
        instagramHashtag(tagslist)
    }
}

function instagramHashtag(tagslist) {
    if (!resultData.instagram_tags_post) {
        resultData.instagram_tags_post = {
            tag: $g.crawlTaskParams?.insUsername,
            data: []
        }
    }
    for (var sections of tagslist) {
        let layout_content = sections.layout_content?.medias || []
        for (var medias of layout_content) {
            let item = medias.media
            let post = inspost(item)
            resultData.instagram_tags_post.data.push(post)
        }
    }
}

function inspost(item) {
    let picture = []
    let videourl = []
    let is_video = false
    if (item.carousel_media) {
        const edge_sidecar_to_children = item.carousel_media
        for (const edge_sidecar of edge_sidecar_to_children) {
            if (edge_sidecar.video_versions) {
                video_url = edge_sidecar.video_versions[0].url
                is_video = true
                videourl.push(video_url)
            } else {
                const media = edge_sidecar.image_versions2.candidates[1]
                display_url = media.url
                picture.push(display_url)
            }
        }
    } else {
        if (item.video_duration) {
            video_info = item.image_versions2.candidates[0] || {}
            if(video_info.url){
                is_video = true
                videourl.push(video_info.url)
            }
        } else {
            const media = item.image_versions2.candidates[1]
            display_url = media.url;//media.url
            picture.push(display_url)
        }
    }
    let content = ''
    if (item.caption?.text) {
        content = item.caption.text
    }
    let location = {}
    if (item.location) {
        location = {
            "id": item.location.pk ? item.location.pk : item.location.id,
            "has_public_page": "",
            "name": item.location.name,
            "has_public_page": "",
        }
    }
    const user_id = item.user.pk
    let owner = item.user
    if (!owner.id) {
        owner.id = user_id
    } 
    if (resultData.instagram_user) {
        for (const user of resultData.instagram_user) {
            if (user.id == user_id) {
                owner = user
                break
            }
        }
    }
    let post = {
        id: item.pk,
        user_name: item.user.username,
        massage_text: content,
        img_url: picture,
        is_video: is_video,
        user_id: user_id,
        shortcode: item.code,
        video_url: videourl,
        comment_count: item.comment_count,
        like_count: item.like_count,
        display_resources: picture[0],
        created_at: processTimestampSeconds(item.taken_at),
        location: location,
        lvideo_original: videourl,
        lpic_original: picture,
        owner: owner
    }
    return post;
}
