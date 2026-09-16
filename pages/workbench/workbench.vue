<template>
  <view class="pm-page">
    <app-nav-bar title="工作台" :show-back="false" right-text="统计" @right="goStats" />

    <!-- 问候栏(WB-01) -->
    <view class="gbar">
      <view class="gavatar">{{ avatarLetter }}</view>
      <view class="gtxt">
        <text class="gdate">{{ dateLine }}</text>
        <text class="ghello">{{ greeting }},{{ userName || '工友' }}</text>
      </view>
    </view>

    <!-- 渐变 Hero 卡(WB-01 · 森林绿 + 铜色光斑) -->
    <view class="hero-card">
      <view class="deco" />
      <view class="deco2" />
      <view class="hero-row">
        <view class="hero-info">
          <text class="hero-kicker">今日待办 · 待响应 {{ fmtNum(counts.pending) }}</text>
          <text class="hero-title">{{ total > 0 ? currentTypeLabel + ' 共 ' + total + ' 条' : '暂无待办,真棒' }}</text>
          <view class="hero-chips">
            <text class="hchip">进行中 {{ fmtNum(counts.current_projects) }}</text>
            <text class="hchip">待关闭 {{ fmtNum(counts.pending_close) }}</text>
            <text class="hchip copper">已关闭 {{ fmtNum(counts.closed) }}</text>
          </view>
        </view>
        <view class="ring" :style="{ background: ringBg }">
          <text>{{ ringPct }}%</text>
        </view>
      </view>
    </view>

    <!-- 快捷瓷贴(WB-01 · 森林协调系) -->
    <view class="quick">
      <view class="q pressable" @click="goTab('/pages/project/project')">
        <view class="sq s1">✚</view>
        <text class="qlb">提交反馈</text>
      </view>
      <view class="q pressable" @click="goTab('/pages/feedback/feedback')">
        <view class="sq g1">✉</view>
        <text class="qlb">反馈处理</text>
      </view>
      <view class="q pressable" @click="goStats">
        <view class="sq s3">◔</view>
        <text class="qlb">数据看板</text>
      </view>
      <view class="q pressable" @click="goTab('/pages/mine/mine')">
        <view class="sq s2">☺</view>
        <text class="qlb">个人中心</text>
      </view>
    </view>

    <!-- 分类计数 -->
    <scroll-view scroll-x class="seg-scroll" :show-scrollbar="false">
      <view class="seg">
        <view
          v-for="item in typeTabs"
          :key="item.key"
          class="seg-item pressable"
          :class="{ active: workbenchType === item.key }"
          @click="switchType(item.key)"
        >
          <text class="seg-num">{{ counts[item.key] != null ? counts[item.key] : '–' }}</text>
          <text class="seg-label">{{ item.label }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="toolbar">
      <text class="toolbar-title">{{ currentTypeLabel }}</text>
      <text v-if="workbenchType === 'pending_close'" class="toolbar-action" @click="onRemind">
        {{ reminding ? '…' : '提醒关闭' }}
      </text>
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
      <view v-if="!loading && !list.length" class="pm-empty">这一栏空空的</view>
      <view class="pm-load-more">{{ loading ? '加载中' : finished ? '已经看完啦' : '' }}</view>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getUserId, getUserName } from '@/utils/auth.js'
import {
  getWorkbenchFeedbackPage,
  getUserWorkloadStatistics,
  remindPendingCloseFeedback,
  markProcessResponded
} from '@/api/after-sales.js'
import { WORKBENCH_TYPES } from '@/constants/feedbackWorkflow.js'
import { resolveFeedbackWorkflowDisplay, formatHandlerPair, canRespondFeedbackRow } from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, formatDateOnly } from '@/utils/urgencyDisplay.js'

const typeTabs = WORKBENCH_TYPES
const workbenchType = ref('pending')
const currentTypeLabel = computed(() => {
  const hit = typeTabs.find((t) => t.key === workbenchType.value)
  return hit ? hit.label : '事项'
})
const list = ref([])
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const finished = ref(false)
const reminding = ref(false)
const userName = ref('')
const counts = reactive({
  pending: null,
  current_projects: null,
  pending_close: null,
  closed: null
})

const avatarLetter = computed(() => {
  const n = (userName.value || 'Y').trim()
  return n ? n.substring(0, 1).toUpperCase() : 'Y'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dateLine = computed(() => {
  const d = new Date()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  return '周' + weeks[d.getDay()] + ' · ' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
})

/** 完成率进度环:已关闭 / 全部 */
const ringPct = computed(() => {
  const c = counts
  const sum = num(c.pending) + num(c.current_projects) + num(c.pending_close) + num(c.closed)
  if (!sum) return 0
  return Math.round((num(c.closed) / sum) * 100)
})
const ringBg = computed(() => 'conic-gradient(#3D805E ' + ringPct.value + '%, #EDE9DF 0)')

function num(v) {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function fmtNum(v) {
  return v != null ? v : '–'
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
  if (display.status === 'pending_close') {
    actions.push({ key: 'close', label: '关闭' })
  }
  return {
    id: fb.id,
    serial: fb.serialNumber || fb.id,
    statusLabel: display.label,
    statusTone: overdue ? 'danger' : display.status === 'pending_response' ? 'warn' : '',
    abnormalType: fb.abnormalType,
    problemType: fb.problemType,
    urgencyLabel: getUrgencyLabel(fb.urgencyLevel),
    urgencyTone: fb.urgencyLevel === '0' ? 'copper' : '',
    customer: fb.customerName || fb.fshortname || '',
    demandFinish: formatDateOnly(fb.demandFinishTime),
    handler: formatHandlerPair(fb),
    actions,
    raw: item
  }
}

async function loadStats() {
  try {
    const uid = getUserId()
    const res = await getUserWorkloadStatistics({ userId: uid })
    const d = res.data || {}
    counts.pending = d.pendingCount != null ? d.pendingCount : d.pending
    counts.current_projects = d.currentProjectsCount != null ? d.currentProjectsCount : d.processing
    counts.pending_close = d.pendingCloseCount != null ? d.pendingCloseCount : d.pendingClose
    counts.closed = d.closedCount != null ? d.closedCount : d.closed
  } catch (e) {}
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
    const res = await getWorkbenchFeedbackPage({
      userId: getUserId(),
      workbenchType: workbenchType.value,
      pageNum: pageNum.value,
      pageSize
    })
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

function switchType(key) {
  if (workbenchType.value === key) return
  workbenchType.value = key
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
      uni.showToast({ title: (e && e.message) || '响应失败', icon: 'none' })
    }
    return
  }
  if (key === 'process') {
    uni.navigateTo({ url: '/pages/process/process?id=' + row.id })
    return
  }
  if (key === 'close') {
    uni.navigateTo({ url: '/pages/feedback-detail/feedback-detail?id=' + row.id })
  }
}

async function onRemind() {
  reminding.value = true
  try {
    const res = await remindPendingCloseFeedback()
    uni.showToast({ title: (res && res.msg) || '已发送提醒', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提醒失败', icon: 'none' })
  } finally {
    reminding.value = false
  }
}

function goTab(url) {
  uni.switchTab({ url })
}

function goStats() {
  uni.navigateTo({ url: '/pages/stats/stats' })
}

onShow(() => {
  if (!ensureLoggedIn()) return
  userName.value = getUserName()
  loadStats()
  fetchList(true)
})

onPullDownRefresh(() => {
  loadStats()
  fetchList(true)
})

onReachBottom(() => fetchList(false))
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* —— 问候栏 —— */
.gbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8rpx 32rpx 4rpx;
}
.gavatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4C9A6F, #0E5F3B);
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  text-align: center;
  line-height: 76rpx;
  margin-right: 20rpx;
  box-shadow: $pm-shadow;
  flex-shrink: 0;
}
.gtxt {
  flex: 1;
  min-width: 0;
}
.gdate {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  font-weight: 600;
}
.ghello {
  display: block;
  margin-top: 2rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.5rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* —— 渐变 Hero 卡 —— */
.hero-card {
  margin: 16rpx 24rpx 0;
  padding: 32rpx;
  background: $pm-grad-hero;
  border-radius: $pm-radius-lg;
  color: #fff;
  box-shadow: $pm-shadow-lg;
  position: relative;
  overflow: hidden;
}
.deco {
  position: absolute;
  right: -52rpx;
  top: -60rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.deco2 {
  position: absolute;
  right: 68rpx;
  bottom: -88rpx;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(216, 154, 110, 0.22);
}
.hero-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}
.hero-info {
  flex: 1;
  min-width: 0;
}
.hero-kicker {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  opacity: 0.85;
}
.hero-title {
  display: block;
  margin-top: 10rpx;
  font-size: 36rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}
.hero-chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 20rpx;
}
.hchip {
  font-size: 20rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  margin-right: 12rpx;
  margin-bottom: 8rpx;
}
.hchip.copper {
  background: rgba(216, 154, 110, 0.55);
}
.ring {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  margin-left: 16rpx;
}
.ring::before {
  content: '';
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  right: 12rpx;
  bottom: 12rpx;
  background: #fff;
  border-radius: 50%;
}
.ring text {
  position: relative;
  font-size: 26rpx;
  font-weight: 800;
  color: $pm-primary-deep;
}

/* —— 快捷瓷贴 —— */
.quick {
  display: flex;
  flex-direction: row;
  margin: 16rpx 16rpx 0;
}
.q {
  flex: 1;
  margin: 0 8rpx;
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 20rpx 4rpx 16rpx;
  text-align: center;
  box-shadow: $pm-shadow;
  border: 1px solid $pm-line;
}
.sq {
  width: 80rpx;
  height: 80rpx;
  border-radius: 26rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
}
.sq.g1 {
  background: $pm-grad-brand;
  box-shadow: 0 6px 12px -4px rgba(14, 95, 59, 0.4);
}
.sq.s1 {
  background: $pm-tile-info;
  box-shadow: 0 6px 12px -4px rgba(63, 108, 176, 0.35);
}
.sq.s2 {
  background: $pm-tile-amber;
  box-shadow: 0 6px 12px -4px rgba(194, 135, 42, 0.35);
}
.sq.s3 {
  background: $pm-tile-copper;
  box-shadow: 0 6px 12px -4px rgba(184, 116, 74, 0.4);
}
.qlb {
  display: block;
  margin-top: 12rpx;
  font-size: 20rpx;
  color: $pm-text-secondary;
  font-weight: 600;
}

/* —— 分类计数 —— */
.seg-scroll {
  width: 100%;
  white-space: nowrap;
  margin-top: 20rpx;
}
.seg {
  display: inline-flex;
  flex-direction: row;
  padding: 8rpx 24rpx 8rpx;
}
.seg-item {
  width: 160rpx;
  margin-right: 16rpx;
  padding: 24rpx 16rpx;
  border-radius: $pm-radius-lg;
  background: $pm-surface;
  border: 1px solid $pm-line;
  box-shadow: $pm-shadow;
  text-align: center;
}
.seg-item.active {
  background: $pm-primary;
  border-color: transparent;
  box-shadow: 0 12rpx 28rpx rgba(14, 95, 59, 0.3);
}
.seg-num {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: $pm-text;
  font-variant-numeric: tabular-nums;
}
.seg-label {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $pm-muted;
  font-weight: 600;
}
.seg-item.active .seg-num,
.seg-item.active .seg-label {
  color: #fff;
}
.toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 4rpx;
}
.toolbar-title {
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 650;
}
.toolbar-action {
  font-size: 24rpx;
  color: $pm-warn;
  font-weight: 750;
  padding: 8rpx 18rpx;
  background: $pm-warn-soft;
  border-radius: 999rpx;
}
</style>
