import type { BiliCommentCollection } from 'bili-comment-core'

export function getTotalCommentCount(collection: BiliCommentCollection) {
  return collection.comments.length + collection.comments.reduce((acc, item) => acc + item.subCount, 0)
}
