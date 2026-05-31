import type { TreeDataModule } from '@/core/modules/tree-data-module'
import type { PageOptions } from '@ybgnb/bili-api'
import type { DataModule } from '@/core/modules/data-module'

/**
 * 模块数据
 */
export type Data = object

/**
 * 子节点
 */
export interface Child extends Data {
  _id: string
  _name: string
  /** 在哪些父节点存在。所有父节点还原结束才会填充这个字段。 */
  parentIds: string[]
}

/**
 * 父节点
 */
export interface Parent<C extends Child = Child> extends Data {
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
export const isTreeData = <P extends Parent = Parent>(data: Data): data is P => {
  return 'children' in data && '_id' in data && '_name' in data && 'children' in data
}

/**
 * 是否为树形数据模块
 */
export const isTreeDataModule = (module: DataModule): module is TreeDataModule => {
  return 'treeRangeMetas' in module && 'childrenRangeOptions' in module
}

/**
 * 获取分页数据的参数
 */
export type FetchPageParams = Omit<PageOptions, 'total' | 'pageSize'>

/**
 * FetchAll 使用模式
 */
export type FetchAllMode = 'normal' | 'tree-select'
