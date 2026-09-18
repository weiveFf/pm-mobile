<template>
  <view class="pm-page">
    <app-nav-bar title="重新分配部门" />
    <view class="form">
      <view class="pm-card">
        <text class="label required">新部门</text>
        <picker :range="labels" :value="index" @change="onPick">
          <view class="value">{{ labels[index] || '请选择' }}</view>
        </picker>
        <text class="label">备注</text>
        <textarea v-model="remark" class="textarea" placeholder="可选" />
        <button class="pm-btn-primary submit" :loading="submitting" @click="submit">确认转派</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listDept } from '@/api/system.js'
import { reassignFeedbackDept } from '@/api/after-sales.js'
import { normalizeDeptList } from '@/utils/apiResponse.js'

const id = ref('')
const depts = ref([])
const index = ref(-1)
const remark = ref('')
const submitting = ref(false)

const labels = computed(() => depts.value.map((d) => d.deptName))

async function load() {
  try {
    const res = await listDept({ queryDeptAllName: true })
    depts.value = normalizeDeptList(res)
  } catch (e) {
    uni.showToast({ title: '部门加载失败', icon: 'none' })
  }
}

function onPick(e) {
  index.value = Number(e.detail.value)
}

async function submit() {
  const d = depts.value[index.value]
  if (!d) {
    uni.showToast({ title: '请选择部门', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await reassignFeedbackDept({
      feedbackId: Number(id.value),
      newDeptId: d.deptId,
      remark: remark.value || undefined
    })
    uni.showToast({ title: '已转派', icon: 'success' })
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
