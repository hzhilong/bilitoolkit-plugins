import type { ExecuteContext } from '@/core/types/execute'

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
  context: ExecuteContext,
  msgItem: { rpid: string; native_uri: string },
  deletedCache: Set<CacheKey>,
) => {
  const { signal, client } = context
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
