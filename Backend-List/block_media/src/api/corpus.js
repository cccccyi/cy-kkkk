import request from '@/utils/request'

export function fetchTextList(query) {
  return request({
    url: '/vue-element-admin/corpus/textList',
    method: 'get',
    params: query
  })
}

export function createTextCorpus(data) {
  return request({
    url: '/vue-element-admin/corpus/createTextCorpus',
    method: 'post',
    data
  })
}

export function updateTextCorpus(data) {
  return request({
    url: '/vue-element-admin/corpus/updateTextCorpus',
    method: 'post',
    data
  })
}


export function createImageCorpus(data) {
  return request({
    url: '/vue-element-admin/corpus/createImageCorpus',
    method: 'post',
    data
  })
}

export function fetchImageList(query) {
  return request({
    url: '/vue-element-admin/corpus/imageList',
    method: 'get',
    params: query
  })
}

export function updateImageCorpus(data){
  return request({
    url: '/vue-element-admin/corpus/updateImageCorpus',
    method: 'post',
    data
  })
}