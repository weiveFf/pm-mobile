<template>
  <view class="pm-page pj-page">
    <app-nav-bar title="项目列表" :show-back="false" />

    <!-- 淘宝式搜索栏：单搜索框 + 筛选入口 -->
    <view class="pj-search-bar">
      <view class="pj-search-box">
        <svg class="pj-ico" viewBox="0 0 24 24"><path d="M10 4a6 6 0 104.47 10.03l4.25 4.25 1.41-1.41-4.25-4.25A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z" fill="currentColor" /></svg>
        <input
          class="pj-search-input"
          v-model="query.fshortname"
          placeholder="搜索客户名称"
          confirm-type="search"
          @input="onKeywordInput"
          @confirm="search"
        />
        <text v-if="query.fshortname" class="pj-search-clear" @click.stop="clearKeyword">✕</text>
      </view>
      <view class="pj-filter-btn" @click="openFilter">
        <svg class="pj-ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 8.5V19l-4 2v-7.5z" fill="currentColor" /></svg>
        <text class="pj-filter-txt">筛选</text>
        <view v-if="activeFilterCount" class="pj-filter-badge">{{ activeFilterCount }}</view>
      </view>
    </view>

    <!-- 结果栏：总数 + 筛选状态 -->
    <view class="pj-result-bar">
      <text class="pj-result-count">共 <text class="num">{{ total }}</text> 个项目</text>
      <view v-if="activeFilterCount" class="pj-result-clear" @click="openFilter">
        <text>已筛选 {{ activeFilterCount }} 项</text>
        <text class="arrow">▾</text>
      </view>
    </view>

    <view
      ref="listRef"
      class="pj-list"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @touchcancel="touchEnd"
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

      <!-- 显式加载更多按钮 -->
      <view class="pj-loadmore">
        <button
          v-if="!finished && list.length"
          class="pj-loadmore-btn"
          :disabled="loading"
          @click="loadMore"
        >{{ loading ? '加载中…' : '加载更多' }}</button>
        <text v-else-if="finished && list.length" class="pj-loadmore-end">— 已经看完啦 —</text>
      </view>
      <view class="pm-safe-bottom" />
    </view>

    <!-- 筛选抽屉：遮罩 + 右侧面板 -->
    <view class="pj-mask" :class="{ show: showFilter }" @click="closeFilter" />
    <view class="pj-drawer" :class="{ show: showFilter }">
      <view class="pj-drawer-head">
        <text class="pj-drawer-title">筛选</text>
        <text class="pj-drawer-close" @click="closeFilter">✕</text>
      </view>

      <scroll-view class="pj-drawer-body" scroll-y>
        <view class="pj-field">
          <text class="pj-field-label">客户名称</text>
          <input class="pj-field-input" v-model="query.fshortname" placeholder="客户名称" />
        </view>
        <view class="pj-field">
          <text class="pj-field-label">订单号码</text>
          <input class="pj-field-input" v-model="query.fbillno" placeholder="订单号码" />
        </view>
        <view class="pj-field">
          <text class="pj-field-label">业务员</text>
          <input class="pj-field-input" v-model="query.fSalerName" placeholder="业务员" />
        </view>
        <view class="pj-field">
          <text class="pj-field-label">跟单员</text>
          <input class="pj-field-input" v-model="query.fMerchandiser" placeholder="跟单员" />
        </view>
        <view class="pj-field">
          <text class="pj-field-label">订单产品</text>
          <input class="pj-field-input" v-model="query.materialName" placeholder="订单产品" />
        </view>

        <view class="pj-field">
          <text class="pj-field-label">有无反馈</text>
          <view class="pj-seg">
            <view
              v-for="(l, i) in hasFeedbackLabels"
              :key="i"
              class="pj-seg-item"
              :class="{ on: hasFeedbackIndex === i }"
              @click="onHasFeedback(i)"
            >{{ l }}</view>
          </view>
        </view>
        <view class="pj-field">
          <text class="pj-field-label">安装类型</text>
          <view class="pj-seg">
            <view
              v-for="(l, i) in installLabels"
              :key="i"
              class="pj-seg-item"
              :class="{ on: installIndex === i }"
              @click="onInstall(i)"
            >{{ l }}</view>
          </view>
        </view>
        <view class="pj-field">
          <text class="pj-field-label">验收类型</text>
          <view class="pj-seg">
            <view
              v-for="(l, i) in checkLabels"
              :key="i"
              class="pj-seg-item"
              :class="{ on: checkIndex === i }"
              @click="onCheck(i)"
            >{{ l }}</view>
          </view>
        </view>
      </scroll-view>

      <view class="pj-drawer-foot">
        <button class="pj-reset" @click="reset">重置</button>
        <button class="pj-apply" @click="applyFilter">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { ensureLoggedIn } from '@/utils/authGuard.js'
import { getProductManageList } from '@/api/after-sales.js'
import { usePullRefresh } from '@/composables/usePullRefresh.js'

const list = ref([])
const loading = ref(false)
const finished = ref(false)
const pageNum = ref(1)
const pageSize = 20
const total = ref(0)
const listRef = ref(null)
const showFilter = ref(false)

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

// 已选的「额外」筛选条件数量（不含顶部主搜索的客户名称），用于角标提示
const activeFilterCount = computed(() => {
  let n = 0
  if (query.fbillno) n++
  if (query.fSalerName) n++
  if (query.fMerchandiser) n++
  if (query.materialName) n++
  if (query.hasFeedback !== undefined) n++
  if (query.fInstallType) n++
  if (query.fCheckType) n++
  return n
})

function onHasFeedback(i) {
  hasFeedbackIndex.value = i
  if (i === 0) query.hasFeedback = undefined
  else if (i === 1) query.hasFeedback = true
  else query.hasFeedback = false
}
function onInstall(i) {
  installIndex.value = i
  query.fInstallType = i === 0 ? '' : installLabels[i]
}
function onCheck(i) {
  checkIndex.value = i
  query.fCheckType = i === 0 ? '' : checkLabels[i]
}

function openFilter() {
  showFilter.value = true
}
function closeFilter() {
  showFilter.value = false
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

// 顶部搜索框：输入防抖自动搜索
let kwTimer = null
function onKeywordInput() {
  clearTimeout(kwTimer)
  kwTimer = setTimeout(() => {
    fetchList(true)
  }, 500)
}
function clearKeyword() {
  query.fshortname = ''
  fetchList(true)
}

function search() {
  fetchList(true)
}

function loadMore() {
  fetchList(false)
}

function applyFilter() {
  closeFilter()
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
  closeFilter()
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

/* 分页为手动模式：默认加载 20 条，仅「加载更多」按钮触发下一页（不做触底自动加载） */
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

/* 页面固定：搜索/结果栏不滚动，仅列表滚动 */
.pj-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 兜底：防止 --window-bottom 未定义导致 calc 失效 */
  height: calc(100vh - var(--window-bottom, 0px));
  overflow: hidden;
  box-sizing: border-box;
  overscroll-behavior-y: none;
}

/* —— 搜索栏（淘宝式单搜索框 + 筛选入口） —— */
.pj-search-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 24rpx;
  background: $pm-bg;
  flex-shrink: 0;
}
.pj-search-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 72rpx;
  padding: 0 20rpx;
  background: $pm-bg-2;
  border-radius: 999rpx;
  border: 1px solid transparent;
  box-sizing: border-box;
  transition: border-color 0.18s, background 0.18s;
}
.pj-search-box:focus-within {
  background: $pm-surface;
  border-color: $pm-primary;
}
.pj-ico {
  width: 32rpx;
  height: 32rpx;
  color: $pm-muted;
  flex-shrink: 0;
}
.pj-search-input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  line-height: 72rpx;
  margin: 0 12rpx;
  font-size: 26rpx;
  color: $pm-text;
}
.pj-search-clear {
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba($pm-muted, 0.18);
  color: $pm-text-secondary;
  font-size: 22rpx;
  flex-shrink: 0;
}
.pj-filter-btn {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  margin-left: 16rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 8rpx 18rpx rgba(14, 95, 59, 0.28);
  flex-shrink: 0;
}
.pj-filter-btn .pj-ico {
  color: #fff;
  margin-right: 8rpx;
}
.pj-filter-txt {
  font-size: 26rpx;
  font-weight: 700;
}
.pj-filter-badge {
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

/* —— 结果栏：总数 —— */
.pj-result-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 28rpx 14rpx;
  background: $pm-bg;
  flex-shrink: 0;
}
.pj-result-count {
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 600;
}
.pj-result-count .num {
  font-size: 28rpx;
  color: $pm-primary-deep;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.pj-result-clear {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 22rpx;
  color: $pm-copper;
  font-weight: 700;
}
.pj-result-clear .arrow {
  margin-left: 4rpx;
  font-size: 20rpx;
}

/* —— 列表 —— */
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

/* 加载更多 */
.pj-loadmore {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0 12rpx;
}
.pj-loadmore-btn {
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
.pj-loadmore-btn[disabled] {
  opacity: 0.55;
  color: $pm-muted;
  border-color: $pm-line;
  box-shadow: none;
}
.pj-loadmore-end {
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

/* —— 筛选抽屉：遮罩 + 右侧面板 —— */
.pj-mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 30, 24, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.26s ease, visibility 0.26s ease;
  z-index: 50;
}
.pj-mask.show {
  opacity: 1;
  visibility: visible;
}
.pj-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 640rpx;
  background: $pm-surface;
  box-shadow: -16rpx 0 40rpx rgba(0, 0, 0, 0.18);
  transform: translateX(100%);
  transition: transform 0.28s $pm-press-ease;
  z-index: 51;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.pj-drawer.show {
  transform: translateX(0);
}
.pj-drawer-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid $pm-line;
  flex-shrink: 0;
}
.pj-drawer-title {
  font-size: 32rpx;
  font-weight: 800;
  color: $pm-text;
}
.pj-drawer-close {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-bg-2;
  color: $pm-text-secondary;
  font-size: 26rpx;
}
.pj-drawer-body {
  flex: 1;
  min-height: 0;
  padding: 8rpx 32rpx 24rpx;
  box-sizing: border-box;
}
.pj-field {
  margin-top: 28rpx;
}
.pj-field-label {
  display: block;
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 700;
  margin-bottom: 14rpx;
}
.pj-field-input {
  width: 100%;
  height: 84rpx;
  line-height: 84rpx;
  padding: 0 24rpx;
  background: $pm-bg-2;
  border-radius: 28rpx;
  border: 1px solid transparent;
  box-sizing: border-box;
  font-size: 26rpx;
  color: $pm-text;
  transition: border-color 0.18s, background 0.18s;
}
.pj-field-input:focus {
  background: $pm-surface;
  border-color: $pm-primary;
}

/* 分段选择器（有无反馈 / 安装 / 验收） */
.pj-seg {
  display: flex;
  flex-direction: row;
  background: $pm-bg-2;
  border-radius: 999rpx;
  padding: 6rpx;
  box-sizing: border-box;
}
.pj-seg-item {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: $pm-text-secondary;
  transition: all 0.18s $pm-press-ease;
}
.pj-seg-item.on {
  background: $pm-primary;
  color: #fff;
  box-shadow: 0 6rpx 14rpx rgba(14, 95, 59, 0.28);
}

.pj-drawer-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 32rpx calc(20rpx + var(--window-bottom, 0px));
  border-top: 1px solid $pm-line;
  flex-shrink: 0;
  background: $pm-surface;
}
.pj-reset {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  background: $pm-bg-2;
  color: $pm-text-secondary;
  font-size: 28rpx;
  font-weight: 800;
  border: 1px solid $pm-line;
}
.pj-apply {
  flex: 2;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  background: $pm-primary;
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 24rpx rgba(14, 95, 59, 0.3);
}
</style>
