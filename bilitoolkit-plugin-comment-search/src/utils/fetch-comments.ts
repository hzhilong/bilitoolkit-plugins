import type { CommentItem, OnPageFetched } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { CommentQuery, CommentSource } from '@/types'

export const fetchComments = async (
  commentSource: CommentSource,
  { uid, keyword, mode, maxCount, isFetchSub }: CommentQuery,
  {
    signal,
  }: {
    signal: AbortSignal
  },
) => {
  const filteredList: CommentItem[] = []

  const appendItems = (list: CommentItem[]) => {
    for (const item of list) {
      if (uid && Number(item.member.mid) !== uid) continue
      if (keyword && !item.content.message.includes(keyword)) continue

      filteredList.push(item)

      if (isComplete()) return
    }
  }

  const isComplete = () => {
    return maxCount && filteredList.length >= maxCount
  }

  const onPageFetched: OnPageFetched<CommentItem> = async (currList: CommentItem[], _list: CommentItem[]) => {
    appendItems(currList)
    if (isComplete()) return false

    if (isFetchSub && currList && currList.length > 0) {
      for (const reply of currList) {
        if (reply.rcount > 0) {
          if (reply.replies && reply.replies.length === reply.rcount) {
            appendItems(reply.replies)
          } else {
            await sleepRandom(2222, 3333)
            const subList =
              (await publicClient.comment.fetchSubReplyAll(
                {
                  oid: reply.oid_str,
                  type: reply.type,
                  root: reply.rpid_str,
                },
                undefined,
                undefined,
                { signal: signal },
              )) ?? []
            appendItems(subList)
            if (isComplete()) return false
          }
        }
      }
    }
  }

  await publicClient.comment.fetchAll(
    {
      ...commentSource,
      mode: mode,
    },
    undefined,
    onPageFetched,
    {
      signal: signal,
    },
  )
  return filteredList
}
