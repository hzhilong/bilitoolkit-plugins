import type { RequestParams } from '@ybgnb/bili-api'
import type { DataType } from '@/core/types/data-type'
import { registeredModulesMap } from '@/core/modules/register'
import type { DataModule } from '@/core/modules/data-module'
import type { Data } from '@/core/types/data-module'

/**
 * 可分批处理的数据模块
 */
export interface BatchableModule {
  /** 可分批处理的大小 */
  batchSizes: number[]
}

/**
 * 是否为可批处理的模块
 */
export const isBatchable = <D extends Data = Data>(
  module: DataModule<D> | DataType,
): module is DataModule<D> & BatchableModule => {
  let dataModule: DataModule
  if (typeof module !== 'object') {
    dataModule = registeredModulesMap[module]
  } else {
    dataModule = module
  }
  return 'batchSizes' in dataModule && Array.isArray(dataModule.batchSizes)
}

/**
 * 分批处理的选项
 */
export interface BatchOptions {
  /** 分批处理的大小 */
  batchSize: number
  /** 从第几批开始处理（从1开始） */
  startBatch: number
  /** 数据源分页查询参数 */
  pageParams: RequestParams
  /** 数据源页码 */
  pageNum: number
}

/**
 * 分批处理的进度
 */
export interface BatchProgress {
  /** 是否已结束 */
  isFinished: boolean
  /** 下一次处理的批次（从1开始） */
  nextBatch: number
  /** 剩余数据个数 */
  remainingDataCount?: number
  /** 剩余批次 */
  remainingBatchCount?: number
  /** 总批次 */
  totalBatchCount?: number
  /** 下一分批开始的查询参数 */
  nextBatchPageParams: RequestParams
  /** 下一分批开始的页码 */
  nextBatchPageNum: number
}
