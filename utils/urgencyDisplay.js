import { urgencyLevels } from '@/constants/afterSales.js'

export function looksLikeIsoDateTime(value) {
  if (value == null || value === '') return false
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return false
  return s.length > 10 || s.indexOf('T') >= 0 || /\d{2}:\d{2}/.test(s)
}

function findUrgency(levelStr) {
  if (!levelStr) return null
  return urgencyLevels.find(
    (l) =>
      l.value === levelStr ||
      l.label === levelStr ||
      (levelStr.length >= 2 && levelStr.length <= 32 && l.label.indexOf(levelStr) >= 0)
  )
}

function stripUrgencyParenthetical(label) {
  if (!label || label === '-') return label
  const idx = label.indexOf('(')
  if (idx > 0) return label.substring(0, idx).trim()
  return label
}

export function getUrgencyClass(level) {
  if (level == null || level === '') return ''
  if (looksLikeIsoDateTime(level)) return ''
  const found = findUrgency(String(level).trim())
  return found ? found.className : ''
}

export function getUrgencyLabel(level) {
  if (level == null || level === '') return ''
  if (looksLikeIsoDateTime(level)) return '-'
  const found = findUrgency(String(level).trim())
  return found ? stripUrgencyParenthetical(found.label) : '-'
}

/**
 * 紧急程度分级色调：与 constants/afterSales.js 的 urgencyLevels 一一对应。
 * critical/urgent 走危险色，high/medium 走暖色，normal 走信息色，low/minor 走中性色，
 * 保证 7 档在卡片上都能被一眼区分。
 */
const URGENCY_TONE_BY_VALUE = {
  '0': 'critical',
  '1': 'urgent',
  '2': 'high',
  '3': 'medium',
  '4': 'normal',
  '5': 'low',
  '6': 'minor'
}

/** 紧急程度色调 key，供卡片上色；无等级时返回空串（不渲染胶囊） */
export function getUrgencyTone(level) {
  if (level == null || level === '') return ''
  if (looksLikeIsoDateTime(level)) return ''
  const s = String(level).trim()
  if (URGENCY_TONE_BY_VALUE[s]) return URGENCY_TONE_BY_VALUE[s]
  const found = findUrgency(s)
  return found ? URGENCY_TONE_BY_VALUE[found.value] || '' : ''
}

/** 仅日期字段 YYYY-MM-DD */
export function formatDateOnly(val) {
  if (!val) return '-'
  const s = String(val)
  if (s.indexOf('0001-01-01') === 0) return '-'
  return s.length >= 10 ? s.substring(0, 10) : s
}
