import type { BiliClient, UserInfoWithCookie } from '@ybgnb/bili-api'
import type { AppSettings } from '@/types/settings'
import type { FileNamer } from '@ybgnb/file-naming'

export interface OptContext {
  client: BiliClient
  user: UserInfoWithCookie
  appSettings: AppSettings
  fileNamer: FileNamer
  signal: AbortSignal
}
