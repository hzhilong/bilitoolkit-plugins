import { DataModule } from '@/core/modules/data-module'
import type { Data, TreeData, FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { apiSleep } from '@/core/utils/sleep'
import type { TreeRangeMetas, DataRangeType } from '@/core/types/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'

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
export abstract class TreeDataModule<P extends TreeData<C>, C extends Data> extends DataModule<P> {
  /** 树形范围的元数据（仅支持两层） */
  abstract treeRangeMetas: TreeRangeMetas

  /** 子节点可选择的数据范围 */
  abstract childrenRangeOptions: Exclude<DataRangeType, 'tree'>[]

  /** 父节点名字，主要用作多层数据模块的日志显示 */
  abstract getParentNodeTitle(parent: P): string

  /** 获取子节点总数 */
  fetchChildrenTotal?(context: ExecuteContext, parent: P): Promise<number>

  /** 获取子节点分页数据 */
  abstract fetchChildrenPage(
    context: ExecuteContext,
    params: FetchPageParams,
    parent: P,
  ): Promise<PageDataWithNextParams<C>>

  /** 获取所有子节点 */
  abstract fetchChildrenAll(context: ExecuteContext, parent: P): Promise<C[]>

  /** 通过id获取父节点数据 */
  abstract fetchAllByIds(context: ExecuteContext, ids: string[]): Promise<P[]>

  /** 树形数据不支持全局 page，这里直接获取第一层所有数据 */
  async fetchPage(context: ExecuteContext, _params: FetchPageParams): Promise<PageDataWithNextParams<P>> {
    const tags = await this.fetchAll(context)
    return {
      items: tags,
      nextParams: {},
      hasNext: false,
      pageSize: tags.length,
    }
  }

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
