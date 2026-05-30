import { DataModule } from '@/core/modules/data-module'
import type { Parent, FetchPageParams, Child } from '@/core/types/data-module'
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
export abstract class TreeDataModule<C extends Child = Child, P extends Parent<C> = Parent<C>> extends DataModule<P> {
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

  /** 获取所有数据（单个数据要包装为数组） */
  async fetchAll(context: ExecuteContext): Promise<P[]> {
    await context.onProgress?.(0, `正在获取 ${this.treeRangeMetas[0].name}`)
    const parentList = await this.fetchParentAll(context)
    for (let i = 0; i < parentList.length; i++) {
      const parent = parentList[i]
      await context.onProgress?.((i * 100) / parentList.length, `正在获取 ${this.getDataTitle(parent)}`)
      parent.children = await this.fetchChildrenAll(context, parent)
      parent.childrenSize = parent.children.length
    }
    return parentList
  }

  /** 获取所有父节点 */
  abstract fetchParentAll(context: ExecuteContext): Promise<P[]>

  /** 获取所有子节点 */
  fetchChildrenAll(context: ExecuteContext, tag: P): Promise<C[]> {
    return this.baseFetchChildrenAll(context, tag)
  }

  /** 树形数据不支持全局 page，这里直接获取第一层所有数据 */
  async fetchPage(context: ExecuteContext, _params: FetchPageParams): Promise<PageDataWithNextParams<P>> {
    const tags = await this.fetchParentAll(context)
    return {
      items: tags,
      nextParams: {},
      hasNext: false,
      pageSize: tags.length,
    }
  }
  /** 获取子节点标题 */
  abstract getChildrenDataTitle(child: C): string

  /** 还原数据，返回新数据的id（目前仅在 TreeDataModule 中使用到） */
  abstract restoreData(context: ExecuteContext, data: P): Promise<string>
  /** 还原子节点数据 */
  abstract restoreChildrenData(context: ExecuteContext, children: C, parentIds: string[]): Promise<void>
  /** 删除父节点的数据 */
  abstract delParentData(context: ExecuteContext, parent: P): Promise<void>
  /** 删除子节点的数据 */
  abstract delChildData(context: ExecuteContext, child: C): Promise<void>

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
    // 整体还原父节点
    await this.baseRestoreAllParent(list, context, successItems, failedItems)
    // 为子节点填充 parentIds 字段
    this.assignParentIds(successItems)
    // 还原子节点数据
    const cResult = await this.baseRestoreAllChildren(context, successItems)
    failedItems.push(...cResult.failedItems)

    return {
      successDataDesc: this.getDataTotalDesc(cResult.successItems),
      failedDataDesc: failedItems.length > 0 ? this.getDataTotalDesc(failedItems) : '',
      failedItems,
    }
  }

  protected async baseRestoreAllParent(list: P[], context: ExecuteContext, successItems: P[], failedItems: P[]) {
    const oldParent = new Map((await this.fetchParentAll(context)).map((p) => [p._name, p]))
    for (let i = 0; i < list.length; i++) {
      checkAbortSignal(context.signal)
      const item = list[i]
      const progress = Math.floor(((i + 1) * 100) / list.length)
      try {
        if (oldParent.has(item._name)) {
          item._id = oldParent.get(item._name)!._id
          context.onProgress?.(progress, `[${i + 1}/${list.length}]  [${this.getDataTitle(item)}] 已存在`)
        } else {
          item._id = await this.restoreData(context, item)
          context.onProgress?.(progress, `[${i + 1}/${list.length}] [${this.getDataTitle(item)}] 还原成功`)
        }
        successItems.push(item)
      } catch (e) {
        context.onProgress?.(
          progress,
          `[${i + 1}/${list.length}] [${this.getDataTitle(item)}] 还原失败 err：${getErrorMessage(e)}`,
        )
        failedItems.push(item)
      }
      await apiSleep(context.signal)
    }
  }

  /**
   * 为子节点填充 parentIds 字段
   */
  protected assignParentIds(list: P[]) {
    const childMap = new Map<string, string[]>()

    for (const parent of list) {
      for (const child of parent.children) {
        let parentIds = childMap.get(child._id)

        if (parentIds == null) {
          parentIds = [parent._id]
          childMap.set(child._id, parentIds)
        } else if (!parentIds.includes(parent._id)) {
          parentIds.push(parent._id)
        }

        child.parentIds = parentIds
      }
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
    const handledChildIds = new Set<string>()

    const dataCount = parentList.reduce((acc, cur) => {
      return acc + cur.children.length
    }, 0)

    let processedCount = 0
    let failureCount = 0
    const restoreMaxFailures = context.appSettings.restoreMaxFailures

    for (const parent of parentList) {
      checkAbortSignal(context.signal)
      const { children, ...onlyParent } = parent

      const successChildItems: C[] = []
      const failedChildItems: C[] = []

      const list = children.reverse()
      for (let i = 0; i < list.length; i++, processedCount++) {
        const child = list[i]
        const progress = Math.floor((processedCount * 100) / dataCount)
        if (handledChildIds.has(child._id)) {
          context.onProgress?.(progress, `[${i + 1}/${list.length}] 已还原 [${this.getChildrenDataTitle(child)}]`)
          continue
        }
        try {
          await this.restoreChildrenData(context, child, child.parentIds)
          successChildItems.push(child)
          handledChildIds.add(child._id)
          context.onProgress?.(progress, `[${i + 1}/${list.length}] 还原数据成功 [${this.getChildrenDataTitle(child)}]`)
        } catch (e) {
          context.onProgress?.(
            progress,
            `[${i + 1}/${list.length}] 还原数据失败 [${this.getChildrenDataTitle(child)}] err：${getErrorMessage(e)}`,
          )
          failedChildItems.push(child)
          failureCount++
          if (restoreMaxFailures !== 0 && failureCount > restoreMaxFailures) {
            throw new Error('失败次数已超过限制，任务终止')
          }
        }
        await apiSleep(context.signal)
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

  async clearData(context: ExecuteContext, list: P[]): Promise<string | void> {
    if (this.supportsOneClickClear) throw new Error(`内部错误，[${this.dataTypeName}] 支持一键清空但未定义清空方法`)

    context.onProgress?.(0, `正在处理数据`)
    const allChildren = new Map<string, C>()
    const allParent: P[] = []
    for (const parent of list) {
      for (const child of parent.children) {
        if (!allChildren.has(child._id)) {
          allChildren.set(child._id, child)
        }
      }
      allParent.push({
        ...parent,
        children: [],
        childrenSize: 0,
      })
    }
    const childrenList = Array.from(allChildren.values())
    let failureCount = 0
    const successChildItems: C[] = []
    const maxFailures = context.appSettings.clearMaxFailures
    for (let i = 0; i < childrenList.length; i++) {
      checkAbortSignal(context.signal)
      const child = childrenList[i]
      const progress = Math.floor(((i + 1) * 100) / childrenList.length)
      try {
        await this.delChildData(context, child)
        context.onProgress?.(
          progress,
          `[${i + 1}/${childrenList.length}] 数据删除成功 [${this.getChildrenDataTitle(child)}]`,
        )
        successChildItems.push(child)
      } catch (e) {
        context.onProgress?.(
          progress,
          `[${i + 1}/${childrenList.length}] 数据删除失败 [${this.getChildrenDataTitle(child)}] err：${getErrorMessage(e)}`,
        )
        failureCount++
        if (maxFailures !== 0 && failureCount > maxFailures) {
          throw new Error('失败次数已超过限制，任务终止')
        }
      }
    }

    failureCount = 0
    const successParents: P[] = []
    for (let i = 0; i < allParent.length; i++) {
      checkAbortSignal(context.signal)
      const parent = allParent[i]
      const progress = Math.floor(((i + 1) * 100) / allParent.length)
      try {
        await this.delParentData(context, parent)
        context.onProgress?.(progress, `[${i + 1}/${allParent.length}] 数据删除成功 [${this.getDataTitle(parent)}]`)
        successParents.push(parent)
      } catch (e) {
        context.onProgress?.(
          progress,
          `[${i + 1}/${allParent.length}] 数据删除失败 [${this.getDataTitle(parent)}] err：${getErrorMessage(e)}`,
        )
        failureCount++
        if (maxFailures !== 0 && failureCount > maxFailures) {
          throw new Error('失败次数已超过限制，任务终止')
        }
      }
    }

    const tempParents = successParents
    if (tempParents.length > 0) {
      tempParents[0].children = successChildItems
      tempParents[0].childrenSize = successChildItems.length
    }
    return this.getDataTotalDesc(tempParents)
  }
}
