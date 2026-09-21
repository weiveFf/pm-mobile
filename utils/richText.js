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
 * 归一化富文本里 <img> 的尺寸，让移动端自适应容器宽度、等比完整显示。
 *
 * 背景：PC 端 wangEditor 插入图片时写死了内联样式
 *   style="width: 900px; max-width: 100%; max-height: 500px; height: auto; object-fit: contain;"
 * 其中 `width: 900px` / `max-height: 500px` 在手机窄屏上会让图片撑出容器或被压扁
 * （表现为「图片显示不全」），且内联样式优先级高于移动端的类选择器，仅靠 CSS 很难覆盖干净。
 *
 * 做法：
 *  1) 剥掉尺寸相关的内联声明与 width/height 属性（其余如 border 保留）；
 *  2) **额外写入一段"护栏"内联样式**（IMG_SIZE_GUARD）——因为样式表有可能根本没生效
 *     （本项目的 H5 构建会把页面组件里的每个 style 块都编译成 scoped，对 v-html 节点无效），
 *     内联写死 `max-width:min(100%,86vw)` 后，即使一条 CSS 都不命中，图片也不会超出屏幕。
 *     86vw ≈ 屏宽 − 卡片左右内边距（内容区 24rpx×2 + 卡片 28rpx×2 ≈ 14vw）。
 */
const IMG_SIZE_GUARD = 'display:block;max-width:100%;max-width:min(100%,86vw);height:auto;max-height:none'

/** 去掉 style 字符串里与尺寸相关的声明，其余保留 */
function stripSizingDecls(css) {
  return String(css)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (s) => !/^(width|max-width|min-width|height|max-height|min-height|object-fit|display)\s*:/i.test(s)
    )
    .join('; ')
}

export function normalizeRichImageSizing(html) {
  if (!html) return ''
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    // 1) 去掉 width/height 属性（如 <img width="900" height="600">）
    let out = tag.replace(/\s(?:width|height)\s*=\s*(["'])[^"']*\1/gi, '')
    // 2) 清洗已有 style，并追加护栏样式
    const styleRe = /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i
    if (styleRe.test(out)) {
      out = out.replace(styleRe, (m, quote, css) => {
        const kept = stripSizingDecls(css)
        return ` style="${kept ? kept + ';' : ''}${IMG_SIZE_GUARD}"`
      })
    } else {
      out = out.replace(/<img\b/i, `<img style="${IMG_SIZE_GUARD}"`)
    }
    return out
  })
}

/**
 * 将富文本 HTML 中的 img src 全部补全 + 尺寸归一化，用于详情页 v-html 渲染前
 */
export function fixRichTextImageUrls(html, baseURL) {
  if (!html) return ''
  const fixed = html.replace(/<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi, (match, pre, src, post) => {
    return `<img${pre}src="${resolveRichImageUrl(src, baseURL)}"${post}>`
  })
  return normalizeRichImageSizing(fixed)
}
