import { request } from '@/utils/request.js'

export function listDept(params) {
  return request({
    url: '/system/dept/list',
    method: 'GET',
    params: params || { queryDeptAllName: true }
  })
}

export function listUser(params) {
  return request({
    url: '/system/user/list',
    method: 'GET',
    params
  })
}
