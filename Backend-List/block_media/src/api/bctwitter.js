import request from '@/utils/request'

export function fetchGuidTwAccount(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchGuidTwAccount',
    method: 'get',
    params: query
  })
}

export function createAccount(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createAccount',
    method: 'post',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateAccount',
    method: 'post',
    data
  })
}

export function fetchTwAccountTargetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchTwAccountTargetList',
    method: 'get',
    params: query
  })
}

export function addMonitorTweetNames(data) {
  return request({
    url: '/vue-element-admin/bctwitter/addMonitorTweetNames',
    method: 'post',
    data
  })
}

export function updateMonitorTweet(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateMonitorTweet',
    method: 'post',
    data
  })
}

export function fetchCralewrTweetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchCralewrTweetList',
    method: 'get',
    params: query
  })
}

export function updateTweetReplyInfo(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateTweetReplyInfo',
    method: 'post',
    data
  })
}

export function fetchXmainReplyTarget(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchXmainReplyTarget',
    method: 'get',
    params: query
  })
}

export function fetchXfollowingTarget(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchXfollowingTarget',
    method: 'get',
    params: query
  })
}

export function fetchXblackTarget(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchXblackTarget',
    method: 'get',
    params: query
  })
}

export function kickOffXmainReplyTarget(query) {
  return request({
    url: '/vue-element-admin/bctwitter/kickOffXmainReplyTarget',
    method: 'get',
    params: query
  })
}

export function addXmainReplyTarget(query) {
  return request({
    url: '/vue-element-admin/bctwitter/addXmainReplyTarget',
    method: 'get',
    params: query
  })
}

export function createTargetAccount(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createTargetAccount',
    method: 'post',
    data
  })
}

export function createBlackAccount(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createBlackAccount',
    method: 'post',
    data
  })
}

// 主账号推文列表
export function fetchMainTweetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchMainTweetList',
    method: 'get',
    params: query
  })
}

export function updateMainTweetInfo(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateMainTweetInfo',
    method: 'post',
    data
  })
}

// KOL X检测目标
export function fetchKolTargetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchKolTargetList',
    method: 'get',
    params: query
  })
}

export function addKolTargets(data) {
  return request({
    url: '/vue-element-admin/bctwitter/addKolTargets',
    method: 'post',
    data
  })
}

export function updateKolTarget(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateKolTarget',
    method: 'post',
    data
  })
}

export function fetchKolTweetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchKolTweetList',
    method: 'get',
    params: query
  })
}

export function updateKolTweetInfo(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateKolTweetInfo',
    method: 'post',
    data
  })
}

// 账号关注列表管理
export function fetchFollowAccountTargetList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchFollowAccountTargetList',
    method: 'get',
    params: query
  })
}
export function updateFollowAccountTarget(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateFollowAccountTarget',
    method: 'post',
    data
  })
}