<template>
  <view class="pm-page">
    <app-nav-bar title="处理反馈" />
    <view class="wrap">
      <view class="head-card">
        <text class="serial">#{{ serial }}</text>
        <text class="title">{{ abnormalType }} · {{ problemType }}</text>
      </view>
      <view class="panel">
        <text class="label">处理结果说明</text>
        <textarea v-model="processOpinion" class="textarea" maxlength="4000" placeholder="写清楚结论与后续安排吧" />
        <view class="ops">
          <view class="btn ghost" @click="saveDraft">{{ saving ? '…' : '暂存' }}</view>
          <view class="btn main" @click="submit">{{ submitting ? '…' : '完成处理' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getProcessFeedbackContext,
  completeProductProcess,
  editProductProcessList
} from '@/api/after-sales.js'
import { pickPrimaryProcess } from '@/utils/feedbackWorkflow.js'

const id = ref('')
const serial = ref('')
const abnormalType = ref('')
const problemType = ref('')
const processOpinion = ref('')
const processId = ref(null)
const submitting = ref(false)
const saving = ref(false)

async function load() {
  const res = await getProcessFeedbackContext(id.value)
  const data = res.data || {}
  const fb = data.feedback || {}
  serial.value = fb.serialNumber || fb.id
  abnormalType.value = fb.abnormalType || ''
  problemType.value = fb.problemType || ''
  const p = pickPrimaryProcess(data.processList || [])
  if (p) {
    processId.value = p.id
    processOpinion.value = p.processOpinion || p.handlingOpinion || ''
  }
}

async function saveDraft() {
  if (!processOpinion.value.trim()) {
    uni.showToast({ title: '请填写处理意见', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await editProductProcessList({
      id: processId.value,
      afterSalesFeedbackId: Number(id.value),
      processOpinion: processOpinion.value
    })
    uni.showToast({ title: '已暂存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '暂存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function submit() {
  if (!processOpinion.value.trim()) {
    uni.showToast({ title: '请填写处理结果说明', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await completeProductProcess({
      afterSalesFeedbackId: Number(id.value),
      processOpinion: processOpinion.value
    })
    uni.showToast({ title: '处理完成', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((q) => {
  id.value = q.id || ''
  load().catch((e) => uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' }))
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.wrap {
  padding: 16rpx 24rpx;
}
.head-card {
  padding: 28rpx;
  border-radius: $pm-radius;
  background: $pm-grad-hero;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow-lg;
  position: relative;
  overflow: hidden;
}
.serial {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 650;
}
.title {
  display: block;
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5rpx;
}
.panel {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  box-shadow: $pm-shadow;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin-bottom: 16rpx;
  font-weight: 650;
}
.textarea {
  width: 100%;
  min-height: 360rpx;
  padding: 0;
  background: transparent;
  font-size: 30rpx;
  line-height: 1.65;
  color: $pm-text;
  box-sizing: border-box;
}
.ops {
  display: flex;
  flex-direction: row;
  margin-top: 24rpx;
}
.btn {
  flex: 1;
  text-align: center;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 750;
  margin: 0 8rpx;
}
.btn.ghost {
  background: $pm-accent;
  color: $pm-primary-deep;
}
.btn.main {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(14, 95, 59, 0.28);
}
</style>
