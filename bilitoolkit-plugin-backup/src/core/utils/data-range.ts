import type { ExecuteContext } from '@/core/types/execute'
import {
  type DataModule,
  type Data,
  type TreeData,
  isTreeDataModule,
  type TreeDataModule,
} from '@/core/types/data-module'
import type { DataRange, DataRangeType, TreeDataRange, PageDataRange } from '@/core/types/data-range'
import type { BackupDataRangeType } from '@/core/types/backup'
import { apiSleep } from '@/core/utils/sleep'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'

/**
 * 通过分页范围获取数据
 */
async function getDataByPageRange<D>(
  context: ExecuteContext,
  dataRange: PageDataRange,
  fetchPage: (pageNum: number) => Promise<PageDataWithNextParams<D>>,
  logPrefix?: string,
) {
  const items: D[] = []
  const [startPageNum, endPageNum] = dataRange.ranges
  const pageTotal = endPageNum - startPageNum + 1
  logPrefix = logPrefix ? `${logPrefix.trim()} ` : ''

  for (let i = startPageNum; i <= endPageNum; i++) {
    const { items, hasNext } = await fetchPage(i)
    if (items) {
      items.push(...items)
      await context.onProgress?.(
        (100 * (i - startPageNum + 1)) / pageTotal,
        `${logPrefix}第 ${i}/${endPageNum} 页 • 获取 ${items.length} 条 • 累计 ${items.length}`,
      )
      await apiSleep(context.abortSignal)
      if (!hasNext) break
    }
  }
  return items
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
    (pageNum) =>
      dataModule.fetchChildrenPage(
        context,
        {
          pageNum,
        },
        parent,
      ),
    dataModule.getParentNodeTitle(parent),
  )
}

/**
 * 通过范围获取备份数据
 */
export const getBackupDataByRange = async <
  D extends Data = Data,
  T extends DataRangeType = BackupDataRangeType,
  P extends TreeData<Data> = TreeData<Data>,
>(
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
    const treeDataModule = dataModule as unknown as TreeDataModule<P, D>

    if (dataRange.type === 'all') {
      const parentList: P[] = await treeDataModule.fetchAll(context)
      for (let i = 0; i < parentList.length; i++) {
        const parent = parentList[i]
        parent.children = await treeDataModule.fetchChildrenAll(context, parent)
      }
      return parentList as unknown as D[]
    }

    if (dataRange.type === 'page') {
      throw new Error(`内部错误，[${dataModule.dataTypeName}]不支持全局分页选择`)
    }

    //  - tree：按层级路径选择指定数据
    //  - 第一层多选，第二层 all
    //  - 第一层单选，第二层 all/page
    if (dataRange.type === 'tree') {
      if (validateTreeDataRange(dataRange)) {
        throw new Error(`内部错误，[${dataModule.dataTypeName}]树形范围选择参数无效`)
      }

      const { nodes } = dataRange

      // 获取第一层
      const selectParentList = await treeDataModule.fetchAllByIds(
        context,
        nodes.map((n) => n.id),
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
      }

      return selectParentList as unknown as D[]
    }
  }

  throw new Error(`内部错误，暂不支持该备份范围类型[${dataRange.type}]`)
}

/**
 * 校验树形范围选择的参数
 *   - 第一层多选，第二层 all
 *   - 第一层单选，第二层 all/page
 */
export const validateTreeDataRange = ({ nodes }: TreeDataRange) => {
  if (nodes.length < 1) {
    return false
  }
  if (nodes.length > 1) {
    for (const node of nodes) {
      if (node.childrenDataRange.type === 'page') {
        // 第一层多选时，第二层只允许 all
        return false
      }
    }
  }
  return true
}
