import request from '@/utils/request'

export function fetchAccountList(query) {
  return request({
    url: '/vue-element-admin/mewe/fetchAccountList',
    method: 'get',
    params: query
  })
}

export function createAccount(data) {
  return request({
    url: '/vue-element-admin/mewe/createAccount',
    method: 'post',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/vue-element-admin/mewe/updateAccount',
    method: 'post',
    data
  })
}

export function fetchPostCorpusList(query) {
  return request({
    url: '/vue-element-admin/mewe/fetchPostCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostCorpus(data) {
  return request({
    url: '/vue-element-admin/mewe/createPostCorpus',
    method: 'post',
    data
  })
}

export function fetchPostBuildingCorpusList(query) {
  return request({
    url: '/vue-element-admin/mewe/fetchPostBuildingCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostBuildingCorpus(data) {
  return request({
    url: '/vue-element-admin/mewe/createPostBuildingCorpus',
    method: 'post',
    data
  })
}
