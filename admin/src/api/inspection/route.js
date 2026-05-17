import request from '@/utils/request'

// 查询巡检路线列表
export function listRoute(query) {
  return request({ url: '/inspection/route/list', method: 'get', params: query })
}

// 查询巡检路线详情
export function getRoute(id) {
  return request({ url: '/inspection/route/' + id, method: 'get' })
}

// 新增巡检路线
export function addRoute(data) {
  return request({ url: '/inspection/route', method: 'post', data })
}

// 修改巡检路线
export function updateRoute(data) {
  return request({ url: '/inspection/route', method: 'put', data })
}

// 删除巡检路线
export function delRoute(id) {
  return request({ url: '/inspection/route/' + id, method: 'delete' })
}

// 获取路线GeoJSON
export function getRouteGeoJson(id) {
  return request({ url: '/inspection/route/geojson/' + id, method: 'get' })
}
