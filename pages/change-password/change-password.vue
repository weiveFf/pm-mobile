<template>
  <view class="pm-page cp-page">
    <app-nav-bar title="修改密码" />

    <view class="cp-body">
      <view class="intro">
        <text class="intro-t">设置新密码</text>
        <text class="intro-s">账号 {{ account || '-' }} · 修改后请使用新密码登录</text>
      </view>

      <view class="field" :class="{ focus: focusField === 'old' }">
        <text class="lb">原密码</text>
        <input
          v-model="oldPassword"
          class="ipt"
          :password="!showPwd"
          placeholder="请输入原密码"
          placeholder-class="ph"
          confirm-type="next"
          @focus="onFocus('old')"
          @blur="onBlur"
        />
      </view>

      <view class="field" :class="{ focus: focusField === 'new' }">
        <text class="lb">新密码</text>
        <input
          v-model="newPassword"
          class="ipt"
          :password="!showPwd"
          placeholder="请输入新密码"
          placeholder-class="ph"
          confirm-type="next"
          @focus="onFocus('new')"
          @blur="onBlur"
        />
      </view>

      <view class="field" :class="{ focus: focusField === 'confirm' }">
        <text class="lb">确认新密码</text>
        <input
          v-model="confirmPassword"
          class="ipt"
          :password="!showPwd"
          placeholder="请再次输入新密码"
          placeholder-class="ph"
          confirm-type="done"
          @confirm="submit"
          @focus="onFocus('confirm')"
          @blur="onBlur"
        />
      </view>

      <view class="toggle-row pressable" @click="showPwd = !showPwd">
        <view class="eye" :class="{ on: showPwd }">{{ showPwd ? '●' : '○' }}</view>
        <text class="toggle-txt">{{ showPwd ? '隐藏密码' : '显示密码' }}</text>
      </view>

      <!-- 实时规则：命中即变绿，一眼知道还差什么 -->
      <view class="rules">
        <view v-for="r in ruleList" :key="r.text" class="rule" :class="{ ok: r.ok }">
          <view class="rule-dot">
            <text class="rule-dot-txt">{{ r.ok ? '✓' : '' }}</text>
          </view>
          <text class="rule-txt">{{ r.text }}</text>
        </view>
      </view>

      <button class="pm-btn-primary cp-btn" :loading="submitting" :disabled="submitting" @click="submit">
        确认修改
      </button>

      <text class="foot-tip">如忘记原密码，请联系管理员重置</text>
    </view>

    <view class="pm-safe-bottom" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAccount, getUserName } from '@/utils/auth.js'
import { updateUserPwd } from '@/api/system.js'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPwd = ref(false)
const focusField = ref('')
const submitting = ref(false)
const account = ref('')

/** 字符类型数：小写 / 大写 / 数字 / 符号 */
function typeCount(v) {
  if (!v) return 0
  let n = 0
  if (/[a-z]/.test(v)) n += 1
  if (/[A-Z]/.test(v)) n += 1
  if (/\d/.test(v)) n += 1
  if (/[^A-Za-z0-9]/.test(v)) n += 1
  return n
}

/** 与 PC 端 resetPwd 规则一致：≥8 位，且至少包含三类字符 */
const newPwdValid = computed(() => newPassword.value.length >= 8 && typeCount(newPassword.value) >= 3)

const ruleList = computed(() => [
  { text: '长度至少 8 位', ok: newPassword.value.length >= 8 },
  { text: '包含大小写字母、数字、符号中的至少 3 类', ok: typeCount(newPassword.value) >= 3 },
  { text: '两次输入一致', ok: !!newPassword.value && newPassword.value === confirmPassword.value }
])

function onFocus(k) {
  focusField.value = k
}
function onBlur() {
  focusField.value = ''
}

async function submit() {
  if (submitting.value) return
  if (!oldPassword.value) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return
  }
  if (!newPwdValid.value) {
    uni.showToast({ title: '新密码不符合规则', icon: 'none' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  if (newPassword.value === oldPassword.value) {
    uni.showToast({ title: '新密码不能和原密码相同', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await updateUserPwd(oldPassword.value, newPassword.value)
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 900)
  } catch (e) {
    uni.showToast({ title: (e && e.message) || '修改失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

account.value = getAccount() || getUserName()
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.cp-page {
  min-height: 100vh;
}

.cp-body {
  padding: 12rpx 40rpx 40rpx;
}

/* —— 顶部说明 —— */
.intro {
  margin-bottom: 36rpx;
}
.intro-t {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: $pm-text;
  letter-spacing: -0.5rpx;
}
.intro-s {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $pm-muted;
  line-height: 1.5;
}

/* —— 输入卡：沿用登录页字段范式 —— */
.field {
  background: $pm-bg-2;
  border-radius: 28rpx;
  padding: 18rpx 28rpx;
  margin-bottom: 24rpx;
  border: 3rpx solid transparent;
  box-sizing: border-box;
}
.field.focus {
  background: #fff;
  border-color: $pm-primary;
}
.lb {
  display: block;
  font-size: 20rpx;
  color: $pm-muted;
  font-weight: 600;
  margin-bottom: 4rpx;
}
.field.focus .lb {
  color: $pm-primary;
}
.ipt {
  height: 46rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: $pm-text;
}
.ph {
  color: $pm-muted;
}

/* —— 显示 / 隐藏密码 —— */
.toggle-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: fit-content;
  padding: 6rpx 4rpx;
  margin-bottom: 24rpx;
}
.eye {
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  border: 3rpx solid $pm-muted;
  box-sizing: border-box;
  margin-right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: $pm-muted;
  line-height: 1;
}
.eye.on {
  border-color: $pm-primary;
  background: $pm-primary;
  color: #fff;
}
.toggle-txt {
  font-size: 24rpx;
  color: $pm-text-secondary;
  font-weight: 650;
}

/* —— 规则清单 —— */
.rules {
  background: $pm-surface;
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 40rpx;
  box-shadow: $pm-shadow;
}
.rule {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rule + .rule {
  margin-top: 16rpx;
}
.rule-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid $pm-line;
  box-sizing: border-box;
  margin-right: 16rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $pm-bg-2;
}
.rule-dot-txt {
  font-size: 18rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.rule.ok .rule-dot {
  border-color: $pm-primary;
  background: $pm-primary;
}
.rule-txt {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: $pm-text-secondary;
  line-height: 1.5;
}
.rule.ok .rule-txt {
  color: $pm-primary-deep;
  font-weight: 650;
}

.cp-btn {
  display: block;
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  margin: 0;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}
.foot-tip {
  display: block;
  margin-top: 28rpx;
  text-align: center;
  font-size: 22rpx;
  color: $pm-muted;
}
</style>
