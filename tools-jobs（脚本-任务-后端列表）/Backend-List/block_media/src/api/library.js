import request from '@/utils/request'

export function fetchCollectGroupList(query) {
  return request({
    url: '/vue-element-admin/library/getCollectGroupList',
    method: 'get',
    params: query
  })
}

export function fetchGroupTags(query) {
  return request({
    url: '/vue-element-admin/library/getGroupTags',
    method: 'get',
    params: query
  })
}

export function updateCollectGroup(data) {
  return request({
    url: '/vue-element-admin/library/updateCollectGroup',
    method: 'post',
    data
  })
}