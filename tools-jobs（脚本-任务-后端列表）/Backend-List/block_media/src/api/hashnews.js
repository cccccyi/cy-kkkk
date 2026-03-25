import request from '@/utils/request'

export function fetchNewsList(query) {
  return request({
    url: '/vue-element-admin/hashNews/fetchNewsList',
    method: 'get',
    params: query
  })
}

export function createNewsInfo(data) {
  return request({
    url: '/vue-element-admin/hashNews/createNewsInfo',
    method: 'post',
    data
  })
}

export function updateNewsInfo(data) {
  return request({
    url: '/vue-element-admin/hashNews/updateNewsInfo',
    method: 'post',
    data
  })
}

export function fetchArticleList(query) {
  return request({
    url: '/vue-element-admin/hashNews/fetchArticleList',
    method: 'get',
    params: query
  })
}

export function createArticleInfo(data) {
  return request({
    url: '/vue-element-admin/hashNews/createArticleInfo',
    method: 'post',
    data
  })
}

export function updateArticleInfo(data) {
  return request({
    url: '/vue-element-admin/hashNews/updateArticleInfo',
    method: 'post',
    data
  })
}
