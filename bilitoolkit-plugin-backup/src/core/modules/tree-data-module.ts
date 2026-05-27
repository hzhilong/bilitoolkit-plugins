import { DataModule } from '@/core/modules/data-module'
import type { Data, TreeData, FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { apiSleep } from '@/core/utils/sleep'
import type { TreeRangeMetas, DataRangeType } from '@/core/types/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import type { BaseRestoreResult } from '@/core/types/restore'
import { getErrorMessage } from '@ybgnb/utils'
import { checkAbortSignal } from '@/core/utils/abort'

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
export abstract class TreeDataModule<
  P extends TreeData<C> = TreeData<Data>,
  C extends Data = Data,
> extends DataModule<P> {
  /** 树形范围的元数据（仅支持两层） */
  abstract treeRangeMetas: TreeRangeMetas

  /** 子节点可选择的数据范围 */
  abstract childrenRangeOptions: Exclude<DataRangeType, 'tree'>[]

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
  /** 获取子节点标题 */
  abstract getChildrenDataTitle(child: C): string

  /** 还原父节点数据 */
  abstract restoreData(context: ExecuteContext, data: P): Promise<void>
  /** 还原子节点数据 */
  abstract restoreChildrenData(context: ExecuteContext, children: C): Promise<void>

  /** 获取所有子节点数据 */
  protected baseFetchChildrenAll = async (context: ExecuteContext, parent: P): Promise<C[]> => {
    const onProgress = async (progress?: number, msg?: string) => {
      if (context.onProgress) {
        await context.onProgress(progress, msg)
      }
    }

    let pageNum = 1
    const list = []
    const parentTitle = `${this.getDataTitle(parent).trim() ?? ''} • `

    let total: number | undefined = undefined
    if (this.fetchChildrenTotal) {
      await onProgress(1, `正在获取 ${parentTitle}总数`)
      total = await this.fetchChildrenTotal(context, parent)
      await apiSleep(context.signal)
    }

    let progress = 1

    while (true) {
      checkAbortSignal(context.signal)
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

      await apiSleep(context.signal)
      pageNum++
    }
    return list
  }

  protected async baseRestoreData(context: ExecuteContext, list: P[]): Promise<BaseRestoreResult<P>> {
    if (list.length === 0) {
      context.onProgress?.(1, '读取的数据为空')
      throw new Error('读取的数据为空')
    }

    const successItems: P[] = []
    const failedItems: P[] = []
    context.onProgress?.(1, `即将还原：${this.getDataTotalDesc(list)}`)
    // 先整体还原父节点
    for (let i = 0; i < list.length; i++) {
      checkAbortSignal(context.signal)
      const item = list[i]
      const progress = Math.floor(((i + 1) * 100) / list.length)
      try {
        await this.restoreData(context, item)
        successItems.push(item)
        context.onProgress?.(progress, `还原分组成功 [${this.getDataTitle(item)}]`)
      } catch (e) {
        context.onProgress?.(progress, `还原分组失败 [${this.getDataTitle(item)}] err：${getErrorMessage(e)}`)
        failedItems.push(item)
      }
      await apiSleep(context.signal)
    }
    // 再一个一个还原子节点数据
    const cResult = await this.baseRestoreAllChildren(context, successItems)
    failedItems.push(...cResult.failedItems)

    return {
      successDataDesc: this.getDataTotalDesc(cResult.successItems),
      failedDataDesc: failedItems.length > 0 ? this.getDataTotalDesc(failedItems) : '',
      failedItems,
    }
  }

  protected async baseRestoreAllChildren(
    context: ExecuteContext,
    parentList: P[],
  ): Promise<{
    successItems: P[]
    failedItems: P[]
  }> {
    const successItems: P[] = []
    const failedItems: P[] = []

    const dataCount = parentList.reduce((acc, cur) => {
      return acc + cur.children.length
    }, 0)
    let processedCount = 0

    for (const parent of parentList) {
      checkAbortSignal(context.signal)
      const { children, ...onlyParent } = parent

      const successChildItems: C[] = []
      const failedChildItems: C[] = []

      const list = children.reverse()
      for (let i = 0; i < list.length; i++) {
        const child = list[i]
        const progress = Math.floor((processedCount * 100) / dataCount)
        try {
          await this.restoreChildrenData(context, child)
          successChildItems.push(child)
          context.onProgress?.(progress, `[${i + 1}/${list.length}] 还原数据成功 [${this.getChildrenDataTitle(child)}]`)
        } catch (e) {
          context.onProgress?.(
            progress,
            `[${i + 1}/${list.length}] 还原数据失败 [${this.getChildrenDataTitle(child)}] err：${getErrorMessage(e)}`,
          )
          failedChildItems.push(child)
        }
        await apiSleep(context.signal)
        processedCount++
      }

      successItems.push({
        ...onlyParent,
        children: successChildItems,
      } as P)
      if (failedChildItems.length > 0) {
        failedItems.push({
          ...onlyParent,
          children: failedChildItems,
        } as P)
      }
    }

    return {
      successItems,
      failedItems,
    }
  }
}
