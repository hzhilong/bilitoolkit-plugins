import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { TaskGroupItem, CreateTaskGroupOptions, TaskGroupId } from '@/core/types/task-group'
import { taskService } from '@/core/service/task'
import { toolkitApi } from 'bilitoolkit-ui'
import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import { inArray } from '@/core/utils/array'
import type { Task } from '@/core/types/task'
import { executeTask } from '@/core/task/task-handle'
import { DATA_MODULES_MAP } from '@/core/modules'
import type { ExecuteContext, GroupExecuteContext } from '@/core/types/execute'
import { apiSleep } from '@/core/utils/sleep'
import { taskGroupService } from '@/core/service/task-group'
import { createAbortError, isCanceledError, getErrorMessage, convertToCommonError } from '@ybgnb/utils'
import { checkAbortSignal } from '@/core/utils/abort'

/**
 * 创建任务组
 */
export const createTaskGroup = async <O extends OperationType = OperationType>(options: CreateTaskGroupOptions<O>) => {
  const tasks: TaskGroupItem[] = []
  for (const { executeOptions, dataType } of options.items) {
    const { id } = await taskService.create({
      type: executeOptions.mode === 'batch' ? 'batch' : 'normal',
      user: {
        uid: options.user.mid,
        name: options.user.name,
      },
      executeOptions: executeOptions,
      operationType: options.operationType,
      dataType: dataType,
    })
    tasks.push({
      id,
      executeOptions,
      dataType,
    })
  }
  return await taskGroupService.create<O>({
    ...options,
    items: tasks,
  })
}

/**
 * 创建 bili-api 客户端
 */
const createBiliClient = async (user: UserInfoWithCookie) => {
  const clientConfig = await toolkitApi.bili.createBiliClient({
    context: {
      userCookie: user.userCookie,
    },
  })
  return clientConfig.id
}

/**
 * 执行任务组
 */
export const executeTaskGroup = async <O extends OperationType = OperationType>(
  groupContext: GroupExecuteContext,
  groupId: TaskGroupId,
) => {
  // 获取最新的任务组数据
  const taskGroup = await taskGroupService.getById(groupId)
  if (inArray(taskGroup.status, ['cancelled', 'failed', 'completed'])) {
    throw new Error('任务组已结束，不可再执行')
  }

  const { progressCallback, abortSignal, onStatusChange } = groupContext
  const operationName = OperationTypeMap[taskGroup.operationType]

  return new Promise<void>(async (resolve, reject) => {
    // 设置进度
    const setProgress = async (progress?: number, msg?: string) => {
      const intProgress = progress ? Math.floor(progress) : undefined
      if (progressCallback) {
        await progressCallback(intProgress, msg)
      }
      await taskGroupService.updateProgress(groupId, intProgress, msg)
    }

    let abortHandler
    // 中止任务组
    const abortTask = async () => {
      await setProgress(undefined, `任务组已被取消`)
      await taskGroupService.markAborted(groupId)
      onStatusChange?.('cancelled')
      reject(createAbortError())
    }

    try {
      await setProgress(0, `${operationName}任务组准备中`)
      // 开始执行前检查中止信号
      checkAbortSignal(abortSignal)
      abortHandler = abortTask
      abortSignal?.addEventListener('abort', abortHandler)

      const clientId = await createBiliClient(taskGroup.user)

      const context: ExecuteContext = {
        user: {
          uid: taskGroup.user.mid,
          name: taskGroup.user.name,
        },
        clientId: clientId,
        abortSignal: groupContext.abortSignal,
      }

      // 需要执行的任务
      const pendingTasks: Task<O>[] = []
      // 遍历任务项
      for (let i = 0; i < taskGroup.items.length; i++) {
        const { id } = taskGroup.items[i]
        const task = await taskService.getById(id)
        if (inArray(task.status, ['pending', 'batchCompleted'])) {
          pendingTasks.push(task as Task<O>)
        }
      }
      // 已结束的任务项个数
      const finishedCount = taskGroup.items.length - pendingTasks.length
      // 是否有未结束的批处理任务
      let hasPendingBatchTasks = false
      // 遍历需要执行的任务
      for (let i = 0; i < pendingTasks.length; i++) {
        const task = pendingTasks[i]
        const dataModule = DATA_MODULES_MAP[task.dataType]
        await setProgress(
          (100 * (i + 1 + finishedCount)) / taskGroup.items.length,
          `正在执行${OperationTypeMap[task.operationType]}任务 [${dataModule.dataTypeName}]`,
        )
        await executeTask<O>(context, dataModule, task)
        if ((await taskService.getById(task.id)).status === 'batchCompleted') {
          hasPendingBatchTasks = true
        }
        if (i < pendingTasks.length - 1) {
          await apiSleep(groupContext.abortSignal)
        }
      }
      if (hasPendingBatchTasks) {
        // 分批处理未结束
        await taskGroupService.markBatchCompleted(groupId)
        onStatusChange?.('batchCompleted')
      } else {
        // 执行完成
        await taskGroupService.markCompleted(groupId)
        onStatusChange?.('completed')
      }
      await setProgress(100, `${operationName}任务组执行成功`)
      resolve()
    } catch (error) {
      // 被中止
      if (isCanceledError(error)) {
        await abortTask()
      } else {
        // 遇到其他错误
        await taskGroupService.markFailed(groupId, getErrorMessage(error))
        onStatusChange?.('failed')
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
