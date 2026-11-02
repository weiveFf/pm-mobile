<template>
  <view class="dutp">
    <view class="value" :class="{ muted: !selectedLabel, active: visible }" @click="open">
      {{ selectedLabel || placeholder }}
    </view>

    <view v-if="visible" class="mask" @click="close" />
    <view v-if="visible" class="panel">
      <view class="panel-head">
        <text class="panel-title">选择处理人</text>
        <text class="panel-close" @click="close">关闭</text>
      </view>

      <view class="panel-search">
        <input v-model="keyword" class="search-input" placeholder="搜索姓名或部门" confirm-type="search" />
        <text v-if="keyword" class="search-clear" @click="keyword = ''">清除</text>
      </view>

      <scroll-view scroll-y class="panel-body">
        <view v-if="!renderRows.length" class="empty">无匹配人员</view>
        <view
          v-for="row in renderRows"
          :key="row.key"
          class="node"
          :class="{ active: row.kind === 'user' && modelValue === row.userId, dept: row.kind === 'dept' }"
          :style="{ paddingLeft: row.level * 32 + 24 + 'rpx' }"
          @click="onRowClick(row)"
        >
          <text
            v-if="row.kind === 'dept' && row.hasChildren"
            class="toggle"
            @click.stop="toggleDept(row.deptId)"
          >
            {{ row.expanded ? '−' : '+' }}
          </text>
          <text v-else class="toggle placeholder" />
          <view class="text-block">
            <text class="name">{{ row.title }}</text>
            <text v-if="row.subtitle" class="sub">{{ row.subtitle }}</text>
          </view>
          <text v-if="row.kind === 'user' && modelValue === row.userId" class="check">✓</text>
        </view>
        <view class="panel-safe" />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { buildDeptIndex, deptParentSlashLabel } from '@/utils/deptDisplay.js'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  depts: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' }
})
const emit = defineEmits(['update:modelValue', 'change'])

const visible = ref(false)
const keyword = ref('')
const expanded = ref(new Set())

const deptIndex = computed(() => buildDeptIndex(props.depts))

const deptMap = computed(() => {
  const m = {}
  deptIndex.value.forEach((d, id) => {
    m[String(id)] = d
  })
  return m
})

const usersByDept = computed(() => {
  const m = {}
  ;(props.users || []).forEach((u) => {
    const did = String(u.deptId)
    if (!m[did]) m[did] = []
    m[did].push(u)
  })
  Object.keys(m).forEach((k) => {
    m[k].sort((a, b) =>
      String(a.nickName || a.userName || '').localeCompare(String(b.nickName || b.userName || ''), 'zh-CN')
    )
  })
  return m
})

function buildTree(rows) {
  const idSet = new Set((rows || []).map((r) => String(r.deptId)))
  const roots = (rows || [])
    .filter((r) => !idSet.has(String(r.parentId)))
    .sort((a, b) => Number(b.orderNum || 0) - Number(a.orderNum || 0))

  const build = (parentId) =>
    rows
      .filter((r) => String(r.parentId) === String(parentId))
      .sort((a, b) => Number(b.orderNum || 0) - Number(a.orderNum || 0))
      .map((r) => ({
        ...r,
        children: build(r.deptId)
      }))

  return roots.map((r) => ({ ...r, children: build(r.deptId) }))
}

const tree = computed(() => buildTree(props.depts))

function deptHasVisibleContent(deptId, children) {
  const users = usersByDept.value[String(deptId)] || []
  if (users.length) return true
  return (children || []).some((c) => deptHasVisibleContent(c.deptId, c.children))
}

function flattenDeptTree(nodes, level = 0, out = []) {
  ;(nodes || []).forEach((n) => {
    const did = n.deptId
    const childDepts = n.children || []
    const users = usersByDept.value[String(did)] || []
    const hasChildren = childDepts.length > 0 || users.length > 0
    const isExpanded = expanded.value.has(did) || !!keyword.value

    out.push({
      key: 'd-' + did,
      kind: 'dept',
      deptId: did,
      level,
      title: String(n.deptName || '').trim(),
      subtitle: users.length ? `${users.length} 人` : deptParentSlashLabel(n, deptIndex.value),
      hasChildren,
      expanded: isExpanded
    })

    if (isExpanded) {
      users.forEach((u) => {
        const name = u.nickName || u.userName || `用户${u.userId}`
        out.push({
          key: 'u-' + u.userId,
          kind: 'user',
          userId: u.userId,
          level: level + 1,
          title: name,
          subtitle: deptParentSlashLabel(n, deptIndex.value),
          user: u
        })
      })
      if (childDepts.length) flattenDeptTree(childDepts, level + 1, out)
    }
  })
  return out
}

function searchRows() {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return []
  const out = []
  ;(props.users || []).forEach((u) => {
    const name = String(u.nickName || u.userName || '')
    const dept = deptMap.value[String(u.deptId)]
    const deptLabel = dept ? deptParentSlashLabel(dept, deptIndex.value) : ''
    if (!name.toLowerCase().includes(q) && !deptLabel.toLowerCase().includes(q)) return
    out.push({
      key: 's-' + u.userId,
      kind: 'user',
      userId: u.userId,
      level: 0,
      title: name,
      subtitle: deptLabel,
      user: u
    })
  })
  return out
}

const renderRows = computed(() => {
  if (keyword.value.trim()) return searchRows()
  return flattenDeptTree(tree.value)
})

const selectedLabel = computed(() => {
  const id = props.modelValue
  if (id == null || id === '') return ''
  const u = (props.users || []).find((x) => String(x.userId) === String(id))
  if (!u) return ''
  const dept = deptMap.value[String(u.deptId)]
  const name = u.nickName || u.userName || ''
  const deptLabel = dept ? deptParentSlashLabel(dept, deptIndex.value) : ''
  return deptLabel ? `${name} · ${deptLabel}` : name
})

function open() {
  visible.value = true
  if (!expanded.value.size && tree.value.length) {
    tree.value.forEach((r) => expanded.value.add(r.deptId))
  }
}

function close() {
  visible.value = false
  keyword.value = ''
}

function toggleDept(deptId) {
  if (expanded.value.has(deptId)) expanded.value.delete(deptId)
  else expanded.value.add(deptId)
}

function onRowClick(row) {
  if (row.kind === 'dept') {
    if (row.hasChildren) toggleDept(row.deptId)
    return
  }
  emit('update:modelValue', row.userId)
  emit('change', row.user)
  close()
}

watch(
  () => props.depts,
  () => {
    if (!expanded.value.size && tree.value.length) {
      tree.value.forEach((r) => expanded.value.add(r.deptId))
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.dutp {
  width: 100%;
}
.value {
  width: 100%;
  box-sizing: border-box;
  min-height: 80rpx;
  line-height: 1.4;
  padding: 20rpx 24rpx;
  background: $pm-bg;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: $pm-text;
}
.value.muted {
  color: $pm-ink-4;
  line-height: 80rpx;
  padding-top: 0;
  padding-bottom: 0;
}
.value.active {
  background: $pm-surface;
  border: 1px solid $pm-primary;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 998;
}
.panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72vh;
  background: $pm-surface;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 1rpx solid $pm-line;
}
.panel-title {
  font-size: 32rpx;
  font-weight: 750;
}
.panel-close {
  font-size: 28rpx;
  color: $pm-muted;
}
.panel-search {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  gap: 16rpx;
}
.search-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background: $pm-bg;
  border-radius: 999rpx;
  font-size: 28rpx;
}
.search-clear {
  font-size: 26rpx;
  color: $pm-primary;
  font-weight: 700;
}
.panel-body {
  flex: 1;
  min-height: 0;
  padding: 0 16rpx;
}
.empty {
  text-align: center;
  padding: 60rpx 0;
  color: $pm-muted;
}
.node {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $pm-line;
}
.node.dept .name {
  font-weight: 700;
  color: $pm-text-secondary;
}
.node.active .name {
  color: $pm-primary;
  font-weight: 750;
}
.toggle {
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 8rpx;
  background: $pm-bg-2;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.toggle.placeholder {
  background: transparent;
}
.text-block {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 28rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $pm-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.check {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-primary;
  color: #fff;
  font-size: 22rpx;
  margin-left: 12rpx;
}
.panel-safe {
  height: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
