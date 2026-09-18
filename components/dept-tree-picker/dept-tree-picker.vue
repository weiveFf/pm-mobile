<template>
  <view class="dtp">
    <view class="value" :class="{ muted: !selectedName, active: visible, disabled: disabled }" @click="open">
      {{ selectedName || placeholder }}
    </view>

    <view v-if="visible" class="mask" @click="close" />
    <view v-if="visible" class="panel">
      <view class="panel-head">
        <text class="panel-title">选择部门</text>
        <text class="panel-close" @click="close">关闭</text>
      </view>

      <view class="panel-search">
        <input v-model="keyword" class="search-input" placeholder="搜索部门" confirm-type="search" />
        <text v-if="keyword" class="search-clear" @click="keyword = ''">清除</text>
      </view>

      <scroll-view scroll-y class="panel-body">
        <view v-if="!renderNodes.length" class="empty">无匹配部门</view>
        <view
          v-for="node in renderNodes"
          :key="node.deptId"
          class="node"
          :class="{ active: modelValue === node.deptId }"
          :style="{ paddingLeft: (node.level || 0) * 32 + 24 + 'rpx' }"
          @click="select(node)"
        >
          <text
            v-if="node.children && node.children.length"
            class="toggle"
            @click.stop="toggle(node)"
          >
            {{ node.expanded ? '−' : '+' }}
          </text>
          <text v-else class="toggle placeholder" />
          <text class="name">{{ node.deptName }}</text>
          <text v-if="modelValue === node.deptId" class="check">✓</text>
        </view>
        <view class="panel-safe" />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  depts: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])

const visible = ref(false)
const keyword = ref('')
const expanded = ref(new Set())

const selectedName = computed(() => {
  const found = props.depts.find((d) => String(d.deptId) === String(props.modelValue))
  return found ? found.deptName : ''
})

function buildTree(rows) {
  const idSet = new Set((rows || []).map((r) => String(r.deptId)))
  // 父节点不在列表中的节点都视为根节点（兼容过滤掉顶层母公司后的扁平列表）
  const roots = (rows || [])
    .filter((r) => !idSet.has(String(r.parentId)))
    .sort((a, b) => Number(b.orderNum || 0) - Number(a.orderNum || 0))

  const build = (parentId) => {
    return rows
      .filter((r) => String(r.parentId) === String(parentId))
      .sort((a, b) => Number(b.orderNum || 0) - Number(a.orderNum || 0))
      .map((r) => ({
        ...r,
        children: build(r.deptId),
        // 默认全部收起；手动展开的节点记录到 expanded 集合
        expanded: expanded.value.has(r.deptId)
      }))
  }

  return roots.map((r) => ({
    ...r,
    children: build(r.deptId),
    expanded: expanded.value.has(r.deptId)
  }))
}

const tree = computed(() => buildTree(props.depts))

function isMatch(node) {
  if (!keyword.value) return true
  return String(node.deptName || '').toLowerCase().includes(keyword.value.toLowerCase())
}

function collectMatched(nodes, out = []) {
  nodes.forEach((n) => {
    if (isMatch(n)) out.push(n)
    if (n.children && n.children.length) collectMatched(n.children, out)
  })
  return out
}

function flattenVisible(nodes, level = 0) {
  const out = []
  nodes.forEach((n) => {
    out.push({ ...n, level })
    if (n.expanded && n.children && n.children.length) {
      out.push(...flattenVisible(n.children, level + 1))
    }
  })
  return out
}

const renderNodes = computed(() => {
  if (!keyword.value) return flattenVisible(tree.value)
  // 搜索模式：扁平展示匹配节点
  return collectMatched(tree.value).map((n) => ({ ...n, level: 0 }))
})

function open() {
  if (props.disabled) return
  visible.value = true
  // 打开时自动展开选中节点路径
  if (props.modelValue) {
    expandPath(tree.value, props.modelValue)
  }
}

function close() {
  visible.value = false
  keyword.value = ''
}

function expandPath(nodes, targetId) {
  for (const n of nodes) {
    if (String(n.deptId) === String(targetId)) return true
    if (n.children && n.children.length && expandPath(n.children, targetId)) {
      expanded.value.add(n.deptId)
      return true
    }
  }
  return false
}

function toggle(node) {
  if (expanded.value.has(node.deptId)) {
    expanded.value.delete(node.deptId)
  } else {
    expanded.value.add(node.deptId)
  }
}

function select(node) {
  emit('update:modelValue', node.deptId)
  emit('change', node.deptId)
  close()
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) expandPath(tree.value, val)
  },
  { immediate: true }
)

watch(
  () => props.depts,
  () => {
    if (props.modelValue) expandPath(tree.value, props.modelValue)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.dtp {
  width: 100%;
}
.value {
  width: 100%;
  box-sizing: border-box;
  min-height: 80rpx;
  line-height: 80rpx;
  padding: 0 24rpx;
  background: $pm-bg;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: $pm-text;
  border: 1px solid transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.value.muted {
  color: $pm-ink-4;
}
.value.active {
  background: $pm-surface;
  border-color: $pm-primary;
}
.value.disabled {
  background: $pm-bg-2;
  color: $pm-muted;
}

.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 998;
}
.panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70vh;
  background: $pm-surface;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.12);
}
.panel-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 20rpx;
  border-bottom: 1rpx solid $pm-line;
  flex-shrink: 0;
}
.panel-title {
  font-size: 32rpx;
  font-weight: 750;
  color: $pm-text;
}
.panel-close {
  font-size: 28rpx;
  color: $pm-muted;
  padding: 8rpx 12rpx;
}
.panel-search {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 28rpx;
  gap: 16rpx;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
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
  padding: 0 24rpx;
}
.empty {
  text-align: center;
  padding: 60rpx 0;
  color: $pm-muted;
  font-size: 28rpx;
}
.node {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 88rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid $pm-line;
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
  color: $pm-muted;
  font-size: 26rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.toggle.placeholder {
  background: transparent;
}
.name {
  flex: 1;
  font-size: 28rpx;
  color: $pm-text;
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
  margin-left: 16rpx;
  flex-shrink: 0;
}
.panel-safe {
  height: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
