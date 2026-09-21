import { getBaseURL, normalizeBaseURL } from '@/utils/auth.js'

/**
 * 把上传接口返回的 url / fileName 转为当前环境可访问的地址。
 * 后端 AccessUrl 常带内网或后端 Host（如 192.168.x / yanchengcrm.gnway.vip），
 * 生产 H5 应统一走同源 baseURL + /uploads/...（与 PC 端 wangEditor 一致）。
 */
export function resolveUploadUrl(input, baseURL) {
  if (input == null || input === '') return ''
  const base = normalizeBaseURL(baseURL || getBaseURL())
  const s = String(input).trim()
  if (!s) return ''

  // 纯 fileName
  if (!s.includes('/')) {
    return `${base}/uploads/${s.replace(/^\/+/, '')}`
  }

  // 从任意绝对/相对地址中提取 /uploads/... 段
  const idx = s.toLowerCase().indexOf('/uploads/')
  if (idx >= 0) {
    return `${base}${s.substring(idx)}`
  }

  // 已是 /prod-api/... 或 /dev-api/...，换当前 base 前缀
  if (/^\/(prod-api|dev-api)\//i.test(s)) {
    const path = s.replace(/^\/(prod-api|dev-api)/i, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }

  if (s.startsWith('/')) {
    return `${base}${s}`
  }

  if (/^https?:\/\//i.test(s)) {
    return s
  }

  return `${base}/uploads/${s}`
}
