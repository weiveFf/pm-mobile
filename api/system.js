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

/**
 * 修改当前用户密码（与 PC 端 updateUserPwd 一致）
 * 后端为 PUT /system/user/profile/updatePwd，参数走 query string
 */
export function updateUserPwd(oldPassword, newPassword) {
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'PUT',
    params: { oldPassword, newPassword }
  })
}
