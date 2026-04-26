import request from '@/utils/request'

// 查询备份文件列表
export function listBackups() {
  return request({
    url: '/system/backup/list',
    method: 'get'
  })
}

// 创建新备份
export function createBackup() {
  return request({
    url: '/system/backup/create',
    method: 'post'
  })
}

// 恢复备份
export function restoreBackup(filename) {
  return request({
    url: '/system/backup/restore/' + filename,
    method: 'post'
  })
}

// 删除备份
export function delBackup(filename) {
  return request({
    url: '/system/backup/' + filename,
    method: 'delete'
  })
}
