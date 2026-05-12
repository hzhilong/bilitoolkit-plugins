import { showWarning } from 'bilitoolkit-ui'
import { useAppSessionStore } from '@/stores/app-session.js'
import { logger } from '@/common/logger.js'
import { type OperationType } from '@/core/types/operation'
import type { GroupExecuteContext } from '@/core/types/execute'
import type { CreateTaskGroupOptions, TaskGroupStatus } from '@/core/types/task-group'
import { createTaskGroup } from '@/core/task/task-group-handle'
import { taskSchedule } from '@/core/task/task-schedule'
import { checkAbortSignal } from '@/core/utils/abort'
import { ref } from 'vue'

export type CancelExecute = () => void

/**
 * 使用任务组
 */
export const useTaskGroup = () => {
  const appSession = useAppSessionStore()

  // 创建并执行任务组
  const execTaskGroup = async <O extends OperationType = OperationType>(
    { abortSignal, ...restContext }: GroupExecuteContext,
    options: CreateTaskGroupOptions<O>,
  ) => {
    if (appSession.hasActiveTask) {
      showWarning('有其他任务正在执行')
      return
    }
    const abortController = new AbortController()
    checkAbortSignal(abortSignal)

    const status = ref<TaskGroupStatus>('pending')
    const onStatusChange = (groupStatus: TaskGroupStatus) => {
      status.value = groupStatus
      restContext.onStatusChange?.(groupStatus)
    }

    // 合并并创建一个新的上下文
    const context: GroupExecuteContext = {
      ...restContext,
      abortSignal: abortSignal ? AbortSignal.any([abortSignal, abortController.signal]) : abortSignal,
      onStatusChange: onStatusChange,
    }

    const cancel: CancelExecute = () => {
      abortController.abort('任务组已取消')
    }

    try {
      logger.info(`创建任务组`, options)
      const group = await createTaskGroup(options)
      logger.info(`执行任务组`, group)
      const promise = (async () => {
        await taskSchedule.executeTaskGroup(context, group.id)
        appSession.setActiveTask(false)
      })()

      return {
        cancel,
        status,
        promise,
      }
    } catch (error: unknown) {
      logger.info('执行出错', error)
      throw error
    }
  }

  return {
    execTaskGroup,
  }
}
