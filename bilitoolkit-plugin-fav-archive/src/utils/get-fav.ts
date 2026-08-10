import type { ArchiveTaskContext, FavVideo } from '../types/index.js'
import type { FavFolderItem, FavItem, BiliClient } from '@ybgnb/bili-api'
import { lastFavQueryRepo } from '../db/fav-sync-state.js'
import { sleepRandom } from '@ybgnb/utils'

/**
 * 获取收藏夹新增视频
 */
export async function getFavList(
  context: ArchiveTaskContext,
  folder: FavFolderItem,
  remainingCount: number,
  pageSize: number,
): Promise<FavVideo[]> {
  const nowTime = Math.floor(Date.now() / 1000)

  const { logger, logPrefix, biliClient, signal } = context

  const { title, id, media_count } = folder

  if (media_count < 1) {
    logger.info(`${logPrefix} 收藏夹 [${title}](${id}) 内容为空`)
    return []
  }

  const cacheList = new Map<number, FavItem[] | null>()
  const [prevQueryPage, prevQueryFavTime, prevQueryCtime] = await lastFavQueryRepo.getQueryParams(id)
  const downloadAids = new Set((await lastFavQueryRepo.getDownloadAids(id)) ?? [])

  // 先看第 1 页有没有新视频
  if (prevQueryFavTime) {
    const firstPage = await biliClient.fav.fetchPage({ media_id: id, order: 'mtime' }, { pageNum: 1 }, { signal })
    cacheList.set(1, firstPage)
    await sleepRandom(1333, 2233, signal)

    if (!firstPage || firstPage.length === 0) return []

    const newestItem = firstPage[0]
    const isNewestItemOld =
      newestItem.fav_time < prevQueryFavTime ||
      (newestItem.fav_time === prevQueryFavTime &&
        newestItem.ctime <= prevQueryCtime &&
        downloadAids.has(newestItem.id))

    if (isNewestItemOld) {
      logger.info(`${logPrefix} 收藏夹 [${title}](${id}) 无新视频`)
      return []
    }
  }

  const maxPageNum = Math.ceil(media_count / pageSize)

  let currentPage = prevQueryPage ? Math.min(prevQueryPage, maxPageNum) : maxPageNum

  let lastQueryPage = currentPage

  const result: FavVideo[] = []
  let cursorMatched = !prevQueryFavTime

  while (currentPage > 0 && remainingCount > 0) {
    let pageList: FavItem[] | null | undefined = null
    if (cacheList.has(currentPage)) {
      pageList = cacheList.get(currentPage)
    } else {
      pageList = await biliClient.fav.fetchPage(
        { media_id: id, order: 'mtime' },
        {
          pageNum: currentPage,
        },
        { signal },
      )
      cacheList.set(currentPage, pageList)
      await sleepRandom(1333, 2233, signal)
    }
    lastQueryPage = currentPage

    if (!pageList || pageList.length < 1) {
      break
    }

    const reversedList = [...pageList].reverse()

    let filteredList = reversedList.filter((item) => {
      if (!prevQueryFavTime) return true
      if (item.fav_time > prevQueryFavTime) return true
      if (item.fav_time === prevQueryFavTime && item.ctime > prevQueryCtime) return true
      if (item.fav_time === prevQueryFavTime && item.ctime === prevQueryCtime) {
        return !downloadAids.has(item.id)
      }
      return false
    })

    if (!cursorMatched && prevQueryFavTime && filteredList.length === reversedList.length) {
      // 当前页全都是新增的，可能数据后移了
      currentPage++
      if (currentPage > maxPageNum) {
        // 往后全身新增的
        cursorMatched = true
        currentPage = maxPageNum
      }
    } else {
      filteredList = filteredList.filter((item) => item.attr === 0)
      const currTaskHandleList = filteredList.slice(0, remainingCount)
      for (const favItem of currTaskHandleList) {
        logger.info(`${logPrefix} 正在获取视频信息 ${favItem.bvid} ${favItem.title}`)
        result.push({
          ...(await biliClient.videoInfo.getInfo({ aid: favItem.id }, { signal })),
          fav_time: favItem.fav_time,
        })
        await sleepRandom(1333, 2233, signal)
      }
      remainingCount = remainingCount - currTaskHandleList.length
      currentPage--
      cursorMatched = true
      if (remainingCount < 1) break
    }
  }

  const lastItem = result[result.length - 1]

  await lastFavQueryRepo.set(
    id,
    lastQueryPage,
    lastItem?.fav_time ?? prevQueryFavTime ?? nowTime,
    lastItem?.ctime ?? prevQueryCtime ?? 0,
    result.map((item) => item.aid),
  )

  if (result.length > 0) {
    logger.info(`${logPrefix} 收藏夹 [${title}](${id}) 已找到 ${result.length} 个新视频`)
  } else {
    logger.info(`${logPrefix} 收藏夹 [${title}](${id}) 无新视频`)
  }

  return result
}

export async function getNewFavItemsWithFolder(
  biliClient: BiliClient,
  folders: FavFolderItem[],
  context: ArchiveTaskContext,
  maxVideosPerTask: number,
) {
  let videoCount = 0
  const pageSize = biliClient.fav.buildPager({ media_id: 1 }).getPageSize()
  const list: Array<{ folder: FavFolderItem; children: Array<FavVideo> }> = []
  for (const folder of [...(folders ?? [])].reverse()) {
    const items = await getFavList(context, folder, Math.max(maxVideosPerTask - videoCount, 0), pageSize)
    videoCount = videoCount + items.length
    if (items.length > 0) {
      list.push({
        folder,
        children: items,
      })
    }
    if (videoCount >= maxVideosPerTask) break
  }
  return list
}
