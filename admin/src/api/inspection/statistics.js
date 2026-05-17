import request from '@/utils/request'

// 获取仪表盘 KPI + 趋势 + 排行榜
export function getDashboard(query) {
  return request({ url: '/inspection/statistics/dashboard', method: 'get', params: query })
}

// 获取日趋势
export function getDailyTrend(days) {
  return request({ url: '/inspection/statistics/trend', method: 'get', params: { days } })
}

// 获取检查员排行榜
export function getInspectorRanking(limit) {
  return request({ url: '/inspection/statistics/ranking', method: 'get', params: { limit } })
}

// 获取合规率详情
export function getCompliance(query) {
  return request({ url: '/inspection/statistics/compliance', method: 'get', params: query })
}

// 获取问题趋势
export function getIssueTrend(query) {
  return request({ url: '/inspection/statistics/issue-trend', method: 'get', params: query })
}
