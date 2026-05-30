import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi, publicClient } from 'bilitoolkit-runtime/biliapi'
import { type PageDataWithNextParams, type History, type HistoryItem, BusinessMap } from '@ybgnb/bili-api'
import { DataModule } from '@/core/modules/data-module'

export class HistoryModule extends DataModule<History> {
  dataType: DataType = 'history'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']
  supportsOneClickClear = true

  getPageSize() {
    return publicClient.history.buildPager().getPageSize()
  }

  getDataTotalDesc(list: History[]): string {
    return `${list.length} 历史记录`
  }

  getDataTitle(data: History): string {
    return `历史记录-${data.title}`
  }

  async fetchPage(
    { clientId, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<History>> {
    return await invokeBiliApi(clientId, biliApi.history.fetchPageWithNextParams, undefined, params, { signal })
  }

  async restoreData({ clientId, signal }: ExecuteContext, history: History): Promise<void> {
    if (history.history.business === BusinessMap.archive.type) {
      // 视频
      const item = history.history as HistoryItem<'archive'>
      await invokeBiliApi(
        clientId,
        biliApi.history.report,
        {
          aid: item.oid,
          cid: item.cid!,
          progress: history.progress,
        },
        { signal },
      )
    } else if (history.history.business === BusinessMap.article.type) {
      // 专栏
      const item = history.history as HistoryItem<'article'>
      await invokeBiliApi(
        clientId,
        biliApi.history.report,
        {
          aid: item.oid,
          cid: item.cid!,
          progress: history.progress,
          dt: item.dt,
          type: 5,
        },
        { signal },
      )
    } else if (history.history.business === BusinessMap.pgc.type) {
      // 剧集
      const item = history.history as HistoryItem<'pgc'>
      await invokeBiliApi(
        clientId,
        biliApi.videoReport.heartbeat,
        {},
        {
          aid: item.oid,
          cid: item.cid,
          played_time: history.progress,
        },
        { signal },
      )
    } else if (history.history.business === BusinessMap.live.type) {
      // live
      const item = history.history as HistoryItem<'live'>
      await invokeBiliApi(
        clientId,
        biliApi.api.save,
        'https://api.live.bilibili.com/xlive/web-room/v1/index/roomEntryAction',
        {
          data: {
            room_id: item.oid,
            platform: 'web',
            visit_id: '',
          },
          signal,
        },
      )
    } else {
      throw new Error(`历史记录 [${history.title}] 该类型不支持还原`)
    }
  }
  async clearData({ clientId, signal }: ExecuteContext): Promise<string | void> {
    await invokeBiliApi(clientId, biliApi.history.clearHistory, { signal })
  }
}
