/**
 * 项目管理手机端配置（与 YessysWebVue / handheld 后端地址保持一致）
 *
 * 后端地址策略：
 * - 生产（H5 打包 + Nginx 反代）：baseURL 走**同源相对路径** `/api`，
 *   由 Nginx 把 `/api/` 转发到后端，前端无需（也不应）写死后端地址。
 * - 开发（HBuilderX 运行到浏览器/真机）：仍可直连后端绝对地址。
 * 请求最终 URL = baseURL + 接口路径，例如 `/api/system/user/list`。
 */
const isProd = process.env.NODE_ENV === 'production'

export default {
  appName: '项目管理',
  version: 'V1.0.0',
  themeColor: '#0E5F3B',
  /** 接口根地址，不要末尾斜杠 */
  baseURL: isProd ? '/prod-api' : 'http://192.168.1.89:8189',
  storageKeys: {
    token: 'yessys_pm_token',
    userId: 'yessys_pm_userId',
    userName: 'yessys_pm_userName',
    /** 登录账号（后端 Create_by 存的是账号，昵称不可替代） */
    account: 'yessys_pm_account',
    deptId: 'yessys_pm_deptId',
    /** 是否部门负责人 / 第一接口人（getInfo 返回，用于详情页指派/转派/客诉审核按钮显隐） */
    isDeptLeader: 'yessys_pm_isDeptLeader',
    isFirstContact: 'yessys_pm_isFirstContact',
    baseURL: 'yessys_pm_baseURL',
    remember: 'yessys_pm_remember',
    savedUser: 'yessys_pm_savedUser',
    savedPwd: 'yessys_pm_savedPwd'
  }
}
