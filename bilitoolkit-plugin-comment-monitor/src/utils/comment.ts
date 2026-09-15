import type { CommentSectionMeta, ContentType, UserContent } from '@/types'
import { parseCommentSourceUrl } from 'bili-comment-core'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { AppError } from 'bilitoolkit-types'

export async function fetchCommentSectionMeta(url: string): Promise<CommentSectionMeta> {
  const commentSource = await parseCommentSourceUrl(url)

  let content: UserContent
  let contentType: ContentType
  if (commentSource.type === 1) {
    content = await publicClient.videoInfo.getInfo({
      aid: commentSource.aid,
    })
    contentType = '视频'
  } else if (commentSource.type === 11 || commentSource.type === 12) {
    if ('opusDetail' in commentSource && commentSource.opusDetail) {
      content = commentSource.opusDetail
    } else {
      content = await publicClient.opus.getInfo(Number(commentSource.oid))
    }
    contentType = commentSource.type === 11 ? '图文动态' : '专栏'
  } else if (commentSource.type === 17) {
    content = await publicClient.dynamic.getDetail({
      id: commentSource.dynamicOid,
    })
    contentType = '动态'
  } else {
    throw new AppError(`未知的评论区类型：${commentSource.type}`)
  }

  return {
    source: commentSource,
    content: content,
    contentType: contentType,
  }
}
