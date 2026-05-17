import request from '@/utils/request'

// ================= 检查点 =================

// 查询检查点列表
export function listCheckpoint(query) {
  return request({ url: '/inspection/checkpoint/list', method: 'get', params: query })
}

// 查询检查点详情（含检查项）
export function getCheckpoint(id) {
  return request({ url: '/inspection/checkpoint/' + id, method: 'get' })
}

// 新增检查点
export function addCheckpoint(data) {
  return request({ url: '/inspection/checkpoint', method: 'post', data })
}

// 修改检查点
export function updateCheckpoint(data) {
  return request({ url: '/inspection/checkpoint', method: 'put', data })
}

// 删除检查点
export function delCheckpoint(id) {
  return request({ url: '/inspection/checkpoint/' + id, method: 'delete' })
}

// ================= 检查项 =================

// 查询检查点的检查项列表
export function listCheckItem(checkpointId) {
  return request({ url: '/inspection/checkpoint/' + checkpointId + '/items', method: 'get' })
}

// 新增检查项
export function addCheckItem(data) {
  return request({ url: '/inspection/checkpoint/item', method: 'post', data })
}

// 修改检查项
export function updateCheckItem(data) {
  return request({ url: '/inspection/checkpoint/item', method: 'put', data })
}

// 删除检查项
export function delCheckItem(id) {
  return request({ url: '/inspection/checkpoint/item/' + id, method: 'delete' })
}
