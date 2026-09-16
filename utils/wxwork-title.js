/**
 * 微信 / 企业微信内置浏览器的原生标题同步
 *
 * 背景：H5 以内部应用形式挂在企业微信工作台时，容器顶部自带原生标题栏，
 * 该标题栏读取 document.title，且无法通过前端 API 隐藏。
 * 因此自绘导航栏在嵌入模式下撤掉，改为按当前页面动态写入 document.title，
 * 实现"切换页面 → 企微标题栏跟着变"。
 *
 * 标题数据源统一为 pages.json 各页的 navigationBarTitleText。
 */
import pages from '@/pages.json'

const titleMap = {}
;(pages.pages || []).forEach((p) => {
  const t = p.style && p.style.navigationBarTitleText
  if (t) titleMap['/' + p.path] = t
})

/** 是否运行在微信/企业微信内置浏览器 */
export function isWxwork() {
  // #ifdef H5
  try {
    return /wxwork|micromessenger/i.test(navigator.userAgent || '')
  } catch (e) {
    return false
  }
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/** 把当前页面的标题写入 document.title */
export function syncNativeTitle() {
  if (!isWxwork()) return
  try {
    const list = getCurrentPages()
    const cur = list[list.length - 1]
    if (!cur) return
    const title = titleMap['/' + cur.route]
    if (title && document.title !== title) {
      document.title = title
    }
  } catch (e) {
    /* ignore */
  }
}

/**
 * 注册路由拦截，页面切换后自动同步标题
 * 在 App.vue onLaunch 中调用一次即可
 */
export function installNativeTitleSync() {
  if (!isWxwork()) return
  const methods = ['navigateTo', 'redirectTo', 'switchTab', 'reLaunch', 'navigateBack']
  methods.forEach((m) => {
    uni.addInterceptor(m, {
      success: () => {
        setTimeout(syncNativeTitle, 80)
      }
    })
  })
  syncNativeTitle()
}
