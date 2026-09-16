/**
 * 在 app-service-polyfill 之后加载 JSEncrypt（勿与 polyfill 写在同一文件，避免 import 提升）
 */
// #ifdef APP-PLUS
import './jsencrypt.min.js'
if (typeof globalThis !== 'undefined' && globalThis.window?.JSEncrypt) {
  globalThis.JSEncrypt = globalThis.window.JSEncrypt
}
// #endif
