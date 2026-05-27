import { DataModule } from '@/core/modules/data-module'
import { type ToViewItem, type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi, publicClient } from 'bilitoolkit-runtime/biliapi'

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

  async fetchTotal({ clientId, signal }: ExecuteContext): Promise<number> {
    return (await invokeBiliApi(clientId, biliApi.toview.getTotal, { signal })) ?? 0
  }

  getPageSize() {
    return publicClient.toview.buildPager().getPageSize()
  }

  async fetchPage(
    { clientId, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<ToViewItem>> {
    return await invokeBiliApi(clientId, biliApi.toview.fetchPageWithNextParams, params, { signal })
  }

  fetchAll(context: ExecuteContext): Promise<ToViewItem[]> {
    return this.baseFetchAll(context)
  }

  restoreData(_context: ExecuteContext, _data: ToViewItem): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
