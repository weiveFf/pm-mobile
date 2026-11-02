import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5180,
    host: true,
    // H5 开发环境代理：把 /prod-api 请求转发到后端，避免跨域（与生产 Nginx 反代一致）
    proxy: {
      '/prod-api': {
        target: 'http://192.168.1.89:8189',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prod-api/, '')
      }
    }
  }
})
