/**
 * Data parse function, get data to {dataEx:{}}
 * every export function (suffix is DataParse) is a parse functions
 */
$g = null
parseOptions = null
resultData = {}

exports.dataParseInitData = function (_$g, _parseOptions) {
    $g = _$g
    parseOptions = _parseOptions
}

exports.getParseResultData = function () {
    return { resultData }
}

exports.fbDocumentDataParse = function (htmlStr, requestData) {
    parsefbAccountInfo(htmlStr, requestData)
    parseFbPostList(htmlStr)
    parseFbGroupSearchPostList(htmlStr)
    parseFbSinglePost(htmlStr,requestData)
    parseFbPostComments(htmlStr)
    parseFbPageGroups(htmlStr)
    parseFbSearchPost(htmlStr)
    parseFbPageMembers(htmlStr)
}

const getUniqidKey = function () {
    return new Date().getTime() + '_' + $g.math.random(10000)
}

const parsefbAccountInfo = function (htmlStr, requestData) {
    const pattern = /"rootView":({.*?}})/
    matchObj = htmlStr.match(pattern)
    if (!matchObj || !matchObj[1]) {
        return
    }
    const rootView = $g.$json_from_string(matchObj[1])
    if (rootView && rootView['props']) {
        rootProps = rootView['props']
        info = null
        if (rootProps.pageID) {
            info = parseFbPageInfo(htmlStr, rootProps.pageID)
        } else if (rootProps.userID) {
            info = parseFbUserInfo(htmlStr, rootProps.userID)
        } else if (rootProps.groupID) {
            info = parseFbGroupInfo(htmlStr, rootProps.groupID)
        }
        if (info && JSON.stringify(info) != '{}') {
            const key = 'account_' + getUniqidKey()
            resultData[key] = info
        } else if (rootProps['title']) {
            const title = rootProps['title']
            if (title.indexOf("isn't available right now") > -1) {
                const key = 'not_available_' + getUniqidKey()
                resultData[key] = { url: requestData['url'] }
            }
        }
    }
}

const parseFbPageInfo = function (htmlStr, fid) {
    let pageInfo = {}
    const patternArr = [
        /"result":{"data":{"page":({"show_user_message_prompt".*?})},"extensions":/,
        /"result":{"data":{"viewer":{"chat_tabs_turned_off":.*?},"page":({"show_user_message_prompt".*?})},"extensions":/,
        /"result":{"data":{"page":({"__isProfile".*?})},"extensions":/,
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const info = $g.$json_from_string(matchObj[1])
            if (info && info.id && info.id === fid) {
                pageInfo = {
                    identity: fid,
                    page_type: 'Page',
                    home_url: info.url,
                    account: info.name,
                    nick: info.username,
                    ui_image_url: info.profile_picture?.uri,
                    category: info.category_name,
                    verification_status: info.verification_status,
                    cover_image_url: info.comet_page_cover_renderer.content[0].photo.image.uri,
                    cover_image_id: info.comet_page_cover_renderer.content[0].photo.id
                }
                break
            }
        }
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
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const info = $g.$json_from_string(matchObj[1])
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
                if (info.profile_social_context?.content[0]?.text?.text) {
                    const friendCount = info.profile_social_context.content[0].text.text.replace(' Friends', '')
                    userInfo.friends = $g.createNumber(friendCount)
                }
            }
        }
    }
    return userInfo
}

const parseFbGroupInfo = function (htmlStr, fid) {
    let groupInfo = {}
    const patternArr = [
        /"group":({"id".*?}),"viewer"/,
        /"result":{"data":{"group":({"viewer_layout_renderer".*?}),"viewer":/,
        /"result":{"data":{"group":({"viewer_layout_renderer".*?})},"extensions":/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            let info = $g.$json_from_string(matchObj[1])
            if (info.profile_header_renderer) {
                info = info.profile_header_renderer.group
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
                imageUrl = ''
                imageFid = ''
                //$g.log.append('debug', JSON.stringify(info))
                if (info.cover_renderer?.cover_photo_content?.photo?.image?.uri) {
                    imageUrl = info.cover_renderer.cover_photo_content.photo.image.uri
                    imageFid = info.cover_renderer.cover_photo_content.photo.id
                } else if (info.profile_picture?.uri) {
                    imageUrl = info.profile_picture.uri
                } else if (info.profile_picture_for_sticky_bar?.uri) {
                    imageUrl = info.profile_picture_for_sticky_bar.uri
                }
                groupInfo = {
                    identity: fid,
                    page_type: 'Group',
                    home_url: info.url,
                    account: info.name,
                    ui_image_url: imageUrl,
                    ui_image_id: imageFid,
                    followers_count: 0,
                    privacy: '',
                    member_count: memberCount,
                    about: '',
                    group_type: ''
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
    const patternArr = [
        /"timeline_feed_units":({"edges".*?}})}},"extensions"/,
        /"timeline_list_feed_units":({"edges".*?})}},"extensions"/,
        /"group_feed":{"edges":(.*?)},"group_address"/,
        /"data":{"group":(.*?)},"group_locations"/,
        /"data":{"group":(.*?)},"extensions"/
    ]
    let postList = []
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
        postList.push(post)
    }
    if (postList.length > 0) {
        const key = 'post_' + getUniqidKey()
        resultData[key] = postList
    }
}

const parseFbGroupSearchPostList = function (htmlStr) {
    let postList = []
    const pattern = /"adp_SearchCometResultsInitialResultsQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"serpResponse".*?"extra_context":null})}/
    const matchObj = htmlStr.match(pattern)
    if (matchObj && matchObj[1]) {
        // $g.log.append('parseFbGroupSearchPostList', 'match ...')
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
        const key = 'search_group_post_' + getUniqidKey()
        resultData[key] = postList
    }
}

const parseFbSinglePost = function (htmlStr, requestData) {
    const patternArr = [
        /"adp_CometSinglePostContentQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"node".*?"extra_context":null})}\]\],\[/,
        /"adp_CometGroupPermalinkRootFeedQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"group".*?"extra_context":null})}\]\],\[/,
        /"adp_CometGroupPermalinkRootContentFeedQueryRelayPreloader_[0-9a-z]+",{"__bbox":({"complete":.*?,"result":{"data":{"group".*?"extra_context":null})}\]\],\[/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            // $g.log.append('parseFbSinglePost', 'match ...')
            const data = $g.$json_from_string(matchObj[1])
            const node = data.result.data.node
            const post = parseFbPostInfo(node)
            const key = 'single_post_' + getUniqidKey()
            resultData[key] = [post]
            break;
        }
    }
    if (requestData['url'].indexOf('videos') > -1) {
        const post = parseFbVideoPostInfo(htmlStr)
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
        const profile = searchFbProfileInfo(node)
        if (profile) {
            searchProfile.push(profile)
        }
    }
    if (searchProfile.length > 0) {
        const key = 'search_profile_' + getUniqidKey()
        resultData[key] = searchProfile
    }
    for (const node of edges_places) {
        const profile = searchFbPlaces(node)
        if (profile) {
            searchPlaces.push(profile)
        }
    }
    if (searchPlaces.length > 0) {
        const key = 'search_places_' + getUniqidKey()
        resultData[key] = searchPlaces
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
        const key = 'search_group_post_' + getUniqidKey()
        resultData[key] = postList
    }
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
        type: edges_profile.type,
    }
    return profile;
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
        postList.push(post)
    }
    if (postList.length > 0) {
        const key = 'post_' + getUniqidKey()
        resultData[key] = postList
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
        postList.push(post)
    }
    if (postList.length > 0) {
        const key = 'post_' + getUniqidKey()
        resultData[key] = postList
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
        postList.push(post)
    }
    if (postList.length > 0) {
        const key = 'post_' + getUniqidKey()
        resultData[key] = postList
    }
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

    const cometSections = node.comet_sections
    const metadatas = cometSections.context_layout.story.comet_sections.metadata || []
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
    const actor = cometSections.context_layout.story.comet_sections.actor_photo.story.actors[0]
    const feedbackTargetWithContext = cometSections.feedback.story.feedback_context.feedback_target_with_context
    //$g.log.append('post data:', JSON.stringify(feedbackTargetWithContext))
    let feedback = {}
    if (feedbackTargetWithContext) {
        if (feedbackTargetWithContext.comet_ufi_summary_and_actions_renderer) {
            feedback = feedbackTargetWithContext.comet_ufi_summary_and_actions_renderer.feedback
        } else if (feedbackTargetWithContext.ufi_renderer) {
            feedback = feedbackTargetWithContext.ufi_renderer.feedback.comet_ufi_summary_and_actions_renderer.feedback
        }
    }
    canViewerComment = 'n'
    canViewerReact = 'y'
    if (feedbackTargetWithContext?.ufi_renderer) {
        canViewerComment = feedbackTargetWithContext.ufi_renderer.feedback.can_viewer_comment ? 'y' : 'n'
    }
    let { picture, video } = parsePostAttachements(cometSections.content)
    pictureStr = picture.join("\n")

    // 原贴发帖人信息
    shareUserFid = ''
    shareUserName = ''
    shareUserProfileImageUrl = ''
    sharePostTimestamp = ''
    if (node.attached_story) {
        const attached_story = node.attached_story.comet_sections.context_layout.story.comet_sections.actor_photo.story.actors[0]
        shareUserFid = attached_story.id
        shareUserName = attached_story.name
        shareUserProfileImageUrl = attached_story.profile_picture.uri
        sharePostTimestamp = node.attached_story.comet_sections.context_layout.story.comet_sections.metadata[0].story.creation_time
    } else if (cometSections.content.story.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        const attached_story = cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target
        shareUserFid = attached_story.comet_sections.actor_photo.story.actors[0].id
        shareUserName = attached_story.comet_sections.actor_photo.story.actors[0].name
        sharePostTimestamp = attached_story.comet_sections.metadata[0].story.creation_time
        shareUserProfileImageUrl = attached_story.comet_sections.actor_photo.story.actors[0].profile_picture.uri
        if (attached_story.attachments[0].style_type_renderer.attachment.media.__typename == 'Video') {
            video = attached_story.attachments[0].style_type_renderer.attachment.media.playable_url
        }
    }

    // 原贴链接、原贴内容
    shareContent = ''
    shareLink = ''
    if (cometSections.content.story.comet_sections.attached_story) {
        const share_content_str = cometSections.content.story.comet_sections.attached_story.story.attached_story.comet_sections.attached_story_layout.story
        shareContent = share_content_str.message?.text || ''
        shareLink = share_content_str.comet_sections.metadata[0].story.url
    } else if (cometSections?.content?.story?.attachments[0]?.style_type_renderer?.attachment) {
        //$cometSections['content']['story']['attachments'][0]['style_type_renderer']['attachment']  转发外网链接
        const share_content_str = cometSections.content.story.attachments[0].style_type_renderer.attachment
        shareContent = share_content_str.title_with_entities?.text | ''
        shareLink = share_content_str.story_attachment_link_renderer?.attachment.web_link.url | ''
    } else if (cometSections?.content?.story?.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        const share_content_str = cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target
        shareContent = share_content_str.message.text
        shareLink = share_content_str.comet_sections.metadata[0].story.url
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
    } else if (cometSections.content.story?.attachments[0]?.style_type_renderer?.attachment_target_renderer) {
        sharePostStr = new Buffer.from(cometSections.content.story.attachments[0].style_type_renderer.attachment_target_renderer.attachment.target.id, 'base64').toString()
    }
    const sharePostFidArr = sharePostStr.split(':')
    if (sharePostFidArr.length > 1) {
        sharePostFid = sharePostFidArr[sharePostFidArr.length - 1]
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
        category_type: actor.category_type,
        url: postUrl,
        post_time: $g.$time(postTimestamp, 's'),
        content_type: node.__typename,
        content: content,
        image_in_content_url: pictureStr,
        video: video,
        is_share: isShare,
        share_user_iid: shareUserFid,
        share_post_iid: sharePostFid,
        share_link: shareLink,
        share_user_name: shareUserName,
        share_content: shareContent,
        share_image_in_content_url: shareImageInContentUrl,
        share_video: shareVideo,
        share_user_profile_image_url: shareUserProfileImageUrl,
        share_post_timestamp: sharePostTimestamp,
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
        tag: tagStr
    }
    if (node.feedback?.associated_group?.id) {
        post.group_fid = node.feedback.associated_group.id
    }
    const postFeedbackInfo = parsePostFeedbackInfo(feedback)
    Object.assign(post, postFeedbackInfo)
    return post;
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
    const lines = htmlStr.split("\n")
    let aboutInfos = {}
    const data = $g.$json_from_string(lines[0])
    const userFid = data.data.user.id
    const aboutAppSections = data.data.user.about_app_sections.nodes[0].activeCollections
    const profileFieldSections = aboutAppSections.nodes[0].style_renderer.profile_field_sections

    const fieldTypes = ['work', 'college', 'high school', 'relationship', 'family members', 'places lived']
    const subFieldTypes = ['education', 'work', 'family', 'moved_city', 'current_city']
    for (const profileFields of profileFieldSections) {
        let profileFieldsType = profileFields.field_section_type
        if (profileFields.title?.text) {
            profileFieldsType = profileFields.title.text
        }
        if (fieldTypes.indexOf(profileFieldsType.toLowerCase()) == -1) {
            continue
        }
        for (const renderer of profileFields.profile_fields.nodes) {
            if (subFieldTypes.indexOf(renderer.field_type) > -1) {
                let aboutFieldInfo = {}
                let nodeFieldType = renderer.field_type
                if (renderer.field_type == 'moved_city' || renderer.field_type == 'current_city') {
                    nodeFieldType = 'home_town'
                }
                if (!aboutInfos[nodeFieldType]) {
                    aboutInfos[nodeFieldType] = []
                }
                if (renderer.field_type == 'education') {
                    aboutFieldInfo = {
                        school: {
                            name: renderer.renderer.field.title.text
                        },
                        type: profileFieldsType
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        aboutFieldInfo.school.id = renderer.title.ranges[0].entity.id
                    }
                }
                if (renderer.field_type == 'moved_city' || renderer.field_type == 'current_city') {
                    aboutFieldInfo = {
                        name: renderer.renderer.field.title.text
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        entityId = renderer.title.ranges[0].entity.id
                        aboutFieldInfo.id = entityId
                    }
                }
                if (renderer.field_type == 'work') {
                    aboutFieldInfo = {
                        name: renderer.title.text
                    }
                    if (renderer.title.ranges[0]?.entity) {
                        aboutFieldInfo.id = renderer.title.ranges[0].entity.id
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
                            if (renderer.field_type == 'work') {
                                const startDateArr = listItems.text.text.split('-')
                                aboutFieldInfo.start_date = startDateArr[0]
                                let endTime = startDateArr[1].trim()
                                if (endTime == 'Present') {
                                    endTime = '0000-00'
                                }
                                aboutFieldInfo.end_date = endTime | '0000-00'
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
    }
    for (const key in resultData) {
        if (key.startsWith('account_') && userFid == resultData[key].identity) {
            Object.assign(resultData[key], aboutInfos)
        }
    }
}

exports.fbGroupAbout = function (htmlStr, requestData) {
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

exports.fbFriendList = function (htmlStr, requestData) {
    const data = $g.$json_from_string(htmlStr)
    const edges = data.data.node.pageItems.edges
    if (!resultData.friends_list) {
        resultData.friends_list = []
    }
    for (const edge of edges) {
        const node = edge.node
        let friend = {
            id: node.node.id,
            name: node.title.text,
            category: node.node.__typename,
            url: node.node.url,
            user_image_url: node.image.uri,
            gender: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.gender,
            user_name: node.actions_renderer.action?.client_handler.profile_action.restrictable_profile_owner.short_name
        }
        resultData.friends_list.push(friend)
    }
}

exports.FbMembersList = function (htmlStr, requestData) {
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
    }
    if (!resultData.members_list) {
        resultData.members_list = {}
    }
    for (const role in membersAll) {
        for (const edge of membersAll[role]) {
            const node = edge.node
            const member = {
                id: node.id,
                name: node.name,
                url: node.url,
                role: role,
                group_id: groupFid,
                type: node.__typename,
                picture_url: node.profile_picture.uri
            }
            resultData.members_list[node.id] = member
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
    const edges = data.data.node.reactors.edges
    if (!resultData.post_like_list) {
        resultData.post_like_list = []
    }
    for (const edge of edges) {
        const node = edge.node
        let likelist = {
            id: node.id,
            name: node.name,
            type: node.__typename,
            link: node.profile_url,
            user_image_url: node.profile_picture,
            reaction_info: edge.reaction_info
        }
        resultData.post_like_list.push(likelist)
    }
}
const parseFbPostComments = function (htmlStr) {
    const patternArr = [
        /"ufi_renderer":{"__typename":.*?,"feedback":({"id":.*?}),"__module_operation_CometFeedUFI_feedback"/
    ]
    for (const pattern of patternArr) {
        const matchObj = htmlStr.match(pattern)
        if (matchObj && matchObj[1]) {
            const data = $g.$json_from_string(matchObj[1])
            if (!data) {
                break;
            }
            const node = data.display_comments.edges
            const post = parseFbPostCommtentLike(node)
            const key = 'post_comments_' + getUniqidKey()
            if (post) {
                resultData[key] = [post]
            }
            break;
        }
    }
}
const parseFbPostCommtentLike = function (edges) {
    if (!resultData.post_comments_list) {
        resultData.post_comments_list = []
    }
    let text = '';
    for (const edge of edges) {
        const node = edge.node
        if (node.body?.text) {
            let text = node.body.text
        }
        let post = {
            iid: node.legacy_token,
            created_time: node.created_time,
            permalink_url: node.url,
            can_viewer_react: node.can_viewer_react,
            can_viewer_comment: node.can_viewer_comment,
            message: text,
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
            comments: node.feedback.comment_count.total_count,
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
const searchFbPlaces = function (node) {
    const edges_places = node.profile
    let places = {
        name: edges_places.name,
        is_selected: edges_profile.url,
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

    if (node.all_collections?.nodes[0]?.style_renderer?.collection?.pageItems) {
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
    const data = $g.$json_from_string(htmlStr)
    let node = data.data.group
    if (node.group_albums?.edges) {
        let edges = node.group_albums.edges
        let iid = node.group_albums.id
    }
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
    const data = $g.$json_from_string(htmlStr)
    let node = data.data.page
    if (node.group_albums?.edges) {
        let edges = node.page_albums.edges
        let iid = node.id
    }
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

//主页活动
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
        post_time: $g.$time(postTimestamp, 's'),
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
        replyCount = feedback.comments_count_summary_renderer.feedback.comment_count.total_count
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

const parsePostAttachements = function (data) {
    //$g.log.append('debug', JSON.stringify(data))
    let picture = []
    let video = ''
    let attachments = []
    if (data.story?.attachments) {
        attachments = data.story.attachments
    } else if (data.story?.attached_story) {
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


exports.newsTaiwanTimes = function (htmlStr, requestData) {
    const node = $g.$json_from_string(htmlStr);
    let new_list = [];
    if (node.listOfBlog) {
        for (const listOfBlog of node.listOfBlog) {
            $g.log.append(listOfBlog.id)
            let newList = {
                'url': 'https://www.taiwantimes.com.tw/app-container/app-content/new/new-content-detail?blogId='+listOfBlog.id,
                'title': listOfBlog.title,
                'site_id':1006028,
                'template_name':''
            }
            new_list.push(newList)
        }
    }
    if(new_list.length > 0){
        resultData['urlList'] = {
            'desc':{},
            "data":{}
        }
        resultData['urlList'].data = new_list
    }
}