import request from '@/utils/request'

export function fetchPostList(query) {
  return request({
    url: '/vue-element-admin/douyin/fetchPostList',
    method: 'get',
    params: query
  })
}

export function fetchCommentList(query) {
  return request({
    url: '/vue-element-admin/douyin/fetchCommentList',
    method: 'get',
    params: query
  })
}

export function jsonDataFormat(data) {
  return request({
    url: '/vue-element-admin/douyin/jsonDataFormat',
    method: 'post',
    data
  })
}

export function fetchBnAlphaList(query) {
  return request({
    url: '/vue-element-admin/douyin/fetchBnAlphaList',
    method: 'get',
    params: query
  })
}

export function importBnbAlphaData(data) {
  return request({
    url: '/vue-element-admin/douyin/importBnbAlphaData',
    method: 'post',
    data
  })
}

export function fetchGmgnCoinList(query) {
  return request({
    url: '/vue-element-admin/douyin/fetchGmgnCoinList',
    method: 'get',
    params: query
  })
}

export function importGmgnData(data) {
  return request({
    url: '/vue-element-admin/douyin/importGmgnData',
    method: 'post',
    data
  })
}

//
export function fetchMemberGroupList(query) {
  return request({
    url: '/vue-element-admin/group/groupListCommentMember',
    method: 'get',
    params: query
  })
}

export function createMemberGroup(data) {
  return request({
    url: '/vue-element-admin/group/createMemberGroup',
    method: 'post',
    data
  })
}

export function updateMemberGroup(data) {
  return request({
    url: '/vue-element-admin/group/updateMemberGroup',
    method: 'post',
    data
  })
}

export function fetchMemberList(query) {
  return request({
    url: '/vue-element-admin/group/memberList',
    method: 'get',
    params: query
  })
}
