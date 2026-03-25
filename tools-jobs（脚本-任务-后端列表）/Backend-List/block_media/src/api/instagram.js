import request from '@/utils/request'

export function fetchCollectAccountList(query) {
  return request({
    url: '/vue-element-admin/instagram/fetchCollectAccountList',
    method: 'get',
    params: query
  })
}

export function updateInstagramAccount(data) {
  return request({
    url: '/vue-element-admin/instagram/updateInstagramAccount',
    method: 'post',
    data
  })
}
