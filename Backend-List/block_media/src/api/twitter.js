import request from '@/utils/request'

export function fetchGuidTwAccountListYY(query) {
  return request({
    url: '/vue-element-admin/twitter/fetchGuidTwAccountListYY',
    method: 'get',
    params: query
  })
}

export function fetchTweetList(query) {
  return request({
    url: '/vue-element-admin/twitter/fetchTweetList',
    method: 'get',
    params: query
  })
}

export function addTweetUrls(data) {
  return request({
    url: '/vue-element-admin/twitter/addTweetUrls',
    method: 'post',
    data
  })
}

// - - - - -

export function fetchTwitterTargetList(query) {
  return request({
    url: '/vue-element-admin/twitter/getTwitterTargetList',
    method: 'get',
    params: query
  })
}
export function createTwitterTarget(data) {
    return request({
        url: '/vue-element-admin/twitter/createTwitterTarget',
        method: 'post',
        data
    })
}
export function updateTwitterTarget(data) {
    return request({
        url: '/vue-element-admin/twitter/updateTwitterTarget',
        method: 'post',
        data
    })
}

export function fetchTwitterMessage(query) {
    return request({
      url: '/vue-element-admin/twitter/getTwitterMessage',
      method: 'get',
      params: query
    })
  }