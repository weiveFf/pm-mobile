export const FEEDBACK_WORKFLOW_STATUS = {
  COMPLAINT_PENDING_AUDIT: 'complaint_pending_audit',
  COMPLAINT_REJECTED: 'complaint_rejected',
  DELAY_PENDING_APPROVAL: 'delay_pending_approval',
  PENDING_RESPONSE: 'pending_response',
  PENDING_CLOSE: 'pending_close',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  WITHDRAWN: 'withdrawn',
  RESPONSE_OVERDUE: 'response_overdue',
  PROCESS_OVERDUE: 'process_overdue'
}

export const FEEDBACK_WORKFLOW_STATUS_LABELS = {
  [FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT]: '客诉待审核',
  [FEEDBACK_WORKFLOW_STATUS.COMPLAINT_REJECTED]: '客诉驳回',
  [FEEDBACK_WORKFLOW_STATUS.DELAY_PENDING_APPROVAL]: '延期待批准',
  [FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE]: '待响应',
  [FEEDBACK_WORKFLOW_STATUS.PENDING_CLOSE]: '待关闭',
  [FEEDBACK_WORKFLOW_STATUS.PROCESSING]: '处理中',
  [FEEDBACK_WORKFLOW_STATUS.COMPLETED]: '已完结',
  [FEEDBACK_WORKFLOW_STATUS.WITHDRAWN]: '已撤回',
  [FEEDBACK_WORKFLOW_STATUS.RESPONSE_OVERDUE]: '响应超时',
  [FEEDBACK_WORKFLOW_STATUS.PROCESS_OVERDUE]: '处理逾期'
}

export const FEEDBACK_STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'any' },
  { label: '未关闭', value: 'all' },
  { label: '客诉待审核', value: FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT },
  { label: '客诉驳回', value: FEEDBACK_WORKFLOW_STATUS.COMPLAINT_REJECTED },
  { label: '延期待批准', value: FEEDBACK_WORKFLOW_STATUS.DELAY_PENDING_APPROVAL },
  { label: '待响应', value: FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE },
  { label: '待关闭', value: FEEDBACK_WORKFLOW_STATUS.PENDING_CLOSE },
  { label: '处理中', value: FEEDBACK_WORKFLOW_STATUS.PROCESSING },
  { label: '已完结', value: FEEDBACK_WORKFLOW_STATUS.COMPLETED },
  { label: '已关闭', value: 'closed' },
  { label: '已撤回', value: FEEDBACK_WORKFLOW_STATUS.WITHDRAWN }
]

/** 可通过接口 workflowStatus 直接筛选的状态（与 PC 端一致） */
export const WORKFLOW_API_FILTER_STATUSES = new Set([
  FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT,
  FEEDBACK_WORKFLOW_STATUS.COMPLAINT_REJECTED,
  FEEDBACK_WORKFLOW_STATUS.DELAY_PENDING_APPROVAL,
  FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE,
  FEEDBACK_WORKFLOW_STATUS.PENDING_CLOSE,
  FEEDBACK_WORKFLOW_STATUS.PROCESSING,
  FEEDBACK_WORKFLOW_STATUS.COMPLETED,
  FEEDBACK_WORKFLOW_STATUS.WITHDRAWN
])

/** 筛选这些状态时 isClose 置 undefined（不限定关闭态），与 PC 端一致 */
export const WORKFLOW_FILTER_CLEAR_IS_CLOSE = new Set([
  FEEDBACK_WORKFLOW_STATUS.WITHDRAWN,
  FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT,
  FEEDBACK_WORKFLOW_STATUS.COMPLAINT_REJECTED
])

/** 曾经状态筛选（对应 respondedOverdueOnly / processOverdueOnly） */
export const FEEDBACK_HISTORY_STATUS_FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '响应超时', value: 'responded_overdue' },
  { label: '处理逾期', value: 'process_overdue' },
  { label: '超时并逾期', value: 'both_overdue' }
]

export const WORKBENCH_TYPES = [
  { key: 'pending', label: '待处理' },
  { key: 'mine', label: '我的反馈' },
  { key: 'overdue', label: '逾期反馈' }
]

/** 数据范围：部门维度 / 我的维度（右上角切换，影响各分类的统计口径） */
export const WORKBENCH_SCOPES = [
  { key: 'dept', label: '部门' },
  { key: 'mine', label: '我的' }
]
