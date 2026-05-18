import type { DataModule, Data } from '@/core/types/data-module'
import { type BatchOptions, isBatchable, type BatchProgress } from '@/core/types/batch'
import type { ExecuteContext } from '@/core/types/execute'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import { apiSleep } from '@/core/utils/sleep'

/**
 * 获取分批次处理的备份数据
 */
export const getBatchBackupData = async <D extends Data = Data>(
  dataModule: DataModule<D>,
  batchOptions: BatchOptions,
  context: ExecuteContext,
): Promise<{
  batchProgress: BatchProgress
  list: D[]
}> => {
  if (!isBatchable(dataModule)) {
    throw new Error(`内部错误，[${dataModule.dataType}]不支持分批处理`)
  }

  // 这里的分批处理大小不能直接赋值为分页大小
  // 批次配置：batchSize（每批目标条数），startBatch（起始批次编号，从1开始）
  const { batchSize, startBatch, pageParams } = batchOptions
  const { onProgress } = context

  // 空数据的结果
  const emptyDataResult = {
    list: [],
    batchProgress: {
      isFinished: true,
      nextBatch: startBatch,
    } satisfies BatchProgress,
  }

  // 数据总数
  let total: number | null = null
  if (dataModule.fetchTotal !== undefined) {
    if (onProgress) {
      await onProgress(1, `正在获取数据条数`)
    }
    total = await dataModule.fetchTotal(context)
    if (total === 0 || total < batchSize * (startBatch - 1)) {
      // 数据为空 / 无更多数据可处理，分批处理已结束
      return emptyDataResult
    }
    await apiSleep(context.abortSignal)
  }

  if (onProgress) {
    await onProgress(1, `正在获取数据...`)
  }
  // 数据源分页大小
  const pageSize = dataModule.getPageSize()
  // 当前批次需要获取的数据大小
  const currBatchRemainingSize = total ? Math.min(total - (startBatch - 1) * batchSize, batchSize) : batchSize
  // 当前批次需要获取的分页数据次数
  const currBatchRemainingCount = Math.ceil(currBatchRemainingSize / pageSize)
  // 记录最后一次分页的数据
  let lastPageData: PageDataWithNextParams<D> | null = null
  // 当前批次已获取的数据
  const list: D[] = []
  for (let pageNum = 0; pageNum <= currBatchRemainingCount; pageNum++) {
    lastPageData = await dataModule.fetchPage(context, {
      // 这里已包含 pageNum
      pageParams: lastPageData ? lastPageData.nextParams : pageParams,
    })
    const { items } = lastPageData
    if (!items || items.length === 0) {
      // 这里不退出，继续循环。防止出现当前页数据全部无效的情况（已知收藏夹出现无效数据时会出现size<pageSize）
    } else {
      if (onProgress) {
        await onProgress(
          (100 * pageNum) / currBatchRemainingCount,
          `[批次 ${startBatch}] 第 ${pageNum}/${currBatchRemainingCount} 页 • 获取 ${items.length} 条 • (累计 ${list.length}/${currBatchRemainingSize})`,
        )
      }
      list.push(...items)
      await apiSleep(context.abortSignal)
    }
  }

  if (!lastPageData) throw new Error(`内部错误，[${dataModule.dataTypeName}]模块的分批处理大小为 0`)

  const batchProgress: BatchProgress = {
    isFinished: !lastPageData.hasNext,
    nextBatch: startBatch + 1,
    nextPageParams: lastPageData?.nextParams,
  }

  if (total !== null) {
    batchProgress.remainingDataCount = Math.max(total - startBatch * batchSize, 0)
    batchProgress.remainingBatchCount = Math.ceil(batchProgress.remainingDataCount / batchSize)
  }

  return {
    list,
    batchProgress,
  }
}
