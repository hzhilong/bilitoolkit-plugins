import type { TaskGroupId } from '@/core/types/task-group'
import { executeTaskGroup } from '@/core/task/task-group-handle'
import type { GroupExecuteContext } from '@/core/types/execute'

export class TaskSchedule {
  /**
   * 任务组 ID -> AbortController
   * 用于取消正在执行中的任务
   */
  private readonly abortControllers = new Map<TaskGroupId, AbortController>()

  /**
   * 执行任务组
   */
  async executeTaskGroup(context: GroupExecuteContext, groupId: TaskGroupId) {
    if (this.abortControllers.size > 0)
      throw new Error(`已有任务组[${this.abortControllers.keys().next().value}]正在执行`)
    if (context.signal?.aborted) {
      throw context.signal.reason
    }
    const abortController = new AbortController()
    try {
      this.abortControllers.set(groupId, abortController)
      await executeTaskGroup(
        {
          ...context,
          signal: context.signal ? AbortSignal.any([context.signal, abortController.signal]) : abortController.signal,
        },
        groupId,
      )
    } finally {
      this.abortControllers.delete(groupId)
    }
  }

  /**
   * 取消执行任务组
   * @param groupId
   */
  async abortTaskGroup(groupId: TaskGroupId) {
    const controller = this.abortControllers.get(groupId)
    if (!controller) return false

    controller.abort()
    return true
  }
}

export const taskSchedule = new TaskSchedule()
