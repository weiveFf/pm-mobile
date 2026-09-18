<template>
  <view
    class="pm-page wb-page"
    @touchstart="touchStart"
    @touchmove="touchMove"
    @touchend="touchEnd"
    @touchcancel="touchEnd"
  >
    <!-- 自定义下拉刷新指示器：文档流内独立区块，展开时把内容整体推下去，不与内容重叠 -->
    <view class="pr" :class="{ anim: status !== 'pulling' }" :style="{ height: pullY + 'px' }">
      <view class="pr-box">
        <view v-if="status === 'done'" class="pr-done">✓</view>
        <view
          v-else
          class="pr-spin"
          :class="{ on: status === 'refreshing' }"
          :style="{ transform: 'rotate(' + progress * 300 + 'deg)', opacity: 0.35 + progress * 0.65 }"
        >
          <view class="pr-ring" />
        </view>
        <text class="pr-txt" :class="{ ok: status === 'done' }">{{ text }}</text>
      </view>
    </view>

    <view class="wb-body">
      <app-nav-bar title="工作台" :show-back="false" />

    <!-- 可折叠头部：下滑列表时 Hero 卡与快捷瓷贴收起，把空间让给列表 -->
    <view class="wb-head" :class="{ collapsed }">
    <!-- 问候栏(WB-01) -->
    <view class="gbar">
      <view class="gavatar">{{ avatarLetter }}</view>
      <view class="gtxt">
        <text class="gdate">{{ dateLine }}</text>
        <text class="ghello">{{ greeting }},{{ userName || '工友' }}</text>
      </view>
      <!-- 数据范围切换：部门 / 我的 -->
      <view class="scope-switch">
        <view
          v-for="s in scopes"
          :key="s.key"
          class="ss-item"
          :class="{ on: scope === s.key }"
          @click="setScope(s.key)"
        >
          {{ s.label }}
        </view>
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
            <text class="hchip">我的反馈 {{ fmtNum(counts.mine) }}</text>
            <text class="hchip copper">逾期 {{ fmtNum(counts.overdue) }}</text>
          </view>
        </view>
        <view class="ring" :style="{ background: ringBg }">
          <text>{{ ringPct }}%</text>
        </view>
      </view>
    </view>

    <!-- 快捷瓷贴(WB-01 · 森林协调系)
         图标统一加 U+FE0E 文本变体符，防止系统把符号渲染成彩色 emoji 导致大小不一 -->
    <view class="quick">
      <view class="q pressable" @click="goTab('/pages/project/project')">
        <view class="sq s1 ico-plus">✚&#xFE0E;</view>
        <text class="qlb">提交反馈</text>
      </view>
      <view class="q pressable" @click="goTab('/pages/feedback/feedback')">
        <view class="sq g1 ico-check">☑&#xFE0E;</view>
        <text class="qlb">反馈处理</text>
      </view>
      <view class="q pressable" @click="goStats">
        <view class="sq s3 ico-chart">▤&#xFE0E;</view>
        <text class="qlb">数据看板</text>
      </view>
      <view class="q pressable" @click="goTab('/pages/mine/mine')">
        <view class="sq s2 ico-user">☺&#xFE0E;</view>
        <text class="qlb">个人中心</text>
      </view>
    </view>

    <!-- 分类计数：三个 tab 居中占满 -->
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

    <view class="toolbar">
      <text class="toolbar-title">{{ currentTypeLabel }}</text>
    </view>
    </view><!-- /wb-head -->

    <view class="pm-list" ref="listRef">
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
</view>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import { usePullRefresh } from '@/composables/usePullRefresh.js'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getUserId, getUserName } from '@/utils/auth.js'
import {
  getWorkbenchFeedbackPage,
  getUserWorkloadStatistics,
  markProcessResponded
} from '@/api/after-sales.js'
import { WORKBENCH_TYPES, WORKBENCH_SCOPES } from '@/constants/feedbackWorkflow.js'
import { resolveFeedbackWorkflowDisplay, formatHandlerPair, canRespondFeedbackRow } from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, getUrgencyTone, formatDateOnly } from '@/utils/urgencyDisplay.js'
import { getRespondedTimeText, formatDateTimeMinute } from '@/utils/feedbackListRowHelpers.js'

const typeTabs = WORKBENCH_TYPES
const scopes = WORKBENCH_SCOPES
const workbenchType = ref('pending')
// 数据范围：dept 部门维度 / mine 我的维度
const scope = ref('mine')
// 折叠头部：下滑列表时收起 Hero 卡与快捷瓷贴，给列表让出空间
const collapsed = ref(false)

function setScope(key) {
  if (scope.value === key) return
  scope.value = key
  loadStats()
  fetchList(true)
}
const emptyTextMap = {
  pending: '暂无待处理事项',
  mine: '暂无我的反馈',
  overdue: '没有逾期的反馈,继续保持'
}
const emptyText = computed(() => emptyTextMap[workbenchType.value] || '暂无数据')

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
// 反馈列表的 DOM 引用：页面不再整体滚动，只有列表滚动，
// 下拉刷新需要根据列表容器的 scrollTop 判断是否在顶部
const listRef = ref(null)
const userName = ref('')
const counts = reactive({
  pending: null,
  mine: null,
  overdue: null
})
// 进度环数据：我的处理完成度
const processStats = reactive({ total: null, done: null })

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

/** 完成率进度环：我的处理完成度（已处理 / 全部处理记录），由 loadStats 写入 */
const ringPct = computed(() => {
  const t = num(processStats.total)
  if (!t) return 0
  return Math.round((num(processStats.done) / t) * 100)
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
  const project = item.project || {}
  const display = resolveFeedbackWorkflowDisplay(item)
  const overdue = !!display.overdueType
  const uid = String(getUserId())

  // 操作权限：仅当当前用户是处理人或负责人才显示处理/响应
  const firstId = String(fb.theFirstHandlerId || fb.TheFirstHandlerId || '')
  const ivId = String(fb.interventionPersonnelId || fb.InterventionPersonnelId || '')
  const isHandler = firstId && firstId === uid
  const isResponsible = ivId && ivId === uid
  const canOperate = isHandler || isResponsible

  const actions = []
  if (canOperate && canRespondFeedbackRow(item, uid)) {
    actions.push({ key: 'respond', label: '响应' })
  }
  if (canOperate && !fb.isClose && !fb.isWithdrawn) {
    actions.push({ key: 'process', label: '处理' })
  }
  if (display.status === 'pending_close') {
    actions.push({ key: 'close', label: '关闭' })
  }
  const serial = String(fb.serialNumber || fb.id || '').replace(/^#/, '')
  return {
    id: fb.id,
    serial,
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
    demandFinish: formatDateOnly(fb.demandFinishTime),
    handler: formatHandlerPair(fb),
    deptName: fb.deptName || fb.DeptName || '',
    creatorName: fb.createByNickName || fb.CreateByNickName || '',
    salerName: project.fSalerName || project.FSALERNAME || '',
    createTime: formatDateTimeMinute(fb.create_time || fb.createTime || fb.Create_time),
    respondedTime: getRespondedTimeText(item.processList || item.ProcessList),
    closeTime: formatDateTimeMinute(fb.closeTime || fb.CloseTime),
    reassignCount: Number(fb.deptReassignCount || fb.DeptReassignCount || 0),
    mentionedMe: !!item.isMentionedMe,
    overdueDays: item.overdueDays || 0,
    actions,
    raw: item
  }
}

async function loadStats() {
  try {
    const uid = getUserId()
    const res = await getUserWorkloadStatistics({ userId: uid, scope: scope.value })
    const d = res.data || {}
    counts.pending = d.pendingCount != null ? d.pendingCount : d.pending
    counts.mine = d.myFeedbackCount != null ? d.myFeedbackCount : null
    // 逾期：我的口径用 MyOverdueCount，部门口径用 DeptOverdueCount
    counts.overdue = scope.value === 'dept'
      ? (d.deptOverdueCount != null ? d.deptOverdueCount : null)
      : (d.myOverdueCount != null ? d.myOverdueCount : null)
    // 进度环：我的处理完成度
    processStats.total = d.totalProcessCount != null ? d.totalProcessCount : null
    processStats.done = d.processedCount != null ? d.processedCount : null
  } catch (e) {}
}

async function fetchList(reset) {
  if (loading.value) return
  if (!ensureLoggedIn()) return
  if (reset) {
    pageNum.value = 1
    finished.value = false
    list.value = []
    collapsed.value = false
    // 重渲染后把列表滚回顶部，使折叠状态与滚动位置一致（展开头部 + 列表置顶）
    nextTick(() => {
      if (listRef.value) listRef.value.scrollTop = 0
    })
  }
  if (finished.value) return
  loading.value = true
  try {
    const res = await getWorkbenchFeedbackPage({
      userId: getUserId(),
      workbenchType: workbenchType.value,
      scope: scope.value,
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

function goTab(url) {
  uni.switchTab({ url })
}

function goStats() {
  uni.showToast({ title: '功能正在维护中', icon: 'none' })
}

onShow(() => {
  if (!ensureLoggedIn()) return
  userName.value = getUserName()
  loadStats()
  fetchList(true)
})

// H5 下 view 组件不会把内部 div 的 scroll 事件透传出来，
// 因此折叠头部需要在 onMounted 里直接拿到 .pm-list 的真实 DOM 监听滚动
// #ifdef H5
let scrollEl = null
// #endif

function getScrollContainer() {
  // #ifdef H5
  return scrollEl || document.querySelector('.pm-list') || (listRef.value && listRef.value.$el) || listRef.value
  // #endif
  // #ifndef H5
  return listRef.value
  // #endif
}

function onListScroll(e) {
  // 优先用原生事件对象 target（手动 addEventListener 触发时 e.target 就是真实 DOM）
  const el = (e && e.target) || getScrollContainer()
  if (!el) return
  // 滞回折叠：滑过阈值收起、回顶展开，避免在临界点反复抖动
  const top = el.scrollTop || 0
  if (top > 48 && !collapsed.value) collapsed.value = true
  else if (top < 8 && collapsed.value) collapsed.value = false
  const bottom = top + el.clientHeight >= el.scrollHeight - 80
  if (bottom && !finished.value && !loading.value) {
    fetchList(false)
  }
}

onMounted(() => {
  // #ifdef H5
  const bindScroll = () => {
    scrollEl = document.querySelector('.pm-list') || (listRef.value && listRef.value.$el) || listRef.value
    if (scrollEl && typeof scrollEl.addEventListener === 'function') {
      scrollEl.addEventListener('scroll', onListScroll, { passive: true })
    }
  }
  nextTick(bindScroll)
  // 部分情况下 DOM 还没挂载到 document，再晚 100ms 兜底取一次
  setTimeout(bindScroll, 100)
  // #endif
})

onUnmounted(() => {
  // #ifdef H5
  if (scrollEl && typeof scrollEl.removeEventListener === 'function') {
    scrollEl.removeEventListener('scroll', onListScroll)
  }
  scrollEl = null
  // #endif
})

const { pullY, status, text, progress, touchStart, touchMove, touchEnd } = usePullRefresh(
  async () => {
    await loadStats()
    await fetchList(true)
  },
  {
    // 列表是内层滚动容器，下拉刷新以 listRef.scrollTop 为准，避免误判为"一直在顶部"
    getScrollTop: () => {
      // #ifdef H5
      const el = getScrollContainer()
      return el ? el.scrollTop || 0 : 0
      // #endif
      // #ifndef H5
      return 0
      // #endif
    },
    // 工作台卡片较多，滚动时容易误触下拉；增大阈值和死区，让下拉意图更明显
    threshold: 88,
    deadZone: 18,
    damping: 0.5
  }
)

onReachBottom(() => fetchList(false))
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* —— 页面整体布局：整页固定，仅反馈列表可滚动 —— */
.wb-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--window-bottom));
  overflow: hidden;
  box-sizing: border-box;
  /* 防止列表滚到边界时把整页 rubber-band 拉起来 */
  overscroll-behavior-y: none;
}
.wb-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* —— 自定义下拉刷新 —— */
.pr {
  /* 文档流内独立区块：height=0 时不占位，展开时把下方内容整体推下去 */
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
.pr-done {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
  border-radius: 50%;
  background: $pm-primary;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

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

/* 数据范围切换：部门 / 我的 */
.scope-switch {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 12rpx;
  padding: 4rpx;
  border-radius: 999rpx;
  background: $pm-bg-2;
  border: 1px solid $pm-line;
}
.ss-item {
  min-width: 76rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: $pm-muted;
  transition: all 0.18s $pm-press-ease;
}
.ss-item.on {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 6rpx 14rpx rgba(14, 95, 59, 0.28);
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
  box-sizing: border-box;
  max-height: 460rpx;
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
  box-sizing: border-box;
  max-height: 360rpx;
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
  /* 强制文本渲染，避免部分系统把符号替换成彩色 emoji */
  font-variant-emoji: text;
  font-family: $pm-font;
  line-height: 1;
}

/* 各符号在不同字体下的实际字面大小不同，按视觉面积逐一校准，
   以「提交反馈 ✚」为基准对齐 */
.sq.ico-plus {
  font-size: 36rpx;
}
.sq.ico-check {
  font-size: 34rpx;
}
.sq.ico-chart {
  font-size: 34rpx;
}
.sq.ico-user {
  font-size: 32rpx;
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

/* —— 分类计数（三 tab 居中占满） —— */
.seg {
  display: flex;
  flex-direction: row;
  padding: 4rpx 24rpx;
}
.seg-item {
  flex: 1;
  margin-right: 16rpx;
  padding: 24rpx 16rpx;
  border-radius: $pm-radius-lg;
  background: $pm-surface;
  border: 1px solid $pm-line;
  box-shadow: $pm-shadow;
  text-align: center;
}
.seg-item:last-child {
  margin-right: 0;
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

/* —— 可折叠头部：下滑列表时收起 Hero 与快捷瓷贴，把空间让给列表 —— */
.wb-head {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.hero-card,
.quick {
  transition:
    max-height 0.3s $pm-press-ease,
    opacity 0.24s ease,
    margin-top 0.3s $pm-press-ease,
    transform 0.3s $pm-press-ease;
  overflow: hidden;
}
.wb-head.collapsed .hero-card,
.wb-head.collapsed .quick {
  max-height: 0;
  min-height: 0;
  opacity: 0;
  margin-top: 0;
  transform: translateY(-16rpx);
  pointer-events: none;
}
/* 折叠后让头部压成一行紧凑态：只剩头像+问候+范围切换，分类 tab 像常驻筛选条 */
.wb-head.collapsed .gbar {
  margin-bottom: 2rpx;
  padding-top: 4rpx;
  padding-bottom: 4rpx;
}
.wb-head.collapsed .gavatar {
  width: 52rpx;
  height: 52rpx;
  line-height: 52rpx;
  font-size: 24rpx;
  margin-right: 14rpx;
}
.wb-head.collapsed .gdate {
  display: none;
}
.wb-head.collapsed .ghello {
  font-size: 28rpx;
}
.wb-head.collapsed .scope-switch {
  transform: scale(0.92);
  transform-origin: right center;
}
.wb-head.collapsed .seg {
  margin-top: 0;
  padding-top: 2rpx;
  padding-bottom: 2rpx;
}

/* —— 列表：唯一滚动区域 —— */
.pm-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  display: flex;
  flex-direction: column;
}
.pm-list > * {
  flex-shrink: 0;
}
.pm-list > .pm-empty {
  flex: 1 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
