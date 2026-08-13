import { getCommentUrl } from '@ybgnb/bili-api'
import type { CommentMeta } from '@/types'
import { showToast } from 'bilitoolkit-ui'

export const handleOpenComment = (item: CommentMeta) => {
  window.open(
    getCommentUrl({
      oid_str: item.oid,
      rpid_str: item.rpid,
      root_str: item.rootid,
      type: Number(item.type),
    }),
  )
}
export const handleCopyComment = async (item: CommentMeta) => {
  await navigator.clipboard.writeText(
    getCommentUrl({
      oid_str: item.oid,
      rpid_str: item.rpid,
      root_str: item.rootid,
      type: Number(item.type),
    }),
  )
  showToast('已复制该评论的分享链接')
}
