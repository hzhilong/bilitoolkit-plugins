import type { Parent } from '@/core/types/data-module'

export const DataRangeTypeMap = {
  all: '所有数据',
  //  list: '列表数据',
  page: '分页数据',
  tree: '自选范围',
} as const

/**
 * 数据范围的类型
 */
export type DataRangeType = keyof typeof DataRangeTypeMap

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
  //  pageParams?: RequestParams
}

/**
 * 树节点的数据范围信息
 */
export type TreeNodeDataRange = Pick<Parent, '_id' | '_name'> & {
  childrenDataRange: AllDataRange | PageDataRange
}

/**
 * 数据范围 - 树形范围选择（暂时只支持两层）
 *   - 第一层多选，第二层 all
 *   - 第一层单选，第二层 all/page
 */
export interface TreeDataRange {
  type: 'tree'
  /** 树节点的数据范围信息的集合 */
  nodes: TreeNodeDataRange[]
}

/**
 * 树形范围的元数据
 */
export type TreeRangeMeta<LEVEL extends 1 | 2> = LEVEL extends 1
  ? {
      name: string
      /**
       * 是否可以多选
       * @default true
       */
      multipleSelectable?: boolean
    }
  : {
      name: string
    }

/**
 * 树形范围元数据
 */
export type TreeRangeMetas = [TreeRangeMeta<1>, TreeRangeMeta<2>]

/**
 * 数据范围
 */
export type DataRange<T extends DataRangeType = DataRangeType> = T extends 'all'
  ? AllDataRange
  : //  : T extends 'list'
    //    ? ListDataRange
    T extends 'page'
    ? PageDataRange
    : T extends 'tree'
      ? TreeDataRange
      : never
