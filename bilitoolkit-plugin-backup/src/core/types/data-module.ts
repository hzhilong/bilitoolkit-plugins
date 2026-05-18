import type { DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { ExecuteContext } from '@/core/types/execute'
import type { PageDataWithNextParams, PageOptions } from '@ybgnb/bili-api'
import type { Task, TaskResult } from '@/core/types/task'
import type { TreeRangeOptions } from '@/core/types/data-range'

/**
 * 模块数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = any

/**
 * 模块树形数据
 */
export interface TreeData extends Data {
  children: Data[]
}

/**
 * 数据模块
 *
 * 约定规则：
 * 1. 任务模式分为 normal（单次执行）与 batch（分批续跑执行）。
 * 2. 数据范围（DataRange）用于描述本次操作的数据选择范围。
 * 3. 多层数据结构（如两层树形数据）仅支持：
 *    - all：处理全部数据
 *    - tree：按层级路径选择指定数据
 *      - 第一层多选，第二层 all
 *      - 第一层单选，第二层 all/page
 *    不支持全局 page / list 模式。
 * 4. 多层数据暂不支持 batch 模式。
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
  /** 树形范围的选项（仅支持两层） */
  treeRangeOptions?: TreeRangeOptions<D>
  /** 备份支持的导出目标 */
  exportTargets: ExportTarget[]

  /** 执行任务 */
  executeTask: <O extends OperationType = OperationType>(
    context: ExecuteContext,
    task: Task<O, D>,
  ) => Promise<TaskResult<O, D>>

  /** 构建分页大小（备份时的数据接口分页策略） */
  getPageSize: () => number

  /** 获取数据总条数 */
  fetchTotal?: FetchTotal<D>

  /** 获取分页数据（单个数据要包装为数组） */
  fetchPage: FetchPage<D>

  /** 获取所有数据（单个数据要包装为数组） */
  fetchAll: FetchAll<D>
}

export type FetchTotal<D extends Data = Data> = [D] extends [TreeData]
  ? (context: ExecuteContext, query?: FetchTreeQuery) => Promise<number>
  : (context: ExecuteContext) => Promise<number>

export type FetchAll<D extends Data = Data> = [D] extends [TreeData]
  ? (context: ExecuteContext, query?: FetchTreeQuery) => Promise<D[]>
  : (context: ExecuteContext) => Promise<D[]>

export type FetchPage<D extends Data = Data> = [D] extends [TreeData]
  ? (context: ExecuteContext, params: FetchPageParams, query?: FetchTreeQuery) => Promise<PageDataWithNextParams<D>>
  : (context: ExecuteContext, params: FetchPageParams) => Promise<PageDataWithNextParams<D>>

/**
 * 获取分页数据的参数
 */
export type FetchPageParams = Omit<PageOptions, 'total' | 'pageSize'>

/**
 * 树形数据选择条件
 */
export type FetchTreeQuery =
  | {
      // 获取第一层的数据
      level: 1
      // 第一层 id 集合
      level1Ids: string[]
    }
  | {
      // 获取第二层的数据
      level: 2
      // 第一层 id
      level1Id: string
    }
