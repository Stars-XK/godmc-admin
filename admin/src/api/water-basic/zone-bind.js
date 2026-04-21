import request from '@/utils/request'

// --- 以下为新增：分区关联设备/营收 接口 ---

export function getUnboundDeviceList(query) {
  return request({
    url: '/water-basic/zone/unbound/device/list',
    method: 'get',
    params: query
  })
}

export function bindDevices(data) {
  return request({
    url: '/water-basic/zone/bind/device',
    method: 'post',
    data: data
  })
}

export function importBindDevices(data) {
  return request({
    url: '/water-basic/zone/bind/device/import',
    method: 'post',
    data: data,
    timeout: 600000
  })
}

export function getUnboundRevenueList(query) {
  return request({
    url: '/water-basic/zone/unbound/revenue/list',
    method: 'get',
    params: query
  })
}

export function bindRevenueUsers(data) {
  return request({
    url: '/water-basic/zone/bind/revenue',
    method: 'post',
    data: data
  })
}

export function importBindRevenueUsers(data) {
  return request({
    url: '/water-basic/zone/bind/revenue/import',
    method: 'post',
    data: data,
    timeout: 600000
  })
}

// --- 全局批量导入 ---

export function importGlobalBindDevices(data) {
  return request({
    url: '/water-basic/zone/global-bind/device/import',
    method: 'post',
    data: data,
    timeout: 600000
  })
}

export function importGlobalBindRevenueUsers(data) {
  return request({
    url: '/water-basic/zone/global-bind/revenue/import',
    method: 'post',
    data: data,
    timeout: 600000
  })
}