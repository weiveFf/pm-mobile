import { fetchPublicKey, loginEncrypt, fetchUserInfo } from '@/api/login.js'
import { encryptLoginPayload } from '@/utils/encrypt.js'
import { setToken, setUserId, setUserName, setAccount, setDeptId } from '@/utils/auth.js'

/** 完整登录流程（与 YessysWebVue / handheld 对齐） */
export async function doLogin(username, password) {
  const keyRes = await fetchPublicKey()
  const pem = (keyRes.data && (keyRes.data.key || keyRes.data.Key)) || ''
  if (!pem) {
    throw new Error('公钥数据无效')
  }
  const encryptedData = encryptLoginPayload(username, password, pem)
  const loginRes = await loginEncrypt(encryptedData)
  const token = loginRes.data
  if (!token) {
    throw new Error('登录未返回 token')
  }
  setToken(token)
  try {
    const infoRes = await fetchUserInfo()
    const user = infoRes.data && infoRes.data.user
    if (user) {
      setUserId(String(user.userId || ''))
      setUserName(user.nickName || user.userName || username)
      setAccount(user.userName || username)
      setDeptId(user.deptId != null ? user.deptId : '')
    } else {
      setUserName(username)
      setAccount(username)
    }
  } catch (e) {
    setUserName(username)
    setAccount(username)
  }
  return token
}
