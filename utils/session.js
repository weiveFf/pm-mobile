import { clearAuth } from '@/utils/auth.js'

let _handling401 = false

export function redirectToLogin(message) {
  if (_handling401) return
  _handling401 = true
  clearAuth()
  uni.showToast({
    title: message || '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/login/login' })
    _handling401 = false
  }, 300)
}

export function isHandling401() {
  return _handling401
}
