import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { ExecuteContext } from '@/core/types/execute'
import type { Task, TaskResult } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { createAbortError, isCanceledError, getErrorMessage, convertToCommonError } from '@ybgnb/utils'
import type { DataModule, Data } from '@/core/types/data-module'
import { checkAbortSignal } from '@/core/utils/abort'

/**
 * 执行任务
 */
export const executeTask = <O extends OperationType = OperationType, D extends Data = Data>(
  context: ExecuteContext,
  dataModule: DataModule<D>,
  task: Task<O>,
): Promise<TaskResult<O, D>> => {
  const { user, progressCallback, abortSignal, clientId } = context
  const { operationType, id: taskId } = task
  const operationName = OperationTypeMap[operationType]

  return new Promise<TaskResult<O, D>>(async (resolve, reject) => {
    let abortHandler

    // 设置进度
    const setProgress = async (progress?: number, msg?: string) => {
      const intProgress = progress ? Math.floor(progress) : undefined
      if (progressCallback) {
        await progressCallback(intProgress, msg)
      }
      await taskService.updateProgress(taskId, intProgress, msg)
    }

    // 中止任务
    const abortTask = async () => {
      await setProgress(undefined, `${operationName}任务已被取消`)
      await taskService.markAborted(taskId)
      reject(createAbortError())
    }

    try {
      await setProgress(0, `${operationName}任务准备中`)
      // 开始执行前检查中止信号
      checkAbortSignal(abortSignal)
      abortHandler = abortTask
      abortSignal?.addEventListener('abort', abortHandler)

      await taskService.markRunning(taskId)
      const result = await dataModule.executeTask<O>(
        {
          user,
          clientId,
          abortSignal,
          progressCallback: setProgress,
        },
        task,
      )

      if ('batchProgress' in result && result.batchProgress && !result.batchProgress.isFinished) {
        // 分批处理未结束
        await taskService.markBatchCompleted(taskId, result)
      } else {
        // 执行完成
        await taskService.markCompleted(taskId, result)
      }

      await setProgress(100, `${operationName}任务执行成功`)
      resolve(result)
    } catch (error: unknown) {
      // 被中止
      if (isCanceledError(error)) {
        await abortTask()
      } else {
        // 遇到其他错误
        await taskService.markFailed(taskId, getErrorMessage(error))
        reject(convertToCommonError(error, '任务执行失败'))
      }
    } finally {
      // 清理取消监听器
      if (abortHandler) {
        abortSignal?.removeEventListener('abort', abortHandler)
      }
    }
  })
}
