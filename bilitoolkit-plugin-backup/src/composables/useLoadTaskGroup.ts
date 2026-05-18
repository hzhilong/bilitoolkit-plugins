import { type MaybeRefOrGetter, watchEffect, toValue, ref, watch } from 'vue'
import type { TaskGroupId, TaskGroup } from '@/core/types/task-group'
import { taskGroupService } from '@/core/service/task-group'
import { showError } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'

export const useLoadTaskGroup = (id: MaybeRefOrGetter<TaskGroupId>) => {
  const taskGroup = ref<TaskGroup>()
  const loading = ref(false)
  const error = ref<unknown>()
  watchEffect(async (onCleanup) => {
    loading.value = true
    error.value = undefined
    const currId = toValue(id)

    let canceled = false

    onCleanup(() => {
      canceled = true
    })

    try {
      const result = await taskGroupService.getById(currId)
      if (!canceled) {
        taskGroup.value = result
      }
    } catch (e: unknown) {
      if (!canceled) {
        error.value = e
      }
    } finally {
      if (!canceled) {
        loading.value = false
      }
    }
  })

  watch(error, (newValue: unknown) => {
    if (newValue) {
      showError(getErrorMessage(newValue))
    }
  })

  return { taskGroup, loading, error }
}
