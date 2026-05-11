import type { BackupAsset } from '@/core/types/backup'
import type { DataRange } from '@/core/types/data-range'
import type { Data, BaseExecuteOptions } from '@/core/types/execute'
import type { BatchProgress } from '@/core/types/batch'

/**
 * 还原选项
 */
export type RestoreOptions = {
  /** 需要从哪些备份资源还原（暂时只支持json） */
  backupAssets: BackupAsset<'json'>[]
} & (
  | BaseExecuteOptions<'restore', 'batch'>
  | (BaseExecuteOptions<'restore', 'normal'> & {
      /** 数据范围 */
      dataRange: DataRange<'all' | 'page' | 'list'>
    })
)

/**
 * 已还原的数据
 */
export interface RestoredData<D = Data> {
  // 原数据
  original: D
  // 成功还原的数据
  restored: D
}

/**
 * 还原结果
 */
export type RestoreResult<D = Data> = {
  /** 已还原的数据 */
  restoredData?: RestoredData<D>
  /** 分批处理的进度 */
  batchProgress?: BatchProgress
}
