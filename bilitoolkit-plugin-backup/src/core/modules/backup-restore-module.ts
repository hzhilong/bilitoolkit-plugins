import type { OperationType } from '@/core/types/operation'
import { DataModule } from '@/core/modules/data-module'
import type { Data } from '@/core/types/data-module'

export abstract class BackupRestoreModule<D extends Data = Data> extends DataModule<D> {
  operations: OperationType[] = ['backup', 'restore']

  async clearData(): Promise<string | void> {}
}
