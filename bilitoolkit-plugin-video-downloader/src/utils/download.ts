import type { DownloadVideoData, SelectedPartData, DownloadOption } from '@/types/download'
import { showError, showToast, toolkitApi } from 'bilitoolkit-ui'
import { getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { createFileNamer, parseFullFileName } from '@/utils/file-namer'
import type { FileNamingData, FileNamerSettings } from '@/types/file-namer'
import {
  type VideoInfo,
  type VideoPart,
  type AudioQuality,
  type VideoQuality,
  type VideoCodecId,
  audioQualityMap,
  videoQualityMap,
  videoCodecIdMap,
  type BiliClient,
  type UserInfoWithCookie,
  type PlayUrlData,
} from '@ybgnb/bili-api'
import type {
  DownloadCreateOptions,
  DownloadVideo,
  DownloadVideoPart,
  DownloadResource,
  DownloadResourceType,
  AudioDownloadResource,
  VideoDownloadResource,
  DMDownloadResource,
  CoverDownloadResource,
  BaseDownloadResource,
} from 'bilitoolkit-types'
import type { FileNamer } from '@ybgnb/file-naming'
import { getVideoPartSnapshot, getVideoInfoSnapshot } from '@/utils/convert'
import type { AppSettings } from '@/types/settings'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'

const createDownloadOption = <Data>(value: Data, label: string): DownloadOption<Data> => {
  return [value, label]
}

function getAudios(playData: PlayUrlData) {
  return [...(playData.dash?.audio ?? []), playData.dash?.flac?.audio, ...(playData.dash?.dolby?.audio ?? [])].filter(
    (a) => a != null,
  )
}

export const buildPartWithPlayData = async (
  {
    client,
    signal,
    appSettings,
  }: {
    client: BiliClient
    appSettings: AppSettings
    signal?: AbortSignal
  },
  video: VideoInfo,
  part: VideoPart,
): Promise<SelectedPartData | null> => {
  const partQuery = {
    bvid: video.bvid,
    cid: part.cid,
  }
  const playData = await client.videoPlayer.getPlayUrl(partQuery, { signal })

  if (!playData.dash) return null

  let supportAudioQualities = [
    ...new Set(
      getAudios(playData)
        .filter((a) => a != null)
        .map((a) => a.id),
    ),
  ].sort((a, b) => b - a) as (AudioQuality | 0)[]
  supportAudioQualities = supportAudioQualities.length > 0 ? supportAudioQualities : [0]

  const videos = playData.dash.video ?? []

  let supportVideoQualities = [...new Set(videos.map((a) => a.id))].sort((a, b) => b - a) as (VideoQuality | 0)[]
  supportVideoQualities = supportVideoQualities.length > 0 ? supportVideoQualities : [0]

  let supportVideoCodecs = [...new Set(videos.map((a) => a.codecid as VideoCodecId))].sort((a, b) => b - a) as (
    | VideoCodecId
    | 0
  )[]
  supportVideoCodecs = supportVideoCodecs.length > 0 ? supportVideoCodecs : [0]

  const { preferredAudioQuality, preferredVideoQuality, preferredVideoCodec } = appSettings

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

  const supportVideoCodecMapQuality = Object.fromEntries(
    supportVideoCodecs.map((vc) => {
      return [vc, videos.filter((v) => v.codecid === vc).map((v) => v.id)]
    }),
  ) as Record<VideoCodecId | 0, (VideoQuality | 0)[]>

  const codecList = supportVideoQualitiesMapCodec[selectedVideoQuality]
  if (!codecList.includes(selectedVideoCodecId)) {
    selectedVideoCodecId = codecList[0] ?? 0
  }

  return {
    info: part,
    playUrlData: playData,
    supportAudioQualities: supportAudioQualities.map((t) =>
      createDownloadOption(t, t === 0 ? '音频不存在' : audioQualityMap[t]),
    ),
    selectedAudioQuality,
    supportVideoQualities: supportVideoQualities.map((t) =>
      createDownloadOption(t, t === 0 ? '视频不存在' : videoQualityMap[t]),
    ),
    supportVideoQualitiesMapCodec: supportVideoQualitiesMapCodec,
    selectedVideoQuality,
    supportVideoCodecs: supportVideoCodecs.map((t) =>
      createDownloadOption(t, t === 0 ? '视频不存在' : videoCodecIdMap[t]),
    ),
    supportVideoCodecMapQuality: supportVideoCodecMapQuality,
    selectedVideoCodecId,
  }
}

export const createDownloadTasks = async (
  {
    user,
    appSettings,
    fileNamerSettings,
  }: {
    user: UserInfoWithCookie
    appSettings: AppSettings
    fileNamerSettings: FileNamerSettings
  },
  list: DownloadVideoData[],
  title: string,
) => {
  const fileNamer = createFileNamer(fileNamerSettings)

  const ipcVideos: DownloadVideo[] = []
  const createOptions: DownloadCreateOptions = {
    title: title,
    videos: [],
    userCookie: user.userCookie,
    settings: {
      autoMerge: appSettings.autoMerge,
      autoReparseOnUrlExpired: appSettings.autoReparseOnUrlExpired,
    },
  }

  for (const item of list) {
    const { resourceTypes } = item
    try {
      if (item.parts.length < 1 || item.resourceTypes.length < 1) {
        continue
      }

      const ipcParts: DownloadVideoPart[] = []
      for (const part of item.parts) {
        if (resourceTypes.includes('audio') && part.selectedAudioQuality === 0) {
          resourceTypes.splice(resourceTypes.indexOf('audio'), 1)
        }
        if (resourceTypes.includes('video') && (part.selectedVideoQuality === 0 || part.selectedVideoCodecId === 0)) {
          resourceTypes.splice(resourceTypes.indexOf('video'), 1)
        }

        const fileNamingData: FileNamingData = {
          video: item.video,
          part: part.info,
          audioQuality: part.selectedAudioQuality as AudioQuality,
          videoQuality: part.selectedVideoQuality as VideoQuality,
          videoCodec: part.selectedVideoCodecId as VideoCodecId,
        }

        const ipcResources: DownloadResource[] = []
        let partSubDir: undefined | string = undefined
        const { segments } = parseFullFileName(fileNamingData, 'video', fileNamer)
        if (segments.length > 0 && partSubDir === undefined) {
          partSubDir = segments.slice(0, -1).join('/')
        }
        const client = await createBiliClient(user)
        for (const resourceType of resourceTypes) {
          const resourceData = await buildDownloadResourceData(client, fileNamer, fileNamingData, resourceType, part)
          if (resourceData) {
            if (Array.isArray(resourceData)) {
              for (const resourceItem of resourceData) {
                ipcResources.push(resourceItem)
              }
            } else {
              ipcResources.push(resourceData)
            }
          }
        }

        if (appSettings.autoRenameOnConflict) {
          for (const ipcResource of ipcResources) {
            ipcResource.fullFilename = await toolkitApi.file.getUniqueFileName(ipcResource.fullFilename, partSubDir)
          }
        }

        ipcParts.push({
          resources: ipcResources,
          snapshot: getVideoPartSnapshot(part.info),
          subdirectory: partSubDir,
        })
      }

      ipcVideos.push({
        parts: ipcParts,
        snapshot: getVideoInfoSnapshot(item.video),
      })
    } catch (e) {
      showError(`新建下载任务 [${item.video.title}] 出错：${getErrorMessage(e)}`)
      return
    }
  }

  try {
    createOptions.videos = ipcVideos
    await toolkitApi.download.create(createOptions)
    showToast(`成功创建 ${ipcVideos.length} 个下载任务`)
  } catch (e) {
    showError(`新建下载任务出错：${getErrorMessage(e)}`)
    return
  }
}

const buildDownloadResourceData = async (
  client: BiliClient,
  fileNamer: FileNamer<FileNamingData>,
  fileNamingData: FileNamingData,
  resourceType: DownloadResourceType,
  { playUrlData }: SelectedPartData,
): Promise<DownloadResource | DownloadResource[] | null> => {
  const { segments } = parseFullFileName(fileNamingData, resourceType, fileNamer)
  const fullFilename = segments[segments.length - 1]
  const baseData: BaseDownloadResource = {
    type: resourceType,
    fullFilename: fullFilename,
    source: null!,
  }
  const { video, part, audioQuality, videoQuality, videoCodec } = fileNamingData

  switch (resourceType) {
    case 'audio':
      const audioStream = getAudios(playUrlData).find((a) => a.id === audioQuality)
      if (!audioStream) return null
      const audioData: AudioDownloadResource = {
        audio: audioStream,
        audioQuality: audioQuality,
      }
      baseData.source = audioData
      break

    case 'video':
      const videoStream = playUrlData.dash?.video?.find((a) => a.id === videoQuality && a.codecid === videoCodec)
      if (!videoStream) return null
      const videoData: VideoDownloadResource = {
        video: videoStream,
        videoQuality: videoQuality,
        videoCodec: videoCodec,
      }
      baseData.source = videoData
      break

    case 'dm':
      const dmData: DMDownloadResource = {
        videoPart: part,
      }
      baseData.source = dmData
      break

    case 'cover':
      const coverData: CoverDownloadResource = {
        coverUrl: video.pic,
      }
      baseData.source = coverData
      break

    case 'subtitle':
      const baseName = fullFilename.slice(0, fullFilename.lastIndexOf('.'))

      const subtitleList: DownloadResource[] = []

      const partQuery = {
        bvid: video.bvid,
        cid: part.cid,
      }
      const subtitleItems = await client.videoPlayer.getSubtitles(partQuery)
      await sleepRandom(1111, 2233)
      for (const subtitleItem of subtitleItems) {
        const subtitleData: BaseDownloadResource<'subtitle'> = {
          type: resourceType,
          fullFilename: `${baseName}.${subtitleItem.lan}.json`,
          source: {
            subtitleItem: subtitleItem,
          },
        }
        subtitleList.push(subtitleData)
      }
      return subtitleList
  }

  return baseData as DownloadResource
}
