import './utils/app-service-polyfill.js'
// #ifdef APP-PLUS
import './utils/app-service-jsencrypt.js'
// #endif
import App from './App'
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
