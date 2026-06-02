import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { ElMessageBox } from 'element-plus'
import { biliClientStore, invokeBiliApi, biliApi, publicClient } from 'bilitoolkit-runtime/biliapi'
import { showSelectDialog, showPageRangeDialog } from 'bilitoolkit-ui'
import { type FavFolderItem } from '@ybgnb/bili-api'
import type { ToolContext } from '@/types/tools'
import { getDataByPageRange } from '@/core/utils/data-range'
import { apiSleep } from '@/core/utils/sleep'
import { Tool } from '@/tools/index'

export class FavAllVideosTool extends Tool {
  title: string = '收藏投稿'
  desc: string = '可一键收藏他人投稿的所有视频。'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const clientId = await biliClientStore.get(userInfo)

    const { value: sourceUidStr } = await ElMessageBox.prompt('请输入用户 uid', '提示', {
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]+$/,
      inputErrorMessage: '无效 uid',
    })
    const sourceUid = Number(sourceUidStr)

    log(`正在获取用户 [${sourceUid}] 的投稿数`)
    const { video: videoCount } = await invokeBiliApi(clientId, biliApi.spaceStatus.getNavNum, sourceUid, { signal })
    log(`投稿数:${videoCount}`)
    if (!videoCount) return

    const pageSize = publicClient.spaceVideo.buildPager({ mid: sourceUid }).getPageSize()

    const pageRange = await showPageRangeDialog({
      pageSize: pageSize,
      total: videoCount,
    })

    if (!pageRange) return

    log(`正在获取自己的收藏夹`)
    const { list: myFolders } = await invokeBiliApi(clientId, biliApi.fav.getFavFolders, undefined, undefined, {
      signal,
    })

    const selectedMyFolders = await showSelectDialog<FavFolderItem>({
      title: '请选择需要保存的收藏夹',
      options: myFolders,
      getDataId: (f) => f.id,
      getDataLabel: (f) => `${f.title}  （${f.media_count}）`,
    })

    if (!selectedMyFolders || selectedMyFolders.length === 0) return

    const targetFolder = selectedMyFolders[0]

    log(`正在获取投稿列表 [${sourceUid}] [${pageRange}]`)
    let list = await getDataByPageRange(
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
          biliApi.spaceVideo.fetchPageWithNextParams,
          {
            mid: sourceUid,
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

    list = list.reverse()

    log(`已获取该用户 ${list.length} 个视频投稿`)

    log(`正在拷贝至收藏夹数据 > [${targetFolder.title}]`)

    for (let i = 0; i < list.length; i++) {
      const { aid, title } = list[i]
      await invokeBiliApi(clientId, biliApi.fav.favVideo, aid, [targetFolder.id], [], { signal })
      log(`[${i + 1}/${list.length}] 成功收藏视频 [${title}]`)
      await apiSleep(signal)
    }

    log('操作完成')
  }
}
