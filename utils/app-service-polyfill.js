/**
 * App 逻辑层无完整 DOM。本文件禁止 import（import 会提升，晚于本脚本执行）。
 * main.js 须最先 import 本文件，再 import app-service-jsencrypt.js
 */
// #ifdef APP-PLUS
;(function () {
  const noop = function () {}
  const stubs = {
    addEventListener: noop,
    removeEventListener: noop,
    attachEvent: noop,
    detachEvent: noop,
    dispatchEvent: function () {
      return true
    },
    navigator: { appName: 'UniApp', userAgent: '' },
    document: { documentElement: {} }
  }

  function patchWin(w) {
    const base = w && typeof w === 'object' ? w : {}
    Object.keys(stubs).forEach((key) => {
      if (base[key] == null) base[key] = stubs[key]
    })
    return base
  }

  const g = typeof globalThis !== 'undefined' ? globalThis : {}
  g.window = patchWin(g.window)

  try {
    if (typeof window !== 'undefined' && window != null) {
      patchWin(window)
    } else {
      new Function('w', 'window=w')(g.window)
    }
  } catch (e) {
    try {
      new Function('w', 'window=w')(g.window)
    } catch (e2) {
      /* ignore */
    }
  }
})()
// #endif
