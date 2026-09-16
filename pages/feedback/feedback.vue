<template>
  <view class="pm-page">
    <app-nav-bar title="反馈列表" :show-back="false" />

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

    <view class="pm-filter">
      <view class="pm-filter-row">
        <text class="pm-filter-label">流水号</text>
        <input v-model="query.serialNumber" class="pm-filter-input" placeholder="流水号" confirm-type="search" @confirm="search" />
      </view>
      <view class="pm-filter-row">
        <text class="pm-filter-label">异常类型</text>
        <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
          <view class="pm-filter-input picker">{{ abnormalLabels[abnormalIndex] }}</view>
        </picker>
      </view>
      <view v-if="mode !== 'pending'" class="pm-filter-row">
        <text class="pm-filter-label">状态</text>
        <picker :range="statusLabels" :value="statusIndex" @change="onStatus">
          <view class="pm-filter-input picker">{{ statusLabels[statusIndex] }}</view>
        </picker>
      </view>
      <view v-if="mode === 'mine'" class="pm-filter-row">
        <text class="pm-filter-label">反馈范围</text>
        <picker :range="mineScopeLabels" :value="mineScopeIndex" @change="onMineScope">
          <view class="pm-filter-input picker">{{ mineScopeLabels[mineScopeIndex] }}</view>
        </picker>
      </view>
      <view class="pm-filter-actions">
        <button size="mini" @click="reset">重置</button>
        <button size="mini" type="primary" class="search-btn" @click="search">搜索</button>
      </view>
    </view>

    <view class="pm-list">
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
        :demand-finish="row.demandFinish"
        :handler="row.handler"
        :actions="row.actions"
        @click="openDetail(row.id)"
        @action="(k) => onAction(k, row)"
      />
      <view v-if="!loading && !list.length" class="pm-empty">暂时没有反馈</view>
      <view class="pm-load-more">{{ loading ? '加载中' : finished ? '已经看完啦' : '' }}</view>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getUserId } from '@/utils/auth.js'
import { getProductFeedbackPage, markProcessResponded } from '@/api/after-sales.js'
import { abnormalTypes } from '@/constants/afterSales.js'
import { FEEDBACK_STATUS_FILTER_OPTIONS } from '@/constants/feedbackWorkflow.js'
import {
  resolveFeedbackWorkflowDisplay,
  formatHandlerPair,
  canRespondFeedbackRow
} from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, getUrgencyTone, formatDateOnly } from '@/utils/urgencyDisplay.js'

const modes = [
  { label: '待处理', value: 'pending' },
  { label: '我的', value: 'mine' },
  { label: '全部', value: 'list' }
]
const mode = ref('pending')
const list = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)

const query = reactive({
  serialNumber: '',
  abnormalType: '',
  problemType: '',
  workflowStatus: undefined,
  mineScope: 'all',
  relatedToMe: false,
  pendingOnly: false,
  handlerUserId: undefined,
  createBy: undefined,
  isClose: undefined
})

const abnormalLabels = computed(() => ['全部'].concat(abnormalTypes.map((a) => a.label)))
const abnormalIndex = ref(0)
const statusLabels = computed(() => FEEDBACK_STATUS_FILTER_OPTIONS.map((s) => s.label))
const statusIndex = ref(1)
const mineScopeLabels = ['全部显示', '@我的', '我创建的']
const mineScopeIndex = ref(0)

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  query.abnormalType = abnormalIndex.value === 0 ? '' : abnormalTypes[abnormalIndex.value - 1].value
}

function onStatus(e) {
  statusIndex.value = Number(e.detail.value)
  applyStatusFilter()
}

function onMineScope(e) {
  mineScopeIndex.value = Number(e.detail.value)
  const map = ['all', 'mentioned', 'created']
  query.mineScope = map[mineScopeIndex.value]
}

function applyStatusFilter() {
  const opt = FEEDBACK_STATUS_FILTER_OPTIONS[statusIndex.value]
  const v = opt ? opt.value : 'all'
  query.workflowStatus = undefined
  query.isClose = undefined
  if (v === 'any') {
    query.isClose = undefined
  } else if (v === 'all') {
    query.isClose = false
  } else if (v === 'closed') {
    query.isClose = true
  } else {
    query.workflowStatus = v
    if (v === 'completed' || v === 'withdrawn' || v === 'complaint_pending_audit' || v === 'complaint_rejected') {
      query.isClose = undefined
    } else {
      query.isClose = false
    }
  }
}

function mapRow(item) {
  const fb = item.feedback || item
  const display = resolveFeedbackWorkflowDisplay(item)
  const overdue = !!display.overdueType
  const actions = []
  if (canRespondFeedbackRow(item, getUserId())) {
    actions.push({ key: 'respond', label: '响应' })
  }
  if (!fb.isClose && !fb.isWithdrawn) {
    actions.push({ key: 'process', label: '处理' })
  }
  return {
    id: fb.id,
    serial: fb.serialNumber || fb.id,
    statusLabel: display.label,
    statusTone: overdue ? 'danger' : display.status === 'pending_response' ? 'warn' : '',
    abnormalType: fb.abnormalType,
    problemType: fb.problemType,
    urgencyLabel: getUrgencyLabel(fb.urgencyLevel),
    urgencyTone: getUrgencyTone(fb.urgencyLevel),
    customer: fb.customerName || fb.fshortname || '',
    demandFinish: formatDateOnly(fb.demandFinishTime),
    handler: formatHandlerPair(fb),
    actions
  }
}

function buildParams() {
  const uid = getUserId()
  const p = {
    pageNum: pageNum.value,
    pageSize,
    serialNumber: query.serialNumber || undefined,
    abnormalType: query.abnormalType || undefined,
    workflowStatus: query.workflowStatus,
    isClose: query.isClose
  }
  if (mode.value === 'pending') {
    p.pendingOnly = true
    p.handlerUserId = uid
    p.isClose = false
    p.workflowStatus = undefined
  } else if (mode.value === 'mine') {
    p.mineScope = query.mineScope
    p.createBy = uid
  } else {
    p.relatedToMe = query.relatedToMe || undefined
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
    uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function switchMode(v) {
  if (mode.value === v) return
  mode.value = v
  fetchList(true)
}

function search() {
  applyStatusFilter()
  fetchList(true)
}

function reset() {
  query.serialNumber = ''
  query.abnormalType = ''
  abnormalIndex.value = 0
  statusIndex.value = 1
  mineScopeIndex.value = 0
  query.mineScope = 'all'
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

applyStatusFilter()

onShow(() => {
  if (!ensureLoggedIn()) return
  fetchList(true)
})

onPullDownRefresh(() => fetchList(true))

onReachBottom(() => fetchList(false))
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.mode-wrap {
  padding: 12rpx 24rpx 0;
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
.search-btn {
  background: $pm-primary !important;
  color: #fff !important;
}
.picker {
  line-height: 76rpx;
}
.list-scroll {
  width: 100%;
}
</style>
