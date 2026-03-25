/**
 * Data parse entry file
 * browser network request history cache file
 */
const path = require('path')
const parseProcess = require('./data_parse')
const taskProcess = require('./task_process')

let $g = null
let parseOptions = null

const fbGraphRequestMatchConfig = [
    //FB群组帖子列表搜索
    {needle:'SearchCometResultsPaginatedResultsQuery', fun:'fbAjaxGroupPostSearchDataParse'},
    {needle:'SearchCometResultsInitialResultsQuery', fun:'fbAjaxGroupPostSearchDataParse'},
    //FB群组成员搜索
    {needle:'useGroupsCometMemberSearchResultsRefetchQuery', fun:'fbAjaxGroupMemebrSearchDataParse'},
    {needle:'ProfileCometContextualProfileGroupPostsFeedPaginationQuery', fun:'fbAjaxGroupMemberPostDataParse'},
    //FB账号好友数采集
    {needle:'ProfileCometTilesFeedPaginationQuery', fun:'fbUserFriendsCountQuery'},
    //FB账号About信息
    {needle:'ProfileCometAboutAppSectionQuery', fun:'fbAboutAppSectionQuery'},
    {needle:'CometProfessionalDashboardInsightsHomeQuery', fun:'fbPageInsights'},
    //FB群组About信息
    {needle:'CometGroupAboutRootQuery', fun:'fbGroupAboutQuery'},
    {needle:'GroupsCometHistoryDialogQuery', fun:'fbGroupHistoryQuery'},
    //FB账号好友列表 FB用户相册列表
    {needle:'ProfileCometTopAppSectionQuery', fun:'fbFriendList'},
    {needle:'ProfileCometAppCollectionListRendererPaginationQuery', fun:'fbFriendList'},
    //FB用户指定相册照片列表
    {needle:'ProfileCometLegacyAlbumGridViewPaginationQuery', fun:'fbAlbumPhotos'},
    //FB主页相册列表
    {needle:'CometSinglePagePhotosAlbumListViewRootQuery', fun:'fbPageAlbums'},
    //FB群组相册列表
    {needle:'GroupsCometAlbumsRootQueryContainerQuery', fun:'fbGroupAlbums'},
    //FB群组成员列表
    {needle:'GroupsCometMembersRootQuery', fun:'FbMembersList'},
    {needle:'GroupsCometMembersPageNewMembersSectionRefetchQuery', fun:'FbMembersList'},
    {needle:'CometGroupMembersAdminsRootQuery', fun:'FbMembersList'},
    {needle:'GroupsCometMembersPageNewForumMembersSectionRefetchQuery', fun:'FbMembersList'},
    //FB账号帖子列表
    {needle:'ProfileCometTimelineFeedRefetchQuery', fun:'fbAjaxUserPost'},
    {needle:'SearchCometInterestsDeepDivePostsListQuery', fun:'searchHashtag'},
    //FB主页帖子列表
    {needle:'CometModernPageFeedPaginationQuery', fun:'fbAjaxPagePost'},
    {needle:'CometProfilePostInsightsNonReelsDialogComponentQuery', fun:'fbPagePostInsights'},
    {needle:'CometProfilePostTotalInsightsDialogQuery', fun:'fbPagePostInsights'},
    //FB群组帖子列表
    {needle:'GroupsCometFeedRegularStoriesPaginationQuery', fun:'fbAjaxGroupPost'},
    //FB帖子点赞列表
    {needle:"CometUFIReactionsDialogQuery", fun:'fbPostLikeList'},
    {needle:'CometUFIReactionsDialogTabContentRefetchQuery', fun:'fbPostLikeList'},
    //FB帖子评论列表
    {needle:'CometUFICommentsProviderQuery', fun:'fbPostCommentList'},
    {needle:'CometUFICommentsProviderForDisplayCommentsQuery', fun:'fbPostCommentList'},
    {needle:'CometHovercardQueryRendererQuery', fun:'fbPostCommentList'},
    {needle:'CometUFIFullThreadedSubRepliesListDataProviderQuery', fun:'fbPostCommentList'},
    //FB帖子转发列表
    {needle:'CometResharesDialogQuery', fun:'fbPostShareList'},
    {needle:'CometResharesFeedPaginationQuery', fun:'fbPostShareList'},
    //FB用户相册
    //{needle:"ProfileCometTopAppSectionQuery",fun:'fbPrfileUserPhoto'},
    //FB群组相册
    {needle:"GroupsCometAlbumsRootQuery",fun:'fbPrfileGroupPhoto'},
    //FB主页相册
    {needle:"CometSinglePagePhotosRootQuery",fun:'fbPrfilePagepPhoto'},
    //FB公共主页活动
    {needle:"PagesCometEventsRootQuery",fun:'fbPageInternal'},
    {needle:"PagesCometEventsPastSectionPaginationQuery", fun:'fbPageInternal'},
    //FB公共主页群组关联
    {needle:"CometPageGroupsTabContentPaginationQuery",fun:'fbPageGroup'},
    {needle:"GroupsCometPageMembersCardPaginationQuery",fun:'FbPageMembers'},
    //FB公共主页Top fans列表
    {needle:"CometPageCommunityTopFansDialogQuery",fun:'FbPageTopFans'},
    //FB用户点赞列表
    {needle:"ProfileCometAppCollectionGridRendererPaginationQuery" ,fun:'fbUserLikeList'},
    //FB群组话题列表
    {needle:'GroupsCometHashtagsBrowseRootQuery', fun:'fbGroupHastagsParse'},
    {needle:'GroupsCometHashtagsListContentPaginationQuery', fun:'fbGroupHastagsParse'},
    //FB群组活动列表
    {needle:'CometGroupEventsRootQuery', fun:'fbGroupEventsParse'},
    {needle:'GroupsCometEventPastSectionPaginationQuery', fun:'fbGroupEventsParse'},
    //FB账号Hobby列表
    {needle:'ProfileCometHobbiesViewAllDialogQuery', fun:'fbProfileHobbies'},
    //FB (Friends Requests List & People you may know List) account info
    {needle:'ProfileCometHeaderQuery', fun:'fbProfileQuery'},
    {needle:'ProfileCometTimelineListViewRootQuery', fun:'fbProfileQueryAbout'},
    //FB friends request & pymk
    {needle:'FriendingCometRootContentQuery', fun:'fbFriendRequestSuggestions'},
    {needle:'FriendingCometPYMKGridPaginationQuery', fun:'fbFriendRequestSuggestions'},
    //FB Friends Request List
    {needle:'FriendingCometFriendRequestsRootQuery', fun:'fbFriendRequest'},
    //FB Suggestions People you may konw List
    {needle:'FriendingCometSuggestionsRootQuery', fun:'fbSuggestions'},
    //FB feeds
    {needle:'CometModernHomeFeedQuery', fun:'fbAccountFeed'},
    //FB Action
    //FB friends request list confirm
    {needle:'FriendingCometFriendRequestConfirmMutation', fun:'fbFriendRequestConfirm'},
    //FB pymk send friend request
    {needle:'FriendingCometFriendRequestSendMutation', fun:'fbFriendRequestSend'},
    //FB page manage list
    {needle:'PagesCometLaunchpointUnifiedQueryPagesListRedesignedQuery', fun:'fbYourPageAjax'},
    //FB page new style, page access
    {needle:'CometProfilePlusAdminPermissionsRootQuery', fun:'FbPageAdminRolesNewStyle'},
    {needle:'CometProfileInsightsPostsMainCardQuery', fun:'FbPageInsightsPostAjax'},
    {needle:'CometProfileInsightsPostsMainCardPaginationQuery', fun:'FbPageInsightsPostAjax'},
    //FB your group list
    {needle:'GroupsLeftRailYourGroupsPaginatedQuery', fun:'fbYourGroupsAjax'},
    //FB 公共主页 insights
    {needle:'CometProfessionalDashboardInsightsAudiencePageQuery', fun:'fbPageInsightsAudience'},
    //FB create post
    {needle:'ComposerStoryCreateMutation', fun:'fbStoryCreate'},
    //FB change password
    {needle:'useEpsilonChangePasswordMutation', fun:'fbChangePassword'}
]

const taskProcessConfig = {
    fb_system_account_collect: 'processFbAccountInfoCollect',  //Fb账号信息采集
    fb_group_info_collect: 'processFbGroupInfoCollect',     //FB群组信息收集
    fb_join_group_detect: 'processFbJoinGroupDetect',       //FB群组入群检测任务
    fb_group_post_detect: 'processFbGroupPostDetect',       //FB群组发帖检测任务
    fb_group_post_info_collect: 'processFbGroupPostInfoCollect' //FB指定群组帖子信息采集
}

const DataParse = async function(_$g) {
    $g = _$g
    const taskDir = $g.taskPath
    parseOptions = {
        action: 'DataParse',
        taskFile: path.join(taskDir, 'task'),
        taskTxt: path.join(taskDir, 'task.txt'),
        targetsFile: path.join(taskDir, 'targets'),
        networkDir: path.join(taskDir, 'network'),
        networkIndexFile: path.join(taskDir, 'network', 'index'),
        resultExCrawlerFile: path.join(taskDir, 'result_ex_crawler.txt'),
        resultExFile: path.join(taskDir, 'result_ex.txt'),
        requestHistory: [],
        taskParams: {}
    }

    if (!taskDir || !$g.fs.exists(taskDir)) {
        $g.log.append(parseOptions.action, 'not found taskDir')
        return
    }
    $g.log.append('DataParse', 'start parse network data ...')
    if (!$g.fs.exists(parseOptions.networkDir)) {
        $g.log.append(parseOptions.action, 'not found network dir !!!')
        return
    }
    if (!$g.fs.exists(parseOptions.networkIndexFile)) {
        $g.log.append(parseOptions.action, 'not found network index file !!!')
        return
    }
    if ($g.fs.exists(parseOptions.taskFile)) {
        parseOptions.taskParams = $g.$json(parseOptions.taskFile)
    }
    parseProcess.dataParseInitData($g, parseOptions)
    await startParse()
    const {resultData:crawlerResultData} = parseProcess.getParseResultData()
    taskProcess.taskProcessInitData($g, parseOptions, crawlerResultData)
    processTaskData()

    const {outerResultData} = taskProcess.getTaskResultData()
    let resultData = {}
    if ($g.fs.exists(parseOptions.resultExFile)) {
        resultData = $g.$json(parseOptions.resultExFile) || {}
    }
    if (outerResultData) {
        Object.assign(resultData, outerResultData)
    }
    if (crawlerResultData) {
        if (!resultData.dataEx) {
            resultData.dataEx = {}
        }
        resultData.dataEx.network_crawler = crawlerResultData
        $g.fs.write(parseOptions.resultExFile, JSON.stringify(resultData))
        $g.fs.write(parseOptions.resultExCrawlerFile, JSON.stringify(resultData))
        // $g.log.append('resultData', JSON.stringify(resultData))
    }
    //targets file 
    if(!$g.fs.exists(parseOptions.targetsFile) && crawlerResultData.targets) {
        $g.fs.write(parseOptions.targetsFile, JSON.stringify(crawlerResultData.targets))
    }
    return crawlerResultData
}

const startParse = async function() {
    const historyContent = $g.fs.read(parseOptions.networkIndexFile)
    const historyArr = historyContent.split(/\r?\n/)
    for (const line of historyArr) {
        if (!line) {
            continue
        }
        let item = {}
        try {
            item = JSON.parse(line)
        } catch (error) {
            continue
        }
        const {url, type, postData, file:contentFile, time} = item
        const funName = getParseFunName(url, type, postData)
        if ($g.networkStartTime && time<$g.networkStartTime){
            continue
        }
        if (funName) {
            if (typeof(parseProcess[funName]) === 'function') {
                const fileName = contentFile.trim()
                $g.log.append(parseOptions.action, 'process, fun:' + funName+', file:' + fileName)
                const filePath = path.join(parseOptions.networkDir, fileName)
                if (!fileName || !$g.fs.exists(filePath)) {
                    $g.log.append(parseOptions.action, 'not found file, file:'+fileName)
                    continue
                }
                const htmlStr = $g.fs.read(filePath)
                await parseProcess[funName](htmlStr, item)
                try{
                    //await parseProcess[funName](htmlStr, item)
                }catch(error){
                    $g.log.append("Error", error)
                }
            } else {
                $g.log.append(parseOptions.action, 'not found parse function ' + funName)    
            }
        }
    }
}

const getParseFunName = function(url, requestType, postData) {
    //$g.log.append(url + '>>>>>>>>>>>>')
    if (url.indexOf('facebook.com') > -1) {
        if (requestType == 'Document') {
            return 'fbDocumentDataParse'
        } else {
            if (url.indexOf('graphql') > -1) {
                for (const config of fbGraphRequestMatchConfig) {
                    if (postData.indexOf(config.needle) > -1) {
                        return config.fun
                    }
                }
            } else if (url.indexOf('register.php') > -1) {
                return 'fbRegisterData'
            }
        }
    }else if(url.indexOf('/x.com/') > -1){
        if(requestType == 'Document'){
            return 'xDocumentDataParse'
        }else{
            if(url.indexOf('UserByScreenName') > -1){
                return 'twUserInfoParse'
            }else if(url.indexOf('UserTweets') > -1 || url.indexOf('UserTweetsAndReplies') > -1 || url.indexOf('TweetDetail') > -1){
                return 'twTweetAndRepliesParse'
            }else if (url.indexOf('Followers') > -1) {
                return 'twFollowersParse'
            } else if (url.indexOf('Following') > -1) {
                return 'twFollowingParse'
            } else if (url.indexOf('Favoriters') > -1) {
                return 'twTweetPraise'
            } else if (url.indexOf('Retweeters') > -1) {
                return 'twTweetRetweeters'
            }else if (url.indexOf('api/2/search/adaptive.json') > -1){
                return 'twRetweetWithCommentParse'
            }else if (url.indexOf('CreateTweet') > -1 || url.indexOf('CreateNoteTweet') > -1){
                return 'twCreateTweet'
            }
        }
    } else if (url.indexOf('taiwantimes.com.tw') > -1){
        if (requestType == 'Document') {
            return 'newsTaiwanTimes';
        }else{
            if (url.indexOf('category?category') > -1) {
                return 'newsTaiwanTimes';
            }
        } 
    } else if (url.indexOf('us.shein') > -1){
        if (requestType == 'Document') {
            return 'sheinDocument'
        }else{
            if (url.indexOf('getAtomicInfo') > -1){
                return 'sheinProductList'
            }
        }
    } else if (url.indexOf('trends.google.com') > -1) {
        if (url.indexOf('trends.google.com/trends/api/widgetdata/multiline') > -1) {
            return 'googleTrends'
        }
    }else if (url.indexOf('mastodon.social') > -1 || url.indexOf('wxw.moe') > -1 || url.indexOf('baraag.net') > -1 || url.indexOf('hello.2heng') > -1 || url.indexOf('o3o.ca') > -1 || url.indexOf('mstdn.social') > -1 || url.indexOf('mastodon.cloud') > -1 || url.indexOf('m.cmx.im') > -1 || url.indexOf('g0v.social') > -1 || url.indexOf('littlefo.rest') > -1) {
        if (url.indexOf('api/v1/timelines/tag') || url.indexOf('api/v1/timelines/public')){
            return 'mastodonNewDetail'
        }
    } else if (url.indexOf('instagram.com') > -1) {
        if (url.indexOf('instagram.com/api/v1/users/web_profile_info/?username') > -1)  {
            return 'instagramDeail'
        }else if( url.indexOf('instagram.com/graphql/query/?query_hash=') > -1){
            return 'instagramPostList'
        }else if( url.indexOf('/api/v1/media/') > -1 && url.indexOf('/comments/?') <= -1 && url.indexOf('/likers') <= -1 ){
            return 'instagramPostDetail'
        }else if( url.indexOf('api/v1/feed/user') > -1){
            return 'instagramMoveList'
        }else if(url.indexOf('fb/create/ajax/attempt') > -1){
            return 'instagramFbCreate'
        }else if(url.indexOf('accounts/fb_profile') > -1){
            return 'instagramFbProfile'
        }else if(url.indexOf('/comments/?can_support_threading') > -1){
            return 'instagramPostComment'
        }else if(url.indexOf('/likers') > -1){
            return 'instagramPostLike'
        }else if(url.indexOf('/following/') > -1){
            return 'instagramFollowering'
        }else if(url.indexOf('/followers/') > -1){
            return 'instagramFollowers'
        }else if(url.indexOf('/api/v1/tags/') > -1){
            return 'instagramTagsPost'
        }else if(url.indexOf('/api/graphql') > -1 && postData.indexOf('PolarisSearchBoxRefetchableQuery')>-1){
            return 'instagramSearch'
        }
    } else if (url.indexOf('https://abcnews.go.com/Video') > -1) {
        if (requestType == 'Document') {
            return 'abcVideo' 
        }
    } else if (url.indexOf('https://www.reuters.com/video/breakingviews') > -1 || url.indexOf('https://www.reuters.com/video/legal-news') > -1|| url.indexOf('https://www.reuters.com/video/technology') > -1 || url.indexOf('https://www.reuters.com/video/world') > -1||url.indexOf('https://www.reuters.com/video/cyberrisk') > -1|| url.indexOf('https://www.reuters.com/video/politics') > -1|| url.indexOf('https://www.reuters.com/video/editor') > -1) {
        if (requestType == 'Document') {
            return 'reutersList' 
        }
    } else if (url.indexOf('https://www.bbc.com/news/')>-1 || url.indexOf('www.bbcnews')>-1) {
        if (requestType == 'Document') {
            return 'abcVideoDetail'
        }
    } else if (url.indexOf('https://play.google.com/store/apps/') > -1) {
        if (requestType == 'Document') {
            return 'googleStoreApps'
        }
    } else if (url.indexOf("uwants.com") > -1) {
        if (url.indexOf("viewthread.php?tid=") > -1) {
            return 'uwantsThread'
        } else if (url.indexOf("space.php?action=viewpro&uid") > -1) {
            return 'uwantsProfile'
        }
    } else if (url.indexOf("discuss.com") > -1) {
        if (url.indexOf("viewthread.php?tid=") > -1) {
            return 'discussThread'
        } else if (url.indexOf("space.php?uid=") > -1) {
            return 'discussProfile'
        }
    } else if (url.indexOf('mewe.com') > -1) {
        if (url.indexOf('/api/v2/home/post') > -1) {
            return 'meweSendPost'
        }
    }else if(url.indexOf('www.panewslab.com') > -1){
        if(requestType == 'Document'){
            if(url.indexOf('/profundity/') > -1){
                return 'profundityNews'
            }else if(url.indexOf('/articledetails/') > -1){
                return 'detailsNew'
            }else if(url.indexOf('/news/') > -1){
                return 'newsList'
            }
        }
    }else if(url.indexOf('www.theblock.co') > -1){
        if(requestType == 'Document'){
            if(url.indexOf('/latest') > -1){
                return 'theBlockNewsList'
            }else if(url.indexOf('/research')){
                return 'theBlockResearchList'
            }
        }
    }else if(url.indexOf('www.binance.com') > -1){
        if(requestType == 'Document'){
            if(url.indexOf('/support/announcement/') > -1){
                return 'binanceAnnouncementDetail'
            }
        }else{
            if(url.indexOf('cms/article/list/query') > -1){
                return 'binanceAnnouncementList'
            }
        }
    }
    return false
}

const processTaskData = function() {    
    const taskType = parseOptions.taskParams.task_type
    if (taskProcessConfig[taskType]) {
        $g.log.append('TaskProcess', taskType + ' : ' +taskProcessConfig[taskType])
        taskProcess[taskProcessConfig[taskType]]()
    }
    if ($g.crawlGroupPermeationType) {
        resultData.crawlGroupPermeation = {
            type: $g.crawlGroupPermeationType,
            params: $g.crawlTaskParams
        }
    }
    switch ($g.crawlGroupPermeationType) {
        case 'group_permeation_post_detect':
            taskProcess.processGroupPermeationPostDdetect()
        break;
        case 'group_permeation_post_info':
            taskProcess.processGroupPermeationPostInfo()
        break;
        case 'twitter_tweet_info':
            taskProcess.processTwitterTweetInfo()
    }
    if ($g.fs.exists(parseOptions.taskTxt)) {
        const taskFile = $g.$json(parseOptions.taskTxt)
        const type = taskFile.type
        if (type == 'LIST_TASK' || type == 'DETAIL_TASK') {
            const resultExFile = $g.$json(parseOptions.resultExFile) || ''
            if (resultExFile) {
                $g.log.append('nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',resultExFile);  
                const result = resultExFile.dataEx
                const keys = Object.keys(result)
                $g.log.append('ddddddddd',keys,result)
                const reg = /^(\d+,?)+$/;
                if(reg.test(keys)){
                    if (keys.indexOf('urlList') <= -1 && keys.indexOf('newsDetail') <= -1 && keys.indexOf('network_crawler') <= -1) {
                        $g.log.append('sssssssssssssssssssss');  
                           $g.fs.write(parseOptions.resultExFile, '')
                           dataRe = []
                           for (var i in result) {
                               const list_data = result[i].data
                               dataRe = dataRe.concat(list_data);
                           }
                           if (type == 'LIST_TASK') {
                               if (!resultData.urlList) {
                                   resultData.urlList = {
                                       'desc': {},
                                       "data": []
                                   }
                               }
                               resultData.urlList.data = dataRe
                           }
                           if (type == 'DETAIL_TASK') {
                               if (!resultData.newsDetail) {
                                   resultData.newsDetail = {
                                       'desc': {},
                                       "data": []
                                   }
                               }
                               resultData.newsDetail.data = dataRe
                           }
                       }
                }
                
            }
        }
    }
}

exports.DataParse = DataParse