import request from '@/utils/request'

export function fetchFbLineData(query) {
  return request({
    url: '/vue-element-admin/dashboard/getFbLineData',
    method: 'get',
    params: query
  })
}

export function fetchPanelData(query) {
  return request({
    url: '/vue-element-admin/dashboard/getPanelData',
    method: 'get',
    params: query
  })
}

export function fetchGroupAreaTop(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchGroupAreaTop',
    method: 'get',
    params: query
  })
}

export function fetchFbFriendAreaTop(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchFbFriendAreaTop',
    method: 'get',
    params: query
  })
}

export function fetchGroupMemberAreaTop(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchGroupMemberAreaTop',
    method: 'get',
    params: query
  })
}

export function fetchGroupBoxInfo(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchGroupBoxInfo',
    method: 'get',
    params: query
  })
}

export function fetchPageFollowersDistributedTop(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchPageFollowersDistributedTop',
    method: 'get',
    params: query
  })
}

export function fetchFriendCountDistributedTop(query) {
  return request({
    url: '/vue-element-admin/dashboard/fetchFriendCountDistributedTop',
    method: 'get',
    params: query
  })
}