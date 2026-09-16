// #ifdef H5
import './jsencrypt.min.js'
// #endif

function getJSEncrypt() {
  if (typeof globalThis !== 'undefined' && globalThis.JSEncrypt) {
    return globalThis.JSEncrypt
  }
  if (typeof window !== 'undefined' && window.JSEncrypt) {
    return window.JSEncrypt
  }
  return null
}

export function encryptLoginPayload(username, password, publicKeyPem) {
  const JSEncrypt = getJSEncrypt()
  if (!JSEncrypt) {
    throw new Error('JSEncrypt 未加载，请在 H5 或已注入加密库的环境使用')
  }
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKeyPem)
  const payload = JSON.stringify({
    username: (username || '').trim(),
    password: password || ''
  })
  const encrypted = encryptor.encrypt(payload)
  if (!encrypted) {
    throw new Error('密码加密失败')
  }
  return encrypted
}
