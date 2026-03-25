import request from '@/utils/request'

export function statisticInfo(query) {
  return request({
    url: '/vue-element-admin/crawler/statisticInfo',
    method: 'get',
    params: query
  })
}

export function crawlTaskStatistic(query) {
  return request({
    url: '/vue-element-admin/crawler/crawlTaskStatistic',
    method: 'get',
    params: query
  })
}

export function fetchFbAccountList(query) {
  return request({
    url: '/vue-element-admin/crawler/fetchFbAccountList',
    method: 'get',
    params: query
  })
}

export function fetchTwAccountList(query) {
  return request({
    url: '/vue-element-admin/crawler/fetchTwAccountList',
    method: 'get',
    params: query
  })
}

export function fetchFeedsList(query) {
  return request({
    url: '/vue-element-admin/crawler/fetchFeedsList',
    method: 'get',
    params: query
  })
}

export function fetchTimelineList(query) {
  return request({
    url: '/vue-element-admin/crawler/fetchTimelineList',
    method: 'get',
    params: query
  })
}