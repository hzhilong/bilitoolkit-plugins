import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { ExecuteContext, BaseExecuteOptions } from '@/core/types/execute'
import type { Task, TaskResult } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { createAbortError, isCanceledError, getErrorMessage, convertToCommonError } from '@ybgnb/utils'
import type { Data } from '@/core/types/data-module'
import { checkAbortSignal } from '@/core/utils/abort'
import { inArray } from '@/core/utils/array'
import type { DataModule } from '@/core/modules/data-module'
import { taskLogService } from '@/core/service/task-log'

const assertCanExecute = async (task: Task) => {
  if (task.status !== 'pending') {
    if (task.status !== 'batchCompleted') {
      throw new Error('任务已结束，不可再次执行')
    } else {
      if (!inArray(task.operationType, ['backup', 'restore'])) {
        throw new Error(`内部错误，[${task.operationType}] 不支持分批处理`)
      } else {
        const batchOptions = (task.executeOptions as BaseExecuteOptions<'backup' | 'restore', 'batch'> | undefined)
          ?.batchOptions
        if (!batchOptions) {
          throw new Error(`内部错误，batchOptions 为空`)
        }
        const batchProgress = (task.result as TaskResult<'backup' | 'restore'> | undefined)?.batchProgress
        if (!batchProgress) {
          throw new Error(`内部错误，batchProgress 为空`)
        }
        // 分批处理的执行参数
        batchOptions.startBatch = batchProgress.nextBatch
        batchOptions.pageParams = batchProgress.nextBatchPageParams
        batchOptions.pageNum = batchProgress.nextBatch
      }
    }
  }
}

/**
 * 执行任务
 */
export const executeTask = async <O extends OperationType = OperationType, D extends Data = Data>(
  context: ExecuteContext,
  dataModule: DataModule<D>,
  task: Task<O, D>,
): Promise<TaskResult<O, D>> => {
  await assertCanExecute(task)
  const { user, onProgress, onStatusChange, signal, clientId, appSettings } = context
  const { operationType, id: taskId } = task
  const operationName = OperationTypeMap[operationType]

  return new Promise<TaskResult<O, D>>(async (resolve, reject) => {
    let abortHandler

    // 设置进度
    const setProgress = async (progress?: number, msg?: string) => {
      const intProgress = progress ? Math.floor(progress) : undefined
      if (onProgress) {
        await onProgress(intProgress, msg)
      }
      await taskService.updateProgress(taskId, intProgress, msg)
      if (msg) {
        await taskLogService.create({
          taskId,
          content: msg,
        })
      }
    }

    // 中止任务
    const abortTask = async () => {
      await setProgress(undefined, `${operationName}任务已取消`)
      await taskService.markAborted(taskId)
      onStatusChange?.('cancelled')
      reject(createAbortError())
    }

    try {
      await setProgress(0, `${operationName}任务准备中`)
      // 开始执行前检查中止信号
      checkAbortSignal(signal)
      abortHandler = abortTask
      //      signal?.addEventListener('abort', abortHandler)

      await taskService.markRunning(taskId)
      onStatusChange?.('running')
      const result = await dataModule.executeTask<O>(
        {
          user,
          clientId,
          signal: signal,
          onProgress: setProgress,
          appSettings: appSettings,
        },
        task,
      )

      if ('batchProgress' in result && result.batchProgress && !result.batchProgress.isFinished) {
        // 分批处理未结束
        await taskService.markBatchCompleted(taskId, result)
        onStatusChange?.('batchCompleted')
      } else {
        // 执行完成
        await taskService.markCompleted(taskId, result)
        onStatusChange?.('completed')
      }

      await setProgress(100, result.msg ?? `${operationName}任务执行成功`)
      resolve(result)
    } catch (error: unknown) {
      // 被中止
      if (isCanceledError(error)) {
        await abortTask()
      } else {
        // 遇到其他错误
        const errorMessage = getErrorMessage(error)
        await taskService.markFailed(taskId, errorMessage)
        await setProgress(undefined, errorMessage)
        onStatusChange?.('failed')
        reject(convertToCommonError(error, '任务执行失败'))
      }
    } finally {
      // 清理取消监听器
      if (abortHandler) {
        signal?.removeEventListener('abort', abortHandler)
      }
    }
  })
}
