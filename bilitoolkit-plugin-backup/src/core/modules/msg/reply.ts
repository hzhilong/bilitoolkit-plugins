import { DataModule } from '@/core/modules/data-module'
import { type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi } from 'bilitoolkit-runtime/biliapi'
import { apiSleep } from '@/core/utils/sleep'

export class ReplyMsgModule extends DataModule {
  dataType: DataType = 'msg_reply'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['clear']
  backupDataRangeTypes: BackupDataRangeType[] = []
  exportTargets: ExportTarget[] = []
  supportsOneClickClear = true

  getDataTotalDesc(): string {
    return ''
  }

  getDataTitle(): string {
    return ''
  }

  getPageSize() {
    return 0
  }

  async fetchPage(): Promise<PageDataWithNextParams> {
    throw new Error('内部错误')
  }

  async restoreData() {
    throw new Error('内部错误')
  }

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { clientId, signal, onProgress } = context
    onProgress?.(0, '正在获取被回复的通知消息')
    const replyList = await invokeBiliApi(clientId, biliApi.message.fetchReplyAll, undefined, undefined, { signal })
    onProgress?.(0, `已获取 ${replyList.length} 条被回复的通知消息`)

    let delMsgCount = 0
    for (let i = 0; i < replyList.length; i++) {
      const progress = ((i + 1) * 100) / replyList.length
      const msg = replyList[i]
      const { source_content, title } = msg.item

      await invokeBiliApi(clientId, biliApi.message.delReplyMessage, msg.id, { signal })
      delMsgCount++
      onProgress?.(progress, `成功删除通知消息 [${source_content ?? title}]`)
      await apiSleep(signal)
    }

    onProgress?.(100, `成功删除 ${delMsgCount} 条${this.dataTypeName}`)
  }
}
