import { BiliClient } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'
import type { CommentMeta } from '@/types'

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

export async function fetchCommentsByAicu(context: {
  client: BiliClient
  logger: (msg: string) => void
  signal: AbortSignal
  uid: number
}) {
  const { logger, signal, uid } = context

  let pn = 1
  const allReply: CommentMeta[] = []
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
    for (const reply of replies) {
      const {
        message,
        rpid,
        dyn: { oid, type },
      } = reply
      allReply.push({
        rpid: rpid,
        type,
        oid,
        rootid: reply.parent?.rootid ?? '0',
        title: message,
      })
    }

    if (is_end) break

    pn++
    await sleepRandom(1222, 2233, signal)
  }

  if (allReply.length < 1) {
    throw new AppError('未查询到自己的评论')
  }
  logger(`共查询到 ${allReply.length} 条自己的评论`)
  return allReply
}
