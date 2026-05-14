import request from '@/utils/request'

/** 报告列表 */
export function listReport(params) {
  return request({ url: '/system/report-center/list', method: 'get', params })
}

/** 报告详情 */
export function getReport(id) {
  return request({ url: '/system/report-center/' + id, method: 'get' })
}

/** 生成报告 */
export function generateReport(params) {
  return request({ url: '/system/report-center/generate', method: 'post', params })
}

/** 更新报告 */
export function updateReport(id, data) {
  return request({ url: '/system/report-center/' + id, method: 'put', data })
}

/** 删除报告 */
export function delReport(id) {
  return request({ url: '/system/report-center/' + id, method: 'delete' })
}
