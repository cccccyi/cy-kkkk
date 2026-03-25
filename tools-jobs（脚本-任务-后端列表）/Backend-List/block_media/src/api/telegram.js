import request from '@/utils/request'

export function fetchAccountList(query) {
  return request({
    url: '/vue-element-admin/telegram/fetchAccountList',
    method: 'get',
    params: query
  })
}

export function createAccount(data) {
  return request({
    url: '/vue-element-admin/telegram/createAccount',
    method: 'post',
    data
  })
}

export function updateAccount(data) {
  return request({
    url: '/vue-element-admin/telegram/updateAccount',
    method: 'post',
    data
  })
}

export function fetchMessageTaskList(query) {
  return request({
    url: '/vue-element-admin/telegram/fetchMessageTaskList',
    method: 'get',
    params: query
  })
}

export function createMessageTask(data) {
  return request({
    url: '/vue-element-admin/telegram/createMessageTask',
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
