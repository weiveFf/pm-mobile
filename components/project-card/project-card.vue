<template>
  <view class="pj-card pressable" @click="$emit('click')">
    <!-- 顶部品牌色带，替代 feedback-card 的左侧 rail -->
    <view class="topbar" />

    <!-- 头部：客户名 + 反馈状态 -->
    <view class="header">
      <view class="title-stack">
        <text class="name">{{ fshortname || '-' }}</text>
        <text class="bill">#{{ fbillno || '-' }}</text>
      </view>
      <view class="feedback-badge" :class="{ has: hasFeedback }">
        <view class="dot" />
        <text class="txt">{{ hasFeedback ? '有反馈' : '暂无反馈' }}</text>
      </view>
    </view>

    <!-- 关键指标带：横向排列，像档案摘要 -->
    <view class="metric-band">
      <view class="metric">
        <text class="metric-label">订单日期</text>
        <text class="metric-value">{{ formatDateOnly(fDateORD) }}</text>
      </view>
      <view class="metric-divider" />
      <view class="metric">
        <text class="metric-label">订单总数</text>
        <text class="metric-value">{{ fTotalQty != null ? fTotalQty : '—' }}</text>
      </view>
      <view class="metric-divider" />
      <view class="metric">
        <text class="metric-label">是否自制</text>
        <text class="metric-value">{{ selfMadeLabel }}</text>
      </view>
    </view>

    <!-- 人员与类型带：统一 2×2 的「标签 + 值」 -->
    <view class="people-band">
      <view class="person">
        <text class="person-role">业务员</text>
        <text class="person-name">{{ fSalerName || '—' }}</text>
      </view>
      <view class="person">
        <text class="person-role">跟单员</text>
        <text class="person-name">{{ fMerchandiser || '—' }}</text>
      </view>
      <view class="person">
        <text class="person-role">安装类型</text>
        <text class="person-name">{{ fInstallType || '—' }}</text>
      </view>
      <view class="person">
        <text class="person-role">验收类型</text>
        <text class="person-name">{{ fCheckType || '—' }}</text>
      </view>
    </view>

    <!-- 产品信息块：独立视觉层级（不带文字标签，仅展示产品名） -->
    <view class="product-block">
      <text class="product-name">{{ materialName || '暂无产品信息' }}</text>
    </view>

    <!-- 操作区：一主一次 -->
    <view class="actions" @click.stop>
      <view class="btn-primary" @click="$emit('feedback')">
        <text class="btn-icon">＋</text>
        <text>提交反馈</text>
      </view>
      <view class="btn-link" @click="$emit('feedback-list')">
        <text>查看反馈列表</text>
        <text class="arrow">→</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateOnly } from '@/utils/urgencyDisplay.js'
import { formatSelfMadeLabel } from '@/utils/projectDisplay.js'

const props = defineProps({
  fshortname: { type: String, default: '' },
  fbillno: { type: String, default: '' },
  fDateORD: { type: [String, Date], default: '' },
  fSalerName: { type: String, default: '' },
  fMerchandiser: { type: String, default: '' },
  materialName: { type: String, default: '' },
  fTotalQty: { type: [Number, String], default: null },
  fnumber: { type: String, default: '' },
  fInstallType: { type: String, default: '' },
  fCheckType: { type: String, default: '' },
  hasFeedback: { type: Boolean, default: false }
})

defineEmits(['click', 'feedback', 'feedback-list'])

const selfMadeLabel = computed(() => formatSelfMadeLabel(props.fnumber))
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.pj-card {
  position: relative;
  overflow: hidden;
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 0 24rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: $pm-shadow;
  transition: transform 0.15s $pm-press-ease;
}
.pj-card:active {
  transform: scale(0.985);
}

/* 顶部品牌色带：与 feedback-card 的左侧 rail 形成明显差异 */
.topbar {
  height: 6rpx;
  background: $pm-grad-brand;
  margin: 0 -24rpx 24rpx;
}

/* 头部 */
.header {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22rpx;
}
.title-stack {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding-right: 16rpx;
}
.name {
  font-size: 34rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.4rpx;
  line-height: 1.35;
  margin-bottom: 6rpx;
}
.bill {
  font-size: 24rpx;
  font-weight: 700;
  color: $pm-primary;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-variant-numeric: tabular-nums;
}

/* 反馈状态：圆点 + 文字，而非 feedback-card 的 status-chip */
.feedback-badge {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: $pm-bg-2;
}
.feedback-badge.has {
  background: $pm-warn-soft;
}
.feedback-badge .dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $pm-muted;
  margin-right: 10rpx;
}
.feedback-badge.has .dot {
  background: $pm-warn;
}
.feedback-badge .txt {
  font-size: 22rpx;
  font-weight: 700;
  color: $pm-text-secondary;
}
.feedback-badge.has .txt {
  color: $pm-warn;
}

/* 关键指标带 */
.metric-band {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: $pm-bg;
  border-radius: 20rpx;
  padding: 20rpx 16rpx;
  margin-bottom: 22rpx;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.metric-label {
  font-size: 20rpx;
  color: $pm-muted;
  margin-bottom: 8rpx;
}
.metric-value {
  font-size: 26rpx;
  font-weight: 700;
  color: $pm-text;
}
.metric-divider {
  width: 1px;
  height: 44rpx;
  background: $pm-line;
}

/* 人员与类型带：四项一行四列，每列「标签在上 / 值在下」 */
.people-band {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 16rpx;
}
.person {
  flex: 1;
  min-width: 0;
  padding-right: 12rpx;
  display: flex;
  flex-direction: column;
}
.person:last-child {
  padding-right: 0;
}
.person-role {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  line-height: 1.4;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.person-name {
  display: block;
  font-size: 26rpx;
  color: $pm-text;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 产品信息块 */
.product-block {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: rgba($pm-primary, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 22rpx;
}
.product-name {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: $pm-text;
  font-weight: 700;
  line-height: 1.4;
}

/* 操作区：主按钮 + 文字链接 */
.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.btn-primary {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 18rpx 32rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 24rpx rgba(14, 95, 59, 0.26);
}
.btn-primary:active {
  opacity: 0.92;
}
.btn-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
  font-weight: 500;
}
.btn-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 18rpx 8rpx;
  color: $pm-primary;
  font-size: 26rpx;
  font-weight: 700;
}
.btn-link .arrow {
  margin-left: 6rpx;
  font-size: 24rpx;
}
</style>
