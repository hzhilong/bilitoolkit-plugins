import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
import { initBilitoolkitUi, handleError } from 'bilitoolkit-ui'
import 'bilitoolkit-ui/style.css'
import 'remixicon/fonts/remixicon.css'
import App from '@/App.vue'
import router from '@/router'
import 'element-plus/dist/index.css'
import { setupDevProxyHook } from '@ybgnb/utils/dom'

async function bootstrapApp() {
  const app = createApp(App)

  if (import.meta.env.DEV) {
    setupDevProxyHook()
  }

  app.config.globalProperties.$toolkitApi = window.toolkitApi

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedState)
  app.use(pinia)
  app.use(router)

  const ui = await initBilitoolkitUi(pinia)

  app.use(ui)
  // Vue 组件中发生的错误
  app.config.errorHandler = handleError
  // 捕捉那些没有被catch处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason)
  })
  app.mount('#app')
}

bootstrapApp()
  .then(() => {
    console.log('App 启动成功')
  })
  .catch(handleError)
