import type { ExecuteContext } from '@/core/types/execute'
import type { DataModule, Data, TreeData, FetchTreeQuery } from '@/core/types/data-module'
import type { DataRange, DataRangeType, TreeDataRange, PageDataRange } from '@/core/types/data-range'
import type { BackupDataRangeType } from '@/core/types/backup'
import { apiSleep } from '@/core/utils/sleep'

/**
 * 通过分页范围获取备份数据
 */
async function getBackupDataByPageRange<D>(
  context: ExecuteContext,
  dataModule: DataModule<D>,
  dataRange: PageDataRange,
  query?: FetchTreeQuery,
) {
  const items: D[] = []
  const [startPageNum, endPageNum] = dataRange.ranges
  const pageTotal = endPageNum - startPageNum + 1
  for (let i = startPageNum; i <= endPageNum; i++) {
    const page = await dataModule.fetchPage(
      context,
      {
        pageNum: i,
        pageParams: dataRange.pageParams,
      },
      query,
    )
    if (!page.items) {
      break
    } else {
      items.push(...page.items)
      if (context.progressCallback) {
        await context.progressCallback(
          (100 * (i - startPageNum + 1)) / pageTotal,
          `第 ${i}/${endPageNum} 页 • 获取 ${page.items.length} 条 • 累计 ${items.length}`,
        )
      }
      if (!page.hasNext) break
      await apiSleep(context.abortSignal)
    }
  }
  return items
}

/**
 * 通过范围获取备份数据
 */
export const getBackupDataByRange = async <D extends Data = Data, T extends DataRangeType = BackupDataRangeType>(
  dataModule: DataModule<D>,
  dataRange: DataRange<T>,
  context: ExecuteContext,
) => {
  if (dataRange.type === 'all') {
    return (await dataModule.fetchAll(context)) ?? []
  }

  if (dataRange.type === 'page') {
    if (dataModule.treeRangeOptions) throw new Error(`内部错误，[${dataModule.dataTypeName}]不支持全局分页选择`)
    return await getBackupDataByPageRange(context, dataModule, dataRange)
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
    const level1List = (await dataModule.fetchAll(context, {
      level: 1,
      level1Ids: nodes.map((node) => node.id),
    })) as TreeData[]
    if (level1List.length !== nodes.length) {
      throw new Error(`内部错误，[${dataModule.dataTypeName}]树形范围数据错误(node1)`)
    }

    for (let i = 0; i < nodes.length; i++) {
      const nodeRange = nodes[i]
      const nodeData = level1List[i]
      // 获取第二层数据
      const query: FetchTreeQuery = {
        level: 2,
        level1Id: nodeRange.id,
      }
      if (nodeRange.childrenDataRanges.type === 'all') {
        // 所有数据
        nodeData.children = await dataModule.fetchAll(context, query)
      } else {
        // 分页数据
        nodeData.children = await getBackupDataByPageRange(context, dataModule, nodeRange.childrenDataRanges, query)
      }
    }

    return level1List as D[]
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
      if (node.childrenDataRanges.type === 'page') {
        // 第一层多选时，第二层只运行 all
        return false
      }
    }
  }
  return true
}
