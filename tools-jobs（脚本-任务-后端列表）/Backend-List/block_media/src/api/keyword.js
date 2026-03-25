import request from '@/utils/request'

export function fetchProjectList(query) {
  return request({
    url: '/vue-element-admin/keyword/projectList',
    method: 'get',
    params: query
  })
}

export function fetchLocFidInfos(query) {
  return request({
    url: '/vue-element-admin/keyword/getLocFidInfos',
    method: 'get',
    params: query
  })
}

export function fetchCategoryList(query) {
  return request({
    url: '/vue-element-admin/keyword/categoryList',
    method: 'get',
    params: query
  })
}

export function createCategory(data) {
  return request({
    url: '/vue-element-admin/keyword/createCategory',
    method: 'post',
    data
  })
}

export function updateCategory(data) {
  return request({
    url: '/vue-element-admin/keyword/updateCategory',
    method: 'post',
    data
  })
}

export function fetchCascaderCategoryList(data) {
  return request({
    url: '/vue-element-admin/keyword/getCascaderCategoryList',
    method: 'post',
    data
  })
}

export function fetchKeywordList(query) {
  return request({
    url: '/vue-element-admin/keyword/keywordList',
    method: 'get',
    params: query
  })
}

export function createKeyword(data) {
  return request({
    url: '/vue-element-admin/keyword/createKeyword',
    method: 'post',
    data
  })
}

export function updateKeyword(data) {
  return request({
    url: '/vue-element-admin/keyword/updateKeyword',
    method: 'post',
    data
  })
}

export function fetchAccountUseTypeList(query) {
  return request({
    url: '/vue-element-admin/keyword/accountUseTypeList',
    method: 'get',
    params: query
  })
}

// 基础配置信息
export function fetchConfigList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/getConfigList',
    method: 'get',
    params: query
  })
}

export function createConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createConfig',
    method: 'post',
    data
  })
}

export function updateConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateConfig',
    method: 'post',
    data
  })
}

// 带推评论配置
export function fetchReplyWithTweetConfigList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchReplyWithTweetConfigList',
    method: 'get',
    params: query
  })
}

export function createReplyWithTweetConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createReplyWithTweetConfig',
    method: 'post',
    data
  })
}

export function updateReplyWithTweetConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateReplyWithTweetConfig',
    method: 'post',
    data
  })
}
// X 搜索关键字配置
export function fetchSearchTweetConfigList(query) {
  return request({
    url: '/vue-element-admin/bctwitter/fetchSearchTweetConfigList',
    method: 'get',
    params: query
  })
}

export function createSearchTweetConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/createSearchTweetConfig',
    method: 'post',
    data
  })
}

export function updateSearchTweetConfig(data) {
  return request({
    url: '/vue-element-admin/bctwitter/updateSearchTweetConfig',
    method: 'post',
    data
  })
}
