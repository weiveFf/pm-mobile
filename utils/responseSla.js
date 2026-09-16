/**
 * 响应 SLA：与后端 AfterSalesResponseSla / EscalateOverdueUnresponded 一致。
 * 默认工作时段 09:00-21:00（配置项 sys.login.time）。
 */

const DEFAULT_WORK_START_MS = (9 * 60 + 0) * 60 * 1000
const DEFAULT_WORK_END_MS = (21 * 60 + 0) * 60 * 1000

/** @type {Record<string, number>} 毫秒 */
const SLA_MS_BY_LEVEL = {
  '0': 2 * 3600 * 1000,
  '1': 8 * 3600 * 1000,
  '2': 24 * 3600 * 1000,
  '3': 2 * 24 * 3600 * 1000,
  '4': 3 * 24 * 3600 * 1000,
  '5': 5 * 24 * 3600 * 1000,
  '6': 7 * 24 * 3600 * 1000
}

export function getResponseSlaMs(urgencyLevel) {
  const level = String(urgencyLevel ?? '').trim()
  return SLA_MS_BY_LEVEL[level] ?? SLA_MS_BY_LEVEL['6']
}

function dayStartMs(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function overlapMs(rangeStart, rangeEnd, windowStart, windowEnd) {
  const start = Math.max(rangeStart, windowStart)
  const end = Math.min(rangeEnd, windowEnd)
  return end > start ? end - start : 0
}

/** 工作时段内累计耗时（毫秒） */
export function calculateElapsedInWorkingWindowMs(
  fromInput,
  toInput,
  workStartMs = DEFAULT_WORK_START_MS,
  workEndMs = DEFAULT_WORK_END_MS
) {
  const from = new Date(fromInput).getTime()
  const to = new Date(toInput).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0

  let total = 0
  const fromDate = new Date(from)
  const toDate = new Date(to)
  let day = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() - 1)
  const endDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1)

  while (day.getTime() <= endDay.getTime()) {
    const base = dayStartMs(day)
    if (workStartMs <= workEndMs) {
      total += overlapMs(from, to, base + workStartMs, base + workEndMs)
    } else {
      total += overlapMs(from, to, base, base + workEndMs)
      total += overlapMs(from, to, base + workStartMs, base + 24 * 3600 * 1000)
    }
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  }
  return total
}

/**
 * 是否已超过响应 SLA（工作时段累计）。
 * @param {string|Date|number} assignedAt 处理指派/创建时间
 * @param {string|number|null|undefined} urgencyLevel
 * @param {Date|number} [now]
 */
export function isResponseSlaExceeded(assignedAt, urgencyLevel, now = Date.now()) {
  if (assignedAt == null || assignedAt === '') return false
  const elapsed = calculateElapsedInWorkingWindowMs(assignedAt, now)
  return elapsed > getResponseSlaMs(urgencyLevel)
}
