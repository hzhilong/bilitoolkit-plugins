import type { BiliClient } from '@ybgnb/bili-api'
import { createAbortError, getErrorMessage, shortenText, sleepRandom } from '@ybgnb/utils'
import type { CommentMeta } from '@/types'
import { showConfirm } from 'bilitoolkit-ui'

export async function deleteComments(
  {
    client,
    logger,
    signal,
  }: {
    client: BiliClient
    logger: (message: string) => void
    signal?: AbortSignal
  },
  deleteList: CommentMeta[],
  onDeletedItem?: (comment: CommentMeta) => Promise<void>,
) {
  if (!deleteList || deleteList.length === 0) {
    return
  }
  if (signal?.aborted) throw createAbortError()

  await showConfirm(`确定删除所选的${deleteList.length}条评论吗？`)
  await showConfirm('确定删除吗')

  let successCount = 0

  for (let i = 0; i < deleteList.length; i++) {
    if (signal?.aborted) throw createAbortError()

    const item = deleteList[i]
    const { oid, type, rpid, title } = item
    try {
      await client.api.save('https://api.bilibili.com/x/v2/reply/del', {
        data: { oid, type, rpid },
        signal,
      })
      successCount++
      logger(`成功删除评论：【${shortenText(title, 30)}】`)
      if (onDeletedItem != null) {
        await onDeletedItem(item)
      }
    } catch (e) {
      logger(`删除评论失败 ${getErrorMessage(e)}：【${shortenText(title, 30)}】`)
    }
    if (signal?.aborted) throw createAbortError()

    if (i !== deleteList.length - 1) {
      await sleepRandom(1122, 2233)
    }
  }

  logger(`--------------------------`)
  logger(`成功删除${successCount}条评论`)
}
