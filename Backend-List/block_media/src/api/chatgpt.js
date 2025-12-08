import request from '@/utils/request'

export function generateMaterialChatGPT(data) {
  return request({
    url: '/vue-element-admin/chatGPT/generateMaterial',
    method: 'post',
    data
  })
}

export function fetchChatGPTMaterialList(data) {
  return request({
    url: '/vue-element-admin/chatGPT/fetchFbMaterialList',
    method: 'post',
    data
  })
}

export function updateMaterialChatGPT(data) {
  return request({
    url: '/vue-element-admin/chatGPT/updateMaterial',
    method: 'post',
    data
  })
}

export function generateImageChatGPT(data) {
  return request({
    url: '/vue-element-admin/chatGPT/generateImage',
    method: 'post',
    data
  })
}