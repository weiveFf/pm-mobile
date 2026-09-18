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
          <text class="hero-sub">{{ fb.createByNickName || fb.createNickName || fb.create_by || '—' }} · {{ fb.create_time || fb.createTime || '' }}</text>
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

      <!-- 悬浮评论入口：点击弹出独立评论浮层 -->
      <view class="fab pressable" @click="openComments">
        <svg class="fab-ic" viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1z" fill="currentColor" /></svg>
        <text v-if="commentViews.length" class="fab-badge">{{ commentViews.length }}</text>
      </view>

      <!-- 评论浮层：底部弹出 -->
      <view class="cm-mask" :class="{ show: showComments }" @click="closeComments" />
      <view class="cm-sheet" :class="{ show: showComments }">
        <view class="cm-head">
          <view class="cm-head-left">
            <text class="cm-title">评论</text>
            <text v-if="commentViews.length" class="cm-count">{{ commentViews.length }}</text>
          </view>
          <text class="cm-close" @click="closeComments">✕</text>
        </view>

        <scroll-view class="cm-list" scroll-y :scroll-into-view="cmIntoView" :show-scrollbar="false">
          <view v-for="c in commentViews" :key="c.id" class="cm-item" :class="{ me: c.mine }">
            <view class="cm-avatar" :style="{ background: c.avatarBg }">{{ c.avatarChar }}</view>
            <view class="cm-body">
              <view class="cm-meta">
                <text class="cm-name">{{ c.name }}</text>
                <text class="cm-time">{{ c.time }}</text>
              </view>
              <view class="cm-bubble">
                <view class="cm-rich" v-html="c.html" @click="onRichClick($event, c.html)"></view>
              </view>
            </view>
          </view>
          <view v-if="!commentViews.length" class="cm-nil">还没有评论，来说一句吧</view>
          <view id="cm-bottom-anchor" class="cm-anchor" />
        </scroll-view>

        <view class="cm-composer-wrap">
          <!-- @ 提及候选 -->
          <view v-if="mentionOpen" class="cm-mention">
            <view v-if="!mentionList.length" class="cm-mention-empty">无匹配同事</view>
            <scroll-view v-else scroll-y class="cm-mention-list">
              <view
                v-for="u in mentionList"
                :key="u.userId"
                class="cm-mention-item"
                @click="pickMention(u)"
              >
                <text class="cm-mention-name">{{ u.nickName || u.userName }}</text>
                <text v-if="u.deptName" class="cm-mention-dept">{{ u.deptName }}</text>
              </view>
            </scroll-view>
          </view>

          <view class="cm-composer">
            <text class="cm-at-btn pressable" @click="openMention">@</text>
            <textarea
              class="cm-input"
              :value="commentText"
              placeholder="写评论，输入 @ 提及同事…"
              :auto-height="false"
              confirm-type="send"
              @input="onCommentInput"
              @confirm="sendComment"
            />
            <view class="cm-send pressable" @click="sendComment">{{ commenting ? '…' : '发送' }}</view>
          </view>
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
import { ref, computed, nextTick } from 'vue'
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
import { listDept, listUser } from '@/api/system.js'
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
import { extractArray, normalizeDeptList, normalizeUserList } from '@/utils/apiResponse.js'
import { fixRichTextImageUrls, extractImageSrcs, escapeHtml } from '@/utils/richText.js'

const id = ref('')
const loading = ref(false)
const fb = ref(null)
const processList = ref([])
const logs = ref([])
const comments = ref([])
const activeTab = ref('问题描述')
const tabs = ['问题描述', '处理要求', '操作记录']
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

const AVATAR_COLORS = ['#0E5F3B', '#B8744A', '#3F6CB0', '#C2872A', '#8E5BA6', '#3D805E', '#C0504D', '#4A7C8C']

function avatarChar(name) {
  const s = String(name || '用').trim()
  return s ? s.charAt(0).toUpperCase() : '用'
}
function avatarColor(name) {
  const s = String(name || '')
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** 评论内容渲染：富文本原样；纯文本转义后换行 + 高亮 @昵称 */
function renderCommentContent(content) {
  const raw = String(content || '')
  if (isHtml(raw)) return rich(raw)
  return escapeHtml(raw)
    .replace(/\n/g, '<br/>')
    .replace(/@([^\s@<]+)/g, '<span class="cm-at">@$1</span>')
}

const commentViews = computed(() =>
  (comments.value || []).map((c) => {
    // PC 端评论人字段是 createNickName / create_by；此前误用 createByNickName 导致显示「用户」
    const name =
      c.createNickName || c.CreateNickName || c.createByNickName || c.create_by || c.Create_by || '用户'
    return {
      id: c.id,
      name,
      avatarChar: avatarChar(name),
      avatarBg: avatarColor(name),
      time: c.create_time || c.createTime || '',
      mine: isMine(c),
      html: renderCommentContent(c.content)
    }
  })
)

/* —— 悬浮评论浮层 —— */
const showComments = ref(false)
const cmIntoView = ref('')

function openComments() {
  showComments.value = true
  nextTick(() => {
    cmIntoView.value = 'cm-bottom-anchor'
  })
}
function closeComments() {
  showComments.value = false
  cmIntoView.value = ''
  mentionOpen.value = false
}

/* —— @ 提及（与 PC 一致：输入 @ 弹出成员，选中插入 @昵称，提交带 mentionUserIds） —— */
const mentionUsers = ref([])
const mentionLoaded = ref(false)
const mentionOpen = ref(false)
const mentionQuery = ref('')
const mentionStart = ref(-1)
const mentionCursor = ref(-1)
const mentionUserIds = ref([])

const mentionList = computed(() => {
  const me = String(getUserId() || '')
  const list = (mentionUsers.value || []).filter((u) => {
    const uid = String(u.userId || '')
    const uname = String(u.userName || '').toLowerCase()
    return uid && uid !== me && uid !== '1' && uname !== 'admin'
  })
  const q = String(mentionQuery.value || '').toLowerCase()
  if (!q) return list.slice(0, 30)
  return list
    .filter((u) => String(u.nickName || u.userName || '').toLowerCase().includes(q))
    .slice(0, 30)
})

async function ensureMentionUsers() {
  if (mentionLoaded.value) return
  try {
    const res = await listUser({ pageNum: 1, pageSize: 500, status: '0', delFlag: '0' })
    mentionUsers.value = normalizeUserList(res)
    mentionLoaded.value = true
  } catch (e) {
    /* 拉取失败则候选为空 */
  }
}

function onCommentInput(e) {
  const val = (e && e.detail && e.detail.value) || ''
  commentText.value = val
  const cursor = e && e.detail && e.detail.cursor != null ? e.detail.cursor : val.length
  const before = val.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at < 0) {
    mentionOpen.value = false
    return
  }
  const seg = before.slice(at + 1)
  if (/[\s@]/.test(seg)) {
    mentionOpen.value = false
    return
  }
  mentionStart.value = at
  mentionCursor.value = cursor
  mentionQuery.value = seg
  mentionOpen.value = true
  ensureMentionUsers()
}

/** 通过「@」按钮唤起候选（插到光标/末尾） */
function openMention() {
  ensureMentionUsers()
  const val = String(commentText.value || '')
  mentionStart.value = val.length
  mentionCursor.value = val.length
  mentionQuery.value = ''
  mentionOpen.value = !mentionOpen.value
}

function pickMention(u) {
  const name = (u && (u.nickName || u.userName)) || ''
  if (!name) return
  const val = String(commentText.value || '')
  const start = mentionStart.value >= 0 ? mentionStart.value : val.length
  const cursor = mentionCursor.value >= 0 ? mentionCursor.value : val.length
  const insert = '@' + name + ' '
  commentText.value = val.slice(0, start) + insert + val.slice(cursor)
  if (u.userId != null && !mentionUserIds.value.includes(u.userId)) {
    mentionUserIds.value.push(u.userId)
  }
  mentionOpen.value = false
  mentionStart.value = -1
  mentionCursor.value = -1
  mentionQuery.value = ''
}

/** 从文本里回捞 @ 到的成员 ID（与 PC collectMentionIdsFromContent 一致） */
function collectMentionIds(text) {
  const t = String(text || '')
  const ids = []
  ;(mentionUsers.value || []).forEach((u) => {
    const name = u.nickName || u.userName || ''
    if (name && t.includes('@' + name) && !ids.includes(u.userId)) ids.push(u.userId)
  })
  mentionUserIds.value.forEach((id) => {
    if (!ids.includes(id)) ids.push(id)
  })
  return ids
}

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

/** 自己的评论靠右(聊天气泡)：评论 Create_by 也是登录账号，账号优先、userId 兜底 */
function isMine(c) {
  const by = String(c.create_by || c.Create_by || c.createBy || '')
  if (!by) return false
  const acc = String(getAccount() || '')
  if (acc && by === acc) return true
  const uid = String(getUserId() || '')
  return !!uid && by === uid
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
    const content = commentText.value.trim()
    await addFeedbackComment(id.value, { content, mentionUserIds: collectMentionIds(content) })
    commentText.value = ''
    mentionUserIds.value = []
    mentionOpen.value = false
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
.cm-rich img,
.log-remark-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12rpx 0;
  border-radius: 12rpx;
}
.cm-rich p,
.log-remark-body p {
  margin: 0 0 8rpx;
  line-height: 1.6;
}
.cm-rich p:last-child,
.log-remark-body p:last-child {
  margin-bottom: 0;
}

/* —— 悬浮评论入口（FAB） —— */
.fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(140rpx + constant(safe-area-inset-bottom));
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $pm-grad-brand;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 32rpx -8rpx rgba(14, 95, 59, 0.5);
  z-index: 60;
}
.fab-ic {
  width: 46rpx;
  height: 46rpx;
}
.fab-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 34rpx;
  height: 34rpx;
  line-height: 34rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: $pm-copper;
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
  text-align: center;
  box-sizing: border-box;
  border: 3rpx solid $pm-bg;
}

/* —— 评论浮层（底部弹出） —— */
.cm-mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 30, 24, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.26s ease, visibility 0.26s ease;
  z-index: 70;
}
.cm-mask.show {
  opacity: 1;
  visibility: visible;
}
.cm-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 82vh;
  display: flex;
  flex-direction: column;
  background: $pm-bg;
  border-radius: 32rpx 32rpx 0 0;
  transform: translateY(100%);
  transition: transform 0.3s $pm-press-ease;
  z-index: 71;
  box-sizing: border-box;
}
.cm-sheet.show {
  transform: translateY(0);
}
.cm-head {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx 20rpx;
  border-bottom: 1px solid $pm-line;
}
.cm-head-left {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.cm-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $pm-text;
}
.cm-count {
  margin-left: 12rpx;
  min-width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  background: $pm-accent;
  color: $pm-primary-deep;
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
  box-sizing: border-box;
}
.cm-close {
  width: 52rpx;
  height: 52rpx;
  line-height: 52rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-bg-2;
  color: $pm-text-secondary;
  font-size: 26rpx;
}
.cm-list {
  flex: 1;
  min-height: 0;
  padding: 20rpx 24rpx 0;
  box-sizing: border-box;
}
.cm-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 24rpx;
}
.cm-item.me {
  flex-direction: row-reverse;
}
.cm-avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 26rpx;
  font-weight: 800;
  text-align: center;
  line-height: 64rpx;
}
.cm-body {
  flex: 1;
  min-width: 0;
  margin: 0 16rpx;
  display: flex;
  flex-direction: column;
}
.cm-item.me .cm-body {
  align-items: flex-end;
}
.cm-meta {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-bottom: 8rpx;
}
.cm-item.me .cm-meta {
  flex-direction: row-reverse;
}
.cm-name {
  font-size: 24rpx;
  font-weight: 750;
  color: $pm-text;
}
.cm-time {
  font-size: 20rpx;
  color: $pm-muted;
  margin: 0 12rpx;
}
.cm-bubble {
  max-width: 100%;
  padding: 18rpx 24rpx;
  background: $pm-surface;
  border-radius: 6rpx 22rpx 22rpx 22rpx;
  box-shadow: $pm-shadow;
}
.cm-item.me .cm-bubble {
  background: $pm-primary;
  border-radius: 22rpx 6rpx 22rpx 22rpx;
}
.cm-text,
.cm-rich {
  font-size: 27rpx;
  color: $pm-text;
  line-height: 1.55;
  word-break: break-word;
}
.cm-item.me .cm-text,
.cm-item.me .cm-rich {
  color: #fff;
}
.cm-nil {
  padding: 60rpx 0;
  text-align: center;
  color: $pm-muted;
  font-size: 24rpx;
}
.cm-anchor {
  height: 8rpx;
}
.cm-composer-wrap {
  position: relative;
  flex-shrink: 0;
  border-top: 1px solid $pm-line;
  background: $pm-surface;
}
.cm-mention {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(100% + 8rpx);
  max-height: 420rpx;
  background: $pm-surface;
  border-radius: 20rpx;
  box-shadow: $pm-shadow-lg;
  overflow: hidden;
  z-index: 5;
}
.cm-mention-list {
  max-height: 420rpx;
}
.cm-mention-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1px solid $pm-line;
}
.cm-mention-item:last-child {
  border-bottom: none;
}
.cm-mention-name {
  font-size: 26rpx;
  font-weight: 700;
  color: $pm-text;
}
.cm-mention-dept {
  font-size: 22rpx;
  color: $pm-muted;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cm-mention-empty {
  padding: 28rpx;
  text-align: center;
  color: $pm-muted;
  font-size: 24rpx;
}
.cm-at-btn {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-bg-2;
  color: $pm-primary;
  font-size: 34rpx;
  font-weight: 800;
  margin-right: 12rpx;
  flex-shrink: 0;
}
.cm-composer {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + constant(safe-area-inset-bottom));
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}
.cm-input {
  flex: 1;
  height: 76rpx;
  padding: 0 28rpx;
  background: $pm-bg-2;
  border-radius: 999rpx;
  font-size: 26rpx;
}
.cm-send {
  margin-left: 16rpx;
  padding: 0 32rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 750;
  flex-shrink: 0;
}
.nil {
  padding: 36rpx 0;
  text-align: center;
  color: $pm-muted;
  font-size: 24rpx;
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

/* v-html 渲染的富文本图片全局样式，确保不撑出屏幕（v-html 内容不带 scoped 属性，须放全局） */
.rich-body img,
.cm-rich img,
.log-remark-body img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12rpx 0;
  border-radius: 12rpx;
}
.cm-rich p,
.log-remark-body p {
  margin: 0 0 8rpx;
  line-height: 1.6;
}
.cm-rich p:last-child,
.log-remark-body p:last-child {
  margin-bottom: 0;
}
/* 评论里的 @昵称 高亮 */
.cm-rich .cm-at {
  color: #0E5F3B;
  font-weight: 700;
}
.cm-item.me .cm-rich,
.cm-item.me .cm-rich p,
.cm-item.me .cm-rich .cm-at {
  color: #fff;
}
</style>
