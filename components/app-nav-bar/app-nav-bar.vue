<template>
  <!--
    全局约定：所有页面不再显示自绘标题栏与返回按钮。
    - 企微/微信容器：顶部由原生标题栏负责（标题见 utils/wxwork-title.js）
    - 普通浏览器 / 小程序：直接由页面内容承接顶部
    这里只保留一块「状态栏 + 呼吸」占位，避免内容顶到状态栏底下。
  -->
  <view class="nav-placeholder" :style="{ height: topSpace + 'px' }" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// props 全部保留以兼容既有调用（title / show-back / right-text），仅不再渲染
defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  rightText: { type: String, default: '' }
})

defineEmits(['left', 'right'])

const statusBarHeight = ref(0)

onMounted(() => {
  try {
    statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
  } catch (e) {
    statusBarHeight.value = 0
  }
})

const topSpace = computed(() => statusBarHeight.value + 20)
</script>

<style lang="scss" scoped>
.nav-placeholder {
  width: 100%;
}
</style>
