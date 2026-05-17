import request from '@/utils/request'

// 查询巡检任务列表
export function listTask(query) {
  return request({ url: '/inspection/task/list', method: 'get', params: query })
}

// 查询巡检任务详情
export function getTask(id) {
  return request({ url: '/inspection/task/' + id, method: 'get' })
}

// 新增巡检任务
export function addTask(data) {
  return request({ url: '/inspection/task', method: 'post', data })
}

// 修改巡检任务
export function updateTask(data) {
  return request({ url: '/inspection/task', method: 'put', data })
}

// 删除巡检任务
export function delTask(id) {
  return request({ url: '/inspection/task/' + id, method: 'delete' })
}
