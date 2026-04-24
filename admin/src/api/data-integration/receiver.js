import request from '@/utils/request'

// 模拟产生设备数据
export function generateMockData(data) {
  return request({
    url: '/data-integration/receiver/mock/generate',
    method: 'post',
    data: data
  })
}

// 模拟产生营收数据
export function generateMockRevenueData(data) {
  return request({
    url: '/data-integration/receiver/mock/revenue/generate',
    method: 'post',
    data: data
  })
}
