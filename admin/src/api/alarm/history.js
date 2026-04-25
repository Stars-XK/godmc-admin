import request from '@/utils/request'

// 查询报警历史列表
export function listHistory(query) {
  return request({
    url: '/alarm/history/list',
    method: 'get',
    params: query
  })
}

// 处理报警
export function resolveHistory(data) {
  return request({
    url: '/alarm/history/resolve',
    method: 'put',
    data: data
  })
}
