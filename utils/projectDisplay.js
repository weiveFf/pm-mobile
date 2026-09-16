/**
 * 根据金蝶物料编码判断「是否自制」
 * 规则与 PC 端 YessysWebVue 保持一致：
 * 以 "1." 或 "3.09." 开头 → 非自制；否则为自制。
 */
export function formatSelfMadeLabel(fnumber) {
  const v = String(fnumber || '').trim()
  if (!v) return '—'
  if (v.startsWith('1.') || v.startsWith('3.09.')) return '非自制'
  return '自制'
}
