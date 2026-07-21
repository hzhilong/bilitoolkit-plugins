import type { VideoInfo, VideoPart, AudioQuality, VideoQuality, VideoCodecId } from '@ybgnb/bili-api'
import { allFileNamerFields } from '@/constants/file-namer'
import type { DateFormat, TimeFormat, SerialNumberFormat } from '@ybgnb/file-naming'

export interface FileNamingData {
  video: VideoInfo
  part: VideoPart
  audioQuality: AudioQuality
  videoQuality: VideoQuality
  videoCodec: VideoCodecId
}

export type OptionalFileNamerFields = keyof typeof allFileNamerFields

export interface FileNamerSettings {
  fields: OptionalFileNamerFields[]
  extendedFormats: {
    dateFormat: DateFormat
    timeFormat: TimeFormat
    serialNumberFormat: SerialNumberFormat
  }
}
