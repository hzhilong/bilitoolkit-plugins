import type { TreeDataModule } from '@/core/modules/tree-data-module'
import type { PageOptions } from '@ybgnb/bili-api'
import type { DataModule } from '@/core/modules/data-module'

/**
 * 模块数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = any

/**
 * 模块树形数据
 */
export type TreeData<C extends Data> = {
  _id: string
  _name: string
  /** 当前备份的子节点数据 */
  children: C[]
  /** 当前备份的子节点大小 */
  childrenSize: number
  /** 子节点总数 */
  childrenTotal?: number
}

/**
 * 是否为树形数据
 */
export const isTreeData = <P extends Data = TreeData<Data>>(data: Data): data is P => {
  return 'children' in data && '_id' in data && '_name' in data
}

/**
 * 是否为树形数据模块
 */
export const isTreeDataModule = (module: DataModule<Data>): module is TreeDataModule<TreeData<Data>, Data> => {
  return 'treeRangeMetas' in module && 'childrenRangeOptions' in module
}

/**
 * 获取分页数据的参数
 */
export type FetchPageParams = Omit<PageOptions, 'total' | 'pageSize'>
