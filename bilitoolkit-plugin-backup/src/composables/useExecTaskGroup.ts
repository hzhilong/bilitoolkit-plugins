import { useAppSessionStore } from '@/stores/app-session.js'
import { logger } from '@/common/logger.js'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { GroupExecuteContext, User } from '@/core/types/execute'
import type { CreateTaskGroupOptions, TaskGroupStatus, TaskGroup, TaskGroupId } from '@/core/types/task-group'
import { createTaskGroup } from '@/core/task/task-group-handle'
import { taskSchedule } from '@/core/task/task-schedule'
import { checkAbortSignal } from '@/core/utils/abort'
import { ref, type MaybeRefOrGetter, toValue } from 'vue'
import { CommonError } from '@ybgnb/utils'
import { taskGroupService } from '@/core/service/task-group'

export type CancelExecute = () => void

/**
 * 使用任务组
 */
export const useExecTaskGroup = () => {
  const sessionStore = useAppSessionStore()

  const assertNoActiveTask = () => {
    if (sessionStore.hasActiveTaskGroup) {
      if (sessionStore.activeTaskGroup) {
        const optName = OperationTypeMap[sessionStore.activeTaskGroup.operationType]
        throw new CommonError(`当前已有${optName}任务正在执行 id=${sessionStore.activeTaskGroup?.id}`)
      } else {
        throw new CommonError(`当前已有任务正在执行`)
      }
    }
    return true
  }

  const assertUserLoggedIn = (user: MaybeRefOrGetter<User>) => {
    if (!toValue(user)) throw new CommonError(`用户未登录`)
    return true
  }

  // 创建并执行任务组
  const execTaskGroup = async <O extends OperationType = OperationType>(
    { signal, ...restContext }: GroupExecuteContext,
    options: TaskGroupId | CreateTaskGroupOptions<O>,
  ) => {
    assertNoActiveTask()
    if (typeof options !== 'number') {
      assertUserLoggedIn(options.user)
    }

    const abortController = new AbortController()
    checkAbortSignal(signal)

    const status = ref<TaskGroupStatus>('pending')
    const onStatusChange = (groupStatus: TaskGroupStatus) => {
      status.value = groupStatus
      restContext.onStatusChange?.(groupStatus)
    }

    // 合并并创建一个新的上下文
    const context: GroupExecuteContext = {
      ...restContext,
      signal: signal ? AbortSignal.any([signal, abortController.signal]) : abortController.signal,
      onStatusChange: onStatusChange,
    }

    const cancel: CancelExecute = () => {
      abortController.abort('任务组已取消')
    }

    let taskGroup: TaskGroup<O> | null = null
    try {
      if (typeof options === 'number') {
        taskGroup = await taskGroupService.getById(options)
        assertUserLoggedIn(taskGroup.user)
      } else {
        logger.info(`创建任务组`, options)
        taskGroup = await createTaskGroup(options)
      }

      sessionStore.setActiveTaskGroupFlag(true)
      sessionStore.setActiveTaskGroup(taskGroup)
      logger.info(`执行任务组`, taskGroup)
      const promise = (async () => {
        try {
          await taskSchedule.executeTaskGroup(context, taskGroup.id)
        } finally {
          sessionStore.setActiveTaskGroupFlag(false)
        }
      })()

      return {
        cancel,
        status,
        promise,
        taskGroup,
      }
    } catch (error: unknown) {
      logger.info('执行出错', error)
      sessionStore.setActiveTaskGroupFlag(false)
      throw error
    } finally {
    }
  }

  const cancelTaskGroup = async (groupId: TaskGroupId) => {
    return await taskSchedule.abortTaskGroup(groupId)
  }

  return {
    assertUserLoggedIn,
    assertNoActiveTask,
    execTaskGroup,
    cancelTaskGroup,
  }
}
