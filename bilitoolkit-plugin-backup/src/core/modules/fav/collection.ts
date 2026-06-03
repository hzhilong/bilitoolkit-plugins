import { DataModule } from '@/core/modules/data-module'
import type { FavCollection, PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { BackupDataRangeType, ExportTarget } from '@/core/types/backup'
import { publicClient, invokeBiliApi, biliApi } from 'bilitoolkit-runtime/biliapi'
import type { ExecuteContext } from '@/core/types/execute'
import type { FetchPageParams } from '@/core/types/data-module'

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

  async fetchTotal({ clientId, signal }: ExecuteContext): Promise<number> {
    return (
      (await invokeBiliApi(clientId, biliApi.favCollection.fetchPageWithNextParams, undefined, undefined, { signal }))
        .total ?? 0
    )
  }

  async fetchPage(
    { clientId, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FavCollection>> {
    return await invokeBiliApi(clientId, biliApi.favCollection.fetchPageWithNextParams, undefined, params, { signal })
  }

  async restoreData({ clientId, signal }: ExecuteContext, collection: FavCollection): Promise<string> {
    await invokeBiliApi(clientId, biliApi.favCollection.add, collection.id, { signal })
    return String(collection.id)
  }

  clearData(context: ExecuteContext, list: FavCollection[]): Promise<string | void> {
    const { clientId, signal } = context
    return this.baseClearData(context, list, async (collection) => {
      return await invokeBiliApi(clientId, biliApi.favCollection.del, collection.id, { signal })
    })
  }
}
