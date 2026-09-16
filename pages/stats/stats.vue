<template>
  <view class="pm-page">
    <app-nav-bar title="数据统计" />

    <view class="pm-filter">
      <view class="pm-filter-row">
        <text class="pm-filter-label">异常类型</text>
        <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
          <view class="pm-filter-input picker">{{ abnormalLabels[abnormalIndex] }}</view>
        </picker>
      </view>
      <view class="pm-filter-actions">
        <button size="mini" type="primary" class="search-btn" @click="loadAll">刷新</button>
      </view>
    </view>

    <view class="pm-list">
      <view class="pm-card">
        <text class="pm-card-title">看板汇总</text>
        <view class="kpi-row">
          <view class="kpi"><text class="n">{{ summary.total != null ? summary.total : '-' }}</text><text class="l">总量</text></view>
          <view class="kpi"><text class="n">{{ summary.open != null ? summary.open : '-' }}</text><text class="l">未关闭</text></view>
          <view class="kpi"><text class="n danger">{{ summary.overdue != null ? summary.overdue : '-' }}</text><text class="l">逾期</text></view>
          <view class="kpi"><text class="n">{{ summary.closed != null ? summary.closed : '-' }}</text><text class="l">已关闭</text></view>
        </view>
      </view>

      <view class="pm-card">
        <text class="pm-card-title">类型占比</text>
        <view v-for="(item, i) in typeRatio" :key="i" class="bar-row">
          <text class="bar-label">{{ item.name || item.label || item.key || '-' }}</text>
          <view class="bar-track">
            <view class="bar-fill" :style="{ width: barWidth(item) }" />
          </view>
          <text class="bar-num">{{ item.value != null ? item.value : item.count || 0 }}</text>
        </view>
        <view v-if="!typeRatio.length" class="pm-empty">暂无数据</view>
      </view>

      <view class="pm-card">
        <text class="pm-card-title">逾期排行 TOP</text>
        <view v-for="(item, i) in overdueRank" :key="i" class="rank-row">
          <text class="rank">{{ i + 1 }}</text>
          <text class="rank-name">{{ item.name || item.nickName || item.deptName || '-' }}</text>
          <text class="rank-val">{{ item.count != null ? item.count : item.value || 0 }}</text>
        </view>
        <view v-if="!overdueRank.length" class="pm-empty">暂无数据</view>
      </view>

      <view class="pm-card">
        <text class="pm-card-title">近 {{ trendDays }} 日趋势</text>
        <view v-for="(item, i) in dailyTrend" :key="i" class="trend-row">
          <text class="trend-day">{{ item.date || item.day || item.label || '-' }}</text>
          <text class="trend-val">{{ item.count != null ? item.count : item.value || 0 }}</text>
        </view>
        <view v-if="!dailyTrend.length" class="pm-empty">暂无数据</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getDeptId } from '@/utils/auth.js'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import {
  getFeedbackDashboardSummary,
  getFeedbackOverdueRank,
  getFeedbackTypeRatio,
  getFeedbackDailyTrend
} from '@/api/after-sales.js'
import { abnormalTypes } from '@/constants/afterSales.js'

const abnormalLabels = computed(() => ['全部'].concat(abnormalTypes.map((a) => a.label)))
const abnormalIndex = ref(1)
const summary = ref({})
const typeRatio = ref([])
const overdueRank = ref([])
const dailyTrend = ref([])
const trendDays = 7
const loading = ref(false)

function params() {
  const p = {}
  const deptId = getDeptId()
  if (deptId) p.deptId = deptId
  if (abnormalIndex.value > 0) {
    p.abnormalType = abnormalTypes[abnormalIndex.value - 1].value
  }
  return p
}

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  loadAll()
}

function pickList(data) {
  if (Array.isArray(data)) return data
  if (!data) return []
  return data.items || data.list || data.result || data.rows || []
}

function normalizeSummary(data) {
  if (!data || typeof data !== 'object') return {}
  return {
    total: data.total ?? data.totalCount ?? data.allCount,
    open: data.open ?? data.openCount ?? data.unclosedCount ?? data.processingCount,
    overdue: data.overdue ?? data.overdueCount,
    closed: data.closed ?? data.closedCount ?? data.completedCount
  }
}

function barWidth(item) {
  const max = Math.max.apply(
    null,
    typeRatio.value.map((x) => Number(x.value != null ? x.value : x.count || 0)).concat([1])
  )
  const v = Number(item.value != null ? item.value : item.count || 0)
  return Math.max(4, Math.round((v / max) * 100)) + '%'
}

async function loadAll() {
  if (!ensureLoggedIn()) return
  loading.value = true
  const p = params()
  try {
    const [s, r, t, d] = await Promise.all([
      getFeedbackDashboardSummary(p).catch(() => ({ data: {} })),
      getFeedbackOverdueRank({ ...p, rankBy: 0, top: 10 }).catch(() => ({ data: [] })),
      getFeedbackTypeRatio({ ...p, field: 'abnormal' }).catch(() => ({ data: [] })),
      getFeedbackDailyTrend({ ...p, days: trendDays }).catch(() => ({ data: [] }))
    ])
    summary.value = normalizeSummary(s.data)
    overdueRank.value = pickList(r.data)
    typeRatio.value = pickList(t.data)
    dailyTrend.value = pickList(d.data)
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

onShow(() => loadAll())
onPullDownRefresh(() => loadAll())
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.search-btn {
  background: $pm-primary !important;
  color: #fff !important;
}
.picker {
  line-height: 72rpx;
}
.kpi-row {
  display: flex;
  flex-direction: row;
  margin-top: 8rpx;
  padding: 8rpx 0;
}
.kpi {
  flex: 1;
  text-align: center;
}
.kpi .n {
  display: block;
  font-size: 40rpx;
  font-weight: 650;
  color: $pm-text;
  font-variant-numeric: tabular-nums;
}
.kpi .n.danger {
  color: $pm-danger;
}
.kpi .l {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  margin-top: 4rpx;
  font-weight: 500;
}
.bar-row,
.rank-row,
.trend-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 18rpx;
}
.bar-label {
  width: 140rpx;
  font-size: 22rpx;
  color: $pm-text-secondary;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track {
  flex: 1;
  height: 8rpx;
  background: $pm-bg;
  border-radius: 8rpx;
  overflow: hidden;
  margin: 0 12rpx;
}
.bar-fill {
  height: 100%;
  background: $pm-primary;
  border-radius: 8rpx;
}
.bar-num,
.rank-val,
.trend-val {
  width: 80rpx;
  text-align: right;
  font-size: 24rpx;
  color: $pm-text;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.rank {
  width: 40rpx;
  font-weight: 650;
  color: $pm-muted;
}
.rank-name,
.trend-day {
  flex: 1;
  font-size: 26rpx;
  color: $pm-text;
}
</style>
