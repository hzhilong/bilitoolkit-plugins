import { DataModule } from '@/core/modules/data-module'
import type { FavOpus, PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { BackupDataRangeType, ExportTarget } from '@/core/types/backup'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { ExecuteContext } from '@/core/types/execute'
import type { FetchPageParams } from '@/core/types/data-module'

export class FavOpusModule extends DataModule<FavOpus> {
  dataType: DataType = 'fav_opus'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']

  getPageSize() {
    return publicClient.favOpus.buildPager().getPageSize()
  }

  getDataTotalDesc(list: FavOpus[]): string {
    return `${list.length} 收藏的专栏`
  }

  getDataTitle(opus: FavOpus): string {
    return `收藏的专栏-${opus.content.slice(0, 30)}`
  }

  getUniqueKey(data: FavOpus): string {
    return String(data.opus_id)
  }

  async fetchTotal({ client, signal, user }: ExecuteContext): Promise<number> {
    return (await client.spaceStatus.getFavNum(user.mid, { signal })).opus ?? 0
  }

  async fetchPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FavOpus>> {
    return await client.favOpus.fetchPageWithNextParams(params, { signal })
  }

  async restoreData({ client, signal }: ExecuteContext, opus: FavOpus): Promise<string> {
    await client.favOpus.addByOpusId(opus.opus_id, { signal })
    return String(opus.opus_id)
  }

  clearData(context: ExecuteContext, list: FavOpus[]): Promise<string | void> {
    const { client, signal } = context
    return this.baseClearData(context, list, async (opus) => {
      return await client.favOpus.del(opus.opus_id, { signal })
    })
  }
}
