import type { TargetUser } from '@/core/types/execute'
import type { BatchProgress } from '@/core/types/batch'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { getFormattedDateTime } from '@ybgnb/utils'
import { type ExportTarget, TargetExtension, type BackupAsset } from '@/core/types/backup'

/**
 * 获取备份文件根目录路径
 */
export const getBackupRootPath = (user: TargetUser) => {
  return `backup/${user.uid}/${getFormattedDateTime().replace(/:/g, '-')}/`
}

/**
 * 获取备份的文件名称和路径
 */
export const getBackupFilePath = (
  dataType: DataType,
  rootPath: string,
  target: ExportTarget,
  batchProgress?: BatchProgress,
): Pick<BackupAsset, 'fileName' | 'filePath'> => {
  const batchSuffix = batchProgress ? `-${batchProgress.nextBatch - 1}` : ''
  const fileName = `${DataTypeMap[dataType].name}${batchSuffix}${TargetExtension[target]}`
  const filePath = `${rootPath}${fileName}`
  return { fileName, filePath }
}
