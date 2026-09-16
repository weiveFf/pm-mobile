<template>
  <view class="pm-page">
    <app-nav-bar title="添加反馈" />
    <view class="form">
      <view class="pm-card">
        <text class="pm-card-title">{{ projectTitle }}</text>
        <view class="pm-card-meta">FID：{{ form.fid || '-' }} · 订单：{{ form.fbillno || '-' }}</view>
      </view>

      <view class="pm-card">
        <view class="field">
          <text class="label required">异常类型</text>
          <picker :range="abnormalLabels" :value="abnormalIndex" @change="onAbnormal">
            <view class="value">{{ abnormalLabels[abnormalIndex] || '请选择' }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">问题类型</text>
          <picker :range="problemLabels" :value="problemIndex" :disabled="!problemOptions.length" @change="onProblem">
            <view class="value">{{ problemLabels[problemIndex] || '请选择' }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label required">处理部门</text>
          <picker :range="deptLabels" :value="deptIndex" @change="onDept">
            <view class="value">{{ deptLabels[deptIndex] || '请选择' }}</view>
          </picker>
          <text v-if="handlerHint" class="hint">处理人/负责人：{{ handlerHint }}</text>
        </view>
        <view class="field">
          <text class="label required">期望完成日期</text>
          <picker mode="date" :value="form.demandFinishTime" :start="today" @change="onFinishDate">
            <view class="value">{{ form.demandFinishTime || '请选择' }}</view>
          </picker>
          <text v-if="urgencyText" class="hint">紧急程度：{{ urgencyText }}</text>
        </view>
      </view>

      <view v-if="form.abnormalType === '售后'" class="pm-card">
        <view v-for="f in extFields" :key="f.prop" class="field">
          <text class="label" :class="{ required: f.required }">{{ f.label }}</text>
          <template v-if="f.type === 'datetimerange'">
            <picker mode="date" :value="extStart" @change="(e) => (extStart = e.detail.value)">
              <view class="value">开始：{{ extStart || '选择' }}</view>
            </picker>
            <picker mode="date" :value="extEnd" @change="(e) => (extEnd = e.detail.value)">
              <view class="value">结束：{{ extEnd || '选择' }}</view>
            </picker>
          </template>
          <input
            v-else
            v-model="form.afterSalesExt[f.prop]"
            class="input"
            :type="f.type === 'number' ? 'digit' : 'text'"
            :placeholder="f.label"
          />
        </view>
      </view>

      <view class="pm-card">
        <view class="field">
          <text class="label required">问题描述</text>
          <textarea v-model="form.problemDescription" class="textarea" maxlength="4000" placeholder="请输入问题描述" />
        </view>
        <view class="field">
          <text class="label required">处理要求</text>
          <textarea v-model="form.demand" class="textarea" maxlength="4000" placeholder="请输入处理要求" />
        </view>
      </view>

      <button class="pm-btn-primary submit" :loading="submitting" :disabled="submitting" @click="submit">
        提交反馈
      </button>
      <view class="pm-safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listDept } from '@/api/system.js'
import { addProductFeedbackList } from '@/api/after-sales.js'
import { abnormalTypes, abnormalToProblems } from '@/constants/afterSales.js'
import {
  afterSalesExtFields,
  buildAfterSalesExtDefaults,
  serializeAfterSalesExt,
  validateAfterSalesExt,
  AFTER_SALES_PROBLEM_DESCRIPTION_TEXT
} from '@/utils/afterSalesExt.js'
import { getUrgencyLabel } from '@/utils/urgencyDisplay.js'

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
  afterSalesExt: buildAfterSalesExtDefaults()
})

const submitting = ref(false)
const deptFlat = ref([])
const deptIndex = ref(-1)
const abnormalIndex = ref(-1)
const problemIndex = ref(-1)
const extStart = ref('')
const extEnd = ref('')
const extFields = afterSalesExtFields

const today = (() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
})()

const projectTitle = computed(() => {
  return (form._customer || '项目') + ' - 反馈'
})

const abnormalLabels = abnormalTypes.map((a) => a.label)
const problemOptions = computed(() => abnormalToProblems[form.abnormalType] || [])
const problemLabels = computed(() => problemOptions.value.map((p) => p.label))
const deptLabels = computed(() => deptFlat.value.map((d) => d.deptName))
const handlerHint = computed(() => {
  if (!form.theFirstHandlerId && !form.interventionPersonnelId) return ''
  return (form._handlerName || '') + '/' + (form._leaderName || '')
})
const urgencyText = computed(() => getUrgencyLabel(form.urgencyLevel))

function flattenDepts(nodes, out) {
  ;(nodes || []).forEach((n) => {
    const name = n.deptName || ''
    if (name && name.indexOf('研成工业') < 0 && name.indexOf('待设置部门') < 0) {
      out.push(n)
    }
    if (n.children && n.children.length) flattenDepts(n.children, out)
  })
}

function useDeptList(list) {
  // listDept may return flat or tree; normalize
  if (!list || !list.length) return []
  if (list[0].children) {
    const out = []
    flattenDepts(list, out)
    return out
  }
  return list.filter((n) => {
    const name = n.deptName || ''
    return name.indexOf('研成工业') < 0 && name.indexOf('待设置部门') < 0
  })
}

async function loadDepts() {
  const res = await listDept({ queryDeptAllName: true })
  deptFlat.value = useDeptList(res.data || [])
}

function findDept(id) {
  return deptFlat.value.find((d) => Number(d.deptId) === Number(id))
}

function applyDeptHandlers(deptId) {
  const dept = findDept(deptId)
  if (!dept) {
    form.theFirstHandlerId = undefined
    form.interventionPersonnelId = undefined
    form._handlerName = ''
    form._leaderName = ''
    return
  }
  const leaderId = Number(dept.leader || 0)
  const firstHandlerId = Number(dept.firstContactUserId || 0)
  form.theFirstHandlerId = firstHandlerId > 0 ? firstHandlerId : leaderId > 0 ? leaderId : undefined
  form.interventionPersonnelId = leaderId > 0 ? leaderId : undefined
  form._handlerName = dept.firstContactUserName || dept.leaderName || String(form.theFirstHandlerId || '')
  form._leaderName = dept.leaderName || String(form.interventionPersonnelId || '')
}

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

function onAbnormal(e) {
  abnormalIndex.value = Number(e.detail.value)
  form.abnormalType = abnormalTypes[abnormalIndex.value].value
  form.problemType = ''
  problemIndex.value = -1
  if (form.abnormalType === '售后' && !form.problemDescription) {
    form.problemDescription = AFTER_SALES_PROBLEM_DESCRIPTION_TEXT
  }
}

function onProblem(e) {
  problemIndex.value = Number(e.detail.value)
  form.problemType = problemOptions.value[problemIndex.value].value
}

function onDept(e) {
  deptIndex.value = Number(e.detail.value)
  const d = deptFlat.value[deptIndex.value]
  form.deptId = d ? d.deptId : undefined
  applyDeptHandlers(form.deptId)
}

function onFinishDate(e) {
  form.demandFinishTime = e.detail.value
  calcUrgency(form.demandFinishTime)
}

async function submit() {
  if (!form.abnormalType) {
    uni.showToast({ title: '请选择异常类型', icon: 'none' })
    return
  }
  if (!form.deptId) {
    uni.showToast({ title: '请选择处理部门', icon: 'none' })
    return
  }
  if (!form.demandFinishTime) {
    uni.showToast({ title: '请选择期望完成日期', icon: 'none' })
    return
  }
  if (!form.problemDescription || !String(form.problemDescription).trim()) {
    uni.showToast({ title: '请填写问题描述', icon: 'none' })
    return
  }
  if (!form.demand || !String(form.demand).trim()) {
    uni.showToast({ title: '请填写处理要求', icon: 'none' })
    return
  }
  if (form.abnormalType === '售后') {
    form.afterSalesExt.occurrenceTimeRange = [extStart.value, extEnd.value]
    const err = validateAfterSalesExt(form.afterSalesExt)
    if (err) {
      uni.showToast({ title: err, icon: 'none' })
      return
    }
  }
  calcUrgency(form.demandFinishTime)

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
    problemDescription: form.problemDescription,
    demand: form.demand,
    afterSalesExt: form.abnormalType === '售后' ? serializeAfterSalesExt(form.afterSalesExt) : undefined
  }

  submitting.value = true
  try {
    await addProductFeedbackList(payload)
    uni.showToast({ title: '添加成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
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
  try {
    await loadDepts()
  } catch (e) {
    uni.showToast({ title: '部门加载失败', icon: 'none' })
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.form {
  padding: 16rpx 24rpx 48rpx;
}
.field {
  margin-bottom: 22rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin-bottom: 12rpx;
  font-weight: 700;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
  margin-right: 4rpx;
}
.value,
.input {
  min-height: 84rpx;
  line-height: 84rpx;
  padding: 0 28rpx;
  background: $pm-surface;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: $pm-text;
  box-shadow: $pm-shadow;
}
.textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx 28rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  line-height: 1.55;
  box-shadow: $pm-shadow;
}
.hint {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $pm-primary;
  font-weight: 700;
}
.submit {
  margin-top: 24rpx;
  height: 96rpx;
  line-height: 96rpx;
}
</style>
