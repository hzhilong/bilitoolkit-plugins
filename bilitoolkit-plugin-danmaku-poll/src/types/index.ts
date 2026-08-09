export interface PollOption {
  label: string
  color: string
}

export interface PollConfig {
  title: string
  options: PollOption[]
  /** 统计时长（秒），即开启后收集多久内的弹幕 */
  durationSeconds: number
}

export const PollStatus = {
  active: '投票中',
  ended: '已结束',
} as const

export type PollStatusType = keyof typeof PollStatus

export interface PollResult {
  status: PollStatusType
  config: PollConfig
  /** 投票开启时间戳（秒） */
  startTime: number
  /** 统计结束时间戳（秒） */
  endTime: number
  optionResults: {
    option: PollOption
    count: number
  }[]
  /** 总有效票数 */
  totalVotes: number
}

export interface PollRecord extends PollResult {
  /** 记录唯一标识 */
  id: number
  /** 记录创建时间戳（秒） */
  createdAt: number
}

export interface AppSettings {
  /** 开启后，投票启动时会自动在弹幕区发送一条提示消息，告知观众当前投票选项及参与方式 */
  autoSendStartDanmaku?: boolean
  lastPollConfig?: PollConfig
  roomId?: number
}
