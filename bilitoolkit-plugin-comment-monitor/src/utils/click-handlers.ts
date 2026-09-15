import { type BiliCommentEntity, getCommentUrl } from 'bili-comment-core'
import { showToast } from 'bilitoolkit-ui'

export const handleOpenComment = (comment: BiliCommentEntity) => {
  window.open(getCommentUrl(comment))
}

export const handleCopyCommentUrl = async (comment: BiliCommentEntity) => {
  await navigator.clipboard.writeText(getCommentUrl(comment))
  showToast('已复制该评论的分享链接')
}

export const handleOpenCommentUser = (comment: BiliCommentEntity) => {
  window.open(`https://space.bilibili.com/${comment.senderUid}`)
}
