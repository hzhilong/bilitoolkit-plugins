import type { ArchiveTaskContext, ArchiveTaskResult } from '../types/index.js'
import { getFormattedDateTime } from '@ybgnb/utils'
import type { DownloadVideo } from 'bilitoolkit-types'
import { getNewFavItemsWithFolder } from './get-fav.js'
import { parseDownloadVideo } from './video-parse.js'

export const handleFavArchive = async (context: ArchiveTaskContext): Promise<ArchiveTaskResult | null> => {
  const nowDate = new Date()
  const { logger, logPrefix, user, biliClient, signal, api, maxVideosPerTask, config } = context

  const ignoreNames =
    (config.ignoreNames as string | undefined)
      ?.split(',')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0) ?? []

  let { list: folders } = await biliClient.fav.getFavFolders(undefined, undefined, { signal })
  folders = folders.filter((f) => !ignoreNames.includes(f.title))
  const list = await getNewFavItemsWithFolder(biliClient, folders, context, maxVideosPerTask)

  const folderResults: ArchiveTaskResult['folder'] = []
  const downloadVideos: DownloadVideo[] = []
  for (const { folder, children } of list) {
    const folderResult: ArchiveTaskResult['folder'][number] = {
      title: folder.title,
      mid: folder.mid,
      medias: [],
    }
    for (const media of children) {
      const dv = await parseDownloadVideo(context, folder, media)
      if (dv) {
        downloadVideos.push(dv)
        folderResult.medias.push({
          title: media.title,
          bvid: media.bvid,
          aid: media.aid,
        })
      }
    }
    if (folderResult.medias.length > 0) {
      folderResults.push(folderResult)
    }
  }

  if (downloadVideos.length < 1) {
    logger.info(`${logPrefix} 暂无可解析的新视频`)
    return null
  }

  logger.info(`${logPrefix} 正在创建下载任务`)
  const title = `【收藏夹存档】${user.name} ${getFormattedDateTime(nowDate)}`
  const downloadTask = await api.download.create({
    title,
    videos: downloadVideos,
    userCookie: user.userCookie,
    settings: {
      autoMerge: true,
    },
  })
  logger.info(`${logPrefix} 成功创建下载任务`)
  return {
    folder: folderResults,
    taskId: downloadTask.id,
    totalMediaCount: downloadVideos.length,
    runAt: nowDate,
  }
}
