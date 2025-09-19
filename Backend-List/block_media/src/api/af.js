import request from '@/utils/request'

export function getAccountPresentData(query) {
  return request({
    url: '/vue-element-admin/af/getAccountPresentData',
    method: 'get',
    params: query
  })
}

export function updateAccountPresentData(data) {
  return request({
    url: '/vue-element-admin/af/updateAccountPresentData',
    method: 'post',
    data
  })
}

export function getAccountLocationData(query) {
  return request({
    url: '/vue-element-admin/af/getAccountLocationData',
    method: 'get',
    params: query
  })
}

export function createAccountLocationData(data) {
  return request({
    url: '/vue-element-admin/af/createAccountLocationData',
    method: 'post',
    data
  })
}

export function updateAccountLocationData(data) {
  return request({
    url: '/vue-element-admin/af/updateAccountLocationData',
    method: 'post',
    data
  })
}

// page
export function getPageBasicData(query) {
  return request({
    url: '/vue-element-admin/af/getPageBasicData',
    method: 'get',
    params: query
  })
}
export function updatePageBasicData(data) {
  return request({
    url: '/vue-element-admin/af/updatePageBasicData',
    method: 'post',
    data
  })
}
export function getPageLocationData(query) {
  return request({
    url: '/vue-element-admin/af/getPageLocationData',
    method: 'get',
    params: query
  })
}

export function createPageLocationData(data) {
  return request({
    url: '/vue-element-admin/af/createPageLocationData',
    method: 'post',
    data
  })
}

export function updatePageLocationData(data) {
  return request({
    url: '/vue-element-admin/af/updatePageLocationData',
    method: 'post',
    data
  })
}

export function getPageFollowerRangeData(query) {
  return request({
    url: '/vue-element-admin/af/getPageFollowerRangeData',
    method: 'get',
    params: query
  })
}

export function createPageFollowerRangeData(data) {
  return request({
    url: '/vue-element-admin/af/createPageFollowerRangeData',
    method: 'post',
    data
  })
}

export function updatePageFollowerRangeData(data) {
  return request({
    url: '/vue-element-admin/af/updatePageFollowerRangeData',
    method: 'post',
    data
  })
}

// group
export function getGroupBasicData(query) {
  return request({
    url: '/vue-element-admin/af/getGroupBasicData',
    method: 'get',
    params: query
  })
}
export function updateGroupBasicData(data) {
  return request({
    url: '/vue-element-admin/af/updateGroupBasicData',
    method: 'post',
    data
  })
}
export function getGroupLocationData(query) {
  return request({
    url: '/vue-element-admin/af/getGroupLocationData',
    method: 'get',
    params: query
  })
}
export function createGroupLocationData(data) {
  return request({
    url: '/vue-element-admin/af/createGroupLocationData',
    method: 'post',
    data
  })
}
export function updateGroupLocationData(data) {
  return request({
    url: '/vue-element-admin/af/updateGroupLocationData',
    method: 'post',
    data
  })
}

// group
export function getGroupFollowerRangeData(query) {
  return request({
    url: '/vue-element-admin/af/getGroupFollowerRangeData',
    method: 'get',
    params: query
  })
}
export function createGroupFollowerRangeData(data) {
  return request({
    url: '/vue-element-admin/af/createGroupFollowerRangeData',
    method: 'post',
    data
  })
}
export function updateGroupFollowerRangeData(data) {
  return request({
    url: '/vue-element-admin/af/updateGroupFollowerRangeData',
    method: 'post',
    data
  })
}