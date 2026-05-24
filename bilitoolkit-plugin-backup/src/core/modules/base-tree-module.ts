import type {
  FetchTotal,
  FetchAll,
  Data,
  FetchChildrenTotal,
  FetchChildrenPage,
  FetchChildrenAll,
  TreeData,
  TreeDataModule,
  FetchAllByIds,
  FetchPage,
  FetchPageParams,
} from '@/core/types/data-module'
import type { DataType } from '@/core/types/data-type'
import { type OperationType } from '@/core/types/operation'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { ExecuteContext } from '@/core/types/execute'
import { apiSleep } from '@/core/utils/sleep'
import type { AllDataRange, PageDataRange, TreeRangeMetas } from '@/core/types/data-range'
import { BaseModule } from '@/core/modules/base-module'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'

/**
 * 模块基类
 */
export abstract class BaseTreeModule<P extends TreeData<C>, C extends Data>
  extends BaseModule<P>
  implements TreeDataModule<P, C>
{
  /** 数据类型 */
  abstract dataType: DataType
  /** 数据类型名称 */
  abstract dataTypeName: string
  /** 可操作的类型 */
  abstract operations: OperationType[]
  /** 备份时可选的数据范围类型 */
  abstract backupDataRangeTypes: BackupDataRangeType[]
  /** 树形范围的元数据（仅支持两层） */
  abstract treeRangeMetas: TreeRangeMetas
  /** 子节点可选择的数据范围 */
  abstract childrenRangeOptions: (AllDataRange['type'] | PageDataRange['type'])[]
  /** 父节点名字，主要用作多层数据模块的日志显示 */
  abstract getParentNodeTitle: (parent: P) => string
  /** 备份支持的导出目标 */
  abstract exportTargets: ExportTarget[]
  /** 分页大小（备份时的数据接口分页策略，树形数据表示第二层的分页大小） */
  abstract getPageSize: () => number
  /** 获取数据总条数 */
  fetchTotal?: FetchTotal
  /** 获取子节点总数 */
  fetchChildrenTotal?: FetchChildrenTotal<P, C>
  /** 树形数据不支持全局 page，这里直接获取第一层所有数据 */
  fetchPage: FetchPage = async (
    context: ExecuteContext,
    _params: FetchPageParams,
  ): Promise<PageDataWithNextParams<P>> => {
    const tags = await this.fetchAll(context)
    return {
      items: tags,
      nextParams: {},
      hasNext: false,
      pageSize: tags.length,
    }
  }
  /** 获取子节点分页数据 */
  abstract fetchChildrenPage: FetchChildrenPage<P, C>
  /** 获取所有数据（单个数据要包装为数组） */
  abstract fetchAll: FetchAll<P>
  /** 获取所有子节点 */
  abstract fetchChildrenAll: FetchChildrenAll<P, C>
  /** 通过id获取父节点数据 */
  abstract fetchAllByIds: FetchAllByIds<P, C>

  /**
   * 获取数据总数的描述信息（这里不方便统一，因为存在多层级数据/单个数据）
   * @description 比如 '1个收藏夹，256个视频' 或者 '用户偏好设置'
   */
  abstract getDataTotalDesc(list: P[]): string

  /** 获取所有子节点数据 */
  protected baseFetchChildrenAll = async (context: ExecuteContext, parent: P): Promise<C[]> => {
    const onProgress = async (progress?: number, msg?: string) => {
      if (context.onProgress) {
        await context.onProgress(progress, msg)
      }
    }

    let pageNum = 1
    const list = []
    const parentTitle = `${this.getParentNodeTitle?.(parent)?.trim() ?? ''} `

    let total: number | undefined = undefined
    if (this.fetchChildrenTotal) {
      await onProgress(1, `正在获取 ${parentTitle}数据条数`)
      total = await this.fetchChildrenTotal(context, parent)
      await apiSleep(context.abortSignal)
    }

    let progress = 1

    while (true) {
      if (context.abortSignal?.aborted) {
        break
      }
      const pageParams = { pageNum }
      const pageData = await this.fetchChildrenPage(context, pageParams, parent)

      if (pageData === null) break

      if (pageData.items) {
        list.push(...pageData.items)
        // 显示进度
        if (total) {
          await onProgress(
            (100 * list.length) / total,
            `${parentTitle}第 ${pageNum}/${Math.ceil(total / pageData.pageSize)} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
          )
        } else {
          await onProgress(
            progress,
            `${parentTitle}第 ${pageNum} 页 • 获取 ${pageData.items.length} 条 • 累计 ${list.length}`,
          )
        }
        progress++
      }

      if (!pageData.hasNext) break

      await apiSleep(context.abortSignal)
      pageNum++
    }
    return list
  }
}
