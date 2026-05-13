import request from '@/utils/request'

export function listBill(query) { return request({ url: '/water-basic/billing/list', method: 'get', params: query }) }
export function getBill(id) { return request({ url: '/water-basic/billing/' + id, method: 'get' }) }
export function addBill(data) { return request({ url: '/water-basic/billing', method: 'post', data }) }
export function updateBill(data) { return request({ url: '/water-basic/billing', method: 'put', data }) }
export function delBill(id) { return request({ url: '/water-basic/billing/' + id, method: 'delete' }) }
