import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { ElMessageBox } from 'element-plus'
import { biliClientStore, invokeBiliApi, biliApi, publicClient } from 'bilitoolkit-runtime/biliapi'
import { showSelectDialog, showError, showPageRangeDialog, showConfirm } from 'bilitoolkit-ui'
import { type FavFolderItem, BiliApiBusinessError } from '@ybgnb/bili-api'
import type { ToolContext } from '@/types/tools'
import { getDataByPageRange } from '@/core/utils/data-range'
import { getErrorMessage, chunk } from '@ybgnb/utils'
import { apiSleep } from '@/core/utils/sleep'
import { Tool } from '@/tools/index'

export class CopyFavTool extends Tool {
  title: string = '快速拷贝收藏夹'
  desc: string = '批量拷贝他人公开的收藏夹，亦可用于快速还原。'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const clientId = await biliClientStore.get(userInfo)

    const { value: sourceUid } = await ElMessageBox.prompt('请输入已公开收藏夹的用户 uid', '快速拷贝收藏夹', {
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]+$/,
      inputErrorMessage: '无效 uid',
    })

    log(`正在获取用户 [${sourceUid}] 的收藏夹`)
    const { list: folderList, count } = await invokeBiliApi(
      clientId,
      biliApi.fav.getFavFolders,
      Number(sourceUid),
      undefined,
      {
        signal: signal,
      },
    )

    if (!count) {
      showError('该用户未公开收藏夹')
      return
    }

    const selectedFolders = await showSelectDialog<FavFolderItem>({
      title: '请选择需要拷贝的收藏夹',
      options: folderList,
      getDataId: (f) => f.id,
      getDataLabel: (f) => `${f.title}  （${f.media_count}）`,
    })

    if (!selectedFolders || selectedFolders.length === 0) return

    const sourceFolder = selectedFolders[0]
    if (!sourceFolder.media_count) {
      showError(`收藏夹 [${sourceFolder.title}] 内容为空`)
      return
    }

    log(`正在获取自己的收藏夹`)
    const { list: myFolders } = await invokeBiliApi(clientId, biliApi.fav.getFavFolders, undefined, undefined, {
      signal,
    })

    const oldFolder = myFolders.find((f) => f.title === sourceFolder.title)
    let targetFolderId: number
    if (oldFolder) {
      log(`已存在同名收藏夹 [${oldFolder.title}]`)
      targetFolderId = oldFolder.id
    } else {
      log(`正在创建收藏夹 [${sourceFolder.title}]`)
      try {
        const newFolder = await invokeBiliApi(
          clientId,
          biliApi.fav.addFavFolder,
          {
            title: sourceFolder.title,
            privacy: 1,
          },
          { signal },
        )
        targetFolderId = newFolder.id
      } catch (err) {
        if (
          err instanceof BiliApiBusinessError &&
          (err.responseCode === 11002 || err.message.includes('已达到数量上限'))
        ) {
          await showConfirm('创建收藏夹失败，已达到数量上限。是否选择已有收藏夹？')
          const selectedMyFolders = await showSelectDialog<FavFolderItem>({
            title: '请选择需要拷贝的收藏夹',
            options: myFolders,
            getDataId: (f) => f.id,
            getDataLabel: (f) => `${f.title}  （${f.media_count}）`,
          })

          if (!selectedMyFolders || selectedMyFolders.length === 0) return

          targetFolderId = selectedMyFolders[0].id
        } else {
          log(`创建收藏夹失败：${getErrorMessage(err)}`)
          throw err
        }
      }
    }

    const pageSize = publicClient.fav.buildPager({ media_id: 1 }).getPageSize()

    const pageRange = await showPageRangeDialog({
      pageSize: pageSize,
      total: sourceFolder.media_count,
    })

    if (!pageRange) return

    log(`正在获取收藏夹列表 [${sourceFolder.title}] [${pageRange}]`)
    const list = await getDataByPageRange(
      {
        onProgress: async (_, msg) => {
          if (msg) log(msg)
        },
        signal: signal,
      },
      {
        type: 'page',
        ranges: pageRange,
      },
      async (pageNum, pageParams) => {
        return await invokeBiliApi(
          clientId,
          biliApi.fav.fetchPageWithNextParams,
          {
            media_id: sourceFolder.id,
          },
          {
            pageNum: pageNum,
            pageParams: pageParams,
          },
          { signal },
        )
      },
    )

    if (!list || list.length === 0) {
      log(`数据为空`)
      return
    }

    log(`正在拷贝收藏夹数据 > [id=${targetFolderId}]`)

    const chunkList = chunk(list, 40)
    for (let i = 0; i < chunkList.length; i++) {
      const cList = chunkList[i]
      await invokeBiliApi(
        clientId,
        biliApi.fav.copyFavItems,
        sourceFolder.id,
        targetFolderId,
        Number(sourceUid),
        cList.map((c) => `${c.id}:${c.type}`).join(','),
        { signal },
      )
      log(`[${i + 1}/${chunkList.length}] 成功批量拷贝 ${cList.length} 个收藏视频`)
      await apiSleep(signal)
    }
    log('操作完成')
  }
}
