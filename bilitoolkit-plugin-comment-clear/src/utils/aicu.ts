import { BiliClient } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'
import type { AicuCommentMeta } from '@/types'

async function getAicuTicket(signal: AbortSignal, logger: (msg: string) => void) {
  const enqueueRep = await fetch('https://api.aicu.cc/api/v4/queue/enqueue', { signal: signal })
  if (!enqueueRep.ok) {
    throw new AppError(`请求 Aicu 接口失败：${enqueueRep.status} ${enqueueRep.statusText ?? ''}`)
  }

  const { code, data, message } = await enqueueRep.json()

  if (code !== 0 || data == null) {
    throw new AppError(`请求 Aicu 接口失败：${message}`)
  }

  const { ticket, status } = data
  if (!ticket) {
    throw new AppError(`请求 Aicu 接口失败，ticket 为空`)
  }

  if (status === 'ready') return ticket

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`https://api.aicu.cc/api/v4/queue/stream?ticket=${ticket}`)

    eventSource.addEventListener('position', function (e) {
      const result = JSON.parse(e.data)
      logger(`正在排队，前方还有${result.ahead}人`)
    })
    eventSource.addEventListener('ready', function () {
      resolve(ticket)
    })
    eventSource.addEventListener('abort', function (e) {
      const result = JSON.parse(e.data)
      reject(result.message ?? '获取 ticket 出错')
    })
    eventSource.addEventListener('expired', function (e) {
      const result = JSON.parse(e.data)
      reject(result.message ?? '排队已超时，请重新发起查询')
    })
    eventSource.addEventListener('error', function () {
      reject('获取 ticket 出错，请重新排队')
    })
    eventSource.onerror = () => {
      reject('获取 ticket 出错，请重新排队')
    }
  })
}

export async function fetchCommentsByAicu(
  context: {
    client: BiliClient
    logger: (msg: string) => void
    signal: AbortSignal
    uid: number
  },
  query: { stime?: number; etime?: number; keyword?: string; mode?: string },
) {
  const { logger, signal, uid } = context

  const params = new URLSearchParams({
    uid: String(uid),
    pn: '1',
    ps: '100',
    keyword: query.keyword ?? '',
    need_count: 'true',
    mode: query.mode ?? '0',
    ticket: '',
    stime: query.stime ? String(Math.floor(query.stime / 1000)) : '',
    etime: query.etime ? String(Math.floor(query.etime / 1000)) : '',
  })

  let pn = 1
  const allReply: AicuCommentMeta[] = []
  while (true) {
    const ticket = await getAicuTicket(signal, logger)
    await sleepRandom(666, 1111, signal)

    params.set('pn', String(pn))
    params.set('ticket', ticket)

    const rep = await fetch(`https://api.aicu.cc/api/v4/search/getreply?${params}`, {
      signal: signal,
    })
    if (!rep.ok) {
      logger(`请求第${pn}页数据失败：${rep.status} ${rep.statusText ?? ''}`)
      if (allReply.length > 1) {
        logger('请求出错，已中断')
        return allReply
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
        time,
        dyn: { oid, type },
      } = reply
      allReply.push({
        rpid: rpid,
        type,
        oid,
        time,
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
