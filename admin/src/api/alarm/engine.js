import request from '@/utils/request'

// 重载报警规则引擎（修改规则后调用，无需重启服务）
export function reloadEngine() {
  return request({
    url: '/alarm/engine/reload',
    method: 'post'
  })
}

// 手动提交事实数据给报警引擎评估
export function evaluateEngine(data) {
  return request({
    url: '/alarm/engine/evaluate',
    method: 'post',
    data: data
  })
}

// 获取报警引擎状态
export function engineStatus() {
  return request({
    url: '/alarm/engine/status',
    method: 'get'
  })
}
