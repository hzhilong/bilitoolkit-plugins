import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExecuteContext } from '@/core/types/execute'
import { sleepRandom } from '@ybgnb/utils'
import { apiSleep } from '@/core/utils/sleep'
import { OnlyClearableModule } from '@/core/modules/only-clearable-module'

export class LikeMsgModule extends OnlyClearableModule {
  dataType: DataType = 'msg_like'
  dataTypeName: string = DataTypeMap[this.dataType].name

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { client, signal, onProgress } = context

    let delMsgCount = 0
    onProgress?.(0, '正在获取被点赞的通知消息')
    const likeList = await client.message.fetchLikeAll(undefined, undefined, { signal })
    onProgress?.(0, `已获取 ${likeList.length} 条被点赞的通知消息`)
    for (let i = 0; i < likeList.length; i++) {
      const msg = likeList[i]
      const { title } = msg.item
      const progress = ((i + 1) * 100) / likeList.length

      await client.message.setLikeMsgState(msg.id, 1, { signal })
      await sleepRandom(200, 300)
      await client.message.delLikeMessage(msg.id, { signal })
      delMsgCount++
      onProgress?.(progress, `成功删除通知消息 [${title}]`)
      await apiSleep(signal)
    }
    onProgress?.(100, `成功删除 ${delMsgCount} 条${this.dataTypeName}`)
  }
}
