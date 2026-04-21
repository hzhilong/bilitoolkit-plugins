import type { UserInfo } from '@ybgnb/bili-api'

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
