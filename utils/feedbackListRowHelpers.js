/**
 * 反馈列表行辅助：时间解析与格式化。
 * 与 PC 端 YessysWebVue/src/utils/feedbackListRowHelpers.js 语义保持一致，
 * 只是不依赖 dayjs（移动端未引入）。
 */
import { isAfterSalesProcessOpen } from '@/utils/feedbackWorkflow.js'

/** 解析后端返回的时间串：兼容 Date / 时间戳 / 'YYYY-MM-DD HH:mm:ss' / ISO */
export function parseDateTimeRaw(v) {
  if (v == null || v === '') return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(v).trim()
  if (!s || s.indexOf('0001-01-01') === 0) return null
  // 带时区标识的串交给原生解析；其余（含 iOS 敏感的 'YYYY-MM-DD hh:mm:ss'）手工兼容
  const d = /Z$|[+-]\d{2}:?\d{2}$/.test(s)
    ? new Date(s)
    : new Date(s.replace(/-/g, '/').replace('T', ' '))
  return isNaN(d.getTime()) ? null : d
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

/** 完整时间 YYYY-MM-DD HH:mm */
export function formatDateTimeMinute(raw, fallback = '-') {
  const d = parseDateTimeRaw(raw)
  if (!d) return fallback
  return (
    d.getFullYear() +
    '-' +
    pad2(d.getMonth() + 1) +
    '-' +
    pad2(d.getDate()) +
    ' ' +
    pad2(d.getHours()) +
    ':' +
    pad2(d.getMinutes())
  )
}

function pickOpenProcess(processList) {
  return (processList || []).find((p) => isAfterSalesProcessOpen(p))
}

function pickLatestCompletedProcess(processList) {
  const completed = (processList || [])
    .filter((p) => {
      const ct = p.CompletedTime ?? p.completedTime ?? p.completed_time
      return ct != null && ct !== ''
    })
    .sort((a, b) => {
      const ta = parseDateTimeRaw(a.CompletedTime ?? a.completedTime ?? a.completed_time)
      const tb = parseDateTimeRaw(b.CompletedTime ?? b.completedTime ?? b.completed_time)
      return (tb ? tb.getTime() : 0) - (ta ? ta.getTime() : 0)
    })
  return completed[0] || null
}

function pickProcessForResponseFields(processList) {
  return pickOpenProcess(processList) || pickLatestCompletedProcess(processList) || null
}

/** 响应时间：优先取进行中的处理记录，其次取最近一次完成的处理记录 */
export function getRespondedTimeText(processList) {
  const p = pickProcessForResponseFields(processList)
  if (!p) return '-'
  const raw = p.RespondedTime ?? p.respondedTime ?? p.responded_time
  return formatDateTimeMinute(raw, '-')
}

/** 期望完成时间：搜索起点 00:00:00 */
export function demandFinishRangeBeginApi(dateStr) {
  const day = String(dateStr || '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  return day + ' 00:00:00'
}

/** 期望完成时间：搜索终点 23:59:59 */
export function demandFinishRangeEndApi(dateStr) {
  const day = String(dateStr || '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  return day + ' 23:59:59'
}

/** 后端时间串 -> YYYY-MM-DD，用于回填日期选择器 */
export function toDatePart(raw) {
  const d = parseDateTimeRaw(raw)
  if (!d) return ''
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}
