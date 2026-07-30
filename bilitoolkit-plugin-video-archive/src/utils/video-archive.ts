import type { ArchiveTaskContext, ArchiveTaskResult } from '../types/index.js'
import { lastQueryTimeRepo } from '../db/last-query-time.js'
import { formatTime, sleepRandom, getErrorMessage, formatFileTimestamp } from '@ybgnb/utils'
import {
  type SpaceVideo,
  type PlayUrlData,
  type AudioQuality,
  type VideoQuality,
  type VideoCodecId,
  type VideoInfo,
  type VideoPart,
} from '@ybgnb/bili-api'
import type {
  DownloadVideoPart,
  DownloadVideo,
  DownloadResource,
  AudioDownloadResource,
  VideoDownloadResource,
  VideoInfoSnapshot,
  VideoPartSnapshot,
} from 'bilitoolkit-types'
import { omit, pick } from 'lodash-es'
import { defaultSanitizePathSegment } from '@ybgnb/file-naming'

export const handleVideoArchive = async (context: ArchiveTaskContext): Promise<ArchiveTaskResult | null> => {
  const nowDate = new Date()
  const { logger, logPrefix, user, biliClient, signal, api, targetUid } = context

  const lastTime = await lastQueryTimeRepo.get(targetUid)
  let destUserInfo: ArchiveTaskResult['user'] | null = null

  try {
    if (lastTime == null) {
      logger.info(`${logPrefix} 首次执行，初始化完成。后续会自动保存 ${formatTime(nowDate)} 以后的视频投稿`)
      return null
    }

    logger.info(`${logPrefix} 正在获取最新的视频投稿`)
    const pager = biliClient.spaceVideo.buildPager({ mid: targetUid }, undefined, { signal })
    const videos: SpaceVideo[] = []
    while (true) {
      const pageList = await pager.fetchNext()
      if (!pageList || pageList.length < 1) {
        break
      }
      let isEnd = false
      for (const item of pageList) {
        if (lastTime < item.created) {
          videos.push(item)
        } else {
          isEnd = true
        }
      }
      await sleepRandom(1422, 2333)
      if (isEnd) {
        break
      }
    }

    logger.info(`${logPrefix} 已获取 ${videos.length} 个最新视频投稿`)
    const downloadVideos: DownloadVideo[] = []
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      try {
        const downloadVideo = await parseDownloadVideo(context, video, nowDate)
        if (!downloadVideo) {
          logger.info(`${logPrefix} 无视频资源`)
        } else {
          downloadVideos.push(downloadVideo)
          if (destUserInfo == null) {
            destUserInfo = downloadVideo.snapshot.owner
          }
        }
        await sleepRandom(1122, 2233)
      } catch (e) {
        logger.error(`${logPrefix} 解析视频失败：`, getErrorMessage(e))
      }
    }

    if (downloadVideos.length < 1) {
      logger.info(`${logPrefix} 成功解析的视频个数为0`)
      return null
    }

    logger.info(`${logPrefix} 正在创建下载任务`)
    const title = `【${destUserInfo?.name ?? targetUid}】自动存档 ${formatTime(nowDate)}`
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
      taskId: downloadTask.id,
      user: destUserInfo ?? { mid: targetUid, name: '', face: '' },
      videoTitles: downloadVideos.map((dv) => dv.snapshot.title),
      runAt: nowDate,
    }
  } catch (e) {
    logger.error(`${logPrefix} ${getErrorMessage(e)}`)
    return null
  } finally {
    await lastQueryTimeRepo.set(targetUid, Math.floor(nowDate.getTime() / 1000))
  }
}

const parseDownloadVideo = async (
  context: ArchiveTaskContext,
  video: SpaceVideo,
  nowDate: Date,
): Promise<DownloadVideo | null> => {
  const { logger, logPrefix, biliClient: client, signal } = context
  const bvid = video.bvid

  logger.info(`${logPrefix} 正在获取视频信息 ${video.bvid} ${video.title}`)

  const videoInfo = await client.videoInfo.getInfo(
    {
      bvid,
    },
    { signal },
  )
  await sleepRandom(1333, 2666)

  logger.info(`${logPrefix} 正在解析视频 ${video.bvid} ${video.title}`)

  const videoParts = await client.videoInfo.getParts(
    {
      bvid,
    },
    { signal },
  )
  await sleepRandom(1333, 2666)

  const downloadVideoParts: DownloadVideoPart[] = []
  for (let i = 0; i < videoParts.length; i++) {
    const part = videoParts[i]
    logger.info(`${logPrefix} 正在解析分P ${part.page}. ${part.part}`)

    const playData = await client.videoPlayer.getPlayUrl(
      {
        bvid,
        cid: part.cid,
      },
      { signal },
    )
    if (!playData.dash) continue

    const subDir = `【${videoInfo.owner.name}】自动存档 ${formatFileTimestamp(nowDate)}`
    const dPart = await parseDownloadVideoPart(context, videoInfo, part, playData, defaultSanitizePathSegment(subDir))
    if (dPart) {
      downloadVideoParts.push(dPart)
    }

    await sleepRandom(1111, 2233)
  }

  if (downloadVideoParts.length < 1) {
    return null
  }

  return {
    snapshot: getVideoInfoSnapshot(videoInfo),
    parts: downloadVideoParts,
  }
}

function getAudios(playData: PlayUrlData) {
  return [...(playData.dash?.audio ?? []), playData.dash?.flac?.audio, ...(playData.dash?.dolby?.audio ?? [])].filter(
    (a) => a != null,
  )
}

async function parseDownloadVideoPart(
  context: ArchiveTaskContext,
  video: VideoInfo,
  part: VideoPart,
  playData: PlayUrlData,
  subDir: string,
): Promise<DownloadVideoPart | null> {
  const { preferredAudioQuality, preferredVideoQuality, preferredVideoCodec } = context.config

  let supportAudioQualities = [
    ...new Set(
      getAudios(playData)
        .filter((a) => a != null)
        .map((a) => a.id),
    ),
  ].sort((a, b) => b - a) as (AudioQuality | 0)[]
  supportAudioQualities = supportAudioQualities.length > 0 ? supportAudioQualities : [0]
  const videos = playData.dash!.video ?? []
  let supportVideoQualities = [...new Set(videos.map((a) => a.id))].sort((a, b) => b - a) as (VideoQuality | 0)[]
  supportVideoQualities = supportVideoQualities.length > 0 ? supportVideoQualities : [0]
  let supportVideoCodecs = [...new Set(videos.map((a) => a.codecid as VideoCodecId))].sort((a, b) => b - a) as (
    | VideoCodecId
    | 0
  )[]
  supportVideoCodecs = supportVideoCodecs.length > 0 ? supportVideoCodecs : [0]

  const selectedAudioQuality =
    supportAudioQualities.find((q) => q <= preferredAudioQuality) ??
    supportAudioQualities?.[supportAudioQualities.length - 1] ??
    0
  const selectedVideoQuality =
    supportVideoQualities.find((q) => q <= preferredVideoQuality) ??
    supportVideoQualities?.[supportVideoQualities.length - 1] ??
    0

  let selectedVideoCodecId =
    supportVideoCodecs.find((q) => q <= preferredVideoCodec) ?? supportVideoCodecs?.[supportVideoCodecs.length - 1] ?? 0

  const supportVideoQualitiesMapCodec = Object.fromEntries(
    supportVideoQualities.map((vq) => {
      return [vq, videos.filter((v) => v.id === vq).map((v) => v.codecid)]
    }),
  ) as Record<VideoQuality | 0, (VideoCodecId | 0)[]>

  const codecList = supportVideoQualitiesMapCodec[selectedVideoQuality]
  if (!codecList.includes(selectedVideoCodecId)) {
    selectedVideoCodecId = codecList[0] ?? 0
  }

  const resources: DownloadResource[] = []

  if (selectedAudioQuality !== 0) {
    const audioStream = getAudios(playData).find((a) => a.id === selectedAudioQuality)
    if (audioStream) {
      const audioData: AudioDownloadResource = {
        audio: audioStream,
        audioQuality: selectedAudioQuality,
      }
      resources.push({
        type: 'audio',
        source: audioData,
        fullFilename: `${video.title}-P${part.page}.aac`,
      })
    }
  }

  if (selectedVideoQuality !== 0 && selectedVideoCodecId !== 0) {
    const videoStream = playData.dash?.video?.find(
      (a) => a.id === selectedVideoQuality && a.codecid === selectedVideoCodecId,
    )
    if (!videoStream) return null
    const videoData: VideoDownloadResource = {
      video: videoStream,
      videoQuality: selectedVideoQuality,
      videoCodec: selectedVideoCodecId,
    }

    resources.push({
      type: 'video',
      source: videoData,
      fullFilename: `${video.title}-P${part.page}.mp4`,
    })
  }

  resources.push({
    type: 'cover',
    source: {
      coverUrl: video.pic,
    },
    fullFilename: `${video.title}${getImgFileSuffix(video.pic)}`,
  })

  for (const resource of resources) {
    resource.fullFilename = defaultSanitizePathSegment(resource.fullFilename)
  }

  if (resources.length < 1) {
    return null
  } else {
    return {
      resources: resources,
      subdirectory: subDir,
      snapshot: getVideoPartSnapshot(part),
    }
  }
}

const getImgFileSuffix = (url: string) => {
  const index = url.lastIndexOf('.')
  return index > -1 ? url.slice(index) : '.jpg'
}

const getVideoInfoSnapshot = (videoInfo: VideoInfo): VideoInfoSnapshot => {
  const base = pick(videoInfo, ['bvid', 'aid', 'tid', 'tid_v2', 'pic', 'title', 'pubdate', 'desc', 'duration', 'owner'])
  const stat = omit(videoInfo.stat, 'dislike')
  return { ...base, stat }
}

const getVideoPartSnapshot = (videoPart: VideoPart): VideoPartSnapshot => {
  return pick(videoPart, ['cid', 'page', 'part', 'duration', 'first_frame'])
}
