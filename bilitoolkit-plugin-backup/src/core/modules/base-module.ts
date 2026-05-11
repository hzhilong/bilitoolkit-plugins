import type { DataModule, FetchPageParams } from '@/core/types/data-module'
import type { DataType } from '@/core/types/data-type'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { ExportTarget, BackupDataRangeType, BackupAsset, BackupOptions, BackupResult } from '@/core/types/backup'
import type { ExecuteFn, ExecuteResult, ExecuteOptions, ExecuteContext, Data } from '@/core/types/execute'
import { createAbortError, isCanceledError, getErrorMessage, convertToCommonError } from '@ybgnb/utils'
import type { Task } from '@/core/task/task'
import { taskService } from '@/core/service/task'
import { getBackupBatchData } from '@/core/utils/batch'
import { exportTxtFile } from '@/core/utils/export'
import { getBackupDataByRange } from '@/core/utils/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import { apiSleep } from '@/core/utils/sleep'

/**
 * 模块基类
 */
export abstract class BaseModule<D = Data> implements DataModule<D> {
  /** 数据类型 */
  abstract dataType: DataType
  /** 数据类型名称 */
  abstract dataTypeName: string
  /** 可操作的类型 */
  abstract operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  abstract backupDataRangeType: BackupDataRangeType[]
  /** 备份支持的导出目标 */
  abstract exportTargets: ExportTarget[]

  /** 获取数据总条数 */
  abstract fetchTotal?(context: ExecuteContext): Promise<number>

  /** 获取所有数据（单个数据要包装为数组） */
  abstract fetchPage(context: ExecuteContext, params: FetchPageParams): Promise<PageDataWithNextParams<D>>

  /** 获取所有数据（单个数据要包装为数组） */
  async fetchAll(context: ExecuteContext): Promise<D[]> {
    // 这里因为是通过主进程代理发起请求
    // 为了实现取消的功能，需手动循环调用，不能直接使用bili-api的fetchAll方法
    let pageNum = 1
    const list: D[] = []

    let total: number | null = null
    if (this.fetchTotal) {
      await context.progressCallback(1, `正在获取数据条数`)
      total = await this.fetchTotal(context)
      await apiSleep(context.abortSignal)
    }
    let progress = 1

    while (true) {
      if (context.abortSignal?.aborted) {
        break
      }
      const pageData = await this.fetchPage(context, {
        pageNum: pageNum,
      })
      if (pageData === null) break

      if (pageData.items) {
        list.push(...pageData.items)
        if (total) {
          await context.progressCallback(
            (100 * list.length) / total,
            `第 ${pageNum}/${Math.ceil(total / pageData.pageSize)} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
          )
        } else {
          await context.progressCallback(
            progress,
            `第 ${pageNum} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
          )
          progress++
        }
      }

      if (!pageData.hasNext) break

      await apiSleep(context.abortSignal)
      pageNum++
    }
    return list
  }

  /** 执行操作 */
  execute: ExecuteFn = <O extends OperationType = OperationType>(
    context: ExecuteContext,
    executeOptions: ExecuteOptions<O>,
  ): Promise<ExecuteResult<O, D>> => {
    const { user, progressCallback, abortSignal, clientId } = context
    const operationType = executeOptions.operationType
    const operationName = OperationTypeMap[operationType]

    return new Promise<ExecuteResult<O, D>>(async (resolve, reject) => {
      let abortHandler
      let task: Task<O, D> | null = null

      // 设置进度
      const setProgress = async (progress?: number, msg?: string) => {
        const intProgress = progress ? Math.floor(progress) : undefined
        await progressCallback(intProgress, msg)
        if (task) {
          await taskService.updateTaskProgress(task.id, intProgress, msg)
        }
      }

      // 中止任务
      const abortTask = async () => {
        await setProgress(undefined, `${operationName}任务已被取消`)
        if (task) {
          await taskService.markTaskAborted(task.id)
        }
        reject(createAbortError())
      }

      try {
        await setProgress(0, `${operationName}任务准备中`)
        // 开始执行前检查中止信号
        this.checkAbortSignal(abortSignal)
        abortHandler = abortTask
        abortSignal?.addEventListener('abort', abortHandler)

        task = await taskService.createTask({
          type: executeOptions.mode === 'batch' ? 'batch' : 'normal',
          user: user,
          executeOptions: executeOptions,
          operationType: operationType,
          dataType: this.dataType,
        })
        await setProgress(0, `${operationName}任务创建成功，等待执行`)

        await taskService.markTaskRunning(task.id)
        const result = await this.doExecute<O>(
          {
            user,
            clientId,
            abortSignal,
            progressCallback: setProgress,
          },
          task,
        )

        await taskService.markTaskCompleted(task.id, result)
        await setProgress(100, `${operationName}任务执行成功`)
        resolve(result)
      } catch (error: unknown) {
        // 被中止
        if (isCanceledError(error)) {
          await abortTask()
        } else {
          // 遇到其他错误
          if (task) {
            await taskService.markTaskFailed(task.id, getErrorMessage(error))
          }
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

  /**
   * 获取数据总数的描述信息（这里不方便统一，因为存在多层级数据/单个数据）
   * @description 比如 '1个收藏夹，256个视频' 或者 '用户偏好设置'
   */
  abstract getDataTotalDesc(list: D[]): string

  /**
   * 子类需要实现的具体执行操作
   * @protected
   */
  protected doExecute = async <O extends OperationType = OperationType>(
    context: ExecuteContext,
    task: Task<O, D>,
  ): Promise<ExecuteResult<O, D>> => {
    if (task.executeOptions.operationType === 'backup') {
      return (await this.handleBackup(context, task as Task<'backup', D>)) as ExecuteResult<O, D>
    } else if (task.executeOptions.operationType === 'restore') {
      throw new Error('暂未支持')
    } else {
      throw new Error('暂未支持')
    }
  }

  protected handleBackup = async (
    context: ExecuteContext,
    task: Task<'backup', D>,
  ): Promise<ExecuteResult<'backup', D>> => {
    if (task.executeOptions.mode === 'batch') {
      // 分批处理
      const backupOptions = task.executeOptions
      const { batchOptions } = backupOptions
      const { list, batchProgress } = await getBackupBatchData<D>(this, batchOptions, context)
      // 导出备份资源
      const assets = await this.exportBackupAsset(context, task as Task<'backup', D>, backupOptions, list)
      const result: BackupResult = {
        backupAssets: assets,
        batchProgress: batchProgress,
      }
      let msg
      if (batchProgress.remainingDataCount !== undefined && batchProgress.remainingBatchCount !== undefined) {
        // 分批处理进度有剩余批次的信息
        msg = `[${batchOptions.startBatch}/${batchProgress.remainingBatchCount}] 已备份 ${this.getDataTotalDesc(list)}`
      } else {
        msg = `[${batchOptions.startBatch}] 已备份 ${this.getDataTotalDesc(list)}`
      }
      return {
        success: true,
        msg: msg,
        ...result,
      } as ExecuteResult<'backup', D>
    } else {
      // 分批处理
      const backupOptions = task.executeOptions
      // 普通模式
      const list = await getBackupDataByRange(this, backupOptions.dataRange, context)
      // 导出备份资源
      const assets = await this.exportBackupAsset(context, task as Task<'backup', D>, backupOptions, list)
      return {
        success: true,
        msg: `已备份 ${this.getDataTotalDesc(list)}`,
        backupAssets: assets,
      } as ExecuteResult<'backup', D>
    }
  }

  protected exportBackupAsset = async (
    { abortSignal, progressCallback }: ExecuteContext,
    task: Task<'backup', D>,
    options: BackupOptions,
    data: D[],
  ) => {
    const lastBackupResult = task.result as BackupResult | undefined
    const assets: BackupAsset[] = []
    for (const exportTarget of options.exportTargets) {
      if (abortSignal?.aborted) {
        // 已被取消，记录已导出的资源
        await taskService.markTaskAborted(task.id, {
          backupAssets: assets,
        })
        throw createAbortError()
      }
      await progressCallback(
        undefined,
        `[${assets.length + 1}/${options.exportTargets.length}] 正在导出 ${exportTarget} 文件`,
      )
      if (exportTarget === 'json') {
        assets.push(
          await exportTxtFile(
            this.dataType,
            options.rootPath,
            'json',
            JSON.stringify(data),
            lastBackupResult?.batchProgress,
          ),
        )
      } else {
        // TODO 调用子类实现其他文件的导出
        throw new Error('暂未支持')
      }
    }
    return assets
  }

  /**
   * 检查取消信号
   */
  checkAbortSignal(abortSignal?: AbortSignal) {
    if (abortSignal?.aborted) {
      throw createAbortError()
    }
  }
}
