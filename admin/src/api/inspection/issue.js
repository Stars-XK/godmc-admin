import request from '@/utils/request'

// 查询问题列表
export function listIssue(query) {
  return request({ url: '/inspection/issue/list', method: 'get', params: query })
}
