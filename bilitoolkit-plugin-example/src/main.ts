import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initBilitoolkitUi, handleError } from 'bilitoolkit-ui'
import 'bilitoolkit-ui/style.css'
import HomeView from '@/views/HomeView.vue'

async function bootstrapApp() {
  const app = createApp(HomeView)

  if (import.meta.env.DEV) {
    import('./utils/dev-proxy-hook.ts').then((m) => m.setupDevProxyHook())
  }

  const pinia = createPinia()
  app.use(pinia)

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
