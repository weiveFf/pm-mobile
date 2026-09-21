import { getBaseURL, normalizeBaseURL } from '@/utils/auth.js'

/**
 * 把上传接口返回的 url / fileName 转为当前环境可访问的地址。
 * 后端 AccessUrl 常带内网或后端 Host（如 192.168.x / yanchengcrm.gnway.vip），
 * 生产 H5 应统一走同源 baseURL + /uploads/...（与 PC 端 wangEditor 一致）。
 */
function toAbsoluteIfNeeded(path) {
  if (!path) return ''
  // #ifdef H5
  try {
    if (path.startsWith('/') && typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin + path
    }
  } catch (e) {
    /* ignore */
  }
  // #endif
  return path
}

export function resolveUploadUrl(input, baseURL) {
  if (input == null || input === '') return ''
  const base = normalizeBaseURL(baseURL || getBaseURL())
  const s = String(input).trim()
  if (!s) return ''

  let path = ''

  // 纯 fileName
  if (!s.includes('/')) {
    path = `${base}/uploads/${s.replace(/^\/+/, '')}`
    return toAbsoluteIfNeeded(path)
  }

  // 从任意绝对/相对地址中提取 /uploads/... 段
  const idx = s.toLowerCase().indexOf('/uploads/')
  if (idx >= 0) {
    path = `${base}${s.substring(idx)}`
    return toAbsoluteIfNeeded(path)
  }

  // 已是 /prod-api/... 或 /dev-api/...，换当前 base 前缀
  if (/^\/(prod-api|dev-api)\//i.test(s)) {
    const tail = s.replace(/^\/(prod-api|dev-api)/i, '')
    path = `${base}${tail.startsWith('/') ? tail : `/${tail}`}`
    return toAbsoluteIfNeeded(path)
  }

  if (s.startsWith('/')) {
    path = `${base}${s}`
    return toAbsoluteIfNeeded(path)
  }

  if (/^https?:\/\//i.test(s)) {
    return s
  }

  path = `${base}/uploads/${s}`
  return toAbsoluteIfNeeded(path)
}

/**
 * 反向：从任意上传地址里提取后端存储用的相对路径 `/uploads/xxx`。
 * 与 PC 端提交 `imageUrls` 的格式保持一致（后端也会归一一次，这里先做更干净）。
 */
export function extractUploadPath(input) {
  const s = String(input == null ? '' : input).trim()
  if (!s) return ''
  const idx = s.toLowerCase().indexOf('/uploads/')
  if (idx >= 0) return s.substring(idx)
  if (/^\/(prod-api|dev-api)\//i.test(s)) {
    const path = s.replace(/^\/(prod-api|dev-api)/i, '')
    return path.startsWith('/') ? path : `/${path}`
  }
  if (s.startsWith('/')) return s
  if (/^https?:\/\//i.test(s)) return s
  return `/uploads/${s.replace(/^\/+/, '')}`
}
