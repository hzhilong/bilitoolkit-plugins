import type { Dynamic, OpusDetail, OpusInfo, VideoInfo } from '@ybgnb/bili-api'
import type { BiliCommentEntity, BiliCommentSource } from 'bili-comment-core'

export type UserContent = VideoInfo | OpusDetail | OpusInfo | Dynamic

export type ContentType = '动态' | '视频' | '图文动态' | '专栏'

export interface CommentSectionMeta {
  source: BiliCommentSource
  content: UserContent
  contentType: ContentType
}

export interface CommentCollectionQuery {
  // like 查询
  content?: string
  senderUid?: number
  // like 查询
  senderName?: string
  // 时间范围
  ctime: [number, number]
}

export interface AppSettings {
  /** 启用缓存？ */
  enableCache: boolean
  /** 从缓存同步评论时，重新获取多少条最外层评论及其楼中楼（按热门排序） */
  cacheSyncRefreshHotCommentLimit: number
  /** 从缓存同步评论时，重新获取多少条最外层评论及其楼中楼（按时间排序） */
  cacheSyncRefreshTimeCommentLimit: number
}
export const pushConfigTypeMap = {
  FeiShuBot: '飞书机器人',
} as const

export type PushConfigType = keyof typeof pushConfigTypeMap

export type PushConfig<T extends PushConfigType = PushConfigType> = {
  type: T
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
} & ([T] extends ['FeiShuBot'] ? FeiShuBotConfig : {})

export interface FeiShuBotConfig {
  webhookUrl: string
  secret?: string
}

export interface MonitorConfig {
  uuid: string
  name: string
  url: string
  /** 评论区元数据 */
  commentSectionMeta: CommentSectionMeta
  /** 查询间隔（秒） */
  interval: number
  /** 10位时间戳 */
  createTime: number
  /** 10位时间戳 */
  updateTime?: number
  /** 监听的uid数组 */
  targetUids: number[]
  /** 推送配置 */
  pushConfigs: PushConfig[]
  /** 监听结果 */
  result: BiliCommentEntity[]
}
