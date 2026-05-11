import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { BatchProgress } from '@/core/types/batch'
import type { BackupAsset, ExportTarget } from '@/core/types/backup'
import { getBackupFilePath } from '@/core/utils/file'
import { toolkitApi } from 'bilitoolkit-ui'

/**
 * 导出文本文件
 */
export const exportTxtFile = async (
  dataType: DataType,
  rootPath: string,
  target: ExportTarget,
  content: string,
  batchProgress?: BatchProgress,
): Promise<BackupAsset> => {
  const { fileName, filePath } = getBackupFilePath(dataType, rootPath, target, batchProgress)
  await toolkitApi.file.write(filePath, new TextEncoder().encode(content))
  return {
    type: target,
    name: DataTypeMap[dataType],
    fileName: fileName,
    filePath: filePath,
  }
}
