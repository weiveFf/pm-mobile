/**
 * 简易富文本工具：移动端 textarea + 图片列表 ↔ PC 端 wangEditor HTML 兼容
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c] || c)
}

/**
 * 把文字 + 图片 URL 数组组合成与 PC 端 wangEditor 兼容的 HTML
 * 空内容返回空字符串，便于提交时判断是否必填
 */
export function buildRichHtml(text, imageUrls = []) {
  const t = String(text || '').trim()
  const paragraphs = t
    ? `<p>${escapeHtml(t)
        .replace(/\n/g, '<br/>')
        .replace(/(<br\/>)+/g, '</p><p>')}</p>`
    : ''
  const images = (imageUrls || [])
    .filter(Boolean)
    .map(
      (url) =>
        `<img src="${url}" style="max-width: 100%; height: auto; object-fit: contain; display: block; margin: 8px 0;" />`
    )
    .join('')
  return paragraphs + images
}

/**
 * 检查富文本 HTML 里是否包含图片 / 附件 / 视频
 * 用于客诉类反馈的附件强制校验
 */
export function hasMediaInHtml(html) {
  if (!html) return false
  return /<(img|video|iframe|a[^>]*data-w-e-type=['"]attachment['"])[^>]*>/i.test(html)
}

/**
 * 从 HTML 中解析所有 img src，用于详情页预览
 */
export function extractImageSrcs(html) {
  if (!html) return []
  const srcs = []
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m
  while ((m = regex.exec(html)) !== null) {
    srcs.push(m[1])
  }
  return srcs
}

/**
 * 把 PC 端相对路径图片地址补成移动端可访问的完整 URL
 * PC 存入的是 /dev-api/uploads/xxx 或 /prod-api/uploads/xxx
 */
export function resolveRichImageUrl(src, baseURL) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  const base = (baseURL || '').trim().replace(/\/+$/, '')
  // 去掉 /dev-api /prod-api 前缀，统一用当前 baseURL
  const path = src.replace(/^\/?(dev-api|prod-api)\//i, '/')
  if (path.startsWith('/')) return base + path
  return base + '/' + path
}

/**
 * 将富文本 HTML 中的 img src 全部补全，用于详情页 v-html 渲染前
 */
export function fixRichTextImageUrls(html, baseURL) {
  if (!html) return ''
  return html.replace(/<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi, (match, pre, src, post) => {
    return `<img${pre}src="${resolveRichImageUrl(src, baseURL)}"${post}>`
  })
}
