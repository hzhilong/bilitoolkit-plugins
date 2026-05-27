import type { ExecuteContext } from '@/core/types/execute'
import { type Data, type TreeData, isTreeData, isTreeDataModule } from '@/core/types/data-module'
import type { DataRange, DataRangeType, TreeDataRange, PageDataRange } from '@/core/types/data-range'
import type { BackupDataRangeType, BackupAsset } from '@/core/types/backup'
import { apiSleep } from '@/core/utils/sleep'
import { type PageDataWithNextParams } from '@ybgnb/bili-api'
import type { Task } from '@/core/types/task'
import { readJsonFile } from '@/core/utils/file'
import type { DataModule } from '@/core/modules/data-module'
import type { TreeDataModule } from '@/core/modules/tree-data-module'
import { RESTORE_PAGE_SIZE } from '@/core/commom/constant'

/**
 * 通过分页范围获取数据
 */
async function getDataByPageRange<D>(
  context: ExecuteContext,
  dataRange: PageDataRange,
  fetchPage: (pageNum: number) => Promise<PageDataWithNextParams<D>>,
  logPrefix?: string,
) {
  const result: D[] = []
  const [startPageNum, endPageNum] = dataRange.ranges
  const pageTotal = endPageNum - startPageNum + 1
  logPrefix = logPrefix ? `${logPrefix.trim()} ` : ''

  for (let i = startPageNum; i <= endPageNum; i++) {
    const { items, hasNext } = await fetchPage(i)
    if (items) {
      result.push(...items)
      await context.onProgress?.(
        (100 * (i - startPageNum + 1)) / pageTotal,
        `${logPrefix}第 ${i}/${endPageNum} 页 • 获取 ${items.length} 条 • 累计 ${result.length}`,
      )
      await apiSleep(context.signal)
      if (!hasNext) break
    }
  }
  return result
}

/**
 * 通过分页范围获取备份数据
 */
async function getBackupDataByPageRange<D>(
  context: ExecuteContext,
  dataModule: DataModule<D>,
  dataRange: PageDataRange,
) {
  return getDataByPageRange(context, dataRange, (pageNum) =>
    dataModule.fetchPage(context, {
      pageNum,
    }),
  )
}

/**
 * 通过分页范围获取备份数据
 */
async function getBackupDataByTreePageRange<P extends TreeData<C>, C extends Data>(
  context: ExecuteContext,
  dataModule: TreeDataModule<P, C>,
  dataRange: PageDataRange,
  parent: P,
) {
  return getDataByPageRange(
    context,
    dataRange,
    async (pageNum) => {
      return await dataModule.fetchChildrenPage(
        context,
        {
          pageNum,
        },
        parent,
      )
    },
    dataModule.getDataTitle(parent),
  )
}

/**
 * 通过范围获取备份数据
 */
export const getBackupDataByRange = async <D extends Data = Data, T extends DataRangeType = BackupDataRangeType>(
  dataModule: DataModule<D>,
  dataRange: DataRange<T>,
  context: ExecuteContext,
): Promise<D[]> => {
  if (!isTreeDataModule(dataModule)) {
    // 1. 非树形数据的模块
    if (dataRange.type === 'all') {
      return (await dataModule.fetchAll(context)) ?? []
    }

    if (dataRange.type === 'page') {
      return await getBackupDataByPageRange(context, dataModule, dataRange)
    }
  } else {
    // 2. 树形数据的模块
    const treeDataModule = dataModule as unknown as TreeDataModule

    if (dataRange.type === 'all') {
      const parentList: TreeData<Data>[] = await treeDataModule.fetchAll(context)
      for (let i = 0; i < parentList.length; i++) {
        const parent = parentList[i]
        parent.children = await treeDataModule.fetchChildrenAll(context, parent)
        parent.childrenSize = parent.children.length
      }
      return parentList as D[]
    }

    if (dataRange.type === 'page') {
      throw new Error(`内部错误，[${dataModule.dataTypeName}]不支持全局分页选择`)
    }

    //  - tree：按层级路径选择指定数据
    if (dataRange.type === 'tree') {
      if (!validateTreeDataRange(dataRange)) {
        throw new Error(`内部错误，[${dataModule.dataTypeName}]树形范围选择参数无效`)
      }

      const { nodes } = dataRange
      // 判断子节点范围选择的有效性
      if (nodes.some((node) => !treeDataModule.childrenRangeOptions.includes(node.childrenDataRange.type))) {
        throw new Error(`内部错误，[${dataModule.dataTypeName}] 子节点的范围选择参数无效`)
      }

      // 获取第一层
      const selectParentList = await treeDataModule.fetchAllByIds(
        context,
        nodes.map((n) => n._id),
      )
      if (selectParentList.length !== nodes.length) {
        throw new Error(`内部错误，[${dataModule.dataTypeName}]树形范围数据错误(node1)`)
      }

      for (let i = 0; i < selectParentList.length; i++) {
        const parent = selectParentList[i]
        const { childrenDataRange } = nodes[i]

        if (childrenDataRange.type === 'all') {
          parent.children = await treeDataModule.fetchChildrenAll(context, parent)
        } else {
          parent.children = await getBackupDataByTreePageRange(context, treeDataModule, childrenDataRange, parent)
        }
        parent.childrenSize = parent.children.length
      }

      return selectParentList as D[]
    }
  }

  throw new Error(`内部错误，暂不支持该备份范围类型[${dataRange.type}]`)
}

/**
 * 校验树形范围选择的参数
 */
export const validateTreeDataRange = ({ nodes }: TreeDataRange) => {
  if (nodes.length < 1) {
    return false
  }
  return true
}

/**
 * 获取备份任务已备份的数据
 */
export const getDataByBackupTask = async <D extends Data = Data>(
  task: Task<'backup', D>,
  excludeChildNodes?: boolean,
) => {
  const assets = task.result?.backupAssets

  if (!assets || !assets.length) return []

  const list = []

  for (const asset of assets) {
    if (asset.type === 'json') {
      list.push(...(await readJsonFile<D[]>(asset as BackupAsset<'json'>)))
    }
  }

  const isTree = list.length > 0 && isTreeData(list[0])

  // 排除子节点数据
  if (isTree && excludeChildNodes) {
    list.forEach((node) => {
      const treeNode = node as TreeData<Data>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (treeNode as any)['children']
      treeNode.children = []
    })
  }

  return list
}

/**
 * 通过范围获取需要还原的数据
 */
export const getRestoreDataByRange = async <D extends Data = Data, T extends DataRangeType = BackupDataRangeType>(
  dataModule: DataModule<D>,
  dataRange: DataRange<T>,
  context: ExecuteContext,
  backedUpTask: Task<'backup', D>,
): Promise<D[]> => {
  const allData = await getDataByBackupTask(backedUpTask)
  const pageSize = RESTORE_PAGE_SIZE

  if (dataRange.type === 'all') {
    return allData
  }

  if (!isTreeDataModule(dataModule)) {
    if (dataRange.type === 'page') {
      const [startPage, endPage] = dataRange.ranges
      return allData.slice((startPage - 1) * pageSize, endPage * pageSize)
    }
  } else {
    if (dataRange.type === 'tree') {
      if (!validateTreeDataRange(dataRange)) {
        throw new Error(`内部错误，[${dataModule.dataTypeName}]树形范围选择参数无效`)
      }

      const allTreeData = allData as TreeData<Data>[]
      const { nodes } = dataRange
      const parentIds = new Map(nodes.map((node) => [node._id, node.childrenDataRange]))

      const result: TreeData<Data>[] = []
      for (const parent of allTreeData) {
        if (parentIds.has(parent._id)) {
          const childrenRange = parentIds.get(parent._id)!
          if (childrenRange.type === 'all') {
            result.push(parent)
          } else if (childrenRange.type === 'page') {
            const [startPage, endPage] = childrenRange.ranges
            parent.children = parent.children.slice((startPage - 1) * pageSize, endPage * pageSize)
            parent.childrenSize = parent.children.length
            result.push(parent)
          }
        }
      }
      return result as D[]
    }
  }

  throw new Error(`内部错误，[${dataModule.dataTypeName}]暂不支持该还原范围类型[${dataRange.type}]`)
}
