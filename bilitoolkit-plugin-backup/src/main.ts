import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
import { initBilitoolkitUi, handleError } from 'bilitoolkit-ui'
import 'bilitoolkit-ui/style.css'
import '@/assets/scss/base.scss'
import App from '@/App.vue'
import router from '@/router'
import { appEnv } from '@ybgnb/vite-env/common'
import { taskService } from '@/core/service/task'

async function bootstrapApp() {
  const app = createApp(App)

  // 挂载到全局属性
  app.config.globalProperties.$toolkitApi = window.toolkitApi

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedState)
  app.use(pinia)
  app.use(router)

  const ui = await initBilitoolkitUi(pinia, appEnv.DEV)

  // 暂停之前运行的任务
  await taskService.suspendRunningTask()

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
    console.log('插件启动成功')
  })
  .catch(handleError)
