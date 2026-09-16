<script>
import { isLoggedIn } from '@/utils/auth.js'
import { installNativeTitleSync, syncNativeTitle } from '@/utils/wxwork-title.js'

export default {
  onLaunch() {
    // 微信/企微容器：页面切换时同步原生标题栏
    installNativeTitleSync()
  },
  onShow() {
    syncNativeTitle()
    setTimeout(() => this.checkAuthRoute(), 80)
  },
  methods: {
    checkAuthRoute() {
      const pages = getCurrentPages()
      if (!pages.length) return
      const route = pages[pages.length - 1].route || ''
      const isLoginPage = route.indexOf('login/login') >= 0
      if (isLoggedIn()) {
        if (isLoginPage) {
          uni.switchTab({ url: '/pages/workbench/workbench' })
        }
        return
      }
      if (!isLoginPage) {
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/theme.scss';

page {
  background-color: $pm-bg;
  font-size: 28rpx;
  color: $pm-text;
  font-family: $pm-font;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* 按压反馈 · 150ms 弹性回弹(设计稿 .pressable) */
.pressable {
  transition: transform 0.15s $pm-press-ease, box-shadow 0.15s $pm-press-ease;
}
.pressable:active {
  transform: scale(0.97);
}

.pm-btn-primary {
  background: $pm-grad-brand;
  color: #fff;
  border: none;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: $pm-shadow-lg;
}

.pm-btn-primary[disabled] {
  opacity: 0.45;
  box-shadow: none;
}

.pm-btn-ghost {
  background: $pm-primary-soft;
  color: $pm-primary-deep;
  border: none;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.pm-empty {
  padding: 100rpx 48rpx;
  text-align: center;
  color: $pm-muted;
  font-size: 26rpx;
}

/* 空状态：淡绿圆底 + 勾选符号，明确表达"没有待办了"，
   避免纯色渐变球被误认为图标未渲染 */
.pm-empty::before {
  content: '✓';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin: 0 auto 20rpx;
  border-radius: 50%;
  background: $pm-accent;
  color: $pm-primary;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1;
}

.pm-safe-bottom {
  height: 48rpx;
  /* 全面屏底部安全区适配（iPhone Home 指示条等） */
  height: calc(48rpx + constant(safe-area-inset-bottom));
  height: calc(48rpx + env(safe-area-inset-bottom));
}

button::after {
  border: none;
}
</style>
