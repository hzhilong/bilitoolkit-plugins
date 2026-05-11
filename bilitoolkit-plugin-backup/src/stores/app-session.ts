import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用会话状态 Store
 */
export const useAppSessionStore = defineStore(
  'AppSessionStore',
  () => {
    // 有其他激活的任务
    const hasActiveTask = ref(false)

    const setActiveTask = (flag: boolean): void => {
      hasActiveTask.value = flag
    }

    return { hasActiveTask, setActiveTask }
  },
  {
    persist: false,
  },
)
