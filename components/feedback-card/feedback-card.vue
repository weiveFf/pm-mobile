<template>
  <view class="card" :class="statusTone" @click="$emit('click')">
    <view class="top">
      <view class="serial-pill">
        <text class="hash">#</text>
        <text class="serial">{{ serial }}</text>
      </view>
      <status-chip :text="statusLabel" :tone="statusTone" />
    </view>

    <text class="title">{{ abnormalType || '-' }} · {{ problemType || '-' }}</text>

    <view class="meta">
      <view class="meta-row">
        <text class="label">客户</text>
        <text class="value">{{ customer || '—' }}</text>
      </view>
      <view class="meta-row">
        <text class="label">期望</text>
        <text class="value">{{ demandFinish || '—' }}</text>
      </view>
      <view class="meta-row">
        <text class="label">处理</text>
        <text class="value">{{ handler || '—' }}</text>
      </view>
      <view v-if="urgencyLabel && urgencyLabel !== '-'" class="meta-row">
        <text class="label">紧急</text>
        <text class="value">{{ urgencyLabel }}</text>
      </view>
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
  demandFinish: { type: String, default: '' },
  handler: { type: String, default: '' },
  actions: { type: Array, default: () => [] }
})

defineEmits(['click', 'action'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.card {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow;
  transition: transform 0.15s $pm-press-ease;
}
.card:active {
  transform: scale(0.985);
}
.top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.serial-pill {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $pm-accent;
}
.hash {
  font-size: 20rpx;
  color: $pm-primary;
  font-weight: 700;
  margin-right: 2rpx;
}
.serial {
  font-size: 24rpx;
  font-weight: 700;
  color: $pm-primary-deep;
  font-variant-numeric: tabular-nums;
}
.title {
  display: block;
  font-size: 32rpx;
  font-weight: 750;
  color: $pm-text;
  letter-spacing: -0.5rpx;
  line-height: 1.35;
  margin-bottom: 18rpx;
}
.meta {
  background: $pm-bg;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
}
.meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10rpx 0;
}
.label {
  width: 72rpx;
  font-size: 22rpx;
  color: $pm-muted;
  flex-shrink: 0;
}
.value {
  flex: 1;
  font-size: 24rpx;
  color: $pm-text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 20rpx;
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
