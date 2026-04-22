import request from '@/utils/request'

export function getLatestDataBatch(query) {
  return request({
    url: '/data-integration/query/latest-batch',
    method: 'get',
    params: query
  })
}

export function getHistoryData(query) {
  return request({
    url: '/data-integration/query/history',
    method: 'get',
    params: query
  })
}