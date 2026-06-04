import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { type PageDataWithNextParams, type Relation } from '@ybgnb/bili-api'
import { DataModule } from '@/core/modules/data-module'

export class FansModule extends DataModule<Relation> {
  dataType: DataType = 'follower'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']

  getPageSize() {
    return publicClient.relation.buildFansPager(1).getPageSize()
  }

  getDataTotalDesc(list: Relation[]): string {
    return `${list.length} 粉丝`
  }

  getDataTitle(data: Relation): string {
    return `粉丝-${data.uname}`
  }

  async fetchTotal({ client, signal, user }: ExecuteContext): Promise<number> {
    return (await client.relation.getStat(user.mid, { signal })).follower
  }

  async fetchPage(
    { client, signal, user }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<Relation>> {
    return await client.relation.fetchFansPageWithNextParams(user.mid, params, { signal })
  }

  async restoreData(): Promise<string> {
    throw new Error('内部错误，粉丝不支持还原')
  }

  clearData(context: ExecuteContext, list: Relation[]): Promise<string | void> {
    const { client, signal } = context
    return this.baseClearData(context, list, async (data) => {
      return await client.relation.removeFan(data.mid, { signal })
    })
  }
}
