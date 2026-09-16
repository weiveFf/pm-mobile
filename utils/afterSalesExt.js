export const AFTER_SALES_EXT_KEY = 'afterSalesExt'

export const afterSalesExtFields = [
  { prop: 'productName', label: '产品名称', type: 'input', required: true, maxLength: 200 },
  { prop: 'onsiteUsedCount', label: '现场使用数量', type: 'number', required: true, min: 0 },
  { prop: 'defectiveCount', label: '不良数量', type: 'number', required: true, min: 0 },
  { prop: 'defectiveSnList', label: '不良 SN 号', type: 'input', required: true },
  { prop: 'occurrenceTimeRange', label: '发生时间段', type: 'datetimerange', required: true },
  { prop: 'customerScenario', label: '客户应用场景', type: 'input', required: true },
  { prop: 'networkMode', label: '联网方式', type: 'input', required: true, maxLength: 100 },
  { prop: 'programVersion', label: '程序版本号', type: 'input', required: true, maxLength: 100 },
  { prop: 'backendVersion', label: '后台版本号', type: 'input', required: true, maxLength: 100 },
  { prop: 'iotVersion', label: '物联版本号', type: 'input', required: true, maxLength: 100 }
]

export function buildAfterSalesExtDefaults() {
  const defaults = {}
  afterSalesExtFields.forEach((f) => {
    if (f.type === 'datetimerange') defaults[f.prop] = []
    else if (f.type === 'number') defaults[f.prop] = ''
    else defaults[f.prop] = ''
  })
  return defaults
}

export function serializeAfterSalesExt(ext) {
  const out = {}
  afterSalesExtFields.forEach((f) => {
    if (f.type === 'datetimerange') {
      const range = ext && ext[f.prop]
      if (Array.isArray(range) && range.length === 2) {
        out.occurrenceStartTime = range[0]
        out.occurrenceEndTime = range[1]
      } else {
        out.occurrenceStartTime = undefined
        out.occurrenceEndTime = undefined
      }
    } else if (f.type === 'number') {
      const v = ext && ext[f.prop]
      out[f.prop] = v === '' || v == null ? undefined : Number(v)
    } else {
      out[f.prop] = ext && ext[f.prop]
    }
  })
  return out
}

export function deserializeAfterSalesExt(target) {
  if (!target) return
  if (target.occurrenceStartTime && target.occurrenceEndTime) {
    target.occurrenceTimeRange = [target.occurrenceStartTime, target.occurrenceEndTime]
  } else {
    target.occurrenceTimeRange = []
  }
}

export function hasAfterSalesExtData(ext) {
  if (!ext || typeof ext !== 'object') return false
  const hasText = (v) => v != null && String(v).trim() !== ''
  return (
    hasText(ext.productName) ||
    hasText(ext.defectiveSnList) ||
    hasText(ext.customerScenario) ||
    hasText(ext.networkMode) ||
    hasText(ext.programVersion) ||
    hasText(ext.backendVersion) ||
    hasText(ext.iotVersion) ||
    hasText(ext.occurrenceStartTime) ||
    hasText(ext.occurrenceEndTime) ||
    (ext.onsiteUsedCount != null && Number(ext.onsiteUsedCount) > 0) ||
    (ext.defectiveCount != null && Number(ext.defectiveCount) > 0) ||
    (ext.id != null && Number(ext.id) > 0)
  )
}

export const AFTER_SALES_PROBLEM_DESCRIPTION_TEXT = [
  '售后现场处理方式：',
  '1. 是否硬件异常：如高压异常',
  '2. 重启是否正常：如重启后问题反复出现',
  '3. 确认本机设置，接地方式，电源使用等是否正确',
  '4. 联网数据异常查看是否有日志，日志内容是什么',
  '5. 使用 C# ping 收集器/中转器/终端是否能 ping 通',
  '6. 联网交叉验证：调整一下联网环境（如改变距离，交叉位置等等）是否能恢复正常',
  '7. 其他处理方式：附图片/视频'
].join('\n')

export function validateAfterSalesExt(ext) {
  for (let i = 0; i < afterSalesExtFields.length; i++) {
    const f = afterSalesExtFields[i]
    if (!f.required) continue
    const v = ext && ext[f.prop]
    if (f.type === 'datetimerange') {
      if (!Array.isArray(v) || v.length !== 2 || !v[0] || !v[1]) {
        return f.label + '不能为空'
      }
    } else if (f.type === 'number') {
      if (v === undefined || v === null || v === '') return f.label + '不能为空'
      if (Number.isNaN(Number(v))) return f.label + '必须为数字'
    } else {
      if (v == null || String(v).trim() === '') return f.label + '不能为空'
    }
  }
  return ''
}
