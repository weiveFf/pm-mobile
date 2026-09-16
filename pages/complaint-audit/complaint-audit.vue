<template>
  <view class="pm-page">
    <app-nav-bar title="客诉审核" />
    <view class="form">
      <view class="pm-card">
        <text class="label">审核意见</text>
        <textarea v-model="remark" class="textarea" placeholder="可选" />
        <view class="ops">
          <view class="reject" @click="doReject">{{ submitting ? '…' : '驳回' }}</view>
          <view class="approve" @click="doApprove">{{ submitting ? '…' : '通过' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { approveComplaintAudit, rejectComplaintAudit } from '@/api/after-sales.js'

const id = ref('')
const remark = ref('')
const submitting = ref(false)

async function doApprove() {
  submitting.value = true
  try {
    await approveComplaintAudit({ feedbackId: Number(id.value), remark: remark.value || '' })
    uni.showToast({ title: '已通过', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function doReject() {
  submitting.value = true
  try {
    await rejectComplaintAudit({ feedbackId: Number(id.value), remark: remark.value || '' })
    uni.showToast({ title: '已驳回', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((q) => {
  id.value = q.id || ''
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.form {
  padding: 20rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin-bottom: 12rpx;
  font-weight: 560;
}
.textarea {
  width: 100%;
  min-height: 220rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow: $pm-shadow;
  line-height: 1.6;
}
.ops {
  display: flex;
  flex-direction: row;
  margin-top: 28rpx;
}
.reject,
.approve {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  margin: 0 8rpx;
  text-align: center;
  border-radius: 999rpx;
  font-weight: 800;
  transition: transform 0.15s $pm-press-ease;
}
.reject:active,
.approve:active {
  transform: scale(0.96);
}
.reject {
  background: $pm-danger-soft;
  color: $pm-danger;
}
.approve {
  background: $pm-primary;
  color: #fff;
}
</style>
