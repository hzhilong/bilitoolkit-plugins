import type { Data, ExecuteContext } from '@/core/types/execute'
import type { DataModule } from '@/core/types/data-module'
import type { DataRange, DataRangeType } from '@/core/types/data-range'
import type { BackupDataRangeType } from '@/core/types/backup'
import { apiSleep } from '@/core/utils/sleep'

/**
 * 通过范围获取备份数据
 */
export const getBackupDataByRange = async <D = Data, T extends DataRangeType = BackupDataRangeType>(
  dataModule: DataModule<D>,
  dataRange: DataRange<T>,
  context: ExecuteContext,
) => {
  if (dataRange.type === 'all') {
    return (await dataModule.fetchAll(context)) ?? []
  }

  if (dataRange.type === 'page') {
    const items: D[] = []
    const [startPageNum, endPageNum] = dataRange.ranges
    const pageTotal = endPageNum - startPageNum + 1
    for (let i = startPageNum; i <= endPageNum; i++) {
      const page = await dataModule.fetchPage(context, {
        pageNum: i,
        pageParams: dataRange.pageParams,
      })
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

  throw new Error(`内部错误，暂不支持该备份范围类型[${dataRange.type}]`)
}
