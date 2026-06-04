import { DataModule } from '@/core/modules/data-module'
import { type ToViewItem, type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'

export class ToViewModule extends DataModule<ToViewItem> {
  dataType: DataType = 'to_view'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all']
  exportTargets: ExportTarget[] = ['json']
  supportsOneClickClear = true

  getDataTotalDesc(list: ToViewItem[]): string {
    return `${list.length} 条稍后再看`
  }

  getDataTitle(data: ToViewItem): string {
    return data.title
  }

  async fetchTotal({ client, signal }: ExecuteContext): Promise<number> {
    return (await client.toview.getTotal({ signal })) ?? 0
  }

  getPageSize() {
    return publicClient.toview.buildPager().getPageSize()
  }

  async fetchPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
  ): Promise<PageDataWithNextParams<ToViewItem>> {
    return await client.toview.fetchPageWithNextParams(params, { signal })
  }

  async restoreData({ client, signal }: ExecuteContext, { aid }: ToViewItem) {
    await client.toview.addToView(aid, { signal })
  }

  async clearData({ client, signal }: ExecuteContext, _list: ToViewItem[]): Promise<string | void> {
    await client.toview.clearToView(0, { signal })
  }
}
