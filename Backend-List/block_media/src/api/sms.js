import request from '@/utils/request'

export function fetchUserList(query) {
  return request({
    url: '/vue-element-admin/sms/fetchUserList',
    method: 'get',
    params: query
  })
}

export function createUser(data) {
  return request({
    url: '/vue-element-admin/sms/createUser',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/vue-element-admin/sms/updateUser',
    method: 'post',
    data
  })
}