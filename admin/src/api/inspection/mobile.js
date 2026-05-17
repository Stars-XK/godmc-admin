import request from '@/utils/request'

// 移动端健康检查
export function mobileHealth() {
  return request({ url: '/inspection/mobile/health', method: 'get' })
}
