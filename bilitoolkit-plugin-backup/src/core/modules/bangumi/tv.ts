import { DataModule } from '@/core/modules/data-module'
import { type FollowBangumi, type PageDataWithNextParams, FollowBangumiTypeMap } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi, publicClient } from 'bilitoolkit-runtime/biliapi'

export class FollowedTvModule extends DataModule<FollowBangumi> {
  dataType: DataType = 'bangumi_tv'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all']
  exportTargets: ExportTarget[] = ['json']

  getDataTotalDesc(list: FollowBangumi[]): string {
    return `${list.length} 条追剧记录`
  }

  getDataTitle(data: FollowBangumi): string {
    return data.title
  }

  getPageSize() {
    return publicClient.followBangumi.buildPager(1, FollowBangumiTypeMap.tv.type).getPageSize()
  }

  async fetchPage(
    { clientId, signal, user }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FollowBangumi>> {
    return await invokeBiliApi(
      clientId,
      biliApi.followBangumi.fetchPageWithNextParams,
      user.mid,
      FollowBangumiTypeMap.tv.type,
      undefined,
      params,
      { signal },
    )
  }

  async restoreData({ clientId, signal }: ExecuteContext, { season_id }: FollowBangumi) {
    await invokeBiliApi(clientId, biliApi.followBangumi.add, season_id, { signal })
  }

  clearData(context: ExecuteContext, list: FollowBangumi[]): Promise<string | void> {
    const { clientId, signal } = context
    return this.baseClearData(context, list, async (data) => {
      return await invokeBiliApi(clientId, biliApi.followBangumi.del, data.season_id, { signal })
    })
  }
}
