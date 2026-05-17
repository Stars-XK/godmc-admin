import request from '@/utils/request'

// 上报GPS位置（单条）
export function uploadLocation(data) {
  return request({ url: '/inspection/tracking/location', method: 'post', data })
}

// 批量上报GPS位置（离线同步）
export function batchUploadLocation(data) {
  return request({ url: '/inspection/tracking/batch', method: 'post', data })
}

// 查询任务轨迹（支持时间范围）
export function getTrail(taskId, query) {
  return request({ url: '/inspection/tracking/trail/' + taskId, method: 'get', params: query })
}

// 获取所有在线巡检员实时位置
export function getLivePositions() {
  return request({ url: '/inspection/tracking/live', method: 'get' })
}

// 获取单个巡检员实时位置
export function getLivePosition(userId) {
  return request({ url: '/inspection/tracking/live/' + userId, method: 'get' })
}
