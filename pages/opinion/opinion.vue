<template>
  <view class="pm-page op-page">
    <app-nav-bar title="意见反馈" />

    <view class="body">
      <!-- Hero：森林渐变卡 + 气泡图标 -->
      <view class="hero">
        <view class="deco" />
        <view class="deco2" />
        <view class="hero-text">
          <text class="hero-title">说说你的想法</text>
          <text class="hero-sub">你的建议，让系统变得更好用</text>
        </view>
        <view class="hero-ic">
          <svg viewBox="0 0 24 24">
            <path d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1z" fill="currentColor" />
          </svg>
        </view>
      </view>

      <!-- 输入卡 -->
      <view class="card">
        <view class="card-head">
          <text class="label"><text class="req">*</text>意见内容</text>
          <text class="count" :class="{ near: content.length > 1800 }">{{ content.length }} / 2000</text>
        </view>
        <textarea
          v-model="content"
          class="textarea"
          :class="{ focus: focused }"
          placeholder="请描述你遇到的问题或建议，越具体越好…"
          placeholder-class="ph"
          :maxlength="2000"
          auto-height
          @focus="focused = true"
          @blur="focused = false"
        />
      </view>

      <!-- 提示 -->
      <view class="tip">
        <view class="tip-ic">i</view>
        <text class="tip-tx">对本系统或公司后台系统有任何建议都欢迎提出，我们会逐条认真阅读；也可以直接联系系统软件组 · 蔡能</text>
      </view>
    </view>

    <!-- 吸底提交 -->
    <view class="bar">
      <button
        class="pm-btn-primary submit"
        :class="{ off: !canSubmit }"
        :loading="submitting"
        :disabled="submitting || !canSubmit"
        @click="doSubmit"
      >提交反馈</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { sendOpinionFeedback } from '@/api/after-sales.js'
import { ensureLoggedIn } from '@/utils/authGuard.js'

const content = ref('')
const submitting = ref(false)
const focused = ref(false)

const canSubmit = computed(() => content.value.trim().length > 0)

async function doSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请填写意见内容', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await sendOpinionFeedback({ content: content.value.trim() })
    uni.showToast({ title: '提交成功，感谢反馈', icon: 'success' })
    content.value = ''
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad(() => {
  ensureLoggedIn()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.op-page {
  min-height: 100vh;
}
.body {
  padding: 20rpx 24rpx 240rpx;
}

/* —— Hero —— */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: $pm-radius-lg;
  padding: 34rpx 32rpx;
  margin-bottom: 24rpx;
  background: $pm-grad-hero;
  color: #fff;
  box-shadow: $pm-shadow-lg;
}
.deco {
  position: absolute;
  right: -70rpx;
  top: -90rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.deco2 {
  position: absolute;
  left: -60rpx;
  bottom: -100rpx;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}
.hero-text {
  position: relative;
  flex: 1;
  min-width: 0;
}
.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}
.hero-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.88);
}
.hero-ic {
  position: relative;
  flex-shrink: 0;
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  margin-left: 20rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-ic svg {
  width: 48rpx;
  height: 48rpx;
}

/* —— 输入卡 —— */
.card {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  box-shadow: $pm-shadow;
}
.card-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.label {
  font-size: 27rpx;
  font-weight: 750;
  color: $pm-text;
}
.req {
  color: $pm-danger;
  margin-right: 6rpx;
}
.count {
  font-size: 22rpx;
  color: $pm-muted;
  font-variant-numeric: tabular-nums;
}
.count.near {
  color: $pm-warn;
}
.textarea {
  width: 100%;
  min-height: 360rpx;
  padding: 24rpx;
  background: $pm-bg-2;
  border: 3rpx solid transparent;
  border-radius: 24rpx;
  box-sizing: border-box;
  font-size: 27rpx;
  line-height: 1.6;
  color: $pm-text;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.textarea.focus {
  background: #fff;
  border-color: $pm-primary;
}
.ph {
  color: $pm-muted;
}

/* —— 提示 —— */
.tip {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 24rpx 8rpx 0;
}
.tip-ic {
  width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-primary-soft;
  color: $pm-primary-deep;
  font-size: 20rpx;
  font-weight: 800;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.tip-tx {
  flex: 1;
  font-size: 22rpx;
  line-height: 1.5;
  color: $pm-muted;
}

/* —— 吸底提交 —— */
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(16rpx + constant(safe-area-inset-bottom));
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(250, 248, 244, 0.94);
  backdrop-filter: blur(16px);
  border-top: 1px solid $pm-line;
  z-index: 20;
}
.submit {
  display: block;
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 28rpx;
}
.submit.off {
  background: #E9E4D8 !important;
  color: $pm-muted !important;
  box-shadow: none !important;
}
</style>
