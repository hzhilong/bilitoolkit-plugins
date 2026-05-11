import type { RequestParams } from '@ybgnb/bili-api'

export type DataRangeType = 'all' | 'list' | 'page'

/**
 * 数据范围 - 所有数据
 */
export interface AllDataRange {
  type: 'all'
}

/**
 * 数据范围 - 指定列表范围
 */
export interface ListDataRange {
  type: 'list'
  ranges: [number, number][]
}

/**
 * 数据范围 - 指定页面范围
 */
export interface PageDataRange {
  type: 'page'
  ranges: [number, number]
  pageSize: number
  pageParams?: RequestParams
}

/**
 * 数据范围
 */
export type DataRange<T extends DataRangeType = DataRangeType> = T extends 'all'
  ? AllDataRange
  : T extends 'list'
    ? ListDataRange
    : T extends 'page'
      ? PageDataRange
      : never
