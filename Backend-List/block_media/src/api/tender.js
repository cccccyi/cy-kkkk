import request from '@/utils/request'

export function fetchTenderList(query) {
  return request({
    url: '/vue-element-admin/tender/fetchTenderList',
    method: 'get',
    params: query
  })
}

