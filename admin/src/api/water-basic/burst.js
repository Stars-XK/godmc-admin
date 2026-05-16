import request from '@/utils/request'

// 对指定分区执行爆管分析
export function analyzeZone(zoneCode) {
  return request({
    url: '/water-basic/burst/analyze/' + zoneCode,
    method: 'post'
  })
}

// 对所有分区执行爆管分析
export function analyzeAllZones() {
  return request({
    url: '/water-basic/burst/analyze-all',
    method: 'post'
  })
}

// 分页查询爆管事件列表
export function listBurstEvents(query) {
  return request({
    url: '/water-basic/burst/events',
    method: 'get',
    params: query
  })
}

// 获取爆管事件详情
export function getBurstEvent(id) {
  return request({
    url: '/water-basic/burst/events/' + id,
    method: 'get'
  })
}

// 更新事件状态
export function updateBurstEventStatus(id, status) {
  return request({
    url: '/water-basic/burst/events/' + id,
    method: 'put',
    data: { status }
  })
}

// 获取爆管影响面
export function getBurstArea(eventId) {
  return request({
    url: '/water-basic/burst/area/' + eventId,
    method: 'get'
  })
}

// 获取所有分区爆管风险等级
export function getRiskZones() {
  return request({
    url: '/water-basic/burst/risk-zones',
    method: 'get'
  })
}

// 获取分区历史爆管记录
export function getBurstHistory(zoneCode) {
  return request({
    url: '/water-basic/burst/history/' + zoneCode,
    method: 'get'
  })
}
