<template>
  <view class="card" :class="statusTone" @click="$emit('click')">
    <view class="rail" :class="urgencyTone" />

    <view class="header">
      <view class="serial-pill">
        <text class="serial">#{{ serial }}</text>
      </view>
      <view class="header-tags">
        <view v-if="urgencyLabel && urgencyLabel !== '-'" class="urgency-pill" :class="urgencyTone">
          <text class="urgency-dot" />
          <text class="urgency-txt">{{ urgencyLabel }}</text>
        </view>
        <status-chip :text="statusLabel" :tone="statusTone" />
      </view>
    </view>

    <text class="title">{{ abnormalType || '-' }} · {{ problemType || '-' }}</text>

    <view class="meta-grid">
      <view class="meta-cell">
        <text class="meta-label">客户</text>
        <text class="meta-value">{{ customer || '—' }}</text>
      </view>
      <view class="meta-cell">
        <text class="meta-label">产品</text>
        <text class="meta-value">{{ productName || '—' }}</text>
      </view>
      <view class="meta-cell">
        <text class="meta-label">处理人/负责人</text>
        <text class="meta-value">{{ handler || '—' }}</text>
      </view>
      <view class="meta-cell">
        <text class="meta-label">处理部门</text>
        <text class="meta-value">{{ deptName || '—' }}</text>
      </view>
      <view class="meta-cell">
        <text class="meta-label">反馈人</text>
        <text class="meta-value">{{ creatorName || '—' }}</text>
      </view>
      <view class="meta-cell">
        <text class="meta-label">期望完成</text>
        <text class="meta-value">{{ demandFinish || '—' }}</text>
      </view>
    </view>

    <view v-if="overdueDays > 0" class="overdue-bar">
      <text class="dot" />
      <text class="overdue-txt">已逾期 {{ overdueDays }} 天</text>
    </view>

    <view v-if="actions && actions.length" class="actions" @click.stop>
      <view
        v-for="(act, idx) in actions"
        :key="act.key"
        class="act"
        :class="{ primary: idx === 0 }"
        @click="$emit('action', act.key)"
      >
        {{ act.label }}
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  serial: { type: [String, Number], default: '' },
  statusLabel: { type: String, default: '-' },
  statusTone: { type: String, default: '' },
  abnormalType: { type: String, default: '' },
  problemType: { type: String, default: '' },
  urgencyLabel: { type: String, default: '' },
  urgencyTone: { type: String, default: '' },
  customer: { type: String, default: '' },
  productName: { type: String, default: '' },
  demandFinish: { type: String, default: '' },
  handler: { type: String, default: '' },
  deptName: { type: String, default: '' },
  creatorName: { type: String, default: '' },
  overdueDays: { type: Number, default: 0 },
  actions: { type: Array, default: () => [] }
})

defineEmits(['click', 'action'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.card {
  position: relative;
  overflow: hidden;
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 24rpx 24rpx 24rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow;
  transition: transform 0.15s $pm-press-ease;
}
/* 左侧等级色条：紧急程度越高颜色越重，列表扫视时第一眼可辨 */
.rail {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  background: transparent;
}
.rail.critical,
.rail.urgent {
  background: $pm-danger;
}
.rail.high {
  background: $pm-warn;
}
.rail.medium {
  background: $pm-copper;
}
.rail.normal {
  background: $pm-info;
}
.rail.low {
  background: rgba($pm-muted, 0.45);
}
.rail.minor {
  background: rgba($pm-muted, 0.2);
}
.card:active {
  transform: scale(0.985);
}
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.header-tags {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
}
.urgency-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 0 auto;
  margin-right: 10rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}
.urgency-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}
.urgency-txt {
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}
.urgency-pill.critical {
  background: $pm-danger;
}
.urgency-pill.critical .urgency-txt {
  color: #fff;
}
.urgency-pill.critical .urgency-dot {
  background: #fff;
}
.urgency-pill.urgent {
  background: $pm-danger-soft;
}
.urgency-pill.urgent .urgency-txt {
  color: $pm-danger;
}
.urgency-pill.urgent .urgency-dot {
  background: $pm-danger;
}
.urgency-pill.high {
  background: $pm-warn-soft;
}
.urgency-pill.high .urgency-txt {
  color: $pm-warn;
}
.urgency-pill.high .urgency-dot {
  background: $pm-warn;
}
.urgency-pill.medium {
  background: $pm-copper-soft;
}
.urgency-pill.medium .urgency-txt {
  color: $pm-copper;
}
.urgency-pill.medium .urgency-dot {
  background: $pm-copper;
}
.urgency-pill.normal {
  background: $pm-info-soft;
}
.urgency-pill.normal .urgency-txt {
  color: $pm-info;
}
.urgency-pill.normal .urgency-dot {
  background: $pm-info;
}
.urgency-pill.low {
  background: $pm-bg-2;
}
.urgency-pill.low .urgency-txt {
  color: $pm-text-secondary;
}
.urgency-pill.low .urgency-dot {
  background: $pm-text-secondary;
}
.urgency-pill.minor {
  background: $pm-bg-2;
}
.urgency-pill.minor .urgency-txt {
  color: $pm-muted;
}
.urgency-pill.minor .urgency-dot {
  background: $pm-muted;
}
.serial-pill {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  flex: 0 0 auto;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $pm-accent;
}
.serial {
  font-size: 24rpx;
  font-weight: 700;
  color: $pm-primary-deep;
  font-variant-numeric: tabular-nums;
}
.title {
  display: block;
  font-size: 30rpx;
  font-weight: 750;
  color: $pm-text;
  letter-spacing: -0.5rpx;
  line-height: 1.35;
  margin-bottom: 16rpx;
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx 20rpx;
  background: $pm-bg;
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
}
.meta-cell {
  min-width: 0;
}
.meta-label {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  margin-bottom: 4rpx;
}
.meta-value {
  display: block;
  font-size: 24rpx;
  color: $pm-text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.overdue-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 16rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: $pm-warn-soft;
  width: fit-content;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $pm-warn;
  margin-right: 10rpx;
}
.overdue-txt {
  font-size: 22rpx;
  color: $pm-warn;
  font-weight: 700;
}
.actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 18rpx;
}
.act {
  margin-right: 12rpx;
  margin-top: 4rpx;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: $pm-accent;
  color: $pm-primary-deep;
  font-size: 24rpx;
  font-weight: 700;
}
.act.primary {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(14, 95, 59, 0.28);
}
</style>
