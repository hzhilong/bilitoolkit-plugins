import { loadingDialog } from 'bilitoolkit-ui'
import { type Relation, BiliClient } from '@ybgnb/bili-api'
import { createAbortError, isCanceledError, getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'

export async function getBlackList({ client, logger }: { client: BiliClient; logger: (msg: string) => void }) {
  try {
    const abortController = new AbortController()
    const signal = abortController.signal
    loadingDialog.show({
      message: '获取黑名单中...',
      showCancel: true,
      onCancel: () => abortController.abort(),
    })

    const list = await client.relation.fetchBlocksAll(
      undefined,
      async (currList: Relation[]) => {
        logger(`已获取 ${currList.length} 个黑名单`)
        return true
      },
      { signal },
    )
    logger(`总共获取 ${list.length} 个黑名单`)
    return list
  } finally {
    loadingDialog.close()
  }
}

export async function batchBlock(
  list: Relation[],
  {
    client,
    logger,
  }: {
    client: BiliClient
    logger: (msg: string) => void
  },
) {
  try {
    const abortController = new AbortController()
    const signal = abortController.signal
    loadingDialog.show({
      message: '批量拉黑用户中...',
      showCancel: true,
      onCancel: () => abortController.abort(),
    })
    let failedCount = 0
    let successCount = 0
    for (const followUser of list) {
      if (signal.aborted) throw createAbortError()

      const userIdentifier = `${followUser.uname} - ${followUser.mid}`

      try {
        await client.relation.unFollowUser(followUser.mid, { signal })
        successCount++
        logger(`成功拉黑用户：${userIdentifier}`)
      } catch (e) {
        if (isCanceledError(e)) {
          throw createAbortError()
        }
        const errorMessage = getErrorMessage(e)
        if (errorMessage.includes('重复')) {
          logger(`重复拉黑：${userIdentifier}`)
          continue
        }
        if (errorMessage.includes('上限')) {
          throw e
        }
        logger(`拉黑用户失败 ${userIdentifier} ：${errorMessage}`)
        failedCount++
        if (failedCount >= 3) {
          throw new AppError('失败次数过多，已停止操作')
        }
      }
      await sleepRandom(1322, 2233)
    }
    logger(`总共拉黑 ${successCount} 个用户`)
    return list
  } finally {
    loadingDialog.close()
  }
}
