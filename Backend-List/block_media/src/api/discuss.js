import request from '@/utils/request'

export function fetchAccountList(query) {
  return request({
    url: '/vue-element-admin/discuss/fetchAccountList',
    method: 'get',
    params: query
  })
}

export function createAccount(data) {
  return request({
    url: '/vue-element-admin/discuss/createAccount',
    method: 'post',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/vue-element-admin/discuss/updateAccount',
    method: 'post',
    data
  })
}

export function fetchPostCorpusList(query) {
  return request({
    url: '/vue-element-admin/discuss/fetchPostCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostCorpus(data) {
  return request({
    url: '/vue-element-admin/discuss/createPostCorpus',
    method: 'post',
    data
  })
}

export function fetchPostBuildingCorpusList(query) {
  return request({
    url: '/vue-element-admin/discuss/fetchPostBuildingCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostBuildingCorpus(data) {
  return request({
    url: '/vue-element-admin/discuss/createPostBuildingCorpus',
    method: 'post',
    data
  })
}