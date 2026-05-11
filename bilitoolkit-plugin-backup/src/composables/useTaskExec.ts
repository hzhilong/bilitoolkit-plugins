import { useLoadingData, showWarning } from 'bilitoolkit-ui'
import { useAppSessionStore } from '@/stores/app-session.js'
import { logger } from '@/common/logger.js'
import { DATA_MODULES_MAP } from '@/core/modules'
import { OperationTypeMap } from '@/core/types/operation'
import type { ExecuteContext, ExecuteOptions } from '@/core/types/execute'
import type { DataType } from '@/core/types/data-type'

export const useTaskExec = () => {
  const { loading, loadingData } = useLoadingData()
  const appSession = useAppSessionStore()
  const abortController = new AbortController()
  // 取消任务（如果已经在执行配置里设置中止信号，则该方法无效）
  const cancelTask = loadingData(() => {
    abortController.abort('取消任务')
  })
  // 开始执行任务
  const execTask = loadingData(async (context: ExecuteContext, dataType: DataType, options: ExecuteOptions) => {
    if (appSession.hasActiveTask) {
      showWarning('有其他任务正在执行')
      return
    }
    const { operationType } = options
    const dataModule = DATA_MODULES_MAP[dataType]
    const dataTypeName = dataModule.dataTypeName
    const operationTypeName = OperationTypeMap[operationType]
    if (!dataModule.operations.includes(operationType)) {
      throw new Error(`内部错误，[${dataTypeName}]不支持${operationTypeName}`)
    }
    // ======== 准备执行
    appSession.setActiveTask(true)

    if (!context.abortSignal) {
      // 没有传递中止信号的话，这里手动加一个
      context.abortSignal = abortController.signal
    }

    try {
      logger.info(`执行任务 ${operationTypeName} ${dataTypeName}`)
      return dataModule.execute(context, options)
    } catch (error: unknown) {
      logger.info('执行出错', error)
      throw error
    } finally {
      appSession.setActiveTask(false)
    }
  })
  return {
    loading,
    loadingData,
    execTask,
    cancelTask,
  }
}
