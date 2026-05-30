import type { Data, FetchPageParams } from '@/core/types/data-module'
import type { DataType } from '@/core/types/data-type'
import { type OperationType } from '@/core/types/operation'
import type {
  ExportTarget,
  BackupDataRangeType,
  BackupAsset,
  BackupOptions,
  BackupBatchOptions,
  BackupNormalOptions,
} from '@/core/types/backup'
import type { ExecuteContext } from '@/core/types/execute'
import { createAbortError, getErrorMessage } from '@ybgnb/utils'
import { taskService } from '@/core/service/task'
import { getBatchBackupData, getBatchRestoreData } from '@/core/utils/batch'
import { exportTxtFile } from '@/core/utils/export'
import { getBackupDataByRange, getRestoreDataByRange } from '@/core/utils/data-range'
import { apiSleep } from '@/core/utils/sleep'
import type { Task, TaskResult } from '@/core/types/task'
import type { BatchProgress } from '@/core/types/batch'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import type { RestoreNormalOptions, RestoreBatchOptions, BaseRestoreResult } from '@/core/types/restore'
import { checkAbortSignal } from '@/core/utils/abort'
import type { ClearOptions } from '@/core/types/clear'

/**
 * 模块基类
 */
export abstract class DataModule<D extends Data = Data> {
  /** 数据类型 */
  abstract dataType: DataType
  /** 数据类型名称 */
  abstract dataTypeName: string
  /** 可操作的类型 */
  abstract operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  abstract backupDataRangeTypes: BackupDataRangeType[]
  /** 备份支持的导出目标 */
  abstract exportTargets: ExportTarget[]
  /**
   * 获取数据总数的描述信息（这里不方便统一，因为存在多层级数据/单个数据）
   * @description 比如 '1个收藏夹，256个视频' 或者 '用户偏好设置'
   */
  abstract getDataTotalDesc(list: D[]): string
  /** 获取数据标题 */
  abstract getDataTitle(data: D): string
  /** 分页大小（备份时的数据接口分页策略，树形数据表示第二层的分页大小） */
  abstract getPageSize(): number
  /** 获取数据总条数 */
  fetchTotal?(context: ExecuteContext): Promise<number>
  /** 获取分页数据（单个数据要包装为数组） */
  abstract fetchPage(context: ExecuteContext, params: FetchPageParams): Promise<PageDataWithNextParams<D>>
  /** 获取所有数据（单个数据要包装为数组） */
  fetchAll(context: ExecuteContext): Promise<D[]> {
    return this.baseFetchAll(context)
  }
  /** 还原数据，返回新数据的id（目前仅在 TreeDataModule 中使用到） */
  abstract restoreData(context: ExecuteContext, data: D): Promise<string | void>
  /** 是否支持一键清空。 true - clearData方法不会传递 list */
  supportsOneClickClear?: boolean
  /** 清空数据。可能返回清空结果 */
  abstract clearData(context: ExecuteContext, list: D[]): Promise<string | void>

  /** 获取所有数据 */
  protected async baseFetchAll(context: ExecuteContext): Promise<D[]> {
    const onProgress = async (progress?: number, msg?: string) => {
      if (context.onProgress) {
        await context.onProgress(progress, msg)
      }
    }

    // 这里因为是通过主进程代理发起请求
    // 为了实现取消的功能，需手动循环调用，不能直接使用bili-api的fetchAll方法
    let pageNum = 1
    const list = []

    let total: number | undefined = undefined
    await onProgress(1, `正在获取总数`)
    if (this.fetchTotal) {
      total = await this.fetchTotal(context)
      await apiSleep(context.signal)
    }

    let progress = 1

    let pageParams = {}

    while (true) {
      if (context.signal?.aborted) {
        break
      }
      checkAbortSignal(context.signal)

      const pageData = await this.fetchPage(context, {
        pageNum: pageNum,
        pageParams: pageParams,
      })

      pageParams = pageData.nextParams

      if (pageData.items) {
        list.push(...pageData.items)
        // 显示进度

        if (total) {
          await onProgress(
            (100 * list.length) / total,
            `第 ${pageNum}/${Math.ceil(total / pageData.pageSize)} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
          )
        } else {
          await onProgress(progress, `第 ${pageNum} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`)
        }
        progress++
      }

      if (!pageData.hasNext) break

      await apiSleep(context.signal)
      pageNum++
    }
    return list
  }

  /**
   * 子类需要实现的具体执行操作
   * @protected
   */
  public async executeTask<O extends OperationType = OperationType>(
    context: ExecuteContext,
    task: Task<O, D>,
  ): Promise<TaskResult<O, D>> {
    if (task.executeOptions.operationType === 'backup') {
      return (await this.handleBackup(context, task as Task<'backup', D>)) as TaskResult<O, D>
    } else if (task.executeOptions.operationType === 'restore') {
      return (await this.handleRestore(context, task as Task<'restore', D>)) as unknown as TaskResult<O, D>
    } else if (task.executeOptions.operationType === 'clear') {
      return (await this.handleClear(context, task as Task<'clear', D>)) as unknown as TaskResult<O, D>
    } else {
      throw new Error('暂未支持')
    }
  }

  protected async handleBackup(context: ExecuteContext, task: Task<'backup', D>): Promise<TaskResult<'backup', D>> {
    if (task.executeOptions.mode === 'batch') {
      // 分批模式
      return await this.handleBatchBackup(context, task)
    } else {
      // 普通模式
      return await this.handleNormalBackup(context, task)
    }
  }

  /**
   * 处理普通模式备份
   */
  protected async handleNormalBackup(context: ExecuteContext, task: Task<'backup', D>) {
    const backupOptions = task.executeOptions as BackupNormalOptions
    // 获取备份数据
    const list = await getBackupDataByRange(this, backupOptions.dataRange, context)
    // 导出备份资源
    const assets = await this.exportBackupAsset(context, task as Task<'backup', D>, backupOptions, list)
    return {
      success: true,
      msg: `已备份 ${this.getDataTotalDesc(list)}`,
      backupAssets: assets,
    } as TaskResult<'backup', D>
  }

  /**
   * 处理分批模式备份
   */
  protected async handleBatchBackup(context: ExecuteContext, task: Task<'backup', D>) {
    const backupOptions = task.executeOptions as BackupBatchOptions
    const { batchOptions } = backupOptions
    // 获取分批次处理的备份数据
    const { list, batchProgress } = await getBatchBackupData<D>(this, batchOptions, context)
    // 导出备份资源
    const assets = await this.exportBackupAsset(context, task as Task<'backup', D>, backupOptions, list, batchProgress)
    let msg
    if (batchProgress.totalBatchCount) {
      // 分批处理进度有剩余批次的信息
      msg = `批次 [${batchOptions.startBatch}/${batchProgress.totalBatchCount}] 已备份 ${this.getDataTotalDesc(list)}`
    } else {
      msg = `批次 [${batchOptions.startBatch}] 已备份 ${this.getDataTotalDesc(list)}`
    }
    return {
      success: true,
      msg: msg,
      backupAssets: [...(task.result?.backupAssets ?? []), ...assets],
      batchProgress: batchProgress,
    } as TaskResult<'backup', D>
  }

  protected async exportBackupAsset(
    { signal, onProgress }: ExecuteContext,
    task: Task<'backup', D>,
    options: BackupOptions,
    data: D[],
    batchProgress?: BatchProgress,
  ) {
    const assets: BackupAsset[] = []
    // 遍历配置的可导出资源
    for (const exportTarget of options.exportTargets) {
      if (signal?.aborted) {
        // 已被取消，记录已导出的资源
        await taskService.markAborted(task.id, {
          backupAssets: assets,
        })
        throw createAbortError()
      }

      if (onProgress) {
        await onProgress(
          undefined,
          `[${assets.length + 1}/${options.exportTargets.length}] 正在导出 ${exportTarget} 文件`,
        )
      }
      if (exportTarget === 'json') {
        assets.push(await exportTxtFile(this.dataType, options.rootPath, 'json', JSON.stringify(data), batchProgress))
      } else {
        // TODO 调用子类实现其他文件的导出
        throw new Error('暂未支持')
      }
    }
    return assets
  }

  protected async handleRestore(context: ExecuteContext, task: Task<'restore', D>): Promise<TaskResult<'restore', D>> {
    const backedUpTask = await taskService.getById<'backup', D>(task.executeOptions.backupTaskId)
    context.onProgress?.(1, '获取数据中...')
    if (task.executeOptions.mode === 'batch') {
      // 分批模式
      return await this.handleBatchRestore(context, task, backedUpTask)
    } else {
      // 普通模式
      return await this.handleNormalRestore(context, task, backedUpTask)
    }
  }

  protected async handleNormalRestore(
    context: ExecuteContext,
    task: Task<'restore', D>,
    backedUpTask: Task<'backup', D>,
  ): Promise<TaskResult<'restore', D>> {
    const options = task.executeOptions as RestoreNormalOptions
    // 获取选取的备份数据
    const list = await getRestoreDataByRange(this, options.dataRange, context, backedUpTask)
    const restoreResult = await this.baseRestoreData(context, list.reverse())
    // 开始还原
    return {
      success: true,
      msg: `已还原 ${this.getDataTotalDesc(list)}`,
      ...restoreResult,
    } as TaskResult<'restore', D>
  }

  protected async handleBatchRestore(
    context: ExecuteContext,
    task: Task<'restore', D>,
    backedUpTask: Task<'backup', D>,
  ): Promise<TaskResult<'restore', D>> {
    const options = task.executeOptions as RestoreBatchOptions
    const { batchOptions } = options
    // 获取分批次处理的备份数据
    const { list, batchProgress } = await getBatchRestoreData<D>(this, batchOptions, context, backedUpTask)
    const finalList = list.reverse()
    const restoreResult = await this.baseRestoreData(context, finalList)
    return {
      success: true,
      msg: `批次 [${batchOptions.startBatch}/${batchProgress.totalBatchCount}] 已还原${this.getDataTotalDesc(finalList)}`,
      batchProgress: batchProgress,
      ...restoreResult,
    } as TaskResult<'restore', D>
  }

  protected async baseRestoreData(context: ExecuteContext, list: D[]): Promise<BaseRestoreResult<D>> {
    if (list.length === 0) {
      context.onProgress?.(1, '读取的数据为空')
      throw new Error('读取的数据为空')
    }
    const successItems: D[] = []
    const failedItems: D[] = []
    context.onProgress?.(1, `即将还原：${this.getDataTotalDesc(list)}`)
    let failureCount = 0
    const restoreMaxFailures = context.appSettings.restoreMaxFailures
    for (let i = 0; i < list.length; i++) {
      checkAbortSignal(context.signal)
      const item = list[i]
      const progress = Math.floor(((i + 1) * 100) / list.length)
      try {
        await this.restoreData(context, item)
        successItems.push(item)
        context.onProgress?.(progress, `[${i + 1}/${list.length}] 还原数据成功 [${this.getDataTitle(item)}]`)
      } catch (e) {
        context.onProgress?.(
          progress,
          `[${i + 1}/${list.length}] 还原数据失败 [${this.getDataTitle(item)}] err：${getErrorMessage(e)}`,
        )
        failedItems.push(item)
        failureCount++
        if (restoreMaxFailures !== 0 && failureCount > restoreMaxFailures) {
          throw new Error('失败次数已超过限制，任务终止')
        }
      }
      await apiSleep(context.signal)
    }
    return {
      successDataDesc: this.getDataTotalDesc(successItems),
      failedDataDesc: failedItems.length > 0 ? this.getDataTotalDesc(failedItems) : '',
      failedItems,
    }
  }

  protected async handleClear(context: ExecuteContext, task: Task<'clear', D>): Promise<TaskResult<'clear', D>> {
    const _options = task.executeOptions as ClearOptions
    const list = this.supportsOneClickClear ? [] : await this.fetchAll(context)
    // 获取选取的备份数据
    const resultMsg = await this.clearData(context, list)
    // 开始还原
    return {
      success: true,
      msg: resultMsg ?? `已清空`,
    } as TaskResult<'restore', D>
  }

  async baseClearData(context: ExecuteContext, list: D[], clearFn: (data: D) => Promise<void>): Promise<string | void> {
    if (list.length === 0) {
      context.onProgress?.(1, '数据为空，无需操作')
      return '数据为空，无需操作'
    }
    const successItems: D[] = []
    context.onProgress?.(1, `即将清空：${this.getDataTotalDesc(list)}`)
    let failureCount = 0
    const maxFailures = context.appSettings.clearMaxFailures
    for (let i = 0; i < list.length; i++) {
      checkAbortSignal(context.signal)
      const item = list[i]
      const progress = Math.floor(((i + 1) * 100) / list.length)
      try {
        await clearFn(item)
        successItems.push(item)
        context.onProgress?.(progress, `[${i + 1}/${list.length}] 数据删除成功 [${this.getDataTitle(item)}]`)
      } catch (e) {
        context.onProgress?.(
          progress,
          `[${i + 1}/${list.length}] 数据删除失败 [${this.getDataTitle(item)}] err：${getErrorMessage(e)}`,
        )
        failureCount++
        if (maxFailures !== 0 && failureCount > maxFailures) {
          throw new Error('失败次数已超过限制，任务终止')
        }
      }
      await apiSleep(context.signal)
    }
    return `已删除 ${this.getDataTotalDesc(successItems)}`
  }
}
