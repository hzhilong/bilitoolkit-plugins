import { BiliClient, type UserInfoWithCookie } from '@ybgnb/bili-api'
import type { InferConfig, TaskPluginToolkitApi } from 'bilitoolkit-types'
import type { MyTaskConfigFields } from '../config/config.js'
import type { Logger } from '@ybgnb/utils'

/**
 * 用户任务运行结果
 */
export interface ArchiveTaskResult {
  user: {
    mid: number
    name: string
    face: string
  }
  taskId: number
  videoTitles: string[]
  runAt: Date
}

/**
 * 任务的执行上下文
 */
export interface ArchiveTaskContext {
  config: Omit<InferConfig<MyTaskConfigFields>, 'user'>
  targetUid: number
  logger: Logger
  logPrefix: string
  user: UserInfoWithCookie
  biliClient: BiliClient
  signal: AbortSignal | undefined
  api: TaskPluginToolkitApi
  taskConfigCreatedAt?: number
}

/**
 * 最近一次动态列表的查询时间映射，key为uid
 */
export type LastQueryTime = Record<number, number>
