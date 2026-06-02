import { DataModule } from '@/core/modules/data-module'
import { type PageDataWithNextParams } from '@ybgnb/bili-api'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi } from 'bilitoolkit-runtime/biliapi'
import { apiSleep } from '@/core/utils/sleep'

export class SysMsgModule extends DataModule {
  dataType: DataType = 'msg_sys'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['clear']
  backupDataRangeTypes: BackupDataRangeType[] = []
  exportTargets: ExportTarget[] = []
  supportsOneClickClear = true

  getDataTotalDesc(): string {
    return ''
  }

  getDataTitle(): string {
    return ''
  }

  getPageSize() {
    return 0
  }

  async fetchPage(): Promise<PageDataWithNextParams> {
    throw new Error('内部错误')
  }

  async restoreData() {
    throw new Error('内部错误')
  }

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { clientId, signal, onProgress } = context
    onProgress?.(0, '正在获取系统通知消息')
    const sysList = await invokeBiliApi(clientId, biliApi.message.fetchSystemAll, undefined, undefined, { signal })
    onProgress?.(0, `已获取 ${sysList.length} 条系统通知消息`)

    let delMsgCount = 0

    for (let i = 0; i < sysList.length; i++) {
      const progress = ((i + 1) * 100) / sysList.length
      const msg = sysList[i]

      await invokeBiliApi(
        clientId,
        biliApi.message.delSysMessages,
        [
          {
            id: msg.id,
            is_station: msg.is_station,
          },
        ],
        { signal },
      )
      delMsgCount++
      onProgress?.(progress, `成功删除系统通知消息 [${msg.title}]`)
      await apiSleep(signal)
    }

    onProgress?.(100, `成功删除 ${delMsgCount} 条${this.dataTypeName}`)
  }
}
