import request from '@/utils/request'

// 查询营收用户列表
export function listRevenueUser(query) {
  return request({
    url: '/water-basic/revenue-user/list',
    method: 'get',
    params: query
  })
}

// 查询营收用户详细
export function getRevenueUser(id) {
  return request({
    url: '/water-basic/revenue-user/' + id,
    method: 'get'
  })
}

// 新增营收用户
export function addRevenueUser(data) {
  return request({
    url: '/water-basic/revenue-user',
    method: 'post',
    data: data
  })
}

// 修改营收用户
export function updateRevenueUser(data) {
  return request({
    url: '/water-basic/revenue-user',
    method: 'put',
    data: data
  })
}

// 删除营收用户
export function delRevenueUser(id) {
  return request({
    url: '/water-basic/revenue-user/' + id,
    method: 'delete'
  })
}

// 批量导入营收用户
export function importRevenueUserBatch(data) {
  return request({
    url: '/water-basic/revenue-user/importBatch',
    method: 'post',
    data: data,
    timeout: 600000 // 导入大文件超时时间 10 分钟
  })
}