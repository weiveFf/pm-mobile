<template>
  <view class="pm-page">
    <app-nav-bar title="延期" />
    <view class="mode-tabs">
      <view class="mode-tab" :class="{ active: mode === 'apply' }" @click="mode = 'apply'">申请延期</view>
      <view class="mode-tab" :class="{ active: mode === 'approve' }" @click="mode = 'approve'">批准</view>
      <view class="mode-tab" :class="{ active: mode === 'reject' }" @click="mode = 'reject'">驳回</view>
    </view>

    <view class="form">
      <view v-if="mode === 'apply'" class="pm-card">
        <text class="label required">延期至</text>
        <picker mode="date" :value="demandFinishTime" :start="today" @change="(e) => (demandFinishTime = e.detail.value)">
          <view class="value">{{ demandFinishTime || '请选择日期' }}</view>
        </picker>
        <text class="label">备注</text>
        <textarea v-model="remark" class="textarea" placeholder="可选" />
        <button class="pm-btn-primary submit" :loading="submitting" @click="doApply">提交申请</button>
      </view>

      <view v-else class="pm-card">
        <text class="label">审批意见</text>
        <textarea v-model="remark" class="textarea" placeholder="可选" />
        <button class="pm-btn-primary submit" :loading="submitting" @click="doReview">
          {{ mode === 'approve' ? '批准延期' : '驳回延期' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { applyFeedbackDelay, approveFeedbackDelay, rejectFeedbackDelay } from '@/api/after-sales.js'

const id = ref('')
const mode = ref('apply')
const demandFinishTime = ref('')
const remark = ref('')
const submitting = ref(false)

const today = (() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
})()

async function doApply() {
  if (!demandFinishTime.value) {
    uni.showToast({ title: '请选择延期日期', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await applyFeedbackDelay({
      feedbackId: Number(id.value),
      demandFinishTime: demandFinishTime.value,
      remark: remark.value || ''
    })
    uni.showToast({ title: '已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function doReview() {
  submitting.value = true
  try {
    const payload = { feedbackId: Number(id.value), remark: remark.value || '' }
    if (mode.value === 'approve') await approveFeedbackDelay(payload)
    else await rejectFeedbackDelay(payload)
    uni.showToast({ title: '已处理', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((q) => {
  id.value = q.id || ''
  if (q.mode === 'approve' || q.mode === 'reject') mode.value = q.mode
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.mode-tabs {
  display: flex;
  flex-direction: row;
  margin: 16rpx 24rpx 0;
  padding: 8rpx;
  background: $pm-surface;
  border-radius: 999rpx;
  box-shadow: $pm-shadow;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: $pm-muted;
  border-radius: 999rpx;
  font-weight: 650;
}
.mode-tab.active {
  color: #fff;
  font-weight: 800;
  background: $pm-primary;
}
.form {
  padding: 24rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin: 12rpx 0 10rpx;
  font-weight: 700;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
}
.value {
  min-height: 84rpx;
  line-height: 84rpx;
  padding: 0 28rpx;
  background: $pm-surface;
  border-radius: 999rpx;
  box-shadow: $pm-shadow;
}
.textarea {
  width: 100%;
  min-height: 180rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow: $pm-shadow;
}
.submit {
  margin-top: 28rpx;
  height: 96rpx;
  line-height: 96rpx;
}
</style>
