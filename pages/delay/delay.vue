<template>
  <view class="pm-page delay-page">
    <app-nav-bar title="延期" />

    <view class="body">
      <!-- 审批提示：创建人查看延期申请详情 -->
      <view v-if="canReview && noticeText" class="notice">
        <text class="notice-ic">!</text>
        <text class="notice-tx">{{ noticeText }}</text>
      </view>

      <!-- 角色切换：处理人只有「申请延期」；创建人可「同意 / 驳回」 -->
      <view v-if="tabs.length > 1" class="mode-tabs">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="mode-tab"
          :class="{ active: mode === t.key, danger: t.key === 'reject' && mode === t.key }"
          @click="mode = t.key"
        >{{ t.label }}</view>
      </view>

      <view class="form">
        <!-- 申请延期（处理人 / 负责人） -->
        <view v-if="mode === 'apply'" class="pm-card">
          <text class="label required">延期至</text>
          <picker
            mode="date"
            :value="demandFinishTime || currentDemand"
            :start="currentDemand || today"
            @change="onDate"
          >
            <view class="value" :class="{ empty: !demandFinishTime }">{{ demandFinishTime || '请选择日期' }}</view>
          </picker>
          <text class="hint">当前期望完成：{{ currentDemand || '—' }}</text>

          <text class="label">申请理由</text>
          <textarea v-model="remark" class="textarea" placeholder="请说明延期原因（可选）" />
          <text class="label sub">上传附件</text>
          <image-uploader v-model="attachments" />

          <button class="pm-btn-primary submit" :loading="submitting" @click="doApply">提交申请</button>
        </view>

        <!-- 审批（创建人）：同意 / 驳回 -->
        <view v-else class="pm-card">
          <text class="label">审批意见</text>
          <textarea v-model="remark" class="textarea" placeholder="可填写审批意见（可选）" />
          <text class="label sub">上传附件</text>
          <image-uploader v-model="attachments" />

          <button
            class="pm-btn-primary submit"
            :class="{ danger: mode === 'reject' }"
            :loading="submitting"
            @click="doReview"
          >{{ mode === 'approve' ? '同意延期' : '驳回延期' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getProcessFeedbackContext,
  applyFeedbackDelay,
  approveFeedbackDelay,
  rejectFeedbackDelay
} from '@/api/after-sales.js'
import { getUserId, getAccount } from '@/utils/auth.js'
import { isAfterSalesProcessOpen, isFeedbackProcessCompleted } from '@/utils/feedbackWorkflow.js'
import { buildRichHtml } from '@/utils/richText.js'
import ImageUploader from '@/components/image-uploader/image-uploader.vue'

const id = ref('')
const fb = ref(null)
const processList = ref([])
const canApply = ref(false)
const canReview = ref(false)
const mode = ref('apply')
const demandFinishTime = ref('')
const remark = ref('')
const attachments = ref([])
const submitting = ref(false)

const today = (() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
})()

/** 创建人审批时的页签（处理人无页签，只有申请表单） */
const tabs = computed(() => {
  if (canReview.value) {
    return [
      { key: 'approve', label: '同意延期' },
      { key: 'reject', label: '驳回延期' }
    ]
  }
  return []
})

function dateOnly(v) {
  const s = String(v || '')
  return s ? s.substring(0, 10) : ''
}
const currentDemand = computed(() => dateOnly(fb.value && fb.value.demandFinishTime))

const noticeText = computed(() => {
  const f = fb.value || {}
  const applyBy = f.delayApplyBy || f.DelayApplyBy || '申请人'
  const newDate = dateOnly(f.delayApplyDemandFinishDate || f.DelayApplyDemandFinishDate)
  if (!newDate) return ''
  return `${applyBy} 申请把期望完成时间由 ${currentDemand.value || '—'} 改为 ${newDate}`
})

function onDate(e) {
  demandFinishTime.value = e.detail.value
}

async function loadCtx() {
  try {
    const res = await getProcessFeedbackContext(id.value)
    const data = res.data || {}
    fb.value = data.feedback || data
    processList.value = data.processList || []
  } catch (e) {
    /* 拉取失败按无权限处理 */
  }
  const f = fb.value || {}
  const uid = Number(getUserId())
  const iv = f.interventionPersonnelId != null ? Number(f.interventionPersonnelId) : null
  const open = (processList.value || []).find((p) => isAfterSalesProcessOpen(p))
  const recipientId = open ? Number(open.recipientId ?? open.recipient_id) : NaN
  const isClose = !!f.isClose
  const completed = isFeedbackProcessCompleted(processList.value)
  const delayPending = Number(f.delayApplyStatus || 0) === 1

  // 处理人 / 负责人：未关闭、未处理完成、无待审申请时可申请延期
  canApply.value =
    !isClose && !completed && !delayPending && uid > 0 && (uid === recipientId || (iv != null && uid === iv))

  // 创建人（登录账号）：有待审申请时可同意 / 驳回
  const creator = String(f.createBy ?? f.create_by ?? '').trim()
  const account = String(getAccount() || '').trim()
  canReview.value = !isClose && !completed && delayPending && !!account && creator === account

  if (canApply.value) mode.value = 'apply'
  else if (canReview.value) mode.value = 'approve'
}

function submitRemark() {
  return buildRichHtml(remark.value, attachments.value)
}

async function doApply() {
  if (!demandFinishTime.value) {
    uni.showToast({ title: '请选择延期日期', icon: 'none' })
    return
  }
  if (currentDemand.value && demandFinishTime.value < currentDemand.value) {
    uni.showToast({ title: '延期日期不能早于当前要求完成时间', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await applyFeedbackDelay({
      feedbackId: Number(id.value),
      demandFinishTime: demandFinishTime.value,
      remark: submitRemark()
    })
    uni.showToast({ title: '已提交延期申请', icon: 'success' })
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
    const payload = { feedbackId: Number(id.value), remark: submitRemark() }
    if (mode.value === 'approve') await approveFeedbackDelay(payload)
    else await rejectFeedbackDelay(payload)
    uni.showToast({ title: mode.value === 'approve' ? '已同意延期' : '已驳回延期', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad(async (q) => {
  id.value = q.id || ''
  await loadCtx()
  // 详情页「同意/驳回延期」入口会带 mode 预置当前页签
  if (canReview.value && (q.mode === 'approve' || q.mode === 'reject')) {
    mode.value = q.mode
  }
  if (!canApply.value && !canReview.value) {
    uni.showModal({
      title: '无法操作',
      content: '当前账号没有该反馈的延期申请或审批权限',
      showCancel: false,
      success: () => uni.navigateBack()
    })
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.delay-page {
  min-height: 100vh;
}
.body {
  padding: 16rpx 24rpx 40rpx;
}
.notice {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  background: $pm-warn-soft;
  border-radius: 24rpx;
}
.notice-ic {
  width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-warn;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  margin-right: 14rpx;
  flex-shrink: 0;
}
.notice-tx {
  flex: 1;
  font-size: 24rpx;
  color: $pm-warn;
  font-weight: 650;
  line-height: 1.5;
}

.mode-tabs {
  display: flex;
  flex-direction: row;
  margin-bottom: 16rpx;
  padding: 8rpx;
  background: $pm-surface;
  border-radius: 999rpx;
  box-shadow: $pm-shadow;
}
.mode-tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 26rpx;
  color: $pm-muted;
  border-radius: 999rpx;
  font-weight: 650;
}
.mode-tab.active {
  color: #fff;
  font-weight: 800;
  background: $pm-primary;
  box-shadow: 0 8rpx 20rpx rgba(14, 95, 59, 0.28);
}
.mode-tab.active.danger {
  background: $pm-danger;
  box-shadow: 0 8rpx 20rpx rgba(190, 75, 72, 0.28);
}

.form {
  padding: 0;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin: 24rpx 0 10rpx;
  font-weight: 700;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
  margin-right: 4rpx;
}
.label.sub {
  margin-top: 28rpx;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $pm-muted;
}
.value {
  min-height: 84rpx;
  line-height: 84rpx;
  padding: 0 28rpx;
  background: $pm-bg-2;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: $pm-text;
}
.value.empty {
  color: $pm-muted;
}
.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: $pm-bg-2;
  border-radius: 28rpx;
  box-sizing: border-box;
  font-size: 27rpx;
  line-height: 1.6;
}
.submit {
  display: block;
  width: 100%;
  margin-top: 36rpx;
  height: 96rpx;
  line-height: 96rpx;
}
.submit.danger {
  background: $pm-danger !important;
  box-shadow: 0 10rpx 24rpx rgba(190, 75, 72, 0.3) !important;
}
</style>
