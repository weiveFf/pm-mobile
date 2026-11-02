<template>
  <view class="pm-page">
    <app-nav-bar :title="mode === 'reject' ? '技术服务驳回' : '技术服务审核'" />
    <view class="form">
      <view class="pm-card">
        <template v-if="mode === 'approve'">
          <text class="label required">审核通过后</text>
          <radio-group class="radio-group" @change="onRoute">
            <label class="radio-item">
              <radio value="reassign" :checked="route === 'reassign'" color="#0E5F3B" />
              <text>转派到其他部门</text>
            </label>
            <label class="radio-item">
              <radio value="internal" :checked="route === 'internal'" color="#0E5F3B" />
              <text>技术服务部内部指派处理人</text>
            </label>
          </radio-group>

          <text v-if="route === 'reassign'" class="label required">目标部门</text>
          <dept-tree-picker
            v-if="route === 'reassign'"
            v-model="newDeptId"
            :depts="reassignDeptFlat"
            placeholder="请选择转派部门（树形）"
          />

          <text v-if="route === 'internal'" class="label required">内部处理人</text>
          <dept-user-tree-picker
            v-if="route === 'internal'"
            v-model="newTheFirstHandlerId"
            :depts="techDeptFlat"
            :users="techUsers"
            placeholder="按部门树选择处理人"
          />
        </template>

        <text class="label" :class="{ required: mode === 'reject' }">
          {{ mode === 'reject' ? '驳回说明' : '审核说明（可选）' }}
        </text>
        <textarea v-model="remark" class="textarea" placeholder="请输入" />

        <view class="ops">
          <view v-if="mode === 'approve'" class="approve" @click="doApprove">{{ submitting ? '…' : '确认通过' }}</view>
          <view v-else class="reject" @click="doReject">{{ submitting ? '…' : '确认驳回' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { listDept, listUser } from '@/api/system.js'
import { approveSalesTechAudit, rejectSalesTechAudit } from '@/api/after-sales.js'
import { normalizeDeptList, normalizeUserList } from '@/utils/apiResponse.js'
import { isSkippedDeptName } from '@/utils/deptDisplay.js'
import DeptTreePicker from '@/components/dept-tree-picker/dept-tree-picker.vue'
import DeptUserTreePicker from '@/components/dept-user-tree-picker/dept-user-tree-picker.vue'

const TECH_SERVICE_DEPT_ID = 288

const id = ref('')
const mode = ref('approve')
const remark = ref('')
const submitting = ref(false)
const route = ref('reassign')
const reassignDeptFlat = ref([])
const techDeptFlat = ref([])
const techUsers = ref([])
const newDeptId = ref(undefined)
const newTheFirstHandlerId = ref(undefined)

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

async function loadOptions() {
  const [deptRes, userRes] = await Promise.all([
    listDept({ queryDeptAllName: true }),
    listUser({ pageNum: 1, pageSize: 500, status: '0' })
  ])
  const rows = normalizeDeptList(deptRes)
  reassignDeptFlat.value = rows
    .filter((d) => !isSkippedDeptName(d.deptName))
    .map((d) => ({
      ...d,
      disabled: Number(d.deptId) === TECH_SERVICE_DEPT_ID
    }))

  const techIds = collectTechDeptIdSet(rows, TECH_SERVICE_DEPT_ID)
  techDeptFlat.value = rows.filter((d) => techIds.has(Number(d.deptId)))

  techUsers.value = normalizeUserList(userRes).filter((u) => techIds.has(Number(u.deptId)))
}

function onRoute(e) {
  route.value = e.detail.value === 'internal' ? 'internal' : 'reassign'
}

async function doApprove() {
  if (route.value === 'reassign' && !newDeptId.value) {
    return uni.showToast({ title: '请选择转派部门', icon: 'none' })
  }
  if (route.value === 'internal' && !newTheFirstHandlerId.value) {
    return uni.showToast({ title: '请选择内部处理人', icon: 'none' })
  }
  submitting.value = true
  try {
    await approveSalesTechAudit({
      feedbackId: Number(id.value),
      route: route.value,
      newDeptId: route.value === 'reassign' ? newDeptId.value : undefined,
      newTheFirstHandlerId: route.value === 'internal' ? newTheFirstHandlerId.value : undefined,
      remark: remark.value.trim() || undefined
    })
    uni.showToast({ title: '已通过', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function doReject() {
  if (!remark.value.trim()) {
    return uni.showToast({ title: '请填写驳回说明', icon: 'none' })
  }
  submitting.value = true
  try {
    await rejectSalesTechAudit({ feedbackId: Number(id.value), remark: remark.value.trim() })
    uni.showToast({ title: '已驳回', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((q) => {
  id.value = q.id || ''
  mode.value = q.mode === 'reject' ? 'reject' : 'approve'
  loadOptions().catch(() => uni.showToast({ title: '选项加载失败', icon: 'none' }))
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.form {
  padding: 20rpx;
}
.label {
  display: block;
  font-size: 22rpx;
  color: $pm-muted;
  margin: 20rpx 0 12rpx;
  font-weight: 560;
}
.label.required::before {
  content: '*';
  color: $pm-danger;
  margin-right: 4rpx;
}
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.radio-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
}
.textarea {
  width: 100%;
  min-height: 220rpx;
  padding: 24rpx;
  background: $pm-surface;
  border-radius: 28rpx;
  box-sizing: border-box;
  box-shadow: $pm-shadow;
  line-height: 1.6;
}
.ops {
  margin-top: 28rpx;
}
.approve,
.reject {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 999rpx;
  font-weight: 800;
}
.approve {
  background: $pm-primary;
  color: #fff;
}
.reject {
  background: $pm-danger-soft;
  color: $pm-danger;
}
</style>
