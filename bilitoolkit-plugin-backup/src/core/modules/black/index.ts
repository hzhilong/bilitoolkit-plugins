import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { type PageDataWithNextParams, type Relation } from '@ybgnb/bili-api'
import { DataModule } from '@/core/modules/data-module'

export class BlackModule extends DataModule<Relation> {
  dataType: DataType = 'black'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']

  getPageSize() {
    return publicClient.relation.buildBlocksPager().getPageSize()
  }

  getDataTotalDesc(list: Relation[]): string {
    return `${list.length} 黑名单`
  }

  getDataTitle(data: Relation): string {
    return `黑名单-${data.uname}`
  }

  async fetchPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<Relation>> {
    return await client.relation.fetchBlocksPageWithNextParams(params, { signal })
  }

  async restoreData({ client, signal }: ExecuteContext, relation: Relation): Promise<string> {
    await client.relation.blockUser(relation.mid, { signal })
    return String(relation.mid)
  }

  clearData(context: ExecuteContext, list: Relation[]): Promise<string | void> {
    const { client, signal } = context
    return this.baseClearData(context, list, async (data) => {
      return await client.relation.unBlockUser(data.mid, { signal })
    })
  }
}
