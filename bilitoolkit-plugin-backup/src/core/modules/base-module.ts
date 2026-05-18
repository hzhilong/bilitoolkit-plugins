import type { DataModule, FetchTotal, FetchPage, FetchTreeQuery, FetchAll, Data } from '@/core/types/data-module'
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
import { createAbortError } from '@ybgnb/utils'
import { taskService } from '@/core/service/task'
import { getBatchBackupData } from '@/core/utils/batch'
import { exportTxtFile } from '@/core/utils/export'
import { getBackupDataByRange } from '@/core/utils/data-range'
import { apiSleep } from '@/core/utils/sleep'
import type { Task, TaskResult } from '@/core/types/task'
import type { TreeRangeOptions } from '@/core/types/data-range'
import type { BatchProgress } from '@/core/types/batch'

/**
 * 模块基类
 */
export abstract class BaseModule<D extends Data> implements DataModule<D> {
  /** 数据类型 */
  abstract dataType: DataType
  /** 数据类型名称 */
  abstract dataTypeName: string
  /** 可操作的类型 */
  abstract operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  abstract backupDataRangeTypes: BackupDataRangeType[]
  /** 树形范围的选项（仅支持两层） */
  treeRangeOptions?: TreeRangeOptions<D>
  /** 备份支持的导出目标 */
  abstract exportTargets: ExportTarget[]
  /** 获取数据总条数 */
  fetchTotal?: FetchTotal<D>
  /** 构建分页大小（备份时的数据接口分页策略） */
  abstract getPageSize: () => number
  /** 获取分页数据（单个数据要包装为数组） */
  abstract fetchPage: FetchPage<D>
  /** 获取所有数据（单个数据要包装为数组） */
  abstract fetchAll: FetchAll<D>

  /** 获取所有数据 */
  protected baseFetchAll = async (context: ExecuteContext, query?: FetchTreeQuery) => {
    // 这里因为是通过主进程代理发起请求
    // 为了实现取消的功能，需手动循环调用，不能直接使用bili-api的fetchAll方法
    let pageNum = 1
    const list: D[] = []

    let total: number | null = null
    if (this.fetchTotal) {
      if (context.onProgress) {
        await context.onProgress(1, `正在获取数据条数`)
      }
      total = await this.fetchTotal(context, query)
      await apiSleep(context.abortSignal)
    }
    let progress = 1

    while (true) {
      if (context.abortSignal?.aborted) {
        break
      }
      const pageData = await this.fetchPage(
        context,
        {
          pageNum,
        },
        query,
      )
      if (pageData === null) break

      if (pageData.items) {
        list.push(...pageData.items)
        if (context.onProgress) {
          if (total) {
            await context.onProgress(
              (100 * list.length) / total,
              `第 ${pageNum}/${Math.ceil(total / pageData.pageSize)} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
            )
          } else {
            await context.onProgress(
              progress,
              `第 ${pageNum} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
            )
            progress++
          }
        }
      }

      if (!pageData.hasNext) break

      await apiSleep(context.abortSignal)
      pageNum++
    }
    return list
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
  public executeTask = async <O extends OperationType = OperationType>(
    context: ExecuteContext,
    task: Task<O, D>,
  ): Promise<TaskResult<O, D>> => {
    if (task.executeOptions.operationType === 'backup') {
      return (await this.handleBackup(context, task as Task<'backup', D>)) as TaskResult<O, D>
    } else if (task.executeOptions.operationType === 'restore') {
      throw new Error('暂未支持')
    } else {
      throw new Error('暂未支持')
    }
  }

  protected handleBackup = async (
    context: ExecuteContext,
    task: Task<'backup', D>,
  ): Promise<TaskResult<'backup', D>> => {
    if (task.executeOptions.mode === 'batch') {
      // 分批模式
      return await this.handleBatchBackup(task, context)
    } else {
      // 普通模式
      return await this.handleNormalBackup(task, context)
    }
  }

  /**
   * 处理普通模式备份
   */
  protected async handleNormalBackup(task: Task<'backup', D>, context: ExecuteContext) {
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
  protected async handleBatchBackup(task: Task<'backup', D>, context: ExecuteContext) {
    const backupOptions = task.executeOptions as BackupBatchOptions
    const { batchOptions } = backupOptions
    // 获取分批次处理的备份数据
    const { list, batchProgress } = await getBatchBackupData<D>(this, batchOptions, context)
    // 导出备份资源
    const assets = await this.exportBackupAsset(context, task as Task<'backup', D>, backupOptions, list, batchProgress)
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
      backupAssets: [...(task.result?.backupAssets ?? []), ...assets],
      batchProgress: batchProgress,
    } as TaskResult<'backup', D>
  }

  // TODO 完善树形文件设计
  protected exportBackupAsset = async (
    { abortSignal, onProgress }: ExecuteContext,
    task: Task<'backup', D>,
    options: BackupOptions,
    data: D[],
    batchProgress?: BatchProgress,
  ) => {
    const assets: BackupAsset[] = []
    // 遍历配置的可导出资源
    for (const exportTarget of options.exportTargets) {
      if (abortSignal?.aborted) {
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
}
