const REMARK_SEP = '；说明：'
const USER_ID_MARKER_RE = /(?:\|)?(?:fromUserId|toUserId):\d+(?:\|)?/gi

export function stripFeedbackLogInternalMarkers(text) {
  if (text == null || text === '') return ''
  return String(text)
    .replace(USER_ID_MARKER_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([，,。；;])/g, '$1')
    .trim()
}

export function splitFeedbackLogContent(content) {
  if (content == null || content === '') {
    return { main: '', remark: '' }
  }
  const s = String(content)
  const i = s.indexOf(REMARK_SEP)
  if (i === -1) {
    return { main: stripFeedbackLogInternalMarkers(s), remark: '' }
  }
  return {
    main: stripFeedbackLogInternalMarkers(s.slice(0, i)),
    remark: stripFeedbackLogInternalMarkers(s.slice(i + REMARK_SEP.length).trim())
  }
}
