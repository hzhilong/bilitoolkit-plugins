import { showSelectDialog, loadingDialog } from 'bilitoolkit-ui'
import { type RelationTag, type Relation, BiliClient } from '@ybgnb/bili-api'
import { createAbortError, sleepRandom, isCanceledError, getErrorMessage } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'

export async function getFollowTag({ client }: { client: BiliClient }): Promise<RelationTag[]> {
  try {
    loadingDialog.show()
    const allTags = await client.relation.getFollowTags()
    loadingDialog.close()
    const selectedTags = await showSelectDialog<RelationTag>({
      title: '请选择分组',
      options: allTags,
      getDataLabel: (data: RelationTag) => `${data.name}（${data.count}）`,
      getDataId: (data: RelationTag) => data.tagid,
      multiple: true,
      canSelectAll: true,
      showCurrentSelection: false,
      noSelectionTip: '未选择分组',
    })
    if (!selectedTags || !selectedTags.length) throw createAbortError()
    return selectedTags
  } finally {
    loadingDialog.close()
  }
}

export async function getFollowList(
  tags: RelationTag[],
  {
    client,
    maxSize,
    logger,
  }: {
    client: BiliClient
    maxSize: number
    logger: (msg: string) => void
  },
) {
  try {
    const abortController = new AbortController()
    const signal = abortController.signal
    loadingDialog.show({
      message: '获取关注中...',
      showCancel: true,
      onCancel: () => abortController.abort(),
    })
    const list: Relation[] = []
    for (const tag of tags) {
      logger(`正在获取关注列表 [${tag.name}]`)
      if (signal.aborted) throw createAbortError()

      await client.relation.fetchRelationAll(
        tag.tagid,
        undefined,
        async (currList: Relation[]) => {
          if (signal.aborted) throw createAbortError()
          logger(`已获取 ${currList.length} 个关注`)
          for (const item of currList) {
            list.push(item)
            if (list.length >= maxSize) {
              return false
            }
          }
        },
        { signal },
      )
      if (list.length >= maxSize) {
        break
      }
      await sleepRandom(1122, 2233)
    }
    logger(`总共获取 ${list.length} 个关注`)
    return list
  } finally {
    loadingDialog.close()
  }
}

export async function batchUnfollow(
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
      message: '批量取消关注中...',
      showCancel: true,
      onCancel: () => abortController.abort(),
    })
    let failedCount = 0
    const unfollowIds = new Set<number>()
    for (const followUser of list) {
      if (signal.aborted) throw createAbortError()

      if (unfollowIds.has(followUser.mid)) {
        continue
      }

      try {
        await client.relation.unFollowUser(followUser.mid, { signal })
        unfollowIds.add(followUser.mid)
        logger(`成功取消关注：${followUser.uname} - ${followUser.mid}`)
      } catch (e) {
        if (isCanceledError(e)) {
          throw createAbortError()
        }
        logger(`取消关注失败 ${followUser.uname} - ${followUser.mid} ：${getErrorMessage(e)}`)
        failedCount++
        if (failedCount >= 3) {
          throw new AppError('失败次数过多，已停止操作')
        }
      }
      await sleepRandom(1322, 2233)
    }
    logger(`总共取消 ${unfollowIds.size} 个关注`)
    return list
  } finally {
    loadingDialog.close()
  }
}
