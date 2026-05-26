import type { BatchProgress } from '@/core/types/batch'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { getFormattedDateTime } from '@ybgnb/utils'
import { type ExportTarget, TargetExtension, type BackupAsset } from '@/core/types/backup'
import { toolkitApi } from 'bilitoolkit-ui'
import type { User } from '@/core/types/execute'

/**
 * 获取备份文件根目录路径
 */
export const getBackupRootPath = (user: User) => {
  return `backup/${user.mid}/${getFormattedDateTime().replace(/:/g, '-')}/`
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

export const joinPath = (...path: string[]) => {
  return [...path].join('/').replace(/\/+/g, '/')
}

export const readJsonFile = async <D>(asset: BackupAsset<'json'>) => {
  const fileContent = await toolkitApi.file.read(asset.filePath)
  return JSON.parse(new TextDecoder('utf-8').decode(fileContent)) as D
}
