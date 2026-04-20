import request from '@/utils/request'

export function listBackups() {
  return request({ url: '/system/backup/list', method: 'get' })
}

export function createBackup() {
  return request({ url: '/system/backup/create', method: 'post' })
}

export function restoreBackup(filename) {
  return request({ url: '/system/backup/restore', method: 'post', data: { filename } })
}

export function delBackup(filename) {
  return request({ url: '/system/backup/' + filename, method: 'delete' })
}
