import request from '@/utils/request'

export function fetchFbAccountListYY(query) {
  return request({
    url: '/vue-element-admin/account/fbAccountListYY',
    method: 'get',
    params: query
  })
}

export function createFbAccountYY(data) {
  return request({
    url: '/vue-element-admin/account/createFbAccountYY',
    method: 'post',
    data
  })
}

export function updateFbAccountYY(data) {
  return request({
    url: '/vue-element-admin/account/updateFbAccountYY',
    method: 'post',
    data
  })
}

export function fetchAccountGroupListYY(query) {
  return request({
    url: '/vue-element-admin/account/getAccountGroupListYY',
    method: 'get',
    params: query
  })
}

export function fetchAccountFriendsListYY(query) {
  return request({
    url: '/vue-element-admin/account/getAccountFriendsListYY',
    method: 'get',
    params: query
  })
}

export function fetchTwAccountListYY(query) {
  return request({
    url: '/vue-element-admin/account/fetchTwAccountListYY',
    method: 'get',
    params: query
  })
}