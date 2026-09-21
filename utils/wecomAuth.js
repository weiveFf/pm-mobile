/**
 * 企业微信自建应用 H5 —— 免密登录
 *
 * 两条入口：
 *  - 自动：wecomAutoLogin()  —— 在企微里打开页面时静默走一次（App.vue 的 onShow 调用）
 *  - 手动：wecomLogin()      —— 登录页「企业微信登录」按钮，用户点了就强制走一次
 *    （自动那条有「本会话已尝试过就跳过」的防重跳保护，偶发失败时不会再试，
 *      所以必须保留手动入口，用户一点即可重试）
 *
 * 流程：
 *  1) 地址栏带 code（企微 OAuth 回跳）→ 调 /wechat/code-login 换 token → 存本地 → 清理 URL 上的 code
 *  2) 无 code 且在企微容器（UA 含 wxwork）→ 调 /wechat/oauth-url 取授权链接 → 整页跳转授权
 *  3) 普通浏览器 / 已登录 → 不处理（保持账号密码登录）
 *
 * 依赖后端：
 *  - POST /wechat/code-login  已存在（code → weChatUserId → 系统用户 → JWT）
 *  - GET  /wechat/oauth-url   已存在（CorpId 取系统参数 wecom.corpId）
 *
 * ⚠️ 前置条件（企微侧，代码无法代替）：
 *  H5 部署域名必须配置为该自建应用的「网页授权及JS-SDK → 可信域名」，
 *  且不能是 IP / localhost、不能带协议头与路径、需与访问域名完全一致（带端口时端口也要登记）、
 *  需通过 ICP 备案校验并在域名根目录放好 WW_verify_*.txt 校验文件。
 *  否则企微会拦在授权页并提示「redirect_uri需使用应用可信域名」。
 *  为免把用户卡在企微错误页上，本文件会在地址根本不可能通过校验时**直接跳过免登**，回落账号密码登录。
 *
 *  注意区分：PC 端扫码登录（wwlogin）配的是「企业微信授权登录 → Web网页 → 授权回调域」，
 *  手机端 H5 网页授权（oauth2/authorize）校验的是上面这个「可信域名」—— 两个字段互相独立。
 */
import { isLoggedIn, setToken, setUserId, setUserName, setAccount } from '@/utils/auth.js'
import { weChatCodeLogin, getWecomOauthUrl } from '@/api/login.js'

/** 上次跳授权的时间戳；60s 内不重复跳（防企微报错后死循环），超过则允许再试一次（自愈偶发失败） */
const OAUTH_TRIED_KEY = 'yessys_pm_wecom_oauth_tried'
const OAUTH_TRIED_TTL = 60000

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

/** 应急开关：地址栏加 ?nologin=1 时强制走账号密码登录（企微后台没配好时用它进系统） */
function skipAutoLoginByQuery() {
  // #ifdef H5
  return /[?&](?:nologin|pwd)=1/.test(String(window.location.search || ''))
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 当前地址是否**根本不可能**作为 redirect_uri 通过企微校验。
 * 企微只禁止「IP / 本机地址」这类形式：可信域名不支持 IP 地址与短链域名，且必须与访问域名完全一致。
 * 注意：**与协议头无关**（官方示例中 http 同样可以通过），端口则需要在可信域名里一并登记 ——
 * 这两种情况不拦截，只在控制台提示，避免误伤 http 部署的正式环境。
 */
function canUseOauthRedirect() {
  // #ifdef H5
  const loc = window.location
  const host = String(loc.hostname || '')
  if (!host || host === 'localhost' || host === '127.0.0.1') return false
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false // IPv4：企微不接受 IP 作为可信域名
  if (host.indexOf(':') >= 0) return false // IPv6
  if (String(loc.protocol || '') !== 'https:') {
    console.warn('[wecom] 当前为 http：企微可信域名与协议头无关，可继续；请确认该域名已配为可信域名')
  }
  if (loc.port) {
    console.warn('[wecom] 当前地址带端口 ' + loc.port + '：企微要求端口号也登记到可信域名中')
  }
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 最近一次跳授权是否还在「冷却期」内。
 * 用时间戳而不是布尔值：早先写死的 `'1'` 会在整个 WebView 会话里一直拦着，
 * 一旦有一次偶发失败（网络抖动、后台未配好），之后每次打开都静默不自动登录 ——
 * 用户反馈的「有几率不自动进首页」就是这个原因。改为 60s 冷却后，超时即可自动重试。
 */
function oauthTried() {
  // #ifdef H5
  try {
    const raw = window.sessionStorage.getItem(OAUTH_TRIED_KEY)
    if (!raw) return false
    const t = Number(raw)
    if (!Number.isFinite(t) || t <= 0) return raw === '1' // 兼容旧值
    const fresh = Date.now() - t < OAUTH_TRIED_TTL
    if (!fresh) clearOauthTried() // 已冷却完，清掉让本次可以重试
    return fresh
  } catch (e) {
    return false
  }
  // #endif
  // #ifndef H5
  return false
  // #endif
}

function markOauthTried() {
  // #ifdef H5
  try {
    window.sessionStorage.setItem(OAUTH_TRIED_KEY, String(Date.now()))
  } catch (e) {
    /* 忽略 */
  }
  // #endif
}

function clearOauthTried() {
  // #ifdef H5
  try {
    window.sessionStorage.removeItem(OAUTH_TRIED_KEY)
  } catch (e) {
    /* 忽略 */
  }
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

/** 用 code 换 token（自动/手动登录共用） */
async function exchangeCode(code) {
  try {
    const res = await weChatCodeLogin({ code })
    const data = (res && res.data) || {}
    if (!data.token) {
      throw new Error((res && res.msg) || '企业微信登录失败')
    }
    saveLogin(data)
    cleanOauthQuery()
    clearOauthTried()
    return true
  } catch (e) {
    cleanOauthQuery()
    // 常见：企业微信账号未绑定系统用户（sys_user.WeChatUserId 为空）
    setTimeout(() => {
      uni.showToast({ title: (e && e.message) || '企业微信登录失败', icon: 'none', duration: 3000 })
    }, 300)
    return false
  }
}

/** 取授权链接并整页跳转（自动/手动共用）；网络抖动时重试一次 */
async function gotoOauth() {
  let failed = false
  for (let i = 0; i < 2; i++) {
    try {
      const res = await getWecomOauthUrl({ redirect: currentRedirectUri() })
      const url = (res && res.data && (res.data.url || res.data)) || ''
      if (url) {
        markOauthTried()
        window.location.replace(url)
        return true
      }
      failed = true
    } catch (e) {
      failed = true
    }
  }
  if (failed) console.warn('[wecom] 取授权链接失败，已回落账号密码登录')
  return false
}

/**
 * 自动尝试企业微信免密登录（App.vue 的 onShow 调用）。
 * @returns {Promise<boolean>} true = 已登录成功或正在跳转授权；false = 未处理（走账号密码登录）
 */
export async function wecomAutoLogin() {
  if (isLoggedIn()) return true

  // #ifndef H5
  return false
  // #endif

  // #ifdef H5
  if (!isWeComBrowser()) return false
  if (skipAutoLoginByQuery()) return false

  const code = takeCodeFromUrl()
  if (code) return await exchangeCode(code)

  // 地址形式根本不可能通过企微校验（IP / localhost）→ 跳过去只会看到企微报错页
  if (!canUseOauthRedirect()) {
    console.warn(
      '[wecom] 当前地址不满足企业微信可信域名要求，已跳过免密登录：' + String(window.location.origin || '')
    )
    return false
  }

  // 本会话已跳过一次授权仍没登录成功（多半是后台未配可信域名）→ 不再反复跳，回落账号密码登录
  // 想重试请走登录页的「企业微信登录」按钮（wecomLogin）
  if (oauthTried()) return false

  return await gotoOauth()
  // #endif
}

/**
 * 手动「企业微信登录」——登录页按钮触发。
 * 与自动登录的区别：忽略「本会话已尝试过」的防重跳标记（手动点击一定是用户主动重试），
 * 非企微环境给出明确提示而不是静默失败。
 */
export async function wecomLogin() {
  // #ifndef H5
  uni.showToast({ title: '请在企业微信中打开本页面', icon: 'none' })
  return false
  // #endif

  // #ifdef H5
  if (isLoggedIn()) return true

  if (!isWeComBrowser()) {
    uni.showToast({ title: '请在企业微信中打开本页面', icon: 'none', duration: 2600 })
    return false
  }
  if (!canUseOauthRedirect()) {
    uni.showToast({ title: '当前地址不满足企业微信授权要求', icon: 'none', duration: 2600 })
    return false
  }

  // 回跳带 code：直接换 token
  const code = takeCodeFromUrl()
  if (code) return await exchangeCode(code)

  // 手动重试前清掉防重跳标记，保证这次一定发起请求
  clearOauthTried()
  uni.showLoading({ title: '正在跳转企业微信…', mask: true })
  const ok = await gotoOauth()
  if (!ok) {
    uni.hideLoading()
    uni.showToast({ title: '企业微信登录失败，请稍后重试', icon: 'none', duration: 2600 })
  }
  return ok
  // #endif
}
