import type { CommentSource, CommentWithNotif } from '@/types'
import type { ReplyMessage, LikeMessage, MessageBusiness } from '@ybgnb/bili-api'

const dynamicCommentPattern = /^bilibili:\/\/comment\/detail\/(\d+)\/(\d+)\/(\d+)\//
const videoCommentPattern = /^bilibili:\/\/video\/(\d+)/

export function parseCommentMeta(rpid: string, native_uri: string): CommentSource | null {
  let type: string | null = null
  let oid: string | null = null
  let rootid: string | null = null

  const dynamicMatch = native_uri.match(dynamicCommentPattern)

  if (dynamicMatch) {
    type = dynamicMatch[1]
    oid = dynamicMatch[2]
    rootid = dynamicMatch[3]
  } else {
    const videoMatch = native_uri.match(videoCommentPattern)
    if (videoMatch) {
      oid = videoMatch[1]
      type = '1'

      const params = new URLSearchParams(native_uri.split('?')[1])
      rootid = params.get('comment_root_id')
    }
  }

  if (!type || !oid) return null

  return {
    rpid,
    type,
    oid,
    rootid: rootid ?? '0',
  }
}

export function parseCommentsByNotif(
  list: LikeMessage<MessageBusiness>[] | ReplyMessage<MessageBusiness>[],
  rpidCache: Set<string>,
) {
  const allComments: Array<CommentWithNotif> = []

  for (let i = 0; i < list.length; i++) {
    const msg = list[i]
    const { title, native_uri, type } = msg.item
    if (!msg.item || !msg.item.business || type !== 'reply') {
      // 非关联评论的消息
      continue
    }

    const rpid = String(('like_time' in msg ? msg.item.item_id : msg.item.target_id) ?? 0)

    if (rpid === '0') continue

    if (rpidCache.has(rpid)) {
      // 重复
      continue
    }

    const meta = parseCommentMeta(rpid, native_uri)

    if (!meta) continue

    allComments.push({
      ...meta,
      title: 'target_reply_content' in msg.item ? msg.item.target_reply_content || title : title,
      likeMsgId: 'like_time' in msg ? msg.id : undefined,
      replyMsgId: 'reply_time' in msg ? msg.id : undefined,
    } as CommentWithNotif)

    rpidCache.add(rpid)
  }
  return allComments
}
