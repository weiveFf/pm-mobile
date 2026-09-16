/**
 * 项目管理手机端配置（与 YessysWebVue / handheld 后端地址保持一致）
 */
export default {
  appName: '项目管理',
  version: 'V1.0.0',
  themeColor: '#0E5F3B',
  /** 接口根地址，不要末尾斜杠 */
  baseURL: 'http://192.168.1.156:8187',
  storageKeys: {
    token: 'yessys_pm_token',
    userId: 'yessys_pm_userId',
    userName: 'yessys_pm_userName',
    /** 登录账号（后端 Create_by 存的是账号，昵称不可替代） */
    account: 'yessys_pm_account',
    deptId: 'yessys_pm_deptId',
    baseURL: 'yessys_pm_baseURL',
    remember: 'yessys_pm_remember',
    savedUser: 'yessys_pm_savedUser',
    savedPwd: 'yessys_pm_savedPwd'
  }
}
