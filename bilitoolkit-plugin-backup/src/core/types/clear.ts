import type { DataRange } from '@/core/types/data-range'
import type { Data, BaseExecuteOptions } from '@/core/types/execute'

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
export interface ClearedData<D = Data> {
  // 原数据
  original: D
  // 成功还原的数据
  restored: D
}

/**
 * 清空结果
 */
export type ClearResult<D = Data> = {
  /** 已清空的数据 */
  clearedData?: ClearedData<D>
}
