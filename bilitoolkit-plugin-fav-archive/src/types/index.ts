import { BiliClient, type UserInfoWithCookie, type VideoInfo } from '@ybgnb/bili-api'
import type { InferConfig, TaskPluginToolkitApi } from 'bilitoolkit-types'
import type { MyTaskConfigFields } from '../config/config.js'
import type { Logger } from '@ybgnb/utils'

/**
 * 用户任务运行结果
 */
export interface ArchiveTaskResult {
  folder: {
    title: string
    mid: number
    medias: {
      title: string
      bvid: string
      aid: number
    }[]
  }[]
  taskId: number
  runAt: Date
  totalMediaCount: number
}

/**
 * 任务的执行上下文
 */
export interface ArchiveTaskContext {
  config: Omit<InferConfig<MyTaskConfigFields>, 'user'>
  maxVideosPerTask: number
  logger: Logger
  logPrefix: string
  user: UserInfoWithCookie
  biliClient: BiliClient
  signal: AbortSignal | undefined
  api: TaskPluginToolkitApi
  taskConfigCreatedAt?: number
}

/**
 * 收藏夹同步状态
 */
export type FavSyncState = {
  // 最后一次查询：mid - [page, favtime, ctime]
  queryParamsMap: Record<number, [number, number, number]>
  // 已下载：mid - avid[]
  downloadAidsMap: Record<number, number[]>
}

export interface FavVideo extends VideoInfo {
  fav_time: number
}
