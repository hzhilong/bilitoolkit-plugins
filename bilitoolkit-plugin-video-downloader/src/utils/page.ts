import type { RequestParams, PageDataWithNextParams } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'

export async function getDataByPageRange<D>(
  context: {
    onProgress?: (progress?: number, msg?: string) => Promise<void>
    signal?: AbortSignal
  },
  dataRange: {
    ranges: [number, number]
  },
  fetchPage: (pageNum: number, nextParams?: RequestParams) => Promise<PageDataWithNextParams<D>>,
  logPrefix?: string,
) {
  const result: D[] = []
  const [startPageNum, endPageNum] = dataRange.ranges
  const pageTotal = endPageNum - startPageNum + 1
  logPrefix = logPrefix ? `${logPrefix.trim()} ` : ''

  let pageParams
  for (let i = startPageNum; i <= endPageNum; i++) {
    const { items, hasNext, nextParams } = await fetchPage(i, pageParams)
    pageParams = nextParams
    if (items) {
      result.push(...items)
      await context.onProgress?.(
        (100 * (i - startPageNum + 1)) / pageTotal,
        `${logPrefix}第 ${i}/${endPageNum} 页 • 获取 ${items.length} 条 • 累计 ${result.length}`,
      )
      await sleepRandom(1111, 2233, context.signal)
      if (!hasNext) break
    }
  }
  return result
}
