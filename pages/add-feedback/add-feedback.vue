<template>
  <view class="pm-page add-page">
    <app-nav-bar title="添加反馈" />

    <!-- 项目信息头卡 -->
    <view class="head-card">
      <text class="head-title">{{ projectTitle }}</text>
      <view class="head-meta">
        <text class="meta">FID：{{ form.fid || '-' }}</text>
        <text class="dot">·</text>
        <text class="meta">订单：{{ form.fbillno || '-' }}</text>
      </view>
    </view>

    <!-- 步骤条 -->
    <view class="step-bar">
      <view
        v-for="(s, i) in steps"
        :key="i"
        class="step"
        :class="{ active: step === i + 1, done: step > i + 1 }"
      >
        <view class="step-dot">{{ i + 1 }}</view>
        <text class="step-name">{{ s }}</text>
        <view v-if="i < steps.length - 1" class="step-line" />
      </view>
    </view>

    <view class="add-body">
      <!-- 第 1 步：基础信息 -->
      <view v-if="step === 1" class="step-panel">
        <view class="pm-card form-card">
          <text class="card-title">基础信息</text>

          <view class="field-stack">
            <view class="field">
              <text class="label required">异常类型</text>
              <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
                <view class="value">{{ abnormalLabels[abnormalIndex] || '请选择' }}</view>
              </picker>
            </view>

            <view v-if="problemOptions.length" class="field">
              <text class="label" :class="{ required: problemOptions.length }">问题类型</text>
              <picker :range="problemLabels" :value="problemIndex" @change="onProblem">
                <view class="value">{{ problemLabels[problemIndex] || '请选择' }}</view>
              </picker>
            </view>

            <view class="field">
              <text class="label required">处理部门</text>
              <dept-tree-picker v-model="form.deptId" :depts="deptFlat" :disabled="isDeptLocked" @change="onDept" />
              <text v-if="deptLockHint" class="hint warn">{{ deptLockHint }}</text>
              <text v-else-if="handlerPairDisplay && handlerPairDisplay !== '-'" class="hint">
                处理人/负责人：{{ handlerPairDisplay }}
              </text>
            </view>

            <view class="field">
              <text class="label required">期望完成日期</text>
              <picker mode="date" :value="form.demandFinishTime" :start="today" @change="onFinishDate">
                <view class="value">{{ form.demandFinishTime || '请选择' }}</view>
              </picker>
              <text v-if="urgencyName" class="hint">
                紧急程度：
                <text class="urgency-chip" :class="urgencyTone">{{ urgencyName }}</text>
              </text>
            </view>
          </view>
        </view>

        <!-- 客诉：被投诉部门 / 被投诉人 -->
        <view v-if="form.abnormalType === '客诉'" class="pm-card form-card">
          <text class="card-title">投诉对象</text>
          <view class="card-tip danger">
            客诉附件必须是来自客户的投诉，客户的需求不算投诉
          </view>
          <view class="field-stack">
            <view class="field">
              <text class="label">被投诉部门</text>
              <dept-tree-picker v-model="form.complaintDeptId" :depts="deptFlat" @change="onComplaintDept" />
            </view>
            <view class="field">
              <text class="label">被投诉人</text>
              <picker :range="complaintUserLabels" :value="complaintUserIndex" @change="onComplaintUser">
                <view class="value">{{ complaintUserLabels[complaintUserIndex] || '请选择' }}</view>
              </picker>
            </view>
          </view>
          <text class="card-foot">被投诉部门与被投诉人至少填一项</text>
        </view>

        <!-- 售后：扩展字段 -->
        <view v-if="form.abnormalType === '售后'" class="pm-card form-card">
          <text class="card-title">售后信息</text>
          <view class="field-stack">
            <view v-for="f in visibleExtFields" :key="f.prop" class="field">
              <text class="label" :class="{ required: f.required }">{{ f.label }}</text>
              <input
                v-if="f.type === 'input'"
                v-model="form.afterSalesExt[f.prop]"
                class="input"
                :placeholder="f.placeholder || '请输入' + f.label"
                :maxlength="f.maxLength || -1"
              />
              <input
                v-else-if="f.type === 'number'"
                v-model="form.afterSalesExt[f.prop]"
                class="input"
                type="digit"
                :placeholder="f.placeholder || '请输入' + f.label"
              />
            </view>
            <view class="field">
              <text class="label required">发生时间段</text>
              <view class="datetime-row">
                <view class="datetime-half">
                  <picker mode="date" :value="occurrenceStartDate" @change="e => (occurrenceStartDate = e.detail.value)">
                    <view class="value mini">{{ occurrenceStartDate || '开始日期' }}</view>
                  </picker>
                  <picker mode="time" :value="occurrenceStartTime" @change="e => (occurrenceStartTime = e.detail.value)">
                    <view class="value mini">{{ occurrenceStartTime || '开始时间' }}</view>
                  </picker>
                </view>
                <text class="sep">至</text>
                <view class="datetime-half">
                  <picker mode="date" :value="occurrenceEndDate" @change="e => (occurrenceEndDate = e.detail.value)">
                    <view class="value mini">{{ occurrenceEndDate || '结束日期' }}</view>
                  </picker>
                  <picker mode="time" :value="occurrenceEndTime" @change="e => (occurrenceEndTime = e.detail.value)">
                    <view class="value mini">{{ occurrenceEndTime || '结束时间' }}</view>
                  </picker>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 第 2 步：问题描述 -->
      <view v-if="step === 2" class="step-panel">
        <view class="pm-card form-card">
          <text class="card-title">问题描述</text>
          <textarea
            v-model="form.problemDescription"
            class="textarea"
            maxlength="4000"
            placeholder="请尽量描述清楚，减少无效沟通"
          />
          <text class="label sub">上传照片</text>
          <image-uploader v-model="form.problemAttachments" />
          <text v-if="form.abnormalType === '客诉'" class="card-tip danger">
            客诉类问题必须上传附件，请在问题描述中上传相关附件
          </text>
        </view>
      </view>

      <!-- 第 3 步：处理要求 -->
      <view v-if="step === 3" class="step-panel">
        <view class="pm-card form-card">
          <text class="card-title">处理要求</text>
          <textarea
            v-model="form.demand"
            class="textarea"
            maxlength="4000"
            placeholder="请说明你希望的解决方案和验收标准"
          />
          <text class="label sub">上传照片</text>
          <image-uploader v-model="form.demandAttachments" />
        </view>
      </view>

      <view class="pm-safe-bottom" />
    </view>

    <!-- 底部按钮 -->
    <view class="foot-bar">
      <button v-if="step > 1" class="pm-btn-secondary" @click="prevStep">上一步</button>
      <button v-if="step < 3" class="pm-btn-primary" @click="nextStep">下一步</button>
      <button v-else class="pm-btn-primary" :loading="submitting" :disabled="submitting" @click="submit">提交反馈</button>
    </view>

  </view>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listDept, listUser } from '@/api/system.js'
import { addProductFeedbackList } from '@/api/after-sales.js'
import { abnormalTypes, abnormalToProblems } from '@/constants/afterSales.js'
import {
  afterSalesExtFields,
  buildAfterSalesExtDefaults,
  serializeAfterSalesExt,
  validateAfterSalesExt,
  AFTER_SALES_PROBLEM_DESCRIPTION_TEXT
} from '@/utils/afterSalesExt.js'
import { getUrgencyLabel, getUrgencyTone } from '@/utils/urgencyDisplay.js'
import { normalizeDeptList, normalizeUserList } from '@/utils/apiResponse.js'
import { buildRichHtml, hasMediaInHtml } from '@/utils/richText.js'
import DeptTreePicker from '@/components/dept-tree-picker/dept-tree-picker.vue'
import ImageUploader from '@/components/image-uploader/image-uploader.vue'

const steps = ['基础信息', '问题描述', '处理要求']
const step = ref(1)
const submitting = ref(false)

const form = reactive({
  fid: undefined,
  fbillno: undefined,
  deptId: undefined,
  theFirstHandlerId: undefined,
  interventionPersonnelId: undefined,
  abnormalType: '',
  problemType: '',
  demandFinishTime: '',
  urgencyLevel: undefined,
  problemDescription: '',
  demand: '',
  complaintDeptId: undefined,
  complaintUserId: undefined,
  afterSalesExt: buildAfterSalesExtDefaults(),
  // 附件列表，提交时与文字组合成 HTML
  problemAttachments: [],
  demandAttachments: []
})

const deptTree = ref([])
const deptFlat = ref([])
const deptMap = ref({})
const userList = ref([])
const complaintDeptIndex = ref(-1)
const complaintUserIndex = ref(-1)
const abnormalIndex = ref(-1)
const problemIndex = ref(-1)
const deptIndex = ref(-1)

// 售后发生时间段：日期 + 时间 分开选，提交时拼接
const occurrenceStartDate = ref('')
const occurrenceStartTime = ref('00:00')
const occurrenceEndDate = ref('')
const occurrenceEndTime = ref('23:59')

const QUALITY_DEPT_NAME = '品质部'

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const projectTitle = computed(() => (form._customer ? form._customer + ' - 反馈' : '添加反馈'))
const abnormalLabels = abnormalTypes.map((a) => a.label)
const problemOptions = computed(() => abnormalToProblems[form.abnormalType] || [])
const problemLabels = computed(() => problemOptions.value.map((p) => p.label))
const deptLabels = computed(() => deptFlat.value.map((d) => d.deptName))

// 从实际可选列表中查找品质部（避免 deptMap 构建时机/ key 类型问题）
const qualityDeptId = computed(() => {
  const found = deptFlat.value.find((d) => {
    const name = String(d.deptName || '').trim()
    return name === QUALITY_DEPT_NAME || name.includes(QUALITY_DEPT_NAME)
  })
  return found ? Number(found.deptId) : undefined
})

const isDeptLocked = computed(() => {
  if (!qualityDeptId.value) return false
  return form.abnormalType === '售后' || form.abnormalType === '客诉'
})

const deptLockHint = computed(() => {
  if ((form.abnormalType === '售后' || form.abnormalType === '客诉') && !qualityDeptId.value) {
    return `未找到${QUALITY_DEPT_NAME}，请手动选择`
  }
  if (!isDeptLocked.value) return ''
  return `已自动选择${QUALITY_DEPT_NAME}`
})

const complaintDeptLabels = computed(() => ['请选择'].concat(deptFlat.value.map((d) => d.deptName)))
const complaintUserLabels = computed(() => ['请选择'].concat(userList.value.map((u) => userDisplayName(u))))

const visibleExtFields = computed(() => afterSalesExtFields.filter((f) => f.prop !== 'occurrenceTimeRange'))

const urgencyName = computed(() => getUrgencyLabel(form.urgencyLevel))
const urgencyTone = computed(() => getUrgencyTone(form.urgencyLevel))

function userDisplayName(u) {
  const name = u.nickName || u.userName || ''
  const deptName = (deptMap.value[u.deptId] && deptMap.value[u.deptId].deptName) || ''
  return deptName ? `${name}（${deptName}）` : name
}

function findNearestDeptWithLeader(currentDeptId) {
  if (!currentDeptId && currentDeptId !== 0) return null
  const deptId = Number(currentDeptId)
  if (!Number.isFinite(deptId) || deptId <= 0) return null
  const dept = deptMap.value[deptId]
  if (!dept) return null
  const leaderId = Number(dept.leader || 0)
  if (leaderId > 0) return dept
  const parentId = Number(dept.parentId || 0)
  if (parentId > 0) return findNearestDeptWithLeader(parentId)
  return null
}

function applyDeptHandlers(deptId) {
  const targetDept = findNearestDeptWithLeader(deptId)
  if (!targetDept) {
    form.theFirstHandlerId = undefined
    form.interventionPersonnelId = undefined
    return
  }
  const leaderId = Number(targetDept.leader || 0)
  const firstHandlerId = Number(targetDept.firstContactUserId || 0)
  form.theFirstHandlerId = firstHandlerId > 0 ? firstHandlerId : leaderId > 0 ? leaderId : undefined
  form.interventionPersonnelId = leaderId > 0 ? leaderId : undefined
}

const handlerPairDisplay = computed(() => {
  const dept = findNearestDeptWithLeader(form.deptId)
  if (!dept) return '-'
  const a = (dept.viewInfo?.firstContactNameText || dept.firstContactUserName || '').trim()
  const b = (dept.viewInfo?.leaderNameText || dept.leaderName || '').trim()
  if (!a && !b) return '-'
  if (a && b && a === b) return a
  if (a && b) return `${a}/${b}`
  return a || b
})

function calcUrgency(dateStr) {
  if (!dateStr) {
    form.urgencyLevel = undefined
    return
  }
  const end = new Date(String(dateStr).replace(/-/g, '/') + ' 23:59:59').getTime()
  const diffDays = (end - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) form.urgencyLevel = '0'
  else if (diffDays <= 3) form.urgencyLevel = '1'
  else if (diffDays <= 5) form.urgencyLevel = '2'
  else if (diffDays <= 14) form.urgencyLevel = '3'
  else if (diffDays <= 30) form.urgencyLevel = '4'
  else if (diffDays <= 90) form.urgencyLevel = '5'
  else form.urgencyLevel = '6'
}

function applyQualityDept() {
  const id = qualityDeptId.value
  if (!id || !isDeptLocked.value) return
  if (form.deptId !== id) {
    form.deptId = id
    applyDeptHandlers(id)
  }
}

function syncDeptIndex() {
  deptIndex.value = deptFlat.value.findIndex((d) => Number(d.deptId) === Number(form.deptId))
}

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  form.abnormalType = abnormalTypes[abnormalIndex.value].value
  form.problemType = ''
  problemIndex.value = -1
  if (form.abnormalType === '售后' && !form.problemDescription) {
    form.problemDescription = AFTER_SALES_PROBLEM_DESCRIPTION_TEXT
  }
  nextTick(() => {
    applyQualityDept()
    syncDeptIndex()
  })
}

function onProblem(e) {
  problemIndex.value = Number(e.detail.value)
  form.problemType = problemOptions.value[problemIndex.value].value
}

function onDept(deptId) {
  form.deptId = deptId
  applyDeptHandlers(form.deptId)
}

function onFinishDate(e) {
  form.demandFinishTime = e.detail.value
  calcUrgency(form.demandFinishTime)
}

function onComplaintDept(deptId) {
  form.complaintDeptId = deptId
}

function onComplaintUser(e) {
  complaintUserIndex.value = Number(e.detail.value)
  const idx = complaintUserIndex.value - 1
  const u = userList.value[idx]
  form.complaintUserId = u ? u.userId : undefined
}

function validateBasic() {
  if (!form.abnormalType) return '请选择异常类型'
  if (problemOptions.value.length && !form.problemType) return '请选择问题类型'
  if (!form.deptId) return '请选择处理部门'
  if (!form.demandFinishTime) return '请选择期望完成日期'
  if (form.abnormalType === '客诉') {
    if (!form.complaintDeptId && !form.complaintUserId) return '请选择被投诉部门或被投诉人'
  }
  if (form.abnormalType === '售后') {
    form.afterSalesExt.occurrenceTimeRange = [
      occurrenceStartDate.value && occurrenceStartTime.value ? `${occurrenceStartDate.value} ${occurrenceStartTime.value}:00` : '',
      occurrenceEndDate.value && occurrenceEndTime.value ? `${occurrenceEndDate.value} ${occurrenceEndTime.value}:00` : ''
    ]
    const err = validateAfterSalesExt(form.afterSalesExt)
    if (err) return err
  }
  return ''
}

function validateDescription() {
  const text = String(form.problemDescription || '').trim()
  const hasAtta = (form.problemAttachments || []).length > 0
  if (!text && !hasAtta) return '请填写问题描述或上传附件'
  if (form.abnormalType === '客诉') {
    const html = buildRichHtml(form.problemDescription, form.problemAttachments)
    if (!hasMediaInHtml(html)) return '客诉类问题必须上传图片或附件'
  }
  return ''
}

function validateDemand() {
  const text = String(form.demand || '').trim()
  const hasAtta = (form.demandAttachments || []).length > 0
  if (!text && !hasAtta) return '请填写处理要求或上传附件'
  return ''
}

function nextStep() {
  if (step.value === 1) {
    const err = validateBasic()
    if (err) return uni.showToast({ title: err, icon: 'none' })
  }
  if (step.value === 2) {
    const err = validateDescription()
    if (err) return uni.showToast({ title: err, icon: 'none' })
  }
  if (step.value < 3) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

const confirmMessage = computed(() => {
  const dept = deptMap.value[form.deptId]
  const deptName = dept ? dept.deptName : '所选'
  const handlers = handlerPairDisplay.value
  return `您正在给${deptName}部门-${handlers}反馈问题。提交后不支持修改，请确认。`
})

function submit() {
  const err = validateDemand()
  if (err) return uni.showToast({ title: err, icon: 'none' })
  if (form.abnormalType === '售后') {
    form.afterSalesExt.occurrenceTimeRange = [
      occurrenceStartDate.value && occurrenceStartTime.value ? `${occurrenceStartDate.value} ${occurrenceStartTime.value}:00` : '',
      occurrenceEndDate.value && occurrenceEndTime.value ? `${occurrenceEndDate.value} ${occurrenceEndTime.value}:00` : ''
    ]
  }
  uni.showModal({
    title: '确认提交',
    content: confirmMessage.value,
    confirmText: '确认提交',
    cancelText: '再想想',
    success: (res) => {
      if (res.confirm) doSubmit()
    }
  })
}

async function doSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const problemHtml = buildRichHtml(form.problemDescription, form.problemAttachments)
    const demandHtml = buildRichHtml(form.demand, form.demandAttachments)
    const payload = {
      fid: form.fid,
      fbillno: form.fbillno,
      deptId: form.deptId,
      theFirstHandlerId: form.theFirstHandlerId,
      interventionPersonnelId: form.interventionPersonnelId,
      abnormalType: form.abnormalType,
      problemType: form.problemType,
      demandFinishTime: form.demandFinishTime,
      urgencyLevel: form.urgencyLevel,
      problemDescription: problemHtml || undefined,
      demand: demandHtml || undefined,
      complaintDeptIds: form.abnormalType === '客诉' ? (form.complaintDeptId ? [form.complaintDeptId] : []) : [],
      complaintUserIds: form.abnormalType === '客诉' ? (form.complaintUserId ? [form.complaintUserId] : []) : []
    }
    if (form.abnormalType === '售后') {
      payload.afterSalesExt = serializeAfterSalesExt(form.afterSalesExt)
    }
    await addProductFeedbackList(payload)
    uni.showToast({ title: '添加成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  try {
    const [deptRes, userRes] = await Promise.all([
      listDept({ queryDeptAllName: true }),
      listUser({ pageNum: 1, pageSize: 500 })
    ])

    const rows = normalizeDeptList(deptRes)
    deptFlat.value = rows
    deptTree.value = []
    rows.forEach((d) => {
      const id = Number(d.deptId)
      if (id > 0) deptMap.value[id] = d
    })

    userList.value = normalizeUserList(userRes)

    if (!rows.length) {
      uni.showToast({ title: '未获取到有效部门，请检查权限或联系管理员', icon: 'none', duration: 3000 })
    }

    applyQualityDept()
    syncDeptIndex()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[add-feedback] loadData error:', e)
    uni.showToast({ title: (e && e.message) || '数据加载失败', icon: 'none', duration: 3000 })
  }
}

onLoad(async (q) => {
  try {
    if (q.project) {
      const p = JSON.parse(decodeURIComponent(q.project))
      form.fid = p.fid
      form.fbillno = p.fbillno
      form._customer = p.fshortname
    }
  } catch (e) {}
  await loadData()
})

watch(() => form.abnormalType, (val, oldVal) => {
  if (val !== oldVal) {
    form.problemType = ''
    problemIndex.value = -1
    form.complaintDeptId = undefined
    form.complaintUserId = undefined
    complaintDeptIndex.value = -1
    complaintUserIndex.value = -1
  }
  if (oldVal === '售后' && val !== '售后') {
    form.afterSalesExt = buildAfterSalesExtDefaults()
    occurrenceStartDate.value = ''
    occurrenceStartTime.value = '00:00'
    occurrenceEndDate.value = ''
    occurrenceEndTime.value = '23:59'
  }
  if (val === '售后' && (!form.problemDescription || form.problemDescription === AFTER_SALES_PROBLEM_DESCRIPTION_TEXT)) {
    form.problemDescription = AFTER_SALES_PROBLEM_DESCRIPTION_TEXT
  }
  nextTick(() => {
    applyQualityDept()
    syncDeptIndex()
  })
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.add-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(100vh - var(--window-bottom, 0px));
  overflow: hidden;
  background: $pm-bg;
}

/* 项目信息头卡 */
.head-card {
  margin: 16rpx 24rpx 0;
  padding: 24rpx 28rpx;
  background: $pm-grad-hero;
  border-radius: $pm-radius-lg;
  box-shadow: $pm-shadow;
  position: relative;
  overflow: hidden;
}
.head-card::after {
  content: '';
  position: absolute;
  right: -40rpx;
  top: -40rpx;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
.head-title {
  display: block;
  font-size: 32rpx;
  font-weight: 750;
  color: $pm-surface;
  position: relative;
  z-index: 1;
}
.head-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 8rpx;
  position: relative;
  z-index: 1;
}
.meta {
  font-size: 22rpx;
  color: rgba($pm-surface, 0.82);
}
.dot {
  margin: 0 10rpx;
  color: rgba($pm-surface, 0.45);
}

/* 步骤条 */
.step-bar {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  padding: 24rpx 32rpx 12rpx;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  min-width: 120rpx;
}
.step-dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 750;
  color: $pm-muted;
  background: $pm-bg-2;
  border: 2rpx solid $pm-line;
  box-sizing: border-box;
}
.step.active .step-dot {
  background: $pm-primary;
  color: $pm-surface;
  border-color: $pm-primary;
  box-shadow: 0 4rpx 12rpx -2rpx rgba(14, 95, 59, 0.35);
}
.step.done .step-dot {
  background: $pm-sage;
  color: $pm-surface;
  border-color: $pm-sage;
}
.step-name {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $pm-muted;
  font-weight: 650;
}
.step.active .step-name {
  color: $pm-primary;
  font-weight: 750;
}
.step-line {
  width: 96rpx;
  height: 2rpx;
  background: $pm-line;
  margin: 22rpx 12rpx 0;
}
.step.done + .step-line,
.step-line.active {
  background: $pm-sage;
}

/* 滚动内容区 */
.add-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding: 12rpx 24rpx;
}
.step-panel {
  min-height: 0;
}
.form-card {
  margin-bottom: 20rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: $pm-radius-lg;
  box-shadow: $pm-shadow;
}
.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 750;
  color: $pm-text;
  margin-bottom: 24rpx;
  padding-left: 18rpx;
  position: relative;
}
.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8rpx;
  bottom: 8rpx;
  width: 6rpx;
  border-radius: 6rpx;
  background: $pm-grad-brand;
}
.card-tip {
  padding: 14rpx 18rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  line-height: 1.5;
  margin-bottom: 20rpx;
}
.card-tip.danger {
  color: $pm-danger;
  background: $pm-danger-soft;
}
.card-foot {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $pm-muted;
}

/* 单列字段堆叠 */
.field-stack {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.field {
  width: 100%;
  box-sizing: border-box;
}
.label {
  display: block;
  font-size: 26rpx;
  color: $pm-text-secondary;
  margin-bottom: 10rpx;
  font-weight: 700;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
  margin-right: 6rpx;
}
.label.sub {
  margin-top: 20rpx;
  color: $pm-text-secondary;
  font-weight: 650;
}
.label.sub::before {
  content: none;
}
.value,
.input {
  width: 100%;
  box-sizing: border-box;
  min-height: 84rpx;
  line-height: 84rpx;
  padding: 0 26rpx;
  background: $pm-bg;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: $pm-text;
  border: 1px solid transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.value.muted,
.value:empty::before {
  color: $pm-ink-4;
}
.value.active,
.input:focus {
  background: $pm-surface;
  border-color: $pm-primary;
}
.input {
  border: none;
}
.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $pm-primary;
  line-height: 1.4;
}
.hint.warn {
  color: $pm-warn;
}
.urgency-chip {
  display: inline;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}
.urgency-chip.critical {
  background: $pm-danger;
  color: $pm-surface;
}
.urgency-chip.urgent {
  background: $pm-danger-soft;
  color: $pm-danger;
}
.urgency-chip.high {
  background: $pm-warn-soft;
  color: $pm-warn;
}
.urgency-chip.medium {
  background: $pm-copper-soft;
  color: $pm-copper;
}
.urgency-chip.normal {
  background: $pm-info-soft;
  color: $pm-info;
}
.urgency-chip.low,
.urgency-chip.minor {
  background: $pm-bg-2;
  color: $pm-muted;
}

/* 发生时间段：左右两栏 */
.datetime-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}
.datetime-half {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.datetime-row .value.mini {
  width: 100%;
  min-height: 72rpx;
  line-height: 72rpx;
  padding: 0 16rpx;
  text-align: center;
  font-size: 26rpx;
  border-radius: 16rpx;
}
.sep {
  color: $pm-muted;
  font-size: 24rpx;
  flex-shrink: 0;
  padding-top: 0;
}

/* 文本域 */
.textarea {
  width: 100%;
  min-height: 260rpx;
  padding: 22rpx 26rpx;
  background: $pm-bg;
  border-radius: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  line-height: 1.6;
  border: 1px solid transparent;
}
.textarea:focus {
  background: $pm-surface;
  border-color: $pm-primary;
}

/* 底部按钮 */
.foot-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  gap: 20rpx;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: $pm-surface;
  border-top: 1px solid $pm-line;
}
.foot-bar button {
  flex: 1;
  display: block;
  width: 100%;
  margin: 0;
}
.foot-bar button::after {
  border: none;
}
.pm-btn-secondary {
  display: block;
  width: 100%;
  margin: 0;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: $pm-primary;
  background: $pm-surface;
  border: 1px solid $pm-primary;
  box-shadow: $pm-shadow;
}
.pm-btn-secondary::after {
  border: none;
}
</style>
