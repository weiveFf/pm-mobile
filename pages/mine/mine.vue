<template>
  <view class="pm-page mine-page">
    <app-nav-bar title="我的" :show-back="false" />

    <!-- 内容区：唯一滚动区域，退出登录固定在屏幕底部 -->
    <view class="mine-body">
      <!-- 个人 Hero 卡(ME-01 · 森林渐变) -->
      <view class="hero-card">
        <view class="deco" />
        <view class="me-row" @click="noop">
          <view class="avatar">{{ avatarLetter }}</view>
          <view class="me-info">
            <text class="me-name">{{ userName || '未登录' }}</text>
            <text class="me-meta">ID {{ userId || '-' }}</text>
          </view>
          <text class="me-chev">›</text>
        </view>
        <view class="me-stats">
          <view class="ms">
            <text class="ms-n">{{ version }}</text>
            <text class="ms-l">版本</text>
          </view>
          <view class="ms">
            <text class="ms-n">{{ userId ? '在线' : '离线' }}</text>
            <text class="ms-l">状态</text>
          </view>
        </view>
      </view>

      <!-- 常用功能 -->
      <view class="shead"><text class="st">常用功能</text></view>
      <view class="mgrid one">
        <view class="mitem pressable" @click="goStats">
          <view class="sq s5">◔</view>
          <view class="mtxt">
            <text class="mt">数据看板</text>
            <text class="msub">看看最近做得怎么样</text>
          </view>
          <text class="ar">›</text>
        </view>
      </view>

      <view class="shead"><text class="st">账号与安全</text></view>
      <view class="mgrid one">
        <view class="mitem pressable" @click="goChangePwd">
          <view class="sq s3">⚿</view>
          <view class="mtxt">
            <text class="mt">修改密码</text>
            <text class="msub">定期更换，账号更安全</text>
          </view>
          <text class="ar">›</text>
        </view>
        <view class="mitem pressable" @click="onAbout">
          <view class="sq s2">ⓘ</view>
          <view class="mtxt">
            <text class="mt">关于 {{ config.appName || 'Yessys PM' }}</text>
            <text class="msub">{{ version }}</text>
          </view>
          <text class="ar">›</text>
        </view>
      </view>

      <!-- 退出登录：单独成组，弹性空白把它推到内容区底部 -->
      <view class="mgrid one push-bottom">
        <view class="mitem pressable logout-item" @click="logout">
          <view class="sq logout-sq">⇥</view>
          <view class="mtxt">
            <text class="mt logout-text">退出登录</text>
          </view>
          <text class="ar logout-arrow">›</text>
        </view>
      </view>
      <!-- 底部留白，避免贴 TabBar -->
      <view class="bottom-spacer" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import config from '@/config/index.js'
import { getUserName, getUserId, clearAuth } from '@/utils/auth.js'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { logoutApi } from '@/api/login.js'

const userName = ref('')
const userId = ref('')
const version = config.version

const avatarLetter = computed(() => {
  const n = (userName.value || 'Y').trim()
  return n ? n.substring(0, 1).toUpperCase() : 'Y'
})

function refresh() {
  userName.value = getUserName()
  userId.value = getUserId()
}

function noop() {}

function onAbout() {
  uni.showToast({ title: config.appName + ' ' + version, icon: 'none' })
}

function goStats() {
  uni.showToast({ title: '功能正在维护中', icon: 'none' })
}

function goChangePwd() {
  uni.navigateTo({ url: '/pages/change-password/change-password' })
}

async function logout() {
  try {
    await logoutApi()
  } catch (e) {}
  clearAuth()
  uni.reLaunch({ url: '/pages/login/login' })
}

onShow(() => {
  if (!ensureLoggedIn()) return
  refresh()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* —— 页面：内容区滚动，退出登录固定屏幕底部 —— */
.mine-page {
  display: flex;
  flex-direction: column;
  /* 覆盖全局 .pm-page 的 min-height:100%，避免与固定高度冲突 */
  min-height: 0;
  height: 100vh; /* 兜底：防止 --window-bottom 未定义导致 calc 失效 */
  height: calc(100vh - var(--window-bottom, 0px));
  overflow: hidden;
  box-sizing: border-box;
  overscroll-behavior-y: none;
}
.mine-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  /* flex 列布局：让「退出登录」能被 auto margin 推到内容区底部 */
  display: flex;
  flex-direction: column;
  /* 卡片自带 20rpx 下边距，这里只补一点余量 */
  padding-bottom: 8rpx;
}
/* flex 子项不压缩，避免卡片被挤扁 */
.mine-body > view {
  flex-shrink: 0;
}
/* 弹性空白集中在「关于 → 退出登录」之间 */
.push-bottom {
  margin-top: auto;
}
.bottom-spacer {
  height: 16rpx;
  /* 全面屏底部安全区 */
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* —— 个人 Hero 卡 —— */
.hero-card {
  margin: 12rpx 24rpx 0;
  padding: 32rpx;
  border-radius: $pm-radius-lg;
  background: $pm-grad-hero;
  color: #fff;
  box-shadow: $pm-shadow-lg;
  position: relative;
  overflow: hidden;
}
.deco {
  position: absolute;
  right: -52rpx;
  top: -60rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.me-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}
.avatar {
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 3rpx solid rgba(255, 255, 255, 0.55);
  color: #fff;
  font-size: 44rpx;
  font-weight: 800;
  text-align: center;
  line-height: 102rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.me-info {
  flex: 1;
  min-width: 0;
}
.me-name {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}
.me-chev {
  font-size: 40rpx;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
}
.me-stats {
  display: flex;
  flex-direction: row;
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  position: relative;
}
.ms {
  flex: 1;
  text-align: center;
}
.ms + .ms {
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}
.ms-n {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}
.ms-l {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

/* —— 小节头 —— */
.shead {
  padding: 28rpx 32rpx 16rpx;
}
.st {
  font-size: 28rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.3rpx;
}

/* —— 双列菜单瓷贴 —— */
.mgrid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0 16rpx;
}
.mgrid.one {
  display: block;
}
.mitem {
  width: calc(50% - 20rpx);
  margin: 0 10rpx 20rpx;
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: $pm-shadow;
  border: 1px solid $pm-line;
  box-sizing: border-box;
}
.mgrid.one .mitem {
  width: auto;
}
.sq {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #fff;
  flex-shrink: 0;
  margin-right: 20rpx;
}
.sq.s1 {
  background: $pm-tile-info;
  box-shadow: 0 6px 12px -4px rgba(63, 108, 176, 0.35);
}
.sq.s2 {
  background: $pm-tile-amber;
  box-shadow: 0 6px 12px -4px rgba(194, 135, 42, 0.35);
}
.sq.s3 {
  background: $pm-tile-copper;
  box-shadow: 0 6px 12px -4px rgba(184, 116, 74, 0.35);
}
.sq.s5 {
  background: $pm-tile-sage;
  box-shadow: 0 6px 12px -4px rgba(61, 128, 94, 0.35);
}
.mtxt {
  flex: 1;
  min-width: 0;
}
.mt {
  display: block;
  font-size: 26rpx;
  font-weight: 750;
  color: $pm-text;
}
.msub {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $pm-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ar {
  color: #C6C0B2;
  font-size: 28rpx;
  margin-left: 8rpx;
}

/* —— 退出登录：作为账号与安全列表项，仅文字用红色强调 —— */
.logout-item {
  margin-top: 0;
}
.logout-sq {
  background: $pm-danger-soft;
  box-shadow: 0 6px 12px -4px rgba(190, 75, 72, 0.3);
  color: $pm-danger;
}
.logout-text {
  color: $pm-danger;
}
.logout-arrow {
  color: $pm-danger;
}
</style>
