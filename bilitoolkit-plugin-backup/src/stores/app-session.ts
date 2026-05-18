import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TaskGroup } from '@/core/types/task-group'

/**
 * 应用会话状态 Store
 */
export const useAppSessionStore = defineStore(
  'AppSessionStore',
  () => {
    // 是否有其他激活的任务组
    const hasActiveTaskGroup = ref(false)
    // 其他激活的任务组
    const activeTaskGroup = ref<TaskGroup>()

    const setActiveTaskGroupFlag = (flag: boolean) => {
      hasActiveTaskGroup.value = flag
      if (!flag) {
        activeTaskGroup.value = undefined
      }
    }

    const setActiveTaskGroup = (group: TaskGroup): void => {
      activeTaskGroup.value = group
    }

    return { hasActiveTaskGroup, setActiveTaskGroupFlag, activeTaskGroup, setActiveTaskGroup }
  },
  {
    persist: false,
  },
)
