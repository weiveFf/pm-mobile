/** 部门树展示：用 parentId + 原始 deptName，避免 deptAllName 解析成全公司同名 */

const SKIP_DEPT_KEYWORDS = ['研成工业', '待设置部门']

export function isSkippedDeptName(name) {
  const n = String(name || '').trim()
  if (!n) return true
  return SKIP_DEPT_KEYWORDS.some((k) => n.indexOf(k) >= 0)
}

export function buildDeptIndex(depts) {
  const byId = new Map()
  ;(depts || []).forEach((d) => {
    const id = Number(d.deptId)
    if (Number.isFinite(id) && id > 0) byId.set(id, d)
  })
  return byId
}

/** 沿 parentId 向上收集部门名（跳过顶层母公司等） */
export function deptNameChain(dept, deptsOrIndex) {
  const byId = deptsOrIndex instanceof Map ? deptsOrIndex : buildDeptIndex(deptsOrIndex)
  const parts = []
  let cur = dept
  const guard = new Set()
  while (cur) {
    const id = Number(cur.deptId)
    if (guard.has(id)) break
    guard.add(id)
    const name = String(cur.deptName || '').trim()
    if (name && !isSkippedDeptName(name)) parts.unshift(name)
    const pid = Number(cur.parentId)
    cur = pid > 0 ? byId.get(pid) : null
  }
  return parts
}

/** 列表/选中展示：直接上级 / 本级 */
export function deptParentSlashLabel(dept, deptsOrIndex) {
  const chain = deptNameChain(dept, deptsOrIndex)
  if (chain.length >= 2) return `${chain[chain.length - 2]} / ${chain[chain.length - 1]}`
  return chain[0] || String(dept?.deptName || '').trim() || '-'
}
