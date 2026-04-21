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

export function importGlobalBindDevices(dataList) {
  return request({
    url: '/water-basic/zone/global-bind/device/import',
    method: 'post',
    data: { dataList },
    timeout: 600000
  })
}

export function importGlobalBindRevenueUsers(dataList) {
  return request({
    url: '/water-basic/zone/global-bind/revenue/import',
    method: 'post',
    data: { dataList },
    timeout: 600000
  })
}

// ================= 指标计算配置接口 =================

export function getMetricCalcTree(zoneCode) {
  return request({
    url: '/water-basic/zone/metric-calc/tree',
    method: 'get',
    params: { zoneCode }
  })
}

export function getZoneMetricCalcConfig(zoneCode, metricType) {
  return request({
    url: '/water-basic/zone/metric-calc/config',
    method: 'get',
    params: { zoneCode, metricType }
  })
}

export function saveZoneMetricCalcConfig(data) {
  return request({
    url: '/water-basic/zone/metric-calc/config',
    method: 'post',
    data: data
  })
}