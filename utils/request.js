import { getToken, getUserId, getBaseURL } from '@/utils/auth.js'
import { redirectToLogin, isHandling401 } from '@/utils/session.js'

/**
 * 对接 Yessys WebApi（与 YessysWebVue 相同响应结构 code/msg/data）
 */
export function request(options) {
  const { url, method = 'GET', data, params, header = {}, skipAuthRedirect = false } = options
  let fullUrl = getBaseURL() + url
  if (params && Object.keys(params).length) {
    const qs = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&')
    if (qs) fullUrl += (fullUrl.indexOf('?') >= 0 ? '&' : '?') + qs
  }
  const token = getToken()
  const userId = getUserId()
  if (token) {
    header.Authorization = 'Bearer ' + token
  }
  if (userId) {
    header.userid = String(userId)
  }
  header['Content-Type'] = header['Content-Type'] || 'application/json'

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header,
      success: (res) => {
        const body = res.data
        if (res.statusCode === 401 || (body && body.code === 401)) {
          if (!skipAuthRedirect) {
            redirectToLogin((body && body.msg) || '登录已过期，请重新登录')
          }
          reject(new Error((body && body.msg) || '登录已过期'))
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error('网络异常 ' + res.statusCode))
          return
        }
        if (body && body.code !== 200) {
          reject(new Error(body.msg || '请求失败'))
          return
        }
        resolve(body)
      },
      fail: (err) => {
        if (!isHandling401()) {
          reject(err)
        }
      }
    })
  })
}
