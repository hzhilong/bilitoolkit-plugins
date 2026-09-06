/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OpusDetail } from '@ybgnb/bili-api'

export function parseOpusDyId(opusDetail: OpusDetail) {
  return opusDetail.item.id_str
}

export function parseOpusTitle(opusDetail: OpusDetail) {
  const title = opusDetail.item.basic.title
  return title.endsWith(' - 哔哩哔哩') ? title.slice(0, -' - 哔哩哔哩'.length) : title
}

export function parseOpusAuthor(opusDetail: OpusDetail) {
  const author = (opusDetail.item.modules as any).find(
    (m: any) => m.module_type === 'MODULE_TYPE_AUTHOR',
  )?.module_author
  if (!author) return null

  return {
    mid: author.mid,
    name: author.name,
    pub_ts: author.pub_ts,
  }
}

export function parseOpusCollection(opusDetail: OpusDetail) {
  const collection = (opusDetail.item.modules as any).find(
    (m: any) => m.module_type === 'MODULE_TYPE_COLLECTION',
  )?.module_collection
  if (!collection) return null

  return {
    id: collection.id,
    name: collection.name,
    count: collection.count,
    title: collection.title,
  }
}
