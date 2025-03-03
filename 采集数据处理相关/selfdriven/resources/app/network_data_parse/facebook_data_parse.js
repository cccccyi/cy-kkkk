const getUniqidKey = function () {
    return new Date().getTime() + '_' + $g.math.random(10000)
}

const timestamp2bjtz = function (timestamp) {
    let offset = new Date().getTimezoneOffset() * 60;
    return timestamp + offset + 8*3600;
}

const parsefbAccountInfo = function (htmlStr, requestData) {
    const accountPattern = /{"ACCOUNT_ID".*?}/
    const accountMatchObj = htmlStr.match(accountPattern)
    if (accountMatchObj && accountMatchObj[0]) {
        const accountInfo = $g.$json_from_string(accountMatchObj[0])
        if (accountInfo.ACCOUNT_ID && accountInfo.NAME) {
            resultData.guid_account_info = {
                account_fid: accountInfo.ACCOUNT_ID,
                name: accountInfo.NAME
            }
        }
    }
    const pattern = /"rootView":({.*?}})/
    matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const rootView = $g.$json_from_string(matchObj[1])
    if (rootView && rootView['props']) {
        rootProps = rootView['props']
        info = null
        fid = null
        if (rootProps.pageID) {
            fid = rootProps.pageID
            info = parseFbPageInfo(htmlStr, rootProps.pageID)
        } else if (rootProps.userID) {
            fid = rootProps.userID
            info = parseFbUserInfo(htmlStr, rootProps.userID)
        } else if (rootProps.groupID) {
            fid = rootProps.groupID
            info = parseFbGroupInfo(htmlStr, rootProps.groupID)
        }
        const key = 'account_' + fid
        if (info && JSON.stringify(info) != '{}' && !resultData[key]) {
            resultData[key] = info
        } else if (rootProps['title']) {
            const title = rootProps['title']
            $g.log.append('rootview title', title)
            if (title.indexOf("isn't available right now") > -1) {
                const key = 'not_available_' + getUniqidKey()
                resultData[key] = { url: requestData['url'] }
            } else if (title.indexOf("Unknown error") > -1) {
                if ($g.crawlGroupPermeationType == 'fb_post_single'){
                    const key = 'post_not_available_' + getUniqidKey()
                    resultData[key] = { url: $g.crawlTaskParams.postURL }
                }
            }
        }
    }
}

const parseFbPageInfo = function (htmlStr, fid) {
    let pageInfo = {}
    const patternArr = [
        /"adp_CometSinglePageRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/,
        /"adp_PagesCometUnownedSinglePageRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/,
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            let info = $g.$json_from_string(matchObj[1])
            info = info.page
            //$g.log.append('debug', JSON.stringify(info))
            if (info && info.id && info.id == fid) {
                pageInfo = {
                    identity: fid,
                    page_type: 'Page',
                    home_url: info.url,
                    account: info.name,
                    nick: info.username,
                    ui_image_url: info.profile_picture?.uri,
                    category: info.category_name,
                    verification_status: info.verification_status,
                    cover_image_url: info.comet_page_cover_renderer?.content[0]?.photo?.image?.uri,
                    cover_image_id: info.comet_page_cover_renderer?.content[0]?.photo?.id,
                    cover_video_url: info.comet_page_cover_renderer?.content[0]?.video?.playable_url_quality_hd,
                    cover_video_id: info.comet_page_cover_renderer?.content[0]?.video?.id,
                }
                break
            }
        }
    }
    //brand fid
    const brandPattern = /"brand_redir":"(.*?)",/
    const brandMatchObj = htmlStr.match(brandPattern)
    if (brandMatchObj && brandMatchObj[1]) {
        const brandFid = brandMatchObj[1]
        pageInfo.brand_fid = brandFid
    }

    let cardInfos = []
    const patternCardsArr = [
        `"result":{"data":{"page":({"comet_page_cards".*?})},"extensions":`,
        `"result":{"data":{"page":({"comet_page_cards".*?})},"errors":`
    ]
    for (const patternStr of patternCardsArr) {
        let matchArr = htmlStr.match(new RegExp(patternStr, 'g'))
        if (JSON.stringify(matchArr) == '{}' || !matchArr) {
            matchArr = []
        }
        for (const matchStr of matchArr) {
            const matchObj = matchStr.match(new RegExp(patternStr))
            if (matchObj && matchObj[1]) {
                const info = $g.$json_from_string(matchObj[1])
                cardInfos.push(info)
            }
        }
    }
    for (const info of cardInfos) {
        //$g.log.append('debug', JSON.stringify(info))
        if (info && info.comet_page_cards) {
            for (const pageCard of info.comet_page_cards) {
                if (pageCard.__typename === 'CometPageAboutCardWithoutMapRenderer' || pageCard.__typename === 'CometPageAboutCardWithMapRenderer') {
                    if (pageCard.page) {
                        if (pageCard.page.page_likers) {
                            pageInfo.likes_count = pageCard.page.page_likers.global_likers_count
                        }
                        if (pageCard.page.follower_count) {
                            pageInfo.followers_count = pageCard.page.follower_count
                        }
                        if (pageCard.page.page_about_fields) {
                            pageInfo.about = pageCard.page.page_about_fields.blurb
                            pageInfo.email = pageCard.page.page_about_fields.email?.text
                            pageInfo.website = pageCard.page.page_about_fields.website
                            pageInfo.description = pageCard.page.page_about_fields.description?.text || ''
                        }
                    }
                }
                if (pageCard.__typename == 'CometPagePageTransparencyCardRenderer') {
                    if (pageCard.page_creation_date) {
                        const createTimeArr = pageCard.page_creation_date.text.split('- ')
                        pageInfo.create_time = createTimeArr[1]
                    }
                }
            }
        }
    }
    return pageInfo
}

const parseFbUserInfo = function (htmlStr, fid) {
    let userInfo = {}
    const patternArr = [
        /"result":{"data":{"user":({"__isProfile".*?}),"viewer":{"is_wem_private_sharing_enabled"/,
        /,"user":({"__isProfile".*?}),"viewer":{"is_wem_private_sharing_enabled"/
    ]
    for (let pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const info = $g.$json_from_string(matchObj[1])
            // $g.log.append('debug', JSON.stringify(info))
            if (info && info.id && info.id === fid) {
                const imageURL = info.profilePicLarge?.uri || info.profilePicMedium?.uri || info.profilePicSmall?.uri || info.profile_picture_for_sticky_bar?.uri || ''
                userInfo = {
                    identity: fid,
                    page_type: 'User',
                    home_url: info.url,
                    account: info.name,
                    nick: info.alternate_name,
                    ui_image_url: imageURL,
                    ui_image_id: info.profile_photo?.id,
                    gender: info.gender,
                    cover_image_url: info.cover_photo?.photo.image.uri,
                    cover_image_id: info.cover_photo?.photo.id,
                    verification_status: info.is_verified ? "BLUE_VERIFIED" : "NOT_VERIFIED"
                }
                const profileSocials = info.profile_social_context?.content || []
                for (let node of profileSocials) {
                    const text = node.text?.text || ''
                    if (text.indexOf('riends') != -1) {
                        const friendCount = text.replace(' Friends', '').replace(' friends', '')
                        userInfo.friends = $g.createNumber(friendCount)
                    } else if (text.indexOf('ollowing') != -1) {
                        const followingCount = text.replace(' Following', '').replace(' following', '')
                        userInfo.following_count = $g.createNumber(followingCount)
                    } else if (text.indexOf('ollowers') != -1) {
                        const followersCount = text.replace(' Followers', '').replace(' followers', '')
                        userInfo.followers_count = $g.createNumber(followersCount)
                    } else if (text.indexOf('ikes') != -1) {
                        const likesCount = text.replace(' Likes', '').replace(' likes', '')
                        userInfo.likes_count = $g.createNumber(likesCount)
                    }
                }
                if (info.delegate_page?.id) {
                    userInfo.origin_fid = info.delegate_page.id
                }
            }
        }
    }
    
    const patternIntroArr = [
        /"adp_ProfileCometTimelineListViewRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":{"user":(.*?"top_of_mall_banner":null})/,
        /"adp_ProfileCometTimelineListViewRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":{"user":(.*?}),"ix_account_status"/
    ]
    for (let pattern of patternIntroArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = JSON.parse(matchObj[1])
            //$g.log.append('debug', JSON.stringify(data))
            const nodeIntro = data.profile_tile_sections?.edges[0]?.node
            if (nodeIntro && nodeIntro.profile_tile_section_type == 'INTRO') {
                const nodes = nodeIntro.profile_tile_views.nodes
                for (const node of nodes) {
                    if (!node.view_style_renderer) {
                        continue
                    }
                    const typename = node.view_style_renderer.__typename
                    if (typename == 'ProfileTileViewIntroBioRenderer') {
                        userInfo.bio = node.view_style_renderer.view.profile_tile_items.nodes[0].node.profile_status_text.text
                    } else if (typename == 'ProfileTileViewContextListRenderer') {
                        const nodesProfile = node.view_style_renderer.view.profile_tile_items.nodes
                        for (const item of nodesProfile) {
                            const itemProfile = item.node.timeline_context_item
                            const itemType = itemProfile.timeline_context_list_item_type
                            if (itemType == 'INTRO_CARD_FOLLOWERS') {
                                let followerCountStr = itemProfile.renderer.context_item.title.text
                                followerCountStr = followerCountStr.replace('Followed by ', '').replace(' people', '').replace(' person', '').replace(',', '')
                                userInfo.followers_count = followerCountStr
                            }
                        }
                    } else if (typename == 'ProfileTileViewHobbiesRenderer') {
                        const edgesHobby = node.view_style_renderer.view.profile_tile_items.edges
                        for (const nodeHobby of edgesHobby) {
                            const hobby = nodeHobby.node.node
                            if (!userInfo.hobby) {
                                userInfo.hobby = []
                            }
                            const itemHobby = {
                                id: hobby.id,
                                emoji: hobby.hobby_emoji,
                                name: hobby.hobby_name.text
                            }
                            userInfo.hobby.push(itemHobby)
                        }
                    }
                }
            }
        }
    }

    return userInfo
}

const parseFbGroupInfo = function (htmlStr, fid) {
    let groupInfo = {}
    const patternArr = [
        /"adp_CometGroupRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":(.*?}),"extensions"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            let info = $g.$json_from_string(matchObj[1])
            if (info.group) {
                info = info.group
            }
            if (info.profile_header_renderer) {
                info = info.profile_header_renderer.group
                if(info.featurable_title.text){
                    info.name = info.featurable_title.text
                }
            }
            if (!info || !info.name) {
                continue
            }
            if (info.id && info.id === fid) {
                memberCount = 0
                memberCountStr = info.group_member_profiles?.formatted_count_text
                if (!memberCountStr) {
                    memberCountStr = info.forum_member_profiles?.formatted_count_text
                }
                if (memberCountStr) {
                    [' members', ' member', ','].forEach(needle => memberCountStr = memberCountStr.replaceAll(needle, ''))
                    memberCount = $g.createNumber(memberCountStr)
                }
                let imageUrl = ''
                let imageFid = ''
                let privacy = ''
                // $g.log.append('debug', JSON.stringify(info))
                if (info.cover_renderer?.cover_photo_content?.photo?.image?.uri) {
                    imageUrl = info.cover_renderer.cover_photo_content.photo.image.uri
                    imageFid = info.cover_renderer.cover_photo_content.photo.id
                } else if (info.profile_picture?.uri) {
                    imageUrl = info.profile_picture.uri
                } else if (info.profile_picture_for_sticky_bar?.uri) {
                    imageUrl = info.profile_picture_for_sticky_bar.uri
                }
                if (info.privacy_info?.title?.text) {
                    privacy = info.privacy_info.title.text.replaceAll(' group', '')
                }
                groupInfo = {
                    identity: fid,
                    page_type: 'Group',
                    home_url: info.url,
                    account: info.name,
                    ui_image_url: imageUrl,
                    ui_image_id: imageFid,
                    followers_count: 0,
                    privacy: privacy,
                    member_count: memberCount,
                    about: '',
                    group_type: '',
                    viewer_join_state: info.viewer_join_state
                }
                break
            }
        }
    }

    patternArrDetail = [
        /"group":({"group_locations".*?}),"__module_operation/,
        /"group":({"if_viewer_can_see_related_groups".*?})},"extensions"/,
        /"group":({"if_viewer_can_see_content".*?})},"extensions"/
    ]
    for (const pattern of patternArrDetail) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const info = $g.$json_from_string(matchObj[1])
            //$g.log.append('debug group', JSON.stringify(info))
            if (info) {
                const aboutInfos = fbGroupInfoParse(info)
                Object.assign(groupInfo, aboutInfos)
                break
            }
        }
    }
    return groupInfo
}

const parseFbPostList = function (htmlStr) {
    let postList = []
    let edges = []
    const patternResultArr = [
        /"adp_ProfileCometTimelineFeedQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"user".*?}),"extensions"/
    ]
    for (const pattern of patternResultArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (data && data.user.timeline_list_feed_units?.edges) {
                edges = data.user.timeline_list_feed_units.edges
                break
            }
        }
    }
    const patternArr = [
        /"timeline_feed_units":({"edges".*?}})}},"extensions"/,
        /"timeline_list_feed_units":({"edges".*?})}},"extensions"/,
        /"group_feed":({"edges":.*?}),"group_address"/,
        /"data":{"group":(.*?)},"group_locations"/,
        /"data":{"group":(.*?)},"extensions"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (data && data.edges) {
                edges = data.edges
                break
            }
        }
    }
    const storyPatternArr = [
        /"data":({"node":{"__typename":"Story".*?}),"extensions"/
    ]
    for (const pattern of storyPatternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (data) {
                edges.push(data)
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node.node)
        if (post) {
            postList.push(post)
        }
    }
    if (postList.length > 0) {
        const fid = postList[0].group_fid || postList[0].user_iid
        const key = 'post_' + fid
        if (!resultData[key]){
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

const parseFbGroupUserPostList = function (htmlStr, url) {
    //group join 
    if (!resultData.group_join_detect) {
        resultData.group_join_detect = []
    }
    const patternJoin = /"adp_ProfileCometContextualProfileRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":(.*?),"extensions"/
    const matchObjJoin = htmlStr.match(patternJoin)
    if (matchObjJoin && matchObjJoin[1]) {
        $g.log.append('parseFbGroupJoinDetect', 'match ...')
        const data = $g.$json_from_string(matchObjJoin[1])
        const groupFid = data.group.id
        const accountFid = data.contextual_profile_view.profile.id
        const text = data.contextual_profile_view.profile.profile_intro_card.context_items.nodes[0].plaintext_title.text
        $g.log.append('join', text)
        let isPermeation = ''
        if(text.match(/[Mm]ember of (.*?) since /)){
            isPermeation = 'y'
        }else if(text.match(/[Ff]ollowing (.*?) since /)){
            isPermeation = 'y'
        }else if(text.match(/[Pp]articipant in /)){
            isPermeation = 'y'
        }else if(text.match(/(.*?) is not a member of /)){
            isPermeation = 'n'
        }else if(text.match(/[Ff]ormer member of (.*?)/)){
            isPermeation = 'n'
        }
        if(isPermeation != ''){
            resultData.group_join_detect.push({
                group_fid: groupFid,
                account_fid: accountFid,
                is_permetion: isPermeation
            })
        }
    } else {
        const pattern = /available right now/i
        const matchAvailable = pattern.test(htmlStr)
        if (matchAvailable) {
            $g.log.append('debug', 'not available ')
            const fidPattern = /groups\/(\d+)\/user\/(\d+)/
            const fidMatch = url.match(fidPattern)
            if (fidMatch && fidMatch[1] && fidMatch[2]) {
                resultData.group_join_detect.push({
                    group_fid: fidMatch[1],
                    account_fid: fidMatch[2],
                    is_permetion: 'n'
                })
            }
        }
    }
    //group post 
    const patternArr = [
        /"group_member_feed":({"edges":.*?}),"if_viewer_can_see_admin_insights_on_member_profile"/
    ]
    let groupUserPostList = []
    let edges = []
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (data && data.edges) {
                edges = data.edges
                break
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node.node)
        if (post) {
            groupUserPostList.push(post)
        }
    }
    if (!resultData.group_user_posts) {
        resultData.group_user_posts = []
    }
    if (groupUserPostList.length > 0) {
        resultData.group_user_posts = groupUserPostList
    }
}

const parseFbGroupSearchPostList = function (htmlStr) {
    let postList = []
    const pattern = /"adp_SearchCometResultsInitialResultsQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"serpResponse".*?"extra_context":null})}/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        $g.log.append('parseFbGroupSearchPostList', 'match ...')
        const data = $g.$json_from_string(matchObj[1])
        const edges = data.result.data.serpResponse.results.edges
        for (const node of edges) {
            if (node.relay_rendering_strategy?.view_model?.click_model?.story?.comet_sections) {
                const post = parseFbPostInfo(node.relay_rendering_strategy.view_model.click_model.story)
                if (post) {
                    postList.push(post)
                }
            }
        }
    }
    if (postList.length > 0) {
        const key = 'search_post_list'
        if (!resultData[key]) {
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

const parseFbSinglePost = function (htmlStr, requestData) {
    let matchFlag = false
    const patternArr = [
        /"adp_CometSinglePostContentQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"node".*?}),"extensions"/,
        /"adp_CometGroupPermalinkRootFeedQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"group".*?}),"extensions"/,
        /"adp_CometGroupPermalinkRootContentFeedQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"group".*?}),"extensions"/,
        /"adp_CometGroupRootQueryRelayPreloader__[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"group".*?}),"extensions"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            $g.log.append('parseFbSinglePost', 'match ...')
            const data = $g.$json_from_string(matchObj[1])
            const node = data.node
            const post = parseFbPostInfo(node)
            if (post) {
                post.origin_url = requestData['url']
                const key = 'single_post_' + getUniqidKey()
                resultData[key] = [post]
                matchFlag = true
                break;
            }
        }
    }
    if (requestData['url'].indexOf('videos') > -1) {
        const post = parseFbVideoPostInfo(htmlStr)
        if (post) {
            post.origin_url = requestData['url']
            const key = 'single_post_' + getUniqidKey()
            resultData[key] = [post]
        }
    }
    //$g.log.append('debug request', JSON.stringify(requestData))
    if (matchFlag == false) {
        const pattern = /available right now/i
        const postMatchAvailable = pattern.test(htmlStr)
        if (postMatchAvailable) {
            const key = 'post_not_available_' + getUniqidKey()
            resultData[key] = { url: requestData['url'] }
        }
    }
}

const parsePostFeedbackInfo = function (feedback) {
    let post = {}
    //$g.log.append('debug', JSON.stringify(feedback))
    post.total_action_count = feedback.reactors?.count || 0
    if (feedback.reaction_count) {
        post.total_action_count = feedback.reaction_count.count
    }
    post.forward_count = feedback.share_count?.count || 0
    let replyCount = 0
    if (feedback.comments_count_summary_renderer) {
        const commentFeedback = feedback.comments_count_summary_renderer.feedback
        replyCount = commentFeedback.total_comment_count || commentFeedback.comment_count?.total_count || 0
    } else if (feedback.comment_count) {
        replyCount = feedback.comment_count.total_count
    }
    post.reply_count = replyCount

    let topReactionsEdges = []
    if (feedback.top_reactions?.edges) {
        topReactionsEdges = feedback.top_reactions.edges
    } else if (feedback.cannot_see_top_custom_reactions?.top_reactions?.edges) {
        topReactionsEdges = feedback.cannot_see_top_custom_reactions.top_reactions.edges
    }
    for (const reaction of topReactionsEdges) {
        const reactionType = reaction.node.reaction_type || reaction.node.localized_name
        switch (reactionType) {
            case 'LIKE':
            case 'Like':
                post.praise_count = reaction.reaction_count
                break;
            case 'LOVE':
            case 'Love':
                post.love_count = reaction.reaction_count
                break;
            case 'HAHA':
            case 'Haha':
                post.laugh_count = reaction.reaction_count
                break;
            case 'WOW':
            case 'Wow':
                post.wow_count = reaction.reaction_count
                break;
            case 'SORRY':
            case 'Sad':
                post.sad_count = reaction.reaction_count
                break;
            case 'ANGER':
            case 'Angry':
                post.angry_count = reaction.reaction_count
                break;
            case 'SUPPORT':
            case 'Care':
                post.care_count = reaction.reaction_count
                break;
        }
    }
    return post
}


const parseFbSearchPost = function (htmlStr) {
    const patternArr = [
        /"data":{"serpResponse":(.*?)},"extensions"/
    ]
    let edges = ''
    let postList = []
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            edges = data.results.edges
        }
    }
    if (edges) {
        for (const edge of edges) {
            const node = edge.relay_rendering_strategy.view_model
            const role = edge.node.role
            if (role == 'TOP_PUBLIC_POSTS') {
                const post = parseFbSearchPostInfo(node)
                if (post) {
                    postList.push(post)
                }
            }

        }
        if (postList.length > 0) {
            const key = 'search_post_' + getUniqidKey()
            resultData[key] = postList
        }
    }
}

const searchFbProfileInfo = function (node) {
    const edges_profile = node.profile
    let profile = {
        iid: edges_profile.id,
        name: edges_profile.name,
        url: edges_profile.url,
        __typename: edges_profile.__typename,
        profile_picture: edges_profile.profile_picture?.uri
    }
    if (edges_profile.__typename == 'Group') {
        if(node.meta_snippet_configs){
            const infoStr = node.meta_snippet_configs[0].text_with_entities.text
            const pattern = /(.*?) group · (.*?) member/
            const matchObj = infoStr.match(pattern)
            if(matchObj){
                if(matchObj[1]){
                    profile.privacy = matchObj[1]
                }
                if(matchObj[2]){
                    profile.member_count = $g.createNumber(matchObj[2])
                }
            }
        }else if(node.primary_snippet_text_with_entities){
            const infoStr = node.primary_snippet_text_with_entities.text
            const pattern = /(.*?) group · (.*?) member/
            let matchObj = infoStr.match(pattern)
            if(!matchObj){
                const pattern2 = /(.*?) · (.*?) member/
                matchObj = infoStr.match(pattern2)
            }
            if(matchObj){
                if(matchObj[1]){
                    profile.privacy = matchObj[1]
                }
                if(matchObj[2]){
                    profile.member_count = $g.createNumber(matchObj[2])
                }
            }
        }
        
    }
    return profile;
}


const parseFbSearchPostInfo = function (node) {
    if (!node.header_model) {
        return;
    }
    const header_model = node.header_model.author_model
    const permalink = node.click_model.permalink
    const footer_model = node.footer_model.feedback
    let page_type = ''
    let image = ''
    let image_iid = ''
    let media_type = ''
    if (node.header_model?.entity_snippet_config?.text_with_entities?.text) {
        page_type = node.header_model.entity_snippet_config.text_with_entities.text
    }
    if (node.media_model_for_content?.attachment_media) {
        const media_model_for_content = node.media_model_for_content.attachment_media
        if (media_model_for_content.length > 0) {
            const attachment_media = media_model_for_content[0]
            image = attachment_media.image.uri
            image_iid = attachment_media.id
            media_type = attachment_media.__typename
        }

    }
    const post = {
        'url': permalink,
        'user_name': header_model.author.name,
        'user_iid': header_model.id,
        'content': node.content_model.title_text,
        'content': node.content_model.title_text,
        'comment_count': footer_model.comment_count.total_count,
        'share_count': footer_model.share_count.count,
        'reaction_count': footer_model.reaction_count.count,
        'type': page_type,
        'post_time': node.header_model.timestamp,
        'image': image,
        'image_iid': image_iid,
        'media_type': media_type,
        'target_group_iid': '',
        'target_group_name': '',
        'target_group_url': '',
        'praise_count': 0,
        'love_count': 0,
        'laugh_count': 0,
        'wow_count': 0,
        'sad_count': 0,
        'angry_count': 0,

    }
    if (header_model.target) {
        const target = header_model.target
        post.target_group_iid = target.id
        post.target_group_name = target.name
        post.target_group_url = target.url
    }
    if (footer_model.cannot_see_top_custom_reactions?.top_reactions?.edges) {
        const topReactionsEdges = footer_model.cannot_see_top_custom_reactions.top_reactions.edges
        for (const reaction of topReactionsEdges) {
            switch (reaction.node.reaction_type) {
                case 'LIKE':
                    post.praise_count = reaction.reaction_count
                    break;
                case 'LOVE':
                    post.love_count = reaction.reaction_count
                    break;
                case 'HAHA':
                    post.laugh_count = reaction.reaction_count
                    break;
                case 'WOW':
                    post.wow_count = reaction.reaction_count
                    break;
                case 'SORRY':
                    post.sad_count = reaction.reaction_count
                    break;
                case 'ANGER':
                    post.angry_count = reaction.reaction_count
                    break;
            }
        }
    }
    return post;
}

const parseFbPostInfo = function (node) {
    //$g.log.append('debug', JSON.stringify(node))
    let postTimestamp = 0
    let postUrl = ''
    let content = ''
    let tagStr = ''

    if (!node?.comet_sections) {
        return false
    }
    const cometSections = node.comet_sections
    const metadatas = cometSections.context_layout?.story?.comet_sections?.metadata || []
    for (const meta of metadatas) {
        if (meta.story?.creation_time) {
            postTimestamp = meta.story.creation_time
            postUrl = meta.story.url
            break
        }
    }

    if (cometSections?.content?.story?.comet_sections?.message?.story?.message) {
        const message = cometSections.content.story.comet_sections.message.story.message
        content = message.text
        let tagArr = []
        for (const tag of message.ranges) {
            tagArr.push({
                id: tag.entity.id,
                name: '',
                url: tag.entity.url,
                type: tag.entity.__typename,
                offset: tag.offset,
                length: tag.length
            })
        }
        if (tagArr.length > 0) {
            tagStr = JSON.stringify(tagArr)
        }
    }
    // $g.log.append('cometSections', JSON.stringify(cometSections))
    let actor = {}
    if (cometSections.context_layout?.story?.comet_sections?.actor_photo?.story?.actors) {
        actor = cometSections.context_layout.story.comet_sections.actor_photo.story.actors[0]
    } else if (cometSections.context_layout?.story?.actors) {
        actor = cometSections.context_layout.story.actors[0]
    } else {
        return false
    }
    let viewerAccountFid = ''
    //$g.log.append('debug actor', JSON.stringify(actor))
    let feedbackTargetWithContext = cometSections.feedback?.story?.feedback_context?.feedback_target_with_context 
         || cometSections.feedback.story.comet_feed_ufi_container.story.story_ufi_container.story.feedback_context.feedback_target_with_context
         || cometSections.feedback?.story?.comet_feed_ufi_container?.story?.feedback_context?.feedback_target_with_context || {}
    // $g.log.append('post data:', JSON.stringify(feedbackTargetWithContext))
    let feedback = {}
    if (feedbackTargetWithContext) {
        if (feedbackTargetWithContext.comet_ufi_summary_and_actions_renderer) {
            feedback = feedbackTargetWithContext.comet_ufi_summary_and_actions_renderer.feedback
        } else if (feedbackTargetWithContext.ufi_renderer?.feedback?.comet_ufi_summary_and_actions_renderer?.feedback) {
            feedback = feedbackTargetWithContext.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback
        } else if (feedbackTargetWithContext.ufi_renderer?.feedback) {
            feedback = feedbackTargetWithContext.ufi_renderer.feedback
        }
        viewerAccountFid = feedbackTargetWithContext.viewer_actor?.id || ''
    }
    canViewerComment = 'n'
    canViewerReact = 'y'
    if (feedbackTargetWithContext?.ufi_renderer?.feedback) {
        canViewerComment = feedbackTargetWithContext.ufi_renderer.feedback.can_viewer_comment? 'y' : 'n'
        parseFbPostCommentData(feedbackTargetWithContext.ufi_renderer.feedback)
    }
    let { picture, video } = parsePostAttachements(cometSections.content)
    pictureStr = picture.join("\n")

    // 原贴发帖人信息
    shareUserFid = ''
    shareUserName = ''
    shareUserProfileImageUrl = ''
    sharePostTimestamp = ''
    shareUserTypeName = ''
    if (node.attached_story) {
        const attached_story = node.attached_story.comet_sections.context_layout.story.comet_sections.actor_photo.story.actors[0]
        //$g.log.append('debug', JSON.stringify(attached_story))
        shareUserFid = attached_story.id
        shareUserName = attached_story.name
        shareUserTypeName = attached_story.__typename
        shareUserProfileImageUrl = attached_story.profile_picture.uri
        sharePostTimestamp = node.attached_story.comet_sections.context_layout.story.comet_sections.metadata[0].story.creation_time
    } else if (cometSections.content.story.attachments && cometSections.content.story.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        const attached_story = cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target
        //$g.log.append('debug', JSON.stringify(attached_story))
        shareUserFid = attached_story.comet_sections.actor_photo.story.actors[0].id
        shareUserName = attached_story.comet_sections.actor_photo.story.actors[0].name
        shareUserTypeName = attached_story.comet_sections.actor_photo.story.actors[0].__typename
        sharePostTimestamp = attached_story.comet_sections.metadata[0].story.creation_time
        shareUserProfileImageUrl = attached_story.comet_sections.actor_photo.story.actors[0].profile_picture.uri
        if (attached_story.attachments[0].style_type_renderer.attachment.media.__typename == 'Video') {
            video = attached_story.attachments[0].style_type_renderer.attachment.media.playable_url
        }
    }

    let externalURL = ''
    if (cometSections.content.story.attachments && cometSections.content.story.attachments[0]?.styles?.attachment?.story_attachment_link_renderer?.attachment?.web_link) {
        externalURL = cometSections.content.story.attachments[0].styles.attachment?.story_attachment_link_renderer.attachment.web_link.url
    }

    // 原贴链接、原贴内容
    shareContent = ''
    shareLink = ''
    if (cometSections.content.story.comet_sections.attached_story) {
        const share_content_str = cometSections.content.story.comet_sections.attached_story.story.attached_story.comet_sections.attached_story_layout.story
        shareContent = share_content_str.message?.text || ''
        shareLink = share_content_str.comet_sections.metadata[0].story.url
    } else if (cometSections?.content?.story?.attachments && cometSections?.content?.story?.attachments[0]?.style_type_renderer?.attachment) {
        //$cometSections['content']['story']['attachments'][0]['style_type_renderer']['attachment']  转发外网链接
        const share_content_str = cometSections.content.story.attachments[0].style_type_renderer.attachment
        shareContent = share_content_str.title_with_entities?.text | ''
        shareLink = share_content_str.story_attachment_link_renderer?.attachment.web_link.url | ''
    } else if (cometSections?.content?.story?.attachments && cometSections?.content?.story?.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        const share_content_str = cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target
        shareContent = share_content_str.message.text
        shareLink = share_content_str.comet_sections.metadata[0].story.url
    }
    
    if (!postTimestamp && cometSections?.content?.story?.attachments[0]?.styles?.attachment?.media?.publish_time) {
        postTimestamp = cometSections.content.story.attachments[0].styles.attachment.media.publish_time
    }
    if (!postTimestamp && cometSections.feedback?.story?.tracking) {
        tracking = $g.$json_from_string(cometSections.feedback.story.tracking)
        if (tracking?.page_insights){
            for (let key in tracking.page_insights) {
                if (tracking.page_insights[key]?.post_context?.publish_time) {
                    postTimestamp = tracking.page_insights[key].post_context.publish_time
                }
                break
            }
        }
    }
    isShare = 'n'
    if (shareLink) {
        isShare = 'y'
    }
    //node.comet_sections.content.story.attached_story.attachments
    // 转发贴原贴FID
    let sharePostFid = ''
    let sharePostStr = ''
    let shareImageInContentUrl = ''
    let shareVideo = ''
    if (cometSections.content.story.comet_sections.attached_story?.story?.attached_story.comet_sections?.attached_story_layout) {
        const attachedStoryLayout = cometSections.content.story.comet_sections.attached_story?.story?.attached_story.comet_sections?.attached_story_layout
        let { picture: sharePicture, video: shareVideoURL } = parsePostAttachements(attachedStoryLayout)
        shareImageInContentUrl = sharePicture.join("\n")
        shareVideo = shareVideoURL
        sharePostStr = new Buffer.from(attachedStoryLayout.story.id, 'base64').toString()
    } else if (cometSections.content.story?.attachments && cometSections.content.story?.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        sharePostStr = new Buffer.from(cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target.id, 'base64').toString()
    }
    const sharePostFidArr = sharePostStr.split(':')
    if (sharePostFidArr.length > 1) {
        sharePostFid = sharePostFidArr[sharePostFidArr.length - 1]
    }
    if(sharePostFid && !externalURL){
        externalURL = 'https://www.facebook.com/' + sharePostFid
    }
    
    // $g.log.append('feedback', JSON.stringify(feedback))
    if (!feedback.id) {
        return false
    }
    const idStr = new Buffer.from(feedback.id, 'base64').toString()
    const postFids = idStr.split(':')
    const postFid = postFids[1]
    postUrl = postUrl || `https://www.facebook.com/${postFid}`

    let post = {
        iid: postFid,
        identity: postFid,
        user_iid: actor.id,
        user_image_url: actor.profile_picture.uri,
        user_name: actor.name,
        home_url: actor.url,
        user_typename: actor.__typename,
        category_type: actor.category_type,
        url: postUrl,
        post_time: $g.$time(timestamp2bjtz(postTimestamp), 's'),
        content_type: node.__typename,
        content: content,
        image_in_content_url: pictureStr,
        video: video,
        is_share: isShare,
        share_user_iid: shareUserFid,
        share_post_iid: sharePostFid,
        share_link: shareLink,
        share_user_name: shareUserName,
        share_user_typename: shareUserTypeName,
        share_content: shareContent,
        share_image_in_content_url: shareImageInContentUrl,
        share_video: shareVideo,
        share_user_profile_image_url: shareUserProfileImageUrl,
        share_post_timestamp: sharePostTimestamp,
        external_url: externalURL,
        forward_count: 0,
        reply_count: 0,
        total_action_count: 0,
        praise_count: 0,
        love_count: 0,
        laugh_count: 0,
        wow_count: 0,
        sad_count: 0,
        angry_count: 0,
        care_count: 0,
        video_play_count: 0,
        can_viewer_comment: canViewerComment,
        can_viewer_react: canViewerReact,
        tag: tagStr,
        viewer_account_fid: viewerAccountFid
    }
    if (node.feedback?.associated_group?.id) {
        post.group_fid = node.feedback.associated_group.id
    }
    const postFeedbackInfo = parsePostFeedbackInfo(feedback)
    Object.assign(post, postFeedbackInfo)
    return post;
}

const parsePostAttachements = function (data) {
    //$g.log.append('debug', JSON.stringify(data))
    let picture = []
    let video = ''
    let attachments = []
    if (data.story?.attachments) {
        attachments = data.story.attachments
    } else if (data.story?.attached_story?.attachments) {
        attachments = data.story.attached_story.attachments
    }
    if (attachments.length > 0) {
        let attachment = {}
        if (attachments[0].style_type_renderer?.attachment) {
            attachment = attachments[0].style_type_renderer.attachment
        } else if (attachments[0].styles) {
            if (attachments[0].styles.attachment) {
                attachment = attachments[0].styles.attachment
            }
            if (attachments[0].styles.cover_photo) {
                picture.push(attachments[0].styles.cover_photo.photo.image.uri)
            }
        }
        if (attachment.media) {
            if (attachment.media.photo_image) {
                picture.push(attachment.media.photo_image.uri)
            } else if (attachment.media.thumbnailImage) {
                picture.push(attachment.media.thumbnailImage.uri)
            } else if (attachment.media.large_share_image) {
                picture.push(attachment.media.large_share_image.uri)
            } else if (attachment.media.image) {
                picture.push(attachment.media.image.uri)
            }

        }
        if (attachment.all_subattachments) {
            const all_subattachments = attachment.all_subattachments.nodes
            for (const media of all_subattachments) {
                picture.push(media.media.viewer_image.uri)
            }
        }
        // 视频链接
        if (attachment.media) {
            if (attachment.media.__typename == 'Video') {
                video = attachment.media.playable_url
            }
        }
    }
    return { picture, video }
}

//FB account feed list
exports.fbAccountFeed = function(htmlStr, requestData) {
    if (!resultData.feed_post_list) {
        resultData.feed_post_list = []
    }
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data.data?.viewer?.news_feed?.edges) {
            for(const node of data.data.viewer.news_feed.edges) {
                edges.push(node.node)
            }
        }
        if (data.data?.node) {
            edges.push(data.data.node)
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            resultData.feed_post_list.push(post)
        }
    }
}

exports.searchHashtag = function (htmlStr, requestData) {
    let postList = []
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line);
        if (data?.data?.topic_deep_dive?.rendering_strategies) {
            let rendering_strategies = data?.data?.topic_deep_dive?.rendering_strategies;
            for (const edge of rendering_strategies.edges) {
                if (edge.rendering_strategy?.explore_view_model?.story) {
                    edges.push(edge.rendering_strategy?.explore_view_model?.story)
                }
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        postList.push(post)
    }
    if (postList.length > 0) {
        const key = 'search_hashtag_post_' + getUniqidKey()
        resultData[key] = postList
    }
}
exports.fbPostLikeList = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    if(!data.data?.node){
        return
    }
    const postFid = new Buffer.from(data.data.node.id, 'base64').toString().split(':')[1]
    let edges = []
    if (data.data.node.reactors?.edges) {
        edges = data.data.node.reactors.edges
    } else if (data.data.node.comet_reactions_dialog_tab_content_renderer?.feedback?.reactors?.edges) {
        edges = data.data.node.comet_reactions_dialog_tab_content_renderer.feedback.reactors.edges
    } else {
        $g.log.append('debug', 'not found post reactors')
        $g.log.append('debug', JSON.stringify(data.data))
    }
    
    if (!resultData.post_like_list) {
        resultData.post_like_list = []
    }
    for (const edge of edges) {
        const node = edge.node
        const faceImage = edge.feedback_reaction?.face_image?.uri || edge.feedback_reaction_info.face_image.uri
        let faceType = 'unknow'
        let faceKey = ''
        // if (faceImage.indexOf('62AAE5F9') > -1) {
        //     faceType = 'like'
        // } else if (faceImage.indexOf('62AC3C5F') > -1) {
        //     faceType = 'love'
        // } else if (faceImage.indexOf('62AB9718') > -1) {
        //     faceType = 'care'
        // } else if (faceImage.indexOf('62AAD631')> -1) {
        //     faceType = 'wow'
        // }
        if (faceImage.indexOf('62D120D8') > -1) {
            faceType = 'like'
            faceKey = '1635855486666999'
        } else if (faceImage.indexOf('62D1BAC7') > -1) {
            faceType = 'love'
            faceKey = '1678524932434102'
        } else if (faceImage.indexOf('62D07E23') > -1) {
            faceType = 'care'
            faceKey = '613557422527858'
        } else if (faceImage.indexOf('62D1BC11')> -1) {
            faceType = 'wow'
            faceKey = '478547315650144'
        }else if (faceImage.indexOf('62D17AF2')> -1) {
            faceType = 'angry'
            faceKey = '444813342392137'
        }else if (faceImage.indexOf('62D13D22')> -1) {
            faceType = 'sad'
            faceKey = '908563459236466'
        }else if (faceImage.indexOf('62D0CC6B')> -1) {
            faceType = 'haha'
            faceKey = '115940658764963'
        }
        let reaction = {
            post_fid: postFid,
            id: node.id,
            name: node.name,
            type: node.__typename,
            link: node.profile_url,
            user_image_url: node.profile_picture,
            reaction_info: edge.reaction_info,
            face_type: faceType,
            face_key: faceKey
        }
        if (faceType == 'unknow') {
            reaction.face_image = faceImage
        }
        resultData.post_like_list.push(reaction)
    }
}
const parseFbPostComments = function (htmlStr) {
    const patternArr = [
        /"ufi_renderer":{"__typename":.*?,"feedback":({"id":.*?}),"__module_operation_CometFeedUFI_feedback"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            $g.log.append('parseFbPostComments', 'match ...')
            let data = $g.$json_from_string(matchObj[1])
            //$g.log.append('debug', JSON.stringify(data))
            if (!data) {
                break;
            }
            if (data.comment_list_renderer?.feedback) {
                data = data.comment_list_renderer.feedback
            }
            parseFbPostCommentData(data)
            break;
        }
    }
}
exports.fbPostCommentList = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    if (data?.data?.node) {
        parseFbPostCommentData(data.data.node)
    }
    if (data?.data?.feedback) {
        parseFbPostCommentData(data.data.feedback)
    }
}
const parseFbPostCommentData = function (data) {
    if (!resultData.post_comments_list) {
        resultData.post_comments_list = []
    }
    const postFid = new Buffer.from(data.id, 'base64').toString().split(':')[1]
    const edges = data.display_comments?.edges || []
    for (const edge of edges) {
        const node = edge.node
        let text = node.body?.text || ''
        let comments_img = ''
        if(node.attachments[0]?.style_type_renderer?.attachment?.url){
            comments_img = node.attachments[0].style_type_renderer.attachment.url
        }
        let post = {
            post_fid: postFid,
            iid: node.legacy_token,
            created_time: node.created_time,
            permalink_url: node.url,
            can_viewer_react: node.can_viewer_react,
            can_viewer_comment: node.can_viewer_comment,
            message: text,
            message_image: comments_img,
            user_iid: node.author.id,
            name: node.author.name,
            gender: node.author.gender,
            author_url: node.author.url,
            author_type: node.author.__typename,
            author_picture: node.author.profile_picture_depth_0.uri,
            praise_count: 0,
            love_count: 0,
            laugh_count: 0,
            wow_count: 0,
            sad_count: 0,
            angry_count: 0,
            reply_count: node.feedback.comment_count?.total_count,
            shares: 0,
            likers: 0,
            reactors: node.feedback.reactors.count
        }
        const topReactionsEdges = node.feedback.cannot_see_top_custom_reactions_on_comment.top_reactions.edges
        for (const reaction of topReactionsEdges) {
            switch (reaction.node.reaction_type) {
                case 'LIKE':
                    post.praise_count = reaction.reaction_count
                    break;
                case 'LOVE':
                    post.love_count = reaction.reaction_count
                    break;
                case 'HAHA':
                    post.laugh_count = reaction.reaction_count
                    break;
                case 'WOW':
                    post.wow_count = reaction.reaction_count
                    break;
                case 'SORRY':
                    post.sad_count = reaction.reaction_count
                    break;
                case 'ANGER':
                    post.angry_count = reaction.reaction_count
                    break;
            }
        }
        resultData.post_comments_list.push(post)
    }
}
exports.fbPostShareList = function (htmlStr, requestData) {
    if (!resultData.post_share_list) {
        resultData.post_share_list = []
    }
    let data = $g.$json_from_string(htmlStr)
    data = data.data?.feedback || data.data?.node
    if (data && data.reshares?.edges) {
        const postFid = new Buffer.from(data.id, 'base64').toString().split(':')[1]
        const edges = data.reshares.edges
        for (const edge of edges) {
            const post = parseFbPostInfo(edge.node)
            post.origin_post_fid = postFid
            resultData.post_share_list.push(post)
        }
    }
}
const searchFbPlaces = function (node) {
    const edges_places = node.profile
    let places = {
        name: edges_places.name,
        is_selected: edges_places.url,
        type: edges_places.type,
        iid: edges_places.id,
        profile_picture: edges_places.profile_picture.uri
    }
    return places;
}

const searchFbEvents = function (edges) {
    for (const edge of edges) {
        const view_model = node.relay_rendering_strategy.view_model
        const user_events = edge.node
        let Photos = {
            iid: view_model.profile.id,
            name: view_model.profile.name,
            profile_picture: view_model.profile.uri
        }
        resultData.photo_list.push(Photos)
    }
    return places;
}

exports.fbPrfileUserPhoto = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    let node = data.data.node
    if (node.all_collections?.nodes[0]?.style_renderer?.collection?.pageItems && nodes.data.node.name != 'Likes') {
        let edges = node.all_collections.nodes[0].style_renderer.collection.pageItems
        let iid = data.data.user.id
        let type = data.data.user.if_viewer_can_see_profile_paginated_collections_feed.__typename
    }
    for (const edge of edges) {
        const user_photos = edge.node
        let Photos = {
            albums_iid: user_photos.node.id,
            picture_url: user_photos.image.uri,
            user_iid: iid,
            type: type,
            albums_url: user_photos.node.url,
            title: user_photos.title.text
        }
        resultData.photo_list.push(Photos)
    }
    // 没有用的基本信息
}

exports.fbPrfileGroupPhoto = function (htmlStr, requestData) {
    if (!resultData.photo_list) {
        resultData.photo_list = []
    }
    const data = $g.$json_from_string(htmlStr)
    let node = data.data.group
    let edges = node.group_albums?.edges || []
    let iid = node.group_albums.id
    for (const edge of edges) {
        const group_photos = edge.node
        let Photos = {
            group_iid: iid,
            albums_iid: group_photos.id,
            picture_url: group_photos.album_cover_focused_image.image.image.uri,
            picture_iid: group_photos.album_cover_focused_image.image.id,
            title: group_photos.title.text,
            albums_url: group_photos.url,
            type: "group"
        }
        resultData.photo_list.push(Photos)
    }
    // 没有用的基本信息
}
exports.fbPrfilePagepPhoto = function (htmlStr, requestData) {
    if (!resultData.photo_list) {
        resultData.photo_list = []
    }
    const data = $g.$json_from_string(htmlStr)
    let node = data.data.page
    let edges = node.page_albums?.edges || []
    let iid = node.id
    for (const edge of edges) {
        const group_photos = edge.node
        let Photos = {
            group_iid: iid,
            albums_iid: group_photos.id,
            picture_url: group_photos.featurable_image.uri,
            title: group_photos.featurable_title.text,
            albums_url: group_photos.cometUrl,
            type: "page"
        }
        resultData.photo_list.push(Photos)
    }
    // 没有用的基本信息
}

exports.fbPageInternal = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    let node = '';
    if (data.data?.node) {
        let node = data.data.node
    }
    if (data.data?.page) {
        let node = data.data.page
    }
    if (node.past_events?.edges) {
        let edges = node.past_events.edges
        let iid = node.id
        parseFbevent(edges, iid);
    }
    if (node.upcoming_events?.edges) {
        let edges = node.upcoming_events.edges
        let iid = node.id
        parseFbevent(edges, iid);
    }
}
const parseFbevent = function (edges, iid) {
    for (const edge of edges) {
        const event = edge.node
        let events = {
            page_iid: iid,
            event_iid: event.id,
            name: event.name,
            eventUrl: event.eventUrl,
            event_place_type: event.event_place.__typename,
            event_place_name: event.event_place.name,
            event_place_isnode: event.event_place.__isNode,
            event_place_id: event.event_place.id,
            cover_photo: event.cover_photo.photo.image.uri,
            cover_photo_iid: event.cover_photo.photo.id,
            event_creator_type: event.event_creator.__typename,
            event_creator_id: event.event_creator.id,
            event_creator_name: event.event_creator.name,
            social_context: event.social_context.text,
            online_event_setup: event.online_event_setup.type,
            is_past: event.is_past,                                //往期和预告
            is_canceled: event.is_canceled,
            event_kind: event.event_kind,
            day_time_sentence: event.day_time_sentence,
            created_for_group: event.created_for_group,
            can_viewer_create_repeat_event: event.can_viewer_create_repeat_event,
            can_viewer_share: event.can_viewer_share,
            can_viewer_invite: event.can_viewer_invite,
            is_viewer_admin: event.is_viewer_admin,
            is_event_draft: event.is_event_draft,
            viewer_watch_status: event.viewer_watch_status,
            viewer_guest_status: event.viewer_guest_status,
            is_viewer_admin: event.is_viewer_admin,
        }
        resultData.page_event_list.push(events)
    }
}
const parseFbPageGroups = function (htmlStr) {
    const patternArr = [
        /"data":{"page":(.*?),"viewer":{"streamer_group_creation_options":.*}/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            const eges = data.confirmed_groups.edges
            const page_iid = data.id
            fbPageGroupsList(data, page_iid);
        }
    }
}
exports.fbPageGroup = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    let node = '';
    if (data.data?.node) {
        let node = data.data.node
        // let node = data.data.node.confirmed_groups.edges
        let page_iid = node.id
        fbPageGroupsList(node, page_iid)

    }
}

const fbPageGroupsList = function (eges, iid) {
    let linked_groups = []
    const confirmed_groups = eges.confirmed_groups.edges
    for (const ege of confirmed_groups) {
        const node = ege.node
        const group_snippets = node.group_snippets.nodes[0].title.text
        const member_len = group_snippets.indexOf("members")
        const post_len = group_snippets.indexOf(" post")
        const member = group_snippets.substring(0, member_len - 1)
        const post_num = group_snippets.substring(member_len + 10, post_len)
        let linked_group = {
            page_iid: iid,
            group_iid: node.id,
            group_url: node.groupVisitUri,
            group_name: node.full_name,
            group_members: member,
            posts_nums: post_num,
        }
        linked_groups.push(linked_group)
    }
    if (linked_groups.length > 0) {
        const key = 'linked_groups_' + getUniqidKey()
        resultData[key] = linked_groups
    }
}
const parseFbPageMembers = function (htmlStr) {
    const patternArr = [
        /"adp_GroupsCometMembersPagesRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"group":.*?,"extra_context":null})}]/,
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (data.result?.data?.group?.group_member_sections) {
                const node = data.result.data.group
                const groupFid = node.id
                if (node.group_member_sections[0].group.group_member_pages?.edges) {
                    const membersAll = node.group_member_sections[0].group.group_member_pages.edges
                    FbGroupPageMembers(membersAll, groupFid);
                }
            }
        }
    }
}
exports.FbPageMembers = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr)
    let membersAll = {}
    let groupFid = ''
    if (node.data.node?.group_member_pages) {
        membersAll = node.data.node.group_member_pages.edges
        groupFid = node.data.node.id
        FbGroupPageMembers(membersAll, groupFid)
    }
}
const FbGroupPageMembers = function (membersAll, groupFid) {
    let page_members_list = []
    for (const role in membersAll) {
        const node = membersAll[role].node
        const member = {
            id: node.id,
            name: node.name,
            category_name: node.category_name,
            page_likers: node.page_likers,
            url: node.url,
            group_id: groupFid,
            type: node.__typename,
            picture_url: node.profile_picture.uri,
            data_sources: 'page_members'
        }
        page_members_list.push(member)
    }
    if (page_members_list.length > 0) {
        const key = 'page_members_list' + getUniqidKey()
        resultData[key] = page_members_list
    }
}

const parseFbVideoPostInfo = function (htmlStr) {
    $g.log.append('video post', 'parse single video post')
    const pattern = /"adp_CometTahoeRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"label":"CometTahoeRootQuery\$defer\$CometTahoeSidepaneRenderer_video","path":\["video"\],"data":{.*?"extra_context":null})}\]\],\[/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    const video = data.result.data.tahoe_sidepane_renderer.video
    const story = video.creation_story
    let content = ''
    let tagStr = ''
    if (story.comet_sections?.message) {
        const message = story.comet_sections.message.story.message
        content = message.text
        let tagArr = []
        for (const tag of message.ranges) {
            tagArr.push({
                id: tag.entity.id,
                name: '',
                url: tag.entity.url,
                type: tag.entity.__typename,
                offset: tag.offset,
                length: tag.length
            })
        }
        if (tagArr.length > 0) {
            tagStr = JSON.stringify(tagArr)
        }
    }
    let picture = []
    let videoURL = ''
    let attachments = []
    if (story.attachments) {
        attachments = story.attachments
    }
    if (attachments.length > 0) {
        let attachment = {}
        if (attachments[0].style_type_renderer?.attachment) {
            attachment = attachments[0].style_type_renderer.attachment
        } else if (attachments[0].styles) {
            if (attachments[0].styles.attachment) {
                attachment = attachments[0].styles.attachment
            }
            if (attachments[0].styles.cover_photo) {
                picture.push(attachments[0].styles.cover_photo.photo.image.uri)
            }
        }
        if (attachment.media) {
            if (attachment.media.photo_image) {
                picture.push(attachment.media.photo_image.uri)
            } else if (attachment.media.thumbnailImage) {
                picture.push(attachment.media.thumbnailImage.uri)
            } else if (attachment.media.large_share_image) {
                picture.push(attachment.media.large_share_image.uri)
            }

        }
        if (attachment.all_subattachments) {
            const all_subattachments = attachment.all_subattachments.nodes
            for (const media of all_subattachments) {
                picture.push(media.media.viewer_image.uri)
            }
        }
        // 视频链接
        if (attachment.media) {
            if (attachment.media.__typename == 'Video') {
                video = attachment.media.playable_url
            }
        }
    }
    pictureStr = picture.join("\n")

    const actor = story.comet_sections.actor_photo.story.actors[0]
    const postUrl = story.shareable.url
    const postTimestamp = story.comet_sections.metadata[0].story.creation_time

    const feedback = video.feedback
    const canViewerComment = feedback.can_viewer_comment ? 'y' : 'n'
    const canViewerReact = feedback.can_viewer_react ? 'y' : 'n'
    let post = {
        iid: video.id,
        identity: video.id,
        user_iid: actor.id,
        user_image_url: actor.profile_picture.uri,
        user_name: actor.name,
        home_url: actor.url,
        url: postUrl,
        post_time: $g.$time(timestamp2bjtz(postTimestamp), 's'),
        content_type: video.__typename,
        content: content,
        image_in_content_url: pictureStr,
        video: videoURL,
        is_share: 'n',
        share_user_iid: '',
        share_post_iid: '',
        share_link: '',
        share_user_name: '',
        share_content: '',
        share_image_in_content_url: '',
        share_user_profile_image_url: '',
        share_post_timestamp: '',
        forward_count: 0,
        reply_count: 0,
        total_action_count: 0,
        praise_count: 0,
        love_count: 0,
        laugh_count: 0,
        wow_count: 0,
        sad_count: 0,
        angry_count: 0,
        care_count: 0,
        video_play_count: 0,
        can_viewer_like: 'y',
        can_viewer_comment: canViewerComment,
        can_viewer_react: canViewerReact,
        tag: tagStr
    }
    const postFeedbackInfo = parsePostFeedbackInfo(feedback)
    Object.assign(post, postFeedbackInfo)
    //video URL
    const patternVideo = /"adp_CometTahoeRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"video".*?"extra_context":null})}\]\],\[/
    const matchVideoObj = htmlStr.match(patternVideo)
    if (matchVideoObj && matchVideoObj[1]) {
        const data = $g.$json_from_string(matchVideoObj[1])
        post.video = data.result.data.video.playable_url
    }

    return post
}

const parseFbWatchVideoPostDoc = function (htmlStr) {
    let post
    const pattern = /"adp_CometVideoHomeNewPermalinkHeroUnitQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{.*?"data":({"id".*?"feedback".*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        $g.log.append('parseFbVideoPostDoc', 'match ...')
        const data = $g.$json_from_string(matchObj[1])
        //$g.log.append('debug', JSON.stringify(data))
        const feedback = data.feedback
        const idStr = new Buffer.from(feedback.id, 'base64').toString()
        const postFids = idStr.split(':')
        const postFid = postFids[1]
        const postUrl = `https://www.facebook.com/${postFid}`
        post = {
            iid: postFid,
            identity: postFid,
            user_iid: data.owner.id,
            user_image_url: '',
            user_name: '',
            home_url: '',
            url: postUrl,
            post_time: '',
            content_type: '',
            content: data.creation_story.message.text,
            image_in_content_url: '',
            video: '',
            is_share: 'n',
            share_user_iid: '',
            share_post_iid: '',
            share_link: '',
            share_user_name: '',
            share_content: '',
            share_image_in_content_url: '',
            share_user_profile_image_url: '',
            share_post_timestamp: '',
            forward_count: 0,
            reply_count: 0,
            total_action_count: 0,
            praise_count: 0,
            love_count: 0,
            laugh_count: 0,
            wow_count: 0,
            sad_count: 0,
            angry_count: 0,
            care_count: 0,
            video_play_count: 0,
            can_viewer_like: 'y',
            can_viewer_comment: '',
            can_viewer_react: '',
            tag: ''
        }
        const postFeedbackInfo = parsePostFeedbackInfo(feedback)
        Object.assign(post, postFeedbackInfo)
    }
    const patternAttach = /"adp_CometVideoHomeNewPermalinkHeroUnitQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{.*?"data":({"attachments".*?}),"extensions"/
    const matchAttachObj = htmlStr.match(patternAttach)
    if (matchAttachObj && matchAttachObj[1]) {
        const data = $g.$json_from_string(matchAttachObj[1])
        const media = data.attachments[0].media
        //$g.log.append('debug', JSON.stringify(media))
        const postTimestamp = media.creation_story.comet_sections.metadata[0].story.creation_time
        post.user_iid = media.owner.id
        post.user_name = media.owner.name
        post.post_time = $g.$time(timestamp2bjtz(postTimestamp), 's')
    }
    if (post) {
        const key = 'single_post_' + getUniqidKey()
        resultData[key] = [post]
    }
}

exports.fbAjaxGroupPostSearchDataParse = function (htmlStr, requestData) {
    let postList = []
    let searchPost = []
    let searchProfile = []
    let searchPlaces = []
    let searchEvents = []
    const lines = htmlStr.split("\n")
    let edges = []
    let edges_profile = []
    let edges_post = []
    let edges_places = []
    let edges_events = []
    for (const line of lines) {
        const data = $g.$json_from_string(line);
        if (data?.data?.serpResponse?.results) {
            for (const edge of data.data.serpResponse.results.edges) {
                if (edge.relay_rendering_strategy?.view_model?.click_model?.story?.comet_sections) {
                    edges.push(edge.relay_rendering_strategy.view_model.click_model.story)
                }
                const role = edge.node.role
                //搜索帖子
                if (role == 'TOP_PUBLIC_POSTS') {
                    edges_post.push(edge.relay_rendering_strategy.view_model);
                }
                if (role == 'ENTITY_GROUPS' || role == 'ENTITY_PAGES' || role == 'ENTITY_USER') {//主页搜索人，搜索主页，搜索群组
                    // if(edge.relay_rendering_strategy && edge.relay_rendering_strategy?.__typename == 'SearchProfileRenderingStrategy'){//主页搜索人，搜索主页，搜索群组
                    edges_profile.push(edge.relay_rendering_strategy.view_model);
                }
                if (role == 'ENTITY_PLACES') {//搜索地方
                    edges_places.push(edge.relay_rendering_strategy.view_model);
                }
                if (role == 'ENTITY_EVENTS') {//搜索活动
                    edges_events.push(edge);
                }
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            postList.push(post)
        }
    }
    for (const node of edges_post) {
        const post = parseFbSearchPostInfo(node)
        if (post) {
            searchPost.push(post)
        }
    }
    if (searchPost.length > 0) {
        const key = 'search_post_' + getUniqidKey()
        resultData[key] = searchPost
    }
    for (const node of edges_profile) {
        if (node.profile) {
            const profile = searchFbProfileInfo(node)
            if (profile) {
                searchProfile.push(profile)
            }
        }
    }
    if (searchProfile.length > 0) {
        const key = 'search_profile_list'
        if (!resultData[key]) {
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(searchProfile)
    }
    for (const node of edges_places) {
        const profile = searchFbPlaces(node)
        if (profile) {
            searchPlaces.push(profile)
        }
    }
    if (searchPlaces.length > 0) {
        const key = 'search_places_list'
        if (!resultData[key]) {
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(searchPlaces)
    }
    for (const node of edges_events) {
        const profile = searchFbEvents(node)
        if (profile) {
            searchEvents.push(profile)
        }
    }
    if (searchEvents.length > 0) {
        const key = 'search_events_' + getUniqidKey()
        resultData[key] = searchEvents
    }
    if (postList.length > 0) {
        const key = 'search_post_list'
        if (!resultData[key]) {
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

exports.fbAjaxUserPost = function (htmlStr, requestData) {
    let postList = []
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data.data) {
            if (data.data.node?.timeline_list_feed_units) {
                const timelineListFeedUnits = data.data.node.timeline_list_feed_units
                for (const edge of timelineListFeedUnits.edges) {
                    edges.push(edge.node)
                }
            } else if (data.data.node?.__typename && data.data.node.__typename == 'Story') {
                edges.push(data.data.node)
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            postList.push(post)
        }
    }
    if (postList.length > 0) {
        const fid = postList[0].group_fid || postList[0].user_iid
        const key = 'post_' + fid
        if (!resultData[key]){
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

exports.fbAjaxPagePost = function (htmlStr, requestData) {
    let postList = []
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data?.data?.node?.timeline_feed_units) {
            const timelineFeedUnits = data.data.node.timeline_feed_units
            for (const node of timelineFeedUnits.edges) {
                edges.push(node.node)
            }
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            postList.push(post)
        }
    }
    if (postList.length > 0) {
        const fid = postList[0].group_fid || postList[0].user_iid
        const key = 'post_' + fid
        if (!resultData[key]){
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

exports.fbAjaxGroupPost = function (htmlStr, requestData) {
    let postList = []
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data?.data?.node?.group_feed) {
            const timelineListFeedUnits = data.data.node.group_feed
            for (const edge of timelineListFeedUnits.edges) {
                edges.push(edge.node)
            }
        } else if (data?.data?.node?.__typename && data.data.node.__typename == 'Story') {
            edges.push(data.data.node)
        }
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            postList.push(post)
        }
    }
    if (postList.length > 0) {
        const fid = postList[0].group_fid || postList[0].user_iid
        const key = 'post_' + fid
        if (!resultData[key]){
            resultData[key] = []
        }
        resultData[key] = resultData[key].concat(postList)
    }
}

exports.fbAjaxGroupMemberPostDataParse = function (htmlStr, requestData) {
    let postList = []
    const lines = htmlStr.split("\n")
    let edges = []
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data?.data?.node?.group_member_feed) {
            const timelineListFeedUnits = data.data.node.group_member_feed
            for (const edge of timelineListFeedUnits.edges) {
                edges.push(edge.node)
            }
        }
    }
    if (!resultData.group_user_posts) {
        resultData.group_user_posts = []
    }
    for (const node of edges) {
        const post = parseFbPostInfo(node)
        if (post) {
            resultData.group_user_posts.push(post)
        }
    }
}

exports.fbAjaxGroupMemebrSearchDataParse = function (htmlStr, requestData) {
    let memberList = []
    const lines = htmlStr.split("\n")
    for (const line of lines) {
        const data = $g.$json_from_string(line)
        if (data && data.data) {
            const groupFid = data.data.node.id
            for (let node of data.data.node.search_results.edges) {
                node = node.node
                memberList.push(
                    {
                        group_iid: groupFid,
                        user_iid: node.id,
                        name: node.name,
                        profile_url: node.url,
                        role: 'member'
                    }
                )
            }
        }
    }
    if (memberList.length > 0) {
        const key = 'group_member_' + getUniqidKey()
        resultData[key] = memberList
    }
}

exports.fbAboutAppSectionQuery = function (htmlStr, requestData) {
    if (JSON.stringify(requestData).indexOf('ProfileCometAppSectionFeedPaginationQuery') > 0) {
        fbAboutAppSectionOther(htmlStr, requestData)
        //return
    }

    const lines = htmlStr.split("\n")
    let aboutInfos = {}
    const data = $g.$json_from_string(lines[0])
    if (lines[1]) {
        fbAboutAppSectionOther(lines[1], requestData)
    }
    const userFid = data.data.user?.id
    if (!userFid) {
        return
    }
    const styleRenderer = data.data.user.about_app_sections.nodes[0].activeCollections.nodes[0].style_renderer
    const profileFieldSections = styleRenderer.profile_field_sections
    if (styleRenderer.__typename == 'TimelineAppCollectionAboutLifeEventsRenderer') {
        const userFid = styleRenderer.user.id
        const nodes = styleRenderer.user.timeline_sections.nodes
        //$g.log.append('debug', JSON.stringify(nodes))
        let lifeEvents = {}
        for (const node of nodes) {
            if (!node.year || node.year_overview.items.nodes.length==0) {
                continue
            }
            lifeEvents[node.year] = []
            const nodesYear = node.year_overview.items.nodes
            for (const nodeYear of nodesYear) {
                let event = {
                    text: nodeYear.title.text,
                    url: nodeYear.url,
                    type: nodeYear.node.__typename
                }
                lifeEvents[node.year].push(event)
            }
        }
        for (const key in resultData) {
            if (key.startsWith('account_') && userFid == resultData[key].identity) {
                resultData[key].left_events = lifeEvents
            }
        }
    }
    //$g.log.append('debug', 'profileFieldSections: ' + JSON.stringify(profileFieldSections))
    if (!profileFieldSections) {
        return
    }
    for (const profileFields of profileFieldSections) {
        let profileFieldsType = profileFields.field_section_type || profileFields.title?.text
        profileFieldsType = profileFieldsType.toLowerCase()
        const nodes = profileFields.profile_fields.nodes
        //$g.log.append('profileFieldsType', profileFieldsType)
        //$g.log.append('profileFieldSections', JSON.stringify(profileFieldSections))
        switch (profileFieldsType) {
            case 'work':
                aboutInfos.work = []
                for (const node of nodes) {
                    let positionName = node.title.text
                    //$g.log.append('debug', JSON.stringify(node))
                    let employerName = ''
                    if (positionName.indexOf(' at ') > -1) {
                        const textArr = node.title.text.split(' at ')
                        positionName = textArr[0].trim()
                        employerName = textArr[1].trim()
                    }
                    aboutFieldInfo = {
                        position: { name: positionName },
                        employer: { name: employerName }
                    }
                    let listItemGroups = node.renderer?.field?.list_item_groups || []
                    for (let listNode of listItemGroups) {
                        const listItems = listNode.list_items
                        for (const item of listItems) {
                            if (item.heading_type == 'LOW') {
                                const itemText = item.text.text
                                if (itemText.indexOf('-') > -1 || itemText.indexOf(' to ') > -1) {
                                    let startDateArr = []
                                    if (itemText.indexOf('-') > -1) {
                                        startDateArr = itemText.split('-')
                                    } else {
                                        startDateArr = itemText.split(' to ')
                                    }
                                    aboutFieldInfo.start_date = startDateArr[0].trim()
                                    if (startDateArr[1]) {
                                        aboutFieldInfo.end_date = startDateArr[1].trim()
                                    }
                                } else {
                                    aboutFieldInfo.location = { name: itemText }
                                }
                            } else if (item.heading_type == 'MEDIUM') {
                                aboutFieldInfo.description = item.text.text
                            }
                        }
                    }
                    aboutInfos.work.push(aboutFieldInfo)
                }
            break
            case 'college':
            case 'secondary_school':
                if (!aboutInfos.education) {
                    aboutInfos.education = []
                }
                for (const node of nodes) {
                    if (!node.renderer.field) {
                        break
                    }
                    //$g.log.append('debug', JSON.stringify(node))
                    let schoolName = node.renderer.field.title.text
                    schoolName = schoolName.replace(/^Studied at /, '').replace(/^Studied /, '').replace(/^Went to /, '')
                    let aboutFieldInfo = {
                        school: {
                            name: schoolName
                        },
                        type: profileFieldsType
                    }
                    if (node.title.ranges[0]?.entity) {
                        aboutFieldInfo.school.id = node.title.ranges[0].entity.id
                    }
                    const listItems = node.renderer.field.list_item_groups[0]?.list_items || []
                    if (node.renderer.field.list_item_groups[0]?.list_items) {
                        for (const item of node.renderer.field.list_item_groups[0].list_items) {
                            //$g.log.append('debug', JSON.stringify(item))
                            const itemText = item.text.text
                            if (itemText.indexOf('studied') > -1) {
                                aboutFieldInfo.concentration = { name: itemText }
                            } else if (itemText.indexOf('Class') > -1) {
                                
                            } else if (itemText.indexOf('year') > -1) {
                                aboutFieldInfo.year = itemText
                            } else {
                                aboutFieldInfo.degree = { name: itemText }
                            }
                        }
                    }
                    if (node.renderer.field.list_item_groups[1]?.list_items) {
                        for (const item of node.renderer.field.list_item_groups[1].list_items) {
                            aboutFieldInfo.description = item.text.text
                        }
                    }
                    aboutInfos.education.push(aboutFieldInfo)
                }
            break
            case 'places_lived':
                for (const node of nodes) {
                    let placeInfo = {
                        name: node.renderer.field?.title?.text,
                        id: node.title.ranges[0]?.entity?.id
                    }
                    if (aboutInfos[node.field_type]) {
                        if (Array.isArray(aboutInfos[node.field_type])) {
                            aboutInfos[node.field_type].push(placeInfo)
                        } else {
                            aboutInfos[node.field_type] = [aboutInfos[node.field_type], placeInfo]
                        }
                    } else {
                        aboutInfos[node.field_type] = placeInfo
                    }
                }
            break
            case 'about_contact_info':
            case 'websites_and_social_links':
            case 'basic_info':
            case 'category':
            case 'transparency':
                for (const node of nodes) {
                    if (['null_state', 'admin_info', 'transparency_see_all'].indexOf(node.field_type) == -1) {
                        if (node.field_type == 'screenname' && node.list_item_groups[0]?.list_items[0]?.text?.text) {
                            node.field_type = node.list_item_groups[0].list_items[0].text.text.toLowerCase()
                        }
                        if (aboutInfos[node.field_type]) {
                            aboutInfos[node.field_type] = node.title.text + ' ' + aboutInfos[node.field_type]
                        } else {
                            aboutInfos[node.field_type] = node.title.text
                        }
                    }
                }
            break
            case 'relationship':
                if (nodes[0].field_type != 'null_state') {
                    if (nodes[0].list_item_groups[0]?.list_items[0]?.text?.text) {
                        const relationText = nodes[0].list_item_groups[0].list_items[0].text.text
                        aboutInfos.relationship = relationText
                        if (relationText.indexOf('Married') > -1) {
                            aboutInfos.marry = {
                                name: nodes[0].title.text,
                                id: nodes[0].title.ranges[0]?.entity?.id,
                                info: relationText
                            }
                        }
                    } else {
                        aboutInfos.relationship = nodes[0].renderer.field.text_content.text
                    }
                }
            break
            case 'family':
                let family = []
                for (const node of nodes) {
                    if (!node.list_item_groups[0]) {
                        continue
                    }
                    const member = {
                        name: node.title.text,
                        relationship: node.list_item_groups[0].list_items[0].text.text,
                        id: node.title.ranges[0]?.entity?.id
                    }
                    family.push(member)
                }
                if (family.length > 0) {
                    aboutInfos.family = family
                }
            break
            case 'about_me':
                if (nodes[0].field_type == 'about_me') {
                    aboutInfos.about_me = nodes[0].renderer.field.text_content.text
                }
            break
            case 'nicknames':
                let nicknames = []
                for (const node of nodes) {
                    if (node.field_type == 'null_state') {
                        continue
                    }
                    nicknames.push({
                        name: node.title.text,
                        type: node.list_item_groups[0]?.list_items[0]?.text?.text
                    })
                }
                if (nicknames.length > 0) {
                    aboutInfos.nicknames = nicknames
                }
            break
            case 'favorite_quotes':
            case 'privacy_policy_and_impressum':
                if (nodes[0] && nodes[0].field_type != 'null_state') {
                    aboutInfos[nodes[0].field_type] = nodes[0].renderer?.field?.text_content?.text
                }
            break
            default:
                //$g.log.append('debug', 'profileFieldsType:' + profileFieldsType)
                //$g.log.append('debug', 'nodes: ' + JSON.stringify(nodes))
        }
        /**
        for (const renderer of profileFields.profile_fields.nodes) {
            if (subFieldTypes.indexOf(renderer.field_type) > -1) {
                let aboutFieldInfo = {}
                let nodeFieldType = renderer.field_type
                if (!aboutInfos[nodeFieldType]) {
                    aboutInfos[nodeFieldType] = []
                }
                $g.log.append('field_type', renderer.field_type)
                if (renderer.field_type == 'education') {
                    //$g.log.append('debug', JSON.stringify(renderer))
                    let schoolName = renderer.renderer.field.title.text
                    schoolName = schoolName.replace(/^Studied at /, '').replace(/^Studied /, '').replace(/^Went to /, '')
                    aboutFieldInfo = {
                        school: {
                            name: schoolName
                        },
                        type: profileFieldsType
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        aboutFieldInfo.school.id = renderer.title.ranges[0].entity.id
                    }
                    const listItems = renderer.renderer.field.list_item_groups[0]?.list_items || []
                    for (const item of listItems) {
                        //$g.log.append('debug', JSON.stringify(item))
                        if (item.heading_type == 'LOW') {
                            const itemText = item.text.text
                            if (itemText.indexOf('studied') > -1) {
                                aboutFieldInfo.concentration = { name: itemText }
                            } else if (itemText.indexOf('Class') > -1) {

                            } else {
                                aboutFieldInfo.degree = { name: itemText }
                            }
                        }
                    }
                }
                if (['moved_city', 'current_city', 'hometown'].indexOf(renderer.field_type) > -1) {
                    aboutFieldInfo = {
                        name: renderer.renderer.field.title.text
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        entityId = renderer.title.ranges[0].entity.id
                        aboutFieldInfo.id = entityId
                    }
                }
                if (renderer.field_type == 'work') {
                    let positionName = renderer.title.text
                    //$g.log.append('debug', JSON.stringify(renderer))
                    let employerName = ''
                    if (positionName.indexOf(' at ') > -1) {
                        const textArr = renderer.title.text.split(' at ')
                        positionName = textArr[0].trim()
                        employerName = textArr[1].trim()
                    }
                    aboutFieldInfo = {
                        position: { name: positionName },
                        employer: { name: employerName }
                    }
                    const listItems = renderer.renderer.field.list_item_groups[0]?.list_items || []
                    for (const item of listItems) {
                        if (item.heading_type == 'LOW') {
                            const itemText = item.text.text
                            if (itemText.indexOf('-') > -1 || itemText.indexOf(' to ') > -1) {
                                let startDateArr = []
                                if (itemText.indexOf('-') > -1) {
                                    startDateArr = itemText.split('-')
                                } else {
                                    startDateArr = itemText.split(' to ')
                                }
                                aboutFieldInfo.start_date = startDateArr[0].trim()
                                if (startDateArr[1]) {
                                    aboutFieldInfo.end_date = startDateArr[1].trim()
                                }
                            } else {
                                aboutFieldInfo.location = { name: itemText }
                            }
                        }

                    }
                }
                if (renderer.field_type == 'family') {
                    aboutFieldInfo = {
                        name: renderer.renderer.field.title.text
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        aboutFieldInfo.id = renderer.title.ranges[0].entity.id
                    }
                }

                if (renderer.list_item_groups[0]?.list_items) {
                    for (const listItems of renderer.list_item_groups[0].list_items) {
                        if (listItems.heading_type == 'LOW') {
                            if (renderer.field_type == 'education') {
                                aboutFieldInfo.year = {
                                    name: listItems.text.text
                                }
                                if (listItems.text.ranges[0]?.entity) {
                                    aboutFieldInfo.year.id = renderer.text.ranges[0].entity.id
                                }
                            }
                        }
                        if (renderer.field_type == 'family') {
                            aboutFieldInfo.relationship = listItems.text.text
                        }
                    }
                }
                aboutInfos[nodeFieldType].push(aboutFieldInfo)
            }
        }
        */
    }
    for (const key in resultData) {
        if (key.startsWith('account_') && userFid == resultData[key].identity) {
            Object.assign(resultData[key], aboutInfos)
        }
    }
}

fbAboutAppSectionOther = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    //$g.log.append('debug', JSON.stringify(data))
    const edges = data.data?.node?.timeline_nav_app_sections?.edges || data.data?.timeline_nav_app_sections?.edges || []
    let userFid = ''
    let aboutInfos = {}
    for (const edge of edges) {
        const node = edge.node
        userFid = node.profile.id
        if (node.name == 'Likes') {
            aboutInfos.likes = node.all_collections.edges[0]?.node?.style_renderer?.collection?.items?.count || 0
            const items = node.all_collections.edges[0]?.node?.style_renderer?.collection?.pageItems?.edges || []
            if (!resultData.likes_page) {
                resultData.likes_page = {}
            }
            if (!resultData.likes_page[userFid]) {
                resultData.likes_page[userFid] = []
            }
            for (const item of items) {
                const node = item.node
                const info = {
                    id: node.node.id,
                    name: node.title.text,
                    picture: {
                        data: {
                            is_silhouette: false,
                            url: node.image.uri
                        }
                    },
                    link: node.url
                }
                resultData.likes_page[userFid].push(info)
            }
        } else if (node.name == 'Events') {
            if (node.all_collections?.edges[0]?.node?.style_renderer?.collection) {
                fbPageEventsParse(node.all_collections.edges[0].node.style_renderer.collection)
            }
        } else if (node.name == 'Groups') {
            if (node.all_collections?.edges[0]?.node?.style_renderer?.collection) {
                const collection = node.all_collections.edges[0].node.style_renderer.collection
                //$g.log.append('debug', JSON.stringify(collection))
                if (!resultData.page_groups) {
                    resultData.page_groups = []
                }
                for (const edge of collection.pageItems.edges) {
                    let node = edge.node.node
                    node.privacy_info = node.privacy_info?.title?.text || ''
                    resultData.page_groups.push(node)
                }
            }
        } else if (node.name == 'Friends') {
            if (!resultData.collections_maps) {
                resultData.collections_maps = {}
            }
            if (node.nav_collections?.nodes) {
                for (const tmpNode of node.nav_collections.nodes) {
                    let relation = 'friends_list'
                    switch (tmpNode.name) {
                        case 'All friends':
                            relation = 'friends_list'
                        break
                        case 'Followers':
                            relation = 'followers_list'
                        break
                        case 'Following':
                            relation = 'following_list'
                        break
                    }
                    resultData.collections_maps[tmpNode.id] = relation
                }
            }
            let data_id = node.all_collections?.edges[0]?.node?.id || 'key'
            const data_key = resultData.collections_maps[data_id] || 'friends_list'        
            if (!resultData[data_key]) {
                resultData[data_key] = []
            }
            const friendsEdges = node.all_collections?.edges[0]?.node?.style_renderer?.collection?.pageItems?.edges || []
            for (const edge of friendsEdges) {
                const node = edge.node
                if (node.node.__typename=='Photo' || node.node.__typename=='Album') {
                    continue
                }
                //$g.log.append('debug', JSON.stringify(node))
                const idStr = new Buffer.from(node.id, 'base64').toString()
                const accountFids = idStr.split(':')
                const accountFid = accountFids[1]
                let friend = {
                    account_fid: accountFid,
                    id: node.node.id,
                    name: node.title.text,
                    category: node.node.__typename,
                    url: node.node.url,
                    user_image_url: node.image.uri,
                    gender: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.gender,
                    user_name: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.short_name
                }
                resultData[data_key].push(friend)
            }
        }
    }
    for (const key in resultData) {
        if (key.startsWith('account_') && userFid == resultData[key].identity) {
            Object.assign(resultData[key], aboutInfos)
        }
    }
}

//主页活动
function fbPageEventsParse(collection) {
    //$g.log.append('debug', JSON.stringify(collection))
    if (collection.name == 'Upcoming') {
        if (!resultData.page_upcoming_events) {
            resultData.page_upcoming_events = []
        }
        for (const edge of collection.pageItems.edges) {
            resultData.page_upcoming_events.push(edge.node.node)
        }
    } else if (collection.name == 'Past') {
        if (!resultData.page_past_events) {
            resultData.page_past_events = []
        }
        for (const edge of collection.pageItems.edges) {
            resultData.page_past_events.push(edge.node.node)
        }
    }

}

function fbGroupInfoParse(group) {
    let aboutInfos = {}
    if (group.description_with_entities?.text) {
        aboutInfos.about = group.description_with_entities.text
    }
    if (group.group_purposes?.nodes[0]?.purpose_name) {
        aboutInfos.group_type = group.group_purposes.nodes[0].purpose_name
    }
    if (group.privacy_info?.label?.text) {
        aboutInfos.privacy = group.privacy_info.label.text
    }
    if (group.if_viewer_can_see_activity_section) {
        aboutInfos.member_count = group.if_viewer_can_see_activity_section.group_member_profiles?.count ? group.if_viewer_can_see_activity_section.group_member_profiles.count : 0
        if (group.group_member_profiles?.formatted_count_text) {
            aboutInfos.member_count = $g.createNumber(group.group_member_profiles.formatted_count_text)
        }
        aboutInfos.create_time = group.if_viewer_can_see_activity_section.created_time
        aboutInfos.number_of_posts_in_last_day = group.if_viewer_can_see_activity_section.number_of_posts_in_last_day || 0
        aboutInfos.number_of_posts_in_last_month = group.if_viewer_can_see_activity_section.number_of_posts_in_last_month || 0
        aboutInfos.group_new_member_profiles = group.if_viewer_can_see_activity_section.group_new_member_profiles?.count || 0
    }
    if (group.if_viewer_cannot_see_transparency_surface) {
        aboutInfos.group_history_summary = group.if_viewer_cannot_see_transparency_surface.group_history.group_history_summary.text
    }
    if (group.group_rules?.nodes) {
        const nodes = group.group_rules.nodes
        aboutInfos.group_cover_rules = {
            count: nodes.length,
            nodes: []
        }
        for (const node of nodes) {
            aboutInfos.group_cover_rules.nodes.push(
                {
                    id: node.id,
                    rule_title: node.rule_title,
                    description: node.description
                }
            )
        }
    }
    if (group.facepile_admin_profiles) {
        aboutInfos.group_cover_admin = {
            count: group.facepile_admin_profiles.count,
            nodes: []
        }
        for (const edge of group.facepile_admin_profiles.edges) {
            const node = edge.node
            aboutInfos.group_cover_admin.nodes.push({
                id: node.id,
                name: node.name,
                __typename: node.__typename,
                url: node.url,
                profile_picture: { uri: node.profile_picture.uri }
            })
        }
    }
    if (group.facepile_moderator_profiles) {
        aboutInfos.group_cover_moderators = {
            count: group.facepile_moderator_profiles.count,
            nodes: []
        }
        for (const edge of group.facepile_moderator_profiles.edges) {
            const node = edge.node
            aboutInfos.group_cover_moderators.nodes.push({
                id: node.id,
                name: node.name,
                __typename: node.__typename,
                url: node.url,
                profile_picture: { uri: node.profile_picture.uri }
            })
        }
    }
    return aboutInfos
}

exports.fbGroupAboutQuery = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const group = data.data.group
    const groupFid = group.id
    const aboutInfos = fbGroupInfoParse(group)

    for (const key in resultData) {
        if (key.startsWith('account_') && groupFid == resultData[key].identity) {
            Object.assign(resultData[key], aboutInfos)
        }
    }
}

exports.fbGroupHistoryQuery = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const group = data.data.group
    const groupFid = group.id
    let aboutInfos = {}
    const edges = group.group_history?.group_history_events?.edges || []
    aboutInfos.group_cover_history = []
    for (const edge of edges) {
        const node = edge.node
        if (node.title?.text) {
            aboutInfos.group_cover_history.push({
                body: node.body,
                group_history_summary: { text: node.title.text }
            })
        }
    }
    for (const key in resultData) {
        if (key.startsWith('account_') && groupFid == resultData[key].identity) {
            Object.assign(resultData[key], aboutInfos)
        }
    }
}

exports.fbFriendList = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    let edges = []

    if (data.data.node?.all_collections?.nodes[0]?.style_renderer?.__typename == 'TimelineAppCollectionAlbumsRenderer') {
        const edges = data.data.node.all_collections.nodes[0].style_renderer.collection.pageItems.edges
        if (edges) {
            fbUserAlbums(edges, data.data.user.id)
        }
        return
    }
    if (data.data.node.name == 'Events') {
        const collection = data.data.node.all_collections.nodes[0].style_renderer.collection
        fbPageEventsParse(collection)
        return
    }

    if (!resultData.collections_maps) {
        resultData.collections_maps = {}
    }
    if (data.data.node?.nav_collections?.nodes) {
        for (const node of data.data.node.nav_collections.nodes) {
            let relation = 'friends_list'
            switch (node.name) {
                case 'All friends':
                    relation = 'friends_list'
                break
                case 'Followers':
                    relation = 'followers_list'
                break
                case 'Following':
                    relation = 'following_list'
                break
            }
            resultData.collections_maps[node.id] = relation
        }
    }
    let data_id = data.data.node.id || 'key'
    if (data.data?.node?.pageItems?.edges) {
        edges = data.data.node.pageItems.edges
    } else if (data.data?.node?.all_collections?.nodes[0]?.style_renderer?.collection?.pageItems?.edges) {
        data_id = data.data.node.all_collections.nodes[0].style_renderer.collection.id
        edges = data.data.node.all_collections.nodes[0].style_renderer.collection.pageItems.edges
        if (data.data.node.name == 'Likes') {
            fbfristUserLikeList(edges, requestData)////个人用户点赞列表
            return;
        }
    }
    const data_key = resultData.collections_maps[data_id] || 'friends_list'
    if (!resultData[data_key]) {
        resultData[data_key] = []
    }
    for (const edge of edges) {
        const node = edge.node
        if (node.node.__typename=='Photo' || node.node.__typename=='Album') {
            continue
        }
        //$g.log.append('debug', JSON.stringify(node))
        const idStr = new Buffer.from(node.id, 'base64').toString()
        const accountFids = idStr.split(':')
        const accountFid = accountFids[1]
        let friend = {
            account_fid: accountFid,
            id: node.node.id,
            name: node.title.text,
            category: node.node.__typename,
            url: node.node.url,
            user_image_url: node.image.uri,
            gender: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.gender,
            user_name: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.short_name
        }
        resultData[data_key].push(friend)
    }
}

function fbUserAlbums(edges, fid) {
    if (!resultData.album_list) {
        resultData.album_list = []
    }
    const account = resultData[`account_${fid}`]
    for (const {node} of edges) {
        let album = {
            id: node.node.id,
            from: {
                name: account.account,
                id: account.identity,
                strong_id__: account.identity,
                __typename: account.page_type
            },
            album: {
                name: node.title.text,
                id: null,
                created_time: null
            },
            images: [],
            tags: []
        }
        resultData.album_list.push(album)
    }
}

exports.fbAlbumPhotos = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const albumFid = data.data.node.id
    const edges = data.data.node.grid_media?.edges || []
    let index = -1
    for (let i=0;i<resultData.album_list.length; i++) {
        if(resultData.album_list[i].id == albumFid) {
            index = i
            break;
        }
    }
    if (index == -1) {
        return
    } 
    for (const {node} of edges) {
        resultData.album_list[index].images.push({
            source: node.image.uri,
            width: node.image.width,
            height: node.image.height
        })
    }
}

exports.fbPageAlbums = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.page.pageAlbums.edges
    const fid = data.data.page.id
    if (!resultData.album_list) {
        resultData.album_list = []
    }
    const account = resultData[`account_${fid}`]
    for (const {node} of edges) {
        let album = {
            id: node.id,
            from: {
                name: account.account,
                id: account.identity,
                strong_id__: account.identity,
                __typename: account.page_type
            },
            album: {
                name: node.featurable_title.text,
                id: null,
                created_time: null
            },
            images: [],
            tags: []
        }
        resultData.album_list.push(album)
    }
}

exports.fbGroupAlbums = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.group.group_albums.edges
    const fid = data.data.group.id
    if (!resultData.album_list) {
        resultData.album_list = []
    }
    const account = resultData[`account_${fid}`]
    for (const {node} of edges) {
        let album = {
            id: node.id,
            from: {
                name: account.account,
                id: account.identity,
                strong_id__: account.identity,
                __typename: account.page_type
            },
            album: {
                name: node.title.text,
                id: null,
                created_time: null
            },
            images: [],
            tags: []
        }
        resultData.album_list.push(album)
    }
}

function parseFbAlbumPhotos(htmlStr) {
    const patternArr = [
        /"result":{"data":{"album":({.*?})},"extensions"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            const albumFid = data.id
            const edges = data.media?.edges || []
            let index = -1
            for (let i=0;i<resultData.album_list.length; i++) {
                if(resultData.album_list[i].id == albumFid) {
                    index = i
                    break;
                }
            }
            if (index == -1) {
                return
            } 
            for (const {node} of edges) {
                resultData.album_list[index].images.push({
                    source: node.image.uri,
                    width: node.image.width,
                    height: node.image.height
                })
            }
        }
    }
}

function parseFbYourPages(htmlStr){
    $g.log.append('process', 'parseFbYourPages')
    if (!resultData.admined_pages) {
        resultData.admined_pages = []
    }
    const patternArr = [
        /"admined_pages":({"count":\d+,"nodes".*?)}},"extensions"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            //$g.log.append('debug1', JSON.stringify(data))
            for(const node of data.nodes) {
                let info = {
                    type: 'classic',
                    page_fid: node.id,
                    name: node.name,
                    page_likers: node.page_likers.global_likers_count,
                    follower_count: node.follower_count,
                    profile_picture: node.profile_picture.uri
                }
                resultData.admined_pages.push(info)
            }
        }
    }
    
    const pattern1 = /"adp_CometSettingsDropdownListQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"viewer".*?}),"extensions"/
    const matchObj1 = htmlStr.match(pattern1)
    if (matchObj1 && matchObj1[1]) {
        const data = $g.$json_from_string(matchObj1[1])
        //$g.log.append('debug1', JSON.stringify(data))
        const actor = data.viewer.actor
        const profiles = actor.profiles
        for(const edge of profiles.edges){
            const node = edge.node.profile
            let info = {
                type: 'new',
                page_fid: node.id,
                delegate_page_id: node.delegate_page_id,
                name: node.name,
                profile_picture: node.profile_picture.uri
            }
            resultData.admined_pages.push(info)
        }
    }

    const pattern2 = /"adp_PagesCometPagesYouManageListQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj2 = htmlStr.match(pattern2)
    if (matchObj2 && matchObj2[1]) {
        const data = $g.$json_from_string(matchObj2[1])
        //$g.log.append('debug2', JSON.stringify(data))
        const pages = data.viewer.admined_pages.nodes
        for(const page of pages){
            const node = page.page_with_default_viewer
            let info = {
                type: 'classic',
                page_fid: node.id,
                name: node.name,
                profile_picture: node.profile_picture.uri
            }
            resultData.admined_pages.push(info)
        }
    }
    
    const pattern3 = /"adp_PagesCometLaunchpointUnifiedQueryPagesListRedesignedQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"viewer".*?}),"extensions"/
    const matchObj3 = htmlStr.match(pattern3)
    if (matchObj3 && matchObj3[1]) {
        const data = $g.$json_from_string(matchObj3[1])
        //$g.log.append('debug3', JSON.stringify(data))
        const actor = data.viewer.actor
        const profiles = actor.additional_profiles_with_biz_tools
        const classic_pages = actor.classic_pages
        const unpublished_pages = actor.unpublished_pages
        for(const edge of profiles.edges){
            const node = edge.node
            let info = {
                type: 'new',
                page_fid: node.id,
                delegate_page_id: node.delegate_page_id,
                name: node.name,
                profile_picture: node.profile_picture.uri
            }
            resultData.admined_pages.push(info)
        }
        if (classic_pages) {
            for(const edge of classic_pages.edges){
                const node = edge.node.page_with_default_viewer
                let info = {
                    type: 'classic',
                    page_fid: node.id,
                    name: node.name,
                    profile_picture: node.profile_picture.uri
                }
                resultData.admined_pages.push(info)
            }
        }
        for(const edge of unpublished_pages.edges){
            const node = edge.node
            let info = {
                type: 'unpublished',
                page_fid: node.id,
                name: node.name,
                profile_picture: node.profilePic40.uri
            }
            resultData.admined_pages.push(info)
        }
    }
    
}

exports.fbYourPageAjax = function(htmlStr, requestData) {
    if (!resultData.admined_pages) {
        resultData.admined_pages = []
    }
    const data = $g.$json_from_string(htmlStr)
    const actor = data.data.viewer.actor
    const profiles = actor.additional_profiles_with_biz_tools
    const classic_pages = actor.classic_pages
    const unpublished_pages = actor.unpublished_pages
    for(const edge of profiles.edges){
        const node = edge.node
        let info = {
            type: 'new',
            page_fid: node.id,
            delegate_page_id: node.delegate_page_id,
            name: node.name,
            profile_picture: node.profile_picture.uri
        }
        resultData.admined_pages.push(info)
    }
    for(const edge of classic_pages.edges){
        const node = edge.node.page_with_default_viewer
        let info = {
            type: 'classic',
            page_fid: node.id,
            name: node.name,
            profile_picture: node.profile_picture.uri
        }
        resultData.admined_pages.push(info)
    }
    for(const edge of unpublished_pages.edges){
        const node = edge.node
        let info = {
            type: 'unpublished',
            page_fid: node.id,
            name: node.name,
            profile_picture: node.profilePic40.uri
        }
        resultData.admined_pages.push(info)
    }
}

function parseGroupMembers(htmlStr){
    const pattern = /"adp_GroupsCometMembersRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({"group".*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    const html = {
        data: {
            node: data.group
        }
    }
    FbMembersListParse(JSON.stringify(html))
}

function FbMembersListParse(htmlStr, requestData){
    const node = $g.$json_from_string(htmlStr)
    let membersAll = {}
    let groupFid = ''
    if (node.data.node?.new_members) {
        membersAll.member = node.data.node.new_members.edges
        groupFid = node.data.node.id
    } else if (node.data?.groupnew_members) {
        membersAll.member = node.data.group.new_members.edges
        groupFid = node.data.group.id
    } else if (node.data.node?.new_forum_members) {
        membersAll.member = node.data.node.new_forum_members.edges
        groupFid = node.data.node.id
    }
    if (node.data.group?.group_admin_profiles) {
        groupFid = node.data.group.id
        if (node.data.group.group_admin_profiles) {
            membersAll.admin = node.data.group.group_admin_profiles.edges
        }
        if (node.data.group.new_forum_members) {
            membersAll.member = node.data.group.new_forum_members.edges
        }
        if (node.data.group.new_members) {
            membersAll.member = node.data.group.new_members.edges
        }
    }
    if (!resultData.members_list) {
        resultData.members_list = []
    }
    if (!resultData.group_manager) {
        resultData.group_manager = []
    }
    for (const role in membersAll) {
        for (const edge of membersAll[role]) {
            const node = edge.node
            for (const item of resultData.members_list) {
                if (item.id == node.id) {
                    continue
                }
            }
            const member = {
                id: node.id,
                name: node.name,
                url: node.url,
                role: role,
                group_id: groupFid,
                type: node.__typename,
                picture_url: node.profile_picture.uri,
                bio_text: { text: node.bio_text?.text || '' }
            }
            resultData.members_list.push(member)
        }
    }
    if (membersAll.admin) {
        for (const edge of membersAll.admin) {
            const node = edge.node
            for (const item of resultData.group_manager) {
                if (item.user_id == node.id) {
                    continue
                }
            }
            const member = {
                group_id: groupFid,
                admin_type: 'ADMIN',
                user: {
                    id: node.id,
                    name: node.name,
                    picture: {
                        data: {
                            url: node.profile_picture.uri
                        }
                    },
                    link: node.url,
                    type: node.__typename
                },
                user_id: node.id,
                name: node.name
            }
            resultData.group_manager.push(member)
        }
    }
}

exports.FbMembersList = function (htmlStr, requestData) {
    FbMembersListParse(htmlStr, requestData)
}

//个人用户点赞列表
exports.fbUserLikeList = function (htmlStr, requestData) {
    let nodes = $g.$json_from_string(htmlStr)
    let pageItems = nodes.data.node.pageItems.edges
    fbfristUserLikeList(pageItems, requestData)
}
function fbfristUserLikeList(pageItems, requestData) {
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user

    if (!resultData.like_lists) {
        resultData.like_lists = []
    }
    for (const edge in pageItems) {
        let node = pageItems[edge].node
        let like_Lists = {
            account_fid: userFid,
            id: node.node.id,
            name: node.title.text,
            profile_url: node.url,
            user_image_url: node.image.uri,
        }
        resultData.like_lists.push(like_Lists)
    }
}

//群组话题
const parseFbGroupHastags = function (htmlStr, requestData) {
    const pattern = /"group_hashtags_with_filter":({.*?})}},"extensions"/
    matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    $g.log.append('fbDocument', 'group hastags')
    if (data.hashtag_query?.edges) {
        const edges = data.hashtag_query.edges
        saveFbGroupHastags(edges)
    }
}
exports.fbGroupHastagsParse = function (htmlStr, requestData) {
    const lines = htmlStr.split("\n")
    const data = $g.$json_from_string(lines[0])
    let edges = []
    if (data.data?.group?.group_hashtags_with_filter?.hashtag_query?.edges) {
        edges = data.data.group.group_hashtags_with_filter.hashtag_query.edges
    }
    if (data.data?.node?.group_hashtags_with_filter?.hashtag_query?.edges) {
        edges = data.data.node.group_hashtags_with_filter.hashtag_query.edges
    }
    saveFbGroupHastags(edges)
}
const saveFbGroupHastags = function(edges) {
    if (!resultData.group_topics) {
        resultData.group_topics = []
    }
    for (const item of edges) {
        const node = item.node
        const topic = {
            id: node.id,
            tag: node.tag,
            tagged_post_count: node.tagged_post_count,
            group: {
                id: node.group.id
            },
            typename: node.__typename
        }
        resultData.group_topics.push(topic)
    }
}

exports.fbGroupEventsParse = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    let edges = []
    if (data.data?.group?.upcoming_events?.edges) {
        edges = data.data.group.upcoming_events.edges
        fbGroupEventsParseOne(edges, 'group_upcoming_events')
    }
    if (data.data?.group?.past_events?.edges) {
        edges = data.data.group.past_events.edges
        fbGroupEventsParseOne(edges, 'group_past_events')
    }
    if (data.data?.node?.past_events?.edges) {
        edges = data.data.node.past_events.edges
        fbGroupEventsParseOne(edges, 'group_past_events')
    }
}

function fbGroupEventsParseOne (edges, key) {
    if (!resultData[key]) {
        resultData[key] = []
    }
    for (const item of edges) {
        //$g.log.append('debug', JSON.stringify(item))
        const node = item.node
        const event = {
            id: node.id,
            created_for_group: {
                id: node.created_for_group?.id,
                typename: node.created_for_group?.__typename
            },
            event_creator: {
                typename: node.event_creator.__typename,
                id: node.event_creator.id,
                url: node.event_creator.url,
                name: node.event_creator.name
            },
            eventUrl: node.eventUrl,
            name: node.name,
            day_time_sentence: node.day_time_sentence,
            cover_photo: {
                url: node.cover_photo?.photo?.small_image?.uri || ''
            },
            url: node.url,
            typename: node.__typename
        }
        resultData[key].push(event)
    }
}

exports.fbProfileHobbies = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const userFid = data.data.user.id
    const edgesHobby = data.data.user.profile_intro_card.hobby_list.edges
    let hobbyList = []
    for (const nodeHobby of edgesHobby) {
        const hobby = nodeHobby.node
        const itemHobby = {
            id: hobby.id,
            emoji: hobby.hobby_emoji,
            name: hobby.hobby_name.text
        }
        hobbyList.push(itemHobby)
    }
    for (const key in resultData) {
        if (key.startsWith('account_') && userFid == resultData[key].identity) {
            resultData[key].hobby = hobbyList
        }
    }
    
}
exports.fbUserFriendsCountQuery = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const userFid = data.data.node.id
    const info = data.data.node.profile_tile_sections.edges[0].node
    if (info.profile_tile_section_type == 'FRIENDS' && info.subtitle) {
        let friendsCount = info.subtitle.text.replace(' Friends', '').replace(' friends', '')
        friendsCount = $g.createNumber(friendsCount)
        for (const key in resultData) {
            if (key.startsWith('account_') && userFid == resultData[key].identity) {
                resultData[key].friends = friendsCount
            }
        }
        if (resultData.profiles_list) {
            for (const profile of resultData.profiles_list){
                if (profile.id == userFid) {
                    profile.friends = friendsCount
                }
            }
        }
    }
}
exports.fbAccountInfo= function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const info = data.data.viewer_groups_tab_log_group_visit.group_bookmark
    
}
const parseFbUserLikeListHtml = function (htmlStr, requestData) {
    let groupInfo = {}
    const pattern = /"adp_ProfileCometTopAppSectionQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"node".*?"extra_context":null})}/
    const matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    // info = data.all_collections.nodes.style_renderer.collection.pageItems.edges
    if(data.all_collections?.nodes?.style_renderer?.collection?.pageItems?.edges){
        fbfristUserLikeList(pageItems, requestData)
    }
}
exports.fbRegisterData = function(htmlStr, requestData) {
    if (!resultData.targets) {
        resultData.targets = []
    }
    htmlStr = htmlStr.replace('for (;;);', '')
    const info = $g.$json_from_string(htmlStr)
    if (info.payload.error.__html) {
        resultData.targets.push({s:info.payload.error.__html, t:''})
    }
}

exports.fbProfileQuery = function(htmlStr, requestData) {
    if (!resultData.profiles_list) {
        resultData.profiles_list = []
    }
    const lines = htmlStr.split("\n")
    const data = $g.$json_from_string(lines[0])
    const user = data.data.user.profile_header_renderer.user
    let profile = {
        id: user.id,
        name: user.name,
        url: user.url,
        gender: user.gender,
        profile_picture: user.profilePicLarge.uri
    }
    resultData.profiles_list.push(profile)
    if(resultData.guid_account_info?.account_fid == user.id){
        const info = user
        const imageURL = info.profilePicLarge?.uri || info.profilePicMedium?.uri || info.profilePicSmall?.uri || info.profile_picture_for_sticky_bar?.uri || ''
        userInfo = {
            identity: info.id,
            page_type: 'User',
            home_url: info.url,
            account: info.name,
            nick: info.alternate_name,
            ui_image_url: imageURL,
            ui_image_id: info.profile_photo?.id,
            gender: info.gender,
            cover_image_url: info.cover_photo?.photo.image.uri,
            cover_image_id: info.cover_photo?.photo.id,
            verification_status: info.is_verified ? "BLUE_VERIFIED" : "NOT_VERIFIED"
        }
        if (info.profile_social_context?.content[0]?.text?.text && info.profile_social_context.content[0].text.text.indexOf("followers") !=-1) {
            const followers_count = info.profile_social_context.content[0].text.text.replace(' followers', '')
            userInfo.followers_count = $g.createNumber(followers_count)
        }else if (info.profile_social_context?.content[0]?.text?.text) {
            const friendCount = info.profile_social_context.content[0].text.text.replace(' Friends', '').replace(' friends', '')
            userInfo.friends = $g.createNumber(friendCount)
        }
        if (info.profile_social_context?.content[1]?.text?.text && info.profile_social_context.content[1].text.text.indexOf("following") !=-1) {
            const following_count = info.profile_social_context.content[1].text.text.replace(' following', '')
            userInfo.likes_count = $g.createNumber(following_count)
        }
        if (info.delegate_page?.id) {
            userInfo.origin_fid = info.delegate_page.id
        }
        //$g.log.append('debug', JSON.stringify(userInfo))
        const key = 'account_' + info.id
        resultData[key] = userInfo
    }
}

exports.fbProfileQueryAbout = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const user = data.data.user
    const fid = user.id
    let about = {}
    for (const edge of user.profile_tile_sections.edges) {
        const node = edge.node
        if (node.profile_tile_section_type == 'INTRO') {
            for (const introNode of node.profile_tile_views.nodes) {
                if (introNode.view_style_renderer?.view?.profile_tile_items?.nodes) {
                    for (const renderNode of introNode.view_style_renderer.view.profile_tile_items.nodes) {
                        if (renderNode.node?.timeline_context_item?.timeline_context_list_item_type) {
                            const type = renderNode.node.timeline_context_item.timeline_context_list_item_type
                            const title = renderNode.node.timeline_context_item.renderer.context_item.title.text
                            switch (type) {
                                case 'INTRO_CARD_RELATIONSHIP':
                                    about.relationship = title
                                    break;
                                case 'INTRO_CARD_CURRENT_CITY':
                                    about.city = title.replace('Lives in ', '')
                                    break;
                                case 'INTRO_CARD_HOMETOWN':
                                    about.home_town = title.replace('From ', '')
                                    break
                                case 'INTRO_CARD_EDUCATION':
                                    if (!about.education) {
                                        about.education = []
                                    } else {
                                        about.education = JSON.parse(about.education)
                                    }
                                    about.education.push(title.replace('Went to ', '').replace('Studied at ', ''))
                                    about.education = JSON.stringify(about.education)
                                    break
                                case 'INTRO_CARD_WORK':
                                    if (!about.work) {
                                        about.work = []
                                    } else {
                                        about.work = JSON.parse(about.work)
                                    }
                                    about.work.push(title.replace('Works at ', ''))
                                    about.work = JSON.stringify(about.work)
                                    break
                                case 'INTRO_CARD_FOLLOWERS':
                                    about.followers_count = title.replace('Followed by ', '').replace(' people', '')
                                    break
                                case 'INTRO_CARD_MEMBER_SINCE':
                                    about.created_since = title
                                    break
                                default:
                                    //$g.log.append('denug', title)
                                    //$g.log.append('node', JSON.stringify(renderNode))
                            }
                        }
                    }
                }
            }
        }
    }
    if (resultData.profiles_list) {
        for (const profile of resultData.profiles_list){
            if (profile.id == fid) {
                Object.assign(profile, about)
            }
        }
    }
}

exports.fbFriendRequestSuggestions = function(htmlStr, requestData) {
    if (!resultData.requests_list) {
        resultData.requests_list = []
    }
    if (!resultData.suggestions_list) {
        resultData.suggestions_list = []
    }
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user
    const data = $g.$json_from_string(htmlStr)
    const requestEdges = data.data.viewer.friend_requests?.edges || []
    for (const info of requestEdges) {
        const node = info.node
        const user = {
            account_fid: userFid,
            user_fid: node.id,
            name: node.name,
            url: node.url,
            profile_picture: node.profile_picture.uri,
            friendship_status: node.friendship_status,
            social_context: node.social_context.text
        }
        resultData.requests_list.push(user)
    }
    const pymkEdges = data.data.viewer.pymk_grid?.edges || []
    for (const info of pymkEdges) {
        const node = info.node
        const user = {
            account_fid: userFid,
            user_fid: node.id,
            name: node.name,
            url: node.url,
            profile_picture: node.profile_picture.uri,
            friendship_status: node.friendship_status,
            social_context: node.social_context.text
        }
        resultData.suggestions_list.push(user)
    }
}

exports.fbFriendRequest = function(htmlStr, requestData) {
    if (!resultData.requests_list) {
        resultData.requests_list = []
    }
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user
    const data = $g.$json_from_string(htmlStr)
    const viewer = data.data?.viewer || undefined
    if (!viewer) {
        return
    }
    let edges = []
    if (viewer.friending_possibilities?.edges) {
        edges = viewer.friending_possibilities.edges
    } else if (viewer.friend_requests?.edges) {
        edges = viewer.friend_requests.edges
    }
    for (const info of edges) {
        const node = info.node
        const user = {
            account_fid: userFid,
            request_time: info.time || 0,
            user_fid: node.id,
            name: node.name,
            url: node.url,
            profile_picture: node.profile_picture.uri,
            friendship_status: node.friendship_status,
            social_context: node.social_context.text
        }
        resultData.requests_list.push(user)
    }
}

exports.fbSuggestions = function(htmlStr, requestData) {
    if (!resultData.suggestions_list) {
        resultData.suggestions_list = []
    }
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.viewer.people_you_may_know.edges
    for (const info of edges) {
        const node = info.node
        const user = {
            account_fid: userFid,
            user_fid: node.id,
            name: node.name,
            url: node.url,
            profile_picture: node.profile_picture.uri,
            friendship_status: node.friendship_status,
            social_context: node.social_context.text
        }
        resultData.suggestions_list.push(user)
    }
}

exports.fbFriendRequestConfirm = function(htmlStr, requestData) {
    if (!resultData.friend_request_confirm) {
        resultData.friend_request_confirm = []
    }
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user
    const data = $g.$json_from_string(htmlStr)
    if (data.data?.friend_request_accept?.friend_requester) {
        const info = data.data.friend_request_accept.friend_requester
        const item = {
            account_fid: userFid,
            user_fid: info.id,
            friendship_status: info.friendship_status
        }
        resultData.friend_request_confirm.push(item)
    }
}

exports.fbFriendRequestSend = function(htmlStr, requestData) {
    if (!resultData.friend_request_send) {
        resultData.friend_request_send = []
    }
    let postData = {}
    const postDataStr = requestData.postData
    const postArr = postDataStr.split('&')
    for (const item of postArr) {
        const arr = item.split('=')
        postData[arr[0]] = arr[1]
    }
    const userFid = postData.__user
    const data = $g.$json_from_string(htmlStr)
    if (data.data?.friend_request_send?.friend_requestees && data.data.friend_request_send.friend_requestees[0]) {
        const info = data.data.friend_request_send.friend_requestees[0]
        const item = {
            account_fid: userFid,
            user_fid: info.id,
            friendship_status: info.friendship_status
        }
        resultData.friend_request_send.push(item)
    }
}

exports.fbStoryCreate = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    if (data.data?.story_create) {
        const story = data.data.story_create
        let postID = story.post_id
        resultData.fb_create_story = story
        if (story.story_id) {
            let idStr = new Buffer.from(story.story_id, 'base64').toString()
            idStr = idStr.replace('S:_I', '')
            const postFids = idStr.split(':')
            const pageFid = postFids[0]
            const postFid = postFids[1]
            resultData.fb_create_story.page_id = pageFid
            resultData.fb_create_story.post_id = postFid

        }
        const url = data.data.story_create.story?.url || ''
        resultData.fb_create_story.url = url
        
    }
}

exports.fbChangePassword = function(htmlStr, requestData) {
    resultData.fb_change_password = {
        change: true
    }
}

exports.FbPageTopFans = function(htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const page_fid = data.data.node?.id
    const edges = data.data.node?.top_fans.edges || []
    if (!resultData.top_fans) {
        resultData.top_fans = []
    }
    for(const edge of edges) {
        let info = edge.node.fan
        if (info) {
            info.creator_id = page_fid
            info.badge_type = 'top_fan'
            resultData.top_fans.push(info)
        }
    }
}

function parseFbPageAdminRoles(htmlStr){
    $g.log.append('process', 'parseFbPageAdminRoles')
    if (!resultData.page_roles) {
        resultData.page_roles = []
    }
    const patternArr = [
        /existingOrPendingAdmins:(\[.*?,pendingChangeType:null}\])/
    ]
    for(const pattern of patternArr){
        const matchObj = htmlStr.match(pattern)
        if(matchObj && matchObj[1]){
            const data = eval(matchObj[1])
            for(const node of data){
                const user = node.user
                let role = {
                    page_fid: node.pageID,
                    role_value: node.roleValue,
                    account_fid: user.id,
                    account_name: user.name,
                    gender: user.gender,
                    profile_pic_url: user.profilePicUrl,
                    is_invitation: node.isInvitation,
                    pending_change_type: node.pendingChangeType
                }
                resultData.page_roles.push(role)
            }
        }
    }
}


function FbPageAdminRolesAccess(htmlStr) {
    $g.log.append('process', 'FbPageAdminRolesAccess')
    if (!resultData.page_roles) {
        resultData.page_roles = []
    }
    const pattern1 = /"adp_CometProfilePlusAdminPermissionsRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj1 = htmlStr.match(pattern1)
    if (matchObj1 && matchObj1[1]) {
        const data = $g.$json_from_string(matchObj1[1])
        const pageFid = data.viewer.actor.id
        const edges = data.viewer.actor.core_app_admins_for_additional_profile.edges
        for(const edge of edges) {
            const node = edge.node
            let role = {
                page_fid: pageFid,
                role_value: 0,
                account_fid: node.admin_profile.id,
                account_name: node.admin_profile.name,
                //gender: user.gender,
                profile_pic_url: node.admin_profile.profile_picture.uri,
                //is_invitation: node.isInvitation,
                pending_change_type: ''
            }
            resultData.page_roles.push(role)
        }
        const pendingEdges = data.viewer.actor.outgoing_core_app_admin_invites || []
        for(const node of pendingEdges) {
            let role = {
                page_fid: pageFid,
                role_value: 0,
                account_fid: node.admin_profile.id,
                account_name: node.admin_profile.name,
                //gender: user.gender,
                profile_pic_url: node.admin_profile.profile_picture.uri,
                //is_invitation: node.isInvitation,
                pending_change_type: 'pending'
            }
            resultData.page_roles.push(role)
        }
    }
}

function parseFbEvent(htmlStr){
    $g.log.append('process', 'parseFbEvent')
    let eventData = {}
    let eventAbout = {}
    const pattern1 = /"adp_EventCometPermalinkHeaderQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj1 = htmlStr.match(pattern1)
    if (matchObj1 && matchObj1[1]) {
        eventData = $g.$json_from_string(matchObj1[1])
        eventData = eventData.event
    }
    const pattern2 = /"adp_PublicEventCometAboutRootQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj2 = htmlStr.match(pattern2)
    if (matchObj2 && matchObj2[1]) {
        eventAbout = $g.$json_from_string(matchObj2[1])
        eventAbout = eventAbout.event
    }
    let timezone = ''
    const patternTimezone = /{"server_time":.*?}/
    const timezoneObj = htmlStr.match(patternTimezone)
    if (timezoneObj && timezoneObj[1]) {
        const timezoneInfo = $g.$json_from_string(timezoneObj[1])
        timezone = timezoneInfo.timezone
    }
    //$g.log.append('debug event_data', JSON.stringify(eventData))
    //$g.log.append('debug event_about', JSON.stringify(eventAbout))
    let event_hosts_edges = []
    for (let node of eventAbout.event_hosts_that_can_view_guestlist || []) {
        event_hosts_edges.push({node})
    }
    let is_child_event = false
    if (eventAbout.parent_event) {
        is_child_event = true
    }
    let event = {
        id: eventData.id,
        name: eventData.name,
        event_place: eventData.event_place,
        eventProfilePicture: {
            uri: eventData.cover_media_renderer?.cover_photo?.photo?.image.uri
        },
        start_timestamp: eventData.start_timestamp,
        start_timestamp_for_display: eventData.start_timestamp,
        parent_event: eventAbout.parent_event,
        child_events: eventData.parent_if_exists_or_self.child_events,
        has_child_events: eventAbout.can_view_friends_card?.event?.has_child_events,
        can_viewer_change_child_watch_status: false,
        upcoming_child_events_count: 0,
        end_timestamp: 0,
        end_timestamp_for_display: 0,
        timezone: timezone,
        is_all_day: false,
        can_viewer_change_guest_status: true,
        connection_style: eventData.rsvp_button_renderer.event.connection_style,
        viewer_has_pending_invite: eventData.parent_if_exists_or_self.viewer_has_pending_invite,
        viewer_guest_status: eventData.viewer_guest_status,
        viewer_watch_status: eventData.viewer_watch_status,
        scheduled_publish_timestamp: eventData.utc_scheduled_publish_timestamp,
        cover_photo: eventData.cover_media_renderer?.cover_photo,
        is_event_draft: eventData.is_event_draft,
        __typename: eventData.__typename,
        strong_id__: eventData.id,
        event_hosts: {edges: event_hosts_edges},
        event_connection_data_selected_or_default_privacy: {},
        is_viewer_host: eventData.parent_if_exists_or_self.is_viewer_host,
        is_viewer_admin: eventData.is_viewer_admin,
        can_viewer_invite: eventData.can_viewer_invite,
        can_viewer_edit: eventData.can_viewer_edit,
        can_viewer_delete: false,
        can_viewer_save: false,
        can_viewer_share: eventData.can_viewer_share,
        can_viewer_see_promote_button: false,
        can_viewer_report: true,
        can_viewer_export: false,
        can_viewer_rsvp: true,
        can_viewer_set_notification: false,
        can_viewer_create_post: false,
        can_viewer_have_ads_creation_permissions: false,
        can_viewer_create_repeat_event: eventData.can_viewer_create_repeat_event,
        default_actor: {},
        event_description: eventAbout.event_description,
        eventUrl: eventData.eventUrl,
        share_url: '',
        share_url_context: '',
        event_promotion_status: 'INACTIVE',
        event_visibility_with_community: 'PAGE',
        can_guests_invite_friends: true,
        can_post_be_moderated: true,
        post_approval_required: false,
        can_share_room_link: false,
        only_admins_can_post: true,
        event_kind: eventData.event_kind,
        admin_setting: null,
        viewer_saved_state: 'NOT_SAVED',
        saved_collection: {},
        created_for_group: eventData.created_for_group,
        parent_group: eventData.parent_group,
        event_creator: eventData.event_creator,
        social_context: {text: eventAbout.can_view_friends_card?.event?.social_context?.text || ''},
        is_canceled: eventData.is_canceled,
        total_purchased_tickets: 0,
        viewer_inviters: eventData.parent_if_exists_or_self.viewer_inviters_connection.nodes,
        eventWatchersFriendFirst5: {count: 0},
        eventMaybesFriendFirst5: {count: 0},
        eventMembersFriendFirst5: {count: 0},
        eventMembersCount: {count: 0},
        eventMaybesCount: {count: 0},
        eventDeclinedCount: {count: 0},
        event_category_data: {},
        happens_on_single_day: true,
        event_buy_ticket_url: eventAbout.event_buy_ticket_url,
        tickets_type: 'ONSITE_TICKET',
        can_viewer_purchase_onsite_tickets: false,
        event_buy_ticket_display_url: null,
        event_buy_ticket_url_start_sales_time: null,
        event_buy_ticket_url_start_sales_time_string: null,
        day_time_sentence: eventData.day_time_sentence,
        time_range_sentence: '',
        creation_story: eventAbout.creation_story,
        event_frequency: eventData.parent_if_exists_or_self.event_frequency,
        ticket_settings: {nodes: []},
        is_edit_locked: false,
        pending_hosts: {nodes: []},
        can_viewer_see_edit_event_privacy_disclaimer: true,
        is_online: eventData.is_online,
        online_event_setup: eventData.online_event_setup,
        live_virtual_event_info: eventData.live_virtual_event_info,
        can_viewer_edit_online_setup: false,
        location: eventAbout.location,
        is_past: eventData.is_past,
        preview_social_context: {},
        is_child_event: is_child_event
    }
    const pageFid = eventData.event_creator.id || eventData.page_as_owner.id
    let pageType = 'user'
    if (eventData.event_creator.__typename == 'User'){
        pageType = 'user'
    } else if (eventData.event_creator.__typename == 'Page') {
        pageType = 'page'
    }

    if (event.is_past) {
        if(!resultData.activity_past) {
            resultData.activity_past = {}
            resultData.activity_past[pageType] = {
                id: pageFid,
                ownedAllPastEvents: []
            }
        }
        resultData.activity_past[pageType].ownedAllPastEvents.push(event)
    } else {
        if(!resultData.activity_future) {
            resultData.activity_future = {}
            resultData.activity_future[pageType] = {
                id: pageFid,
                ownedAllUpcomingEvents: []
            }
        }
        resultData.activity_future[pageType].ownedAllUpcomingEvents.push(event)
    }
}

function parsePageInsightsPost(htmlStr){
    if (!resultData.page_insights_post) {
        resultData.page_insights_post = []
    }
    $g.log.append('process', 'parsePageInsightsPost')
    const pattern = /"adp_CometProfileInsightsPostsMainCardQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        const data = $g.$json_from_string(matchObj[1])
        const edges = data.entity.content.edges
        for (const {node} of edges) {
            //$g.log.append('debug', JSON.stringify(node))
            const { entityInfo:info, entityInsights:insights } = node
            if (!info.story) {
                continue
            }
            let post = {
                page_fid: info.ownerID,
                post_fid: info.story.legacy_story_hideable_id,
                post_time: info.createdAt,
                message: info.title,
                picture: info.image?.uri,
                type: info.story.tofu_entity.entity_type,
                delegate_page_id: info.story.delegate_page_id,
                post_reach: insights.reach.value,
                post_engagement: insights.engagement.value
            }
            resultData.page_insights_post.push(post)
        }
    }
}

function parsePageInsightsInfo(htmlStr){
    $g.log.append('process', 'parsePageInsightsInfo')
    const pattern = /"adp_CometProfessionalDashboardInsightsHomeQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        const data = $g.$json_from_string(matchObj[1])
        //$g.log.append('debug', JSON.stringify(data))
        resultData.page_insights_info = {
            page_fid: data.viewer.actor.id,
            followers_count_accurate: data.tofu_entity.entity_insights.total_followers.value
        }
    }
}

function parsePageInsightsDashboard(htmlStr){
    $g.log.append('process', 'parsePageInsightsDashboard')
    const pattern = /"adp_CometProfessionalDashboardOverviewQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        const data = $g.$json_from_string(matchObj[1])
        //$g.log.append('debug', JSON.stringify(data))
        resultData.page_insights_info = {
            page_fid: data.node.id,
            followers_count_accurate: data.tofu_entity.entity_insights.total_followers.value
        }
    }
}

exports.fbPageInsightsAudience = function(htmlStr, requestData) {
    let data = $g.$json_from_string(htmlStr)
    if (data.data.tofu_entity) {
        data = data.data
        resultData.page_insights_audience = {
            page_fid: data.node.id,
            insights: data.tofu_entity.entity_insights
        }
    }
}

exports.fbPageInsights = function(htmlStr, requestData) {
    let data = $g.$json_from_string(htmlStr)
    if (data.data.tofu_entity) {
        data = data.data
        resultData.page_insights_info = {
            page_fid: data.viewer.actor?.id,
            total_followers: data.tofu_entity.entity_insights.total_followers.value
        }
    }
}

exports.fbPagePostInsights = function(htmlStr, requestData) {
    if (!resultData.insights_post_statistic) {
        resultData.insights_post_statistic = []
    }
    let data = $g.$json_from_string(htmlStr)
    if (data.data?.tofu_entity) {
        const insights = data.data.tofu_entity.entity_insights
        let post = {
            post_fid: data.data.node.legacy_story_hideable_id,
            post_reach: insights.reach.value,
            post_engagement: insights.engagement.value,
            post_impression: insights.impression.value,
            post_reactions: insights.reaction_total.value,
            post_comments: insights.comment.value,
            post_shares: insights.share.value,
            post_video_view_three_second: insights.video_view_three_second.value,
            post_other_click: 0,
            post_total_clicks: 0
        }
        if (insights.click.bucket_values) {
            for (let info of insights.click.bucket_values) {
                if (info.bucket_names.indexOf('PHOTO_CLICK') > -1) {
                    post.post_photo_click = info.bucket_value
                } else if (info.bucket_names.indexOf('OTHER_CLICK') > -1) {
                    post.post_other_click = info.bucket_value
                }
                post.post_total_clicks += info.bucket_value
            }
        }
        resultData.insights_post_statistic.push(post)
    }
}

exports.FbPageInsightsPostAjax = function(htmlStr, requestData) {
    if (!resultData.page_insights_post) {
        resultData.page_insights_post = []
    }
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.entity.content.edges
    for (const {node} of edges) {
        const { entityInfo:info, entityInsights:insights } = node
        if (!info.story) {
            continue
        }
        let post = {
            page_fid: info.ownerID,
            post_fid: info.story.legacy_story_hideable_id,
            post_time: info.createdAt,
            message: info.title,
            picture: info.image?.uri,
            type: info.story.tofu_entity.entity_type,
            delegate_page_id: info.story.delegate_page_id,
            post_reach: insights.reach.value,
            post_engagement: insights.engagement.value
        }
        resultData.page_insights_post.push(post)
    }
}

exports.FbPageAdminRolesNewStyle = function(htmlStr, requestData) {
    if (!resultData.page_roles) {
        resultData.page_roles = []
    }
    const data = $g.$json_from_string(htmlStr)
    const pageFid = data.data.viewer.actor.id
    const edges = data.data.viewer.actor.core_app_admins_for_additional_profile.edges
    //const owner = data.data.viewer.actor.additional_profile_owning_business
    for(const edge of edges) {
        const node = edge.node
        let role = {
            page_fid: pageFid,
            role_value: 0,
            account_fid: node.admin_profile.id,
            account_name: node.admin_profile.name,
            //gender: user.gender,
            profile_pic_url: node.admin_profile.profile_picture.uri,
            //is_invitation: node.isInvitation,
            //pending_change_type: node.pendingChangeType,
            pending_change_type: ''
        }
        resultData.page_roles.push(role)
    }
    const pendingEdges = data.viewer.actor.outgoing_core_app_admin_invites || []
    for(const node of pendingEdges) {
        let role = {
            page_fid: pageFid,
            role_value: 0,
            account_fid: node.admin_profile.id,
            account_name: node.admin_profile.name,
            //gender: user.gender,
            profile_pic_url: node.admin_profile.profile_picture.uri,
            //is_invitation: node.isInvitation,
            pending_change_type: 'pending'
        }
        resultData.page_roles.push(role)
    }
    /*
    if(owner) {
        let role = {
            page_fid: pageFid,
            account_fid: owner.id,
            account_name: owner.name,
            profile_pic_url: owner.profile_picture_url
        }
        resultData.page_roles.push(role)
    }
    */
}

//账号加入群组列表
function parseFbYourGroupsDoc(htmlStr) {
    if (!resultData.your_groups) {
        resultData.your_groups = []
    }
    const pattern = /"nonAdminGroups":({.*?}),"adminGroups"/
    matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const data = $g.$json_from_string(matchObj[1])
    const edges = data.groups_tab.tab_groups_list.edges
    for(const edge of edges){
        const node = edge.node
        const group = {
            group_fid: node.id,
            name: node.name,
            group_url: node.url,
            group_picture: node.profile_picture_48.uri,
            last_post_time: node.last_post_time || 0
        }
        resultData.your_groups.push(group)
    }
}

exports.fbYourGroupsAjax = function(htmlStr, requestData) {
    if (!resultData.your_groups) {
        resultData.your_groups = []
    }
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.viewer.groups_tab.tab_groups_list.edges
    for(const edge of edges){
        const node = edge.node
        const group = {
            group_fid: node.id,
            name: node.name,
            group_url: node.url,
            group_picture: node.profile_picture_48?.uri || '',
            last_post_time: node.last_post_time || 0
        }
        resultData.your_groups.push(group)
    }
}

function praseAccountCheckpoint(htmlStr) {
    $g.log.append('process', 'praseAccountCheckpoint')
    let accountFID = ''
    const accountPattern = /{"ACCOUNT_ID".*?}/
    const accountMatchObj = htmlStr.match(accountPattern)
    if (accountMatchObj && accountMatchObj[0]) {
        const accountInfo = $g.$json_from_string(accountMatchObj[0])
        accountFID = accountInfo.ACCOUNT_ID
    }
    const pattern = /"adp_UFACAppQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        const data = $g.$json_from_string(matchObj[1])
        const state = data.ufac_client.state
        let disable_date = state.disable_date
        disable_date = disable_date? disable_date.replace('on ', '') : ''
        const accountCheckpoint = {
            account_fid: accountFID,
            user_name: state.user_name,
            disable_date: disable_date,
            days_remaining_title: state.days_remaining_title,
            button_text: state.button_label
        }
        resultData.account_checkpoint = accountCheckpoint
    } else {
        const pattern = /"adp_EpsilonAppQueryRelayPreloader_[0-9a-z]+",{"__bbox":{"complete":.*?,"result":{"data":({.*?}),"extensions"/
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            const screen = data.epsilon_checkpoint.screen
            const actor = data.viewer.actor
            let disable_date = screen.info_box.heading
            if (disable_date.indexOf('Account locked ') != -1) {
                disable_date = disable_date.replace('Account locked ', '')
            } else {
                const datePattern = /locked your account on (.*?)\./
                const dateMatchObj = screen.description.match(datePattern)
                if(dateMatchObj && dateMatchObj[1]){
                    disable_date = dateMatchObj[1]
                }
            }
            const accountCheckpoint = {
                account_fid: accountFID,
                user_name: actor.name,
                disable_date: disable_date,
                days_remaining_title: screen.description,
                button_text: screen.button_text
            }
            resultData.account_checkpoint = accountCheckpoint
        }
    }
}

exports.fbDocumentDataParse = function (htmlStr, requestData) {
    const { url } = requestData
    //$g.log.append('url', url)
    if(url.match(/groups\/[a-zA-Z0-9]+\/user/)){
        parseFbGroupUserPostList(htmlStr, url)
    }else if(url.match(/media\/set\/\?set=/)){
        parseFbAlbumPhotos(htmlStr);
    }else if(url.match(/pages\/\?category=your_pages/)){
        parseFbYourPages(htmlStr)
    }else if(url.match(/tab=admin_roles&/)){
        parseFbPageAdminRoles(htmlStr)
    }else if(url.match(/groups\/feed/)){
        parseFbYourGroupsDoc(htmlStr)
    }else if(url.match(/tab=profile_access/)){
        FbPageAdminRolesAccess(htmlStr)
    }else if(url.match(/\/events\//)){
        parseFbEvent(htmlStr)
    }else if(url.match(/professional_dashboard\/insights\/posts/)){
        parsePageInsightsPost(htmlStr)
    }else if(url.match(/professional_dashboard\/insights/)){
        parsePageInsightsInfo(htmlStr)
    }else if(url.match(/professional_dashboard/)){
        parsePageInsightsDashboard(htmlStr)
    }else if(url.match(/\/watch\//)){
        parseFbWatchVideoPostDoc(htmlStr)
    }else if(url.match(/\/checkpoint\//)){
        praseAccountCheckpoint(htmlStr)
    }else if(url.match(/\/members/)){
        parseGroupMembers(htmlStr)
    }else{
        parsefbAccountInfo(htmlStr, requestData)
        parseFbPostList(htmlStr)
        parseFbGroupSearchPostList(htmlStr)
        parseFbSinglePost(htmlStr, requestData)
        parseFbPostComments(htmlStr)
        parseFbPageGroups(htmlStr)
        parseFbSearchPost(htmlStr)
        parseFbPageMembers(htmlStr)
        parseFbGroupHastags(htmlStr)
        parseFbUserLikeListHtml(htmlStr)
    }
}