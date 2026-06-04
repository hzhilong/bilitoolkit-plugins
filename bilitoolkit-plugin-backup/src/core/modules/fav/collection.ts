import { DataModule } from '@/core/modules/data-module'
import type { FavCollection, PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { BackupDataRangeType, ExportTarget } from '@/core/types/backup'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { ExecuteContext } from '@/core/types/execute'
import type { FetchPageParams } from '@/core/types/data-module'
import { logger } from '@/common/logger'

export class FavCollectionModule extends DataModule<FavCollection> {
  dataType: DataType = 'fav_collected'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']

  getPageSize() {
    return publicClient.favCollection.buildPager().getPageSize()
  }

  getDataTotalDesc(list: FavCollection[]): string {
    return `${list.length} 收藏的视频合集`
  }

  getDataTitle(collection: FavCollection): string {
    return `收藏的视频合集-${collection.title}`
  }

  async fetchTotal({ client, signal }: ExecuteContext): Promise<number> {
    return (await client.favCollection.fetchPageWithNextParams(undefined, undefined, { signal })).total ?? 0
  }

  async fetchPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FavCollection>> {
    return await client.favCollection.fetchPageWithNextParams(undefined, params, { signal })
  }

  async restoreData({ client, signal }: ExecuteContext, collection: FavCollection): Promise<string> {
    await client.favCollection.add(collection.id, { signal })
    return String(collection.id)
  }

  clearData(context: ExecuteContext, list: FavCollection[]): Promise<string | void> {
    const { client, signal } = context
    return this.baseClearData(context, list, async (collection) => {
      return await client.favCollection.del(collection.id, { signal })
    })
  }
}
