import request from '@/utils/request'

export function fetchCollectGroupList(query) {
  return request({
    url: '/vue-element-admin/group/fetchCollectGroupList',
    method: 'get',
    params: query
  })
}

export function fetchGroupUserList(query) {
  return request({
    url: '/vue-element-admin/group/fetchGroupUserList',
    method: 'get',
    params: query
  })
}

export function fetchGroupPostList(query) {
  return request({
    url: '/vue-element-admin/group/fetchGroupPostList',
    method: 'get',
    params: query
  })
}

export function addPostByFids(data) {
  return request({
    url: '/vue-element-admin/group/addPostByFids',
    method: 'post',
    data
  })
}

export function resetGroupPostCrawl(query) {
  return request({
    url: '/vue-element-admin/group/resetGroupPostCrawl',
    method: 'get',
    params: query
  })
}

// ---

export function fetchGroupList(query) {
  return request({
    url: '/vue-element-admin/group/groupList',
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

export function createGroup(data) {
  return request({
    url: '/vue-element-admin/group/createGroup',
    method: 'post',
    data
  })
}

export function updateGroup(data) {
  return request({
    url: '/vue-element-admin/group/updateGroup',
    method: 'post',
    data
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

export function fetchMessageList(query){
  return request({
    url: '/vue-element-admin/group/messageList',
    method: 'get',
    params: query
  })
}