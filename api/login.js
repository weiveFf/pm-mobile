import { request } from '@/utils/request.js'
import { getBaseURL } from '@/utils/auth.js'

export function fetchPublicKey() {
  return new Promise((resolve, reject) => {
    uni.request({
      url: getBaseURL() + '/login/public-key',
      method: 'GET',
      success: (res) => {
        const body = res.data
        if (res.statusCode === 200 && body && body.code === 200) {
          resolve(body)
        } else {
          reject(new Error((body && body.msg) || '获取公钥失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

export function loginEncrypt(encryptedData) {
  return request({
    url: '/encrypt/login',
    method: 'POST',
    data: { encryptedData }
  })
}

export function fetchUserInfo() {
  return request({
    url: '/getInfo',
    method: 'GET'
  })
}

export function logoutApi() {
  return request({
    url: '/LogOut',
    method: 'POST'
  })
}

/** 企业微信网页授权 code 换 token（后端 /wechat/code-login，匿名接口） */
export function weChatCodeLogin(data) {
  return request({
    url: '/wechat/code-login',
    method: 'POST',
    data,
    skipAuthRedirect: true
  })
}

/** 取企业微信网页授权链接（CorpId 由后端系统参数 wecom.corpId 提供，匿名接口） */
export function getWecomOauthUrl(params) {
  return request({
    url: '/wechat/oauth-url',
    method: 'GET',
    params,
    skipAuthRedirect: true
  })
}
