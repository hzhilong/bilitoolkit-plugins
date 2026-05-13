import type { DataRange } from '@/core/types/data-range'
import type { BaseExecuteOptions } from '@/core/types/execute'
import type { Data } from '@/core/types/data-module'

/**
 * 清空选项
 */
export type ClearOptions = BaseExecuteOptions<'clear', 'normal'> & {
  /** 数据范围 */
  dataRange: DataRange<'all'>
}

/**
 * 已清空的数据
 */
export interface ClearedData<D extends Data = Data> {
  // 原数据
  original: D
  // 成功还原的数据
  restored: D
}

/**
 * 清空结果
 */
export type ClearResult<D extends Data = Data> = {
  /** 已清空的数据 */
  clearedData?: ClearedData<D>
}
