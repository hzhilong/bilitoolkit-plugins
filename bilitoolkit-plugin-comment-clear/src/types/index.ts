export interface CommentSource {
  oid: string
  rpid: string
  rootid: string | '0'
  type: string
  bvid?: string
}

export interface CommentMeta extends CommentSource {
  title: string
}

export interface CommentWithNotif extends CommentMeta {
  likeMsgId?: number
  replyMsgId?: number
}
