import { DataModule } from '@/core/modules/data-module'
import { type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi } from 'bilitoolkit-runtime/biliapi'
import { delComtemtByMsg } from '@/core/utils/comment'
import { getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { apiSleep } from '@/core/utils/sleep'

export class CommentModule extends DataModule {
  dataType: DataType = 'comment'
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
    onProgress?.(0, '正在获取被回复的互动通知')
    const replyList = await invokeBiliApi(clientId, biliApi.message.fetchReplyAll, undefined, undefined, { signal })
    onProgress?.(0, `以获取 ${replyList.length} 条被回复的互动通知`)

    const deletedCache = new Set<string>()

    let delMsgCount = 0
    for (let i = 0; i < replyList.length; i++) {
      const msg = replyList[i]
      const { target_id, title, native_uri } = msg.item
      const progress = ((i + 1) * 100) / replyList.length
      if (!msg.item || !msg.item.business) {
        onProgress?.(progress, `未被支持的消息，跳过：${title}`)
        continue
      }

      try {
        const delResult = await delComtemtByMsg(context, { rpid: String(target_id), native_uri }, deletedCache)
        await sleepRandom(200, 300)
        await invokeBiliApi(clientId, biliApi.message.delReplyMessage, msg.id, { signal })
        delMsgCount++
        onProgress?.(progress, `成功删除关联评论和通知 [${title}]`)
        if (delResult) await apiSleep(signal)
      } catch (e) {
        onProgress?.(progress, `删除关联评论失败  [${title}] ${getErrorMessage(e)}`)
      }
    }

    onProgress?.(0, '正在获取被点赞的互动通知')
    const likeList = await invokeBiliApi(clientId, biliApi.message.fetchLikeAll, undefined, undefined, { signal })
    onProgress?.(0, `以获取 ${likeList.length} 条被点赞的互动通知`)
    for (let i = 0; i < likeList.length; i++) {
      const msg = likeList[i]
      const { item_id, title, native_uri } = msg.item
      const progress = ((i + 1) * 100) / likeList.length
      if (!msg.item || !msg.item.business) {
        onProgress?.(progress, `未关联评论，跳过：${native_uri}`)
        continue
      }

      try {
        const delResult = await delComtemtByMsg(context, { rpid: String(item_id), native_uri }, deletedCache)
        await sleepRandom(200, 300)
        await invokeBiliApi(clientId, biliApi.message.setLikeMsgState, msg.id, 1, { signal })
        await sleepRandom(200, 300)
        await invokeBiliApi(clientId, biliApi.message.delLikeMessage, msg.id, { signal })
        delMsgCount++
        onProgress?.(progress, `成功删除关联评论和通知 [${title}]`)
        if (delResult) await apiSleep(signal)
      } catch (e) {
        onProgress?.(progress, `删除关联评论失败  [${native_uri}] ${getErrorMessage(e)}`)
      }
    }
    onProgress?.(100, `成功删除 ${deletedCache.size} 条关联评论，${delMsgCount} 条消息通知`)
  }
}
