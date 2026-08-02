import type { BiliCommentCollection, BiliCommentSource } from 'bili-comment-core'
import type { VideoInfo, OpusDetail, OpusInfo, Dynamic } from '@ybgnb/bili-api'

export type UserContent = VideoInfo | OpusDetail | OpusInfo | Dynamic

export type ContentType = '动态' | '视频' | '图文动态' | '专栏'

export interface ContentWithComment<C extends UserContent = UserContent> extends BiliCommentCollection {
  source: BiliCommentSource
  content: C
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
