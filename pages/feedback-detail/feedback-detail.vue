<template>
  <view class="pm-page detail-page">
    <view v-if="fb" class="content">
      <view class="hero">
        <view class="hero-top">
          <view class="serial-pill">
            <text>{{ serial }}</text>
          </view>
          <status-chip :text="statusLabel" :tone="statusTone" />
        </view>
        <text class="hero-title">{{ fb.abnormalType || '-' }} · {{ fb.problemType || '-' }}</text>
        <view class="hero-tags">
          <text class="htag">期望 {{ formatDateOnly(fb.demandFinishTime) }}</text>
          <text class="htag">{{ urgencyLabel }}</text>
        </view>
        <text class="hero-sub">{{ fb.deptName || '—' }} · {{ handler }}</text>
        <text class="hero-sub">{{ fb.createByNickName || fb.create_by || '—' }} · {{ fb.create_time || fb.createTime || '' }}</text>
      </view>

      <view v-if="showExt" class="panel">
        <view v-for="item in extView" :key="item.label" class="kv">
          <text class="k">{{ item.label }}</text>
          <text class="v">{{ item.value }}</text>
        </view>
      </view>

      <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
        <view class="tabs">
          <text
            v-for="t in tabs"
            :key="t"
            class="tab"
            :class="{ active: activeTab === t }"
            @click="activeTab = t"
          >{{ t }}</text>
        </view>
      </scroll-view>

      <view v-show="activeTab === '问题描述'" class="panel body rich-body" v-html="problemHtml || '<p>暂无描述</p>'" @click="onRichClick($event, problemHtml)"></view>
      <view v-show="activeTab === '处理要求'" class="panel body rich-body" v-html="demandHtml || '<p>暂无要求</p>'" @click="onRichClick($event, demandHtml)"></view>

      <view v-show="activeTab === '评论'" class="panel">
        <view v-for="c in comments" :key="c.id" class="bubble-row" :class="{ me: isMine(c) }">
          <view class="bubble">
            <view class="bubble-top">
              <text class="who">{{ c.createByNickName || c.create_by || '用户' }}</text>
              <text class="when">{{ c.create_time || c.createTime || '' }}</text>
            </view>
            <text class="what">{{ stripHtml(c.content) }}</text>
          </view>
        </view>
        <view v-if="!comments.length" class="nil">来聊一句吧</view>
        <view class="composer">
          <input v-model="commentText" class="composer-input" placeholder="写评论…" />
          <view class="composer-send pressable" @click="sendComment">{{ commenting ? '…' : '发送' }}</view>
        </view>
      </view>

      <view v-show="activeTab === '操作记录'" class="panel">
        <view v-for="log in logs" :key="log.id" class="log">
          <view class="dot" />
          <view class="log-body">
            <text class="when">{{ log.create_time || log.createTime || '' }}</text>
            <text class="what">{{ logDisplay(log.content) }}</text>
          </view>
        </view>
        <view v-if="!logs.length" class="nil">还没有记录</view>
      </view>

      <view class="dock">
        <scroll-view scroll-x class="dock-scroll" :show-scrollbar="false">
          <view class="dock-inner">
            <text v-if="canRespond" class="dock-btn main" @click="doRespond">响应</text>
            <text v-if="canProcess" class="dock-btn main" @click="goProcess">处理</text>
            <text v-if="canClose" class="dock-btn" @click="doClose">关闭</text>
            <text v-if="canWithdraw" class="dock-btn" @click="doWithdraw">撤回</text>
            <text v-if="canReapply" class="dock-btn" @click="goReapply">再处理</text>
            <text v-if="!fb.isClose && !fb.isWithdrawn" class="dock-btn" @click="goChangeRecipient">改处理人</text>
            <text v-if="!fb.isClose && !fb.isWithdrawn" class="dock-btn" @click="goReassign">改部门</text>
            <text v-if="!fb.isClose && !fb.isWithdrawn" class="dock-btn" @click="goDelay">延期</text>
            <text v-if="isComplaintPending" class="dock-btn warn" @click="goComplaint">客诉审核</text>
          </view>
        </scroll-view>
      </view>
    </view>
    <view v-else class="pm-empty">{{ loading ? '加载中' : '未找到反馈' }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getUserId } from '@/utils/auth.js'
import {
  getProcessFeedbackContext,
  getFeedbackComments,
  addFeedbackComment,
  markProcessResponded,
  closeProductFeedbackList,
  withdrawProductFeedbackList
} from '@/api/after-sales.js'
import {
  resolveFeedbackWorkflowDisplay,
  formatHandlerPair,
  canRespondFeedbackRow,
  isFeedbackProcessCompleted,
  stripHtml,
  pickPrimaryProcess,
  isAfterSalesProcessOpen
} from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, formatDateOnly } from '@/utils/urgencyDisplay.js'
import { splitFeedbackLogContent } from '@/utils/feedbackLogDisplay.js'
import { afterSalesExtFields, hasAfterSalesExtData, deserializeAfterSalesExt } from '@/utils/afterSalesExt.js'
import { FEEDBACK_WORKFLOW_STATUS } from '@/constants/feedbackWorkflow.js'
import { extractArray } from '@/utils/apiResponse.js'
import { fixRichTextImageUrls, extractImageSrcs } from '@/utils/richText.js'
import { getBaseURL } from '@/utils/auth.js'

const id = ref('')
const loading = ref(false)
const fb = ref(null)
const processList = ref([])
const logs = ref([])
const comments = ref([])
const activeTab = ref('问题描述')
const tabs = ['问题描述', '处理要求', '评论', '操作记录']
const commentText = ref('')
const commenting = ref(false)
const statusLabel = ref('-')
const statusTone = ref('')
const statusKey = ref('')

const urgencyLabel = computed(() => getUrgencyLabel(fb.value && fb.value.urgencyLevel))
const handler = computed(() => formatHandlerPair(fb.value))
const serial = computed(() => {
  const v = String((fb.value && (fb.value.serialNumber || fb.value.id)) || '')
  return '#' + v.replace(/^#/, '')
})
const problemText = computed(() => stripHtml(fb.value && fb.value.problemDescription))
const demandText = computed(() => stripHtml(fb.value && fb.value.demand))
const baseURL = getBaseURL()
const problemHtml = computed(() => fixRichTextImageUrls(fb.value && fb.value.problemDescription, baseURL))
const demandHtml = computed(() => fixRichTextImageUrls(fb.value && fb.value.demand, baseURL))
const showExt = computed(() => {
  return fb.value && fb.value.abnormalType === '售后' && hasAfterSalesExtData(fb.value.afterSalesExt)
})
const extView = computed(() => {
  const ext = (fb.value && fb.value.afterSalesExt) || {}
  deserializeAfterSalesExt(ext)
  return afterSalesExtFields.map((f) => {
    let value = '-'
    if (f.type === 'datetimerange') {
      value = (ext.occurrenceStartTime || '-') + ' ~ ' + (ext.occurrenceEndTime || '-')
    } else if (ext[f.prop] != null && ext[f.prop] !== '') {
      value = String(ext[f.prop])
    }
    return { label: f.label, value }
  })
})

const canRespond = computed(() =>
  canRespondFeedbackRow({ feedback: fb.value, processList: processList.value }, getUserId())
)
const canProcess = computed(() => {
  if (!fb.value || fb.value.isClose || fb.value.isWithdrawn) return false
  const p = pickPrimaryProcess(processList.value)
  return p && isAfterSalesProcessOpen(p)
})
const canClose = computed(() => {
  if (!fb.value || fb.value.isClose || fb.value.isWithdrawn) return false
  return isFeedbackProcessCompleted(processList.value) || statusKey.value === FEEDBACK_WORKFLOW_STATUS.PENDING_CLOSE
})
const canWithdraw = computed(() => {
  if (!fb.value || fb.value.isClose || fb.value.isWithdrawn) return false
  return String(fb.value.create_by || fb.value.createBy || '') === String(getUserId()) ||
    Number(fb.value.create_by) === Number(getUserId())
})
const canReapply = computed(() => {
  if (!fb.value || fb.value.isClose || fb.value.isWithdrawn) return false
  return isFeedbackProcessCompleted(processList.value)
})
const isComplaintPending = computed(() => statusKey.value === FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT)

function logDisplay(content) {
  const parts = splitFeedbackLogContent(content)
  return parts.remark ? parts.main + '；说明：' + parts.remark : parts.main
}

function onRichClick(e, html) {
  const target = e.target
  if (!target || target.tagName !== 'IMG') return
  const urls = extractImageSrcs(html)
  if (!urls.length) return
  const current = target.src
  uni.previewImage({
    current,
    urls
  })
}

/** 自己的评论靠右(聊天气泡) */
function isMine(c) {
  const uid = String(getUserId() || '')
  if (!uid) return false
  return String(c.create_by || c.createBy || '') === uid
}

async function load() {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getProcessFeedbackContext(id.value)
    const data = res.data || {}
    fb.value = data.feedback || data
    processList.value = data.processList || []
    logs.value = data.operationLogs || data.logs || []
    const display = resolveFeedbackWorkflowDisplay({
      feedback: fb.value,
      processList: processList.value,
      workflowStatus: data.workflowStatus,
      workflowStatusLabel: data.workflowStatusLabel,
      workflowOverdueType: data.workflowOverdueType
    })
    statusLabel.value = display.label
    statusKey.value = display.status || ''
    statusTone.value = display.overdueType ? 'danger' : ''
    const cRes = await getFeedbackComments(id.value)
    comments.value = extractArray(cRes)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function sendComment() {
  if (!commentText.value.trim()) return
  commenting.value = true
  try {
    await addFeedbackComment(id.value, { content: commentText.value.trim() })
    commentText.value = ''
    const cRes = await getFeedbackComments(id.value)
    comments.value = extractArray(cRes)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '发送失败', icon: 'none' })
  } finally {
    commenting.value = false
  }
}

async function doRespond() {
  try {
    await markProcessResponded(id.value)
    uni.showToast({ title: '已响应', icon: 'success' })
    load()
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  }
}

async function doClose() {
  uni.showModal({
    title: '确认关闭',
    content: '确认关闭该反馈？',
    success: async (r) => {
      if (!r.confirm) return
      try {
        await closeProductFeedbackList(id.value)
        uni.showToast({ title: '已关闭', icon: 'success' })
        load()
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
      }
    }
  })
}

async function doWithdraw() {
  uni.showModal({
    title: '确认撤回',
    content: '确认撤回该反馈？',
    success: async (r) => {
      if (!r.confirm) return
      try {
        await withdrawProductFeedbackList(id.value)
        uni.showToast({ title: '已撤回', icon: 'success' })
        load()
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
      }
    }
  })
}

function goProcess() {
  uni.navigateTo({ url: '/pages/process/process?id=' + id.value })
}
function goReapply() {
  uni.navigateTo({ url: '/pages/reapply/reapply?id=' + id.value })
}
function goChangeRecipient() {
  uni.navigateTo({ url: '/pages/change-recipient/change-recipient?id=' + id.value })
}
function goReassign() {
  uni.navigateTo({ url: '/pages/reassign-dept/reassign-dept?id=' + id.value })
}
function goDelay() {
  uni.navigateTo({ url: '/pages/delay/delay?id=' + id.value })
}
function goComplaint() {
  uni.navigateTo({ url: '/pages/complaint-audit/complaint-audit?id=' + id.value })
}

onLoad((q) => {
  id.value = q.id || ''
})
onShow(() => {
  if (id.value) load()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.detail-page .content {
  padding: 32rpx 24rpx 150rpx;
}
.hero,
.panel {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow;
}
.hero-top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.serial-pill {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $pm-accent;
  color: $pm-primary-deep;
  font-size: 22rpx;
  font-weight: 750;
}
.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.8rpx;
  margin-bottom: 16rpx;
}
.hero-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}
.htag {
  margin-right: 10rpx;
  margin-bottom: 8rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: $pm-bg;
  font-size: 20rpx;
  color: $pm-text-secondary;
  font-weight: 650;
}
.hero-sub {
  display: block;
  font-size: 24rpx;
  color: $pm-muted;
  line-height: 1.55;
}
.kv {
  display: flex;
  flex-direction: row;
  padding: 14rpx 0;
  border-bottom: 1px solid $pm-line;
}
.kv:last-child {
  border-bottom: none;
}
.k {
  width: 180rpx;
  font-size: 24rpx;
  color: $pm-muted;
  flex-shrink: 0;
}
.v {
  flex: 1;
  font-size: 24rpx;
  color: $pm-text;
  font-weight: 600;
}
.tabs-scroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 16rpx;
}
.tabs {
  display: inline-flex;
  flex-direction: row;
  padding: 6rpx;
  background: $pm-surface;
  border-radius: 999rpx;
  box-shadow: $pm-shadow;
}
.tab {
  padding: 16rpx 28rpx;
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 650;
  border-radius: 999rpx;
}
.tab.active {
  background: $pm-primary;
  color: #fff;
  font-weight: 800;
}
.body {
  white-space: pre-wrap;
  font-size: 28rpx;
  line-height: 1.7;
  color: $pm-text;
  min-height: 160rpx;
}
.rich-body {
  white-space: normal;
}
.rich-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12rpx 0;
  border-radius: 12rpx;
}
.bubble-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 18rpx;
}
.bubble-row.me {
  flex-direction: row-reverse;
}
.bubble {
  max-width: 78%;
  background: $pm-bg-2;
  border-radius: 22rpx;
  border-bottom-left-radius: 6rpx;
  padding: 18rpx 22rpx;
}
.bubble-row.me .bubble {
  background: $pm-primary;
  border-bottom-left-radius: 22rpx;
  border-bottom-right-radius: 6rpx;
}
.bubble-top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.who {
  font-size: 24rpx;
  font-weight: 750;
  color: $pm-text;
}
.bubble-row.me .who {
  color: rgba(255, 255, 255, 0.85);
}
.when {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  margin-left: 12rpx;
}
.bubble-row.me .when {
  color: rgba(255, 255, 255, 0.7);
}
.what {
  display: block;
  font-size: 26rpx;
  color: $pm-text;
  line-height: 1.55;
  word-break: break-all;
}
.bubble-row.me .what {
  color: #fff;
}
.nil {
  padding: 36rpx 0;
  text-align: center;
  color: $pm-muted;
  font-size: 24rpx;
}
.composer {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 20rpx;
}
.composer-input {
  flex: 1;
  height: 76rpx;
  padding: 0 28rpx;
  background: $pm-bg;
  border-radius: 999rpx;
  font-size: 26rpx;
}
.composer-send {
  margin-left: 16rpx;
  padding: 0 28rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 750;
}
.log {
  display: flex;
  flex-direction: row;
  padding: 16rpx 0;
}
.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $pm-primary;
  margin-top: 10rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.log-body {
  flex: 1;
}
.dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(250, 248, 244, 0.94);
  backdrop-filter: blur(16px);
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  z-index: 50;
  border-top: 1px solid $pm-line;
}
.dock-scroll {
  width: 100%;
  white-space: nowrap;
}
.dock-inner {
  display: inline-flex;
  padding: 0 24rpx;
}
.dock-btn {
  margin-right: 12rpx;
  padding: 18rpx 30rpx;
  border-radius: 999rpx;
  background: $pm-surface;
  color: $pm-text;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: $pm-shadow;
}
.dock-btn.main {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(14, 95, 59, 0.28);
}
.dock-btn.warn {
  background: $pm-warn-soft;
  color: $pm-warn;
}
</style>

<style lang="scss">
@import '@/uni.scss';

/* v-html 渲染的富文本图片全局样式，确保不撑出屏幕 */
.rich-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12rpx 0;
  border-radius: 12rpx;
}
</style>
