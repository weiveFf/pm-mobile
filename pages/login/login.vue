<template>
  <view class="login-page" :class="sizeClass" :style="pageStyle">
    <view class="bg-deco d1" />
    <view class="bg-deco d2" />
    <view class="bg-deco d3" />
    <view class="body" :style="{ paddingBottom: safeBottom + 'px' }">
      <view class="top">
        <view class="brand-row">
          <view class="logo">Y</view>
          <text class="brand-name">Yessys PM</text>
        </view>

        <view class="hero">
          <text class="hello">{{ greeting }} 👋</text>
          <text class="hello-accent">今天也要顺顺利利</text>
          <text class="lede">登录后同步你的项目与任务</text>
        </view>
      </view>

      <view class="mid">
        <view class="field" :class="{ focus: focusField === 'user' }">
          <text class="lb">账号（姓名拼音）</text>
          <input
            v-model="username"
            class="ipt"
            placeholder="请输入账号（姓名拼音）"
            placeholder-class="ph"
            confirm-type="next"
            @focus="onFocus('user')"
            @blur="onBlur"
          />
        </view>

        <view class="field" :class="{ focus: focusField === 'pwd' }">
          <text class="lb">密码</text>
          <input
            v-model="password"
            class="ipt"
            password
            placeholder="请输入密码"
            placeholder-class="ph"
            confirm-type="done"
            @confirm="onLogin"
            @focus="onFocus('pwd')"
            @blur="onBlur"
          />
        </view>

        <button class="login-btn" :loading="loading" :disabled="loading" @click="onLogin">
          登 录
        </button>

        <!-- 企业微信登录：自动免登偶发失败（如网络抖动、本次会话已跳过）时的兜底入口 -->
        <button class="wx-btn" :disabled="wxLoading" @click="onWecomLogin">
          <svg class="wx-ico" viewBox="0 0 24 24">
            <path
              d="M12 3.2c-5.1 0-9.2 3.5-9.2 7.8 0 2.4 1.3 4.6 3.3 6.1L5.4 21l3.9-1.9c.8.2 1.7.3 2.7.3 5.1 0 9.2-3.5 9.2-7.8S17.1 3.2 12 3.2z"
              fill="currentColor"
            />
          </svg>
          <text class="wx-txt">{{ wxLoading ? '正在跳转…' : '企业微信登录' }}</text>
        </button>
        <text class="wecom-tip">若企业微信打开本应用未跳过登录，请退出后重试</text>
      </view>

      <view class="bottom">
        <view class="divider">
          <view class="line" />
          <text class="div-text">其他方式</text>
          <view class="line" />
        </view>

        <view class="alt-row">
          <view class="alt" @click="remember = !remember">
            <view class="alt-ico brand" :class="{ on: remember }">{{ remember ? '✓' : '记' }}</view>
            <text class="alt-lb">记住</text>
          </view>
          <view class="alt" @click="onForgot">
            <view class="alt-ico copper">?</view>
            <text class="alt-lb">忘记</text>
          </view>
        </view>
      </view>

      <!-- 品牌脚注：贴底 -->
      <view class="foot">
        <text class="foot-slogan">让每一次协作都有迹可循</text>
        <text class="foot-version">Yessys PM · {{ version || '1.0.0' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import config from '@/config/index.js'
import {
  getRemember,
  setRemember,
  getSavedLogin,
  saveLogin,
  clearSavedLogin
} from '@/utils/auth.js'
import { doLogin } from '@/utils/loginService.js'
import { wecomLogin } from '@/utils/wecomAuth.js'

const windowHeight = ref(667)
const statusBarHeight = ref(20)
const safeBottom = ref(0)
const keyboardHeight = ref(0)
const username = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const wxLoading = ref(false)
const focusField = ref('')

/** 企业微信登录：非企微环境/地址不合规时由 wecomLogin 内部给出提示 */
async function onWecomLogin() {
  if (wxLoading.value) return
  wxLoading.value = true
  const ok = await wecomLogin()
  // 跳转成功时页面会直接离开，无需复位按钮
  if (!ok) wxLoading.value = false
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const version = computed(() => config.version || '1.0.0')

/** 按可视高度分档，短机/长机间距与字号不同 */
const sizeClass = computed(() => {
  const h = windowHeight.value - keyboardHeight.value
  if (h < 620) return 'size-xs'
  if (h < 720) return 'size-sm'
  if (h > 860) return 'size-lg'
  return 'size-md'
})

const pageStyle = computed(() => {
  const h = Math.max(windowHeight.value - keyboardHeight.value, 480)
  return {
    height: h + 'px',
    paddingTop: statusBarHeight.value + 'px'
  }
})

function syncViewport() {
  try {
    const info = uni.getSystemInfoSync()
    windowHeight.value = info.windowHeight || info.screenHeight || 667
    statusBarHeight.value = info.statusBarHeight || 20
    const inset = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0
    // 无 inset 的全面屏也留一点底边，避免贴边
    safeBottom.value = Math.max(inset, 12)
  } catch (e) {}
}

function onFocus(name) {
  focusField.value = name
}

function onBlur() {
  focusField.value = ''
}

function onKeyboardHeightChange(res) {
  keyboardHeight.value = (res && res.height) || 0
}

onMounted(() => {
  syncViewport()
  // #ifdef APP-PLUS || MP-WEIXIN
  uni.onKeyboardHeightChange && uni.onKeyboardHeightChange(onKeyboardHeightChange)
  // #endif
  remember.value = getRemember()
  if (remember.value) {
    const saved = getSavedLogin()
    username.value = saved.username
    password.value = saved.password
  }
})

onUnmounted(() => {
  // #ifdef APP-PLUS || MP-WEIXIN
  uni.offKeyboardHeightChange && uni.offKeyboardHeightChange(onKeyboardHeightChange)
  // #endif
})

function onForgot() {
  uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
}

async function onLogin() {
  if (!username.value.trim() || !password.value) {
    uni.showToast({ title: '请输入账号密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await doLogin(username.value, password.value)
    setRemember(remember.value)
    if (remember.value) saveLogin(username.value, password.value)
    else clearSavedLogin()
    uni.switchTab({ url: '/pages/workbench/workbench' })
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.login-page {
  width: 100%;
  background: $pm-bg;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.body {
  height: 100%;
  padding: 0 48rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* 问候区固定小间距贴顶，内容整体偏上 */
.top {
  flex-shrink: 0;
  margin-top: 48rpx;
}

/* 背景装饰光斑：长屏视觉填充，不参与布局 */
.bg-deco {
  position: absolute;
  border-radius: 50%;
  filter: blur(40rpx);
  pointer-events: none;
  z-index: 0;
}
.bg-deco.d1 {
  top: -120rpx;
  right: -100rpx;
  width: 360rpx;
  height: 360rpx;
  background: radial-gradient(circle, rgba(14, 95, 59, 0.18), transparent 65%);
}
.bg-deco.d2 {
  top: 280rpx;
  left: -160rpx;
  width: 420rpx;
  height: 420rpx;
  background: radial-gradient(circle, rgba(184, 116, 74, 0.14), transparent 65%);
}
.bg-deco.d3 {
  bottom: 80rpx;
  right: -120rpx;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(184, 116, 74, 0.10), transparent 65%);
}

.mid {
  flex-shrink: 0;
  /* 标题区与表单之间拉开呼吸 */
  padding-top: 112rpx;
}

/* 底区：auto margin 吸收登录按钮以下的全部剩余空间，
   把"其他方式"推到脚注上方，仅留固定呼吸距 */
.bottom {
  flex-shrink: 0;
  padding-top: 24rpx;
  margin-top: auto;
  margin-bottom: 48rpx;
}

/* 品牌脚注：贴住页面底部 */
.foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 16rpx 0 8rpx;
}
.foot-slogan {
  font-size: 22rpx;
  color: $pm-text-secondary;
  letter-spacing: 2rpx;
}
.foot-version {
  font-size: 20rpx;
  color: $pm-muted;
  opacity: 0.7;
  letter-spacing: 1rpx;
}

.brand-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.logo {
  width: 60rpx;
  height: 60rpx;
  border-radius: 22rpx;
  background: $pm-grad-brand;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
  line-height: 60rpx;
  margin-right: 16rpx;
  box-shadow: $pm-shadow;
  flex-shrink: 0;
}

.brand-name {
  font-size: 28rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.3rpx;
}

.hero {
  margin-top: 28rpx;
}

.hello,
.hello-accent {
  display: block;
  font-size: 48rpx;
  font-weight: 900;
  letter-spacing: -1rpx;
  line-height: 1.2;
}

.hello {
  color: $pm-text;
}

.hello-accent {
  color: $pm-primary-deep;
}

.lede {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $pm-muted;
  line-height: 1.5;
}

.field {
  background: $pm-bg-2;
  border-radius: 28rpx;
  padding: 16rpx 28rpx;
  /* 两个输入框之间的间距（原 14rpx × 1.8） */
  margin-bottom: 26rpx;
  border: 3rpx solid transparent;
  box-sizing: border-box;
}

.field.focus {
  background: #fff;
  border-color: $pm-primary;
}

.lb {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.field.focus .lb {
  color: $pm-primary;
}

.ipt {
  height: 44rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: $pm-text;
}

.ph {
  color: $pm-muted;
}

.login-btn {
  display: block;
  width: 100%;
  /* 输入框与按钮之间的呼吸（原 24rpx × 1.8） */
  margin: 44rpx 0 0;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  background: $pm-grad-brand;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  border: none;
  box-shadow: $pm-shadow-lg;
  text-align: center;
}
.login-btn::after {
  border: none;
}

.login-btn[disabled] {
  opacity: 0.5;
}

/* 企业微信登录：次级按钮（白底 + 描边 + 品牌绿），与主按钮同高同圆角 */
.wx-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  margin: 20rpx 0 0;
  padding: 0;
  height: 84rpx;
  line-height: 1.2;
  border-radius: 999rpx;
  background: $pm-surface;
  color: $pm-primary-deep;
  font-size: 28rpx;
  font-weight: 750;
  border: 1px solid $pm-line;
  box-shadow: $pm-shadow;
}
.wx-btn::after {
  border: none;
}
.wx-btn[disabled] {
  opacity: 0.55;
}
.wx-ico {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}
.wx-txt {
  font-size: 28rpx;
  font-weight: 750;
  letter-spacing: 1rpx;
}

.wecom-tip {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: $pm-muted;
  text-align: center;
}

.divider {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.line {
  flex: 1;
  height: 1px;
  background: $pm-line;
}

.div-text {
  margin: 0 24rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: $pm-muted;
}

.alt-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 28rpx;
  margin-top: 16rpx;
  padding: 0 24rpx;
}

.alt {
  width: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.alt-ico {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
  text-align: center;
  line-height: 68rpx;
  box-shadow: 0 12rpx 24rpx -8rpx rgba(14, 95, 59, 0.35);
  transition: transform 0.15s $pm-press-ease;
}
.alt:active .alt-ico {
  transform: scale(0.92);
}

.alt-ico.info {
  background: linear-gradient(135deg, #7C9BD1, #3F6CB0);
}

.alt-ico.brand {
  background: $pm-grad-brand;
  opacity: 0.55;
}

.alt-ico.brand.on {
  opacity: 1;
}

.alt-ico.copper {
  background: linear-gradient(135deg, #D89A6E, #B8744A);
}

.alt-lb {
  margin-top: 8rpx;
  font-size: 18rpx;
  font-weight: 600;
  color: $pm-text-secondary;
}

/* —— 短屏：再压紧凑，保证一屏完成 —— */
.size-xs {
  .logo {
    width: 52rpx;
    height: 52rpx;
    line-height: 52rpx;
    font-size: 24rpx;
    border-radius: 18rpx;
  }
  .brand-name {
    font-size: 24rpx;
  }
  .hero {
    margin-top: 12rpx;
  }
  .hello,
  .hello-accent {
    font-size: 38rpx;
  }
  .lede {
    margin-top: 6rpx;
    font-size: 20rpx;
  }
  .mid {
    padding-top: 72rpx;
  }
  .top {
    margin-top: 24rpx;
  }
  .bottom {
    margin-bottom: 24rpx;
  }
  .field {
    padding: 12rpx 24rpx;
    margin-bottom: 18rpx;
    border-radius: 24rpx;
  }
  .lb {
    font-size: 18rpx;
    margin-bottom: 2rpx;
  }
  .ipt {
    height: 40rpx;
    font-size: 26rpx;
  }
  .login-btn {
    margin-top: 22rpx;
    height: 72rpx;
    line-height: 72rpx;
    font-size: 26rpx;
  }
  .wx-btn {
    margin-top: 12rpx;
    height: 72rpx;
    font-size: 26rpx;
  }
  .wx-txt {
    font-size: 26rpx;
  }
  .wx-ico {
    width: 28rpx;
    height: 28rpx;
  }
  .bottom {
    padding-top: 16rpx;
  }
  .div-text {
    font-size: 18rpx;
  }
  .alt-row {
    margin-top: 12rpx;
  }
  .alt-ico {
    width: 56rpx;
    height: 56rpx;
    line-height: 56rpx;
    font-size: 26rpx;
  }
  .alt-lb {
    font-size: 16rpx;
  }
}

/* —— 中屏：默认尺寸已适配，这里只做微调 —— */
.size-sm {
  .hero {
    margin-top: 32rpx;
  }
  .mid {
    padding-top: 128rpx;
  }
  .bottom {
    padding-top: 28rpx;
  }
  .foot {
    padding-bottom: 16rpx;
  }
}

/* —— 长屏：略微拉开，但仍保持一屏内 —— */
.size-lg {
  .hero {
    margin-top: 40rpx;
  }
  .hello,
  .hello-accent {
    font-size: 52rpx;
  }
  .lede {
    margin-top: 12rpx;
  }
  .mid {
    padding-top: 176rpx;
  }
  .field {
    margin-bottom: 32rpx;
    padding: 18rpx 30rpx;
  }
  .login-btn {
    margin-top: 58rpx;
    height: 90rpx;
    line-height: 90rpx;
  }
  .wx-btn {
    margin-top: 24rpx;
    height: 90rpx;
  }
  .bottom {
    padding-top: 32rpx;
  }
  .foot {
    padding-bottom: 20rpx;
  }
  .alt-row {
    margin-top: 20rpx;
  }
  .alt-ico {
    width: 76rpx;
    height: 76rpx;
    line-height: 76rpx;
    font-size: 34rpx;
  }
}
</style>
