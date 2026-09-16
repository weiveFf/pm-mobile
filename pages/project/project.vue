<template>
  <view class="pm-page pj-page">
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

    <view
      ref="listRef"
      class="pj-list"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @touchcancel="touchEnd"
      @scroll="onListScroll"
    >
      <!-- 自定义下拉刷新指示器：直接在滚动容器顶部，展开时把卡片整体推下去 -->
      <view class="pr" :class="{ anim: status !== 'pulling' }" :style="{ height: pullY + 'px' }">
        <view class="pr-box" :style="{ opacity: pullY > 0 ? 1 : 0, transform: 'scale(' + (0.8 + progress * 0.3) + ')' }">
          <view class="pr-spin" :class="{ on: status === 'refreshing' }">
            <view class="pr-ring" />
          </view>
          <text class="pr-txt" :class="{ ok: status === 'done' }">{{ text }}</text>
        </view>
      </view>

      <project-card
        v-for="row in list"
        :key="row.fid + '-' + row.fbillno"
        :fshortname="row.fshortname"
        :fbillno="row.fbillno"
        :f-date-o-r-d="row.fDateORD"
        :f-saler-name="row.fSalerName"
        :f-merchandiser="row.fMerchandiser"
        :material-name="row.materialName"
        :f-total-qty="row.fTotalQty"
        :fnumber="row.fnumber"
        :f-install-type="row.fInstallType"
        :f-check-type="row.fCheckType"
        :has-feedback="row.hasFeedback"
        @feedback="addFeedback(row)"
        @feedback-list="openDetail(row)"
        @click="openDetail(row)"
      />
      <view v-if="!loading && !list.length" class="pm-empty">没有找到项目</view>
      <view class="pm-load-more">{{ loading ? '加载中' : finished ? '已经看完啦' : '' }}</view>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getProductManageList } from '@/api/after-sales.js'
import { usePullRefresh } from '@/composables/usePullRefresh.js'

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const expanded = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
const listRef = ref(null)

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
    uni.showToast({ title: (e && (e.message || e.errMsg || String(e))) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
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
  expanded.value = false
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

onLoad(() => {
  if (!ensureLoggedIn()) return
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
    }
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
.pj-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 兜底：防止 --window-bottom 未定义导致 calc 失效 */
  height: calc(100vh - var(--window-bottom, 0px));
  overflow: hidden;
  box-sizing: border-box;
  overscroll-behavior-y: none;
}

.pj-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  padding: 16rpx 24rpx 0;
  overscroll-behavior-y: contain;
}
.pj-list > * {
  flex-shrink: 0;
}
.pj-list > .pm-empty {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.search-btn {
  background: $pm-primary !important;
  color: #fff !important;
}

.picker {
  line-height: 76rpx;
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
