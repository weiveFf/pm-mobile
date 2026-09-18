/**
 * 后端响应结构兼容工具（pm-mobile）
 *
 * 背景：
 * 1. YessysESD 的分页接口（/system/user/list、/system/dept/list）返回的 data 是分页对象，
 *    真正的数据数组在 data.result 里，而不是 data 直接就是数组。
 *    之前各页面按 `res.data || []` 取值，遇到分页对象会得到对象而非数组，导致列表静默为空。
 * 2. /system/dept/list 返回的部门数据使用 PC 端短键（id/pid/dn/l/fcuid/vi...），移动端长期
 *    字段名是长键（deptId/parentId/deptName/leader/firstContactUserId/viewInfo...），
 *    需要做一次归一化，否则部门名称/ID/负责人全部读不到，列表会被过滤为空。
 */

/** 从任意层级的响应中提取数组，兼容 data/result/rows/list 及嵌套结构 */
export function extractArray(res) {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object') return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.result)) return res.result
  if (Array.isArray(res.rows)) return res.rows
  if (Array.isArray(res.list)) return res.list
  if (res.data) return extractArray(res.data)
  return []
}

/** 部门树中需要排除的节点：顶层母公司 + 未分配部门 */
const DEPT_EXCLUDE_KEYWORDS = ['研成工业', '待设置部门']

function isDeptSelectable(name) {
  const n = name || ''
  return !!n && !DEPT_EXCLUDE_KEYWORDS.some((k) => n.indexOf(k) >= 0)
}

/** 部门短键 -> 长键 映射（与 PC 端 useDeptList 保持一致） */
const DEPT_SHORT_MAP = {
  chd: 'children',
  id: 'deptId',
  pid: 'parentId',
  wxId: 'wX_DepartmentId',
  ans: 'ancestors',
  dn: 'deptName',
  onm: 'orderNum',
  l: 'leader',
  p: 'phone',
  em: 'email',
  sta: 'status',
  df: 'delFlag',
  qdn: 'queryDeptAllName',
  fcuid: 'firstContactUserId',
  createBy: 'createBy',
  createTime: 'createTime',
  updateTime: 'updateTime',
  remark: 'remark'
}

/** 把单个部门节点从短键归一化为移动端长键，递归处理 children 和 vi */
export function normalizeDeptNode(n) {
  if (!n || typeof n !== 'object') return n
  const out = {}
  for (const [k, v] of Object.entries(n)) {
    const target = DEPT_SHORT_MAP[k] || k
    if (target === 'viewInfo' && v && typeof v === 'object') {
      out.viewInfo = {
        leaderNameText: v.ln,
        firstContactNameText: v.fn,
        deptAllName: v.dan
      }
    } else if (target === 'children' && Array.isArray(v)) {
      out.children = v.map(normalizeDeptNode)
    } else {
      out[target] = v
    }
  }
  // 兼容独立 vi 对象（PC 端 useDeptList 也是 vi.ln / vi.fn / vi.dan）
  if (!out.viewInfo && n.vi && typeof n.vi === 'object') {
    out.viewInfo = {
      leaderNameText: n.vi.ln,
      firstContactNameText: n.vi.fn,
      deptAllName: n.vi.dan
    }
  }
  return out
}

/** 递归展平部门树（过滤不可选节点），返回扁平数组 */
export function flattenDeptTree(nodes, out = []) {
  ;(nodes || []).forEach((n) => {
    if (isDeptSelectable(n.deptName)) out.push(n)
    if (n.children && n.children.length) flattenDeptTree(n.children, out)
  })
  return out
}

/** 把 listDept 的响应处理成扁平可选部门列表（自动识别树形 / 平铺 / 分页对象，并兼容短键） */
export function normalizeDeptList(res) {
  const raw = extractArray(res).map(normalizeDeptNode)
  if (!raw.length) return []
  // 树形结构（首节点带 children）需要展平
  if (raw[0] && raw[0].children) return flattenDeptTree(raw)
  return raw.filter((n) => isDeptSelectable(n.deptName))
}

/** 把 listUser 的响应处理成有效用户列表（过滤已删除 / 停用） */
export function normalizeUserList(res) {
  return extractArray(res).filter((u) => {
    const uid = Number(u.userId)
    return uid > 0 && String(u.delFlag ?? '0') === '0' && String(u.status ?? '0') === '0'
  })
}
