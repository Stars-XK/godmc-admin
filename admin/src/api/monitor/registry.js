import request from '@/utils/request'

export function listOnlineServices() {
  return request({
    url: '/monitor/registry/list',
    method: 'get'
  })
}
