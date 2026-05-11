import type { DataModule } from '@/core/types/data-module'
import { type BatchOptions, isBatchable, type BatchProgress } from '@/core/types/batch'
import type { Data, ExecuteContext } from '@/core/types/execute'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import { apiSleep } from '@/core/utils/sleep'

/**
 * 获取备份时需要分批次处理的数据
 */
export const getBackupBatchData = async <D = Data>(
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
  const { progressCallback } = context

  // 数据总数
  let total: number | null = null
  // 空数据的结果
  const emptyDataResult = {
    list: [],
    batchProgress: {
      isFinished: true,
      nextBatch: startBatch,
    } satisfies BatchProgress,
  }
  if (dataModule.fetchTotal !== undefined) {
    await progressCallback(1, `正在获取数据条数`)
    total = await dataModule.fetchTotal(context)
    if (total === 0 || total < batchSize * (startBatch - 1)) {
      // 数据为空 / 无更多数据可处理，分批处理已结束
      return emptyDataResult
    }
    await apiSleep(context.abortSignal)
  }

  // 记录最后一次分页的数据
  let lastPageData: PageDataWithNextParams<D> | null = null
  // 转换为数据源的分页起始页码
  //  let currentPage = Math.floor(((startBatch - 1) * batchSize) / backupFetchPageSize) + 1
  // 先获取一页的数据
  await progressCallback(1, `正在获取数据...`)
  lastPageData = await dataModule.fetchPage(context, {
    // 这里已包含 pageNum
    pageParams,
  })

  if (!lastPageData.items || lastPageData.items.length === 0) {
    // 当前页无数据
    return emptyDataResult
  }

  // 当前批次已获取的数据
  const list: D[] = []
  // 数据源分页大小
  const pageSize = lastPageData.pageSize
  // 当前批次需要获取的数据大小
  const currBatchRemainingSize = total ? Math.min(total - (startBatch - 1) * batchSize, batchSize) : batchSize
  // 当前批次需要获取的分页数据次数
  const currBatchRemainingCount = Math.ceil(currBatchRemainingSize / pageSize)
  // 当前批次获取分页数据序号
  let currPageNo = 1
  // 当前批次获取分页数据页码

  const handlePageData = async (items: D[]) => {
    list.push(...items)
    await progressCallback(
      (100 * currPageNo) / currBatchRemainingCount,
      `[批次 ${startBatch}] 第 ${currPageNo}/${currBatchRemainingCount} 页 • 获取 ${items.length} 条 • (累计 ${list.length}/${currBatchRemainingSize})`,
    )
    await apiSleep(context.abortSignal)
    currPageNo++
  }

  await handlePageData(lastPageData.items)

  // 有更多数据
  let hasMoreData = lastPageData.hasNext
  // 循环获取剩余数据
  while (list.length < currBatchRemainingSize && hasMoreData) {
    // 请求数据源的指定页
    lastPageData = await dataModule.fetchPage(context, {
      pageParams: lastPageData.nextParams,
    })

    // 无更多数据
    if (!lastPageData.hasNext || !lastPageData.items || lastPageData.items.length === 0) {
      hasMoreData = false
      break
    }

    await handlePageData(lastPageData.items)
  }

  if (!lastPageData) throw new Error(`内部错误，[${dataModule.dataTypeName}]模块的分批处理大小为 0`)

  const batchProgress: BatchProgress = {
    isFinished: !hasMoreData,
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
