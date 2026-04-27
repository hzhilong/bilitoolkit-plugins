import { type UserInfo, BiliClient } from '@ybgnb/bili-api'
import type { InferConfig, TaskLogger } from 'bilitoolkit-types'
import type { MyTaskConfigFields } from '../config/config.js'
import type { UpgradeTask } from '../tasks/base.js'

/**
 * 升级任务运行结果
 */
export interface UpgradeTaskResult {
  // 任务名称
  type: string
  // 是否成功
  success: boolean
  // 简要信息
  message: string
  // 经验值
  exp: number
}

/**
 * 用户任务运行结果
 */
export interface UserTaskResult {
  user: UserInfo
  results: UpgradeTaskResult[]
  runAt: Date
}

/**
 * 升级任务的执行上下文
 */
export interface UpgradeTaskContext {
  config: Omit<InferConfig<MyTaskConfigFields>, 'users'>
  logger: TaskLogger
  logPrefix: (task: UpgradeTask) => string
  biliClient: BiliClient
  signal: AbortSignal | undefined
}
