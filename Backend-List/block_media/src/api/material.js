import request from '@/utils/request'

export function fetchPagePostMaterials(query) {
  return request({
    url: '/vue-element-admin/material/fetchPagePostMaterials',
    method: 'get',
    params: query
  })
}

export function fetchBilibiliVideos(query) {
  return request({
    url: '/vue-element-admin/material/fetchBilibiliVideos',
    method: 'get',
    params: query
  })
}

export function fetchYoutubeVideos(query) {
  return request({
    url: '/vue-element-admin/material/fetchYoutubeVideos',
    method: 'get',
    params: query
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
