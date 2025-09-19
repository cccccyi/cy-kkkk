import request from '@/utils/request'

export function fetchPaNewsList(query) {
  return request({
    url: '/vue-element-admin/monitor/fetchPaNewsList',
    method: 'get',
    params: query
  })
}

export function updateTweetInfo(data) {
  return request({
    url: '/vue-element-admin/monitor/updateTweetInfo',
    method: 'post',
    data
  })
}

export function updateYoutubeMaterialFbPostFlag(query) {
  return request({
    url: '/vue-element-admin/material/updateYoutubeMaterialFbPostFlag',
    method: 'get',
    params: query
  })
}

export function fetchInstagramImages(query) {
  return request({
    url: '/vue-element-admin/material/fetchInstagramImages',
    method: 'get',
    params: query
  })
}

// 采集监控
export function fetchTargetList(query) {
  return request({
    url: '/vue-element-admin/monitor/fetchTargetList',
    method: 'get',
    params: query
  })
}

export function updateTarget(data) {
  return request({
    url: '/vue-element-admin/monitor/updateTarget',
    method: 'post',
    data
  })
}
