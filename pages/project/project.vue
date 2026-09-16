<template>
  <view class="pm-page">
    <app-nav-bar title="项目列表" :show-back="false" />

    <view class="pm-filter">
      <view class="pm-filter-row">
        <text class="pm-filter-label">客户名称</text>
        <input v-model="query.fshortname" class="pm-filter-input" placeholder="客户名称" confirm-type="search" @confirm="search" />
      </view>
      <view class="pm-filter-row">
        <text class="pm-filter-label">订单号码</text>
        <input v-model="query.fbillno" class="pm-filter-input" placeholder="订单号码" confirm-type="search" @confirm="search" />
      </view>
      <view class="pm-filter-row">
        <text class="pm-filter-label">有无反馈</text>
        <picker :range="hasFeedbackLabels" :value="hasFeedbackIndex" @change="onHasFeedback">
          <view class="pm-filter-input picker">{{ hasFeedbackLabels[hasFeedbackIndex] }}</view>
        </picker>
      </view>
      <view v-if="expanded">
        <view class="pm-filter-row">
          <text class="pm-filter-label">业务员</text>
          <input v-model="query.fSalerName" class="pm-filter-input" placeholder="业务员" />
        </view>
        <view class="pm-filter-row">
          <text class="pm-filter-label">跟单员</text>
          <input v-model="query.fMerchandiser" class="pm-filter-input" placeholder="跟单员" />
        </view>
        <view class="pm-filter-row">
          <text class="pm-filter-label">订单产品</text>
          <input v-model="query.materialName" class="pm-filter-input" placeholder="订单产品" />
        </view>
        <view class="pm-filter-row">
          <text class="pm-filter-label">安装类型</text>
          <picker :range="installLabels" :value="installIndex" @change="onInstall">
            <view class="pm-filter-input picker">{{ installLabels[installIndex] }}</view>
          </picker>
        </view>
        <view class="pm-filter-row">
          <text class="pm-filter-label">验收类型</text>
          <picker :range="checkLabels" :value="checkIndex" @change="onCheck">
            <view class="pm-filter-input picker">{{ checkLabels[checkIndex] }}</view>
          </picker>
        </view>
      </view>
      <view class="pm-filter-actions">
        <button size="mini" @click="expanded = !expanded">{{ expanded ? '收起' : '更多' }}</button>
        <button size="mini" @click="reset">重置</button>
        <button size="mini" type="primary" class="search-btn" @click="search">搜索</button>
      </view>
    </view>

    <view class="pm-list">
      <view
        v-for="row in list"
        :key="row.fid + '-' + row.fbillno"
        class="card pressable"
        @click="openDetail(row)"
      >
        <view class="top">
          <text class="name">{{ row.fshortname || '-' }}</text>
          <status-chip :text="row.hasFeedback ? '有反馈' : '暂无'" :tone="row.hasFeedback ? 'warn' : 'muted'" />
        </view>
        <text class="bill">{{ row.fbillno || '-' }}</text>
        <view class="chips">
          <text class="mini">{{ formatDateOnly(row.fDateORD) }}</text>
          <text class="mini">{{ row.fSalerName || '业务—' }}</text>
          <text class="mini">数量 {{ row.fTotalQty != null ? row.fTotalQty : '—' }}</text>
        </view>
        <text class="product">{{ row.materialName || '暂无产品信息' }}</text>
        <view class="ops" @click.stop>
          <view class="btn primary" @click="addFeedback(row)">提交反馈</view>
          <view class="btn" @click="openDetail(row)">看看详情</view>
        </view>
      </view>
      <view v-if="!loading && !list.length" class="pm-empty">没有找到项目</view>
      <view class="pm-load-more">{{ loading ? '加载中' : finished ? '已经看完啦' : '' }}</view>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getProductManageList } from '@/api/after-sales.js'
import { formatDateOnly } from '@/utils/urgencyDisplay.js'

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const expanded = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)

const query = reactive({
  fshortname: '',
  fbillno: '',
  hasFeedback: undefined,
  fSalerName: '',
  fMerchandiser: '',
  materialName: '',
  fInstallType: '',
  fCheckType: ''
})

const hasFeedbackLabels = ['全部', '有反馈', '暂无反馈']
const hasFeedbackIndex = ref(0)
const installLabels = ['全部', '免安装', '安装']
const installIndex = ref(0)
const checkLabels = ['全部', '免验收', '验收']
const checkIndex = ref(0)

function onHasFeedback(e) {
  hasFeedbackIndex.value = Number(e.detail.value)
  if (hasFeedbackIndex.value === 0) query.hasFeedback = undefined
  else if (hasFeedbackIndex.value === 1) query.hasFeedback = true
  else query.hasFeedback = false
}

function onInstall(e) {
  installIndex.value = Number(e.detail.value)
  query.fInstallType = installIndex.value === 0 ? '' : installLabels[installIndex.value]
}

function onCheck(e) {
  checkIndex.value = Number(e.detail.value)
  query.fCheckType = checkIndex.value === 0 ? '' : checkLabels[checkIndex.value]
}

function buildParams() {
  const p = {
    pageNum: pageNum.value,
    pageSize
  }
  Object.keys(query).forEach((k) => {
    if (query[k] !== '' && query[k] !== undefined && query[k] !== null) {
      p[k] = query[k]
    }
  })
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
    const res = await getProductManageList(buildParams())
    const data = res.data || {}
    const rows = data.result || []
    total.value = data.totalNum || 0
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

function search() {
  fetchList(true)
}

function reset() {
  query.fshortname = ''
  query.fbillno = ''
  query.hasFeedback = undefined
  query.fSalerName = ''
  query.fMerchandiser = ''
  query.materialName = ''
  query.fInstallType = ''
  query.fCheckType = ''
  hasFeedbackIndex.value = 0
  installIndex.value = 0
  checkIndex.value = 0
  fetchList(true)
}

function openDetail(row) {
  const fid = row.fid
  const bill = encodeURIComponent(row.fbillno || '')
  uni.navigateTo({
    url: '/pages/project-detail/project-detail?fid=' + fid + '&fbillno=' + bill
  })
}

function addFeedback(row) {
  const payload = encodeURIComponent(
    JSON.stringify({
      fid: row.fid,
      fbillno: row.fbillno,
      fshortname: row.fshortname,
      fDateORD: row.fDateORD,
      fSalerName: row.fSalerName,
      fMerchandiser: row.fMerchandiser,
      materialName: row.materialName
    })
  )
  uni.navigateTo({ url: '/pages/add-feedback/add-feedback?project=' + payload })
}

onShow(() => {
  if (!ensureLoggedIn()) return
  fetchList(true)
})

onPullDownRefresh(() => fetchList(true))

onReachBottom(() => fetchList(false))
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.search-btn {
  background: $pm-primary !important;
  color: #fff !important;
}
.picker {
  line-height: 76rpx;
}
.card {
  background: $pm-surface;
  border-radius: $pm-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $pm-shadow;
}
.top {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.4rpx;
  padding-right: 12rpx;
}
.bill {
  display: block;
  font-size: 24rpx;
  color: $pm-primary-deep;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 14rpx;
}
.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}
.mini {
  margin-right: 10rpx;
  margin-bottom: 8rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: $pm-bg;
  font-size: 20rpx;
  color: $pm-text-secondary;
  font-weight: 600;
}
.product {
  display: block;
  font-size: 24rpx;
  color: $pm-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 18rpx;
}
.ops {
  display: flex;
  flex-direction: row;
}
.btn {
  margin-right: 12rpx;
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: $pm-accent;
  color: $pm-primary-deep;
  font-size: 24rpx;
  font-weight: 750;
}
.btn.primary {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(14, 95, 59, 0.28);
}
</style>
