import type {
  PlayUrlData,
  VideoInfo,
  VideoPart,
  AudioQuality,
  VideoQuality,
  VideoCodecId,
  FavFolderItem,
} from '@ybgnb/bili-api'
import { sleepRandom, formatFileTimestamp } from '@ybgnb/utils'
import { defaultSanitizePathSegment } from '@ybgnb/file-naming'
import { pick, omit } from 'lodash-es'
import type { ArchiveTaskContext, FavVideo } from '../types/index.js'
import type {
  DownloadVideo,
  DownloadVideoPart,
  DownloadResource,
  AudioDownloadResource,
  VideoDownloadResource,
  VideoInfoSnapshot,
  VideoPartSnapshot,
} from 'bilitoolkit-types'

export const parseDownloadVideo = async (
  context: ArchiveTaskContext,
  folder: FavFolderItem,
  videoInfo: FavVideo,
): Promise<DownloadVideo | null> => {
  const { logger, logPrefix, biliClient: client, signal } = context
  const bvid = videoInfo.bvid

  logger.info(`${logPrefix} 正在解析视频 ${videoInfo.bvid} ${videoInfo.title}`)

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

    await sleepRandom(1111, 2233)
    if (!playData.dash) continue

    const subDir = [`${folder.mid} 收藏夹`, folder.title]
    const dPart = await parseDownloadVideoPart(
      context,
      videoInfo,
      part,
      playData,
      subDir.map(defaultSanitizePathSegment).join('/'),
    )
    if (dPart) {
      downloadVideoParts.push(dPart)
    }
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
  video: FavVideo,
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
        fullFilename: `${formatFileTimestamp(new Date(video.fav_time * 1000))} - ${video.bvid} - ${video.title}-P${part.page}.aac`,
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
      fullFilename: `${formatFileTimestamp(new Date(video.fav_time * 1000))} - ${video.bvid} - ${video.title}-P${part.page}.mp4`,
    })
  }

  resources.push({
    type: 'cover',
    source: {
      coverUrl: video.pic,
    },
    fullFilename: `${formatFileTimestamp(new Date(video.fav_time * 1000))} - ${video.bvid} - ${video.title}${getImgFileSuffix(video.pic)}`,
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
