import { BiliClient } from '@ybgnb/bili-api'
import { createAbortError, sleepRandom, isCanceledError, getErrorMessage, getFormattedDateTime } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'

const dynamicCommentPattern = /^bilibili:\/\/comment\/detail\/(\d+)\/(\d+)\//
const videoCommentPattern = /^bilibili:\/\/video\/(\d+)/

export interface CommentDelParams {
  oid: string
  rpid: string
  type: string
}
export type CacheKey = string
const toCacheKey = ({ oid, type, rpid }: CommentDelParams): CacheKey => `${type}:${oid}:${rpid}`

export const delCommentByMsg = async (
  {
    client,
    signal,
  }: {
    client: BiliClient
    signal: AbortSignal
  },
  msgItem: { rpid: string; native_uri: string },
  deletedCache: Set<CacheKey>,
) => {
  const { rpid, native_uri } = msgItem

  if (rpid === '0') {
    throw new Error('非评论消息')
  }

  let type: string | null = null
  let oid: string | null = null

  const dynamicMatch = native_uri.match(dynamicCommentPattern)

  if (dynamicMatch) {
    type = dynamicMatch[1]
    oid = dynamicMatch[2]
  } else {
    const videoMatch = native_uri.match(videoCommentPattern)

    if (videoMatch) {
      oid = videoMatch[1]
      type = '1'
    }
  }

  if (!type || !oid) throw new Error(`未支持该类型`)

  const delParams: CommentDelParams = {
    rpid,
    type,
    oid,
  }

  const cacheKey = toCacheKey(delParams)

  if (deletedCache.has(cacheKey)) {
    return false
  }

  await client.api.save('https://api.bilibili.com/x/v2/reply/del', {
    data: { oid, type, rpid },
    signal,
  })

  deletedCache.add(cacheKey)
  return true
}

export async function clearCommentsByNotif(context: {
  client: BiliClient
  logger: (msg: string) => void
  signal: AbortSignal
}) {
  const { client, logger, signal } = context
  logger('正在获取被回复的通知消息')
  const replyList = await client.message.fetchReplyAll(
    undefined,
    async (currList) => {
      logger(`已获取 ${currList.length} 条被回复的通知消息`)
    },
    { signal },
  )
  logger(`已获取 ${replyList.length} 条被回复的通知消息`)

  const deletedCache = new Set<string>()

  let delMsgCount = 0
  for (let i = 0; i < replyList.length; i++) {
    const msg = replyList[i]
    const { target_id, title, native_uri } = msg.item
    if (!msg.item || !msg.item.business) {
      logger(`${i + 1}/${replyList.length} 未被支持的消息，跳过：${title}`)
      continue
    }

    try {
      const delResult = await delCommentByMsg(context, { rpid: String(target_id), native_uri }, deletedCache)
      await sleepRandom(200, 300)
      await client.message.delReplyMessage(msg.id, { signal })
      delMsgCount++
      logger(`${i + 1}/${replyList.length} 成功删除关联评论和通知 [${title}]`)
      if (delResult) await sleepRandom(1222, 2233, signal)
    } catch (e) {
      logger(`${i + 1}/${replyList.length} 删除关联评论失败  [${title}] ${getErrorMessage(e)}`)
      if (isCanceledError(e)) {
        throw createAbortError()
      }
    }
  }

  logger('-------------')
  logger('正在获取被点赞的通知消息')
  const likeList = await client.message.fetchLikeAll(
    undefined,
    async (currList) => {
      logger(`已获取 ${currList.length} 条被点赞的通知消息`)
    },
    { signal },
  )
  logger(`已获取 ${likeList.length} 条被点赞的通知消息`)
  for (let i = 0; i < likeList.length; i++) {
    const msg = likeList[i]
    const { item_id, title, native_uri } = msg.item
    if (!msg.item || !msg.item.business) {
      logger(`${i + 1}/${likeList.length} 未关联评论，跳过：${native_uri}`)
      continue
    }

    try {
      const delResult = await delCommentByMsg(context, { rpid: String(item_id), native_uri }, deletedCache)
      await sleepRandom(200, 300)
      await client.message.setLikeMsgState(msg.id, 1, { signal })
      await sleepRandom(200, 300)
      await client.message.delLikeMessage(msg.id, { signal })
      delMsgCount++
      logger(`${i + 1}/${likeList.length} 成功删除关联评论和通知 [${title}]`)
      if (delResult) await sleepRandom(1222, 2233, signal)
    } catch (e) {
      logger(`${i + 1}/${likeList.length} 删除关联评论失败  [${native_uri}] ${getErrorMessage(e)}`)
      if (isCanceledError(e)) {
        throw createAbortError()
      }
    }
  }
  logger(`成功删除 ${deletedCache.size} 条关联评论，${delMsgCount} 条消息通知`)
}

async function getAicuTicket(signal: AbortSignal) {
  const enqueueRep = await fetch('https://api.aicu.cc/api/v4/queue/enqueue', { signal: signal })
  if (!enqueueRep.ok) {
    throw new AppError(`请求 Aicu 接口失败：${enqueueRep.status} ${enqueueRep.statusText ?? ''}`)
  }

  const { code, data, message } = await enqueueRep.json()

  if (code !== 0 || data == null) {
    throw new AppError(`请求 Aicu 接口失败：${message}`)
  }

  const { ticket } = data
  if (!ticket) {
    throw new AppError(`请求 Aicu 接口失败，ticket 为空`)
  }
  return ticket as string
}

export async function clearCommentsByAicu(context: {
  client: BiliClient
  logger: (msg: string) => void
  signal: AbortSignal
  uid: number
}) {
  const { client, logger, signal, uid } = context

  let pn = 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allReply: any[] = []
  while (true) {
    const ticket = await getAicuTicket(signal)
    await sleepRandom(666, 1111, signal)

    const rep = await fetch(
      `https://api.aicu.cc/api/v4/search/getreply?uid=${uid}&pn=${pn}&ps=100&keyword=+&need_count=true&mode=0&ticket=${ticket}`,
      {
        signal: signal,
      },
    )
    if (!rep.ok) {
      logger(`请求第${pn}页数据失败：${rep.status} ${rep.statusText ?? ''}`)
      if (allReply.length > 1) {
        break
      } else {
        throw new AppError('请求出错，已停止')
      }
    }
    const { code, data, message } = await rep.json()

    if (code !== 0 || data == null) {
      throw new AppError(`请求 Aicu 接口失败：${message}`)
    }

    const {
      cursor: { is_end },
      replies,
    } = data

    if (!replies || replies.length === 0) break

    logger(`已获取${replies.length}条评论`)
    allReply.push(...replies)

    if (is_end) break

    pn++
    await sleepRandom(1222, 2233, signal)
  }

  if (allReply.length < 1) {
    logger('未查询到自己的评论')
    return
  }

  let successCount = 0
  for (const reply of allReply) {
    const {
      message,
      rpid,
      dyn: { oid, type },
      time,
    } = reply
    const content = `[${message}](${getFormattedDateTime(new Date(time * 1000))})`
    try {
      await client.api.save('https://api.bilibili.com/x/v2/reply/del', {
        data: { oid, type, rpid },
        signal,
      })
      logger(`删除评论成功 ${content}`)
      successCount++
    } catch (e) {
      if (isCanceledError(e)) throw createAbortError()

      logger(`删除评论失败 [${content}] ：${getErrorMessage(e)}`)
    }
    await sleepRandom(1222, 2233, signal)
  }
  logger(`成功删除 ${successCount} 条评论`)
}
