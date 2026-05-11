import { BaseModule } from '@/core/modules/base-module'
import { type ToViewItem, type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { toolkitApi } from 'bilitoolkit-ui'
import { biliApi } from 'bilitoolkit-runtime/biliapi'

export class ToView extends BaseModule<ToViewItem> {
  dataType: DataType = 'to_view'
  dataTypeName: string = DataTypeMap[this.dataType]
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeType: BackupDataRangeType[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']

  fetchPage(context: ExecuteContext, params: FetchPageParams): Promise<PageDataWithNextParams<ToViewItem>> {
    return toolkitApi.bili.invokeBiliApi(context.clientId, biliApi.toview.fetchPageWithNextParams, params)
  }

  async fetchTotal(context: ExecuteContext): Promise<number> {
    return (await toolkitApi.bili.invokeBiliApi(context.clientId, biliApi.toview.getTotal)) ?? 0
  }

  getDataTotalDesc(list: ToViewItem[]): string {
    return `${list.length} 条稍后再看`
  }
}
