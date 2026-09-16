<template>
  <view class="pm-page">
    <app-nav-bar title="项目详情" />

    <view v-if="project" class="hero">
      <view class="deco" />
      <view class="deco2" />
      <view class="hero-body">
        <text class="name">{{ project.fshortname || '-' }}</text>
        <text class="bill">{{ project.fbillno || '-' }}</text>
        <view class="tags">
          <text class="tag">{{ formatDateOnly(project.fDateORD) }}</text>
          <text class="tag">{{ project.fSalerName || '业务—' }}</text>
          <text class="tag">{{ project.fInstallType || '安装—' }}</text>
        </view>
        <text class="product">{{ project.materialName || '暂无产品信息' }}</text>
        <view class="cta pressable" @click="addFeedback">提交反馈</view>
      </view>
    </view>

    <view class="section">这个项目的反馈</view>
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
        @click="openDetail(row.id)"
      />
      <view v-if="!loading && !list.length" class="pm-empty">还没有反馈，去提一条吧</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getProductManageByFid, getProductFeedbackList } from '@/api/after-sales.js'
import { resolveFeedbackWorkflowDisplay, formatHandlerPair } from '@/utils/feedbackWorkflow.js'
import { getUrgencyLabel, getUrgencyTone, formatDateOnly } from '@/utils/urgencyDisplay.js'

const fid = ref('')
const fbillno = ref('')
const project = ref(null)
const list = ref([])
const loading = ref(false)

function mapRow(item) {
  const fb = item.feedback || item
  const display = resolveFeedbackWorkflowDisplay(item)
  return {
    id: fb.id,
    serial: fb.serialNumber || fb.id,
    statusLabel: display.label,
    statusTone: display.overdueType ? 'danger' : '',
    abnormalType: fb.abnormalType,
    problemType: fb.problemType,
    urgencyLabel: getUrgencyLabel(fb.urgencyLevel),
    urgencyTone: getUrgencyTone(fb.urgencyLevel),
    customer: fb.customerName || fb.fshortname || '',
    demandFinish: formatDateOnly(fb.demandFinishTime),
    handler: formatHandlerPair(fb)
  }
}

async function load() {
  loading.value = true
  try {
    if (fid.value) {
      try {
        const info = await getProductManageByFid(fid.value)
        project.value = info.data || { fid: fid.value, fbillno: fbillno.value }
      } catch (e) {
        project.value = { fid: fid.value, fbillno: fbillno.value }
      }
    }
    const params = {}
    if (fbillno.value) params.fbillno = fbillno.value
    if (fid.value) params.productFid = fid.value
    const res = await getProductFeedbackList(params)
    const rows = res.data || []
    list.value = (Array.isArray(rows) ? rows : rows.result || []).map(mapRow)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function addFeedback() {
  const p = project.value || { fid: fid.value, fbillno: fbillno.value }
  const payload = encodeURIComponent(JSON.stringify(p))
  uni.navigateTo({ url: '/pages/add-feedback/add-feedback?project=' + payload })
}

function openDetail(id) {
  uni.navigateTo({ url: '/pages/feedback-detail/feedback-detail?id=' + id })
}

onLoad((q) => {
  fid.value = q.fid || ''
  fbillno.value = q.fbillno ? decodeURIComponent(q.fbillno) : ''
  load()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.hero {
  margin: 8rpx 24rpx 8rpx;
  padding: 36rpx 32rpx;
  border-radius: 36rpx;
  background: $pm-grad-hero;
  box-shadow: $pm-shadow-lg;
  position: relative;
  overflow: hidden;
}
.deco {
  position: absolute;
  right: -40rpx;
  top: -28rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.deco2 {
  position: absolute;
  right: 60rpx;
  bottom: -80rpx;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(216, 154, 110, 0.22);
}
.hero-body {
  position: relative;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.6rpx;
}
.bill {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
}
.tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 20rpx;
}
.tag {
  margin-right: 10rpx;
  margin-bottom: 8rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 20rpx;
  font-weight: 650;
}
.product {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.78);
}
.cta {
  display: inline-block;
  margin-top: 28rpx;
  padding: 18rpx 40rpx;
  border-radius: 999rpx;
  background: #fff;
  color: $pm-primary-deep;
  font-size: 28rpx;
  font-weight: 800;
}
.section {
  padding: 24rpx 32rpx 8rpx;
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 700;
}
</style>
