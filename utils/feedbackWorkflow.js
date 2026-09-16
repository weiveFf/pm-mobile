import { FEEDBACK_WORKFLOW_STATUS, FEEDBACK_WORKFLOW_STATUS_LABELS } from '@/constants/feedbackWorkflow.js'
import { isResponseSlaExceeded } from '@/utils/responseSla.js'

export function isAfterSalesProcessOpen(p) {
  if (!p) return false
  const completed = p.isCompleted === true || p.is_completed === true || !!(p.completedTime || p.completed_time)
  return !completed
}

export function canRespondFeedbackRow(row, userId) {
  const fb = row && row.feedback
  if (!fb || fb.isClose) return false
  const uid = Number(userId)
  if (!uid) return false
  const first = Number(fb.theFirstHandlerId)
  const iv = fb.interventionPersonnelId != null ? Number(fb.interventionPersonnelId) : null
  if (uid !== first && !(iv != null && uid === iv)) return false
  const p = pickPrimaryProcess(row.processList)
  if (!p || !isAfterSalesProcessOpen(p)) return false
  if (p.isResponded === true || p.is_responded === true) return false
  return true
}

export function pickPrimaryProcess(processList) {
  const list = processList || []
  const open = list.find((p) => isAfterSalesProcessOpen(p))
  if (open) return open
  return list[0] || null
}

export function getFeedbackWorkflowStatus(feedback, processList) {
  const fb = feedback || {}
  const complaintAuditStatus = Number(fb.complaintAuditStatus || fb.ComplaintAuditStatus || 0)
  const abnormalType = String(fb.abnormalType || fb.AbnormalType || '').trim()
  if (abnormalType === '客诉' && complaintAuditStatus === 1) {
    return FEEDBACK_WORKFLOW_STATUS.COMPLAINT_PENDING_AUDIT
  }
  if (abnormalType === '客诉' && complaintAuditStatus === 3) {
    return FEEDBACK_WORKFLOW_STATUS.COMPLAINT_REJECTED
  }
  const delayApplyStatus = Number(fb.delayApplyStatus || fb.DelayApplyStatus || 0)
  if (delayApplyStatus === 1 && !(fb.isClose || fb.IsClose)) {
    return FEEDBACK_WORKFLOW_STATUS.DELAY_PENDING_APPROVAL
  }
  if (fb.isWithdrawn === true || fb.IsWithdrawn === true || fb.is_withdrawn === true) {
    return FEEDBACK_WORKFLOW_STATUS.WITHDRAWN
  }
  if (fb.isClose || fb.IsClose) return FEEDBACK_WORKFLOW_STATUS.COMPLETED
  const p = pickPrimaryProcess(processList)
  if (!p) return FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE
  const responded = p.isResponded === true || p.is_responded === true
  const completed = p.isCompleted === true || p.is_completed === true || !!(p.completedTime || p.completed_time)
  if (completed) return FEEDBACK_WORKFLOW_STATUS.PENDING_CLOSE
  if (!responded) return FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE
  return FEEDBACK_WORKFLOW_STATUS.PROCESSING
}

export function getFeedbackWorkflowStatusLabel(status) {
  return FEEDBACK_WORKFLOW_STATUS_LABELS[status] || '-'
}

function demandFinishDeadlineEndMs(val) {
  if (!val) return null
  const s = String(val).trim()
  if (!s || s.indexOf('0001') === 0) return null
  const day = s.length >= 10 ? s.substring(0, 10) : s
  const t = new Date(day.replace(/-/g, '/') + ' 23:59:59').getTime()
  return Number.isNaN(t) ? null : t
}

function isResponseOverdue(feedback, process) {
  const fb = feedback || {}
  if (fb.isClose || fb.IsClose) return false
  if (fb.hasResponseOverdueEvent === true || fb.HasResponseOverdueEvent === true) return true
  if (process) {
    const responded = process.isResponded === true || process.is_responded === true
    if (responded) return false
    const warnedAt =
      process.responsibleEscalationNotifiedTime ||
      process.responsibleEscalationNotified_time ||
      process.ResponsibleEscalationNotifiedTime
    if (warnedAt) return true
    const assignedAt =
      process.update_time ||
      process.Update_time ||
      process.create_time ||
      process.Create_time
    return isResponseSlaExceeded(assignedAt, fb.urgencyLevel || fb.UrgencyLevel)
  }
  const createdAt = fb.create_time || fb.Create_time || fb.createTime
  return isResponseSlaExceeded(createdAt, fb.urgencyLevel || fb.UrgencyLevel)
}

function isProcessOverdue(feedback) {
  const fb = feedback || {}
  if (fb.isClose || fb.IsClose) return false
  const endMs = demandFinishDeadlineEndMs(fb.demandFinishTime || fb.DemandFinishTime)
  return endMs != null && Date.now() > endMs
}

export function getFeedbackWorkflowDisplayStatus(feedback, processList) {
  const status = getFeedbackWorkflowStatus(feedback, processList)
  const label = getFeedbackWorkflowStatusLabel(status)
  const p = pickPrimaryProcess(processList)
  const responseOverdue = isResponseOverdue(feedback, p)
  const processOverdue = isProcessOverdue(feedback)

  if (responseOverdue && status === FEEDBACK_WORKFLOW_STATUS.PENDING_RESPONSE) {
    return {
      status,
      label: FEEDBACK_WORKFLOW_STATUS_LABELS[FEEDBACK_WORKFLOW_STATUS.RESPONSE_OVERDUE],
      overdueType: FEEDBACK_WORKFLOW_STATUS.RESPONSE_OVERDUE
    }
  }
  if (processOverdue && status === FEEDBACK_WORKFLOW_STATUS.PROCESSING) {
    return {
      status,
      label: FEEDBACK_WORKFLOW_STATUS_LABELS[FEEDBACK_WORKFLOW_STATUS.PROCESS_OVERDUE],
      overdueType: FEEDBACK_WORKFLOW_STATUS.PROCESS_OVERDUE
    }
  }
  return { status, label, overdueType: null }
}

export function resolveFeedbackWorkflowDisplay(rowOrFeedback, processListMaybe) {
  let feedback
  let processList
  let workflowStatus
  let workflowStatusLabel
  let workflowOverdueType

  if ((rowOrFeedback && rowOrFeedback.feedback != null) || (rowOrFeedback && rowOrFeedback.Feedback != null)) {
    const row = rowOrFeedback
    feedback = row.feedback || row.Feedback
    processList = row.processList || row.ProcessList || processListMaybe
    workflowStatus = row.workflowStatus || row.WorkflowStatus
    workflowStatusLabel = row.workflowStatusLabel || row.WorkflowStatusLabel
    workflowOverdueType = row.workflowOverdueType || row.WorkflowOverdueType
  } else {
    feedback = rowOrFeedback
    processList = processListMaybe
  }

  if (workflowStatusLabel != null && String(workflowStatusLabel).trim() !== '') {
    return {
      status: workflowStatus != null ? workflowStatus : null,
      label: workflowStatusLabel,
      overdueType: workflowOverdueType != null ? workflowOverdueType : null
    }
  }
  return getFeedbackWorkflowDisplayStatus(feedback, processList)
}

export function isFeedbackProcessCompleted(processList) {
  const p = pickPrimaryProcess(processList)
  if (!p) return false
  return p.isCompleted === true || p.is_completed === true || !!(p.completedTime || p.completed_time)
}

/** 处理人显示：处理人/负责人 */
export function formatHandlerPair(fb) {
  if (!fb) return '-'
  const a = fb.theFirstHandlerNickName || fb.theFirstHandlerName || ''
  const b = fb.interventionPersonnelNickName || fb.interventionPersonnelName || ''
  if (a && b) return a + '/' + b
  return a || b || '-'
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim()
}
