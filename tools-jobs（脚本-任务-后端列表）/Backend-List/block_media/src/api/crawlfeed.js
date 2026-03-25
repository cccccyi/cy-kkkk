import request from '@/utils/request'

export function fetchCrawlAccountList(query) {
    return request({
      url: '/vue-element-admin/crawlfeed/fetchCrawlAccountList',
      method: 'get',
      params: query
    })
}

export function fetchCrawlTargetList(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchCrawlTargetList',
        method: 'get',
        params: query
    })
}

export function fetchAccountLikesList(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchAccountLikesList',
        method: 'get',
        params: query
    })
}

export function fetchTargetFollowHistory(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchTargetFollowHistory',
        method: 'get',
        params: query
    })
}

export function fetchTargetPostList(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchTargetPostList',
        method: 'get',
        params: query
    })
}

export function fetchPanelData(query) {
    return request({
      url: '/vue-element-admin/crawlfeed/getPanelData',
      method: 'get',
      params: query
    })
  }

export function fetchAccountLocDataList(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchAccountLocDataList',
        method: 'get',
        params: query
    })
}

export function fetchLineChartPostData(query) {
    return request({
        url: '/vue-element-admin/crawlfeed/fetchLineChartPostData',
        method: 'get',
        params: query
    })
}

export function updateCrawlAccount(data) {
    return request({
      url: '/vue-element-admin/crawlfeed/updateCrawlAccount',
      method: 'post',
      data
    })
  }