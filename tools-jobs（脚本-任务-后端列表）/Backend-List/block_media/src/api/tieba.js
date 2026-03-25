import request from '@/utils/request'

export function fetchForumList(query) {
  return request({
    url: '/vue-element-admin/tieba/getForumList',
    method: 'get',
    params: query
  })
}

export function updateManagePage(data) {
  return request({
    url: '/vue-element-admin/page/updateManagePage',
    method: 'post',
    data
  })
}

export function fetchPostInsightsList(query) {
  return request({
    url: '/vue-element-admin/page/getPostInsightsList',
    method: 'get',
    params: query
  })
}

export function fetchPv(identity) {
  return request({
    url: '/vue-element-admin/group/activeAccountList',
    method: 'get',
    params: { identity }
  })
}

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

export function fetchPostList(query){
  return request({
    url: '/vue-element-admin/group/postList',
    method: 'get',
    params: query
  })
}