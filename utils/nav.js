/** 切换到工作台 Tab */
export function goHome() {
  uni.switchTab({ url: '/pages/workbench/workbench' })
}

/** 切换到反馈列表 Tab */
export function goFeedbackList() {
  uni.switchTab({ url: '/pages/feedback/feedback' })
}

/** 返回上一页；无历史时回工作台 */
export function goBackOrHome() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      delta: 1,
      fail: () => goHome()
    })
    return
  }
  goHome()
}

/** 是否从外链/通知直接进入（页面栈只有当前页） */
export function isEntryPage() {
  try {
    return getCurrentPages().length <= 1
  } catch (e) {
    return false
  }
}
