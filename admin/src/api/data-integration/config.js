import request from '@/utils/request'

// --- 数据源 (Source) ---

// 获取数据源列表
export function listSource(query) {
  return request({
    url: '/data-integration/config/source/list',
    method: 'get',
    params: query
  })
}

// 新增数据源
export function addSource(data) {
  return request({
    url: '/data-integration/config/source',
    method: 'post',
    data: data
  })
}

// 修改数据源
export function updateSource(data) {
  return request({
    url: '/data-integration/config/source',
    method: 'put',
    data: data
  })
}

// 删除数据源
export function delSource(id) {
  return request({
    url: '/data-integration/config/source/' + id,
    method: 'delete'
  })
}

// 测试数据源连接
export function testSourceConnection(data) {
  return request({
    url: '/data-integration/config/source/test',
    method: 'post',
    data: data
  })
}

// --- 接入任务 (Task) ---

// 获取任务列表
export function listTask(query) {
  return request({
    url: '/data-integration/config/task/list',
    method: 'get',
    params: query
  })
}

// 新增任务
export function addTask(data) {
  return request({
    url: '/data-integration/config/task',
    method: 'post',
    data: data
  })
}

// 修改任务
export function updateTask(data) {
  return request({
    url: '/data-integration/config/task',
    method: 'put',
    data: data
  })
}

// 删除任务
export function delTask(id) {
  return request({
    url: '/data-integration/config/task/' + id,
    method: 'delete'
  })
}

// --- 字段映射 (Mapping) ---

// 获取任务字段映射列表
export function listMapping(taskId) {
  return request({
    url: '/data-integration/config/mapping/list',
    method: 'get',
    params: { taskId }
  })
}

// 批量保存任务字段映射
export function saveMappingBatch(taskId, mappings) {
  return request({
    url: '/data-integration/config/mapping/batch/' + taskId,
    method: 'post',
    data: { mappings }
  })
}

// --- 本地系统表与字段元数据 ---
export function listLocalTables() {
  return request({
    url: '/data-integration/config/local/tables',
    method: 'get'
  })
}

export function listLocalColumns(tableName) {
  return request({
    url: `/data-integration/config/local/columns/${tableName}`,
    method: 'get'
  })
}
