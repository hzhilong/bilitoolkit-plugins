import { DataModule } from '@/core/modules/data-module'
import { type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi } from 'bilitoolkit-runtime/biliapi'
import { sleepRandom } from '@ybgnb/utils'
import { apiSleep } from '@/core/utils/sleep'

export class LikeMsgModule extends DataModule {
  dataType: DataType = 'msg_like'
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

    let delMsgCount = 0
    onProgress?.(0, '正在获取被点赞的通知消息')
    const likeList = await invokeBiliApi(clientId, biliApi.message.fetchLikeAll, undefined, undefined, { signal })
    onProgress?.(0, `已获取 ${likeList.length} 条被点赞的通知消息`)
    for (let i = 0; i < likeList.length; i++) {
      const msg = likeList[i]
      const { title } = msg.item
      const progress = ((i + 1) * 100) / likeList.length

      await invokeBiliApi(clientId, biliApi.message.setLikeMsgState, msg.id, 1, { signal })
      await sleepRandom(200, 300)
      await invokeBiliApi(clientId, biliApi.message.delLikeMessage, msg.id, { signal })
      delMsgCount++
      onProgress?.(progress, `成功删除通知消息 [${title}]`)
      await apiSleep(signal)
    }
    onProgress?.(100, `成功删除 ${delMsgCount} 条${this.dataTypeName}`)
  }
}
