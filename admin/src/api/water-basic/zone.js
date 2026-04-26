import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询分区列表
export function listZone(query) {
  return request({
    url: '/water-basic/zone/list',
    method: 'get',
    params: query
  })
}

// 查询分区树
export function listZoneTree(query) {
  return request({
    url: '/water-basic/zone/tree',
    method: 'get',
    params: query
  })
}

// 懒加载查询下级分区
export function lazyZoneChildren(parentId, query) {
  return request({
    url: '/water-basic/zone/lazyChildren',
    method: 'get',
    params: { parentId, ...query }
  })
}

// 查询分区详细
export function getZone(id) {
  return request({
    url: '/water-basic/zone/' + parseStrEmpty(id),
    method: 'get'
  })
}

// 新增分区
export function addZone(data) {
  return request({
    url: '/water-basic/zone',
    method: 'post',
    data: data
  })
}

// 修改分区
export function updateZone(data) {
  return request({
    url: '/water-basic/zone',
    method: 'put',
    data: data
  })
}

// 删除分区
export function delZone(id) {
  return request({
    url: '/water-basic/zone/' + id,
    method: 'delete'
  })
}
