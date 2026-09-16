<template>
  <view class="pm-page">
    <app-nav-bar title="申请再处理" />
    <view class="form">
      <view class="pm-card">
        <text class="label required">说明</text>
        <textarea v-model="remark" class="textarea" maxlength="2000" placeholder="请说明需要再次处理的原因" />
        <button class="pm-btn-primary submit" :loading="submitting" @click="submit">提交</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { reapplyProductProcess } from '@/api/after-sales.js'

const id = ref('')
const remark = ref('')
const submitting = ref(false)

async function submit() {
  if (!remark.value.trim()) {
    uni.showToast({ title: '说明为必填', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await reapplyProductProcess({
      afterSalesFeedbackId: Number(id.value),
      remark: remark.value,
      mentionUserIds: []
    })
    uni.showToast({ title: '已提交', icon: 'success' })
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
.label.required::before {
  content: '*';
  color: $pm-danger;
}
.textarea {
  width: 100%;
  min-height: 260rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow: $pm-shadow;
  line-height: 1.6;
}
.submit {
  margin-top: 24rpx;
  height: 84rpx;
  line-height: 84rpx;
}
</style>
