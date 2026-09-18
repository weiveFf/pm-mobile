<template>
  <view class="img-uploader">
    <view v-if="modelValue.length" class="img-grid">
      <view v-for="(url, i) in modelValue" :key="url + i" class="img-cell">
        <image :src="url" class="img" mode="aspectFill" @click="preview(i)" />
        <text class="img-del" @click.stop="remove(i)">×</text>
      </view>
    </view>
    <view v-if="modelValue.length < max" class="add-btn" @click="choose">
      <text class="add-icon">+</text>
      <text class="add-label">{{ label }}</text>
    </view>
  </view>
</template>

<script setup>
import { uploadImage } from '@/api/common.js'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
  label: { type: String, default: '添加图片' }
})
const emit = defineEmits(['update:modelValue'])

function choose() {
  const remain = props.max - props.modelValue.length
  if (remain <= 0) return
  uni.showActionSheet({
    title: '上传图片',
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
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
  })
}

async function uploadAll(paths) {
  const list = [...props.modelValue]
  for (const path of paths) {
    try {
      uni.showLoading({ title: '上传中…', mask: true })
      const url = await uploadImage(path)
      list.push(url)
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
    content: '删除这张图片？',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        const list = [...props.modelValue]
        list.splice(i, 1)
        emit('update:modelValue', list)
      }
    }
  })
}

function preview(i) {
  uni.previewImage({
    current: props.modelValue[i],
    urls: props.modelValue
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.img-uploader {
  width: 100%;
}
.img-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.img-cell {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 18rpx;
  overflow: hidden;
  background: $pm-bg-2;
}
.img {
  width: 100%;
  height: 100%;
}
.img-del {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 36rpx;
  height: 36rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 24rpx;
}
.add-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 18rpx;
  border: 2rpx dashed $pm-line;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $pm-bg;
}
.add-icon {
  font-size: 48rpx;
  color: $pm-muted;
  line-height: 1;
  margin-bottom: 6rpx;
}
.add-label {
  font-size: 22rpx;
  color: $pm-muted;
}
</style>
