/**
 * 简易富文本工具：移动端 textarea + 附件列表 ↔ PC 端 wangEditor HTML 兼容
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

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(String(url || ''))
}

function fileNameFromUrl(url) {
  if (!url) return '附件'
  try {
    const u = new URL(url)
    const name = decodeURIComponent(u.pathname.split('/').pop() || '')
    return name || '附件'
  } catch (e) {
    const name = decodeURIComponent(String(url).split('?')[0].split('/').pop() || '')
    return name || '附件'
  }
}

/**
 * 把附件项统一为 { url, name, type } 对象
 * 支持传入 string / { url } / { url, name, type }
 */
export function normalizeAttachment(item) {
  if (!item) return null
  if (typeof item === 'string') {
    return { url: item, name: fileNameFromUrl(item), type: isImageUrl(item) ? 'image' : 'file' }
  }
  const url = item.url || ''
  const type = item.type || (isImageUrl(url) ? 'image' : 'file')
  return { url, name: item.name || fileNameFromUrl(url), type }
}

/**
 * 把文字 + 附件列表组合成与 PC 端 wangEditor 兼容的 HTML
 * attachments 支持 string[] 或 {url, name?, type?}[]
 * 空内容返回空字符串，便于提交时判断是否必填
 */
export function buildRichHtml(text, attachments = []) {
  const t = String(text || '').trim()
  const paragraphs = t
    ? `<p>${escapeHtml(t)
        .replace(/\n/g, '<br/>')
        .replace(/(<br\/>)+/g, '</p><p>')}</p>`
    : ''

  const list = (attachments || [])
    .map(normalizeAttachment)
    .filter(Boolean)

  const images = list
    .filter((a) => a.type === 'image')
    .map(
      (a) =>
        `<img src="${a.url}" style="max-width: 100%; height: auto; object-fit: contain; display: block; margin: 8px 0;" />`
    )
    .join('')

  const files = list
    .filter((a) => a.type !== 'image')
    .map(
      (a) =>
        `<a href="${a.url}" target="_blank" download="${escapeHtml(a.name)}" data-w-e-type="attachment" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #f5f5f5; border-radius: 8px; color: #0E5F3B; text-decoration: none; margin: 4px 0;">📎 ${escapeHtml(a.name)}</a>`
    )
    .join('')

  return paragraphs + images + files
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
