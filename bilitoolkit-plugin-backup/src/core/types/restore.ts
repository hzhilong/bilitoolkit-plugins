import type { BackupAsset } from '@/core/types/backup'
import type { DataRange } from '@/core/types/data-range'
import type { BaseExecuteOptions } from '@/core/types/execute'
import type { BatchProgress } from '@/core/types/batch'
import type { Data } from '@/core/types/data-module'

/**
 * 基础还原选项
 */
export interface BaseRestoreOptions {
  /** 需要从哪些还原资源还原（暂时只支持json） */
  backupAssets: BackupAsset<'json'>[]
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
    dataRange: DataRange<'all' | 'page' | 'list'>
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
  original: D
  // 成功还原的数据
  restored: D
}

/**
 * 还原结果
 */
export type RestoreResult<D extends Data = Data> = {
  /** 已还原的数据 */
  restoredData?: RestoredData<D>
  /** 分批处理的进度 */
  batchProgress?: BatchProgress
}
