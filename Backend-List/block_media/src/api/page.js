import request from '@/utils/request'
// yy monitor
export function fetchCollectPageListYY(query) {
  return request({
    url: '/vue-element-admin/page/fetchCollectPageListYY',
    method: 'get',
    params: query
  })
}

// accouont foster
export function fetchCollectPageList(query) {
  return request({
    url: '/vue-element-admin/page/getCollectPagesList',
    method: 'get',
    params: query
  })
}

export function updateCollctPageInfo(data) {
  return request({
    url: '/vue-element-admin/page/updateCollctPageInfo',
    method: 'post',
    data
  })
}

export function fetchPagePostList(query) {
  return request({
    url: '/vue-element-admin/page/getPostList',
    method: 'get',
    params: query
  })
}

export function fetchPageConfigs(query) {
  return request({
    url: '/vue-element-admin/page/fetchPageConfigs',
    method: 'get',
    params: query
  })
}

export function fetchManagePagesList(query) {
  return request({
    url: '/vue-element-admin/page/getManagePagesList',
    method: 'get',
    params: query
  })
}

export function exportManagePagesList(query) {
  return request({
    url: '/vue-element-admin/page/exportManagePagesList',
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

export function resetPageCrawltime(query) {
  return request({
    url: '/vue-element-admin/page/resetPageCrawltime',
    method: 'post',
    params: query
  })
}

export function fetchPageRoleList(query) {
  return request({
    url: '/vue-element-admin/page/getPageRoleList',
    method: 'get',
    params: query
  })
}

export function fetchPostInsightsList(query) {
  return request({
    url: '/vue-element-admin/page/getPostInsightsList',
    method: 'get',
    params: query
  })
}

export function updatePagePost(data) {
  return request({
    url: '/vue-element-admin/page/updatePagePost',
    method: 'post',
    data
  })
}

export function fetchPageAdminsList(query){
  return request({
    url: '/vue-element-admin/page/fetchPageAdminsList',
    method: 'get',
    params: query
  })
}

export function fetchAccountPageList(query){
  return request({
    url: '/vue-element-admin/page/fetchAccountPageList',
    method: 'get',
    params: query
  })
}

export function deletePostScreenshot(query){
  return request({
    url: '/vue-element-admin/page/deletePostScreenshot',
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

