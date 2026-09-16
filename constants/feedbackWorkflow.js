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

export const WORKBENCH_TYPES = [
  { key: 'pending', label: '待处理' },
  { key: 'current_projects', label: '进行中' },
  { key: 'pending_close', label: '待关闭' },
  { key: 'closed', label: '已关闭' }
]
