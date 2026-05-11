import type { DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { ExecuteFn, Data, ExecuteContext } from '@/core/types/execute'
import type { PageDataWithNextParams, PageOptions } from '@ybgnb/bili-api'

/**
 * 数据模块
 */
export interface DataModule<AD = Data> {
  /** 数据类型 */
  dataType: DataType
  /** 数据类型名称 */
  dataTypeName: string
  /** 可操作的类型 */
  operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  backupDataRangeType: BackupDataRangeType[]
  /** 备份支持的导出目标 */
  exportTargets: ExportTarget[]

  /** 执行操作 */
  execute: ExecuteFn

  /** 获取数据总条数 */
  fetchTotal?(context: ExecuteContext): Promise<number>

  /** 获取所有数据（单个数据要包装为数组） */
  fetchAll(context: ExecuteContext): Promise<AD[]>

  /** 获取分页数据（单个数据要包装为数组） */
  fetchPage(context: ExecuteContext, params: FetchPageParams): Promise<PageDataWithNextParams<AD>>
}

/**
 * 获取分页数据的参数
 */
export type FetchPageParams = Omit<PageOptions, 'total' | 'pageSize'>
