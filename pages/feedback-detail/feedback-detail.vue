<template>
  <view class="pm-page detail-page">
    <view v-if="fb" class="content">
      <!-- Hero：森林渐变卡 -->
      <view class="hero">
        <view class="deco" />
        <view class="hero-top">
          <view class="serial-pill">
            <text>{{ serial }}</text>
          </view>
          <view class="hero-status" :class="statusTone">{{ statusLabel }}</view>
        </view>
        <text class="hero-title">{{ fb.abnormalType || '-' }} · {{ fb.problemType || '-' }}</text>
        <view class="hero-tags">
          <text class="htag">期望 {{ formatDateOnly(fb.demandFinishTime) }}</text>
          <text class="htag">{{ urgencyLabel }}</text>
        </view>
        <view class="hero-meta">
          <text class="hero-sub">{{ fb.deptName || '—' }} · {{ handler }}</text>
          <text class="hero-sub">{{ fb.createByNickName || fb.create_by || '—' }} · {{ fb.create_time || fb.createTime || '' }}</text>
        </view>
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
        <view v-for="c in commentViews" :key="c.id" class="bubble-row" :class="{ me: c.mine }">
          <view class="bubble">
            <view class="bubble-top">
              <text class="who">{{ c.name }}</text>
              <text class="when">{{ c.time }}</text>
            </view>
            <view
              v-if="c.isHtml"
              class="what rich-body-inline"
              v-html="c.html"
              @click="onRichClick($event, c.html)"
            ></view>
            <text v-else class="what">{{ c.text }}</text>
          </view>
        </view>
        <view v-if="!commentViews.length" class="nil">来聊一句吧</view>
        <view class="composer">
          <input v-model="commentText" class="composer-input" placeholder="写评论…" />
          <view class="composer-send pressable" @click="sendComment">{{ commenting ? '…' : '发送' }}</view>
        </view>
      </view>

      <view v-show="activeTab === '操作记录'" class="panel">
        <view v-for="log in logViews" :key="log.id" class="log">
          <view class="log-rail">
            <view class="log-dot" />
            <view class="log-line" />
          </view>
          <view class="log-body">
            <text class="log-time">{{ log.time }}</text>
            <text class="log-main">{{ log.main }}</text>
            <view v-if="log.remark" class="log-remark">
              <text class="log-remark-label">留言</text>
              <view
                v-if="log.remarkIsHtml"
                class="log-remark-body"
                v-html="log.remarkHtml"
                @click="onRichClick($event, log.remarkHtml)"
              ></view>
              <text v-else class="log-remark-text">{{ log.remark }}</text>
            </view>
          </view>
        </view>
        <view v-if="!logViews.length" class="nil">还没有记录</view>
      </view>

      <view class="dock">
        <scroll-view scroll-x class="dock-scroll" :show-scrollbar="false">
          <view class="dock-inner">
            <text v-if="canRespond" class="dock-btn main" @click="doRespond">响应</text>
            <text v-if="canProcess" class="dock-btn main" @click="goProcess">处理</text>
            <text v-if="canWithdraw" class="dock-btn danger" @click="doWithdraw">撤回反馈</text>
            <text v-if="canReapply" class="dock-btn warn" @click="goReapply">再处理</text>
            <text v-if="canClose" class="dock-btn success" @click="doClose">关闭反馈</text>
            <text v-if="canDelayApply" class="dock-btn" @click="goDelay">申请延期</text>
            <text v-if="canReviewDelay" class="dock-btn main" @click="goDelayReview('approve')">同意延期</text>
            <text v-if="canReviewDelay" class="dock-btn danger" @click="goDelayReview('reject')">驳回延期</text>
            <text v-if="canAssignRecipient" class="dock-btn" @click="goChangeRecipient">改处理人</text>
            <text v-if="canReassignDept" class="dock-btn" @click="goReassign">改部门</text>
            <text v-if="canComplaintAudit" class="dock-btn warn" @click="goComplaint">客诉审核</text>
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
import { getUserId, getAccount, getIsDeptLeader, getIsFirstContact, getBaseURL } from '@/utils/auth.js'
import {
  getProcessFeedbackContext,
  getFeedbackComments,
  addFeedbackComment,
  markProcessResponded,
  closeProductFeedbackList,
  withdrawProductFeedbackList
} from '@/api/after-sales.js'
import { listDept } from '@/api/system.js'
import {
  resolveFeedbackWorkflowDisplay,
  formatHandlerPair,
  canRespondFeedbackRow,
  isFeedbackProcessCompleted,
  isAfterSalesProcessOpen
} from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, formatDateOnly } from '@/utils/urgencyDisplay.js'
import { splitFeedbackLogContent } from '@/utils/feedbackLogDisplay.js'
import { afterSalesExtFields, hasAfterSalesExtData, deserializeAfterSalesExt } from '@/utils/afterSalesExt.js'
import { FEEDBACK_WORKFLOW_STATUS } from '@/constants/feedbackWorkflow.js'
import { extractArray, normalizeDeptList } from '@/utils/apiResponse.js'
import { fixRichTextImageUrls, extractImageSrcs } from '@/utils/richText.js'

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

const uid = computed(() => Number(getUserId()))
/** 登录账号：后端 create_by / Create_by 存的是账号（不是 userId、不是昵称） */
const account = computed(() => String(getAccount() || '').trim())
const baseURL = getBaseURL()

const urgencyLabel = computed(() => getUrgencyLabel(fb.value && fb.value.urgencyLevel))
const handler = computed(() => formatHandlerPair(fb.value))
const serial = computed(() => {
  const v = String((fb.value && (fb.value.serialNumber || fb.value.id)) || '')
  return '#' + v.replace(/^#/, '')
})
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

/* —— 富文本判定 & 渲染：内容含标签按 HTML 渲染，否则按纯文本 —— */
function isHtml(s) {
  return /<[a-z!/][\s\S]*>/i.test(String(s || ''))
}
function rich(html) {
  return fixRichTextImageUrls(html, baseURL)
}

const commentViews = computed(() =>
  (comments.value || []).map((c) => ({
    id: c.id,
    name: c.createByNickName || c.create_by || '用户',
    time: c.create_time || c.createTime || '',
    mine: isMine(c),
    isHtml: isHtml(c.content),
    html: rich(c.content),
    text: String(c.content || '')
  }))
)

const logViews = computed(() =>
  (logs.value || []).map((log) => {
    const parts = splitFeedbackLogContent(log.content)
    return {
      id: log.id,
      time: log.create_time || log.createTime || '',
      main: parts.main,
      remark: parts.remark,
      remarkIsHtml: isHtml(parts.remark),
      remarkHtml: parts.remark ? rich(parts.remark) : ''
    }
  })
)

function onRichClick(e, html) {
  const target = e.target
  if (!target || target.tagName !== 'IMG') return
  const urls = extractImageSrcs(html)
  if (!urls.length) return
  uni.previewImage({ current: target.src, urls })
}

/** 自己的评论靠右(聊天气泡) */
function isMine(c) {
  const u = String(getUserId() || '')
  if (!u) return false
  return String(c.create_by || c.createBy || '') === u
}

/* —— 权限：与 PC 端 FeedbackDetailsTabDialog 对齐 —— */
const isCompleted = computed(() => isFeedbackProcessCompleted(processList.value))
const openProcess = computed(() => (processList.value || []).find((p) => isAfterSalesProcessOpen(p)) || null)

/** 是否反馈创建人（create_by === 登录账号） */
const isCreator = computed(() => {
  const f = fb.value
  if (!f || !account.value) return false
  const creator = String(f.createBy ?? f.create_by ?? '').trim()
  return creator !== '' && creator === account.value
})

/** 当前处理人 / 干预人（PC 用 open.recipientId） */
const isRecipientOrIv = computed(() => {
  const u = uid.value
  if (!u) return false
  const f = fb.value || {}
  const iv = f.interventionPersonnelId != null ? Number(f.interventionPersonnelId) : null
  const op = openProcess.value
  const recipientId = op ? Number(op.recipientId ?? op.recipient_id) : NaN
  return (Number.isFinite(recipientId) && recipientId === u) || (iv != null && u === iv)
})

/* 部门负责人 / 第一接口人映射（判定「本部门负责人」身份用） */
const deptLeaderByDeptId = ref({})
const deptFirstContactByDeptId = ref({})
const deptsLoaded = ref(false)

function scopeDeptId(f) {
  if (!f) return null
  if (f.deptId != null && f.deptId !== '' && Number(f.deptId) > 0) return Number(f.deptId)
  const u = f.theFirstHandlerUser || f.TheFirstHandlerUser
  if (u && u.deptId != null && Number(u.deptId) > 0) return Number(u.deptId)
  return null
}

async function loadDeptRoleMap() {
  if (deptsLoaded.value) return
  try {
    const res = await listDept({ queryDeptAllName: true })
    const rows = normalizeDeptList(res)
    const lm = {}
    const fm = {}
    rows.forEach((d) => {
      lm[String(d.deptId)] = d.leader != null && d.leader !== '' ? Number(d.leader) : null
      const fc = d.firstContactUserId
      fm[String(d.deptId)] = fc != null && fc !== '' && Number(fc) > 0 ? Number(fc) : null
    })
    deptLeaderByDeptId.value = lm
    deptFirstContactByDeptId.value = fm
    deptsLoaded.value = true
  } catch (e) {
    /* 部门数据拉取失败不阻塞详情 */
  }
}

/** getInfo 是否标记为部门负责人/第一接口人；后端未返回时不做限制，避免按钮全部消失 */
function hasDeptRole() {
  const a = getIsDeptLeader()
  const b = getIsFirstContact()
  if (a === '' && b === '') return true
  return a === '1' || b === '1'
}

/** 是否对当前处理部门具备操作权（处理人 / 本部门负责人 / 本部门第一接口人） */
const canOperateDeptWorkflow = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (isCompleted.value) return false
  const u = uid.value
  if (!u) return false
  if (u === Number(f.theFirstHandlerId)) return true
  const did = scopeDeptId(f)
  if (did == null) return false
  const lid = deptLeaderByDeptId.value[String(did)]
  if (lid != null && u === lid) return true
  const fid = deptFirstContactByDeptId.value[String(did)]
  if (fid != null && u === fid) return true
  return false
})

const isComplaintPending = computed(() => statusKey.value === FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT)

const canRespond = computed(() =>
  canRespondFeedbackRow({ feedback: fb.value, processList: processList.value }, uid.value)
)
const canProcess = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (!openProcess.value) return false
  return isRecipientOrIv.value
})
const canWithdraw = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (!isCreator.value) return false
  return !isCompleted.value
})
const canClose = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (!isCreator.value) return false
  return isCompleted.value
})
const canReapply = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (!isCreator.value) return false
  return isCompleted.value
})
const canDelayApply = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (isCompleted.value) return false
  if (Number(f.delayApplyStatus || 0) === 1) return false
  return isRecipientOrIv.value
})
/** 创建人：有延期待审批时可同意 / 驳回（与 PC canReviewDelay 一致） */
const canReviewDelay = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (isCompleted.value) return false
  if (Number(f.delayApplyStatus || 0) !== 1) return false
  return isCreator.value
})
const canAssignRecipient = computed(() => {
  const f = fb.value
  if (!f || f.isClose || f.isWithdrawn) return false
  if (!hasDeptRole()) return false
  if (isComplaintPending.value) return false
  if (Number(f.complaintAuditStatus ?? f.ComplaintAuditStatus ?? 0) === 3) return false
  return canOperateDeptWorkflow.value
})
const canReassignDept = computed(() => {
  if (!canAssignRecipient.value) return false
  // 与后端一致：响应后禁止转派其他部门
  const anyResponded = (processList.value || []).some((p) => {
    const r = p.isResponded ?? p.IsResponded
    const rt = p.respondedTime ?? p.RespondedTime ?? p.responded_time
    return r === true || r === 1 || rt != null
  })
  return !anyResponded
})
const canComplaintAudit = computed(() => {
  const f = fb.value
  if (!f || f.isClose) return false
  if (!isComplaintPending.value) return false
  return canOperateDeptWorkflow.value
})

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
    loadDeptRoleMap()
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
  const f = fb.value
  const u = uid.value
  const firstHandlerId = Number(f && f.theFirstHandlerId)
  const firstHandlerName = (f && f.theFirstHandlerUser && f.theFirstHandlerUser.nickName) || '原处理人'
  const msg = u !== firstHandlerId
    ? `响应后，${firstHandlerName}将没有权限处理该反馈并不可转派其他部门，确认响应吗？`
    : '响应后不可转派其他部门请尽快处理，确认响应吗？'
  uni.showModal({
    title: '确认响应',
    content: msg,
    success: async (r) => {
      if (!r.confirm) return
      try {
        await markProcessResponded(id.value)
        uni.showToast({ title: '已响应', icon: 'success' })
        load()
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
      }
    }
  })
}

async function doClose() {
  const serialText = (fb.value && fb.value.serialNumber) || ''
  uni.showModal({
    title: '确认关闭',
    content: `确定要关闭${serialText}的反馈单吗？`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        await closeProductFeedbackList(id.value)
        uni.showToast({ title: '该反馈已关闭', icon: 'success' })
        load()
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
      }
    }
  })
}

async function doWithdraw() {
  const serialText = (fb.value && fb.value.serialNumber) || ''
  uni.showModal({
    title: '确认撤回',
    content: `确定撤回${serialText}吗？撤回后将通知处理人。`,
    success: async (r) => {
      if (!r.confirm) return
      try {
        await withdrawProductFeedbackList(id.value)
        uni.showToast({ title: '已撤回该反馈', icon: 'success' })
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
function goDelayReview(mode) {
  uni.navigateTo({ url: '/pages/delay/delay?id=' + id.value + '&mode=' + mode })
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
  padding: 32rpx 24rpx 180rpx;
}

/* —— Hero：森林渐变 —— */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: $pm-radius-lg;
  padding: 32rpx;
  margin-bottom: 20rpx;
  background: $pm-grad-hero;
  color: #fff;
  box-shadow: $pm-shadow-lg;
}
.deco {
  position: absolute;
  right: -60rpx;
  top: -70rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.hero-top {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}
.serial-pill {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 22rpx;
  font-weight: 750;
}
.hero-status {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.94);
  color: $pm-primary-deep;
  font-size: 22rpx;
  font-weight: 800;
}
.hero-status.danger {
  color: $pm-danger;
}
.hero-status.warn {
  color: $pm-warn;
}
.hero-title {
  position: relative;
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.8rpx;
  margin-bottom: 16rpx;
}
.hero-tags {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.htag {
  margin-right: 10rpx;
  margin-bottom: 8rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 650;
}
.hero-meta {
  position: relative;
}
.hero-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.panel {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow;
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

/* 富文本内的图片（问题描述/处理要求/评论/操作记录留言通用） */
.rich-body img,
.rich-body-inline img,
.log-remark-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12rpx 0;
  border-radius: 12rpx;
}
.rich-body-inline p,
.log-remark-body p {
  margin: 0 0 8rpx;
  line-height: 1.6;
}
.rich-body-inline p:last-child,
.log-remark-body p:last-child {
  margin-bottom: 0;
}

/* —— 评论气泡 —— */
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
.bubble-row.me .what,
.bubble-row.me .rich-body-inline {
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

/* —— 操作记录：时间线 —— */
.log {
  display: flex;
  flex-direction: row;
}
.log-rail {
  width: 24rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8rpx;
}
.log-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $pm-primary;
  box-shadow: 0 0 0 6rpx rgba(14, 95, 59, 0.12);
}
.log-line {
  flex: 1;
  width: 2rpx;
  background: $pm-line;
  margin: 6rpx 0;
  min-height: 20rpx;
}
.log:last-child .log-line {
  display: none;
}
.log-body {
  flex: 1;
  min-width: 0;
  padding-left: 20rpx;
  padding-bottom: 24rpx;
}
.log-time {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  font-variant-numeric: tabular-nums;
  margin-bottom: 6rpx;
}
.log-main {
  display: block;
  font-size: 26rpx;
  color: $pm-text;
  line-height: 1.6;
  word-break: break-word;
}
.log-remark {
  margin-top: 12rpx;
  padding: 16rpx 20rpx;
  background: $pm-bg;
  border-radius: 14rpx;
  border-left: 6rpx solid $pm-primary;
}
.log-remark-label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  font-weight: 700;
  margin-bottom: 6rpx;
}
.log-remark-body,
.log-remark-text {
  font-size: 25rpx;
  color: $pm-text;
  line-height: 1.6;
  word-break: break-word;
}

/* —— 底部操作 Dock —— */
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
.dock-btn.danger {
  background: $pm-danger-soft;
  color: $pm-danger;
}
.dock-btn.warn {
  background: $pm-warn-soft;
  color: $pm-warn;
}
.dock-btn.success {
  background: $pm-primary-soft;
  color: $pm-primary-deep;
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
