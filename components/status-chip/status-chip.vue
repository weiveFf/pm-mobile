<template>
  <text class="chip" :class="tone">{{ text || '-' }}</text>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  tone: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.chip {
  display: inline-block;
  max-width: 220rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  background: $pm-primary-soft;
  color: $pm-primary-deep;
  vertical-align: middle;
}
.chip.warn {
  background: $pm-warn-soft;
  color: $pm-warn;
}
.chip.danger {
  background: $pm-danger-soft;
  color: $pm-danger;
}
.chip.copper {
  background: $pm-copper-soft;
  color: #8F5533;
}
.chip.muted {
  background: #F5F5F4;
  color: $pm-muted;
}
</style>
