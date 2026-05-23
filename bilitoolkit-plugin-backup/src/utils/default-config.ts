import type { ExecuteOptions, TargetUser } from '@/core/types/execute'
import type { OperationType } from '@/core/types/operation'
import { type DataType } from '@/core/types/data-type'
import type { TaskType } from '@/core/types/task'
import type { BackupNormalOptions, BackupBatchOptions } from '@/core/types/backup'
import type { DataRange } from '@/core/types/data-range'
import { getBackupRootPath } from '@/core/utils/file'
import type { RestoreNormalOptions, RestoreBatchOptions } from '@/core/types/restore'
import type { ClearOptions } from '@/core/types/clear'
import { isBatchable } from '@/core/types/batch'
import { registeredModulesMap } from '@/core/modules/register'

export const defaultAllDataRange: DataRange<'all'> = {
  type: 'all',
}

export const defaultPageDataRange: DataRange<'page'> = {
  type: 'page',
  ranges: [1, 1],
}

export const defaultListDataRange: DataRange<'list'> = {
  type: 'list',
  ranges: [],
}

export const defaultTreeDataRange: DataRange<'tree'> = {
  type: 'tree',
  nodes: [],
}

export const getDefaultBackupOptions = (
  user: TargetUser,
  dataType: DataType,
  taskType: TaskType,
  backupPath?: string,
): ExecuteOptions<'backup'> => {
  const module = registeredModulesMap[dataType]
  if (taskType === 'normal') {
    return {
      operationType: 'backup',
      mode: 'normal',
      dataRange: defaultAllDataRange,
      rootPath: backupPath ?? getBackupRootPath(user),
      exportTargets: ['json'],
    } satisfies BackupNormalOptions
  }
  if (taskType === 'batch') {
    if (!isBatchable(module)) {
      throw new Error(`内部错误，[${module.dataTypeName}]不支持分批处理`)
    }
    return {
      operationType: 'backup',
      mode: 'batch',
      batchOptions: {
        batchSize: module.batchSizes[0],
        startBatch: 1,
        pageParams: {},
        pageNum: 1,
      },
      rootPath: backupPath ?? getBackupRootPath(user),
      exportTargets: ['json'],
    } satisfies BackupBatchOptions
  }
  throw new Error(`内部错误，存在未被支持的任务模式[${taskType}]`)
}

export const getDefaultRestoreOptions = (
  _user: TargetUser,
  dataType: DataType,
  taskType: TaskType,
): ExecuteOptions<'restore'> => {
  const module = registeredModulesMap[dataType]
  if (taskType === 'normal') {
    return {
      operationType: 'restore',
      mode: 'normal',
      dataRange: defaultAllDataRange,
      backupAssets: [],
    } satisfies RestoreNormalOptions
  }
  if (taskType === 'batch') {
    if (!isBatchable(module)) {
      throw new Error(`内部错误，[${module.dataTypeName}]不支持分批处理`)
    }
    return {
      operationType: 'restore',
      mode: 'batch',
      batchOptions: {
        batchSize: module.batchSizes[0],
        startBatch: 1,
        pageParams: {},
        pageNum: 1,
      },
      backupAssets: [],
    } satisfies RestoreBatchOptions
  }
  throw new Error(`内部错误，存在未被支持的任务模式[${taskType}]`)
}

export const getDefaultClearOptions = (
  user: TargetUser,
  dataType: DataType,
  taskType: TaskType,
): ExecuteOptions<'clear'> => {
  if (taskType === 'normal') {
    return {
      operationType: 'clear',
      mode: 'normal',
      dataRange: defaultAllDataRange,
    } satisfies ClearOptions
  }
  if (taskType === 'batch') {
    throw new Error(`内部错误，清空操作不支持分批处理`)
  }
  throw new Error(`内部错误，存在未被支持的任务模式[${taskType}]`)
}

export const getDefaultExecuteOptions = <O extends OperationType = OperationType, T extends TaskType = TaskType>(
  user: TargetUser,
  operationType: O,
  dataType: DataType,
  taskType: T,
  backupPath?: string,
): ExecuteOptions<O> => {
  switch (operationType) {
    case 'backup':
      return getDefaultBackupOptions(user, dataType, taskType, backupPath) as ExecuteOptions<O>
    case 'restore':
      return getDefaultRestoreOptions(user, dataType, taskType) as ExecuteOptions<O>
    case 'clear':
      return getDefaultClearOptions(user, dataType, taskType) as ExecuteOptions<O>
  }
}
