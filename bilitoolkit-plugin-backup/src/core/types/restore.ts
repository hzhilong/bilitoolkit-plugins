import type { DataRange } from '@/core/types/data-range'
import type { BaseExecuteOptions } from '@/core/types/execute'
import type { BatchProgress } from '@/core/types/batch'
import type { Data } from '@/core/types/data-module'
import type { TaskId } from '@/core/types/task'

/**
 * 基础还原选项
 */
export interface BaseRestoreOptions {
  /** 从哪个备份任务还原 */
  backupTaskId: TaskId
}

/**
 * 分批处理模式的还原选项
 */
export type RestoreBatchOptions = BaseRestoreOptions & BaseExecuteOptions<'restore', 'batch'>

/**
 * 普通模式的还原选项
 */
export type RestoreNormalOptions = BaseRestoreOptions &
  BaseExecuteOptions<'restore', 'normal'> & {
    /** 数据范围 */
    dataRange: DataRange<'all' | 'page' | 'tree'>
  }

/**
 * 还原选项
 */
export type RestoreOptions = RestoreBatchOptions | RestoreNormalOptions

/**
 * 已还原的数据
 */
export interface RestoredData<D extends Data = Data> {
  // 原数据
  original: D[]
  // 成功还原的数据
  restored: D[]
}

export interface BaseRestoreResult<D extends Data = Data> {
  /** 已还原的数据描述 */
  successDataDesc: string
  /** 还原失败的数据描述 */
  failedDataDesc: string
  /** 还原失败的数据 */
  failedItems: D[]
}

/**
 * 还原结果
 */
export interface RestoreResult<D extends Data = Data> extends BaseRestoreResult<D> {
  /** 分批处理的进度 */
  batchProgress?: BatchProgress
}
