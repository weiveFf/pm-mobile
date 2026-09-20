/**
 * 企业微信自建应用 H5 —— 免密自动登录
 *
 * 流程（仅 H5 生效）：
 *  1) 地址栏带 code（企微 OAuth 回跳）→ 调 /wechat/code-login 换 token → 存本地 → 清理 URL 上的 code
 *  2) 无 code 且在企微容器（UA 含 wxwork）→ 调 /wechat/oauth-url 取授权链接 → 整页跳转授权
 *  3) 普通浏览器 / 已登录 → 不处理（保持账号密码登录）
 *
 * 依赖后端：
 *  - POST /wechat/code-login  已存在（code → weChatUserId → 系统用户 → JWT）
 *  - GET  /wechat/oauth-url   本次新增（CorpId 取自系统参数 wecom.corpId）
 */
import { isLoggedIn, setToken, setUserId, setUserName, setAccount } from '@/utils/auth.js'
import { weChatCodeLogin, getWecomOauthUrl } from '@/api/login.js'

/** 是否在企业微信内置浏览器（企业微信 UA 含 wxwork） */
export function isWeComBrowser() {
  // #ifdef H5
  const ua = String((window.navigator && window.navigator.userAgent) || '').toLowerCase()
  return ua.indexOf('wxwork') >= 0
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/** 从地址栏取 OAuth 回跳的 code（企微把 code 拼在 redirect_uri 的 query 上） */
function takeCodeFromUrl() {
  // #ifdef H5
  const search = String(window.location.search || '')
  const m = search.match(/[?&]code=([^&#]+)/)
  return m ? decodeURIComponent(m[1]) : ''
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

/** 清掉地址栏上的 code/state，避免刷新时重复用同一个 code 换 token */
function cleanOauthQuery() {
  // #ifdef H5
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  } catch (e) {
    /* 忽略 */
  }
  // #endif
}

/** 当前页地址，用作 OAuth 的 redirect_uri（必须落在企微「可信域名」下） */
function currentRedirectUri() {
  // #ifdef H5
  return window.location.origin + window.location.pathname
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

function saveLogin(data) {
  setToken(data.token)
  setUserId(String(data.userId || ''))
  setUserName(data.nickName || data.userName || '')
  setAccount(data.userName || '')
}

/**
 * 尝试企业微信自动登录。
 * @returns {Promise<boolean>} true = 已登录成功或正在跳转授权；false = 未处理
 */
export async function wecomAutoLogin() {
  if (isLoggedIn()) return true

  // #ifndef H5
  return false
  // #endif

  // #ifdef H5
  if (!isWeComBrowser()) return false

  const code = takeCodeFromUrl()
  if (code) {
    try {
      const res = await weChatCodeLogin({ code })
      const data = (res && res.data) || {}
      if (!data.token) {
        throw new Error((res && res.msg) || '企业微信登录失败')
      }
      saveLogin(data)
      cleanOauthQuery()
      return true
    } catch (e) {
      cleanOauthQuery()
      // 常见：企业微信账号未绑定系统用户 → 提示后回落到账号密码登录
      setTimeout(() => {
        uni.showToast({ title: (e && e.message) || '企业微信登录失败', icon: 'none', duration: 3000 })
      }, 300)
      return false
    }
  }

  // 在企微容器内但尚未授权：整页跳转静默授权，回跳后带 code
  try {
    const res = await getWecomOauthUrl({ redirect: currentRedirectUri() })
    const url = (res && res.data && (res.data.url || res.data)) || ''
    if (url) {
      window.location.replace(url)
      return true
    }
  } catch (e) {
    /* 未配置 corpId 等：静默回落账号密码登录 */
  }
  return false
  // #endif
}
