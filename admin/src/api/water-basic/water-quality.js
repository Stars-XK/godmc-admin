import request from '@/utils/request'

/** 获取水质监测点列表(按类别分组) */
export function listQualityPoints() {
  return request({ url: '/water-basic/water-quality/points', method: 'get' })
}

/** 获取水质测点趋势数据 */
export function getQualityTrend(pointCode, startDate, endDate, interval = '1h') {
  return request({ url: '/data-integration/query/history', method: 'get', params: { pointCode, startDate, endDate, interval } })
}
