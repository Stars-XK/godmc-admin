import request from '@/utils/request'

// 提交巡检记录（单条）
export function submitRecord(data) {
  return request({ url: '/inspection/record/submit', method: 'post', data })
}

// 批量提交巡检记录
export function batchSubmitRecord(data) {
  return request({ url: '/inspection/record/batch-submit', method: 'post', data })
}

// 查询巡检记录列表
export function listRecord(query) {
  return request({ url: '/inspection/record/list', method: 'get', params: query })
}

// 查询某任务的巡检记录
export function listRecordByTask(taskId) {
  return request({ url: '/inspection/record/task/' + taskId, method: 'get' })
}
