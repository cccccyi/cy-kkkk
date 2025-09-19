import request from '@/utils/request'

export function fetchAccountList(query) {
  return request({
    url: '/vue-element-admin/uwants/fetchAccountList',
    method: 'get',
    params: query
  })
}

export function createAccount(data) {
  return request({
    url: '/vue-element-admin/uwants/createAccount',
    method: 'post',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/vue-element-admin/uwants/updateAccount',
    method: 'post',
    data
  })
}

export function fetchPostCorpusList(query) {
  return request({
    url: '/vue-element-admin/uwants/fetchPostCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostCorpus(data) {
  return request({
    url: '/vue-element-admin/uwants/createPostCorpus',
    method: 'post',
    data
  })
}

export function fetchPostBuildingCorpusList(query) {
  return request({
    url: '/vue-element-admin/uwants/fetchPostBuildingCorpusList',
    method: 'get',
    params: query
  })
}

export function createPostBuildingCorpus(data) {
  return request({
    url: '/vue-element-admin/uwants/createPostBuildingCorpus',
    method: 'post',
    data
  })
}