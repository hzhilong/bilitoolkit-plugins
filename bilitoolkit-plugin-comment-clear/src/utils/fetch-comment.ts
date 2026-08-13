import { BiliClient } from '@ybgnb/bili-api'
import type { CommentWithNotif } from '@/types'
import { parseCommentsByNotif } from '@/utils/parse-comment'
import { sleepRandom } from '@ybgnb/utils'

export async function fetchCommentsByNotif(context: {
  client: BiliClient
  logger: (msg: string) => void
  signal: AbortSignal
}): Promise<Array<CommentWithNotif>> {
  const { client, logger, signal } = context
  const rpidCache = new Set<string>()

  logger('正在获取被回复的通知消息')
  const replyList = await client.message.fetchReplyAll(
    undefined,
    async (currList) => {
      logger(`已获取 ${currList.length} 条被回复的通知消息`)
    },
    { signal },
  )
  logger(`共获取 ${replyList.length} 条被回复的通知消息`)

  const allComments: Array<CommentWithNotif> = parseCommentsByNotif(replyList, rpidCache)
  logger('-------------')
  logger('正在获取被点赞的通知消息')
  await sleepRandom(1111, 2233, signal)
  const likeList = await client.message.fetchLikeAll(
    undefined,
    async (currList) => {
      logger(`已获取 ${currList.length} 条被点赞的通知消息`)
    },
    { signal },
  )
  logger(`共获取 ${likeList.length} 条被点赞的通知消息`)

  const commentByLike = parseCommentsByNotif(likeList, rpidCache)
  for (const item of commentByLike) {
    allComments.push(item)
  }
  logger(`共找到 ${allComments.length} 条关联评论`)
  return allComments
}
