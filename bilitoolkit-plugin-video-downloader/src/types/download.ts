import type { DownloadResourceType } from 'bilitoolkit-types'
import {
  type VideoInfo,
  type VideoPart,
  type PlayUrlData,
  type AudioQuality,
  type VideoQuality,
  type VideoCodecId,
  type PlayerSubtitleItem,
} from '@ybgnb/bili-api'

export interface DownloadVideoData {
  video: VideoInfo
  parts: SelectedPartData[]
  resourceTypes: DownloadResourceType[]
}

export type DownloadOption<Data> = [Data, string]

export interface SelectedPartData {
  info: VideoPart
  playUrlData: PlayUrlData
  supportAudioQualities: DownloadOption<AudioQuality | 0>[]
  selectedAudioQuality: AudioQuality | 0
  supportVideoQualities: DownloadOption<VideoQuality | 0>[]
  selectedVideoQuality: VideoQuality | 0
  supportVideoCodecs: DownloadOption<VideoCodecId | 0>[]
  selectedVideoCodecId: VideoCodecId | 0
  playerSubtitleItems: PlayerSubtitleItem[]
}
