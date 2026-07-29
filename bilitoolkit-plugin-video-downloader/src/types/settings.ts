import type { VideoQuality, AudioQuality, VideoCodecId } from '@ybgnb/bili-api'
import type { DownloadResourceType } from 'bilitoolkit-types'

export interface AppSettings {
  /** 优先下载的音频音质 */
  preferredAudioQuality: AudioQuality
  /** 优先下载的视频画质 */
  preferredVideoQuality: VideoQuality
  /** 优先下载的视频编码 */
  preferredVideoCodec: VideoCodecId

  /** 下载后自动合并音频和视频 */
  autoMerge: boolean
  /** 存在相同文件时，是否自动添加序号避免重名 */
  autoRenameOnConflict: boolean
  /** 当下载链接失效时，自动尝试重新解析资源地址，获取有效链接继续下载 */
  autoReparseOnUrlExpired: boolean

  /** 默认下载的资源 */
  defaultResourceTypes: DownloadResourceType[]
}
