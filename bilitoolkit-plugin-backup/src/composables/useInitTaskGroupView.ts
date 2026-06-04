import type { TaskGroup, TaskGroupStatus } from '@/core/types/task-group'
import { type Ref, reactive, type MaybeRefOrGetter, toValue } from 'vue'
import { taskService } from '@/core/service/task'
import type { Task, TaskId, TaskStatus } from '@/core/types/task'
import type { OperationType } from '@/core/types/operation'
import { sleep } from '@ybgnb/utils'
import { taskGroupService } from '@/core/service/task-group'
import type { OnProgress, OnStatusChange, GroupExecuteContext } from '@/core/types/execute'
import { useAppSettingsStore } from '@/stores/app-settings'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import { useExecTaskGroup } from '@/composables/useExecTaskGroup'

export interface InitContext {
  canceled: boolean
  taskGroupId: number
  taskIds: number[]
  // 是否有效
  isValid(): boolean
}

export const useInitTaskGroupView = <O extends OperationType = OperationType>(
  taskGroup: Ref<TaskGroup<O>>,
  autoExec?: MaybeRefOrGetter<boolean>,
) => {
  let globalCanceled = false
  const { execTaskGroup: baseExecTaskGroup, cancelTaskGroup: baseCancelTaskGroup } = useExecTaskGroup()
  const taskItems = reactive<Task<O>[]>([])
  const createInitContext = (onCleanup?: (cleanupFn: () => void) => void): InitContext => {
    const context = {
      canceled: false,
      taskGroupId: taskGroup.value.id,
      taskIds: taskGroup.value.items.map((item) => item.id),
    } as InitContext
    context.isValid = () => !globalCanceled && !context.canceled && taskGroup.value.id === context.taskGroupId
    onCleanup?.(() => {
      context.canceled = true
    })
    return context
  }

  const loadTaskItems = async ({ isValid, taskIds }: InitContext) => {
    taskItems.splice(0, taskItems.length)
    const list = await taskService.getByIds<O>(taskIds)
    if (isValid()) {
      ;(taskItems as Task<O>[]).splice(0, taskItems.length, ...list)
    }
  }

  const handleItemsProgressChange = (id: TaskId, progress: number | undefined, msg: string | undefined) => {
    taskItems.forEach((task) => {
      if (task.id === id) {
        task.progress = progress ?? task.progress
        task.progressMsg = msg ?? task.progressMsg
      }
    })
  }
  const handleItemsStatusChange = (id: TaskId, status: TaskStatus) => {
    taskItems.forEach((task) => {
      if (task.id === id) {
        task.status = status
      }
    })
  }
  const loopUpdate = async ({ isValid, taskGroupId }: InitContext) => {
    while (true) {
      await sleep(1000)
      const newList = await taskService.getByIds(
        taskItems.filter((t) => t.status === 'running' || t.status === 'pending').map((t) => t.id),
      )
      if (!isValid()) {
        break
      }
      for (const newTask of newList) {
        handleItemsStatusChange(newTask.id, newTask.status)
        handleItemsProgressChange(newTask.id, newTask.progress, newTask.progressMsg)
      }
      const newData = await taskGroupService.getById<O>(taskGroupId)
      if (!isValid()) {
        break
      }
      Object.assign(taskGroup.value, newData)
      if (newData.status !== 'running' || newList.length === 0) {
        break
      }
    }
  }

  const buildExecContext = async ({ isValid }: InitContext): Promise<GroupExecuteContext> => {
    const onStatusChange = (status: TaskGroupStatus) => {
      if (!isValid()) return
      taskGroup.value.status = status
    }
    const onProgress = async (progress: number | undefined, msg: string | undefined) => {
      if (!isValid()) return
      taskGroup.value.progress = progress ?? taskGroup.value.progress
      taskGroup.value.progressMsg = msg ?? taskGroup.value.progressMsg
    }
    const onItemsProgress = taskItems.map((item) => {
      const id = item.id
      const onProgress: OnProgress = async (progress: number | undefined, msg: string | undefined) => {
        if (!isValid()) return
        handleItemsProgressChange(id, progress, msg)
      }
      return onProgress
    })
    const onItemsStatusChange: OnStatusChange<TaskStatus>[] = taskItems.map((item) => {
      const id = item.id
      const onStatusChange: OnStatusChange<TaskStatus> = (status: TaskStatus) => {
        if (!isValid()) return
        handleItemsStatusChange(id, status)
      }
      return onStatusChange
    })
    return {
      onStatusChange,
      onItemsProgress,
      onItemsStatusChange,
      onProgress,
      appSettings: useAppSettingsStore().appSettings,
      user: taskGroup.value.user,
      client: await createBiliClient(taskGroup.value.user),
    }
  }

  const initTaskGroupView = async (onCleanup: (cleanupFn: () => void) => void) => {
    const context = createInitContext(onCleanup)
    await loadTaskItems(context)
    if (toValue(autoExec)) {
      await execTaskGroup(context)
    } else if (taskGroup.value.status === 'running') {
      loopUpdate(context).then()
    }
  }

  const execTaskGroup = async (context?: InitContext): Promise<void> => {
    await baseExecTaskGroup(await buildExecContext(context ?? createInitContext()), taskGroup.value.id)
  }

  const cancelInit = () => {
    globalCanceled = true
  }

  return {
    taskItems,
    createInitContext,
    initTaskGroupView,
    cancelInit,
    cancelTaskGroup: baseCancelTaskGroup,
    execTaskGroup: execTaskGroup,
  }
}
