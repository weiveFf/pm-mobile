<template>
  <view class="pm-page fb-page">
    <app-nav-bar title="反馈列表" :show-back="false" />

    <!-- 三个分类：居中占满，与工作台一致 -->
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

    <!-- 检索条件：与 PC 端反馈列表对齐，低频条件收进「更多」 -->
    <view class="pm-filter">
      <view class="pm-filter-row">
        <text class="pm-filter-label">流水号</text>
        <input v-model="query.serialNumber" class="pm-filter-input" placeholder="流水号" confirm-type="search" @confirm="search" />
      </view>

      <!-- 默认只显示两行：流水号 + 异常类型/状态或问题类型并排，其余条件收进「更多」 -->
      <view class="pm-filter-row half">
        <view class="pm-filter-col">
          <text class="pm-filter-label">异常类型</text>
          <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
            <view class="pm-filter-input picker">{{ abnormalLabels[abnormalIndex] }}</view>
          </picker>
        </view>
        <view v-if="mode !== 'pending'" class="pm-filter-col">
          <text class="pm-filter-label">状态</text>
          <picker :range="statusLabels" :value="statusIndex" @change="onStatus">
            <view class="pm-filter-input picker">{{ statusLabels[statusIndex] }}</view>
          </picker>
        </view>
        <view v-if="mode === 'pending'" class="pm-filter-col">
          <text class="pm-filter-label">问题类型</text>
          <picker
            v-if="problemOptions.length"
            :range="problemLabels"
            :value="problemIndex"
            @change="onProblem"
          >
            <view class="pm-filter-input picker">{{ problemLabels[problemIndex] }}</view>
          </picker>
          <view v-else class="pm-filter-input picker disabled">先选异常类型</view>
        </view>
      </view>

      <!-- 更多筛选：默认收起，点击后查看全部条件 -->
      <view v-if="expanded">
        <view v-if="mode === 'mine'" class="pm-filter-row">
          <text class="pm-filter-label">反馈范围</text>
          <picker :range="mineScopeLabels" :value="mineScopeIndex" @change="onMineScope">
            <view class="pm-filter-input picker">{{ mineScopeLabels[mineScopeIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="pm-filter-row">
          <text class="pm-filter-label">与我相关</text>
          <picker :range="relatedLabels" :value="relatedIndex" @change="onRelated">
            <view class="pm-filter-input picker">{{ relatedLabels[relatedIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'pending'" class="pm-filter-row">
          <text class="pm-filter-label">期望完成</text>
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

        <view v-if="mode !== 'pending'" class="pm-filter-row">
          <text class="pm-filter-label">问题类型</text>
          <picker
            v-if="problemOptions.length"
            :range="problemLabels"
            :value="problemIndex"
            @change="onProblem"
          >
            <view class="pm-filter-input picker">{{ problemLabels[problemIndex] }}</view>
          </picker>
          <view v-else class="pm-filter-input picker disabled">先选异常类型</view>
        </view>

        <view class="pm-filter-row">
          <text class="pm-filter-label">紧急程度</text>
          <picker :range="urgencyLabels" :value="urgencyIndex" @change="onUrgency">
            <view class="pm-filter-input picker">{{ urgencyLabels[urgencyIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode !== 'pending'" class="pm-filter-row">
          <text class="pm-filter-label">曾经状态</text>
          <picker :range="historyLabels" :value="historyIndex" @change="onHistory">
            <view class="pm-filter-input picker">{{ historyLabels[historyIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="pm-filter-row">
          <text class="pm-filter-label">处理部门</text>
          <picker :range="deptLabels" :value="deptIndex" @change="onDept">
            <view class="pm-filter-input picker">{{ deptLabels[deptIndex] }}</view>
          </picker>
        </view>

        <view v-if="mode === 'list'" class="pm-filter-row">
          <text class="pm-filter-label">处理人</text>
          <picker v-if="canPickHandler" :range="handlerLabels" :value="handlerIndex" @change="onHandler">
            <view class="pm-filter-input picker">{{ handlerLabels[handlerIndex] }}</view>
          </picker>
          <view v-else class="pm-filter-input picker disabled">先选处理部门</view>
        </view>

        <view v-if="mode !== 'pending'" class="pm-filter-row">
          <text class="pm-filter-label">期望完成</text>
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
      </view>

      <view class="pm-filter-actions">
        <button size="mini" @click="toggleMore">{{ expanded ? '收起' : '更多' }}</button>
        <button size="mini" @click="reset">重置</button>
        <button size="mini" type="primary" class="search-btn" @click="search">搜索</button>
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
      @scroll="onListScroll"
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
      <view class="pm-load-more">{{ loading ? '加载中' : finished ? '已经看完啦' : '' }}</view>
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
const expanded = ref(false)
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
/** 处理人依赖处理部门，部门未选或部门下无人员时不展开选择器 */
const canPickHandler = computed(() => deptIndex.value > 0 && handlerLabels.value.length > 1)

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  query.abnormalType = abnormalIndex.value === 0 ? '' : abnormalTypes[abnormalIndex.value - 1].value
  // 异常类型变更后，问题类型选项与已选值都要重置
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
  const map = ['all', 'mentioned', 'created']
  query.mineScope = map[mineScopeIndex.value]
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

function flattenDepts(nodes, out) {
  ;(nodes || []).forEach((n) => {
    const name = n.deptName || ''
    if (name && name.indexOf('研成工业') < 0 && name.indexOf('待设置部门') < 0) out.push(n)
    if (n.children && n.children.length) flattenDepts(n.children, out)
  })
}

async function loadDepts() {
  if (deptsLoaded.value) return
  try {
    const res = await listDept({ queryDeptAllName: true })
    const data = res.data || []
    if (data[0] && data[0].children) {
      const out = []
      flattenDepts(data, out)
      deptFlat.value = out
    } else {
      deptFlat.value = data.filter((n) => {
        const name = n.deptName || ''
        return name.indexOf('研成工业') < 0 && name.indexOf('待设置部门') < 0
      })
    }
    deptsLoaded.value = true
  } catch (e) {
    /* 部门列表拉取失败不阻塞筛选 */
  }
}

function toggleMore() {
  expanded.value = !expanded.value
  if (expanded.value && mode.value === 'list') loadDepts()
}

function onDept(e) {
  deptIndex.value = Number(e.detail.value)
  const d = deptIndex.value > 0 ? deptFlat.value[deptIndex.value - 1] : null
  query.deptId = d ? d.deptId : undefined
  // 处理人依赖部门，部门变更后清空（与 PC 一致）
  query.theFirstHandlerId = undefined
  handlerIndex.value = 0
  handlerUsers.value = []
  if (d) loadHandlers(d.deptId)
}

async function loadHandlers(deptId) {
  try {
    const res = await listUser({ deptId, pageNum: 1, pageSize: 999 })
    const data = res.data || {}
    handlerUsers.value = data.result || data.rows || []
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

  // 操作权限：仅当自己是处理人或负责人才显示响应/处理
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
    const rows = (data.result || data.rows || []).map(mapRow)
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
  if (v === 'list' && expanded.value) loadDepts()
  fetchList(true)
}

function search() {
  applyStatusFilter()
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
  expanded.value = false
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

/**
 * 登录账号补偿：历史会话里只存了昵称，而「我创建的」后端是按账号匹配 Create_by，
 * 首次发现缺失时补拉一次用户信息并落盘。
 */
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
    // 列表是内层滚动容器，下拉刷新以 listRef.scrollTop 为准
    getScrollTop: () => {
      // #ifdef H5
      return listRef.value ? listRef.value.scrollTop || 0 : 0
      // #endif
      // #ifndef H5
      return 0
      // #endif
    },
    // 卡片较高，滚动时容易误触下拉：加大阈值与死区
    threshold: 88,
    deadZone: 18,
    damping: 0.5
  }
)

function onListScroll(e) {
  // #ifdef H5
  const el = e.target
  if (!el) return
  const bottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (!finished.value && !loading.value && bottom < 80) {
    fetchList(false)
  }
  // #endif
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* 页面固定：筛选框不滚动，仅列表滚动 */
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

/* 筛选区固定不滚动；条件多时自身可滚动，避免把列表压没 */
.pm-filter {
  flex-shrink: 0;
  max-height: 58vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.search-btn {
  background: $pm-primary !important;
  color: #fff !important;
}
.picker {
  line-height: 76rpx;
}
.picker.disabled {
  color: $pm-muted;
  background: $pm-bg-2;
}

/* 期望完成时间：开始日期 至 结束日期 */
.date-range {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
}
.dr-item {
  height: 76rpx;
  line-height: 76rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: $pm-bg;
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

/* —— 列表：唯一滚动区域 —— */
.fb-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  display: flex;
  flex-direction: column;
  padding: 16rpx 24rpx 0;
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
