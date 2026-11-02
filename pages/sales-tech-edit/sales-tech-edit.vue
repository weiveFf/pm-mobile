<template>
  <view class="pm-page add-page">
    <app-nav-bar :title="pageTitle" />

    <view v-if="loading" class="pm-empty">加载中…</view>
    <template v-else>
      <view class="head-card">
        <text class="head-title">{{ form.abnormalType || '反馈' }} · 待完善</text>
        <text class="head-sub">{{ combined ? '完善内容后选择转派或内派，一步审核通过' : '完善后提交技术服务部预审' }}</text>
      </view>

      <view class="step-bar">
        <view
          v-for="(s, i) in stepLabels"
          :key="i"
          class="step"
          :class="{ active: step === i + 1, done: step > i + 1 }"
        >
          <view class="step-dot">{{ i + 1 }}</view>
          <text class="step-name">{{ s }}</text>
        </view>
      </view>

      <view class="add-body">
        <view v-if="step === 1" class="step-panel">
          <view class="pm-card form-card">
            <text class="card-title">基础信息</text>
            <view class="field-stack">
              <view class="field">
                <text class="label">异常类型</text>
                <view class="value muted">{{ form.abnormalType || '-' }}</view>
              </view>
              <view v-if="problemOptions.length" class="field">
                <text class="label required">问题类型</text>
                <picker :range="problemLabels" :value="problemIndex" @change="onProblem">
                  <view class="value">{{ problemLabels[problemIndex] || '请选择' }}</view>
                </picker>
              </view>
              <view class="field">
                <text class="label required">期望完成日期</text>
                <picker mode="date" :value="form.demandFinishTime" :start="today" @change="onFinishDate">
                  <view class="value">{{ form.demandFinishTime || '请选择' }}</view>
                </picker>
              </view>
            </view>
          </view>

          <view v-if="form.abnormalType === '客诉'" class="pm-card form-card">
            <text class="card-title">投诉对象</text>
            <view class="field-stack">
              <view class="field">
                <text class="label">被投诉部门</text>
                <dept-tree-picker v-model="form.complaintDeptId" :depts="deptFlat" />
              </view>
              <view class="field">
                <text class="label">被投诉人</text>
                <picker :range="complaintUserLabels" :value="complaintUserIndex" @change="onComplaintUser">
                  <view class="value">{{ complaintUserLabels[complaintUserIndex] || '请选择' }}</view>
                </picker>
              </view>
            </view>
          </view>

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
                />
                <input
                  v-else-if="f.type === 'number'"
                  v-model="form.afterSalesExt[f.prop]"
                  class="input"
                  type="digit"
                />
              </view>
              <view class="field">
                <text class="label required">发生时间段</text>
                <view class="datetime-row">
                  <picker mode="date" :value="occurrenceStartDate" @change="e => (occurrenceStartDate = e.detail.value)">
                    <view class="value mini">{{ occurrenceStartDate || '开始日期' }}</view>
                  </picker>
                  <picker mode="time" :value="occurrenceStartTime" @change="e => (occurrenceStartTime = e.detail.value)">
                    <view class="value mini">{{ occurrenceStartTime || '开始时间' }}</view>
                  </picker>
                  <text class="sep">至</text>
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

        <view v-if="step === 2" class="step-panel">
          <view class="pm-card form-card">
            <text class="card-title">问题描述</text>
            <textarea v-model="form.problemDescription" class="textarea" maxlength="4000" placeholder="请尽量描述清楚" />
            <text class="label sub">上传照片</text>
            <image-uploader v-model="form.problemAttachments" />
          </view>
        </view>

        <view v-if="step === 3" class="step-panel">
          <view class="pm-card form-card">
            <text class="card-title">处理要求</text>
            <textarea v-model="form.demand" class="textarea" maxlength="4000" placeholder="期望解决方案及验收标准" />
            <text class="label sub">上传照片</text>
            <image-uploader v-model="form.demandAttachments" />
          </view>
        </view>

        <view v-if="step === 4 && combined" class="step-panel">
          <view class="pm-card form-card">
            <text class="card-title">审核通过</text>
            <text class="label required">审核通过后</text>
            <radio-group class="radio-group" @change="onAuditRoute">
              <label class="radio-item">
                <radio value="reassign" :checked="auditRoute === 'reassign'" color="#0E5F3B" />
                <text>转派到其他部门</text>
              </label>
              <label class="radio-item">
                <radio value="internal" :checked="auditRoute === 'internal'" color="#0E5F3B" />
                <text>技术服务部内部指派处理人</text>
              </label>
            </radio-group>
            <text v-if="auditRoute === 'reassign'" class="label required">目标部门</text>
            <dept-tree-picker
              v-if="auditRoute === 'reassign'"
              v-model="auditNewDeptId"
              :depts="reassignDeptFlat"
              placeholder="请选择转派部门（树形）"
            />
            <text v-if="auditRoute === 'internal'" class="label required">内部处理人</text>
            <dept-user-tree-picker
              v-if="auditRoute === 'internal'"
              v-model="auditNewHandlerId"
              :depts="techDeptFlat"
              :users="techUsers"
              placeholder="按部门树选择处理人"
            />
            <text class="label">审核说明（可选）</text>
            <textarea v-model="auditRemark" class="textarea" maxlength="2000" placeholder="请输入" />
          </view>
        </view>
        <view class="pm-safe-bottom" />
      </view>

      <view class="foot-bar">
        <button v-if="step > 1" class="pm-btn-secondary" @click="step--">上一步</button>
        <button v-if="step < maxStep" class="pm-btn-primary" @click="nextStep">下一步</button>
        <button v-else class="pm-btn-primary" :loading="submitting" @click="submit">{{ submitLabel }}</button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listDept, listUser } from '@/api/system.js'
import {
  getProductFeedbackById,
  submitSalesSubDeptToTechAudit,
  resubmitSalesTechAudit
} from '@/api/after-sales.js'
import { abnormalToProblems } from '@/constants/afterSales.js'
import {
  afterSalesExtFields,
  buildAfterSalesExtDefaults,
  serializeAfterSalesExt,
  validateAfterSalesExt,
  deserializeAfterSalesExt
} from '@/utils/afterSalesExt.js'
import { normalizeDeptList, normalizeUserList } from '@/utils/apiResponse.js'
import { buildRichHtml, hasMediaInHtml, extractImageSrcs } from '@/utils/richText.js'
import { stripHtml } from '@/utils/feedbackWorkflow.js'
import { isSkippedDeptName } from '@/utils/deptDisplay.js'
import DeptTreePicker from '@/components/dept-tree-picker/dept-tree-picker.vue'
import DeptUserTreePicker from '@/components/dept-user-tree-picker/dept-user-tree-picker.vue'
import ImageUploader from '@/components/image-uploader/image-uploader.vue'

const TECH_SERVICE_DEPT_ID = 288
const BASE_STEPS = ['基础信息', '问题描述', '处理要求']

const step = ref(1)
const loading = ref(true)
const submitting = ref(false)
const feedbackId = ref('')
const flow = ref('complete')
const combined = ref(false)
const auditRoute = ref('reassign')
const auditNewDeptId = ref(undefined)
const auditNewHandlerId = ref(undefined)
const auditRemark = ref('')
const reassignDeptFlat = ref([])
const techDeptFlat = ref([])
const techUsers = ref([])

const form = reactive({
  id: undefined,
  abnormalType: '',
  problemType: '',
  demandFinishTime: '',
  urgencyLevel: undefined,
  problemDescription: '',
  demand: '',
  deptId: undefined,
  theFirstHandlerId: undefined,
  interventionPersonnelId: undefined,
  complaintDeptId: undefined,
  complaintUserId: undefined,
  afterSalesExt: buildAfterSalesExtDefaults(),
  problemAttachments: [],
  demandAttachments: []
})

const deptFlat = ref([])
const userList = ref([])
const problemIndex = ref(-1)
const complaintUserIndex = ref(-1)
const occurrenceStartDate = ref('')
const occurrenceStartTime = ref('00:00')
const occurrenceEndDate = ref('')
const occurrenceEndTime = ref('23:59')

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const stepLabels = computed(() => {
  if (flow.value === 'resubmit') return BASE_STEPS
  if (combined.value) return BASE_STEPS.concat(['审核通过'])
  return BASE_STEPS
})
const maxStep = computed(() => stepLabels.value.length)

const pageTitle = computed(() => {
  if (flow.value === 'resubmit') return '修改并重新提交'
  if (combined.value) return '完善并通过审核'
  return '完善并提交审核'
})
const submitLabel = computed(() => {
  if (flow.value === 'resubmit') return '重新提交审核'
  if (combined.value) return '完善并通过审核'
  return '提交技术服务部审核'
})
const problemOptions = computed(() => abnormalToProblems[form.abnormalType] || [])
const problemLabels = computed(() => problemOptions.value.map((p) => p.label))
const visibleExtFields = computed(() => afterSalesExtFields.filter((f) => f.prop !== 'occurrenceTimeRange'))
const complaintUserLabels = computed(() => ['请选择'].concat(userList.value.map((u) => u.nickName || u.userName || '')))

function htmlToEditFields(html) {
  const srcs = extractImageSrcs(html || '')
  return {
    text: stripHtml(html),
    attachments: srcs.map((url) => ({ url, type: 'image' }))
  }
}

function syncOccurrenceFromExt(ext) {
  const start = ext.occurrenceStartTime || (ext.occurrenceTimeRange && ext.occurrenceTimeRange[0]) || ''
  const end = ext.occurrenceEndTime || (ext.occurrenceTimeRange && ext.occurrenceTimeRange[1]) || ''
  if (start) {
    const [d, t] = String(start).split(' ')
    occurrenceStartDate.value = d || ''
    occurrenceStartTime.value = (t || '00:00:00').slice(0, 5)
  }
  if (end) {
    const [d, t] = String(end).split(' ')
    occurrenceEndDate.value = d || ''
    occurrenceEndTime.value = (t || '23:59:59').slice(0, 5)
  }
}

function fillFromFeedback(fb) {
  const extRaw = { ...(fb.afterSalesExt ?? fb.AfterSalesExt ?? {}) }
  deserializeAfterSalesExt(extRaw)
  form.id = fb.id
  form.abnormalType = fb.abnormalType ?? fb.AbnormalType ?? ''
  form.problemType = fb.problemType ?? fb.ProblemType ?? ''
  form.demandFinishTime = fb.demandFinishTime ? String(fb.demandFinishTime).slice(0, 10) : ''
  form.deptId = fb.deptId ?? fb.DeptId
  form.theFirstHandlerId = fb.theFirstHandlerId ?? fb.TheFirstHandlerId
  form.interventionPersonnelId = fb.interventionPersonnelId ?? fb.InterventionPersonnelId
  form.urgencyLevel = fb.urgencyLevel ?? fb.UrgencyLevel
  form.afterSalesExt = { ...buildAfterSalesExtDefaults(), ...extRaw }
  syncOccurrenceFromExt(form.afterSalesExt)

  const cDeptIds = fb.complaintDeptIds ?? fb.ComplaintDeptIds
  form.complaintDeptId = Array.isArray(cDeptIds) && cDeptIds.length ? cDeptIds[0] : fb.complaintDeptId
  const cUserIds = fb.complaintUserIds ?? fb.ComplaintUserIds
  form.complaintUserId = Array.isArray(cUserIds) && cUserIds.length ? cUserIds[0] : fb.complaintUserId

  const prob = htmlToEditFields(fb.problemDescription ?? fb.ProblemDescription)
  form.problemDescription = prob.text
  form.problemAttachments = prob.attachments
  const dem = htmlToEditFields(fb.demand ?? fb.Demand)
  form.demand = dem.text
  form.demandAttachments = dem.attachments

  problemIndex.value = problemOptions.value.findIndex((p) => p.value === form.problemType)
  const cuIdx = userList.value.findIndex((u) => Number(u.userId) === Number(form.complaintUserId))
  complaintUserIndex.value = cuIdx >= 0 ? cuIdx + 1 : 0
}

function calcUrgency(dateStr) {
  if (!dateStr) return
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

function onProblem(e) {
  problemIndex.value = Number(e.detail.value)
  form.problemType = problemOptions.value[problemIndex.value].value
}

function onFinishDate(e) {
  form.demandFinishTime = e.detail.value
  calcUrgency(form.demandFinishTime)
}

function onComplaintUser(e) {
  complaintUserIndex.value = Number(e.detail.value)
  const idx = complaintUserIndex.value - 1
  form.complaintUserId = idx >= 0 ? userList.value[idx].userId : undefined
}

function validateBasic() {
  if (problemOptions.value.length && !form.problemType) return '请选择问题类型'
  if (!form.demandFinishTime) return '请选择期望完成日期'
  if (form.abnormalType === '客诉') {
    if (!form.complaintDeptId && !form.complaintUserId) return '请选择被投诉部门或被投诉人'
  }
  if (form.abnormalType === '售后') {
    form.afterSalesExt.occurrenceTimeRange = [
      occurrenceStartDate.value && occurrenceStartTime.value
        ? `${occurrenceStartDate.value} ${occurrenceStartTime.value}:00`
        : '',
      occurrenceEndDate.value && occurrenceEndTime.value
        ? `${occurrenceEndDate.value} ${occurrenceEndTime.value}:00`
        : ''
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
    if (!hasMediaInHtml(html)) return '客诉须上传图片或附件'
  }
  return ''
}

function validateDemandStep() {
  const text = String(form.demand || '').trim()
  const hasAtta = (form.demandAttachments || []).length > 0
  if (!text && !hasAtta) return '请填写处理要求或上传附件'
  return ''
}

function collectTechDeptIdSet(rows, rootId) {
  const set = new Set([rootId])
  ;(rows || []).forEach((d) => {
    const did = Number(d.deptId)
    if (!Number.isFinite(did) || did <= 0) return
    const ans = String(d.ancestors || '')
    if (did === rootId || ans.split(',').some((p) => Number(p) === rootId)) {
      set.add(did)
    }
  })
  return set
}

async function loadAuditOptions() {
  const rows = deptFlat.value || []
  reassignDeptFlat.value = rows
    .filter((d) => !isSkippedDeptName(d.deptName))
    .map((d) => ({
      ...d,
      disabled: Number(d.deptId) === TECH_SERVICE_DEPT_ID
    }))
  const techIds = collectTechDeptIdSet(rows, TECH_SERVICE_DEPT_ID)
  techDeptFlat.value = rows.filter((d) => techIds.has(Number(d.deptId)))
  techUsers.value = (userList.value || []).filter((u) => techIds.has(Number(u.deptId)))
}

function onAuditRoute(e) {
  auditRoute.value = e.detail.value === 'internal' ? 'internal' : 'reassign'
}

function validateAuditStep() {
  if (!combined.value || flow.value === 'resubmit') return ''
  if (auditRoute.value === 'reassign' && !auditNewDeptId.value) return '请选择转派部门'
  if (auditRoute.value === 'internal' && !auditNewHandlerId.value) return '请选择内部处理人'
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
  if (step.value === 3) {
    const err = validateDemandStep()
    if (err) return uni.showToast({ title: err, icon: 'none' })
  }
  if (step.value < maxStep.value) step.value++
}

async function submit() {
  const err = validateDemandStep()
  if (err) return uni.showToast({ title: err, icon: 'none' })
  const errBasic = validateBasic()
  if (errBasic) return uni.showToast({ title: errBasic, icon: 'none' })
  const errDesc = validateDescription()
  if (errDesc) return uni.showToast({ title: errDesc, icon: 'none' })
  const errAudit = validateAuditStep()
  if (errAudit) {
    step.value = maxStep.value
    return uni.showToast({ title: errAudit, icon: 'none' })
  }

  calcUrgency(form.demandFinishTime)
  const payload = {
    id: form.id,
    deptId: form.deptId,
    theFirstHandlerId: form.theFirstHandlerId,
    interventionPersonnelId: form.interventionPersonnelId,
    abnormalType: form.abnormalType,
    problemType: form.problemType,
    demandFinishTime: form.demandFinishTime,
    urgencyLevel: form.urgencyLevel,
    problemDescription: buildRichHtml(form.problemDescription, form.problemAttachments) || undefined,
    demand: buildRichHtml(form.demand, form.demandAttachments) || undefined,
    complaintDeptIds: form.abnormalType === '客诉' ? (form.complaintDeptId ? [form.complaintDeptId] : []) : [],
    complaintUserIds: form.abnormalType === '客诉' ? (form.complaintUserId ? [form.complaintUserId] : []) : []
  }
  if (form.abnormalType === '售后') {
    payload.afterSalesExt = serializeAfterSalesExt(form.afterSalesExt)
  }

  if (combined.value && flow.value !== 'resubmit') {
    const remark = String(auditRemark.value || '').trim()
    payload.techAuditApproveOnSubmit = {
      feedbackId: form.id,
      route: auditRoute.value,
      newDeptId: auditRoute.value === 'reassign' ? auditNewDeptId.value : undefined,
      newTheFirstHandlerId: auditRoute.value === 'internal' ? auditNewHandlerId.value : undefined,
      remark: remark || undefined
    }
  }

  submitting.value = true
  try {
    if (flow.value === 'resubmit') {
      await resubmitSalesTechAudit(payload)
      uni.showToast({ title: '已重新提交', icon: 'success' })
    } else if (combined.value) {
      await submitSalesSubDeptToTechAudit(payload)
      uni.showToast({ title: '已完善并通过审核', icon: 'success' })
    } else {
      await submitSalesSubDeptToTechAudit(payload)
      uni.showToast({ title: '已提交审核', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function loadAll() {
  loading.value = true
  try {
    const [deptRes, userRes, detailRes] = await Promise.all([
      listDept({ queryDeptAllName: true }),
      listUser({ pageNum: 1, pageSize: 500 }),
      getProductFeedbackById(feedbackId.value)
    ])
    deptFlat.value = normalizeDeptList(deptRes)
    userList.value = normalizeUserList(userRes)
    const fb = detailRes && (detailRes.data || detailRes)
    if (!fb || !fb.id) {
      uni.showToast({ title: '反馈不存在', icon: 'none' })
      return
    }
    fillFromFeedback(fb)
    if (combined.value && flow.value !== 'resubmit') {
      await loadAuditOptions()
    }
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onLoad((q) => {
  feedbackId.value = q.id || ''
  flow.value = q.flow === 'resubmit' ? 'resubmit' : 'complete'
  combined.value = q.combined === '1' || q.combined === 1 || q.combined === true
  if (!feedbackId.value) {
    uni.showToast({ title: '缺少反馈 ID', icon: 'none' })
    return
  }
  loadAll()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.add-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: $pm-bg;
}
.head-card {
  margin: 16rpx 24rpx 0;
  padding: 24rpx 28rpx;
  background: $pm-grad-hero;
  border-radius: $pm-radius-lg;
  box-shadow: $pm-shadow;
}
.head-title {
  display: block;
  font-size: 32rpx;
  font-weight: 750;
  color: $pm-surface;
}
.head-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}
.step-bar {
  display: flex;
  justify-content: center;
  padding: 24rpx 32rpx 12rpx;
  gap: 24rpx;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background: $pm-bg-2;
  border: 2rpx solid $pm-line;
}
.step.active .step-dot {
  background: $pm-primary;
  color: #fff;
  border-color: $pm-primary;
}
.step-name {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $pm-muted;
}
.step.active .step-name {
  color: $pm-primary;
  font-weight: 750;
}
.add-body {
  flex: 1;
  overflow-y: auto;
  padding: 12rpx 24rpx;
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
  margin-bottom: 24rpx;
}
.field-stack {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  margin-bottom: 10rpx;
  font-weight: 700;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
  margin-right: 6rpx;
}
.value,
.input {
  min-height: 84rpx;
  line-height: 84rpx;
  padding: 0 26rpx;
  background: $pm-bg;
  border-radius: 20rpx;
  font-size: 28rpx;
}
.value.muted {
  color: $pm-muted;
}
.textarea {
  width: 100%;
  min-height: 260rpx;
  padding: 22rpx 26rpx;
  background: $pm-bg;
  border-radius: 24rpx;
  box-sizing: border-box;
}
.datetime-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}
.value.mini {
  min-height: 72rpx;
  line-height: 72rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
}
.sep {
  color: $pm-muted;
  font-size: 24rpx;
}
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
}
.foot-bar {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: $pm-surface;
  border-top: 1px solid $pm-line;
}
.foot-bar button {
  flex: 1;
}
</style>
