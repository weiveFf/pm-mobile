<template>
  <view class="atta-uploader">
    <!-- 已上传附件列表 -->
    <view v-if="attachments.length" class="atta-list">
      <view v-for="(item, i) in attachments" :key="item.url + i" class="atta-item">
        <!-- 图片：缩略图 -->
        <template v-if="item.type === 'image'">
          <image :src="item.url" class="atta-thumb" mode="aspectFill" @click="preview(i)" />
        </template>
        <!-- 文件：图标+名称 -->
        <template v-else>
          <view class="atta-file" @click="openFile(item.url)">
            <view class="atta-icon">{{ fileIcon(item.name) }}</view>
            <text class="atta-name">{{ item.name }}</text>
          </view>
        </template>
        <view class="atta-del" @click.stop="remove(i)">
          <text class="atta-del-x">×</text>
        </view>
      </view>
    </view>

    <!-- 添加按钮 -->
    <view v-if="attachments.length < max" class="add-btn pressable" @click="openMenu">
      <view class="add-inner">
        <text class="add-icon">+</text>
        <text class="add-label">{{ label }}</text>
      </view>
    </view>

    <!-- 自定义底部菜单 -->
    <view v-if="menuVisible" class="menu-mask" @click="closeMenu" />
    <view v-if="menuVisible" class="menu-panel">
      <text class="menu-title">添加附件</text>
      <view class="menu-options">
        <view class="menu-cell pressable" @click="chooseCamera">
          <text class="menu-emoji">📷</text>
          <view class="menu-info">
            <text class="menu-name">拍照</text>
            <text class="menu-desc">立即拍摄照片</text>
          </view>
        </view>
        <view class="menu-cell pressable" @click="chooseAlbum">
          <text class="menu-emoji">🖼️</text>
          <view class="menu-info">
            <text class="menu-name">从相册选择</text>
            <text class="menu-desc">选择手机相册中的图片</text>
          </view>
        </view>
      </view>
      <view class="menu-cancel pressable" @click="closeMenu">取消</view>
      <view class="menu-safe" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { uploadImage } from '@/api/common.js'
import { normalizeAttachment } from '@/utils/richText.js'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
  label: { type: String, default: '添加附件' }
})
const emit = defineEmits(['update:modelValue'])

const menuVisible = ref(false)

const attachments = computed(() => {
  return (props.modelValue || [])
    .map(normalizeAttachment)
    .filter(Boolean)
})

function fileIcon(name) {
  const ext = String(name || '').split('.').pop().toLowerCase()
  const map = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    zip: '📦',
    rar: '📦',
    txt: '📃',
    mp4: '🎬',
    mp3: '🎵'
  }
  return map[ext] || '📎'
}

function openMenu() {
  if (attachments.value.length >= props.max) return
  menuVisible.value = true
}

function closeMenu() {
  menuVisible.value = false
}

function chooseCamera() {
  closeMenu()
  chooseImage(['camera'])
}

function chooseAlbum() {
  closeMenu()
  chooseImage(['album'])
}

function chooseImage(sourceType) {
  const remain = props.max - attachments.value.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sourceType,
    sizeType: ['compressed'],
    success: (r) => {
      uploadAll(r.tempFilePaths || [])
    },
    fail: (err) => {
      if (err && err.errMsg && !err.errMsg.includes('cancel')) {
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
    }
  })
}

async function uploadAll(paths) {
  const list = [...attachments.value]
  for (const path of paths) {
    try {
      uni.showLoading({ title: '上传中…', mask: true })
      const url = await uploadImage(path)
      list.push(normalizeAttachment({ url, type: 'image' }))
      emit('update:modelValue', list)
    } catch (e) {
      uni.showToast({ title: (e && e.message) || '上传失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

function remove(i) {
  uni.showModal({
    title: '提示',
    content: '删除这个附件？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        const list = [...attachments.value]
        list.splice(i, 1)
        emit('update:modelValue', list)
      }
    }
  })
}

function preview(i) {
  const urls = attachments.value.filter((a) => a.type === 'image').map((a) => a.url)
  const current = attachments.value[i].url
  uni.previewImage({
    current,
    urls
  })
}

function openFile(url) {
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  uni.showModal({
    title: '文件',
    content: url,
    showCancel: false,
    confirmText: '复制链接',
    success: () => {
      uni.setClipboardData({ data: url, showToast: true })
    }
  })
  // #endif
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.atta-uploader {
  width: 100%;
}

.atta-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.atta-item {
  position: relative;
  width: 176rpx;
  height: 176rpx;
  border-radius: 20rpx;
  overflow: hidden;
  background: $pm-bg-2;
  box-shadow: $pm-shadow;
}
.atta-thumb {
  width: 100%;
  height: 100%;
}
.atta-file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  box-sizing: border-box;
}
.atta-icon {
  font-size: 56rpx;
  line-height: 1;
  margin-bottom: 10rpx;
}
.atta-name {
  font-size: 22rpx;
  color: $pm-text-secondary;
  line-height: 1.3;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}
.atta-del {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0 0 0 14rpx;
}
.atta-del-x {
  color: #fff;
  font-size: 26rpx;
  line-height: 1;
}

.add-btn {
  width: 176rpx;
  height: 176rpx;
  border-radius: 20rpx;
  border: 2rpx dashed rgba($pm-primary, 0.35);
  background: rgba($pm-primary, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.add-icon {
  width: 56rpx;
  height: 56rpx;
  line-height: 52rpx;
  text-align: center;
  border-radius: 50%;
  background: $pm-primary;
  color: #fff;
  font-size: 38rpx;
  font-weight: 400;
  margin-bottom: 10rpx;
}
.add-label {
  font-size: 24rpx;
  color: $pm-primary;
  font-weight: 650;
}

/* 自定义底部菜单 */
.menu-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 998;
}
.menu-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: $pm-surface;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  padding: 24rpx 24rpx 0;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.12);
}
.menu-title {
  text-align: center;
  font-size: 28rpx;
  color: $pm-muted;
  margin-bottom: 16rpx;
}
.menu-options {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.menu-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx;
  background: $pm-bg;
  border-radius: 20rpx;
}
.menu-emoji {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  font-size: 40rpx;
  background: $pm-surface;
  border-radius: 16rpx;
  box-shadow: $pm-shadow;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.menu-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.menu-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $pm-text;
  margin-bottom: 6rpx;
}
.menu-desc {
  font-size: 24rpx;
  color: $pm-muted;
}
.menu-cancel {
  text-align: center;
  padding: 26rpx 0;
  font-size: 30rpx;
  font-weight: 700;
  color: $pm-text-secondary;
  background: $pm-bg;
  border-radius: 20rpx;
}
.menu-safe {
  height: calc(16rpx + env(safe-area-inset-bottom));
}
</style>
