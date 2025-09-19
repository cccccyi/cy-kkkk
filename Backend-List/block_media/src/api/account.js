import request from '@/utils/request'

// ----- yy -----------
export function fetchGuidFbAccountListYY(query) {
  return request({
    url: '/vue-element-admin/account/fetchGuidFbAccountListYY',
    method: 'get',
    params: query
  })
}
// ---------------------
export function fetchFbAccountList(query) {
  return request({
    url: '/vue-element-admin/account/fbAccountList',
    method: 'get',
    params: query
  })
}

export function createFbAccount(data) {
  return request({
    url: '/vue-element-admin/account/createFbAccount',
    method: 'post',
    data
  })
}

export function updateFbAccount(data) {
  return request({
    url: '/vue-element-admin/account/updateFbAccount',
    method: 'post',
    data
  })
}

export function fetchAccountGroupList(query) {
  return request({
    url: '/vue-element-admin/account/getAccountGroupList',
    method: 'get',
    params: query
  })
}

export function fetchAccountFriendsList(query) {
  return request({
    url: '/vue-element-admin/account/getAccountFriendsList',
    method: 'get',
    params: query
  })
}

export function fetchTwAccountList(query) {
  return request({
    url: '/vue-element-admin/account/fetchTwAccountList',
    method: 'get',
    params: query
  })
}