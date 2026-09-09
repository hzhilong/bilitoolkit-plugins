import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExecuteContext } from '@/core/types/execute'
import { OnlyClearableModule } from '@/core/modules/only-clearable-module'
import { sleepRandom, getErrorMessage, createAbortError } from '@ybgnb/utils'

export class LikeVideoModule extends OnlyClearableModule {
  dataType: DataType = 'like_video'
  dataTypeName: string = DataTypeMap[this.dataType].name

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { client, onProgress, user, signal } = context

    const getLikeVideos = async () => {
      return client.api.get('https://api.bilibili.com/x/space/like/video', {
        query: {
          vmid: user.mid,
        },
        signal,
      })
    }

    while (true) {
      onProgress?.(undefined, `正在获取最近点赞的视频`)
      const likeVideos = (await getLikeVideos())?.list ?? []
      await sleepRandom(1222, 2233)
      onProgress?.(undefined, `已获取 ${likeVideos.length} 个点赞的视频`)

      if (!likeVideos || likeVideos.length === 0) {
        break
      }

      for (let i = 0; i < likeVideos.length; i++) {
        const video = likeVideos[i]
        try {
          await client.videoAction.like(
            {
              aid: video.aid,
              like: false,
            },
            { signal },
          )
          onProgress?.((i * 100) / likeVideos.length, `已取消点赞：${video.title}`)
        } catch (e) {
          const msg = getErrorMessage(e)
          if (!msg.includes('黑名单')) {
            throw e
          }
          onProgress?.((i * 100) / likeVideos.length, `${msg}`)
        }
        if (signal?.aborted) throw createAbortError()
        await sleepRandom(1222, 2233)
      }
    }
  }
}
