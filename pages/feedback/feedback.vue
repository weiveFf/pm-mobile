<template>
  <view class="pm-page fb-page">
    <app-nav-bar title="反馈列表" :show-back="false" />

    <!-- 三个分类：居中占满 -->
    <view class="mode-wrap">
      <view class="mode-tabs">
        <view
          v-for="m in modes"
          :key="m.value"
          class="mode-tab"
          :class="{ active: mode === m.value }"
          @click="switchMode(m.value)"
        >
          {{ m.label }}
        </view>
      </view>
    </view>

    <!-- 结果条：总数 + 筛选入口（带已选条件角标） -->
    <view class="fb-result-bar">
      <text class="fb-count">共 <text class="num">{{ total }}</text> 条反馈</text>
      <view class="fb-filter-btn" @click="toggleFilter">
        <svg class="fb-filter-ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z" fill="currentColor" /></svg>
        <text class="fb-filter-txt">筛选</text>
        <view v-if="activeFilterCount" class="fb-filter-badge">{{ activeFilterCount }}</view>
      </view>
    </view>

    <!-- 内联筛选面板：默认收起，点击筛选展开（非抽屉，原地下滑） -->
    <view v-if="showFilter" class="fb-filter">
      <scroll-view class="fb-filter-scroll" scroll-y>
        <view class="fb-field">
          <text class="fb-label">流水号</text>
          <input v-model="query.serialNumber" class="fb-input" placeholder="流水号" confirm-type="search" @confirm="applyFilter" />
        </view>

        <view class="fb-row">
          <view class="fb-col">
            <text class="fb-label">异常类型</text>
            <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
              <view class="fb-input picker">{{ abnormalLabels[abnormalIndex] }}</view>
            </picker>
          </view>
          <view v-if="mode !== 'pending'" class="fb-col">
            <text class="fb-label">状态</text>
            <picker :range="statusLabels" :value="statusIndex" @change="onStatus">
              <view class="fb-input picker">{{ statusLabels[statusIndex] }}</view>
            </picker>
          </view>
          <view v-if="mode === 'pending'" class="fb-col">
            <text class="fb-label">问题类型</text>
            <picker v-if="problemOptions.length" :range="problemLabels" :value="problemIndex" @change="onProblem">
              <view class="fb-input picker">{{ problemLabels[problemIndex] }}</view>
            </picker>
            <view v-else class="fb-input picker disabled">先选异常类型</view>
          </view>
        </view>

        <view v-if="mode === 'mine'" class="fb-field">
          <text class="fb-label">反馈范围</text>
          <picker :range="mineScopeLabels" :value="mineScopeIndex" @change="onMineScope">
            <view class="fb-input picker">{{ mineScopeLabels[mineScopeIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="fb-field">
          <text class="fb-label">与我相关</text>
          <picker :range="relatedLabels" :value="relatedIndex" @change="onRelated">
            <view class="fb-input picker">{{ relatedLabels[relatedIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'pending'" class="fb-field">
          <text class="fb-label">期望完成</text>
          <view class="date-range">
            <picker mode="date" :value="dateBegin || today" @change="onDateBegin">
              <view class="dr-item" :class="{ empty: !dateBegin }">{{ dateBegin || '开始日期' }}</view>
            </picker>
            <text class="dr-sep">至</text>
            <picker mode="date" :value="dateEnd || today" @change="onDateEnd">
              <view class="dr-item" :class="{ empty: !dateEnd }">{{ dateEnd || '结束日期' }}</view>
            </picker>
            <text v-if="dateBegin || dateEnd" class="dr-clear" @click="clearDates">清除</text>
          </view>
        </view>

        <view v-if="mode !== 'pending'" class="fb-field">
          <text class="fb-label">问题类型</text>
          <picker v-if="problemOptions.length" :range="problemLabels" :value="problemIndex" @change="onProblem">
            <view class="fb-input picker">{{ problemLabels[problemIndex] }}</view>
          </picker>
          <view v-else class="fb-input picker disabled">先选异常类型</view>
        </view>

        <view class="fb-field">
          <text class="fb-label">紧急程度</text>
          <picker :range="urgencyLabels" :value="urgencyIndex" @change="onUrgency">
            <view class="fb-input picker">{{ urgencyLabels[urgencyIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode !== 'pending'" class="fb-field">
          <text class="fb-label">曾经状态</text>
          <picker :range="historyLabels" :value="historyIndex" @change="onHistory">
            <view class="fb-input picker">{{ historyLabels[historyIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="fb-field">
          <text class="fb-label">处理部门</text>
          <picker :range="deptLabels" :value="deptIndex" @change="onDept">
            <view class="fb-input picker">{{ deptLabels[deptIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="fb-field">
          <text class="fb-label">处理人</text>
          <picker v-if="canPickHandler" :range="handlerLabels" :value="handlerIndex" @change="onHandler">
            <view class="fb-input picker">{{ handlerLabels[handlerIndex] }}</view>
          </picker>
          <view v-else class="fb-input picker disabled">先选处理部门</view>
        </view>

        <view v-if="mode !== 'pending'" class="fb-field">
          <text class="fb-label">期望完成</text>
          <view class="date-range">
            <picker mode="date" :value="dateBegin || today" @change="onDateBegin">
              <view class="dr-item" :class="{ empty: !dateBegin }">{{ dateBegin || '开始日期' }}</view>
            </picker>
            <text class="dr-sep">至</text>
            <picker mode="date" :value="dateEnd || today" @change="onDateEnd">
              <view class="dr-item" :class="{ empty: !dateEnd }">{{ dateEnd || '结束日期' }}</view>
            </picker>
            <text v-if="dateBegin || dateEnd" class="dr-clear" @click="clearDates">清除</text>
          </view>
        </view>
      </scroll-view>

      <view class="fb-filter-foot">
        <button class="fb-reset" @click="reset">重置</button>
        <button class="fb-apply" @click="applyFilter">确定</button>
      </view>
    </view>

    <!-- 唯一滚动区域：页面固定，仅列表滚动 -->
    <view
      ref="listRef"
      class="fb-list"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @touchcancel="touchEnd"
    >
      <view class="pr" :class="{ anim: status !== 'pulling' }" :style="{ height: pullY + 'px' }">
        <view class="pr-box" :style="{ opacity: pullY > 0 ? 1 : 0, transform: 'scale(' + (0.8 + progress * 0.3) + ')' }">
          <view class="pr-spin" :class="{ on: status === 'refreshing' }">
            <view class="pr-ring" />
          </view>
          <text class="pr-txt" :class="{ ok: status === 'done' }">{{ text }}</text>
        </view>
      </view>

      <feedback-card
        v-for="row in list"
        :key="row.id"
        :serial="row.serial"
        :status-label="row.statusLabel"
        :status-tone="row.statusTone"
        :abnormal-type="row.abnormalType"
        :problem-type="row.problemType"
        :urgency-label="row.urgencyLabel"
        :urgency-tone="row.urgencyTone"
        :customer="row.customer"
        :product-name="row.productName"
        :saler-name="row.salerName"
        :demand-finish="row.demandFinish"
        :handler="row.handler"
        :dept-name="row.deptName"
        :creator-name="row.creatorName"
        :create-time="row.createTime"
        :responded-time="row.respondedTime"
        :close-time="row.closeTime"
        :reassign-count="row.reassignCount"
        :mentioned-me="row.mentionedMe"
        :overdue-days="row.overdueDays"
        :actions="row.actions"
        :show-creator-subtitle="true"
        :show-saler-in-meta="false"
        @click="openDetail(row.id)"
        @action="(k) => onAction(k, row)"
      />
      <view v-if="!loading && !list.length" class="pm-empty">{{ emptyText }}</view>

      <!-- 显式加载更多按钮 + 触底兜底 -->
      <view class="fb-loadmore">
        <button
          v-if="!finished && list.length"
          class="fb-loadmore-btn"
          :disabled="loading"
          @click="loadMore"
        >{{ loading ? '加载中…' : '加载更多' }}</button>
        <text v-else-if="finished && list.length" class="fb-loadmore-end">— 已经看完啦 —</text>
      </view>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getUserId, getUserName, getAccount, setAccount } from '@/utils/auth.js'
import { fetchUserInfo } from '@/api/login.js'
import { getProductFeedbackPage, markProcessResponded } from '@/api/after-sales.js'
import { listDept, listUser } from '@/api/system.js'
import { abnormalTypes, abnormalToProblems, urgencyLevels } from '@/constants/afterSales.js'
import {
  FEEDBACK_STATUS_FILTER_OPTIONS,
  FEEDBACK_HISTORY_STATUS_FILTER_OPTIONS,
  WORKFLOW_API_FILTER_STATUSES,
  WORKFLOW_FILTER_CLEAR_IS_CLOSE
} from '@/constants/feedbackWorkflow.js'
import {
  resolveFeedbackWorkflowDisplay,
  formatHandlerPair,
  canRespondFeedbackRow
} from '@/utils/feedbackWorkflow.js'
import { extractArray, normalizeDeptList, normalizeUserList } from '@/utils/apiResponse.js'
import { getUrgencyLabel, getUrgencyTone, formatDateOnly } from '@/utils/urgencyDisplay.js'
import {
  getRespondedTimeText,
  formatDateTimeMinute,
  demandFinishRangeBeginApi,
  demandFinishRangeEndApi
} from '@/utils/feedbackListRowHelpers.js'
import { usePullRefresh } from '@/composables/usePullRefresh.js'

const modes = [
  { label: '待处理', value: 'pending' },
  { label: '我的反馈', value: 'mine' },
  { label: '全部反馈', value: 'list' }
]
const mode = ref('pending')
const showFilter = ref(false)
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
const listRef = ref(null)

const emptyTextMap = {
  pending: '暂无待处理事项',
  mine: '暂无我的反馈',
  list: '暂无反馈'
}
const emptyText = computed(() => emptyTextMap[mode.value] || '暂无数据')

const query = reactive({
  serialNumber: '',
  abnormalType: '',
  problemType: '',
  urgencyLevel: '',
  workflowStatus: undefined,
  isClose: undefined,
  respondedOverdueOnly: false,
  processOverdueOnly: false,
  mineScope: 'all',
  relatedToMe: false,
  deptId: undefined,
  theFirstHandlerId: undefined
})

/* —— 异常类型 / 问题类型（问题类型联动异常类型，与 PC 一致） —— */
const abnormalLabels = computed(() => ['全部'].concat(abnormalTypes.map((a) => a.label)))
const abnormalIndex = ref(0)
const problemOptions = computed(() => (query.abnormalType ? abnormalToProblems[query.abnormalType] || [] : []))
const problemLabels = computed(() => ['全部'].concat(problemOptions.value.map((p) => p.label)))
const problemIndex = ref(0)

/* —— 紧急程度 —— */
const urgencyLabels = computed(() => ['全部'].concat(urgencyLevels.map((u) => u.label)))
const urgencyIndex = ref(0)

/* —— 状态 / 曾经状态 —— */
const statusLabels = computed(() => FEEDBACK_STATUS_FILTER_OPTIONS.map((s) => s.label))
const statusIndex = ref(0)
const historyLabels = FEEDBACK_HISTORY_STATUS_FILTER_OPTIONS.map((h) => h.label)
const historyIndex = ref(0)

/* —— 反馈范围 / 与我相关 —— */
const mineScopeLabels = ['全部显示', '@我的', '我创建的']
const mineScopeIndex = ref(0)
const relatedLabels = ['不限', '与我相关']
const relatedIndex = ref(0)

/* —— 期望完成时间 —— */
const dateBegin = ref('')
const dateEnd = ref('')
const today = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
})

/* —— 处理部门 / 处理人（仅全部反馈） —— */
const deptFlat = ref([])
const deptsLoaded = ref(false)
const deptLabels = computed(() => ['全部'].concat(deptFlat.value.map((d) => d.deptName || '')))
const deptIndex = ref(0)
const handlerUsers = ref([])
const handlerLabels = computed(() => ['全部'].concat(handlerUsers.value.map((u) => u.nickName || u.userName || '')))
const handlerIndex = ref(0)
const canPickHandler = computed(() => deptIndex.value > 0 && handlerLabels.value.length > 1)

/** 筛选入口角标：已选的额外检索条件数量 */
const activeFilterCount = computed(() => {
  let n = 0
  if (query.serialNumber) n++
  if (query.abnormalType) n++
  if (query.problemType) n++
  if (query.urgencyLevel) n++
  if (query.workflowStatus !== undefined) n++
  if (query.isClose !== undefined) n++
  if (query.respondedOverdueOnly || query.processOverdueOnly) n++
  if (query.mineScope !== 'all') n++
  if (query.relatedToMe) n++
  if (query.deptId !== undefined) n++
  if (query.theFirstHandlerId !== undefined) n++
  if (dateBegin.value || dateEnd.value) n++
  return n
})

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  query.abnormalType = abnormalIndex.value === 0 ? '' : abnormalTypes[abnormalIndex.value - 1].value
  query.problemType = ''
  problemIndex.value = 0
}
function onProblem(e) {
  problemIndex.value = Number(e.detail.value)
  query.problemType = problemIndex.value === 0 ? '' : problemOptions.value[problemIndex.value - 1].value
}
function onUrgency(e) {
  urgencyIndex.value = Number(e.detail.value)
  query.urgencyLevel = urgencyIndex.value === 0 ? '' : urgencyLevels[urgencyIndex.value - 1].value
}
function onStatus(e) {
  statusIndex.value = Number(e.detail.value)
  applyStatusFilter()
}
function onHistory(e) {
  historyIndex.value = Number(e.detail.value)
  const v = FEEDBACK_HISTORY_STATUS_FILTER_OPTIONS[historyIndex.value].value
  query.respondedOverdueOnly = v === 'responded_overdue' || v === 'both_overdue'
  query.processOverdueOnly = v === 'process_overdue' || v === 'both_overdue'
}
function onMineScope(e) {
  mineScopeIndex.value = Number(e.detail.value)
  query.mineScope = ['all', 'mentioned', 'created'][mineScopeIndex.value]
}
function onRelated(e) {
  relatedIndex.value = Number(e.detail.value)
  query.relatedToMe = relatedIndex.value === 1
}
function onDateBegin(e) {
  dateBegin.value = e.detail.value
}
function onDateEnd(e) {
  dateEnd.value = e.detail.value
}
function clearDates() {
  dateBegin.value = ''
  dateEnd.value = ''
}

/** 状态筛选 -> isClose / workflowStatus，口径与 PC 端 useFeedbackStatusFilter 一致 */
function applyStatusFilter() {
  const opt = FEEDBACK_STATUS_FILTER_OPTIONS[statusIndex.value]
  const v = opt ? opt.value : 'any'
  query.workflowStatus = undefined
  query.isClose = undefined
  if (v === 'any') return
  if (v === 'all') {
    query.isClose = false
    return
  }
  if (v === 'closed') {
    query.isClose = true
    return
  }
  if (WORKFLOW_API_FILTER_STATUSES.has(v)) {
    query.isClose = WORKFLOW_FILTER_CLEAR_IS_CLOSE.has(v) ? undefined : false
    query.workflowStatus = v
  }
}

async function loadDepts() {
  if (deptsLoaded.value) return
  try {
    const res = await listDept({ queryDeptAllName: true })
    deptFlat.value = normalizeDeptList(res)
    deptsLoaded.value = true
  } catch (e) {
    /* 部门列表拉取失败不阻塞筛选 */
  }
}

function toggleFilter() {
  showFilter.value = !showFilter.value
  if (showFilter.value && mode.value === 'list') loadDepts()
}

function onDept(e) {
  deptIndex.value = Number(e.detail.value)
  const d = deptIndex.value > 0 ? deptFlat.value[deptIndex.value - 1] : null
  query.deptId = d ? d.deptId : undefined
  query.theFirstHandlerId = undefined
  handlerIndex.value = 0
  handlerUsers.value = []
  if (d) loadHandlers(d.deptId)
}

async function loadHandlers(deptId) {
  try {
    const res = await listUser({ deptId, pageNum: 1, pageSize: 999 })
    handlerUsers.value = normalizeUserList(res)
  } catch (e) {
    handlerUsers.value = []
  }
}

function onHandler(e) {
  handlerIndex.value = Number(e.detail.value)
  const u = handlerIndex.value > 0 ? handlerUsers.value[handlerIndex.value - 1] : null
  query.theFirstHandlerId = u ? u.userId : undefined
}

function mapRow(item) {
  const fb = item.feedback || item
  const project = item.project || {}
  const display = resolveFeedbackWorkflowDisplay(item)
  const overdue = !!display.overdueType
  const uid = String(getUserId())

  const firstId = String(fb.theFirstHandlerId || fb.TheFirstHandlerId || '')
  const ivId = String(fb.interventionPersonnelId || fb.InterventionPersonnelId || '')
  const canOperate = (firstId && firstId === uid) || (ivId && ivId === uid)

  const actions = []
  if (canOperate && canRespondFeedbackRow(item, uid)) actions.push({ key: 'respond', label: '响应' })
  if (canOperate && !fb.isClose && !fb.isWithdrawn) actions.push({ key: 'process', label: '处理' })

  return {
    id: fb.id,
    serial: String(fb.serialNumber || fb.id || '').replace(/^#/, ''),
    statusLabel: display.label,
    statusTone: overdue ? 'danger' : display.status === 'pending_response' ? 'warn' : '',
    abnormalType: fb.abnormalType,
    problemType: fb.problemType,
    urgencyLabel: getUrgencyLabel(fb.urgencyLevel),
    urgencyTone: getUrgencyTone(fb.urgencyLevel),
    customer: project.fshortname || project.FSHORTNAME || fb.customerName || fb.fshortname || '',
    productName:
      project.materialName ||
      project.MaterialName ||
      (fb.afterSalesExt && fb.afterSalesExt.productName) ||
      (fb.AfterSalesExt && fb.AfterSalesExt.ProductName) ||
      '',
    salerName: project.fSalerName || project.FSALERNAME || '',
    handler: formatHandlerPair(fb),
    deptName: fb.deptName || fb.DeptName || '',
    creatorName: fb.createByNickName || fb.CreateByNickName || '',
    createTime: formatDateTimeMinute(fb.create_time || fb.createTime || fb.Create_time),
    respondedTime: getRespondedTimeText(item.processList || item.ProcessList),
    closeTime: formatDateTimeMinute(fb.closeTime || fb.CloseTime),
    reassignCount: Number(fb.deptReassignCount || fb.DeptReassignCount || 0),
    mentionedMe: !!item.isMentionedMe,
    demandFinish: formatDateOnly(fb.demandFinishTime),
    overdueDays: item.overdueDays || 0,
    actions
  }
}

function buildParams() {
  const uid = getUserId()
  const account = getAccount() || getUserName()
  const p = {
    pageNum: pageNum.value,
    pageSize,
    currentUserId: uid || undefined,
    currentUserName: account || undefined,
    currentUserNickName: getUserName() || undefined,
    serialNumber: query.serialNumber || undefined,
    abnormalType: query.abnormalType || undefined,
    problemType: query.problemType || undefined,
    urgencyLevel: query.urgencyLevel || undefined,
    workflowStatus: query.workflowStatus,
    isClose: query.isClose,
    respondedOverdueOnly: query.respondedOverdueOnly || undefined,
    processOverdueOnly: query.processOverdueOnly || undefined
  }
  if (dateBegin.value) p.demandFinishTimeBegin = demandFinishRangeBeginApi(dateBegin.value)
  if (dateEnd.value) p.demandFinishTimeEnd = demandFinishRangeEndApi(dateEnd.value)

  if (mode.value === 'pending') {
    p.pendingOnly = true
    p.handlerUserId = uid
    p.includeCreatorDelayPending = true
    p.workflowStatus = undefined
    p.isClose = undefined
  } else if (mode.value === 'mine') {
    p.mineScope = query.mineScope
  } else {
    if (query.relatedToMe) p.relatedToMe = true
    if (query.deptId) p.deptId = query.deptId
    if (query.theFirstHandlerId) p.theFirstHandlerId = query.theFirstHandlerId
  }
  return p
}

async function fetchList(reset) {
  if (loading.value) return
  if (!ensureLoggedIn()) return
  if (reset) {
    pageNum.value = 1
    finished.value = false
    list.value = []
  }
  if (finished.value) return
  loading.value = true
  try {
    const res = await getProductFeedbackPage(buildParams())
    const data = res.data || {}
    const rows = extractArray(res).map(mapRow)
    total.value = data.totalNum || data.total || 0
    list.value = reset ? rows : list.value.concat(rows)
    if (list.value.length >= total.value || rows.length < pageSize) finished.value = true
    else pageNum.value += 1
  } catch (e) {
    uni.showToast({ title: (e && (e.message || e.errMsg || String(e))) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function switchMode(v) {
  if (mode.value === v) return
  mode.value = v
  if (v === 'list' && showFilter.value) loadDepts()
  fetchList(true)
}

function applyFilter() {
  applyStatusFilter()
  showFilter.value = false
  fetchList(true)
}

function reset() {
  query.serialNumber = ''
  query.abnormalType = ''
  query.problemType = ''
  query.urgencyLevel = ''
  query.mineScope = 'all'
  query.relatedToMe = false
  query.deptId = undefined
  query.theFirstHandlerId = undefined
  query.respondedOverdueOnly = false
  query.processOverdueOnly = false
  abnormalIndex.value = 0
  problemIndex.value = 0
  urgencyIndex.value = 0
  statusIndex.value = 0
  historyIndex.value = 0
  mineScopeIndex.value = 0
  relatedIndex.value = 0
  deptIndex.value = 0
  handlerIndex.value = 0
  handlerUsers.value = []
  clearDates()
  applyStatusFilter()
  fetchList(true)
}

function openDetail(id) {
  uni.navigateTo({ url: '/pages/feedback-detail/feedback-detail?id=' + id })
}

async function onAction(key, row) {
  if (key === 'respond') {
    try {
      await markProcessResponded(row.id)
      uni.showToast({ title: '已响应', icon: 'success' })
      fetchList(true)
    } catch (e) {
      uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
    }
    return
  }
  if (key === 'process') {
    uni.navigateTo({ url: '/pages/process/process?id=' + row.id })
  }
}

async function ensureAccount() {
  if (getAccount()) return
  try {
    const res = await fetchUserInfo()
    const user = res.data && res.data.user
    if (user && user.userName) setAccount(user.userName)
  } catch (e) {
    /* 拉取失败则退回昵称，不阻塞列表 */
  }
}

applyStatusFilter()

onShow(async () => {
  if (!ensureLoggedIn()) return
  await ensureAccount()
  fetchList(true)
})

onLoad(async () => {
  if (!ensureLoggedIn()) return
  await ensureAccount()
  fetchList(true)
})

const { pullY, status, text, progress, touchStart, touchMove, touchEnd } = usePullRefresh(
  async () => {
    await fetchList(true)
  },
  {
    getScrollTop: () => {
      // #ifdef H5
      return listRef.value ? listRef.value.scrollTop || 0 : 0
      // #endif
      // #ifndef H5
      return 0
      // #endif
    },
    threshold: 88,
    deadZone: 18,
    damping: 0.5
  }
)

/* 分页为手动模式：默认加载 20 条，仅「加载更多」按钮触发下一页（不做触底自动加载） */
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* 页面固定：筛选/结果栏不滚动，仅列表滚动 */
.fb-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 兜底：防止 --window-bottom 未定义导致 calc 失效 */
  height: calc(100vh - var(--window-bottom, 0px));
  overflow: hidden;
  box-sizing: border-box;
  overscroll-behavior-y: none;
}

.mode-wrap {
  padding: 12rpx 24rpx 0;
  flex-shrink: 0;
}
.mode-tabs {
  display: flex;
  flex-direction: row;
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

/* 结果条：总数 + 筛选入口 */
.fb-result-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 28rpx 12rpx;
  flex-shrink: 0;
}
.fb-count {
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 600;
}
.fb-count .num {
  font-size: 30rpx;
  color: $pm-primary-deep;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.fb-filter-btn {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 60rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: $pm-surface;
  color: $pm-primary;
  border: 1px solid $pm-line;
  box-shadow: $pm-shadow;
}
.fb-filter-ico {
  width: 28rpx;
  height: 28rpx;
  margin-right: 8rpx;
}
.fb-filter-txt {
  font-size: 26rpx;
  font-weight: 800;
}
.fb-filter-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 6rpx;
  border-radius: 999rpx;
  background: $pm-copper;
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
  text-align: center;
  box-sizing: border-box;
}

/* 内联筛选面板：原地下滑，不占列表空间时收起 */
.fb-filter {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 62vh;
  background: $pm-bg;
  border-top: 1px solid $pm-line;
  border-bottom: 1px solid $pm-line;
  box-sizing: border-box;
}
.fb-filter-scroll {
  flex: 1;
  min-height: 0;
  padding: 8rpx 24rpx 16rpx;
  box-sizing: border-box;
}
.fb-field {
  margin-top: 20rpx;
}
.fb-row {
  display: flex;
  flex-direction: row;
  margin-top: 20rpx;
}
.fb-col {
  flex: 1;
  min-width: 0;
}
.fb-col:first-child {
  margin-right: 16rpx;
}
.fb-label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.fb-input {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 24rpx;
  background: $pm-bg-2;
  border-radius: 24rpx;
  border: 1px solid transparent;
  box-sizing: border-box;
  font-size: 26rpx;
  color: $pm-text;
}
.fb-input.picker {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fb-input.picker.disabled {
  color: $pm-muted;
  background: $pm-bg-2;
}

/* 期望完成时间 */
.date-range {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
}
.dr-item {
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 20rpx;
  border-radius: 24rpx;
  background: $pm-bg-2;
  font-size: 24rpx;
  color: $pm-text;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
}
.dr-item.empty {
  color: $pm-muted;
}
.dr-sep {
  padding: 0 12rpx;
  font-size: 22rpx;
  color: $pm-muted;
  flex-shrink: 0;
}
.dr-clear {
  flex-shrink: 0;
  padding: 0 0 0 12rpx;
  font-size: 22rpx;
  color: $pm-primary;
  font-weight: 700;
}

.fb-filter-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 24rpx calc(16rpx + var(--window-bottom, 0px));
  border-top: 1px solid $pm-line;
  background: $pm-surface;
  flex-shrink: 0;
}
.fb-reset {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 999rpx;
  background: $pm-bg-2;
  color: $pm-text-secondary;
  font-size: 28rpx;
  font-weight: 800;
  border: 1px solid $pm-line;
}
.fb-apply {
  flex: 2;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 24rpx rgba(14, 95, 59, 0.3);
}

/* —— 列表：唯一滚动区域 —— */
.fb-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  display: flex;
  flex-direction: column;
  padding: 8rpx 24rpx 0;
}
.fb-list > * {
  flex-shrink: 0;
}
.fb-list > .pm-empty {
  flex: 1 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 加载更多 */
.fb-loadmore {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0 12rpx;
}
.fb-loadmore-btn {
  min-width: 320rpx;
  height: 76rpx;
  line-height: 76rpx;
  padding: 0 40rpx;
  border-radius: 999rpx;
  background: $pm-surface;
  color: $pm-primary;
  font-size: 26rpx;
  font-weight: 800;
  border: 1px solid $pm-primary;
  box-shadow: $pm-shadow;
}
.fb-loadmore-btn[disabled] {
  opacity: 0.55;
  color: $pm-muted;
  border-color: $pm-line;
  box-shadow: none;
}
.fb-loadmore-end {
  font-size: 22rpx;
  color: $pm-muted;
  font-weight: 600;
}

/* —— 自定义下拉刷新 —— */
.pr {
  height: 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.pr.anim {
  transition: height 0.25s ease;
}
.pr-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-bottom: 16rpx;
}
.pr-spin {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pr-ring {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 4rpx solid $pm-primary-soft;
  border-top-color: $pm-primary;
  box-sizing: border-box;
}
.pr-spin.on .pr-ring {
  animation: pr-spin 0.7s linear infinite;
}
.pr-txt {
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 700;
}
.pr-txt.ok {
  color: $pm-primary-deep;
}
@keyframes pr-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
