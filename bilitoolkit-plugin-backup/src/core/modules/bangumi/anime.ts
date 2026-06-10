import { DataModule } from '@/core/modules/data-module'
import { type FollowBangumi, type PageDataWithNextParams, FollowBangumiTypeMap } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'

export class FollowedAnimeModule extends DataModule<FollowBangumi> {
  dataType: DataType = 'bangumi_anime'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all']
  exportTargets: ExportTarget[] = ['json']

  getDataTotalDesc(list: FollowBangumi[]): string {
    return `${list.length} 条追番记录`
  }

  getDataTitle(data: FollowBangumi): string {
    return data.title
  }

  getUniqueKey(data: FollowBangumi): string {
    return String(data.season_id)
  }

  getPageSize() {
    return publicClient.followBangumi.buildPager(1, FollowBangumiTypeMap.anime.type).getPageSize()
  }

  async fetchPage(
    { client, signal, user }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FollowBangumi>> {
    return await client.followBangumi.fetchPageWithNextParams(
      user.mid,
      FollowBangumiTypeMap.anime.type,
      undefined,
      params,
      { signal },
    )
  }

  async restoreData({ client, signal }: ExecuteContext, { season_id }: FollowBangumi) {
    await client.followBangumi.add(season_id, { signal })
  }

  clearData(context: ExecuteContext, list: FollowBangumi[]): Promise<string | void> {
    const { client, signal } = context
    return this.baseClearData(context, list, async (data) => {
      return await client.followBangumi.del(data.season_id, { signal })
    })
  }
}
