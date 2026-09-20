import { request } from '@/utils/request.js'

export function getProductManageList(data) {
  return request({ url: '/afterSales/productManage/list', method: 'GET', params: data })
}

export function getProductManageByFid(fid) {
  return request({ url: '/afterSales/productManage/' + fid, method: 'GET' })
}

export function getProductFeedbackList(data) {
  return request({ url: '/afterSales/feedback/list', method: 'GET', params: data })
}

export function getProductFeedbackPage(data) {
  return request({ url: '/afterSales/feedback/page', method: 'GET', params: data })
}

export function addProductFeedbackList(data) {
  return request({ url: '/afterSales/feedback/edit', method: 'POST', data })
}

export function closeProductFeedbackList(id) {
  return request({ url: '/afterSales/feedback/close/' + id, method: 'PUT' })
}

export function withdrawProductFeedbackList(id) {
  return request({ url: '/afterSales/feedback/withdraw/' + id, method: 'PUT' })
}

export function getProductProcessList(data) {
  return request({ url: '/afterSales/process/list', method: 'GET', params: data })
}

export function completeProductProcess(data) {
  return request({ url: '/afterSales/process/complete', method: 'PUT', data })
}

export function reapplyProductProcess(data) {
  return request({ url: '/afterSales/process/reapply', method: 'PUT', data })
}

export function editProductProcessList(data) {
  return request({ url: '/afterSales/process/edit', method: 'PUT', data })
}

export function getUserWorkloadStatistics(data) {
  return request({ url: '/afterSales/feedback/statistics/user', method: 'GET', params: data })
}

export function getWorkbenchFeedbackPage(params) {
  return request({ url: '/afterSales/feedback/workbench/page', method: 'GET', params })
}

export function remindPendingCloseFeedback() {
  return request({ url: '/afterSales/feedback/remindPendingClose', method: 'POST' })
}

export function getProductFeedbackById(id) {
  return request({ url: '/afterSales/feedback/' + id, method: 'GET' })
}

export function getFeedbackOperationLogs(feedbackId) {
  return request({ url: '/afterSales/feedback/' + feedbackId + '/operationLogs', method: 'GET' })
}

export function getFeedbackComments(feedbackId) {
  return request({ url: '/afterSales/feedback/' + feedbackId + '/comments', method: 'GET' })
}

export function addFeedbackComment(feedbackId, data) {
  return request({ url: '/afterSales/feedback/' + feedbackId + '/comments', method: 'POST', data })
}

export function getRecentFeedbackOperationLogs(params) {
  return request({ url: '/afterSales/feedback/operationLogs/recent', method: 'GET', params })
}

export function getProcessFeedbackContext(feedbackId) {
  return request({
    url: '/afterSales/feedback/' + feedbackId + '/processFeedbackContext',
    method: 'GET'
  })
}

export function markProcessResponded(feedbackId) {
  return request({ url: '/afterSales/feedback/' + feedbackId + '/markResponded', method: 'PUT' })
}

export function getChangeRecipientCandidates(feedbackId) {
  return request({
    url: '/afterSales/feedback/' + feedbackId + '/changeRecipientCandidates',
    method: 'GET'
  })
}

export function changeFeedbackRecipient(data) {
  return request({ url: '/afterSales/feedback/changeRecipient', method: 'PUT', data })
}

export function reassignFeedbackDept(data) {
  return request({ url: '/afterSales/feedback/reassignDept', method: 'PUT', data })
}

export function applyFeedbackDelay(data) {
  return request({ url: '/afterSales/feedback/delay/apply', method: 'PUT', data })
}

export function approveFeedbackDelay(data) {
  return request({ url: '/afterSales/feedback/delay/approve', method: 'PUT', data })
}

export function rejectFeedbackDelay(data) {
  return request({ url: '/afterSales/feedback/delay/reject', method: 'PUT', data })
}

export function approveComplaintAudit(data) {
  return request({ url: '/afterSales/feedback/complaintAudit/approve', method: 'PUT', data })
}

export function rejectComplaintAudit(data) {
  return request({ url: '/afterSales/feedback/complaintAudit/reject', method: 'PUT', data })
}

/** 意见反馈：后端转发到企业微信群机器人 webhook（webhook 地址在系统参数 afterSales.opinionWebhookUrl 中配置） */
export function sendOpinionFeedback(data) {
  return request({ url: '/system/opinion/send', method: 'POST', data })
}

export function getFeedbackDashboardSummary(data) {
  return request({ url: '/afterSales/feedback/statistics/dashboard', method: 'GET', params: data })
}

export function getFeedbackOverdueRank(data) {
  return request({ url: '/afterSales/feedback/statistics/overdue-rank', method: 'GET', params: data })
}

export function getFeedbackTypeRatio(data) {
  return request({ url: '/afterSales/feedback/statistics/type-ratio', method: 'GET', params: data })
}

export function getFeedbackVolumeTop(data) {
  return request({ url: '/afterSales/feedback/statistics/volume-top', method: 'GET', params: data })
}

export function getFeedbackDailyTrend(data) {
  return request({ url: '/afterSales/feedback/statistics/daily-trend', method: 'GET', params: data })
}
