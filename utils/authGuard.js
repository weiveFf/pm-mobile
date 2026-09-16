import { isLoggedIn } from '@/utils/auth.js'
import { redirectToLogin } from '@/utils/session.js'

export function ensureLoggedIn() {
  if (isLoggedIn()) return true
  redirectToLogin('请先登录')
  return false
}
