import request from '@/utils/request'

// 查询任务审核记录
export function listReviewByTask(taskId) {
  return request({ url: '/inspection/review/task/' + taskId, method: 'get' })
}
