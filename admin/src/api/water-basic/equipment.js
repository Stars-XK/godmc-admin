import request from '@/utils/request'

export function listStation(query) { return request({ url: '/water-basic/station/list', method: 'get', params: query }) }
export function getStation(id) { return request({ url: '/water-basic/station/' + id, method: 'get' }) }
export function addStation(data) { return request({ url: '/water-basic/station', method: 'post', data: data }) }
export function updateStation(data) { return request({ url: '/water-basic/station', method: 'put', data: data }) }
export function delStation(id) { return request({ url: '/water-basic/station/' + id, method: 'delete' }) }
export function importStationBatch(data) { return request({ url: '/water-basic/station/importBatch', method: 'post', data: data }) }

export function listDevice(query) { return request({ url: '/water-basic/device/list', method: 'get', params: query }) }
export function getDevice(id) { return request({ url: '/water-basic/device/' + id, method: 'get' }) }
export function addDevice(data) { return request({ url: '/water-basic/device', method: 'post', data: data }) }
export function updateDevice(data) { return request({ url: '/water-basic/device', method: 'put', data: data }) }
export function delDevice(id) { return request({ url: '/water-basic/device/' + id, method: 'delete' }) }
export function importDeviceBatch(data) { return request({ url: '/water-basic/device/importBatch', method: 'post', data: data }) }

export function listPoint(query) { return request({ url: '/water-basic/point/list', method: 'get', params: query }) }
export function getPoint(id) { return request({ url: '/water-basic/point/' + id, method: 'get' }) }
export function addPoint(data) { return request({ url: '/water-basic/point', method: 'post', data: data }) }
export function updatePoint(data) { return request({ url: '/water-basic/point', method: 'put', data: data }) }
export function delPoint(id) { return request({ url: '/water-basic/point/' + id, method: 'delete' }) }
export function importPointBatch(data) { return request({ url: '/water-basic/point/importBatch', method: 'post', data: data }) }
