<template>
  <view class="pm-page">
    <app-nav-bar title="修改处理人" />
    <view class="form">
      <view class="pm-card">
        <text class="label required">新处理人</text>
        <picker :range="labels" :value="index" @change="onPick">
          <view class="value">{{ labels[index] || '请选择' }}</view>
        </picker>
        <text class="label">备注</text>
        <textarea v-model="remark" class="textarea" placeholder="可选" />
        <button class="pm-btn-primary submit" :loading="submitting" @click="submit">确认指派</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getChangeRecipientCandidates, changeFeedbackRecipient } from '@/api/after-sales.js'
import { extractArray } from '@/utils/apiResponse.js'

const id = ref('')
const candidates = ref([])
const index = ref(-1)
const remark = ref('')
const submitting = ref(false)

const labels = computed(() =>
  candidates.value.map((u) => (u.nickName || u.userName || '') + ' (' + (u.userId || '') + ')')
)

async function load() {
  const res = await getChangeRecipientCandidates(id.value)
  candidates.value = extractArray(res)
}

function onPick(e) {
  index.value = Number(e.detail.value)
}

async function submit() {
  const u = candidates.value[index.value]
  if (!u) {
    uni.showToast({ title: '请选择处理人', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await changeFeedbackRecipient({
      feedbackId: Number(id.value),
      newTheFirstHandlerId: u.userId,
      remark: remark.value || undefined
    })
    uni.showToast({ title: '已指派', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
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

.form {
  padding: 20rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin: 16rpx 0 10rpx;
  font-weight: 560;
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
  font-weight: 560;
}
.textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow: $pm-shadow;
  line-height: 1.6;
}
.submit {
  margin-top: 28rpx;
  height: 84rpx;
  line-height: 84rpx;
}
</style>
