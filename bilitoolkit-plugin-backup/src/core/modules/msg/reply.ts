import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExecuteContext } from '@/core/types/execute'
import { apiSleep } from '@/core/utils/sleep'
import { OnlyClearableModule } from '@/core/modules/only-clearable-module'

export class ReplyMsgModule extends OnlyClearableModule {
  dataType: DataType = 'msg_reply'
  dataTypeName: string = DataTypeMap[this.dataType].name

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { client, signal, onProgress } = context
    onProgress?.(0, '正在获取被回复的通知消息')
    const replyList = await client.message.fetchReplyAll(undefined, undefined, { signal })
    onProgress?.(0, `已获取 ${replyList.length} 条被回复的通知消息`)

    let delMsgCount = 0
    for (let i = 0; i < replyList.length; i++) {
      const progress = ((i + 1) * 100) / replyList.length
      const msg = replyList[i]
      const { source_content, title } = msg.item

      await client.message.delReplyMessage(msg.id, { signal })
      delMsgCount++
      onProgress?.(progress, `成功删除通知消息 [${source_content ?? title}]`)
      await apiSleep(signal)
    }

    onProgress?.(100, `成功删除 ${delMsgCount} 条${this.dataTypeName}`)
  }
}
