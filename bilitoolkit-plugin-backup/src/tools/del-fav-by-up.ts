import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import { showSelectDialog } from 'bilitoolkit-ui'
import { type FavFolderItem } from '@ybgnb/bili-api'
import type { ToolContext } from '@/types/tools'
import { Tool } from '@/tools/index'
import { inputUid } from '@/utils/tools'
import { chunk, sleepRandom } from '@ybgnb/utils'

export class DelFavByUpTool extends Tool {
  title: string = '删除指定收藏'
  desc: string = '删除收藏夹中指定 up 的视频'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const client = await createBiliClient(userInfo)
    const sourceUid = await inputUid('请输入指定 UP 的 uid')
    log(`正在获取用户 [${sourceUid}] 的投稿数`)

    const { video: videoCount } = await client.spaceStatus.getNavNum(sourceUid, { signal })
    await sleepRandom(1111, 2233)
    log(`投稿数:${videoCount}`)
    if (!videoCount) return

    log(`正在获取自己的收藏夹`)
    const { list: myFolders } = await client.fav.getFavFolders(undefined, undefined, {
      signal,
    })
    await sleepRandom(1111, 2233)

    const selectedMyFolders =
      (await showSelectDialog<FavFolderItem>({
        title: '请选择需要操作的收藏夹',
        options: myFolders,
        getDataId: (f) => f.id,
        getDataLabel: (f) => `${f.title}  （${f.media_count}）`,
        multiple: true,
      })) ?? []

    if (!selectedMyFolders || selectedMyFolders.length === 0) return

    for (const folder of selectedMyFolders) {
      log(`正在获取收藏夹数据 ${folder.title}`)
      const folderData = await client.fav.fetchAll({ media_id: folder.id })
      await sleepRandom(1555, 2333)
      log(`正在处理数据`)
      const delIds = []
      for (const media of folderData.medias) {
        if (media.upper.mid === sourceUid) {
          delIds.push(`${media.id}:${media.type}`)
        }
      }
      log(`已找到 ${delIds.length} 个该 UP 的视频`)
      if (delIds.length > 0) {
        for (const chunkList of chunk(delIds, 20)) {
          log(`正在删除 ${chunkList.length} 个视频`)
          await client.fav.batchDelFavItems(folder.id, chunkList.join(','))
          await sleepRandom(1555, 2333)
        }
      }
    }

    log('操作完成')
  }
}
