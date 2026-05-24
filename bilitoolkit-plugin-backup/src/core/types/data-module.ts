import type { DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { ExecuteContext } from '@/core/types/execute'
import type { PageDataWithNextParams, PageOptions } from '@ybgnb/bili-api'
import type { Task, TaskResult } from '@/core/types/task'
import type { AllDataRange, PageDataRange, TreeRangeMetas } from '@/core/types/data-range'

/**
 * 模块数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = any

/**
 * 数据模块
 */
export interface DataModule<D extends Data = Data> {
  /** 数据类型 */
  dataType: DataType
  /** 数据类型名称 */
  dataTypeName: string
  /** 可操作的类型 */
  operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  backupDataRangeTypes: BackupDataRangeType[]
  /** 备份支持的导出目标 */
  exportTargets: ExportTarget[]

  /** 执行任务 */
  executeTask: <O extends OperationType = OperationType>(
    context: ExecuteContext,
    task: Task<O, D>,
  ) => Promise<TaskResult<O, D>>

  /** 构建分页大小（备份时的数据接口分页策略，树形数据表示第二层的分页大小） */
  getPageSize: () => number

  /** 获取总数 */
  fetchTotal?: FetchTotal

  /** 获取分页数据（单个数据要包装为数组） */
  fetchPage: FetchPage<D>

  /** 获取所有数据（单个数据要包装为数组） */
  fetchAll: FetchAll<D>
}

/**
 * 模块树形数据
 */
export type TreeData<C extends Data> = {
  children: C[]
  childrenCount?: number
  _id: string
  _name: string
}

/**
 * 树形数据模块
 *
 * 约定规则：
 * 1. 多层数据结构（如两层树形数据）仅支持：
 *    - all：处理全部数据
 *    - tree：按层级路径选择指定数据
 *      - 第一层可单选/多选，第二层 all/page
 *    不支持全局 page / list 模式。
 * 2. 多层数据暂不支持 batch 模式。
 */
export interface TreeDataModule<P extends TreeData<C> = TreeData<Data>, C extends Data = Data> extends DataModule<P> {
  /** 树形范围的元数据（仅支持两层） */
  treeRangeMetas: TreeRangeMetas

  /** 子节点可选择的数据范围 */
  childrenRangeOptions: (AllDataRange['type'] | PageDataRange['type'])[]

  /** 通过id获取父节点数据（必须一一对应） */
  fetchAllByIds: FetchAllByIds<P, C>

  /** 父节点标题，主要用作多层数据模块的进度显示 */
  getParentNodeTitle: (parent: P) => string

  /** 获取子节点总数 */
  fetchChildrenTotal?: FetchChildrenTotal<P, C>

  /** 获取子节点分页数据 */
  fetchChildrenPage: FetchChildrenPage<P, C>

  /** 获取所有子节点 */
  fetchChildrenAll: FetchChildrenAll<P, C>
}

/**
 * 是否为树形数据模块
 */
export const isTreeDataModule = (module: DataModule<Data>): module is TreeDataModule<TreeData<Data>, Data> => {
  return 'treeRangeMetas' in module
}

export type FetchTotal = (context: ExecuteContext) => Promise<number>
export type FetchChildrenTotal<P extends TreeData<C>, C extends Data> = (
  context: ExecuteContext,
  parent: P,
) => Promise<number>

export type FetchPage<D extends Data = Data> = (
  context: ExecuteContext,
  params: FetchPageParams,
) => Promise<PageDataWithNextParams<D>>

export type FetchChildrenPage<P extends TreeData<C>, C extends Data> = (
  context: ExecuteContext,
  params: FetchPageParams,
  parent: P,
) => Promise<PageDataWithNextParams<C>>

export type FetchAll<D extends Data = Data> = (context: ExecuteContext) => Promise<D[]>

export type FetchAllByIds<P extends TreeData<C>, C extends Data> = (
  context: ExecuteContext,
  ids: string[],
) => Promise<P[]>

export type FetchChildrenAll<P extends TreeData<C>, C extends Data> = (
  context: ExecuteContext,
  parent: P,
) => Promise<C[]>

/**
 * 获取分页数据的参数
 */
export type FetchPageParams = Omit<PageOptions, 'total' | 'pageSize'>
