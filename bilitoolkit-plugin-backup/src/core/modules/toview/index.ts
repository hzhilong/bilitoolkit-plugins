import { DataModule } from '@/core/modules/data-module'
import { type ToViewItem, type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { toolkitApi } from 'bilitoolkit-ui'
import { biliApi } from 'bilitoolkit-runtime/biliapi'
import { publicClient } from '@/core/commom/client'

export class ToViewModule extends DataModule<ToViewItem> {
  dataType: DataType = 'to_view'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all']
  exportTargets: ExportTarget[] = ['json']

  getDataTotalDesc(list: ToViewItem[]): string {
    return `${list.length} 条稍后再看`
  }

  getDataTitle(data: ToViewItem): string {
    return data.title
  }

  async fetchTotal(context: ExecuteContext): Promise<number> {
    return (await toolkitApi.bili.invokeBiliApi(context.clientId, biliApi.toview.getTotal)) ?? 0
  }

  getPageSize() {
    return publicClient.toview.buildPager().getPageSize()
  }

  fetchPage(context: ExecuteContext, params: FetchPageParams): Promise<PageDataWithNextParams<ToViewItem>> {
    return toolkitApi.bili.invokeBiliApi(context.clientId, biliApi.toview.fetchPageWithNextParams, params)
  }

  fetchAll(context: ExecuteContext): Promise<ToViewItem[]> {
    return this.baseFetchAll(context)
  }
  restoreData(context: ExecuteContext, data: ToViewItem): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
