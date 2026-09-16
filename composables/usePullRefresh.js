import { ref, computed } from 'vue'

/**
 * 自定义下拉刷新
 *
 * 为什么不用 uni-app 原生 enablePullDownRefresh：
 * H5 端（尤其企业微信 webview）原生 spinner 在手势被打断后常常不复位，
 * 出现"一直转圈不消失"。这里改为自绘指示器 + 自管状态，完全可控。
 *
 * 关键可靠性设计（曾因以下两点导致页面滚不动/下拉失效）：
 * 1. 顶部判断必须实时读取真实滚动位置（window.pageYOffset），
 *    不能依赖 onPageScroll 回调——它的触发时机在各 webview 不可靠，
 *    一旦读到过期的 scrollTop=0，armed 误判为真，
 *    preventDefault 会拦截用户所有向下滑动，页面就"滚不动"了。
 * 2. preventDefault 只在下拉意图明确（dy 超过较小死区）后才调用，
 *    向上滑动（浏览列表）永远不干预。
 *
 * 用法（在页面 setup 中）：
 *   const { pullY, status, text, touchStart, touchMove, touchEnd } = usePullRefresh(() => fetchList(true))
 *   模板：页面根节点绑 @touchstart/@touchmove/@touchend/@touchcancel
 */
export function usePullRefresh(onRefresh, options = {}) {
  const threshold = options.threshold || 64
  const maxPull = options.maxPull || 120
  const damping = options.damping || 0.62
  const deadZone = options.deadZone || 10
  /** 页面自身滚动时传 undefined；若列表用内层滚动容器（如 workbench），
   *  传入该容器的 scrollTop 读取函数，避免误判为"一直在顶部"。 */
  const customScrollTop = options.getScrollTop

  const pullY = ref(0)
  // idle 待机 | pulling 下拉中 | ready 可松手 | refreshing 刷新中 | done 已完成
  const status = ref('idle')
  const updatedAt = ref('')

  let startY = 0
  let armed = false

  /**
   * 实时读取页面真实滚动位置，不依赖任何回调。
   *
   * 为什么不能只读 window.pageYOffset：
   * 部分 WebView / uni-app 皮肤把滚动放在内层容器（uni-page-body、.uni-scroll-view 等），
   * 此时 window.pageYOffset 恒为 0，armed 会误判成"一直在顶部"，
   * 于是所有向下滑动都被 preventDefault 拦掉 —— 表现就是"列表滚不动"。
   * 这里取所有候选容器的最大值，任一容器已滚动即判定为"不在顶部"。
   */
  function collectScrollTops() {
    const tops = []
    try {
      tops.push(window.pageYOffset || 0)
      tops.push(document.documentElement ? document.documentElement.scrollTop || 0 : 0)
      tops.push(document.body ? document.body.scrollTop || 0 : 0)
      if (document.querySelector) {
        const containers = document.querySelectorAll('uni-page-body, .uni-scroll-view, .uni-page-wrapper, #app')
        for (let i = 0; i < containers.length; i++) {
          tops.push(containers[i].scrollTop || 0)
        }
      }
    } catch (e) {
      /* 非 DOM 环境（小程序等）忽略 */
    }
    return tops
  }

  function getScrollTop() {
    // #ifdef H5
    const tops = collectScrollTops()
    if (typeof customScrollTop === 'function') {
      tops.push(customScrollTop() || 0)
    }
    let max = 0
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] > max) max = tops[i]
    }
    return max
    // #endif
    // #ifndef H5
    return 0
    // #endif
  }

  const text = computed(() => {
    if (status.value === 'refreshing') return '正在刷新…'
    if (status.value === 'done') return '已更新 · ' + updatedAt.value
    if (status.value === 'ready') return '松开立即刷新'
    return '下拉刷新'
  })

  /** 下拉进度 0~1，用于指示器跟随旋转 */
  const progress = computed(() => Math.min(pullY.value / threshold, 1))

  function touchStart(e) {
    if (status.value === 'refreshing') return
    const t = e.touches && e.touches[0]
    if (!t) return
    startY = t.clientY
    armed = getScrollTop() <= 0
  }

  function touchMove(e) {
    if (!armed || status.value === 'refreshing') return
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
    if (!t) return

    // 实时校验：只要页面已经滚离顶部，立即解除下拉武装，绝不干预滚动
    if (getScrollTop() > 2) {
      armed = false
      pullY.value = 0
      status.value = 'idle'
      return
    }

    const dy = t.clientY - startY
    if (dy <= deadZone) {
      pullY.value = 0
      status.value = 'idle'
      return
    }
    // 到这里才确认是"顶部下拉"意图，阻止原生滚动/橡皮筋接管
    try {
      if (e.preventDefault) e.preventDefault()
    } catch (err) {
      /* 小程序等非 DOM 事件忽略 */
    }
    pullY.value = Math.min((dy - deadZone) * damping, maxPull)
    status.value = pullY.value >= threshold ? 'ready' : 'pulling'
  }

  /** 手动触发刷新（给按钮用，微信里手势不可靠时的兜底入口） */
  function refresh() {
    if (status.value === 'refreshing') return
    pullY.value = threshold
    status.value = 'refreshing'
    Promise.resolve()
      .then(onRefresh)
      .catch(() => {})
      .then(() => {
        const d = new Date()
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        updatedAt.value = hh + ':' + mm
        status.value = 'done'
        setTimeout(() => {
          pullY.value = 0
          status.value = 'idle'
        }, 800)
      })
  }

  function touchEnd() {
    if (!armed) return
    armed = false
    if (status.value === 'refreshing') return
    if (pullY.value >= threshold) {
      refresh()
    } else {
      pullY.value = 0
      status.value = 'idle'
    }
  }

  return { pullY, status, text, progress, updatedAt, refresh, touchStart, touchMove, touchEnd }
}
