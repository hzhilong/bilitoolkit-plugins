import type { DataRange } from '@/core/types/data-range'
import type { BaseExecuteOptions } from '@/core/types/execute'

/**
 * 清空选项
 */
export type ClearOptions = BaseExecuteOptions<'clear', 'normal'> & {
  /** 数据范围 */
  dataRange: DataRange<'all'>
}

/**
 * 清空结果
 */
export type ClearResult = Record<never, never>
