import request from '@/utils/request'

// 查询巡检计划列表
export function listPlan(query) {
  return request({ url: '/inspection/plan/list', method: 'get', params: query })
}

// 查询巡检计划详情
export function getPlan(id) {
  return request({ url: '/inspection/plan/' + id, method: 'get' })
}

// 新增巡检计划
export function addPlan(data) {
  return request({ url: '/inspection/plan', method: 'post', data })
}

// 修改巡检计划
export function updatePlan(data) {
  return request({ url: '/inspection/plan', method: 'put', data })
}

// 删除巡检计划
export function delPlan(id) {
  return request({ url: '/inspection/plan/' + id, method: 'delete' })
}

// 更新计划状态
export function updatePlanStatus(id, planStatus) {
  return request({ url: '/inspection/plan/status/' + id, method: 'put', data: { planStatus } })
}
