import { getToken, getUserId, getBaseURL } from '@/utils/auth.js'
import { resolveUploadUrl } from '@/utils/uploadUrl.js'

/**
 * 上传图片/文件（与 PC 端 wangEditor 同一接口）
 * POST /Common/UploadFile?storeType=1
 * 字段名：file
 */
export function uploadFile(filePath, fileName) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: getBaseURL() + '/Common/UploadFile?storeType=1',
      filePath,
      name: 'file',
      header: {
        Authorization: 'Bearer ' + getToken(),
        userid: String(getUserId())
      },
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.code !== 200) {
            reject(new Error(body.msg || '上传失败'))
            return
          }
          resolve(body.data || {})
        } catch (e) {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: (err) => {
        reject(err && err.errMsg ? new Error(err.errMsg) : new Error('上传失败'))
      }
    })
  })
}

/**
 * 上传单张图片并返回可直接使用的 URL
 * 优先用后端返回的绝对 url，否则按 fileName 拼接
 */
export async function uploadImage(filePath) {
  const data = await uploadFile(filePath)
  // 与 PC 端一致：优先 fileName 拼接，避免后端 AccessUrl 带错 Host 导致生产环境图片空白
  if (data.fileName) return resolveUploadUrl(data.fileName)
  if (data.url) return resolveUploadUrl(data.url)
  throw new Error('上传未返回图片地址')
}
