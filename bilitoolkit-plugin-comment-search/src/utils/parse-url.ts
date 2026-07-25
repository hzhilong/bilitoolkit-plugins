import { parseVideoId, bv2av, parseOpusId, parseDynamicOid, parseCvId } from '@ybgnb/bili-api'
import { AppError } from 'bilitoolkit-types'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { sleepRandom } from '@ybgnb/utils'
import type { CommentSource } from '@/types'

export const parseUrl = async (url: string) => {
  const strategies = [
    async () => {
      const videoId = await parseVideoId(url)
      return {
        oid: videoId.bvid ? String(bv2av(videoId.bvid)) : videoId.aid!,
        type: 1,
      }
    },
    async () => {
      const oid = await parseOpusId(url)
      const opusDetail = await publicClient.opus.getDetail({ id: oid })
      await sleepRandom(1122, 1666)
      return { oid: opusDetail.item.basic.comment_id_str, type: opusDetail.item.basic.comment_type }
    },
    async () => {
      const cvid = await parseCvId(url)
      return { oid: cvid, type: 12 }
    },
    async () => {
      const oid = await parseDynamicOid(url)
      return { oid, type: 17 }
    },
  ]

  for (const strategy of strategies) {
    try {
      return (await strategy()) as CommentSource
    } catch {}
  }

  throw new AppError('解析 url 错误')
}
