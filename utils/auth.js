import config from '@/config/index.js'

const K = config.storageKeys

export function getToken() {
  return uni.getStorageSync(K.token) || ''
}

export function setToken(token) {
  uni.setStorageSync(K.token, token || '')
}

export function getUserId() {
  return uni.getStorageSync(K.userId) || ''
}

export function setUserId(userId) {
  uni.setStorageSync(K.userId, userId || '')
}

export function getUserName() {
  return uni.getStorageSync(K.userName) || ''
}

export function setUserName(name) {
  uni.setStorageSync(K.userName, name || '')
}

/** 登录账号：后端 Create_by / UserName 口径（昵称不可替代，否则「我创建的」筛不出来） */
export function getAccount() {
  return uni.getStorageSync(K.account) || ''
}

export function setAccount(account) {
  uni.setStorageSync(K.account, account || '')
}

export function getDeptId() {
  return uni.getStorageSync(K.deptId) || ''
}

export function setDeptId(deptId) {
  uni.setStorageSync(K.deptId, deptId != null ? String(deptId) : '')
}

/** 部门负责人 / 第一接口人身份（getInfo 返回），用于详情页指派/转派/客诉审核按钮显隐 */
export function getIsDeptLeader() {
  return uni.getStorageSync(K.isDeptLeader) || ''
}

export function setIsDeptLeader(v) {
  uni.setStorageSync(K.isDeptLeader, v === true || v === 1 || v === '1' ? '1' : '')
}

export function getIsFirstContact() {
  return uni.getStorageSync(K.isFirstContact) || ''
}

export function setIsFirstContact(v) {
  uni.setStorageSync(K.isFirstContact, v === true || v === 1 || v === '1' ? '1' : '')
}

export function normalizeBaseURL(url) {
  return (url || '').trim().replace(/\/+$/, '')
}

export function isValidBaseURL(url) {
  const u = normalizeBaseURL(url)
  if (!u) return false
  // 允许绝对地址（http(s)://…）或同源相对路径（/api）；生产用 Nginx 反代时用后者
  return /^https?:\/\/.+/i.test(u) || u.charAt(0) === '/'
}

export function getBaseURL() {
  const stored = uni.getStorageSync(K.baseURL)
  return normalizeBaseURL(stored) || config.baseURL
}

export function setBaseURL(url) {
  uni.setStorageSync(K.baseURL, normalizeBaseURL(url))
}

export function clearAuth() {
  uni.removeStorageSync(K.token)
  uni.removeStorageSync(K.userId)
  uni.removeStorageSync(K.userName)
  uni.removeStorageSync(K.account)
  uni.removeStorageSync(K.deptId)
  uni.removeStorageSync(K.isDeptLeader)
  uni.removeStorageSync(K.isFirstContact)
}

export function isLoggedIn() {
  return !!getToken()
}

export function getRemember() {
  return !!uni.getStorageSync(K.remember)
}

export function setRemember(val) {
  uni.setStorageSync(K.remember, val ? '1' : '')
}

export function getSavedLogin() {
  return {
    username: uni.getStorageSync(K.savedUser) || '',
    password: uni.getStorageSync(K.savedPwd) || ''
  }
}

export function saveLogin(username, password) {
  uni.setStorageSync(K.savedUser, username)
  uni.setStorageSync(K.savedPwd, password)
}

export function clearSavedLogin() {
  uni.removeStorageSync(K.savedUser)
  uni.removeStorageSync(K.savedPwd)
}
