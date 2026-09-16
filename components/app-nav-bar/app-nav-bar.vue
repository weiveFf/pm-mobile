<template>
  <!--
    微信/企微容器：顶部已有原生标题栏（标题由 utils/wxwork-title.js 动态写入），
    因此 tab 页整条自绘栏撤掉；仅需要返回的页面保留一条轻量返回栏。
  -->
  <template v-if="!isEmbed">
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-inner">
        <view class="nav-side left" @click="onLeft">
          <view v-if="showBack" class="back">
            <text class="back-icon">‹</text>
          </view>
        </view>
        <text class="nav-title">{{ title }}</text>
        <view class="nav-side right" @click="onRight">
          <text v-if="rightText" class="nav-link">{{ rightText }}</text>
        </view>
      </view>
    </view>
    <view class="nav-placeholder" :style="{ height: statusBarHeight + 48 + 'px' }" />
  </template>

  <template v-else-if="showBack">
    <view class="nav embed" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-inner">
        <view class="nav-side left" @click="onLeft">
          <view class="back">
            <text class="back-icon">‹</text>
          </view>
        </view>
      </view>
    </view>
    <view class="nav-placeholder" :style="{ height: statusBarHeight + 44 + 'px' }" />
  </template>

  <!-- 嵌入容器的 tab 页：不留导航栏，仅保留一点顶部呼吸 -->
  <view v-else class="nav-placeholder" :style="{ height: statusBarHeight + 12 + 'px' }" />
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  rightText: { type: String, default: '' }
})

const emit = defineEmits(['left', 'right'])
const statusBarHeight = ref(0)
const isEmbed = ref(false)

onMounted(() => {
  try {
    statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
  } catch (e) {
    statusBarHeight.value = 0
  }
  // #ifdef H5
  try {
    // 企业微信(wxwork)与微信(MicroMessenger)内置浏览器都带原生标题栏
    isEmbed.value = /wxwork|micromessenger/i.test(navigator.userAgent || '')
  } catch (e) {
    isEmbed.value = false
  }
  // #endif
})

function onLeft() {
  emit('left')
  if (getCurrentPages().length > 1) uni.navigateBack()
}

function onRight() {
  emit('right')
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.nav {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  background: rgba(250, 248, 244, 0.82);
  backdrop-filter: blur(18px);
}
.nav-inner {
  height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 12rpx;
}
/* 嵌入容器：无自绘标题，整条压缩 */
.nav.embed .nav-inner {
  height: 44px;
}
.nav-side {
  width: 140rpx;
  height: 48px;
  display: flex;
  align-items: center;
}
.nav.embed .nav-side {
  height: 44px;
}
.nav-side.right {
  justify-content: flex-end;
  padding-right: 12rpx;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: $pm-text;
  letter-spacing: -0.4rpx;
}
.back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $pm-surface;
  box-shadow: $pm-shadow;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
}
.back-icon {
  font-size: 44rpx;
  line-height: 1;
  color: $pm-text;
  margin-top: -4rpx;
  margin-left: -2rpx;
}
.nav-link {
  font-size: 26rpx;
  color: $pm-primary;
  font-weight: 700;
  padding: 12rpx 20rpx;
  background: $pm-primary-soft;
  border-radius: 999rpx;
}
</style>
